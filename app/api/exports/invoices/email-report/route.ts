import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';
import * as XLSX from 'xlsx';
import nodemailer from 'nodemailer';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
    try {
        const session = await auth();
        if (!session) {
            return new NextResponse('Unauthorized', { status: 401 });
        }

        const body = await req.json();
        const { month, year } = body;
        const organizationId = (session.user as any).organizationId;

        if (!month || !year) {
            return NextResponse.json({ success: false, error: 'Month and year are required' }, { status: 400 });
        }

        // 1. Fetch Invoices
        const start = new Date(`${year}-${month}-01T00:00:00Z`);
        const end = new Date(new Date(start).setMonth(start.getMonth() + 1) - 1);

        const invoices = await prisma.invoice.findMany({
            where: {
                organizationId,
                issueDate: { gte: start, lte: end }
            },
            include: {
                items: true,
                order: true
            },
            orderBy: { issueDate: 'asc' }
        });

        if (invoices.length === 0) {
            return NextResponse.json({ success: false, error: `Keine Rechnungen f\u00FCr ${month}/${year} gefunden.` });
        }

        // 2. Prepare Excel
        const rows: any[] = [];
        for (const inv of invoices) {
            for (const item of inv.items) {
                const quantity = Number(item.quantity) || 0;
                const verkaufspreis = Number(item.grossAmount) || 0;
                const mwst = Number(item.taxAmount) || 0;
                const retouren = inv.refundAmount ? Number(inv.refundAmount) : 0;
                const gewinn = verkaufspreis - mwst - retouren;

                rows.push({
                    'Datum': inv.issueDate.toLocaleDateString('de-DE'),
                    'Produktname': item.description,
                    'EAN': item.ean || '0',
                    'Bestellnummer': inv.orderNumber || 'N/A',
                    'Kategorie': 'Standard',
                    'St\u00FCckzahl verkauft': quantity,
                    'Verkaufspreis (\u20AC)': verkaufspreis,
                    'Einkaufspreis (\u20AC)': 0,
                    'Versandkosten (\u20AC)': 0,
                    'Amazon Geb\u00FChren (\u20AC)': 0,
                    'MwSt (19%)': mwst,
                    'Retouren (\u20AC)': retouren,
                    'Werbungskosten (\u20AC)': 0,
                    'Sonstige Kosten (\u20AC)': 0,
                    'Gewinn (\u20AC)': gewinn
                });
            }
        }

        const workbook = XLSX.utils.book_new();
        const worksheet = XLSX.utils.json_to_sheet(rows);
        XLSX.utils.book_append_sheet(workbook, worksheet, 'Verk\u00E4ufe');
        const excelBuffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });

        // 3. Send Email
        const smtpUser = process.env.SMTP_USER || process.env.EMAIL_USER;
        const smtpPass = process.env.SMTP_PASS || process.env.EMAIL_PASS;
        const targetEmail = session.user?.email || 'shop@karinex.de';

        if (!smtpUser || !smtpPass) {
            return NextResponse.json({ success: false, error: 'SMTP-Konfiguration fehlt (.env)' });
        }

        const transporter = nodemailer.createTransport({
            host: process.env.SMTP_HOST || 'smtp.gmail.com',
            port: parseInt(process.env.SMTP_PORT || '587'),
            secure: process.env.SMTP_SECURE === 'true',
            auth: { user: smtpUser, pass: smtpPass }
        });

        await transporter.sendMail({
            from: `"${process.env.EMAIL_FROM_NAME || 'Invoice Master'}" <${smtpUser}>`,
            to: targetEmail,
            subject: `\uD83D\uDCC4 Finanzreport - ${month}/${year}`,
            text: `Hallo,\n\nanbei erhalten Sie den Finanzreport f\u00FCr ${month}/${year}.\n\nAnzahl Rechnungen: ${invoices.length}`,
            attachments: [{
                filename: `Report_${month}_${year}.xlsx`,
                content: excelBuffer
            }]
        });

        return NextResponse.json({ success: true, count: invoices.length });

    } catch (error: any) {
        console.error('Email Report Error:', error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
