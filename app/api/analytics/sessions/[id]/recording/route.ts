export const dynamic = "force-dynamic"
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
;
import { auth } from "@/lib/auth";

export async function GET(
    req: NextRequest,
    props: { params: Promise<{ id: string }> }
) {
    try {
        const session = await auth();
        if (!session?.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { id: sessionId } = await props.params;
        const { searchParams } = new URL(req.url);
        const chunkIndex = searchParams.get('chunk');

        console.log(`[Recording Fetch] Session: ${sessionId}, Mode: ${chunkIndex !== null ? 'Chunked' : 'Full'}`);

        if (searchParams.has('index')) {
            const count = await prisma.sessionRecording.count({ where: { sessionId } });
            return NextResponse.json({ success: true, totalChunks: count });
        }

        // Fetch recording chunks
        const recordings = await prisma.sessionRecording.findMany({
            where: { sessionId },
            orderBy: { createdAt: 'asc' },
            ...(chunkIndex !== null && {
                skip: parseInt(chunkIndex),
                take: 1
            })
        });

        console.log(`[Recording Fetch] Found ${recordings.length} chunks for session: ${sessionId}`);

        // Flatten events
        const allEvents = recordings.flatMap((r: any) => r.data as any[]);

        const response = NextResponse.json({
            success: true,
            events: allEvents,
            hasMore: chunkIndex !== null ? (await prisma.sessionRecording.count({ where: { sessionId } })) > (parseInt(chunkIndex) + 1) : false
        });

        // Add Cache-Control for chunked data to allow browser/CDN caching
        if (chunkIndex !== null) {
            response.headers.set('Cache-Control', 'public, max-age=60, s-maxage=60');
        }

        return response;
    } catch (error: any) {
        console.error('[Recording Fetch] Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
