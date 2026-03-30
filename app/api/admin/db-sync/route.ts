import { NextResponse } from 'next/server'
import { exec } from 'child_process'
import { promisify } from 'util'
import { prisma } from '@/lib/prisma'

const execPromise = promisify(exec)

export async function GET(req: Request) {
    const { searchParams } = new URL(req.url)
    const key = searchParams.get('key')

    // Emergency Secret Key to allow sync without session issues
    if (key !== 'sync123') {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    try {
        console.log('🔄 STARTING DATABASE SCHEMA SYNC...')

        // This will force the schema to update in Railway
        const { stdout, stderr } = await execPromise('npx prisma db push --accept-data-loss')

        return NextResponse.json({
            success: true,
            message: 'Database schema synchronized!',
            output: stdout,
            error: stderr
        })
    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 })
    }
}
