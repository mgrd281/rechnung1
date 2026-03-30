import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

const MOCK_AUDIT_LOG = [
    {
        id: 'a1',
        user: 'Max Mustermann',
        action: 'ip_blocked',
        target: '45.12.89.231',
        timestamp: new Date().toISOString(),
        ip: '127.0.0.1'
    },
    {
        id: 'a2',
        user: 'System',
        action: 'rule_updated',
        target: 'Brute-Force Protection',
        timestamp: new Date(Date.now() - 1000 * 3600).toISOString(),
        ip: '::1'
    },
    {
        id: 'a3',
        user: 'Admin Tool',
        action: 'ip_unblocked',
        target: '192.168.1.1',
        timestamp: new Date(Date.now() - 1000 * 3600 * 24).toISOString(),
        ip: '10.0.0.1'
    }
]

export async function GET() {
    return NextResponse.json(MOCK_AUDIT_LOG)
}
