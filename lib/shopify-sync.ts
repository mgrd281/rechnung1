
import { prisma } from './prisma'
import { ShopifyAPI } from './shopify-api'

export async function syncShopifyOrder(shopifyOrderId: string | number, organizationId: string) {
    try {
        const api = new ShopifyAPI()
        // Fetch fresh data from Shopify
        const order = await api.getOrder(Number(shopifyOrderId))
        if (!order) {
            console.error(`[Sync] Order ${shopifyOrderId} not found in Shopify`)
            return null
        }

        // Fetch transactions for detailed payment info
        const transactions = await api.getTransactions(Number(shopifyOrderId))

        // Calculate payment method label
        const paymentMethodLabel = derivePaymentMethodLabel(order, transactions)

        // Calculate amounts in cents
        const totalPriceCents = Math.round(parseFloat(order.total_price || '0') * 100)

        // Calculate total refunded from refunds array
        const totalRefundedAmt = (order as any).refunds?.reduce((acc: number, r: any) => {
            const refundTotal = r.transactions?.reduce((tAcc: number, t: any) => tAcc + parseFloat(t.amount || '0'), 0) || 0
            return acc + refundTotal
        }, 0) || 0;

        const totalRefundedCents = Math.round(totalRefundedAmt * 100)
        const totalPaidCents = totalPriceCents - totalRefundedCents

        const { deriveCustomerEmail, deriveCustomerName, deriveCustomerPhone, isGuestCheckout: checkIsGuest } = require('./customer-mapping')

        const customerEmail = deriveCustomerEmail(order)
        const customerName = deriveCustomerName(order)
        const customerPhone = deriveCustomerPhone(order)
        const guestStatus = checkIsGuest(order)
        const shopifyCustomerId = order.customer?.id ? String(order.customer.id) : null

        const updateData = {
            financialStatus: order.financial_status,
            totalPriceCents,
            totalPaidCents,
            totalRefundedCents,
            paymentMethodLabel,
            updatedFromShopifyAt: new Date(),
            paidAt: order.financial_status === 'paid' ? new Date() : null,
            customerName,
            customerEmail,
            customerPhone,
            isGuestCheckout: guestStatus,
            shopifyCustomerId,
        }

        // 1. Update Order Snapshot (if exists)
        const localOrder = await prisma.order.findUnique({
            where: { shopifyOrderId: String(shopifyOrderId) }
        })

        if (localOrder) {
            await prisma.order.update({
                where: { id: localOrder.id },
                data: updateData as any
            })
        }

        // 2. Update Linked Invoices
        const invoices = await prisma.invoice.updateMany({
            where: {
                OR: [
                    { shopifyOrderId: String(shopifyOrderId) },
                    { orderNumber: order.name }
                ],
                organizationId
            } as any,
            data: {
                shopifyOrderId: String(shopifyOrderId),
                shopifyOrderNumber: order.name,
                financialStatus: order.financial_status,
                paymentMethodLabel,
                totalPriceCents,
                totalPaidCents,
                totalRefundedCents,
                updatedFromShopifyAt: new Date(),
                paidAt: order.financial_status === 'paid' ? new Date() : null,
                customerName,
                customerEmail,
                customerPhone,
                isGuestCheckout: guestStatus,
                shopifyCustomerId,
            } as any
        })

        console.log(`[Sync] Updated Order ${order.name} and ${invoices.count} invoices with status: ${order.financial_status}`)
        return { order, invoicesCount: invoices.count }

    } catch (error) {
        console.error(`[Sync] Error syncing order ${shopifyOrderId}:`, error)
        throw error
    }
}

export function derivePaymentMethodLabel(order: any, transactions: any[]): string {
    const gatewayNames = order.payment_gateway_names || []

    // 1) PayPal
    if (transactions.some(t => t.gateway?.toLowerCase() === 'paypal') || gatewayNames.some((g: string) => g.toLowerCase() === 'paypal')) {
        return 'PayPal'
    }

    // 2) Vorkasse / manual
    const manualKeywords = ['bank_transfer', 'manual', 'vorkasse', 'bank_überweisung', 'überweisung', 'bank transfer', 'rechnung', 'invoice', 'bank deposit']
    if (gatewayNames.some((g: string) => manualKeywords.includes(g.toLowerCase()))) {
        // If it's specifically 'rechnung' (invoice), label it correctly
        if (gatewayNames.some((g: string) => g.toLowerCase().includes('rechnung') || g.toLowerCase().includes('invoice'))) {
            return 'Rechnung'
        }
        return 'Vorkasse / Überweisung'
    }

    // 3) Look for Keywords in gateway names if not strictly manual
    if (gatewayNames.some((g: string) => g.toLowerCase().includes('paypal'))) return 'PayPal'
    if (gatewayNames.some((g: string) => g.toLowerCase().includes('klarna'))) return 'Klarna'
    if (gatewayNames.some((g: string) => g.toLowerCase().includes('sofort'))) return 'Sofort'
    if (gatewayNames.some((g: string) => g.toLowerCase().includes('amazon'))) return 'Amazon Pay'

    // 4) Shopify Payments
    if (transactions.some(t => t.gateway?.toLowerCase() === 'shopify_payments') || gatewayNames.includes('shopify_payments')) {
        return 'Shopify Payments'
    }

    // 5) Unknown / Fallback
    if (gatewayNames.length > 0) {
        const first = gatewayNames[0]
        if (first === 'shopify_payments') return 'Shopify Payments'

        // Final sanity check for manual-like strings
        const lowerFirst = first.toLowerCase()
        if (lowerFirst.includes('rechnung')) return 'Rechnung'
        if (lowerFirst.includes('vorkasse') || lowerFirst.includes('überweisung')) return 'Vorkasse / Überweisung'

        return first
    }

    return 'Unbekannt'
}

export function mapStatusToGerman(status: string | null): string {
    if (!status) return 'Unbekannt'

    const mapping: Record<string, string> = {
        'paid': 'Bezahlt',
        'pending': 'Offen',
        'authorized': 'Offen',
        'partially_paid': 'Teilbezahlt',
        'refunded': 'Erstattet',
        'partially_refunded': 'Teil-Erstattet',
        'voided': 'Storniert',
        'cancelled': 'Storniert'
    }

    return mapping[status.toLowerCase()] || status
}
