export const dynamic = "force-dynamic"
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
    try {
        const session = await auth();

        if (!session?.user?.email) {
            return NextResponse.json({
                success: false,
                error: 'Not authenticated'
            }, { status: 401 });
        }

        const user = await prisma.user.findUnique({
            where: { email: session.user.email },
            include: {
                organization: {
                    include: {
                        shopifyConnection: true
                    }
                }
            }
        });

        // No disconnect needed for shared instance

        if (!user) {
            return NextResponse.json({
                success: false,
                error: 'User not found'
            }, { status: 404 });
        }

        return NextResponse.json({
            success: true,
            user: {
                id: user.id,
                email: user.email,
                name: user.name,
                role: user.role,
                organization: user.organization ? {
                    id: user.organization.id,
                    name: user.organization.name,
                    shopifyConnection: user.organization.shopifyConnection ? {
                        shopDomain: user.organization.shopifyConnection.shopName
                    } : null
                } : null
            }
        });

    } catch (error: any) {
        console.error('Error fetching user:', error);
        return NextResponse.json(
            { success: false, error: error.message || 'Failed to fetch user' },
            { status: 500 }
        );
    }
}
