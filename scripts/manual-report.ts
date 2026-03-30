import { ShopifyAPI, convertShopifyOrderToInvoice } from './lib/shopify-api'
import { getShopifySettings } from './lib/shopify-settings'
import { sendEmail } from './lib/email-service'
import { log } from './lib/logger'
import { generateArizonaPDF } from './lib/arizona-pdf-generator'
import { loadInvoicesFromDisk, saveInvoicesToDisk } from './lib/server-storage'
import * as fs from 'fs'
import * as path from 'path'
import dotenv from 'dotenv'
import JSZip from 'jszip'

// Load environment variables manually
try {
    const envLocal = fs.readFileSync(path.join(process.cwd(), '.env.local'), 'utf8')
    envLocal.split('\n').forEach(line => {
        const match = line.match(/^([^=]+)=(.*)$/)
        if (match) {
            const key = match[1].trim()
            const value = match[2].trim().replace(/^["']|["']$/g, '') // Remove quotes
            if (!process.env[key]) {
                process.env[key] = value
            }
        }
    })
    console.log('✅ Loaded .env.local manually')
} catch (e) {
    console.warn('⚠️ Could not load .env.local:', e)
}

// Also try .env
try {
    const env = fs.readFileSync(path.join(process.cwd(), '.env'), 'utf8')
    env.split('\n').forEach(line => {
        const match = line.match(/^([^=]+)=(.*)$/)
        if (match) {
            const key = match[1].trim()
            const value = match[2].trim().replace(/^["']|["']$/g, '')
            if (!process.env[key]) {
                process.env[key] = value
            }
        }
    })
} catch (e) {
    // Ignore
}

console.log('DEBUG: Checking Environment Variables...')
console.log('SHOPIFY_SHOP_DOMAIN:', process.env.SHOPIFY_SHOP_DOMAIN)
console.log('SHOPIFY_ACCESS_TOKEN length:', process.env.SHOPIFY_ACCESS_TOKEN ? process.env.SHOPIFY_ACCESS_TOKEN.length : 'MISSING')


async function run() {
    try {
        console.log('⏰ Starting Manual Report for Range...')

        // Date Range: 01.11.2025 to 30.11.2025
        const startTargetDate = "2025-11-01"
        const endTargetDate = "2025-11-30"

        const startOfDay = new Date(startTargetDate)
        startOfDay.setHours(0, 0, 0, 0)

        const endOfDay = new Date(endTargetDate)
        endOfDay.setHours(23, 59, 59, 999)

        console.log(`📅 Report Range: ${startOfDay.toLocaleDateString('de-DE')} - ${endOfDay.toLocaleDateString('de-DE')}`)

        const startDateStr = startOfDay.toISOString()
        const endDateStr = endOfDay.toISOString()

        let invoices: any[] = []
        let source = 'shopify'

        try {
            console.log(`📅 Fetching orders from ${startDateStr} to ${endDateStr}`)
            const api = new ShopifyAPI()
            const settings = getShopifySettings()

            const orders = await api.getOrders({
                created_at_min: startDateStr,
                created_at_max: endDateStr,
                financial_status: 'paid'
            })

            console.log(`📦 Found ${orders.length} paid orders from Shopify.`)

            for (const partialOrder of orders) {
                try {
                    let order = await api.getOrder(partialOrder.id)

                    if (!order) {
                        console.warn(`Could not fetch full details for order ${partialOrder.id}, using partial data.`)
                        order = partialOrder
                    }

                    // Deep customer fetch logic
                    if ((!order.billing_address || !order.customer?.first_name) && order.customer?.id) {
                        try {
                            const fullCustomer = await api.getCustomer(order.customer.id)
                            if (fullCustomer) {
                                if (!order.customer.first_name) order.customer.first_name = fullCustomer.first_name
                                if (!order.customer.last_name) order.customer.last_name = fullCustomer.last_name
                                if (!order.customer.email) order.customer.email = fullCustomer.email
                                if (!order.billing_address && fullCustomer.default_address) {
                                    order.billing_address = {
                                        ...fullCustomer.default_address,
                                        name: `${fullCustomer.first_name} ${fullCustomer.last_name}`
                                    }
                                }
                            }
                        } catch (e) {
                            console.error('Failed to fetch customer', e)
                        }
                    }

                    if (!order.billing_address && order.customer?.default_address) {
                        order.billing_address = {
                            ...order.customer.default_address,
                            name: `${order.customer.default_address.first_name} ${order.customer.default_address.last_name}`
                        }
                    }

                    const invoice = convertShopifyOrderToInvoice(order, settings)
                    invoices.push(invoice)
                } catch (err) {
                    console.error(`Failed to process order ${partialOrder.id}:`, err)
                }
            }

        } catch (error: any) {
            console.error('❌ Shopify API failed, falling back to local data:', error.message)
            source = 'local'

            const allInvoices = loadInvoicesFromDisk()
            console.log(`📂 Loaded ${allInvoices.length} invoices from disk.`)

            invoices = allInvoices.filter(inv => {
                const invDate = new Date(inv.date)
                return invDate >= startOfDay && invDate <= endOfDay
            })
            console.log(`📦 Found ${invoices.length} invoices for range in local storage.`)
        }

        if (invoices.length === 0) {
            console.log('⚠️ No invoices found for this date range.')
            return
        }

        // Prepare data for report
        let totalNet = 0
        let totalTax = 0
        let totalGross = 0

        const attachments = []
        const orderRows = []

        // Initialize ZIP
        const zip = new JSZip()
        const invoicesFolder = zip.folder("Rechnungen")

        // CSV Header
        let csvContent = 'Rechnungsnummer;Datum;Kunde;Email;Produkte;Netto;MwSt;Brutto\n'

        for (const invoice of invoices) {
            try {
                // Map flattened fields to nested customer object if missing (for local invoices)
                if (!invoice.customer) {
                    invoice.customer = {
                        name: invoice.customerName || '',
                        companyName: invoice.customerCompanyName || '',
                        email: invoice.customerEmail || '',
                        address: invoice.customerAddress || '',
                        zipCode: invoice.customerZip || '',
                        city: invoice.customerCity || '',
                        country: invoice.customerCountry || ''
                    }
                }

                // Generate PDF
                const doc = await generateArizonaPDF(invoice)
                const pdfBuffer = Buffer.from(doc.output('arraybuffer'))

                // Add to ZIP
                invoicesFolder?.file(`Rechnung_${invoice.number}.pdf`, pdfBuffer)

                // Add individual PDF to attachments (optional, but maybe too many? Let's keep them if not too many, or just ZIP)
                // User asked for ZIP, but usually individual PDFs are good too if few. 
                // However, user said "add also all invoices as zip", implying both or just zip.
                // To avoid email size limits, let's ONLY attach the ZIP and the CSV if there are many.
                // But for safety, let's attach the ZIP as the main thing.

                await new Promise(r => setTimeout(r, 200)) // Faster timeout

                const gross = invoice.total || 0
                const tax = invoice.taxAmount || 0
                const net = invoice.subtotal || 0

                // Extract product names safely
                const productNames = invoice.items?.map((item: any) => `${item.quantity}x ${item.description}`).join(', ') || 'Keine Produkte'

                totalGross += gross
                totalTax += tax
                totalNet += net

                orderRows.push(`
          <tr>
            <td style="padding: 8px; border-bottom: 1px solid #ddd;">${invoice.number}</td>
            <td style="padding: 8px; border-bottom: 1px solid #ddd;">${new Date(invoice.date).toLocaleDateString('de-DE')}</td>
            <td style="padding: 8px; border-bottom: 1px solid #ddd;">
                ${invoice.customerName || invoice.customer?.name}<br>
                <span style="font-size: 11px; color: #666;">${productNames}</span>
            </td>
            <td style="padding: 8px; border-bottom: 1px solid #ddd; text-align: right;">${net.toFixed(2)} €</td>
            <td style="padding: 8px; border-bottom: 1px solid #ddd; text-align: right;">${tax.toFixed(2)} €</td>
            <td style="padding: 8px; border-bottom: 1px solid #ddd; text-align: right;"><strong>${gross.toFixed(2)} €</strong></td>
          </tr>
        `)

                const csvRow = [
                    invoice.number,
                    new Date(invoice.date).toLocaleDateString('de-DE'),
                    `"${invoice.customerName || invoice.customer?.name}"`,
                    invoice.customerEmail || invoice.customer?.email || '',
                    `"${productNames}"`,
                    net.toFixed(2).replace('.', ','),
                    tax.toFixed(2).replace('.', ','),
                    gross.toFixed(2).replace('.', ',')
                ].join(';')
                csvContent += csvRow + '\n'

            } catch (err) {
                console.error(`Failed to process invoice ${invoice.number}:`, err)
            }
        }

        // Generate ZIP Buffer
        console.log('🗜️ Generating ZIP file...')
        const zipBuffer = await zip.generateAsync({ type: 'nodebuffer' })
        console.log(`📦 ZIP generated, size: ${(zipBuffer.length / 1024 / 1024).toFixed(2)} MB`)

        // Attach CSV
        attachments.push({
            filename: `Export_${startTargetDate}_bis_${endTargetDate}.csv`,
            content: Buffer.from(csvContent, 'utf-8'),
            contentType: 'text/csv'
        })

        // Attach ZIP
        attachments.push({
            filename: `Rechnungen_${startTargetDate}_bis_${endTargetDate}.zip`,
            content: zipBuffer,
            contentType: 'application/zip'
        })

        // SAVE TO DISK for Chatbot/Dashboard visibility
        if (source === 'shopify' && invoices.length > 0) {
            try {
                const existingInvoices = loadInvoicesFromDisk()
                let newCount = 0

                for (const newInv of invoices) {
                    // Check if exists by number or ID
                    const exists = existingInvoices.some(ex => ex.number === newInv.number || ex.id === newInv.id)
                    if (!exists) {
                        existingInvoices.push(newInv)
                        newCount++
                    }
                }

                if (newCount > 0) {
                    saveInvoicesToDisk(existingInvoices)
                    console.log(`💾 Saved ${newCount} new invoices to local database.`)
                } else {
                    console.log('💾 All invoices already exist in local database.')
                }
            } catch (e) {
                console.error('Failed to save invoices to disk:', e)
            }
        }

        const emailHtml = `
      <div style="font-family: Arial, sans-serif; color: #333; max-width: 800px; margin: 0 auto;">
        <h1 style="color: #000; border-bottom: 2px solid #000; padding-bottom: 10px;">Rechnungsbericht: ${startOfDay.toLocaleDateString('de-DE')} - ${endOfDay.toLocaleDateString('de-DE')}</h1>
        
        <div style="background-color: #f9f9f9; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
          <h2 style="margin-top: 0;">Zusammenfassung</h2>
          <table style="width: 100%; max-width: 400px;">
            <tr>
              <td style="padding: 5px 0;">Anzahl Bestellungen:</td>
              <td style="text-align: right; font-weight: bold;">${invoices.length}</td>
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
              <th style="padding: 8px;">Datum</th>
              <th style="padding: 8px;">Kunde / Produkte</th>
              <th style="padding: 8px; text-align: right;">Netto</th>
              <th style="padding: 8px; text-align: right;">MwSt</th>
              <th style="padding: 8px; text-align: right;">Brutto</th>
            </tr>
          </thead>
          <tbody>
            ${orderRows.join('') || '<tr><td colspan="6" style="padding: 10px; text-align: center;">Keine Bestellungen in diesem Zeitraum.</td></tr>'}
          </tbody>
        </table>

        <p style="margin-top: 30px; font-size: 12px; color: #888;">
          Anbei finden Sie alle Rechnungen als ZIP-Archiv sowie eine CSV-Exportdatei.<br>
          Zeitpunkt: ${new Date().toLocaleString('de-DE', { timeZone: 'Europe/Berlin' })}
        </p>
      </div>
    `

        const targetEmail = 'karinakhristich@gmail.com'
        console.log(`📧 Sending report to ${targetEmail} with ZIP and CSV...`)

        await sendEmail({
            to: targetEmail,
            subject: `Rechnungsbericht ${startOfDay.toLocaleDateString('de-DE')} - ${endOfDay.toLocaleDateString('de-DE')} (${invoices.length} Rechnungen)`,
            html: emailHtml,
            attachments: attachments
        })

        console.log('✅ Report sent successfully!')

    } catch (error) {
        console.error('❌ Error in report:', error)
    }
}

run()
