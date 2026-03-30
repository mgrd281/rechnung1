import { Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell, WidthType, AlignmentType, BorderStyle, HeadingLevel, VerticalAlign, PageNumber, NumberFormat, Footer, Header } from 'docx';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';

interface InvoiceData {
    number: string;
    date: string;
    dueDate: string;
    customer: {
        name: string;
        address: string;
        zipCode: string;
        city: string;
        country: string;
        email?: string;
    };
    organization: {
        name: string;
        address: string;
        zipCode: string;
        city: string;
        country: string;
        taxId?: string;
        bankName?: string;
        iban?: string;
        bic?: string;
        email?: string;
        phone?: string;
    };
    items: Array<{
        description: string;
        quantity: number;
        unitPrice: number;
        total: number;
    }>;
    subtotal: number;
    taxAmount: number;
    total: number;
    taxRate?: number;
}

export async function generateWordInvoice(data: InvoiceData): Promise<Buffer> {
    const { number, date, dueDate, customer, organization, items, subtotal, taxAmount, total, taxRate = 19 } = data;

    const doc = new Document({
        sections: [{
            properties: {},
            headers: {
                default: new Header({
                    children: [
                        new Paragraph({
                            alignment: AlignmentType.RIGHT,
                            children: [
                                new TextRun({
                                    text: organization.name.toUpperCase(),
                                    bold: true,
                                    size: 28,
                                    color: "1e293b",
                                }),
                            ],
                        }),
                        new Paragraph({
                            alignment: AlignmentType.RIGHT,
                            children: [
                                new TextRun({
                                    text: `${organization.address}, ${organization.zipCode} ${organization.city}`,
                                    size: 18,
                                    color: "64748b",
                                }),
                            ],
                        }),
                    ],
                }),
            },
            footers: {
                default: new Footer({
                    children: [
                        new Table({
                            width: { size: 100, type: WidthType.PERCENTAGE },
                            borders: {
                                top: { style: BorderStyle.SINGLE, size: 1, color: "cbd5e1" },
                                bottom: { style: BorderStyle.NONE },
                                left: { style: BorderStyle.NONE },
                                right: { style: BorderStyle.NONE },
                                insideHorizontal: { style: BorderStyle.NONE },
                                insideVertical: { style: BorderStyle.NONE },
                            },
                            rows: [
                                new TableRow({
                                    children: [
                                        new TableCell({
                                            children: [
                                                new Paragraph({
                                                    children: [
                                                        new TextRun({ text: "Bankverbindung:", bold: true, size: 16 }),
                                                        new TextRun({ text: `\n${organization.bankName || ''}`, size: 16 }),
                                                        new TextRun({ text: `\nIBAN: ${organization.iban || ''}`, size: 16 }),
                                                        new TextRun({ text: `\nBIC: ${organization.bic || ''}`, size: 16 }),
                                                    ],
                                                }),
                                            ],
                                        }),
                                        new TableCell({
                                            children: [
                                                new Paragraph({
                                                    children: [
                                                        new TextRun({ text: "Kontakt:", bold: true, size: 16 }),
                                                        new TextRun({ text: `\nTel: ${organization.phone || ''}`, size: 16 }),
                                                        new TextRun({ text: `\nEmail: ${organization.email || ''}`, size: 16 }),
                                                        new TextRun({ text: `\nSteuernummer: ${organization.taxId || ''}`, size: 16 }),
                                                    ],
                                                }),
                                            ],
                                        }),
                                        new TableCell({
                                            children: [
                                                new Paragraph({
                                                    alignment: AlignmentType.RIGHT,
                                                    children: [
                                                        new TextRun({
                                                            children: ["Seite ", PageNumber.CURRENT],
                                                            size: 16,
                                                        }),
                                                    ],
                                                }),
                                            ],
                                        }),
                                    ],
                                }),
                            ],
                        }),
                    ],
                }),
            },
            children: [
                // Spacer
                new Paragraph({ children: [new TextRun({ text: "", size: 24 })] }),

                // Address Table (Customer vs Invoice Meta)
                new Table({
                    width: { size: 100, type: WidthType.PERCENTAGE },
                    borders: {
                        top: { style: BorderStyle.NONE },
                        bottom: { style: BorderStyle.NONE },
                        left: { style: BorderStyle.NONE },
                        right: { style: BorderStyle.NONE },
                        insideHorizontal: { style: BorderStyle.NONE },
                        insideVertical: { style: BorderStyle.NONE },
                    },
                    rows: [
                        new TableRow({
                            children: [
                                new TableCell({
                                    width: { size: 60, type: WidthType.PERCENTAGE },
                                    children: [
                                        new Paragraph({
                                            children: [
                                                new TextRun({ text: customer.name, bold: true, size: 24 }),
                                                new TextRun({ text: `\n${customer.address}`, size: 22 }),
                                                new TextRun({ text: `\n${customer.zipCode} ${customer.city}`, size: 22 }),
                                                new TextRun({ text: `\n${customer.country}`, size: 22 }),
                                            ],
                                        }),
                                    ],
                                }),
                                new TableCell({
                                    width: { size: 40, type: WidthType.PERCENTAGE },
                                    verticalAlign: VerticalAlign.TOP,
                                    children: [
                                        new Table({
                                            width: { size: 100, type: WidthType.PERCENTAGE },
                                            borders: BorderStyle.NONE as any,
                                            rows: [
                                                new TableRow({
                                                    children: [
                                                        new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "Rechnungsnr.", size: 20, color: "64748b" })] })] }),
                                                        new TableCell({ children: [new Paragraph({ alignment: AlignmentType.RIGHT, children: [new TextRun({ text: number, bold: true, size: 20 })] })] }),
                                                    ],
                                                }),
                                                new TableRow({
                                                    children: [
                                                        new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "Datum", size: 20, color: "64748b" })] })] }),
                                                        new TableCell({ children: [new Paragraph({ alignment: AlignmentType.RIGHT, children: [new TextRun({ text: format(new Date(date), "dd.MM.yyyy"), size: 20 })] })] }),
                                                    ],
                                                }),
                                                new TableRow({
                                                    children: [
                                                        new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "Fällig am", size: 20, color: "64748b" })] })] }),
                                                        new TableCell({ children: [new Paragraph({ alignment: AlignmentType.RIGHT, children: [new TextRun({ text: format(new Date(dueDate), "dd.MM.yyyy"), size: 20 })] })] }),
                                                    ],
                                                }),
                                            ],
                                        }),
                                    ],
                                }),
                            ],
                        }),
                    ],
                }),

                new Paragraph({ children: [new TextRun({ text: "", size: 48 })] }),

                // Title
                new Paragraph({
                    heading: HeadingLevel.HEADING_1,
                    children: [
                        new TextRun({
                            text: "RECHNUNG",
                            bold: true,
                            size: 32,
                            color: "1e293b",
                        }),
                    ],
                }),

                new Paragraph({ children: [new TextRun({ text: "", size: 24 })] }),

                // Items Table
                new Table({
                    width: { size: 100, type: WidthType.PERCENTAGE },
                    rows: [
                        // Header
                        new TableRow({
                            tableHeader: true,
                            children: [
                                new TableCell({ shading: { fill: "f8fafc" }, children: [new Paragraph({ children: [new TextRun({ text: "Beschreibung", bold: true, size: 20 })] })] }),
                                new TableCell({ shading: { fill: "f8fafc" }, children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "Menge", bold: true, size: 20 })] })] }),
                                new TableCell({ shading: { fill: "f8fafc" }, children: [new Paragraph({ alignment: AlignmentType.RIGHT, children: [new TextRun({ text: "Einzelpreis", bold: true, size: 20 })] })] }),
                                new TableCell({ shading: { fill: "f8fafc" }, children: [new Paragraph({ alignment: AlignmentType.RIGHT, children: [new TextRun({ text: "Gesamt", bold: true, size: 20 })] })] }),
                            ],
                        }),
                        // Body
                        ...items.map(item => new TableRow({
                            children: [
                                new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: item.description, size: 20 })] })] }),
                                new TableCell({ children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: item.quantity.toString(), size: 20 })] })] }),
                                new TableCell({ children: [new Paragraph({ alignment: AlignmentType.RIGHT, children: [new TextRun({ text: item.unitPrice.toLocaleString('de-DE', { minimumFractionDigits: 2 }), size: 20 })] })] }),
                                new TableCell({ children: [new Paragraph({ alignment: AlignmentType.RIGHT, children: [new TextRun({ text: item.total.toLocaleString('de-DE', { minimumFractionDigits: 2 }), size: 20 })] })] }),
                            ],
                        })),
                    ],
                }),

                new Paragraph({ children: [new TextRun({ text: "", size: 24 })] }),

                // Totals
                new Table({
                    alignment: AlignmentType.RIGHT,
                    width: { size: 40, type: WidthType.PERCENTAGE },
                    borders: {
                        top: { style: BorderStyle.NONE },
                        bottom: { style: BorderStyle.NONE },
                        left: { style: BorderStyle.NONE },
                        right: { style: BorderStyle.NONE },
                        insideHorizontal: { style: BorderStyle.NONE },
                        insideVertical: { style: BorderStyle.NONE },
                    },
                    rows: [
                        new TableRow({
                            children: [
                                new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "Zwischensumme:", size: 20 })] })] }),
                                new TableCell({ children: [new Paragraph({ alignment: AlignmentType.RIGHT, children: [new TextRun({ text: subtotal.toLocaleString('de-DE', { style: 'currency', currency: 'EUR' }), size: 20 })] })] }),
                            ],
                        }),
                        new TableRow({
                            children: [
                                new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: `MwSt. (${taxRate}%):`, size: 20 })] })] }),
                                new TableCell({ children: [new Paragraph({ alignment: AlignmentType.RIGHT, children: [new TextRun({ text: taxAmount.toLocaleString('de-DE', { style: 'currency', currency: 'EUR' }), size: 20 })] })] }),
                            ],
                        }),
                        new TableRow({
                            children: [
                                new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "Gesamtbetrag:", bold: true, size: 24 })] })] }),
                                new TableCell({ children: [new Paragraph({ alignment: AlignmentType.RIGHT, children: [new TextRun({ text: total.toLocaleString('de-DE', { style: 'currency', currency: 'EUR' }), bold: true, size: 24 })] })] }),
                            ],
                        }),
                    ],
                }),
            ],
        }],
    });

    return await Packer.toBuffer(doc);
}
