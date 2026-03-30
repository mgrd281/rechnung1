export const dynamic = "force-dynamic"
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth';
import { sendEmail, generateRecoveryEmailHTML, generateMarketingRecoveryEmailHTML } from '@/lib/email-service'
import { getPersonalizedTemplate } from '@/lib/abandoned-cart-templates'
import { ShopifyAPI } from '@/lib/shopify-api'
import { DEFAULT_SHOPIFY_SETTINGS } from '@/lib/shopify-settings'

export async function POST(req: Request) {
    try {
        const session = await auth()
        if (!session?.user?.email) {
            return new NextResponse('Unauthorized', { status: 401 })
        }

        const body = await req.json()
        const { cartId, templateId, discountValue, expiryHours, manualCouponCode } = body

        if (!cartId || !templateId) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
        }

        // 1. Fetch Cart
        const cart = await prisma.abandonedCart.findUnique({
            where: { id: cartId },
            include: { organization: { include: { shopifyConnection: true } } }
        })

        if (!cart) {
            return NextResponse.json({ error: 'Cart not found' }, { status: 404 })
        }

        const org = cart.organization
        const shopifyConn = org.shopifyConnection

        // 2. Determine Discount Code (Manual or Auto-generated)
        let couponCode = manualCouponCode || ''

        if (!couponCode && discountValue && discountValue > 0 && shopifyConn) {
            try {
                // Ensure the shopName is used as the domain if it looks like one
                const shopDomain = shopifyConn.shopName.includes('.')
                    ? shopifyConn.shopName
                    : `${shopifyConn.shopName}.myshopify.com`

                const shopify = new ShopifyAPI({
                    ...DEFAULT_SHOPIFY_SETTINGS,
                    shopDomain,
                    accessToken: shopifyConn.accessToken,
                })

                // Create a unique coupon code
                const uniqueId = Math.random().toString(36).substring(7).toUpperCase()
                const codeName = `RECOVERY-${uniqueId}`

                const createdCode = await shopify.createDiscountCode(codeName, discountValue)
                if (createdCode) {
                    couponCode = createdCode
                }
            } catch (error) {
                console.error('Failed to create Shopify discount code:', error)
                // Continue without discount if it fails
            }
        }

        // 3. Prepare Template Data
        const itemsList = Array.isArray(cart.lineItems)
            ? (cart.lineItems as any[]).map((item: any) => `- ${item.quantity}x ${item.title}`).join('\n')
            : 'Ihre Artikel'

        const personalized = getPersonalizedTemplate(templateId, {
            customerName: cart.email.split('@')[0],
            shopName: org.name,
            itemsList,
            discountCode: couponCode || undefined,
            expiryHours: expiryHours?.toString(),
            cartUrl: cart.cartUrl,
            ownerName: session.user.name || org.name
        })

        if (!personalized) {
            return NextResponse.json({ error: 'Template not found' }, { status: 400 })
        }

        // 4. Send Email
        let emailHtml = ''
        if (templateId === 'professional-marketing') {
            // Marketing Style Email
            const discount = discountValue || 10
            const discountFactor = (100 - discount) / 100

            // Generate Product Cards
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
                      <td style="width: 80px;">
                        <img src="${imageSrc}" class="product-image" alt="${item.title}">
                      </td>
                      <td class="product-info">
                        <p class="product-title">${item.title}</p>
                        ${variantTitle ? `<p class="product-variant">${variantTitle}</p>` : ''}
                        <p style="margin: 0; font-size: 13px; color: #6b7280;">Menge: ${item.quantity}</p>
                        <div style="margin-top: 8px;">
                          <span class="price-original">${originalPrice.toFixed(2)} ${cart.currency}</span>
                          <span class="price-discounted">${discountedPrice.toFixed(2)} ${cart.currency}</span>
                          <span class="save-amount">Sie sparen ${(originalPrice - discountedPrice).toFixed(2)} ${cart.currency}</span>
                        </div>
                      </td>
                    </tr>
                  </table>
                </div>`
            }

            if (moreCount > 0) {
                itemsHTML += `<p style="text-align: center; font-size: 13px; color: #9ca3af; margin-top: 10px;">+ ${moreCount} weitere Artikel</p>`
            }

            // Generate Discount Section
            const expiresAt = expiryHours ? new Date(Date.now() + expiryHours * 3600000) : new Date(Date.now() + 24 * 3600000)
            const expiresStr = expiresAt.toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' })

            let discountSectionHTML = ''
            if (couponCode) {
                discountSectionHTML = `
                <div class="discount-section">
                  <div class="discount-tag">${discount}% RABATT</div>
                  <div class="discount-title">Nur für kurze Zeit</div>
                  <div class="discount-code">${couponCode}</div>
                  <div class="discount-expiry">Gültig bis: ${expiresStr}</div>
                </div>`
            }

            // Urgency Bar
            const urgencyBarHTML = `<div class="urgency-bar">🔥 Nur noch für kurze Zeit verfügbar!</div>`

            emailHtml = generateMarketingRecoveryEmailHTML({
                customerName: cart.email.split('@')[0],
                bodyText: personalized.body.replace('[CartItemsHTML]', ''), // Body usually contains text before items
                itemsHTML,
                discountSectionHTML,
                ctaText: personalized.cta,
                ctaUrl: cart.cartUrl,
                fallbackUrl: cart.cartUrl,
                urgencyBarHTML,
                companyName: org.name
            })
        } else {
            // Regular Template
            emailHtml = generateRecoveryEmailHTML(
                personalized.body,
                personalized.cta,
                cart.cartUrl,
                org.name
            )
        }

        const emailResult = await sendEmail({
            to: cart.email,
            subject: personalized.subject,
            html: emailHtml
        })

        if (!emailResult.success) {
            // Log failure
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
            return NextResponse.json({ error: 'Failed to send email' }, { status: 500 })
        }

        // 5. Update Cart & Log Success
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
                    discountValue: discountValue || null,
                    discountType: discountValue ? 'PERCENTAGE' : null,
                    couponExpiresAt: expiryHours ? new Date(Date.now() + expiryHours * 3600000) : null
                }
            })
        ])

        return NextResponse.json({ success: true, couponCode })

    } catch (error) {
        console.error('Error in send-email recovery:', error)
        return new NextResponse('Internal Error', { status: 500 })
    }
}
