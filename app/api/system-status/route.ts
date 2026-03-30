import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function GET() {
    try {
        // 1. Check Database Connection
        const start = Date.now()
        // Run a simple query to check connection
        await prisma.$queryRaw`SELECT 1`
        const duration = Date.now() - start

        // 2. Check Connection Pool Metrics (if available, otherwise just success)
        // Prisma doesn't expose pool metrics easily in public API, but success means we have a slot.

        return NextResponse.json({
            status: 'healthy',
            database: 'connected',
            latency: `${duration}ms`,
            message: 'Database connection is healthy.'
        })

    } catch (error: any) {
        console.error('System Status Check Failed:', error)

        let status = 'error'
        let message = error.message
        let code = 'UNKNOWN'

        if (error.message.includes('Too many database connections')) {
            code = 'DB_OVERLOAD'
            message = 'Die Datenbank ist derzeit überlastet (Zu viele offene Verbindungen). Das passiert, wenn zu viele Anfragen gleichzeitig gestellt werden oder alte Verbindungen nicht geschlossen wurden.'
        } else if (error.message.includes('Connection terminated')) {
            code = 'DB_TIMEOUT'
            message = 'Die Verbindung zur Datenbank wurde unterbrochen.'
        }

        return NextResponse.json({
            status: 'unhealthy',
            database: 'disconnected',
            error: {
                code,
                message,
                originalError: error.message
            }
        }, { status: 503 })
    }
}
