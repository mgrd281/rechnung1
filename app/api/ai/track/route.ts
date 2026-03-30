import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(req: Request) {
    const { searchParams } = new URL(req.url)
    const id = searchParams.get('id')

    if (id) {
        try {
            // Increment view count in background
            await prisma.aIContentJob.update({
                where: { id },
                data: { viewCount: { increment: 1 } }
            })
        } catch (e) {
            console.error('Tracking Error:', e)
        }
    }

    // Return a 1x1 transparent GIF
    const buffer = Buffer.from('R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7', 'base64')
    return new NextResponse(buffer, {
        headers: {
            'Content-Type': 'image/gif',
            'Cache-Control': 'no-cache, no-store, must-revalidate'
        }
    })
}
