
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
    const searchParams = req.nextUrl.searchParams;
    const shop = searchParams.get('shop');

    if (!shop) {
        return NextResponse.json({ error: 'Shop parameter is required' }, { status: 400 });
    }

    try {
        // Force Single Tenant: Use Main Organization
        const organization = await prisma.organization.findFirst({
            orderBy: { createdAt: 'asc' }
        });

        if (!organization) {
            return NextResponse.json({ success: true, data: [] });
        }

        const rawProducts = await prisma.digitalProduct.findMany({
            include: {
                keys: {
                    select: { id: true, isUsed: true }
                }
            },
            orderBy: { createdAt: 'desc' }
        });

        const products = rawProducts.map(p => ({
            ...p,
            _count: {
                keys: p.keys.length
            },
            keys: p.keys.filter(k => !k.isUsed)
        }));

        return NextResponse.json({ success: true, data: products });
    } catch (error) {
        console.error('Error fetching shop digital products:', error);
        return NextResponse.json({ error: 'Failed to fetch products' }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    const searchParams = req.nextUrl.searchParams;
    const shop = searchParams.get('shop');

    if (!shop) {
        return NextResponse.json({ error: 'Shop parameter is required' }, { status: 400 });
    }

    try {
        const body = await req.json();
        const { title, shopifyProductId } = body;

        if (!title || !shopifyProductId) {
            return NextResponse.json({ error: 'Title and Shopify Product ID are required' }, { status: 400 });
        }

        // Force Single Tenant: Use Main Organization
        const organization = await prisma.organization.findFirst({
            orderBy: { createdAt: 'asc' }
        });

        if (!organization) {
            return NextResponse.json({ error: 'Main organization not found' }, { status: 404 });
        }

        // Check if product already exists
        const existingProduct = await prisma.digitalProduct.findUnique({
            where: { shopifyProductId }
        });

        if (existingProduct) {
            return NextResponse.json({ error: 'Product already exists' }, { status: 409 });
        }

        const product = await prisma.digitalProduct.create({
            data: {
                title,
                shopifyProductId,
                organizationId: organization.id,
                emailTemplate: ''
            }
        });

        return NextResponse.json({ success: true, data: product });

    } catch (error) {
        console.error('Error creating digital product:', error);
        return NextResponse.json({ error: 'Failed to create product' }, { status: 500 });
    }
}
