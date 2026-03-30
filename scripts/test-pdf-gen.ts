import { prisma } from '../lib/prisma'
import { generateArizonaPDF } from '../lib/arizona-pdf-generator'
import fs from 'fs'

async function main() {
    const invoiceId = 'RE-K-MY6GE15'; // This is actually the invoiceNumber in my script, let me find the ID

    const invoice = await prisma.invoice.findFirst({
        where: { invoiceNumber: invoiceId },
        include: {
            customer: true,
            items: true,
            organization: true,
            template: true
        }
    })

    if (!invoice) {
        console.error('Invoice not found')
        return
    }

    console.log('Invoice found:', invoice.id)

    const invoiceData = {
        id: invoice.id,
        number: invoice.invoiceNumber,
        date: invoice.issueDate.toISOString(),
        dueDate: invoice.dueDate.toISOString(),
        subtotal: Number(invoice.totalNet),
        taxRate: 19,
        taxAmount: Number(invoice.totalTax),
        total: Number(invoice.totalGross),
        status: invoice.status,
        primaryColor: (invoice.template as any)?.styling?.primaryColor || (invoice.template as any)?.primaryColor,
        layoutConfigs: (invoice.template as any)?.layout,
        customer: {
            name: invoice.customer.name,
            email: invoice.customer.email || '',
            address: invoice.customer.address,
            zipCode: invoice.customer.zipCode.replace(/^'/, ''),
            city: invoice.customer.city,
            country: invoice.customer.country || 'Deutschland'
        },
        organization: {
            name: invoice.organization?.name || 'KARINEX',
            address: invoice.organization?.address || '',
            zipCode: invoice.organization?.zipCode || '',
            city: invoice.organization?.city || '',
            country: invoice.organization?.country || 'Deutschland',
            taxId: invoice.organization?.taxId || '',
            bankName: invoice.organization?.bankName || '',
            iban: invoice.organization?.iban || '',
            bic: invoice.organization?.bic || ''
        },
        items: invoice.items.map(item => ({
            description: item.description,
            quantity: Number(item.quantity),
            unitPrice: Number(item.unitPrice),
            total: Number((item as any).grossAmount || (item as any).netAmount || 0),
            ean: (item as any).ean || undefined
        }))
    }

    try {
        if ((invoice.template as any)?.customHtml) {
            console.log('📄 Using custom HTML template')
            const { chromium } = require('playwright')
            const browser = await chromium.launch({ headless: true })
            const page = await browser.newPage()
            let html = (invoice.template as any).customHtml

            // Basic replacements (copy-pasted from route for fidelity)
            const replacements: any = {
                '{{number}}': invoiceData.number,
                '{{date}}': invoiceData.date,
                '{{due_date}}': invoiceData.dueDate,
                '{{customer_name}}': invoiceData.customer.name,
                '{{customer_address}}': invoiceData.customer.address,
                '{{customer_zip}}': invoiceData.customer.zipCode,
                '{{customer_city}}': invoiceData.customer.city,
                '{{customer_country}}': invoiceData.customer.country,
                '{{customer_number}}': (invoice as any).customerNumber || 'inv-1758',
                '{{total}}': invoiceData.total.toFixed(2),
                '{{subtotal}}': invoiceData.subtotal.toFixed(2),
                '{{tax_amount}}': invoiceData.taxAmount.toFixed(2),
                '{{tax_rate}}': invoiceData.taxRate || 19,
                '{{title}}': (invoice.template as any)?.texts?.title || 'Rechnung',
                '{{body_text}}': (invoice.template as any)?.texts?.subtitle || 'Vielen Dank für Ihren Auftrag. Wir berechnen Ihnen folgende Lieferung bzw. Leistung:',
                '{{logo_name}}': invoiceData.organization.name.toUpperCase(),
                '{{sender_line}}': `${invoiceData.organization.name} • ${invoiceData.organization.address} • ${invoiceData.organization.zipCode} ${invoiceData.organization.city}`,
                '{{org_address}}': invoiceData.organization.address,
                '{{org_zip}}': invoiceData.organization.zipCode,
                '{{org_city}}': invoiceData.organization.city,
                '{{org_country}}': invoiceData.organization.country,
                '{{email}}': (invoice.organization as any)?.email || 'Rechnung@karinex.de',
                '{{phone}}': (invoiceData.organization as any).phone || '01556 / 3133856',
                '{{manager_name}}': 'Karina Khrystych',
                '{{bank_name}}': invoiceData.organization.bankName || 'N26',
                '{{iban}}': invoiceData.organization.iban || '',
                '{{bic}}': invoiceData.organization.bic || '',
                '{{tax_id}}': invoiceData.organization.taxId || 'DE452578048',
                '{{vat_id}}': (invoice.organization as any)?.vatId || 'DE123456789',
                '{{payment_terms}}': `Zahlbar bis zum ${invoiceData.dueDate}`,
                '{{delivery_date}}': invoiceData.date,
                '{{items_table}}': 'Table goes here'
            }

            Object.keys(replacements).forEach(key => {
                html = html.replaceAll(key, replacements[key])
            })

            await page.setContent(html)
            const pdf = await page.pdf({ format: 'A4', printBackground: true })
            await browser.close()
            fs.writeFileSync('test_kaufland.pdf', Buffer.from(pdf))
            console.log('✅ PDF generated with Playwright')
        } else {
            console.log('📄 Using Arizona PDF template')
            const doc = await generateArizonaPDF(invoiceData as any)
            const buffer = Buffer.from(doc.output('arraybuffer'))
            fs.writeFileSync('test_kaufland.pdf', buffer)
            console.log('✅ PDF generated with Arizona')
        }
    } catch (e) {
        console.error('❌ Error during generation:', e)
    }
}

main().catch(console.error).finally(() => prisma.$disconnect())
