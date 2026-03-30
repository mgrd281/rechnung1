export const dynamic = "force-dynamic"
import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth-middleware'
import { prisma } from '@/lib/prisma'
import { generateArizonaPDF } from '@/lib/arizona-pdf-generator'
import { getCompanySettings } from '@/lib/company-settings'
import JSZip from 'jszip'
import nodemailer from 'nodemailer'
import { logInvoiceEvent } from '@/lib/invoice-history'
import { DocumentKind } from '@/lib/document-types'

export const maxDuration = 60 // Allow longer timeout for PDF generation

export async function POST(request: NextRequest) {
    try {
        const authResult = requireAuth(request)
        if ('error' in authResult) return authResult.error

        const { invoiceIds, accountantEmail, message } = await request.json()

        if (!invoiceIds || !Array.isArray(invoiceIds) || invoiceIds.length === 0) {
            return NextResponse.json({ error: 'No invoices selected' }, { status: 400 })
        }
        if (!accountantEmail) {
            return NextResponse.json({ error: 'No accountant email provided' }, { status: 400 })
        }

        // Fetch invoices
        const invoices = await prisma.invoice.findMany({
            where: { id: { in: invoiceIds } },
            include: { customer: true, items: true }
        })

        const zip = new JSZip()
        const companySettings = getCompanySettings()

        // Generate PDFs
        for (const invoice of invoices) {
            const invoiceData = {
                id: invoice.id,
                number: invoice.invoiceNumber,
                date: invoice.issueDate.toISOString(),
                dueDate: invoice.dueDate.toISOString(),
                subtotal: Number(invoice.totalNet),
                taxRate: 19, // Default or fetch from items if needed
                taxAmount: Number(invoice.totalTax),
                total: Number(invoice.totalGross),
                status: invoice.status,
                document_kind: invoice.documentKind as DocumentKind,
                reference_number: invoice.referenceNumber || undefined,
                grund: invoice.reason || undefined,
                original_invoice_date: invoice.originalDate?.toISOString(),
                refund_amount: invoice.refundAmount ? Number(invoice.refundAmount) : undefined,
                customer: {
                    name: invoice.customer.name,
                    companyName: '',
                    email: invoice.customer.email || '',
                    address: invoice.customer.address,
                    zipCode: invoice.customer.zipCode,
                    city: invoice.customer.city,
                    country: invoice.customer.country
                },
                organization: {
                    name: companySettings.companyName || companySettings.name,
                    address: companySettings.address,
                    zipCode: companySettings.zip || companySettings.zipCode,
                    city: companySettings.city,
                    country: companySettings.country,
                    taxId: companySettings.taxId || companySettings.taxNumber,
                    bankName: companySettings.bankName,
                    iban: companySettings.iban,
                    bic: companySettings.bic
                },
                items: invoice.items.map(item => ({
                    description: item.description,
                    quantity: Number(item.quantity),
                    unitPrice: Number(item.unitPrice),
                    total: Number(item.grossAmount),
                    ean: item.ean || undefined
                })),
                qrCodeSettings: null
            }

            const doc = await generateArizonaPDF(invoiceData as any)
            const pdfData = doc.output('arraybuffer')

            const filename = `Rechnung-${invoice.invoiceNumber}.pdf`
            zip.file(filename, pdfData)
        }

        // Generate CSV summary
        const csvHeader = 'Rechnungsnummer,Datum,Kunde,Netto,Steuer,Brutto\n'
        const csvRows = invoices.map(inv =>
            `${inv.invoiceNumber},${inv.issueDate.toISOString().split('T')[0]},"${inv.customer.name.replace(/"/g, '""')}",${inv.totalNet},${inv.totalTax},${inv.totalGross}`
        ).join('\n')
        zip.file('Rechnungsliste.csv', csvHeader + csvRows)

        const zipContent = await zip.generateAsync({ type: 'nodebuffer' })

        // Send Email
        const transporter = nodemailer.createTransport({
            host: process.env.SMTP_HOST,
            port: Number(process.env.SMTP_PORT),
            secure: process.env.SMTP_SECURE === 'true',
            auth: {
                user: process.env.SMTP_USER,
                pass: process.env.SMTP_PASS,
            },
        })

        await transporter.sendMail({
            from: process.env.SMTP_FROM || 'noreply@example.com',
            to: accountantEmail,
            subject: `Rechnungen Export (${invoices.length} Rechnungen)`,
            text: message || `Anbei finden Sie ${invoices.length} Rechnungen und eine Zusammenfassung als CSV.`,
            attachments: [
                {
                    filename: 'Rechnungen.zip',
                    content: zipContent
                }
            ]
        })

        // Log events
        await Promise.all(invoices.map(inv =>
            logInvoiceEvent(inv.id, 'SENT', `An Steuerberater gesendet (${accountantEmail})`)
        ))

        return NextResponse.json({ success: true, count: invoices.length })

    } catch (error) {
        console.error('Error sending to accountant:', error)
        return NextResponse.json({ error: 'Failed to send email: ' + (error instanceof Error ? error.message : String(error)) }, { status: 500 })
    }
}
