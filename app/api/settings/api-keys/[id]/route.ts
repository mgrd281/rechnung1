export const dynamic = "force-dynamic"
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth';

export async function DELETE(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await auth()
        if (!session || !session.user || !session.user.email) {
            return new NextResponse('Unauthorized', { status: 401 })
        }

        const { id } = await params;

        const user = await prisma.user.findUnique({
            where: { email: session.user.email }
        })

        if (!user || !user.organizationId) {
            return new NextResponse('Organization not found', { status: 404 })
        }

        // Ensure key belongs to user's organization
        const count = await prisma.apiKey.count({
            where: {
                id: id,
                organizationId: user.organizationId
            }
        })

        if (count === 0) {
            return new NextResponse('Key not found or unauthorized', { status: 404 })
        }

        await prisma.apiKey.delete({
            where: { id: id }
        })

        return new NextResponse(null, { status: 204 })
    } catch (error) {
        console.error('Error deleting API key:', error)
        return new NextResponse('Internal Error', { status: 500 })
    }
}
