import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';

export const dynamic = 'force-dynamic';

// IP validation helper
function validateIpAddress(ip: string): { valid: boolean; type?: 'IPv4' | 'IPv6'; error?: string } {
    // IPv4 validation
    const ipv4Regex = /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;
    // IPv6 validation (simplified - matches full format)
    const ipv6Regex = /^(?:[0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}$/;
    // IPv6 compressed format
    const ipv6CompressedRegex = /^((?:[0-9a-fA-F]{1,4}(?::[0-9a-fA-F]{1,4})*)?)::((?:[0-9a-fA-F]{1,4}(?::[0-9a-fA-F]{1,4})*)?)$/;

    if (ipv4Regex.test(ip)) {
        return { valid: true, type: 'IPv4' };
    }

    if (ipv6Regex.test(ip) || ipv6CompressedRegex.test(ip)) {
        return { valid: true, type: 'IPv6' };
    }

    return {
        valid: false,
        error: 'Ungültige IP-Adresse. Bitte geben Sie eine gültige IPv4 (z.B. 192.168.1.1) oder IPv6 Adresse ein.'
    };
}

export async function GET(req: NextRequest) {
    try {
        const session = await auth();
        if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const user = await prisma.user.findUnique({
            where: { email: session.user?.email! },
            select: { organizationId: true }
        });

        if (!user?.organizationId) {
            return NextResponse.json({ error: 'Keine Organisation gefunden' }, { status: 404 });
        }

        const blockedIps = await prisma.blockedIp.findMany({
            where: { organizationId: user.organizationId },
            orderBy: { createdAt: 'desc' }
        });

        return NextResponse.json({ blockedIps });
    } catch (error: any) {
        console.error('[GET /api/security/blocked-ips] Error:', error);
        return NextResponse.json({ error: 'Interner Serverfehler' }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    try {
        const session = await auth();
        if (!session) {
            return NextResponse.json({ error: 'Nicht autorisiert' }, { status: 401 });
        }

        const { ipAddress, reason } = await req.json();

        // Validate IP address is provided
        if (!ipAddress || typeof ipAddress !== 'string' || !ipAddress.trim()) {
            return NextResponse.json({
                error: 'IP-Adresse ist erforderlich'
            }, { status: 400 });
        }

        const trimmedIp = ipAddress.trim();

        // Validate IP format
        const validation = validateIpAddress(trimmedIp);
        if (!validation.valid) {
            return NextResponse.json({
                error: validation.error
            }, { status: 400 });
        }

        const user = await prisma.user.findUnique({
            where: { email: session.user?.email! },
            select: {
                organizationId: true,
                id: true,
                email: true
            }
        });

        if (!user?.organizationId) {
            return NextResponse.json({
                error: 'Keine Organisation gefunden'
            }, { status: 404 });
        }

        // Check for existing block
        const existing = await prisma.blockedIp.findUnique({
            where: {
                organizationId_ipAddress: {
                    organizationId: user.organizationId,
                    ipAddress: trimmedIp
                }
            }
        });

        if (existing) {
            // Update existing block
            const updated = await prisma.blockedIp.update({
                where: { id: existing.id },
                data: {
                    reason: reason?.trim() || null,
                    createdAt: new Date() // Update timestamp
                }
            });

            console.log(`[POST /api/security/blocked-ips] Updated existing block:`, {
                ip: trimmedIp,
                type: validation.type,
                userId: user.id,
                orgId: user.organizationId
            });

            return NextResponse.json({
                blockedIp: updated,
                updated: true
            });
        }

        // Create new block
        const blockedIp = await prisma.blockedIp.create({
            data: {
                organizationId: user.organizationId,
                ipAddress: trimmedIp,
                reason: reason?.trim() || null
            }
        });

        console.log(`[POST /api/security/blocked-ips] Created new block:`, {
            ip: trimmedIp,
            type: validation.type,
            userId: user.id,
            orgId: user.organizationId,
            reason: reason?.trim() || 'none'
        });

        return NextResponse.json({ blockedIp });
    } catch (error: any) {
        console.error('[POST /api/security/blocked-ips] Error:', {
            error: error.message,
            stack: error.stack
        });
        return NextResponse.json({
            error: `Fehler: ${error.message}`
        }, { status: 500 });
    }
}

export async function DELETE(req: NextRequest) {
    try {
        const session = await auth();
        if (!session) {
            return NextResponse.json({ error: 'Nicht autorisiert' }, { status: 401 });
        }

        const { searchParams } = new URL(req.url);
        const id = searchParams.get('id');

        if (!id) {
            return NextResponse.json({ error: 'ID ist erforderlich' }, { status: 400 });
        }

        const user = await prisma.user.findUnique({
            where: { email: session.user?.email! },
            select: { organizationId: true, id: true }
        });

        if (!user?.organizationId) {
            return NextResponse.json({ error: 'Keine Organisation gefunden' }, { status: 404 });
        }

        // Verify the blocked IP belongs to the user's organization
        const blockedIp = await prisma.blockedIp.findUnique({
            where: { id }
        });

        if (!blockedIp) {
            return NextResponse.json({ error: 'Sperre nicht gefunden' }, { status: 404 });
        }

        if (blockedIp.organizationId !== user.organizationId) {
            return NextResponse.json({ error: 'Nicht autorisiert' }, { status: 403 });
        }

        await prisma.blockedIp.delete({ where: { id } });

        console.log(`[DELETE /api/security/blocked-ips] Removed block:`, {
            id,
            ip: blockedIp.ipAddress,
            userId: user.id,
            orgId: user.organizationId
        });

        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error('[DELETE /api/security/blocked-ips] Error:', {
            error: error.message,
            stack: error.stack
        });
        return NextResponse.json({
            error: 'Fehler beim Entfernen der Sperre. Bitte versuchen Sie es erneut.'
        }, { status: 500 });
    }
}

