import { NextResponse } from 'next/server'
import { writeFile } from 'fs/promises'
import path from 'path'
import { auth } from '@/lib/auth';

export const dynamic = 'force-dynamic'

export async function POST(req: Request) {
    try {
        const session = await auth()
        if (!session) {
            return new NextResponse('Unauthorized', { status: 401 })
        }

        const formData = await req.formData()
        const file = formData.get('file') as File

        if (!file) {
            return NextResponse.json({ error: 'No file uploaded' }, { status: 400 })
        }

        const bytes = await file.arrayBuffer()
        const buffer = Buffer.from(bytes)

        // Ensure user-storage directory exists
        const storageDir = path.join(process.cwd(), 'user-storage')
        try {
            await import('fs/promises').then(fs => fs.mkdir(storageDir, { recursive: true }))
        } catch (e) { }

        const filePath = path.join(storageDir, file.name)
        await writeFile(filePath, buffer)

        return NextResponse.json({
            success: true,
            message: `File saved successfully. Ready for processing.`,
            filename: file.name
        })

    } catch (error) {
        console.error('Upload error:', error)
        return NextResponse.json({ error: 'Upload failed' }, { status: 500 })
    }
}
