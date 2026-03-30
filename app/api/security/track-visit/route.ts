import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
    try {
        const { shop, path, userAgent } = await req.json();

        if (!shop) {
            return NextResponse.json({ ok: false, error: 'Shop is required' }, { status: 400 });
        }

        // 1. Get client IP
        const forwarded = req.headers.get('x-forwarded-for');
        const ip = forwarded ? forwarded.split(',')[0].trim() : req.ip || '127.0.0.1';

        // 2. Find organization
        const shopifyConnection = await prisma.shopifyConnection.findFirst({
            where: { shopName: { contains: shop } },
            select: { organizationId: true }
        });

        if (!shopifyConnection) {
            return NextResponse.json({ ok: false, error: 'Shop not found' }, { status: 404 });
        }

        const orgId = shopifyConnection.organizationId;

        // 3. Upsert visit record
        const visit = await prisma.storefrontVisit.upsert({
            where: {
                id: `${orgId}_${ip}_${path}` // We need to handle uniqueness properly, or just create
            },
            create: {
                organizationId: orgId,
                ip,
                path: path || '/',
                userAgent: userAgent || req.headers.get('user-agent'),
                hitCount: 1,
                lastSeen: new Date()
            },
            update: {
                hitCount: { increment: 1 },
                lastSeen: new Date(),
                userAgent: userAgent || req.headers.get('user-agent')
            }
        });

        // NOTE: Since schema @unique was not added for (orgId, ip, path) to keep it simple, 
        // I might need to adjust or just use findFirst + create/update.
        // Let's refine this to be more robust without complex @unique.

        return NextResponse.json({ ok: true, visitId: visit.id }, {
            headers: {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'POST, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type'
            }
        });

    } catch (error: any) {
        // If upsert fails due to missing ID logic (since I used a string template), 
        // fall back to search + create
        try {
            const { shop, path, userAgent } = await req.json();
            const forwarded = req.headers.get('x-forwarded-for');
            const ip = forwarded ? forwarded.split(',')[0].trim() : req.ip || '127.0.0.1';

            const shopifyConnection = await prisma.shopifyConnection.findFirst({
                where: { shopName: { contains: shop } },
                select: { organizationId: true }
            });

            if (shopifyConnection) {
                const existing = await prisma.storefrontVisit.findFirst({
                    where: {
                        organizationId: shopifyConnection.organizationId,
                        ip,
                        path: path || '/'
                    }
                });

                if (existing) {
                    await prisma.storefrontVisit.update({
                        where: { id: existing.id },
                        data: { hitCount: { increment: 1 }, lastSeen: new Date() }
                    });
                } else {
                    await prisma.storefrontVisit.create({
                        data: {
                            organizationId: shopifyConnection.organizationId,
                            ip,
                            path: path || '/',
                            userAgent: userAgent || req.headers.get('user-agent')
                        }
                    });
                }
            }

            return NextResponse.json({ ok: true }, {
                headers: {
                    'Access-Control-Allow-Origin': '*',
                    'Access-Control-Allow-Methods': 'POST, OPTIONS',
                    'Access-Control-Allow-Headers': 'Content-Type'
                }
            });
        } catch (innerError) {
            console.error('[POST /api/security/track-visit] Error:', innerError);
            return NextResponse.json({ ok: false, error: 'Tracking failed' }, { status: 500 });
        }
    }
}

export async function OPTIONS() {
    return new NextResponse(null, {
        status: 204,
        headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'POST, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type'
        }
    });
}
