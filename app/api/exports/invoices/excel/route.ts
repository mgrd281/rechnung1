import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';
import ExcelJS from 'exceljs';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
    try {
        const session = await auth();
        if (!session) {
            return new NextResponse('Unauthorized', { status: 401 });
        }

        const body = await req.json();
        const { filters, selectedIds, exportOptions } = body;
        const organizationId = (session.user as any).organizationId;

        // Construct where clause
        const where: any = { organizationId };

        if (selectedIds && selectedIds.length > 0) {
            where.id = { in: selectedIds };
        } else if (filters) {
            if (filters.searchQuery) {
                where.OR = [
                    { invoiceNumber: { contains: filters.searchQuery, mode: 'insensitive' } },
                    { customerName: { contains: filters.searchQuery, mode: 'insensitive' } },
                    { customer: { name: { contains: filters.searchQuery, mode: 'insensitive' } } },
                ];
            }
            if (exportOptions?.statuses && exportOptions.statuses.length > 0) {
                where.status = { in: exportOptions.statuses };
            } else if (filters.status && filters.status !== 'all') {
                where.status = filters.status.toUpperCase();
            }

            if (filters.dateFrom || filters.dateTo) {
                where.issueDate = {};
                if (filters.dateFrom) where.issueDate.gte = new Date(filters.dateFrom);
                if (filters.dateTo) {
                    const toDate = new Date(filters.dateTo);
                    toDate.setHours(23, 59, 59, 999);
                    where.issueDate.lte = toDate;
                }
            }
        }

        const invoices = await prisma.invoice.findMany({
            where,
            include: {
                items: { include: { taxRate: true } },
                order: true
            },
            orderBy: { issueDate: 'desc' }
        });

        // Mapping helper
        const mapStatus = (s: string) => {
            const status = s?.toUpperCase() || '';
            if (status === 'PAID') return 'Bezahlt';
            if (status === 'SENT' || status === 'OPEN' || status === 'PENDING') return 'Offen';
            if (status === 'CANCELLED' || status === 'VOIDED' || status === 'STORNIERT') return 'Storniert';
            if (status === 'REFUNDED' || status === 'REFUND_FULL' || status === 'REFUND_PARTIAL' || status === 'CREDIT_NOTE' || status === 'GUTSCHRIFT') return 'Gutschrift';
            return 'Offen';
        };

        const workbook = new ExcelJS.Workbook();

        // --- SHEET 1: DASHBOARD ---
        const dash = workbook.addWorksheet('Dashboard');
        dash.views = [{ showGridLines: false }];

        // Header Title
        const titleRow = dash.addRow(['KARINEX FINANZ-DASHBOARD']);
        titleRow.getCell(1).font = { bold: true, size: 20, color: { argb: 'FF1E293B' } };
        dash.mergeCells('A1:E1');

        dash.addRow(['Erstellt am: ' + new Date().toLocaleDateString('de-DE')]);
        dash.addRow([]);

        // Calculate Stats
        const stats = {
            total: invoices.length,
            paid: invoices.filter(i => mapStatus(i.status as string) === 'Bezahlt').length,
            open: invoices.filter(i => mapStatus(i.status as string) === 'Offen').length,
            cancelled: invoices.filter(i => {
                const s = mapStatus(i.status as string);
                return s === 'Storniert' || s === 'Gutschrift';
            }).length,
            revenue: invoices.reduce((sum, i) => {
                const s = mapStatus(i.status as string);
                const isCancelledOrRefunded = s === 'Storniert' || s === 'Gutschrift' || i.documentKind === 'CREDIT_NOTE';
                return sum + (!isCancelledOrRefunded ? Number(i.totalGross) : 0);
            }, 0),
            profit: invoices.reduce((sum, i) => {
                const s = mapStatus(i.status as string);
                const isCancelledOrRefunded = s === 'Storniert' || s === 'Gutschrift' || i.documentKind === 'CREDIT_NOTE';
                return sum + (!isCancelledOrRefunded ? (Number(i.totalGross) - Number(i.totalTax)) : 0);
            }, 0),
            tax: invoices.reduce((sum, i) => {
                const s = mapStatus(i.status as string);
                const isCancelledOrRefunded = s === 'Storniert' || s === 'Gutschrift' || i.documentKind === 'CREDIT_NOTE';
                return sum + (!isCancelledOrRefunded ? Number(i.totalTax) : 0);
            }, 0),
        };

        // KPI Section
        const kpiRow1 = dash.addRow(['Gesamt Rechnungen', 'Bezahlt', 'Offen', 'Storniert']);
        const kpiRow2 = dash.addRow([stats.total, stats.paid, stats.open, stats.cancelled]);

        [4, 5].forEach(r => {
            const row = dash.getRow(r);
            row.eachCell((cell, col) => {
                if (col <= 4) {
                    cell.alignment = { horizontal: 'center' };
                    cell.border = { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } };
                    if (r === 4) {
                        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF1F5F9' } };
                        cell.font = { bold: true };
                    } else {
                        cell.font = { size: 14, bold: true };
                    }
                }
            });
        });

        dash.addRow([]);
        const revRow1 = dash.addRow(['Gesamtumsatz', 'Gesamtgewinn', 'MwSt Gesamt']);
        const revRow2 = dash.addRow([stats.revenue, stats.profit, stats.tax]);

        [7, 8].forEach(r => {
            const row = dash.getRow(r);
            row.eachCell((cell, col) => {
                if (col <= 3) {
                    cell.alignment = { horizontal: 'center' };
                    cell.border = { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } };
                    if (r === 7) {
                        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF1F5F9' } };
                        cell.font = { bold: true };
                    } else {
                        cell.font = { size: 14, bold: true, color: { argb: col === 1 ? 'FF059669' : 'FF1E293B' } };
                        cell.numFmt = '#,##0.00" \u20AC"';
                    }
                }
            });
        });

        // Set column widths for Dashboard
        dash.columns = [{ width: 25 }, { width: 25 }, { width: 25 }, { width: 25 }, { width: 25 }];

        // --- SHEET 2: VERK\u00C4UFE ---
        const sheet = workbook.addWorksheet('Verk\u00E4ufe');

        const headers = [
            'Datum', 'Bestellnummer', 'Produktname', 'Kategorie', 'Menge',
            'Umsatz (\u20AC)', 'MwSt (\u20AC)', 'Geb\u00FChren (\u20AC)',
            'Gesamtkosten (\u20AC)', 'Gewinn (\u20AC)', 'Kaufen', 'Kauf Datum', 'Kauf Preis (\u20AC)', 'Zahlungsstatus',
            'Zahlungsart', 'EAN'
        ];

        const headerRow = sheet.addRow(headers);
        headerRow.height = 30;
        headerRow.eachCell((cell) => {
            cell.font = { bold: true, color: { argb: 'FF1E293B' } }; // Dark font
            cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF1F5F9' } }; // Light Slate
            cell.alignment = { vertical: 'middle', horizontal: 'center' };
            cell.border = {
                bottom: { style: 'medium', color: { argb: 'FFCBD5E1' } }
            };
        });

        // Strip illegal XML control characters that break Excel
        const cleanString = (str: string) => {
            if (!str) return '';
            // Only remove actual control characters that would break the .xlsx (XML) structure
            // Keep all UTF-8 characters as is.
            return str
                .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F-\x84\x86-\x9F\uFFFD]/g, '')
                .trim();
        };

        // Data processing
        invoices.forEach(inv => {
            const statusLabel = mapStatus(inv.status as string);
            const isCancelledOrRefunded = statusLabel === 'Storniert' || statusLabel === 'Gutschrift';

            inv.items.forEach(item => {
                const qty = Number(item.quantity) || 0;
                const rev = Number(item.grossAmount) || 0;
                const tax = Number(item.taxAmount) || 0;
                const fees = 0; // DB limited
                const costs = tax + fees;

                // If Cancelled or Refunded, Profit is 0
                const profit = isCancelledOrRefunded ? 0 : (rev - costs);

                const row = sheet.addRow([
                    inv.issueDate,
                    inv.orderNumber || (inv as any).shopifyOrderNumber || 'N/A',
                    cleanString(item.description || ''),
                    'Standard',
                    qty,
                    rev,
                    tax,
                    fees,
                    costs,
                    profit,
                    (item as any).kaufquelleSnapshot || '—',
                    (item as any).kaufdatumSnapshot ? new Date((item as any).kaufdatumSnapshot) : '—',
                    (item as any).kaufpreisSnapshot ? Number((item as any).kaufpreisSnapshot) : 0,
                    statusLabel,
                    inv.paymentMethod || 'Unbekannt',
                    (item as any).ean || ''
                ]);

                // Zebra Rows & Formatting
                const isEven = sheet.rowCount % 2 === 0;
                row.eachCell((cell, col) => {
                    if (isEven) {
                        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF9FAFB' } }; // Very light slate
                    } else {
                        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFFFFF' } };
                    }

                    cell.border = {
                        bottom: { style: 'thin', color: { argb: 'FFF1F5F9' } }
                    };

                    if (col === 1 || col === 12) cell.numFmt = 'dd.mm.yyyy';
                    if ((col >= 6 && col <= 10) || col === 13) {
                        cell.numFmt = '#,##0.00" \u20AC"';
                        // Conditional formatting for Profit (Column J=10)
                        if (col === 10) {
                            if (profit > 0) cell.font = { color: { argb: 'FF059669' }, bold: true };
                            if (profit < 0) cell.font = { color: { argb: 'FFDC2626' } };
                            if (profit === 0) cell.font = { color: { argb: 'FF94A3B8' } }; // Muted for 0
                        }
                    }
                });
            });
        });

        // Totals Row
        const lastRow = sheet.rowCount;
        const sumRow = sheet.addRow([]);
        sumRow.height = 25;
        sumRow.getCell(1).value = 'GESAMT';
        sumRow.getCell(1).font = { bold: true, size: 12 };

        ['F', 'G', 'H', 'I', 'J', 'M'].forEach((letter) => {
            const colIndex = letter.charCodeAt(0) - 64;
            const cell = sumRow.getCell(colIndex);
            cell.value = { formula: `SUM(${letter}2:${letter}${lastRow})` };
            cell.font = { bold: true, size: 12 };
            cell.numFmt = '#,##0.00" \u20AC"';
            cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF1F5F9' } };
        });

        // Freeze Header & Filter
        sheet.views = [{ state: 'frozen', xSplit: 0, ySplit: 1 }];
        sheet.autoFilter = { from: 'A1', to: { row: 1, column: headers.length } };

        // Column Widths
        sheet.columns = headers.map((h, i) => ({
            width: i === 2 ? 45 : (i === 1 ? 18 : 15)
        }));

        const buffer = await workbook.xlsx.writeBuffer();
        const filename = `Karinex_Finanzreport_${new Date().getFullYear()}_${(new Date().getMonth() + 1).toString().padStart(2, '0')}.xlsx`;

        return new NextResponse(buffer as any, {
            status: 200,
            headers: {
                'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
                'Content-Disposition': `attachment; filename="${filename}"`
            }
        });

    } catch (error: any) {
        console.error('Excel Export Error:', error);
        return new NextResponse(`Error: ${error.message}`, { status: 500 });
    }
}
