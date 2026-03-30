import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
;
import { auth } from "@/lib/auth";

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
    let limit = 50;
    let offset = 0;
    let deviceType: string | null = null;
    let sessionId: string | null = null;
    try {
        const session = await auth();
        if (!session?.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        limit = parseInt(searchParams.get('limit') || '50');
        offset = parseInt(searchParams.get('offset') || '0');
        deviceType = searchParams.get('deviceType');
        sessionId = searchParams.get('sessionId');
        const search = searchParams.get('search');

        const user = await prisma.user.findUnique({
            where: { email: session.user.email! },
            select: { organizationId: true, role: true }
        });

        if (!user?.organizationId && user?.role !== 'ADMIN') {
            return NextResponse.json({ error: 'Organization not found' }, { status: 404 });
        }

        const where: any = {
            organizationId: user?.role === 'ADMIN' ? undefined : user.organizationId,
        };

        if (deviceType) where.deviceType = deviceType;
        if (sessionId) where.sessionId = sessionId;
        if (search) {
            where.OR = [
                { city: { contains: search, mode: 'insensitive' } },
                { visitor: { customIdentifier: { contains: search, mode: 'insensitive' } } },
                { visitorId: { contains: search, mode: 'insensitive' } }
            ];
        }

        const [sessionsRaw, total] = await Promise.all([
            prisma.visitorSession.findMany({
                where,
                include: {
                    visitor: true,
                    events: {
                        orderBy: {
                            timestamp: 'asc'
                        }
                    },
                    cartSnapshots: {
                        orderBy: {
                            timestamp: 'asc'
                        }
                    },
                    _count: {
                        select: { events: true }
                    }
                },
                orderBy: {
                    startTime: 'desc'
                },
                take: limit,
                skip: offset
            }),
            prisma.visitorSession.count({ where })
        ]);

        // --- Enterprise Logic: Smart Summary & Predictive Insights ---
        const sessions = sessionsRaw.map((s: any) => {
            const eventTypes = new Set(s.events.map((e: any) => e.type));
            const hasPurchase = s.purchaseStatus === 'PAID';
            const hasCheckout = eventTypes.has('start_checkout');
            const hasCart = eventTypes.has('add_to_cart');
            const hasProduct = eventTypes.has('view_product');

            // 1. Calculate Purchase Probability Score (%)
            let score = 5; // Base
            if (hasProduct) score += 15;
            if (hasCart) score += 25;
            if (hasCheckout) score += 40;
            if (s.isReturning) score += 10;
            if (s.intentScore > 50) score += 15;
            if (hasPurchase) score = 100;
            score = Math.min(score, 100);

            // 2. Generate Smart Summary (German)
            let summary = "";
            const source = s.sourceLabel || "Direktzugriff";
            const device = s.deviceType === 'mobile' ? 'Mobil' : 'Desktop';

            if (hasPurchase) {
                summary = `Kunde kam über ${source} (${device}) und hat erfolgreich bestellt.`;
            } else if (hasCheckout) {
                summary = `Besucher von ${source} erreichte den Checkout, hat aber noch nicht gekauft.`;
            } else if (hasCart) {
                summary = `Nutzer zeigt Interesse, Produkte im Warenkorb von ${source}.`;
            } else if (hasProduct) {
                summary = `Interessierter Besucher stöbert in Produkten via ${source}.`;
            } else {
                summary = `Neuer Besucher über ${source} (${device}) gelandet.`;
            }

            // 3. Recommended Action
            let action = "Beobachten";
            if (hasCheckout && !hasPurchase) action = "Rabattcode senden";
            else if (hasCart && !hasCheckout) action = "Retargeting-E-Mail";
            else if (score > 40) action = "VIP Markieren";

            return {
                ...s,
                enterprise: {
                    score,
                    summary,
                    recommendedAction: action,
                    isHighPotential: score > 60 && !hasPurchase
                }
            };
        });

        return NextResponse.json({
            sessions,
            pagination: {
                total,
                limit,
                offset
            }
        });

    } catch (error: any) {
        console.error('[Session History] FATAL ERROR:', {
            message: error.message,
            stack: error.stack,
            query: { limit, offset, deviceType, sessionId }
        });
        return NextResponse.json({ error: error.message, detail: error.stack }, { status: 500 });
    }
}
