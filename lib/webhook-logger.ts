import { prisma } from '@/lib/prisma'

// Global in-memory log for the current process life
// This will survive between requests as long as the server is running
const globalWebhookLogs: any[] = []

export function logWebhookActivity(data: {
    topic: string,
    orderName: string,
    status: 'SUCCESS' | 'FAILED',
    message: string,
    details?: any
}) {
    const entry = {
        id: `wb-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
        timestamp: new Date().toISOString(),
        ...data
    }

    globalWebhookLogs.unshift(entry)

    // Keep only last 100
    if (globalWebhookLogs.length > 100) {
        globalWebhookLogs.pop()
    }

    console.log(`📡 WEBHOOK_LOG [${data.status}]: ${data.message} (${data.orderName})`)
}

export function getWebhookLogs() {
    return [...globalWebhookLogs]
}
