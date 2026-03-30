export const dynamic = "force-dynamic"
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
;
import { auth } from "@/lib/auth";

export async function POST(
    req: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const session = await auth();
        if (!session?.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const visitorSessionId = params.id;
        const { discountValue, discountType } = await req.json();

        const visitorSession = await prisma.visitorSession.findUnique({
            where: { id: visitorSessionId },
            include: { organization: { include: { shopifyConnection: true } } }
        });

        if (!visitorSession || !visitorSession.organization.shopifyConnection) {
            return NextResponse.json({ error: 'Shopify connection not found' }, { status: 404 });
        }

        const shopify = visitorSession.organization.shopifyConnection;

        // Mocking Shopify PriceRule & DiscountCode creation for now
        const code = `LIVE-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;

        // Create Session Action for the Tracker to pick up
        await prisma.sessionAction.create({
            data: {
                sessionId: visitorSessionId,
                type: 'SHOW_COUPON',
                payload: {
                    code,
                    discountValue,
                    discountType,
                    title: `Dein Exklusiver ${discountValue}${discountType === 'percentage' ? '%' : '€'} Rabatt`,
                    description: 'Nur für kurze Zeit verfügbar! Jetzt einlösen.'
                },
                status: 'PENDING'
            }
        });

        // Create Audit Log
        await prisma.auditLog.create({
            data: {
                organizationId: visitorSession.organizationId,
                userId: (session.user as any).id,
                action: 'CREATE_LIVE_COUPON',
                entityType: 'VISITOR_SESSION',
                entityId: visitorSessionId,
                details: {
                    code,
                    discountValue,
                    timestamp: new Date().toISOString()
                }
            }
        });

        return NextResponse.json({
            success: true,
            code,
            message: `Gutschein ${code} wurde erstellt.`
        });
    } catch (error: any) {
        console.error('[Coupon Action] Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
