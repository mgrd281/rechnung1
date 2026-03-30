import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        const shop = searchParams.get('shop');

        if (!shop) {
            return NextResponse.json({ ok: false, error: 'Shop is required' }, { status: 400 });
        }

        // 1. Get client IP
        const forwarded = req.headers.get('x-forwarded-for');
        const ip = forwarded ? forwarded.split(',')[0].trim() : req.ip || '127.0.0.1';

        // 2. Find organization by shop domain
        const shopifyConnection = await prisma.shopifyConnection.findFirst({
            where: { shopName: { contains: shop } },
            select: { organizationId: true }
        });

        if (!shopifyConnection) {
            return NextResponse.json({ ok: true, blocked: false });
        }

        const orgId = shopifyConnection.organizationId;

        // 3. Check Security Settings (Killswitch)
        const settings = await prisma.securitySettings.findUnique({
            where: { organizationId: orgId },
            select: { storefrontBlockingEnabled: true }
        });

        // If settings don't exist or blocking is disabled, allow access
        if (settings && !settings.storefrontBlockingEnabled) {
            return NextResponse.json({ ok: true, blocked: false });
        }

        // 4. Check if IP is blocked and active
        const blockedIp = await prisma.blockedIp.findUnique({
            where: {
                organizationId_ipAddress: {
                    organizationId: orgId,
                    ipAddress: ip
                }
            }
        });

        if (blockedIp && blockedIp.status === 'active') {
            return NextResponse.json({
                ok: true,
                blocked: true,
                redirectUrl: "/pages/access-blocked",
                reason: blockedIp.reason || 'Sicherheitsrichtlinie'
            }, {
                headers: {
                    'Access-Control-Allow-Origin': '*',
                    'Access-Control-Allow-Methods': 'GET, OPTIONS',
                    'Access-Control-Allow-Headers': 'Content-Type'
                }
            });
        }

        return NextResponse.json({ ok: true, blocked: false }, {
            headers: {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type'
            }
        });

    } catch (error: any) {
        console.error('[GET /api/security/check] Error:', error);
        return NextResponse.json({ ok: false, error: 'Internal server error' }, { status: 500 });
    }
}

export async function OPTIONS() {
    return new NextResponse(null, {
        status: 204,
        headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type'
        }
    });
}
