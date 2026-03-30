
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('🧹 Starting cleanup of test data...');

    // 1. Find the Test Customer
    const testCustomers = await prisma.customer.findMany({
        where: {
            name: 'Test Customer'
        }
    });

    console.log(`Found ${testCustomers.length} customers with name "Test Customer"`);

    for (const customer of testCustomers) {
        // 2. Delete Invoices for this customer
        const deletedInvoices = await prisma.invoice.deleteMany({
            where: {
                customerId: customer.id
            }
        });
        console.log(`Deleted ${deletedInvoices.count} invoices for customer ${customer.id}`);

        // 3. Delete the Customer
        await prisma.customer.delete({
            where: {
                id: customer.id
            }
        });
        console.log(`Deleted customer ${customer.id}`);
    }

    // 4. Also clean up any invoices with number starting with TEST- just in case
    const deletedTestInvoices = await prisma.invoice.deleteMany({
        where: {
            invoiceNumber: {
                startsWith: 'TEST-'
            }
        }
    });
    console.log(`Deleted ${deletedTestInvoices.count} additional invoices with number starting with "TEST-"`);

    console.log('✨ Cleanup completed successfully!');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
