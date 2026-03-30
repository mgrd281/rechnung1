
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('🌱 Starting seed...');

    // 1. Get Organization
    const organization = await prisma.organization.findFirst();
    if (!organization) {
        console.error('❌ No organization found. Please set up the app first.');
        return;
    }
    console.log('✅ Found organization:', organization.name);

    // 2. Get or Create Customer
    let customer = await prisma.customer.findFirst({
        where: { organizationId: organization.id }
    });

    if (!customer) {
        customer = await prisma.customer.create({
            data: {
                organizationId: organization.id,
                name: 'Test Customer',
                address: 'Test Street 1',
                zipCode: '12345',
                city: 'Test City',
                country: 'DE'
            }
        });
        console.log('✅ Created test customer');
    } else {
        console.log('✅ Found customer:', customer.name);
    }

    // 3. Get or Create Template
    let template = await prisma.invoiceTemplate.findFirst({
        where: { organizationId: organization.id }
    });

    if (!template) {
        template = await prisma.invoiceTemplate.create({
            data: {
                organizationId: organization.id,
                name: 'Default',
                htmlContent: '',
                cssContent: ''
            }
        });
        console.log('✅ Created default template');
    }

    // 4. Create Invoices with different dates
    const now = new Date();

    const dates = [
        { daysAgo: 0, label: 'Today' },
        { daysAgo: 5, label: '5 Days Ago' },
        { daysAgo: 15, label: '15 Days Ago' },
        { daysAgo: 45, label: '45 Days Ago' },
        { daysAgo: 400, label: '400 Days Ago (Last Year)' }
    ];

    for (const d of dates) {
        const date = new Date(now);
        date.setDate(date.getDate() - d.daysAgo);

        // Create Tax Rate if not exists
        const taxRate = await prisma.taxRate.upsert({
            where: { organizationId_name: { organizationId: organization.id, name: '19%' } },
            update: {},
            create: { organizationId: organization.id, name: '19%', rate: 0.19 }
        });

        const inv = await prisma.invoice.create({
            data: {
                organizationId: organization.id,
                customerId: customer.id,
                templateId: template.id,
                invoiceNumber: `TEST-${d.daysAgo}D-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
                issueDate: date,
                dueDate: new Date(date.getTime() + 14 * 24 * 60 * 60 * 1000),
                totalNet: 100,
                totalGross: 119,
                totalTax: 19,
                status: 'PAID',
                items: {
                    create: {
                        description: `Test Item (${d.label})`,
                        quantity: 1,
                        unitPrice: 100,
                        netAmount: 100,
                        grossAmount: 119,
                        taxAmount: 19,
                        taxRateId: taxRate.id
                    }
                }
            }
        });
        console.log(`✅ Created invoice ${inv.invoiceNumber} for date ${date.toISOString().split('T')[0]} (${d.label})`);
    }

    console.log('🎉 Seeding completed successfully!');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
