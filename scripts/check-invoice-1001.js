const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkInvoice1001() {
    try {
        console.log('🔍 Checking Invoice #1001...\n');

        // Search for invoice 1001
        const invoice = await prisma.invoice.findFirst({
            where: {
                invoiceNumber: {
                    contains: '1001'
                }
            },
            include: {
                order: true,
                customer: true,
                items: true,
                organization: true
            }
        });

        if (!invoice) {
            console.log('❌ Invoice #1001 NOT FOUND in database\n');
            console.log('This explains why it\'s in the missing list.\n');

            // Check if there's an order with number 1001
            const order = await prisma.order.findFirst({
                where: {
                    OR: [
                        { shopifyOrderId: '1001' },
                        { shopifyOrderId: '#1001' },
                        { orderNumber: '1001' },
                        { orderNumber: '#1001' }
                    ]
                },
                include: {
                    invoices: true,
                    customer: true
                }
            });

            if (order) {
                console.log('✅ ORDER #1001 EXISTS\n');
                console.log('📋 Order Details:');
                console.log('=====================================');
                console.log(`ID: ${order.id}`);
                console.log(`Shopify Order ID: ${order.shopifyOrderId}`);
                console.log(`Order Number: ${order.orderNumber || 'N/A'}`);
                console.log(`Customer: ${order.customer?.name || 'Unknown'}`);
                console.log(`Status: ${order.status}`);
                console.log(`Created: ${order.createdAt}`);
                console.log(`Has Invoice: ${order.invoice ? 'YES' : 'NO'}`);

                if (order.invoice) {
                    console.log(`Linked Invoice Number: ${order.invoice.invoiceNumber}`);
                } else {
                    console.log('\n⚠️  PROBLEM IDENTIFIED:');
                    console.log('=====================================');
                    console.log('Order #1001 EXISTS but has NO INVOICE linked!');
                    console.log('This is why the invoice is missing.');
                    console.log('\nPossible reasons:');
                    console.log('1. Invoice creation failed during order processing');
                    console.log('2. Order was created manually without invoice');
                    console.log('3. Invoice was deleted but order remained');
                }
                console.log('=====================================\n');
            } else {
                console.log('❌ ORDER #1001 ALSO NOT FOUND\n');
                console.log('⚠️  PROBLEM:');
                console.log('=====================================');
                console.log('Neither invoice nor order #1001 exists in database.');
                console.log('This number was likely never created or was deleted.');
                console.log('=====================================\n');
            }

        } else {
            console.log('✅ Invoice #1001 FOUND!\n');
            console.log('📋 Invoice Details:');
            console.log('=====================================');
            console.log(`ID: ${invoice.id}`);
            console.log(`Invoice Number: ${invoice.invoiceNumber}`);
            console.log(`Customer: ${invoice.customer?.name || 'Unknown'}`);
            console.log(`Email: ${invoice.customer?.email || 'N/A'}`);
            console.log(`Status: ${invoice.status}`);
            console.log(`Total: ${invoice.totalGross} ${invoice.currency}`);
            console.log(`Issue Date: ${invoice.issueDate}`);
            console.log(`Created: ${invoice.createdAt}`);
            console.log(`\nOrder Link:`);
            console.log(`Has Order: ${invoice.order ? 'YES' : 'NO'}`);

            if (invoice.order) {
                console.log(`Order ID: ${invoice.order.id}`);
                console.log(`Shopify Order ID: ${invoice.order.shopifyOrderId}`);
                console.log(`Order Status: ${invoice.order.status}`);
            } else {
                console.log('\n⚠️  WARNING: Invoice exists but has NO ORDER linked!');
            }

            console.log(`\nItems: ${invoice.items?.length || 0}`);
            if (invoice.items && invoice.items.length > 0) {
                console.log('Products:');
                invoice.items.forEach((item, idx) => {
                    console.log(`  ${idx + 1}. ${item.description} - ${item.quantity}x ${item.unitPrice} ${invoice.currency}`);
                });
            }
            console.log('=====================================\n');
        }

        // Also check for similar invoice numbers (like SH-1001)
        const similarInvoices = await prisma.invoice.findMany({
            where: {
                invoiceNumber: {
                    contains: '1001'
                }
            },
            select: {
                invoiceNumber: true,
                id: true,
                status: true,
                createdAt: true
            }
        });

        if (similarInvoices.length > 0) {
            console.log(`\n🔎 Found ${similarInvoices.length} invoice(s) containing "1001":`);
            console.log('=====================================');
            similarInvoices.forEach(inv => {
                console.log(`${inv.invoiceNumber} (${inv.status}) - Created: ${inv.createdAt.toISOString().split('T')[0]}`);
            });
            console.log('=====================================\n');
        }

    } catch (error) {
        console.error('❌ Error:', error);
    } finally {
        await prisma.$disconnect();
    }
}

checkInvoice1001();
