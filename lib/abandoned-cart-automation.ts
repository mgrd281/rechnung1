import { prisma } from './prisma'
// Automated Abandoned Cart Recovery Logic - Updated for Railway build trigger
import { sendEmail, generateMarketingRecoveryEmailHTML } from './email-service'
import { getPersonalizedTemplate } from './abandoned-cart-templates'
import { ShopifyAPI } from './shopify-api'
import { DEFAULT_SHOPIFY_SETTINGS } from './shopify-settings'

/**
 * Main automation function to process all eligible abandoned carts across all organizations.
 */
export async function processAutomatedRecoveries() {
    console.log('[Automation] Starting Abandoned Cart Recovery Processing...')

    // 1. Get all organizations with recovery enabled
    const allSettings = await prisma.abandonedCartSettings.findMany({
        where: { enabled: true },
        include: { organization: { include: { shopifyConnection: true } } }
    })

    console.log(`[Automation] Found ${allSettings.length} organizations with automated recovery enabled.`)

    let totalSent = 0
    let totalFailed = 0

    for (const settings of allSettings) {
        const orgId = settings.organizationId
        const delayMs = settings.autoSendDelay * 60 * 1000
        const cutoffTime = new Date(Date.now() - delayMs)
        const expiryTime = new Date(Date.now() - 48 * 3600000) // Don't process older than 48h

        // 2. Find eligible carts for this organization
        const eligibleCarts = await prisma.abandonedCart.findMany({
            where: {
                organizationId: orgId,
                isRecovered: false,
                recoverySent: false,
                updatedAt: {
                    lt: cutoffTime,
                    gt: expiryTime
                },
                email: { not: '' }
            },
            take: 10 // Safe batch size per org run
        })

        if (eligibleCarts.length === 0) continue

        console.log(`[Automation] Org ${orgId}: Processing ${eligibleCarts.length} carts.`)

        for (const cart of eligibleCarts) {
            try {
                // Determine template and discount
                const hasDiscount = settings.defaultDiscount > 0
                let templateId = hasDiscount ? 'incentive-10' : 'friendly-reminder'

                let couponCode = ''
                if (hasDiscount && settings.organization.shopifyConnection) {
                    try {
                        const conn = settings.organization.shopifyConnection
                        const shopDomain = conn.shopName.includes('.') ? conn.shopName : `${conn.shopName}.myshopify.com`

                        const shopify = new ShopifyAPI({
                            ...DEFAULT_SHOPIFY_SETTINGS,
                            shopDomain,
                            accessToken: conn.accessToken
                        })

                        const uniqueId = Math.random().toString(36).substring(7).toUpperCase()
                        const codeName = `AUTO-${uniqueId}`

                        const createdCode = await shopify.createDiscountCode(codeName, settings.defaultDiscount)
                        if (createdCode) {
                            couponCode = createdCode
                        }
                    } catch (err) {
                        console.error(`[Automation] Shopify Code Gen failed for cart ${cart.id}:`, err)
                    }
                }

                // Personalize template
                templateId = 'professional-marketing'
                const itemsList = Array.isArray(cart.lineItems)
                    ? (cart.lineItems as any[]).map((item: any) => `- ${item.quantity}x ${item.title}`).join('\n')
                    : 'Ihre Artikel'

                const personalized = getPersonalizedTemplate(templateId, {
                    customerName: cart.email.split('@')[0],
                    shopName: settings.organization.name,
                    itemsList,
                    discountCode: couponCode || undefined,
                    expiryHours: settings.expiryHours.toString(),
                    cartUrl: cart.cartUrl,
                    ownerName: settings.organization.name
                })

                if (!personalized) continue

                // 4. Generate Professional HTML
                const discount = settings.defaultDiscount || 10
                const discountFactor = (100 - discount) / 100

                const items = Array.isArray(cart.lineItems) ? (cart.lineItems as any[]) : []
                const maxVisible = 3
                const visibleItems = items.slice(0, maxVisible)
                const moreCount = items.length > maxVisible ? items.length - maxVisible : 0

                let itemsHTML = ''
                for (const item of visibleItems) {
                    const originalPrice = parseFloat(item.price) || 0
                    const discountedPrice = originalPrice * discountFactor
                    const imageSrc = item.image?.src || 'https://via.placeholder.com/80?text=Product'
                    const variantTitle = item.variant_title && item.variant_title !== 'Default Title' ? item.variant_title : ''

                    itemsHTML += `
                    <div class="product-card">
                        <table class="product-table">
                        <tr>
                            <td style="width: 70px;">
                            <img src="${imageSrc}" class="product-image" alt="${item.title}">
                            </td>
                            <td class="product-info">
                            <p class="product-title">${item.title}</p>
                            ${variantTitle ? `<p class="product-variant">${variantTitle}</p>` : ''}
                            <p style="margin: 0; font-size: 13px; color: #6b7280;">Qty: ${item.quantity}</p>
                            <div>
                                <span class="price-original">${originalPrice.toFixed(2)} ${cart.currency}</span>
                                <span class="price-discounted">${discountedPrice.toFixed(2)} ${cart.currency}</span>
                            </div>
                            </td>
                        </tr>
                        </table>
                    </div>`
                }

                if (moreCount > 0) {
                    itemsHTML += `<p style="text-align: center; font-size: 13px; color: #9ca3af; margin-top: 10px;">+ ${moreCount} weitere Artikel</p>`
                }

                const expiresAt = new Date(Date.now() + settings.expiryHours * 3600000)
                const expiresStr = expiresAt.toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })

                let discountSectionHTML = ''
                if (couponCode) {
                    discountSectionHTML = `
                    <div class="discount-section">
                        <div class="discount-title">Ihr exklusiver Rabatt: ${discount}%</div>
                        <div class="discount-code">${couponCode}</div>
                        <div class="discount-expiry">Gültig bis: ${expiresStr}</div>
                    </div>`
                }

                const emailHtml = generateMarketingRecoveryEmailHTML({
                    customerName: cart.email.split('@')[0],
                    bodyText: personalized.body.replace('[CartItemsHTML]', ''),
                    itemsHTML,
                    discountSectionHTML,
                    ctaText: personalized.cta,
                    ctaUrl: cart.cartUrl,
                    fallbackUrl: cart.cartUrl,
                    urgencyBarHTML: `<div class="urgency-bar">🔥 Nur noch für kurze Zeit verfügbar!</div>`,
                    companyName: settings.organization.name
                })

                // Send Email
                const emailResult = await sendEmail({
                    to: cart.email,
                    subject: personalized.subject,
                    html: emailHtml
                })

                if (emailResult.success) {
                    await prisma.$transaction([
                        (prisma as any).abandonedCartEmailLog.create({
                            data: {
                                cartId: cart.id,
                                subject: personalized.subject,
                                templateId,
                                discountCode: couponCode || null,
                                status: 'SENT'
                            }
                        }),
                        prisma.abandonedCart.update({
                            where: { id: cart.id },
                            data: {
                                recoverySent: true,
                                recoverySentAt: new Date(),
                                couponCode: couponCode || null,
                                discountValue: hasDiscount ? settings.defaultDiscount : null,
                                discountType: hasDiscount ? 'PERCENTAGE' : null,
                                couponExpiresAt: expiresAt
                            }
                        })
                    ])
                    totalSent++
                } else {
                    await (prisma as any).abandonedCartEmailLog.create({
                        data: {
                            cartId: cart.id,
                            subject: personalized.subject,
                            templateId,
                            discountCode: couponCode || null,
                            status: 'FAILED',
                            error: emailResult.error
                        }
                    })
                    totalFailed++
                }

            } catch (err) {
                console.error(`[Automation] Error processing cart ${cart.id}:`, err)
                totalFailed++
            }
        }
    }

    console.log(`[Automation] Completed. Sent: ${totalSent}, Failed: ${totalFailed}`)
    return { sent: totalSent, failed: totalFailed }
}
