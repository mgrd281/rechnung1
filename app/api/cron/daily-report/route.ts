import { NextResponse } from 'next/server'
import { ShopifyAPI, convertShopifyOrderToInvoice } from '@/lib/shopify-api'
import { getShopifySettings } from '@/lib/shopify-settings'
import { sendEmail } from '@/lib/email-service'
import { log } from '@/lib/logger'
import { generateArizonaPDF } from '@/lib/arizona-pdf-generator'

export const dynamic = 'force-dynamic'
export const maxDuration = 60

export async function GET(req: Request) {
  // Verify Vercel Cron header
  const authHeader = req.headers.get('authorization')
  if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    const { searchParams } = new URL(req.url)
    if (searchParams.get('key') !== process.env.CRON_SECRET) {
      // return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
  }

  try {
    log('⏰ Starting Daily Report Cron Job (Enhanced + CSV)...')

    const { searchParams } = new URL(req.url)
    const dateParam = searchParams.get('date')

    let now = new Date()
    if (dateParam) {
      const parsedDate = new Date(dateParam)
      if (!isNaN(parsedDate.getTime())) {
        now = parsedDate
        log(`📅 Using custom date from parameter: ${dateParam}`)
      }
    }

    const startOfDay = new Date(now)
    startOfDay.setHours(0, 0, 0, 0)

    const endOfDay = new Date(now)
    endOfDay.setHours(23, 59, 59, 999)

    const startDateStr = startOfDay.toISOString()
    const endDateStr = endOfDay.toISOString()

    log(`📅 Fetching orders from ${startDateStr} to ${endDateStr}`)

    const api = new ShopifyAPI()
    const settings = getShopifySettings()

    const orders = await api.getOrders({
      created_at_min: startDateStr,
      created_at_max: endDateStr,
      financial_status: 'paid'
    })

    log(`📦 Found ${orders.length} paid orders for today.`)

    // Prepare data for report
    let totalNet = 0
    let totalTax = 0
    let totalGross = 0

    const attachments = []
    const orderRows = []

    // CSV Header
    let csvContent = 'Rechnungsnummer;Datum;Kunde;Email;Produkte;Netto;MwSt;Brutto\n'

    for (const partialOrder of orders) {
      try {
        // Fetch FULL order details to ensure we have complete customer/address data
        // The list endpoint often returns incomplete data
        let order = await api.getOrder(partialOrder.id)

        if (!order) {
          console.warn(`Could not fetch full details for order ${partialOrder.id}, using partial data.`)
          order = partialOrder
        }

        // ---------------------------------------------------------
        // DEEP CUSTOMER FETCH STRATEGY (For Digital Products)
        // ---------------------------------------------------------
        // If we still lack basic data, fetch the FULL Customer Profile explicitly
        if ((!order.billing_address || !order.customer?.first_name) && order.customer?.id) {
          console.log(`🕵️‍♀️ Fetching FULL Customer Profile for #${order.customer.id} to fix missing data...`)
          try {
            const fullCustomer = await api.getCustomer(order.customer.id)
            if (fullCustomer) {
              // Merge customer data into order
              if (!order.customer.first_name) order.customer.first_name = fullCustomer.first_name
              if (!order.customer.last_name) order.customer.last_name = fullCustomer.last_name
              if (!order.customer.email) order.customer.email = fullCustomer.email

              // Use default address as billing address if missing
              if (!order.billing_address && fullCustomer.default_address) {
                console.log(`✅ Applied Default Address from Customer Profile to Order ${order.name}`)
                order.billing_address = {
                  ...fullCustomer.default_address,
                  name: `${fullCustomer.first_name} ${fullCustomer.last_name}`
                }
              }
            }
          } catch (custErr) {
            console.error('Failed to fetch customer profile:', custErr)
          }
        }
        // ---------------------------------------------------------

        // Debug Log for Address Issues
        if (!order.billing_address && !(order as any).shipping_address && !order.customer?.default_address) {
          console.warn(`⚠️ Order ${order.name} has NO address data! Raw keys:`, Object.keys(order))
        }

        // ---------------------------------------------------------
        // ROBUST ADDRESS FALLBACK STRATEGY
        // ---------------------------------------------------------
        // If billing address is missing, force use of customer default address
        if (!order.billing_address && order.customer?.default_address) {
          console.log(`🔧 Fixing missing billing address for ${order.name} using Customer Default Address`)
          order.billing_address = {
            ...order.customer.default_address,
            name: `${order.customer.default_address.first_name} ${order.customer.default_address.last_name}`
          }
        }

        // If name is still missing/generic, force update from customer data
        const currentName = order.billing_address?.name || order.customer?.name
        if (!currentName || currentName.includes('Order #')) {
          if (order.customer?.first_name && order.customer?.last_name) {
            const fullName = `${order.customer.first_name} ${order.customer.last_name}`
            console.log(`🔧 Fixing missing name for ${order.name}: "${currentName}" -> "${fullName}"`)
            if (order.billing_address) order.billing_address.name = fullName
            if (order.customer) order.customer.name = fullName
          }
        }
        // ---------------------------------------------------------

        // Convert to Invoice Object to get calculations and PDF
        const invoice = convertShopifyOrderToInvoice(order, settings)

        // Generate PDF
        const doc = await generateArizonaPDF(invoice)
        const pdfBuffer = Buffer.from(doc.output('arraybuffer'))

        attachments.push({
          filename: `Rechnung_${invoice.number}.pdf`,
          content: pdfBuffer,
          contentType: 'application/pdf'
        })

        // Add a small delay to prevent hitting Shopify API rate limits
        await new Promise(r => setTimeout(r, 500))

        // Calculate totals (Parse from invoice to ensure consistency with PDF)
        const gross = invoice.total
        const tax = invoice.taxAmount
        const net = invoice.subtotal

        // Extract Product Names
        const productNames = order.line_items?.map((item: any) => `${item.quantity}x ${item.title}`).join(', ') || 'Keine Produkte'

        totalGross += gross // FIXED: Added back the missing accumulation
        totalTax += tax
        totalNet += net

        orderRows.push(`
          <tr>
            <td style="padding: 8px; border-bottom: 1px solid #ddd;">${invoice.number}</td>
            <td style="padding: 8px; border-bottom: 1px solid #ddd;">
                ${invoice.customer.name}<br>
                <span style="font-size: 11px; color: #666;">${productNames}</span>
            </td>
            <td style="padding: 8px; border-bottom: 1px solid #ddd; text-align: right;">${net.toFixed(2)} €</td>
            <td style="padding: 8px; border-bottom: 1px solid #ddd; text-align: right;">${tax.toFixed(2)} €</td>
            <td style="padding: 8px; border-bottom: 1px solid #ddd; text-align: right;"><strong>${gross.toFixed(2)} €</strong></td>
          </tr>
        `)

        // Add to CSV
        const csvRow = [
          invoice.number,
          new Date(order.created_at).toLocaleDateString('de-DE'),
          `"${invoice.customer.name}"`,
          invoice.customer.email,
          `"${productNames}"`,
          net.toFixed(2).replace('.', ','),
          tax.toFixed(2).replace('.', ','),
          gross.toFixed(2).replace('.', ',')
        ].join(';')
        csvContent += csvRow + '\n'

      } catch (err) {
        console.error(`Failed to process order ${partialOrder.name} for report:`, err)
      }
    }

    // Add CSV Attachment
    attachments.push({
      filename: `Tagesabschluss_${now.toISOString().split('T')[0]}.csv`,
      content: Buffer.from(csvContent, 'utf-8'),
      contentType: 'text/csv'
    })

    // HTML Email Content
    const emailHtml = `
      <div style="font-family: Arial, sans-serif; color: #333; max-width: 700px; margin: 0 auto;">
        <h1 style="color: #000; border-bottom: 2px solid #000; padding-bottom: 10px;">Tagesabschluss: ${now.toLocaleDateString('de-DE')}</h1>
        
        <div style="background-color: #f9f9f9; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
          <h2 style="margin-top: 0;">Zusammenfassung</h2>
          <table style="width: 100%; max-width: 400px;">
            <tr>
              <td style="padding: 5px 0;">Anzahl Bestellungen:</td>
              <td style="text-align: right; font-weight: bold;">${orders.length}</td>
            </tr>
            <tr>
              <td style="padding: 5px 0;">Gesamt Netto:</td>
              <td style="text-align: right;">${totalNet.toFixed(2)} €</td>
            </tr>
            <tr>
              <td style="padding: 5px 0;">MwSt (19%):</td>
              <td style="text-align: right;">${totalTax.toFixed(2)} €</td>
            </tr>
            <tr style="font-size: 18px; border-top: 1px solid #ccc;">
              <td style="padding: 10px 0;"><strong>Gesamt Brutto:</strong></td>
              <td style="text-align: right;"><strong>${totalGross.toFixed(2)} €</strong></td>
            </tr>
          </table>
        </div>

        <h3>Detaillierte Aufstellung:</h3>
        <table style="width: 100%; border-collapse: collapse; text-align: left; font-size: 14px;">
          <thead>
            <tr style="background-color: #eee;">
              <th style="padding: 8px;">Rechnung #</th>
              <th style="padding: 8px;">Kunde / Produkte</th>
              <th style="padding: 8px; text-align: right;">Netto</th>
              <th style="padding: 8px; text-align: right;">MwSt</th>
              <th style="padding: 8px; text-align: right;">Brutto</th>
            </tr>
          </thead>
          <tbody>
            ${orderRows.join('') || '<tr><td colspan="5" style="padding: 10px; text-align: center;">Keine Bestellungen heute.</td></tr>'}
          </tbody>
        </table>

        <p style="margin-top: 30px; font-size: 12px; color: #888;">
          Anbei finden Sie alle Rechnungen des Tages als PDF sowie eine CSV-Exportdatei.<br>
          Zeitpunkt: ${new Date().toLocaleString('de-DE', { timeZone: 'Europe/Berlin' })}
        </p>
      </div>
    `

    const targetEmail = 'karinakhristich@gmail.com'
    log(`📧 Sending enhanced daily report to ${targetEmail} with ${attachments.length} attachments...`)

    await sendEmail({
      to: targetEmail,
      subject: `Tagesabschluss ${now.toLocaleDateString('de-DE')} - ${totalGross.toFixed(2)} € Umsatz`,
      html: emailHtml,
      attachments: attachments
    })

    log('✅ Enhanced daily report sent successfully!')

    return NextResponse.json({ success: true, count: orders.length, revenue: totalGross })
  } catch (error: any) {
    log('❌ Error in daily report:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
