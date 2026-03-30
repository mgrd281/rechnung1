import { PrismaClient } from '@prisma/client'
import * as XLSX from 'xlsx'
import nodemailer from 'nodemailer'
import path from 'path'
import fs from 'fs'

const prisma = new PrismaClient()

async function sendAugustReport() {
    console.log('📊 Generating August 2025 Financial Report...')

    try {
        const start = new Date('2025-08-01T00:00:00Z')
        const end = new Date('2025-08-31T23:59:59Z')

        const invoices = await prisma.invoice.findMany({
            where: {
                issueDate: { gte: start, lte: end }
            },
            include: {
                items: true,
                order: true,
                customer: true
            }
        })

        if (invoices.length === 0) {
            console.log('ℹ️ No invoices found for August 2025.')
            return
        }

        console.log(`✅ Found ${invoices.length} invoices. Processing items...`)

        const rows: any[] = []
        for (const inv of invoices) {
            for (const item of inv.items) {
                const quantity = Number(item.quantity) || 0
                const verkaufspreis = Number(item.grossAmount) || 0
                const mwst = Number(item.taxAmount) || 0
                const retouren = inv.refundAmount ? Number(inv.refundAmount) : 0

                // Simplified profit calculation based on provided template rules
                const gewinn = verkaufspreis - mwst - retouren

                rows.push({
                    'Datum': inv.issueDate.toLocaleDateString('de-DE'),
                    'Produktname': item.description,
                    'EAN': item.ean || '0',
                    'Bestellnummer': inv.orderNumber || 'N/A',
                    'Kategorie': 'Standard',
                    'Stückzahl verkauft': quantity,
                    'Verkaufspreis (€)': verkaufspreis,
                    'Einkaufspreis (€)': 0,
                    'Versandkosten (€)': 0,
                    'Amazon Gebühren (€)': 0,
                    'MwSt (19%)': mwst,
                    'Retouren (€)': retouren,
                    'Werbungskosten (€)': 0,
                    'Sonstige Kosten (€)': 0,
                    'Gewinn (€)': gewinn
                })
            }
        }

        const wb = XLSX.utils.book_new()
        const ws = XLSX.utils.json_to_sheet(rows)
        XLSX.utils.book_append_sheet(wb, ws, 'Verkäufe')

        const filePath = path.join(process.cwd(), 'August_2025_Report.xlsx')
        XLSX.writeFile(wb, filePath)

        console.log(`📂 Report saved to ${filePath}`)

        // Send Email
        const smtpUser = process.env.SMTP_USER || process.env.EMAIL_USER
        const smtpPass = process.env.SMTP_PASS || process.env.EMAIL_PASS
        const targetEmail = process.env.EMAIL_TO || 'shop@karinex.de'

        if (!smtpUser || !smtpPass) {
            console.warn('⚠️ SMTP credentials not found in env. Report saved locally but not sent via email.')
            return
        }

        const transporter = nodemailer.createTransport({
            host: process.env.SMTP_HOST || 'smtp.gmail.com',
            port: parseInt(process.env.SMTP_PORT || '587'),
            secure: process.env.SMTP_SECURE === 'true',
            auth: { user: smtpUser, pass: smtpPass }
        })

        await transporter.sendMail({
            from: `"${process.env.EMAIL_FROM_NAME || 'Invoice App'}" <${smtpUser}>`,
            to: targetEmail,
            subject: '📊 Ihr Finanzreport - August 2025',
            text: `Hallo,\n\nanbei erhalten Sie den gewünschten Finanzreport für August 2025 im Excel-Format.\n\nAnzahl Rechnungen: ${invoices.length}`,
            attachments: [{ filename: 'August_2025_Report.xlsx', path: filePath }]
        })

        console.log(`📧 Email successfully sent to ${targetEmail}`)

    } catch (error) {
        console.error('❌ Error generating report:', error)
    } finally {
        await prisma.$disconnect()
    }
}

sendAugustReport()
