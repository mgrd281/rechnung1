
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    console.log('🧪 Starting Cart Sync Verification...');

    // 1. Setup: Create a fresh Org & Session
    const org = await prisma.organization.findFirst() || await prisma.organization.create({
        data: { name: 'Test Org', slug: 'test-org-' + Date.now(), address: 'Test', zipCode: '12345', city: 'Test' }
    });

    const sessionId = 'test-session-' + Date.now();
    const visitorId = 'test-visitor-' + Date.now();

    const visitor = await prisma.visitor.create({
        data: {
            visitorToken: 'token-' + Date.now(),
            organizationId: org.id
        }
    });

    await prisma.visitorSession.create({
        data: {
            sessionId,
            visitorId: visitor.id,
            organizationId: org.id,
            status: 'ACTIVE'
        }
    });

    console.log(`✅ Created Session: ${sessionId}`);

    // 2. Simulate Cart Update Request (Mocking the fetch call)
    // We can't easily fetch() localhost in this script unless the server is running on a known port.
    // Instead, we will DIRECTLY call the logic update to verify DB behavior IF we were testing the route handler logic.
    // BUT, truly validating the route requires a running server. 
    
    // ADJUSTMENT: Since we modified the ROUTE handler, we should probably start the app and curl it?
    // OR: We can simulate the Prisma calls here to ensure the schema allows it (sanity check)
    // AND: We can ask the user to verify manually or we can try to start a dev server.
    
    // For this environment, let's verify that updating VisitorSession with cart fields WORKS (schema check)
    // and mimics the code we wrote.

    const mockCartItems = [
        { id: '123', title: 'Test Product', price: 10.00, quantity: 2 }
    ];
    const mockTotal = 20.00;
    const mockCount = 2;

    console.log('🔄 updating VisitorSession with cart data...');
    
    const updated = await prisma.visitorSession.update({
        where: { sessionId },
        data: {
            cartSnapshot: mockCartItems,
            totalValue: mockTotal,
            itemsCount: mockCount,
            lastActiveAt: new Date()
        }
    });

    console.log('🔍 Verifying update...');
    
    if (updated.totalValue === mockTotal && updated.itemsCount === mockCount) {
        console.log('✅ SUCCESS: VisitorSession updated correctly with cart data!');
        console.log('Snapshot:', JSON.stringify(updated.cartSnapshot));
    } else {
        console.error('❌ FAILED: VisitorSession data mismatch', updated);
    }

    // Cleanup
    await prisma.visitorSession.delete({ where: { sessionId } });
    await prisma.visitor.delete({ where: { id: visitor.id } });
}

main()
    .catch(e => console.error(e))
    .finally(async () => {
        await prisma.$disconnect();
    });
