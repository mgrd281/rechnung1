
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { shop } = body;

        if (!shop) {
            return NextResponse.json({ error: 'Shop parameter is required' }, { status: 400 });
        }

        // Clean shop domain
        const shopNameClean = shop.replace('.myshopify.com', '');
        const shopDomain = shop.includes('.') ? shop : `${shop}.myshopify.com`;

        // 0. Get the Main Organization (the one used by Desktop)
        const mainOrg = await prisma.organization.findFirst({
            orderBy: { createdAt: 'asc' } // The oldest one is likely the main one
        });

        // 1. Check if connection exists
        let connection = await prisma.shopifyConnection.findFirst({
            where: {
                OR: [
                    { shopName: shop },
                    { shopName: shopNameClean },
                    { shopName: shopDomain }
                ]
            },
            include: { organization: true }
        });

        if (connection) {
            // FIX: If connection exists but points to a different (likely empty/new) org, 
            // update it to point to the Main Org.
            if (mainOrg && connection.organizationId !== mainOrg.id) {
                console.log(`Fixing connection for ${shop}: Moving from ${connection.organizationId} to ${mainOrg.id}`);
                connection = await prisma.shopifyConnection.update({
                    where: { id: connection.id },
                    data: { organizationId: mainOrg.id },
                    include: { organization: true }
                });
            }

            return NextResponse.json({
                success: true,
                organization: connection.organization,
                isNew: false
            });
        }

        // 2. If not, create Organization, User, and Connection
        console.log(`Creating new organization setup for shop: ${shop}`);

        // Check if ANY organization exists (Single Tenant Logic)
        let newOrg = await prisma.organization.findFirst();

        if (!newOrg) {
            // Create Organization only if none exists
            newOrg = await prisma.organization.create({
                data: {
                    name: shopNameClean.charAt(0).toUpperCase() + shopNameClean.slice(1), // Capitalize
                    slug: `shopify-${shopNameClean}-${Date.now()}`,
                    address: 'Shopify Store Address', // Placeholder
                    zipCode: '00000',
                    city: 'Shopify City',
                    country: 'DE'
                }
            });
        }

        // Create Admin User for this shop
        // We use a generated email since we can't get the real one easily without OAuth
        const generatedEmail = `admin@${shopDomain}`;

        await prisma.user.create({
            data: {
                email: generatedEmail,
                name: 'Shopify Admin',
                role: 'ADMIN',
                organizationId: newOrg.id,
                emailVerified: new Date()
            }
        });

        // Create Shopify Connection
        connection = await prisma.shopifyConnection.create({
            data: {
                organizationId: newOrg.id,
                shopName: shopDomain,
                accessToken: 'placeholder_token', // We don't have a real token yet, but this unblocks the app
                scopes: 'read_orders,write_products',
                isActive: true
            },
            include: { organization: true }
        });

        return NextResponse.json({
            success: true,
            organization: newOrg,
            isNew: true,
            message: 'Organization and connection created successfully'
        });

    } catch (error) {
        console.error('Error in shopify setup:', error);
        return NextResponse.json({ error: 'Setup failed' }, { status: 500 });
    }
}
