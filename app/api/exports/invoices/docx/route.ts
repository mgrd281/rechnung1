import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'
import { logAuditAction } from '@/lib/audit-logs'
import fs from 'fs'
import path from 'path'
import { createCanvas } from 'canvas'
import {
    Document,
    Packer,
    Paragraph,
    TextRun,
    Table,
    TableRow,
    TableCell,
    WidthType,
    Header,
    Footer,
    AlignmentType,
    HeadingLevel,
    PageNumber,
    PageBreak,
    ImageRun,
    BorderStyle,
    VerticalAlign,
    UnderlineType
} from 'docx'

export const dynamic = "force-dynamic"

const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' }).format(value)
}

const mapStatus = (s: string) => {
    const status = s?.toUpperCase() || '';
    if (status === 'PAID') return 'Bezahlt';
    if (status === 'SENT' || status === 'OPEN' || status === 'PENDING') return 'Offen';
    if (status === 'CANCELLED' || status === 'VOIDED' || status === 'STORNIERT') return 'Storniert';
    if (status === 'REFUNDED') return 'Gutschrift';
    return 'Offen';
};

// --- CHART GENERATOR (SERVER SIDE) ---
async function generateChartImage(data: any, type: 'pie' | 'bar') {
    const canvas = createCanvas(600, 300)
    const ctx = canvas.getContext('2d')

    // Background
    ctx.fillStyle = '#ffffff'
    ctx.fillRect(0, 0, 600, 300)

    if (type === 'pie') {
        const total = data.reduce((sum: number, d: any) => sum + d.value, 0)
        let startAngle = 0
        const colors = ['#059669', '#D97706', '#DC2626', '#3B82F6']

        data.forEach((d: any, i: number) => {
            if (d.value === 0) return
            const sliceAngle = (d.value / total) * 2 * Math.PI
            ctx.beginPath()
            ctx.moveTo(150, 150)
            ctx.arc(150, 150, 100, startAngle, startAngle + sliceAngle)
            ctx.fillStyle = colors[i % colors.length]
            ctx.fill()

            // Legend
            ctx.fillRect(320, 50 + (i * 30), 20, 20)
            ctx.fillStyle = '#1e293b'
            ctx.font = '14px Arial'
            ctx.fillText(`${d.label}: ${d.value}`, 350, 65 + (i * 30))

            startAngle += sliceAngle
        })
    } else {
        // Simple Bar Chart
        const max = Math.max(...data.map((d: any) => d.value), 1)
        const barWidth = 40
        const spacing = 20

        data.forEach((d: any, i: number) => {
            const h = (d.value / max) * 200
            ctx.fillStyle = '#3b82f6'
            ctx.fillRect(50 + (i * (barWidth + spacing)), 250 - h, barWidth, h)

            ctx.fillStyle = '#64748b'
            ctx.font = '10px Arial'
            ctx.save()
            ctx.translate(50 + (i * (barWidth + spacing)) + 15, 265)
            ctx.rotate(Math.PI / 4)
            ctx.fillText(d.label, 0, 0)
            ctx.restore()
        })
    }

    return canvas.toBuffer('image/png')
}

export async function POST(request: NextRequest) {
    try {
        const session = await auth()
        if (!session?.user) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })

        const body = await request.json()
        const { selectedIds, filters, exportOptions } = body
        // @ts-ignore
        const organizationId = session.user.organizationId || (await prisma.organization.findFirst())?.id

        const org = await prisma.organization.findUnique({ where: { id: organizationId } })

        // 1. Build Query
        const where: any = { organizationId }
        if (selectedIds?.length > 0) {
            where.id = { in: selectedIds }
        } else {
            if (filters) {
                if (filters.dateFrom) where.issueDate = { ...where.issueDate, gte: new Date(filters.dateFrom) }
                if (filters.dateTo) where.issueDate = { ...where.issueDate, lte: new Date(filters.dateTo) }
                if (exportOptions?.statuses?.length > 0) {
                    where.status = { in: exportOptions.statuses }
                } else if (filters.status && filters.status !== 'all') {
                    where.status = filters.status
                }
                if (filters.searchQuery) {
                    where.OR = [
                        { invoiceNumber: { contains: filters.searchQuery, mode: 'insensitive' } },
                        { customerName: { contains: filters.searchQuery, mode: 'insensitive' } }
                    ]
                }
            }
        }

        const invoices = await prisma.invoice.findMany({
            where,
            orderBy: { issueDate: 'asc' },
            include: { customer: true }
        })

        // 2. Calculations
        const stats = {
            total: invoices.length,
            paid: invoices.filter(i => mapStatus(i.status as string) === 'Bezahlt').length,
            open: invoices.filter(i => mapStatus(i.status as string) === 'Offen').length,
            cancelled: invoices.filter(i => mapStatus(i.status as string) === 'Storniert').length,
            revenue: invoices.reduce((sum, i) => {
                const s = mapStatus(i.status as string);
                return sum + (s !== 'Storniert' && s !== 'Gutschrift' ? Number(i.totalGross) : 0);
            }, 0),
            profit: invoices.reduce((sum, i) => {
                const s = mapStatus(i.status as string);
                return sum + (s !== 'Storniert' && s !== 'Gutschrift' ? (Number(i.totalGross) - Number(i.totalTax)) : 0);
            }, 0),
            tax: invoices.reduce((sum, i) => {
                const s = mapStatus(i.status as string);
                return sum + (s !== 'Storniert' && s !== 'Gutschrift' ? Number(i.totalTax) : 0);
            }, 0),
        }

        // 3. Generate Chart Buffers
        const statusChart = await generateChartImage([
            { label: 'Bezahlt', value: stats.paid },
            { label: 'Offen', value: stats.open },
            { label: 'Storniert', value: stats.cancelled }
        ], 'pie')

        // Month chart
        const monthData: any[] = []
        const months = ["Jan", "Feb", "Mär", "Apr", "Mai", "Jun", "Jul", "Aug", "Sep", "Okt", "Nov", "Dez"]
        invoices.forEach(inv => {
            const m = months[new Date(inv.issueDate).getMonth()]
            const existing = monthData.find(d => d.label === m)
            if (existing) existing.value += Number(inv.totalGross)
            else monthData.push({ label: m, value: Number(inv.totalGross) })
        })
        const trendChart = await generateChartImage(monthData, 'bar')

        // 4. DOCX Elements
        const logoPath = path.join(process.cwd(), 'public/uploads/logos/logo-1759503388589.png')
        const logoBuffer = fs.existsSync(logoPath) ? fs.readFileSync(logoPath) : null

        const doc = new Document({
            sections: [
                {
                    children: [
                        // --- COVER PAGE ---
                        new Paragraph({ spacing: { before: 2000 } }),
                        new Paragraph({
                            alignment: AlignmentType.CENTER,
                            children: [new TextRun({ text: "KARINEX", bold: true, size: 72, color: "0F172A" })]
                        }),
                        new Paragraph({
                            alignment: AlignmentType.CENTER,
                            children: [new TextRun({ text: "FINANZBERICHT", bold: true, size: 36, color: "475569", underline: { type: UnderlineType.SINGLE } })]
                        }),
                        new Paragraph({ spacing: { before: 1000 } }),
                        new Paragraph({
                            alignment: AlignmentType.CENTER,
                            children: [
                                new TextRun({ text: "ZEITRAUM: ", bold: true, size: 24, color: "64748B" }),
                                new TextRun({ text: `${filters?.dateFrom || 'Start'} - ${filters?.dateTo || 'Ende'}`, bold: true, size: 24 })
                            ]
                        }),
                        new Paragraph({
                            alignment: AlignmentType.CENTER,
                            children: [new TextRun({ text: `ERSTELLT AM: ${new Date().toLocaleDateString('de-DE')}`, size: 20, color: "94A3B8" })]
                        }),
                        new Paragraph({ children: [new PageBreak()] }),

                        // --- SUMMARY ---
                        new Paragraph({ text: "Executive Summary", heading: HeadingLevel.HEADING_1, spacing: { after: 400 } }),
                        new Table({
                            width: { size: 100, type: WidthType.PERCENTAGE },
                            rows: [
                                new TableRow({
                                    children: [
                                        new TableCell({ shading: { fill: "F8FAFC" }, children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "Umsatz", size: 18 }), new TextRun({ text: formatCurrency(stats.revenue), bold: true, size: 32, break: 1 })] })] }),
                                        new TableCell({ shading: { fill: "F8FAFC" }, children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "Gewinn (Est.)", size: 18 }), new TextRun({ text: formatCurrency(stats.profit), bold: true, size: 32, break: 1, color: "059669" })] })] }),
                                        new TableCell({ shading: { fill: "F8FAFC" }, children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "MwSt", size: 18 }), new TextRun({ text: formatCurrency(stats.tax), bold: true, size: 32, break: 1 })] })] }),
                                    ]
                                })
                            ]
                        }),
                        new Paragraph({ text: "", spacing: { after: 400 } }),

                        // --- CHARTS ---
                        new Paragraph({ text: "Analysen & Trends", heading: HeadingLevel.HEADING_2, spacing: { after: 200 } }),
                        new Paragraph({
                            alignment: AlignmentType.CENTER,
                            children: [
                                new ImageRun({ data: statusChart, transformation: { width: 450, height: 225 } } as any),
                                new TextRun({ text: "Zahlungsstatus Verteilung", size: 16, color: "64748B", break: 1 })
                            ]
                        }),
                        new Paragraph({ spacing: { before: 400 } }),
                        new Paragraph({
                            alignment: AlignmentType.CENTER,
                            children: [
                                new ImageRun({ data: trendChart, transformation: { width: 450, height: 225 } } as any),
                                new TextRun({ text: "Umsatzentwicklung", size: 16, color: "64748B", break: 1 })
                            ]
                        }),
                        new Paragraph({ children: [new PageBreak()] }),

                        // --- DETAILS ---
                        new Paragraph({ text: "Detaillierte Aufstellung", heading: HeadingLevel.HEADING_2, spacing: { after: 200 } }),
                        new Table({
                            width: { size: 100, type: WidthType.PERCENTAGE },
                            rows: [
                                new TableRow({
                                    children: ["Datum", "Bestellnr.", "Kunde", "Betrag", "Zahlungsart", "Status"].map(h => new TableCell({
                                        shading: { fill: "F1F5F9" },
                                        children: [new Paragraph({ children: [new TextRun({ text: h, bold: true, color: "1E293B", size: 18 })] })]
                                    }))
                                }),
                                ...invoices.map((inv, idx) => new TableRow({
                                    children: [
                                        new TableCell({ shading: { fill: idx % 2 === 0 ? "FFFFFF" : "F9FAFB" }, children: [new Paragraph({ children: [new TextRun({ text: new Date(inv.issueDate).toLocaleDateString('de-DE'), size: 16 })] })] }),
                                        new TableCell({ shading: { fill: idx % 2 === 0 ? "FFFFFF" : "F9FAFB" }, children: [new Paragraph({ children: [new TextRun({ text: inv.orderNumber || 'N/A', size: 16 })] })] }),
                                        new TableCell({ shading: { fill: idx % 2 === 0 ? "FFFFFF" : "F9FAFB" }, children: [new Paragraph({ children: [new TextRun({ text: inv.customerName || 'Gast', size: 16 })] })] }),
                                        new TableCell({ shading: { fill: idx % 2 === 0 ? "FFFFFF" : "F9FAFB" }, children: [new Paragraph({ children: [new TextRun({ text: formatCurrency(Number(inv.totalGross)), size: 16 })], alignment: AlignmentType.RIGHT })] }),
                                        new TableCell({ shading: { fill: idx % 2 === 0 ? "FFFFFF" : "F9FAFB" }, children: [new Paragraph({ children: [new TextRun({ text: inv.paymentMethod || '-', size: 16 })] })] }),
                                        new TableCell({ shading: { fill: idx % 2 === 0 ? "FFFFFF" : "F9FAFB" }, children: [new Paragraph({ children: [new TextRun({ text: mapStatus(inv.status as string), size: 16 })] })] }),
                                    ]
                                }))
                            ]
                        })
                    ]
                }
            ]
        })

        const buffer = await Packer.toBuffer(doc)
        return new Response(buffer as any, {
            headers: {
                'Content-Type': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
                'Content-Disposition': `attachment; filename="Karinex_Finanzbericht_${new Date().toISOString().slice(0, 10)}.docx"`
            }
        })
    } catch (e: any) {
        console.error(e)
        return NextResponse.json({ success: false, error: e.message }, { status: 500 })
    }
}
