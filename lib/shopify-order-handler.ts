import { prisma } from '@/lib/prisma'
import { log } from '@/lib/logger'
import { DocumentKind } from '@/lib/document-types'
import { deepRepairUTF8 } from '@/lib/utf8-fixer';
import {
    deriveCustomerEmail,
    deriveCustomerName,
    deriveCustomerPhone,
    isGuestCheckout as checkIsGuest
} from './customer-mapping'

// Helper for search normalization
function normalizeForSearch(text: string): string {
    if (!text) return '';
    const repairedText = deepRepairUTF8(text);
    return repairedText
        .toLowerCase()
        .replace(/[ _|]/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
}

// Helper to map Prisma Invoice to InvoiceData (compatible with PDF generator)
export function mapPrismaInvoiceToData(invoice: any) {
    return {
        id: invoice.id,
        number: invoice.invoiceNumber,
        date: invoice.issueDate.toISOString(),
        dueDate: invoice.dueDate.toISOString(),
        subtotal: Number(invoice.totalNet),
        taxRate: 19, // Default
        taxAmount: Number(invoice.totalTax),
        total: Number(invoice.totalGross),
        status: invoice.status,
        document_kind: DocumentKind.INVOICE,
        reference_number: invoice.order?.orderNumber,
        customer: {
            name: invoice.customerName || invoice.customer?.name || 'Gast',
            email: invoice.customerEmail || invoice.customer?.email || '',
            address: invoice.customer?.address || '',
            city: invoice.customer?.city || '',
            zipCode: invoice.customer?.zipCode || '',
            country: invoice.customer?.country || 'DE'
        },
        organization: {
            name: invoice.organization.name,
            address: invoice.organization.address,
            zipCode: invoice.organization.zipCode,
            city: invoice.organization.city,
            country: invoice.organization.country,
            taxId: invoice.organization.taxId,
            bankName: invoice.organization.bankName,
            iban: invoice.organization.iban,
            bic: invoice.organization.bic
        },
        items: invoice.items.map((item: any) => ({
            description: item.description,
            ean: item.ean,
            quantity: Number(item.quantity),
            unitPrice: Number(item.unitPrice),
            total: Number(item.grossAmount)
        }))
    }
}

export async function handleOrderCreate(order: any, shopDomain: string | null, shouldSendEmail: boolean = false) {
    log(`🔄 Handling order ${order.name} (Shop: ${shopDomain || 'Manual Sync'})`)

    // 1. Find Organization
    let organization = null
    if (shopDomain) {
        const connection = await prisma.shopifyConnection.findFirst({
            where: { shopName: { contains: shopDomain, mode: 'insensitive' } },
            include: { organization: true }
        })
        organization = connection?.organization
    }

    if (!organization) {
        // Fallback to ShopifyConnection with domain matching
        const anyConnection = await prisma.shopifyConnection.findFirst({
            include: { organization: true }
        })
        organization = anyConnection?.organization
    }

    if (!organization) {
        organization = await prisma.organization.findFirst()
    }

    if (!organization) {
        throw new Error('Keine Organisation im System gefunden. Bitte erst einrichten.')
    }

    // 2. Customer Data
    const customerEmail = deriveCustomerEmail(order) || ''
    const { name: customerName, trace: customerTrace } = deriveCustomerName(order)
    const customerPhone = deriveCustomerPhone(order)
    const guestStatus = checkIsGuest(order)
    const shopifyCustomerId = order.customer?.id ? String(order.customer.id) : null

    log(`👤 Derived Customer: "${customerName}" <${customerEmail}> [Trace: ${customerTrace}]`)

    const getAddressField = (field: string) => {
        if (order.billing_address?.[field]) return order.billing_address[field];
        if (order.shipping_address?.[field]) return order.shipping_address[field];
        if (order.customer?.default_address?.[field]) return order.customer.default_address[field];
        return null;
    }

    const customerData: any = {
        organizationId: organization.id,
        shopifyCustomerId: shopifyCustomerId
    }

    if (customerName && customerName !== 'Gast') customerData.name = customerName;
    if (customerEmail) customerData.email = customerEmail;

    const address = getAddressField('address1');
    const city = getAddressField('city');
    const zipCode = getAddressField('zip');
    const country = (order.billing_address?.country_code || order.shipping_address?.country_code)?.toUpperCase();

    if (address) customerData.address = address;
    if (city) customerData.city = city;
    if (zipCode) customerData.zipCode = zipCode;
    if (country) customerData.country = country;

    // Upsert customer
    let customer = await prisma.customer.findFirst({
        where: {
            organizationId: organization.id,
            OR: [
                shopifyCustomerId ? { shopifyCustomerId } : null,
                customerEmail ? { email: customerEmail } : null
            ].filter(Boolean) as any
        }
    })

    if (!customer) {
        // If we don't have this customer, try to find ANY other customer with this email 
        // who might have a real name instead of 'Gast'
        if ((!customerData.name || customerData.name === 'Gast') && customerEmail) {
            const olderCustomer = await prisma.customer.findFirst({
                where: { email: customerEmail, name: { notIn: ['Gast', '', 'Unknown'] } }
            })
            if (olderCustomer) {
                log(`🕵️ Found older name "${olderCustomer.name}" for this email. Using it instead of "Gast".`)
                customerData.name = olderCustomer.name
            }
        }

        // Ensure defaults if still missing
        if (!customerData.name) customerData.name = customerName || 'Gast';
        if (!customerData.email) customerData.email = customerEmail || '';

        customer = await prisma.customer.create({ data: customerData })
    } else {
        // Remove organizationId for updates
        const { organizationId, ...updateData } = customerData;

        // Final protection: Ensure we don't nullify fields that are already in DB
        const cleanUpdateData: any = {}
        for (const [key, value] of Object.entries(updateData)) {
            if (value !== null && value !== undefined && value !== '') {
                // Special case for name: don't overwrite real name with 'Gast'
                if (key === 'name' && value === 'Gast' && customer.name && customer.name !== 'Gast') {
                    continue;
                }
                cleanUpdateData[key] = value
            }
        }

        customer = await prisma.customer.update({
            where: { id: customer.id },
            data: cleanUpdateData
        })
    }

    // FINAL PROTECTED NAME
    const finalCustomerName = (customer.name && customer.name !== 'Gast') ? customer.name : customerName;

    // 3. Find/Create Order
    const financialStatus = order.financial_status?.toLowerCase() || 'pending';

    const orderData: any = {
        organizationId: organization.id,
        customerId: customer.id,
        orderNumber: order.name,
        orderDate: new Date(order.created_at),
        totalAmount: parseFloat(order.total_price),
        currency: order.currency || 'EUR',
        status: (financialStatus === 'paid' ? 'COMPLETED' :
            (financialStatus === 'voided' || financialStatus === 'refunded' || financialStatus === 'cancelled') ? 'CANCELLED' : 'PENDING') as any,
        shopifyOrderId: String(order.id),
        customerName,
        // normalizedCustomerName: normalizeForSearch(customerName), // REMOVED FOR SCHEMA COMPATIBILITY
        customerEmail,
        customerPhone,
        isGuestCheckout: guestStatus,
        shopifyCustomerId: shopifyCustomerId,
        updatedFromShopifyAt: new Date()
    }

    let dbOrder = await prisma.order.findFirst({
        where: { organizationId: organization.id, shopifyOrderId: orderData.shopifyOrderId }
    })

    if (!dbOrder) {
        dbOrder = await prisma.order.create({ data: orderData })
    } else {
        // Remove organizationId for updates to avoid Prisma errors on some versions
        const { organizationId, ...updateData } = orderData;
        dbOrder = await prisma.order.update({
            where: { id: dbOrder.id },
            data: updateData
        })
    }

    // 4. Payment Method detection
    let paymentGateway = (order.gateway || (order.payment_gateway_names && order.payment_gateway_names[0]) || 'unknown').toLowerCase();
    let paymentMethod = 'Vorkasse'

    if (paymentGateway.includes('shopify') || paymentGateway.includes('stripe')) paymentMethod = 'Shopify Payments'
    else if (paymentGateway.includes('paypal')) paymentMethod = 'PayPal'
    else if (paymentGateway.includes('klarna')) paymentMethod = 'Klarna'
    else if (paymentGateway.includes('sofort')) paymentMethod = 'Sofort'
    else if (paymentGateway.includes('rechnung') || paymentGateway.includes('invoice')) paymentMethod = 'Rechnung'
    else if (paymentGateway.includes('vorkasse') || paymentGateway.includes('manual') || paymentGateway.includes('bank')) paymentMethod = 'Vorkasse'

    log(`💰 Payment Method: ${paymentMethod} (from ${paymentGateway})`)

    // 5. Create/Update Invoice
    const existingInvoice = await prisma.invoice.findFirst({
        where: {
            organizationId: organization.id,
            OR: [
                { orderId: dbOrder.id },
                { invoiceNumber: order.name }
            ]
        },
        include: { items: true, customer: true, organization: true }
    })

    const isNew = !existingInvoice;
    let previousStatus = existingInvoice?.status;
    let newInvoice: any = existingInvoice;

    // Calculate status
    const calculateStatus = async () => {
        const { isUserBlocked } = await import('@/lib/blocklist')
        const blockCheck = await isUserBlocked(customerEmail, organization!.id)
        if (blockCheck.blocked) return 'BLOCKED'
        if (financialStatus === 'paid') return 'PAID'
        if (financialStatus === 'voided' || financialStatus === 'refunded' || financialStatus === 'cancelled') return 'CANCELLED'
        return 'SENT'
    }

    const targetStatus = await calculateStatus()

    const finalCustomerEmail = customer.email || customerEmail || '';

    const invoiceData: any = {
        status: targetStatus as any,
        customerId: customer.id, // Ensure link is kept/updated
        customerName: finalCustomerName, // Use the protected name, not "Gast"
        customerEmail: finalCustomerEmail, // Use the protected email
        customerPhone: customer.phone || customerPhone,
        isGuestCheckout: guestStatus,
        shopifyCustomerId,
        shopifyOrderId: String(order.id),
        shopifyOrderNumber: order.name,
        orderNumber: order.name,
        financialStatus: financialStatus,
        paymentMethod,
        settings: { ...((existingInvoice?.settings as any) || {}), paymentMethod },
        updatedFromShopifyAt: new Date()
    }

    if (existingInvoice) {
        log(`ℹ️ Updating existing invoice ${existingInvoice.invoiceNumber}`)
        newInvoice = await prisma.invoice.update({
            where: { id: existingInvoice.id },
            data: invoiceData,
            include: { customer: true, organization: true, items: true, order: true }
        })
    } else {
        log(`🔨 Creating NEW invoice for ${order.name}`)

        // Find default template
        const template = await prisma.invoiceTemplate.findFirst({
            where: { organizationId: organization.id, isDefault: true }
        }) || await prisma.invoiceTemplate.findFirst({
            where: { organizationId: organization.id }
        })

        if (!template) {
            throw new Error(`Kein Rechnungs-Template für Organisation ${organization.name} gefunden.`)
        }

        // Find default tax rate
        const taxRate = await prisma.taxRate.findFirst({
            where: { organizationId: organization.id, isDefault: true }
        }) || await prisma.taxRate.findFirst({
            where: { organizationId: organization.id }
        })

        if (!taxRate) {
            throw new Error(`Kein Steuersatz für Organisation ${organization.name} gefunden.`)
        }

        // Items processing
        const itemsToCreate = await Promise.all(order.line_items.map(async (item: any) => {
            const q = parseFloat(item.quantity)
            const p = parseFloat(item.price)
            const tot = p * q
            const net = tot / 1.19

            const cleanTitle = deepRepairUTF8(item.title);
            return {
                description: cleanTitle,
                // normalizedDescription: normalizeForSearch(cleanTitle), // Removed for safety
                ean: item.sku || '',
                quantity: q,
                unitPrice: net / q,
                grossAmount: tot,
                netAmount: net,
                taxAmount: tot - net,
                taxRateId: taxRate.id,
                shopifyProductId: item.product_id ? String(item.product_id) : null,
                shopifyVariantId: item.variant_id ? String(item.variant_id) : null
            }
        }))

        if (order.shipping_lines) {
            order.shipping_lines.forEach((s: any) => {
                const p = parseFloat(s.price)
                if (p > 0) {
                    const net = p / 1.19
                    itemsToCreate.push({
                        description: `Versand: ${s.title}`,
                        ean: '',
                        quantity: 1,
                        unitPrice: net,
                        grossAmount: p,
                        netAmount: net,
                        taxAmount: p - net,
                        taxRateId: taxRate.id
                    })
                }
            })
        }

        const totalGross = itemsToCreate.reduce((sum: number, i: any) => sum + i.grossAmount, 0)
        const totalNet = itemsToCreate.reduce((sum: number, i: any) => sum + i.netAmount, 0)
        const totalTax = itemsToCreate.reduce((sum: number, i: any) => sum + i.taxAmount, 0)

        newInvoice = await prisma.invoice.create({
            data: {
                ...invoiceData,
                organizationId: organization.id,
                customerId: customer.id,
                orderId: dbOrder.id,
                templateId: template.id,
                invoiceNumber: order.name,
                issueDate: new Date(order.created_at),
                serviceDate: new Date(order.created_at),
                dueDate: new Date(new Date(order.created_at).getTime() + 14 * 24 * 60 * 60 * 1000),
                totalNet,
                totalGross,
                totalTax,
                currency: order.currency || 'EUR',
                items: {
                    create: itemsToCreate.map((i: any) => ({
                        description: i.description,
                        ean: i.ean,
                        quantity: i.quantity,
                        unitPrice: i.unitPrice,
                        grossAmount: i.grossAmount,
                        netAmount: i.netAmount,
                        taxAmount: i.taxAmount,
                        taxRateId: i.taxRateId, // MANDATORY
                        shopifyProductId: i.shopifyProductId,
                        shopifyVariantId: i.shopifyVariantId
                    }))
                }
            },
            include: { customer: true, organization: true, items: true, order: true }
        })
    }

    // 7. Delivery logic
    const isNowPaid = newInvoice.status === 'PAID'
    const wasAlreadyPaid = previousStatus === 'PAID'

    // Invoice Email Condition - ENHANCED
    // Send invoice email if:
    // 1. New order AND paid (Shopify Payments, PayPal, etc.)
    // 2. New order AND Vorkasse/Rechnung (even if not paid yet)
    // 3. Order transitioned from unpaid to paid
    const isVorkasseOrRechnung = paymentMethod === 'Vorkasse' || paymentMethod === 'Rechnung';
    const transitionToPaid = isNowPaid && !wasAlreadyPaid;

    const shouldSendInvoiceNow = shouldSendEmail && (
        (isNew && isNowPaid) ||                    // New paid order
        (isNew && isVorkasseOrRechnung) ||         // New Vorkasse/Rechnung order
        transitionToPaid                            // Status changed to paid
    );

    // Digital Keys Condition - ENHANCED FOR MANUAL SYNC
    // 1. Send if status just changed to PAID (usual flow)
    // 2. Send if NEW order AND payment method is 'Rechnung'
    // 3. SPECIAL: Send if order IS PAID AND NO KEYS are assigned yet (fixes failed deliveries on sync)
    const isNewRechnung = isNew && paymentMethod === 'Rechnung';

    // Check if keys are already delivered to avoid double sending
    const assignedKeysCountCheck = await prisma.licenseKey.count({
        where: { shopifyOrderId: String(order.id) }
    });

    let shouldSendKeysNow = shouldSendEmail && (
        transitionToPaid ||
        isNewRechnung ||
        (isNowPaid && assignedKeysCountCheck === 0)
    );

    log(`🏳️ Delivery Status: shouldSendEmail=${shouldSendEmail}, shouldSendInvoice=${shouldSendInvoiceNow}, shouldSendKeys=${shouldSendKeysNow}`)
    log(`   Payment Method: ${paymentMethod}, isNew: ${isNew}, isNowPaid: ${isNowPaid}, transitionToPaid: ${transitionToPaid}, isNewRechnung: ${isNewRechnung}`)

    if (shouldSendInvoiceNow) {
        // Determine if this is a pre-payment invoice (Vorkasse/Rechnung before payment)
        // This will show DEMO watermark and payment instructions on the invoice
        const isPrePaymentInvoice = isVorkasseOrRechnung && !isNowPaid;

        log(`📧 SENDING INVOICE for ${order.name} to ${finalCustomerEmail}${isPrePaymentInvoice ? ' (PRE-PAYMENT DEMO)' : ''}`)
        try {
            const { sendInvoiceEmail } = await import('@/lib/email-service')
            await sendInvoiceEmail(
                newInvoice.id,
                finalCustomerEmail,
                finalCustomerName,
                newInvoice.invoiceNumber,
                organization.name,
                undefined, // customSubject
                undefined, // customMessage
                undefined, // invoiceAmount
                undefined, // dueDate
                isPrePaymentInvoice // Pass true for Vorkasse/Rechnung before payment
            )
            log(`✅ Invoice email sent.`)
        } catch (err) { log(`❌ Invoice email failed: ${err}`, 'error') }
    }

    if (shouldSendKeysNow) {
        log(`🔑 CHECKING DIGITAL KEYS for ${order.name}`)

        // Prevent duplicate keys
        const assignedKeysCount = await prisma.licenseKey.count({
            where: { shopifyOrderId: String(order.id) }
        });

        if (assignedKeysCount > 0) {
            log(`ℹ️ Digital keys already assigned for order ${order.name}. Skipping.`)
        } else {
            log(`🎯 TRIGGERING DIGITAL DELIVERY for ${order.name}`)
            let deliveryAnySuccess = false
            try {
                const { processDigitalProductOrder } = await import('@/lib/digital-products')
                for (const item of order.line_items || []) {
                    log(`🔍 Processing item: ${item.title} (ID: ${item.product_id})`)
                    const result = await processDigitalProductOrder(
                        String(item.product_id), String(order.id), order.name,
                        finalCustomerEmail, finalCustomerName, item.title, String(item.variant_id),
                        undefined, true, customer.id
                    )
                    if (result.success) {
                        log(`✅ Digital key processed for ${item.title}`)
                        deliveryAnySuccess = true
                    } else {
                        log(`⚠️ Digital key NOT processed: ${result.error}`, 'warn')
                    }
                }
                log(`✅ Digital delivery process completed.`)
            } catch (err) { log(`❌ Digital delivery failed: ${err}`, 'error') }

            // Auto-fulfillment in Shopify 
            // We only do this if at least one key was successfully processed
            if (deliveryAnySuccess) {
                try {
                    const { ShopifyAPI } = await import('@/lib/shopify-api')
                    const api = new ShopifyAPI()
                    const fulfillmentResult = await api.createFulfillment(Number(order.id))
                    if (fulfillmentResult.success || (fulfillmentResult.fulfillment)) {
                        log(`📦 Shopify order ${order.name} marked as fulfilled.`)
                    } else {
                        log(`⚠️ Shopify fulfillment message: ${fulfillmentResult.error || 'Check Shopify admin'}`, 'warn')
                    }
                } catch (err) {
                    log(`❌ Shopify fulfillment critical failure: ${err}`, 'error')
                }
            } else {
                log(`⚠️ Skipping Shopify fulfillment because no key delivery was reported as successful.`)
            }
        }
    }

    return { ...mapPrismaInvoiceToData(newInvoice), isNew: isNew, customerTrace: customerTrace }
}

export async function handleOrderUpdate(order: any, shopDomain: string | null) {
    log(`🔄 Handling order UPDATE ${order.name} (Shop: ${shopDomain || 'Manual Sync'})`)
    // Simply proxy to handleOrderCreate which handles upserts and transitions
    return handleOrderCreate(order, shopDomain, true)
}
