export type LogLevel = 'info' | 'warn' | 'error' | 'success'

export interface StructuredLog {
    timestamp: string
    level: LogLevel
    message: string
    data?: any
}

export const runtimeLogs: StructuredLog[] = []

export function log(message: string, level: LogLevel = 'info', data?: any) {
    const timestamp = new Date().toISOString()
    const logEntry: StructuredLog = {
        timestamp,
        level,
        message,
        data
    }

    console.log(`[${level.toUpperCase()}] ${message}`, data || '')

    // Keep only last 100 logs
    if (runtimeLogs.length > 100) {
        runtimeLogs.shift()
    }
    runtimeLogs.push(logEntry)
}

// Helper to get logs
export function getLogs() {
    return [...runtimeLogs].reverse()
}
