import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { generateArizonaPDF } from '@/lib/arizona-pdf-generator'

export const dynamic = 'force-dynamic';

export async function GET(
    request: NextRequest,
    { params }: { params: any }
) {
    try {
        const { id: invoiceId } = await params

        // Fetch real invoice data
        const invoice = await prisma.invoice.findUnique({
            where: { id: invoiceId },
            include: {
                customer: true,
                items: true,
                organization: true,
                template: true
            }
        })

        if (!invoice) {
            return NextResponse.json(
                { error: 'Invoice not found' },
                { status: 404 }
            )
        }

        // Map database data to the format expected by generateArizonaPDF
        const invoiceData = {
            id: invoice.id,
            number: invoice.invoiceNumber,
            date: invoice.issueDate.toISOString(),
            dueDate: invoice.dueDate.toISOString(),
            subtotal: Number(invoice.totalNet),
            taxRate: 19, // Default to 19% if not stored
            taxAmount: Number(invoice.totalTax),
            total: Number(invoice.totalGross),
            status: invoice.status,
            // Pass custom template layout and styling
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
                total: Number((item as any).netAmount || (item as any).totalPrice || 0),
                ean: (item as any).ean || undefined
            }))
        }

        // Generate PDF using the Arizona template OR Custom HTML if provided
        let pdfBuffer: Buffer

        if ((invoice.template as any)?.customHtml) {
            console.log('📄 Using custom HTML template for invoice generation')
            const { chromium } = require('playwright')
            const browser = await chromium.launch({ headless: true })
            const page = await browser.newPage()

            let html = (invoice.template as any).customHtml

            // Basic variable replacement
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
                '{{items_table}}': `
                    <table class="items-table" style="width: 100%; border-collapse: collapse;">
                        <thead>
                            <tr style="background: #E8F3F1; border-top: 1.5px solid #5B8272; border-bottom: 1.5px solid #5B8272;">
                                <th style="text-align: left; padding: 10px 8px; font-size: 10px; color: #3C504B; text-transform: uppercase;">Bezeichnung</th>
                                <th style="text-align: center; padding: 10px 8px; font-size: 10px; color: #3C504B; text-transform: uppercase;">EAN</th>
                                <th style="text-align: center; padding: 10px 8px; font-size: 10px; color: #3C504B; text-transform: uppercase;">Menge</th>
                                <th style="text-align: center; padding: 10px 8px; font-size: 10px; color: #3C504B; text-transform: uppercase;">MwSt.</th>
                                <th style="text-align: right; padding: 10px 8px; font-size: 10px; color: #3C504B; text-transform: uppercase;">Preis</th>
                                <th style="text-align: right; padding: 10px 8px; font-size: 10px; color: #3C504B; text-transform: uppercase;">Gesamt</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${invoiceData.items.map(item => `
                                <tr style="border-bottom: 1px solid #f0f0f0;">
                                    <td style="padding: 12px 8px; font-size: 11px;">${item.description}</td>
                                    <td style="text-align: center; padding: 12px 8px; font-size: 11px;">${item.ean || '-'}</td>
                                    <td style="text-align: center; padding: 12px 8px; font-size: 11px;">${item.quantity}</td>
                                    <td style="text-align: center; padding: 12px 8px; font-size: 11px;">${invoiceData.taxRate}%</td>
                                    <td style="text-align: right; padding: 12px 8px; font-size: 11px;">${item.unitPrice.toFixed(2)}</td>
                                    <td style="text-align: right; padding: 12px 8px; font-size: 11px; font-weight: 600;">${item.total.toFixed(2)}</td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                `
            }

            Object.keys(replacements).forEach(key => {
                html = html.replaceAll(key, replacements[key])
            })

            await page.setContent(html)
            const pdf = await page.pdf({ format: 'A4', printBackground: true })
            await browser.close()
            pdfBuffer = Buffer.from(pdf)
        } else {
            const doc = await generateArizonaPDF(invoiceData as any)
            pdfBuffer = Buffer.from(doc.output('arraybuffer'))
        }

        // Return PDF with inline disposition for viewing
        return new NextResponse(new Uint8Array(pdfBuffer), {
            headers: {
                'Content-Type': 'application/pdf',
                'Content-Disposition': `inline; filename="${invoiceData.number}.pdf"`,
            },
        })

    } catch (error) {
        console.error('Error generating PDF:', error)
        return NextResponse.json(
            { error: 'Failed to generate PDF' },
            { status: 500 }
        )
    }
}

