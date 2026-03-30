
import { generateArizonaPDF } from './lib/arizona-pdf-generator';

async function test() {
    const invoiceData = {
        id: "5738fbda-ca9b-4110-8e24-3e671bacab4d",
        number: "3691",
        date: new Date().toISOString(),
        dueDate: new Date(Date.now() + 86400000 * 14).toISOString(),
        subtotal: 67.22,
        taxRate: 19,
        taxAmount: 12.77,
        total: 79.99,
        status: "SENT",
        items: [
            {
                description: "UBISOFT Assassin's Creed Shadows PlayStation 5",
                quantity: 1,
                unitPrice: 67.22,
                total: 79.99,
                ean: "B0D9847GMJ",
                unit: "Stk.",
                vat: 19
            }
        ],
        customer: {
            name: "Laron Falck",
            address: "Guntramstraße",
            zipCode: "79106",
            city: "Freiburg",
            country: "DE",
            email: "laron.falck@web.de"
        },
        organization: {
            name: "KARINEX",
            address: "Havighorster Redder 51",
            zipCode: "22115",
            city: "Hamburg",
            country: "DE",
            taxId: "DE452578048",
            bankName: "N26",
            iban: "DE22 1001 1001 2087 5043 11",
            bic: "NTSBDEB1XXX"
        }
    };

    try {
        console.log('Generating PDF...');
        const doc = await generateArizonaPDF(invoiceData as any);
        console.log('✅ PDF generated successfully');
        console.log('Output format check:', typeof doc.output);
    } catch (err) {
        console.error('❌ PDF Generation Failed:', err);
    }
}

test().catch(console.error);
