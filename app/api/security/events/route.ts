import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

// Mock events for the enterprise dashboard
const MOCK_EVENTS = [
    {
        id: '1',
        type: 'login_failed',
        severity: 'medium',
        timestamp: new Date(Date.now() - 1000 * 60 * 3).toISOString(), // 3 mins ago
        ip: '192.168.1.45',
        details: { user: 'admin', userAgent: 'Mozilla/5.0...', path: '/login', country: 'DE' }
    },
    {
        id: '2',
        type: 'suspicious_checkout',
        severity: 'critical',
        timestamp: new Date(Date.now() - 1000 * 60 * 15).toISOString(),
        ip: '45.12.89.231',
        details: { amount: '1,200 €', userAgent: 'Curl/7.68.0', path: '/api/checkout', country: 'CN' }
    },
    {
        id: '3',
        type: 'ip_blocked',
        severity: 'low',
        timestamp: new Date(Date.now() - 1000 * 60 * 45).toISOString(),
        ip: '88.16.2.19',
        details: { reason: 'Brute-force protection', admin: 'System' }
    },
    {
        id: '4',
        type: 'brute_force_detected',
        severity: 'critical',
        timestamp: new Date(Date.now() - 1000 * 60 * 120).toISOString(),
        ip: '109.201.12.5',
        details: { attempts: 154, target: '/api/auth' }
    }
]

export async function GET() {
    return NextResponse.json(MOCK_EVENTS)
}
