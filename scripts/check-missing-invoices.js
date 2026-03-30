const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function findMissingInvoices() {
    try {
        console.log('🔍 Checking for missing invoices between #1000 and #3653...\n');

        // Fetch all invoices (we'll filter in JS since invoiceNumber is String)
        const allInvoices = await prisma.invoice.findMany({
            select: {
                invoiceNumber: true
            }
        });

        console.log(`✅ Found ${allInvoices.length} total invoices in database\n`);

        // Convert invoice numbers to integers where possible and filter range
        const invoiceNumbers = allInvoices
            .map(inv => {
                // Try to parse as number, handle formats like "SH-3653" or just "3653"
                const match = inv.invoiceNumber.match(/(\d+)$/);
                return match ? parseInt(match[1], 10) : null;
            })
            .filter(num => num !== null && num >= 1000 && num <= 3653)
            .sort((a, b) => a - b);

        console.log(`📝 Found ${invoiceNumbers.length} invoices in range 1000-3653\n`);

        // Create set of existing invoice numbers
        const existingNumbers = new Set(invoiceNumbers);

        // Find missing numbers
        const missingNumbers = [];
        for (let num = 1000; num <= 3653; num++) {
            if (!existingNumbers.has(num)) {
                missingNumbers.push(num);
            }
        }

        // Calculate expected total
        const expectedTotal = 3653 - 1000 + 1; // 2654 invoices
        const actualTotal = invoiceNumbers.length;
        const missingTotal = missingNumbers.length;

        console.log('📊 STATISTICS:');
        console.log('=====================================');
        console.log(`Expected invoices (1000-3653): ${expectedTotal}`);
        console.log(`Actual invoices found:         ${actualTotal}`);
        console.log(`Missing invoices:              ${missingTotal}`);
        console.log('=====================================\n');

        if (missingNumbers.length === 0) {
            console.log('✅ No missing invoices! All numbers from 1000 to 3653 exist.\n');
        } else {
            console.log('⚠️  MISSING INVOICE NUMBERS:');
            console.log('=====================================');

            // Group consecutive missing numbers for better readability
            let ranges = [];
            let start = missingNumbers[0];
            let prev = start;

            for (let i = 1; i < missingNumbers.length; i++) {
                if (missingNumbers[i] !== prev + 1) {
                    // End of range
                    if (start === prev) {
                        ranges.push(`#${start}`);
                    } else {
                        ranges.push(`#${start}-#${prev}`);
                    }
                    start = missingNumbers[i];
                }
                prev = missingNumbers[i];
            }

            // Add the last range
            if (start === prev) {
                ranges.push(`#${start}`);
            } else {
                ranges.push(`#${start}-#${prev}`);
            }

            // Print ranges (max 10 per line)
            for (let i = 0; i < ranges.length; i += 10) {
                console.log(ranges.slice(i, i + 10).join(', '));
            }

            console.log('=====================================\n');

            // Also print individual numbers if not too many
            if (missingNumbers.length <= 100) {
                console.log('📋 Individual missing numbers:');
                const chunks = [];
                for (let i = 0; i < missingNumbers.length; i += 20) {
                    chunks.push(missingNumbers.slice(i, i + 20).map(n => `#${n}`).join(', '));
                }
                chunks.forEach(chunk => console.log(chunk));
                console.log('\n');
            } else {
                console.log(`ℹ️  Too many missing invoices (${missingNumbers.length}) to list individually.\n`);
            }
        }

    } catch (error) {
        console.error('❌ Error:', error);
    } finally {
        await prisma.$disconnect();
    }
}

findMissingInvoices();
