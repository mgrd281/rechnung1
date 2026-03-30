'use client'

import { useState, useEffect } from 'react'

interface DiagnosticCheck {
    name: string;
    status: 'pass' | 'fail' | 'warn';
    message: string;
}

interface DiagnosticsResult {
    title: string;
    timestamp: string;
    checks: DiagnosticCheck[];
    summary: {
        passed: number;
        failed: number;
        warnings: number;
    };
    recommendations: string[];
}

interface WebhookLog {
    id: string;
    timestamp: string;
    topic: string;
    orderNumber: string;
    hmacValid: boolean | null;
    processed: boolean;
    error: string | null;
    processingTimeMs: number;
}

export default function WebhookDiagPage() {
    const [diagnostics, setDiagnostics] = useState<DiagnosticsResult | null>(null)
    const [webhookLogs, setWebhookLogs] = useState<WebhookLog[]>([])
    const [loading, setLoading] = useState(true)
    const [orderNumber, setOrderNumber] = useState('')
    const [processing, setProcessing] = useState(false)
    const [processResult, setProcessResult] = useState<any>(null)

    const runDiagnostics = async () => {
        setLoading(true)
        try {
            const [diagRes, logsRes] = await Promise.all([
                fetch('/api/diagnostics/webhook-test'),
                fetch('/api/webhooks/shopify/orders/create')
            ])

            if (diagRes.ok) {
                setDiagnostics(await diagRes.json())
            }

            if (logsRes.ok) {
                const logs = await logsRes.json()
                setWebhookLogs(logs.logs || [])
            }
        } catch (e) {
            console.error('Diagnostics error:', e)
        }
        setLoading(false)
    }

    useEffect(() => {
        runDiagnostics()
    }, [])

    const processOrder = async () => {
        if (!orderNumber.trim()) return
        setProcessing(true)
        setProcessResult(null)

        try {
            const res = await fetch('/api/diagnostics/webhook-test', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ orderNumber: orderNumber.trim(), sendEmail: true })
            })
            const data = await res.json()
            setProcessResult(data)

            // Refresh diagnostics after processing
            await runDiagnostics()
        } catch (e: any) {
            setProcessResult({ error: e.message })
        }
        setProcessing(false)
    }

    const getStatusIcon = (status: 'pass' | 'fail' | 'warn') => {
        switch (status) {
            case 'pass': return '✅'
            case 'fail': return '❌'
            case 'warn': return '⚠️'
        }
    }

    const getStatusColor = (status: 'pass' | 'fail' | 'warn') => {
        switch (status) {
            case 'pass': return '#22c55e'
            case 'fail': return '#ef4444'
            case 'warn': return '#f59e0b'
        }
    }

    return (
        <div style={{
            minHeight: '100vh',
            background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
            padding: '32px',
            fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
        }}>
            <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
                {/* Header */}
                <div style={{ marginBottom: '32px' }}>
                    <h1 style={{
                        fontSize: '28px',
                        fontWeight: '700',
                        color: '#fff',
                        marginBottom: '8px'
                    }}>
                        🔧 Webhook & Order Processing Diagnostics
                    </h1>
                    <p style={{ color: '#94a3b8', fontSize: '14px' }}>
                        Überprüfen Sie alle Komponenten der Bestellverarbeitung
                    </p>
                </div>

                {/* Summary Cards */}
                {diagnostics && (
                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(3, 1fr)',
                        gap: '16px',
                        marginBottom: '24px'
                    }}>
                        <div style={{
                            background: 'rgba(34, 197, 94, 0.15)',
                            border: '1px solid rgba(34, 197, 94, 0.3)',
                            borderRadius: '12px',
                            padding: '20px',
                            textAlign: 'center'
                        }}>
                            <div style={{ fontSize: '32px', fontWeight: '700', color: '#22c55e' }}>
                                {diagnostics.summary.passed}
                            </div>
                            <div style={{ color: '#86efac', fontSize: '14px' }}>Bestanden</div>
                        </div>
                        <div style={{
                            background: 'rgba(239, 68, 68, 0.15)',
                            border: '1px solid rgba(239, 68, 68, 0.3)',
                            borderRadius: '12px',
                            padding: '20px',
                            textAlign: 'center'
                        }}>
                            <div style={{ fontSize: '32px', fontWeight: '700', color: '#ef4444' }}>
                                {diagnostics.summary.failed}
                            </div>
                            <div style={{ color: '#fca5a5', fontSize: '14px' }}>Fehlgeschlagen</div>
                        </div>
                        <div style={{
                            background: 'rgba(245, 158, 11, 0.15)',
                            border: '1px solid rgba(245, 158, 11, 0.3)',
                            borderRadius: '12px',
                            padding: '20px',
                            textAlign: 'center'
                        }}>
                            <div style={{ fontSize: '32px', fontWeight: '700', color: '#f59e0b' }}>
                                {diagnostics.summary.warnings}
                            </div>
                            <div style={{ color: '#fcd34d', fontSize: '14px' }}>Warnungen</div>
                        </div>
                    </div>
                )}

                {/* Two Column Layout */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
                    {/* Diagnostics Panel */}
                    <div style={{
                        background: 'rgba(255, 255, 255, 0.03)',
                        border: '1px solid rgba(255, 255, 255, 0.1)',
                        borderRadius: '16px',
                        padding: '24px'
                    }}>
                        <div style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            marginBottom: '20px'
                        }}>
                            <h2 style={{ color: '#fff', fontSize: '18px', fontWeight: '600' }}>
                                System-Checks
                            </h2>
                            <button
                                onClick={runDiagnostics}
                                disabled={loading}
                                style={{
                                    background: '#3b82f6',
                                    color: '#fff',
                                    border: 'none',
                                    borderRadius: '8px',
                                    padding: '8px 16px',
                                    fontSize: '13px',
                                    fontWeight: '500',
                                    cursor: loading ? 'not-allowed' : 'pointer',
                                    opacity: loading ? 0.6 : 1
                                }}
                            >
                                {loading ? '...' : '🔄 Aktualisieren'}
                            </button>
                        </div>

                        {diagnostics?.checks.map((check, i) => (
                            <div key={i} style={{
                                display: 'flex',
                                alignItems: 'flex-start',
                                padding: '12px',
                                marginBottom: '8px',
                                background: 'rgba(255, 255, 255, 0.02)',
                                borderRadius: '8px',
                                borderLeft: `3px solid ${getStatusColor(check.status)}`
                            }}>
                                <span style={{ marginRight: '12px', fontSize: '18px' }}>
                                    {getStatusIcon(check.status)}
                                </span>
                                <div>
                                    <div style={{ color: '#fff', fontWeight: '500', fontSize: '14px' }}>
                                        {check.name}
                                    </div>
                                    <div style={{ color: '#94a3b8', fontSize: '12px', marginTop: '2px' }}>
                                        {check.message}
                                    </div>
                                </div>
                            </div>
                        ))}

                        {diagnostics?.recommendations && diagnostics.recommendations.length > 0 && (
                            <div style={{
                                marginTop: '20px',
                                padding: '16px',
                                background: 'rgba(239, 68, 68, 0.1)',
                                borderRadius: '8px',
                                border: '1px solid rgba(239, 68, 68, 0.2)'
                            }}>
                                <div style={{ color: '#fca5a5', fontWeight: '600', marginBottom: '8px' }}>
                                    ⚠️ Empfehlungen:
                                </div>
                                <ul style={{ margin: 0, paddingLeft: '20px', color: '#f87171', fontSize: '13px' }}>
                                    {diagnostics.recommendations.map((r, i) => (
                                        <li key={i} style={{ marginBottom: '4px' }}>{r}</li>
                                    ))}
                                </ul>
                            </div>
                        )}
                    </div>

                    {/* Manual Order Processing */}
                    <div style={{
                        background: 'rgba(255, 255, 255, 0.03)',
                        border: '1px solid rgba(255, 255, 255, 0.1)',
                        borderRadius: '16px',
                        padding: '24px'
                    }}>
                        <h2 style={{ color: '#fff', fontSize: '18px', fontWeight: '600', marginBottom: '20px' }}>
                            📦 Bestellung Manuell Verarbeiten
                        </h2>

                        <p style={{ color: '#94a3b8', fontSize: '13px', marginBottom: '16px' }}>
                            Geben Sie eine Bestellnummer ein, um diese manuell zu verarbeiten (z.B. #1001)
                        </p>

                        <div style={{ display: 'flex', gap: '12px', marginBottom: '16px' }}>
                            <input
                                type="text"
                                value={orderNumber}
                                onChange={(e) => setOrderNumber(e.target.value)}
                                placeholder="z.B. #1001"
                                style={{
                                    flex: 1,
                                    background: 'rgba(255, 255, 255, 0.05)',
                                    border: '1px solid rgba(255, 255, 255, 0.1)',
                                    borderRadius: '8px',
                                    padding: '12px 16px',
                                    color: '#fff',
                                    fontSize: '14px'
                                }}
                            />
                            <button
                                onClick={processOrder}
                                disabled={processing || !orderNumber.trim()}
                                style={{
                                    background: processing ? '#4b5563' : '#10b981',
                                    color: '#fff',
                                    border: 'none',
                                    borderRadius: '8px',
                                    padding: '12px 24px',
                                    fontSize: '14px',
                                    fontWeight: '500',
                                    cursor: processing ? 'not-allowed' : 'pointer'
                                }}
                            >
                                {processing ? 'Verarbeite...' : 'Verarbeiten'}
                            </button>
                        </div>

                        {processResult && (
                            <div style={{
                                padding: '16px',
                                background: processResult.error
                                    ? 'rgba(239, 68, 68, 0.15)'
                                    : 'rgba(34, 197, 94, 0.15)',
                                borderRadius: '8px',
                                border: `1px solid ${processResult.error
                                    ? 'rgba(239, 68, 68, 0.3)'
                                    : 'rgba(34, 197, 94, 0.3)'}`
                            }}>
                                {processResult.error ? (
                                    <div style={{ color: '#fca5a5' }}>
                                        <strong>Fehler:</strong> {processResult.error}
                                        {processResult.suggestion && (
                                            <div style={{ marginTop: '8px', fontSize: '12px' }}>
                                                💡 {processResult.suggestion}
                                            </div>
                                        )}
                                    </div>
                                ) : (
                                    <div style={{ color: '#86efac' }}>
                                        <div style={{ fontWeight: '600', marginBottom: '8px' }}>
                                            ✅ {processResult.message}
                                        </div>
                                        {processResult.invoice && (
                                            <div style={{ fontSize: '13px' }}>
                                                <div>Rechnung: {processResult.invoice.number}</div>
                                                <div>Status: {processResult.invoice.status}</div>
                                                <div>Gesamt: €{processResult.invoice.total?.toFixed(2)}</div>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Recent Webhooks */}
                        <h3 style={{
                            color: '#fff',
                            fontSize: '16px',
                            fontWeight: '600',
                            marginTop: '32px',
                            marginBottom: '16px'
                        }}>
                            📡 Letzte Webhook Events
                        </h3>

                        {webhookLogs.length === 0 ? (
                            <p style={{ color: '#6b7280', fontSize: '13px' }}>
                                Keine Webhook-Events gefunden. Webhooks werden nach dem nächsten Server-Neustart aufgezeichnet.
                            </p>
                        ) : (
                            <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
                                {webhookLogs.map((log) => (
                                    <div key={log.id} style={{
                                        padding: '12px',
                                        marginBottom: '8px',
                                        background: 'rgba(255, 255, 255, 0.02)',
                                        borderRadius: '8px',
                                        borderLeft: `3px solid ${log.error ? '#ef4444' : log.processed ? '#22c55e' : '#f59e0b'}`
                                    }}>
                                        <div style={{
                                            display: 'flex',
                                            justifyContent: 'space-between',
                                            marginBottom: '4px'
                                        }}>
                                            <span style={{ color: '#fff', fontWeight: '500', fontSize: '13px' }}>
                                                {log.orderNumber}
                                            </span>
                                            <span style={{ color: '#6b7280', fontSize: '11px' }}>
                                                {new Date(log.timestamp).toLocaleString('de-DE')}
                                            </span>
                                        </div>
                                        <div style={{ color: '#94a3b8', fontSize: '12px' }}>
                                            {log.topic} • {log.processingTimeMs}ms
                                            {log.error && <span style={{ color: '#f87171' }}> • {log.error}</span>}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* Quick Actions */}
                <div style={{
                    marginTop: '24px',
                    padding: '20px',
                    background: 'rgba(59, 130, 246, 0.1)',
                    border: '1px solid rgba(59, 130, 246, 0.2)',
                    borderRadius: '12px'
                }}>
                    <h3 style={{ color: '#93c5fd', fontSize: '14px', fontWeight: '600', marginBottom: '12px' }}>
                        🔗 Schnellaktionen
                    </h3>
                    <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                        <a href="/api/shopify/auto-sync" target="_blank" style={{
                            background: 'rgba(255, 255, 255, 0.1)',
                            color: '#fff',
                            padding: '8px 16px',
                            borderRadius: '6px',
                            textDecoration: 'none',
                            fontSize: '13px'
                        }}>
                            🔄 Auto-Sync starten
                        </a>
                        <a href="/api/diagnostics/shopify" target="_blank" style={{
                            background: 'rgba(255, 255, 255, 0.1)',
                            color: '#fff',
                            padding: '8px 16px',
                            borderRadius: '6px',
                            textDecoration: 'none',
                            fontSize: '13px'
                        }}>
                            🛍️ Shopify Status
                        </a>
                        <a href="/admin/email-status" style={{
                            background: 'rgba(255, 255, 255, 0.1)',
                            color: '#fff',
                            padding: '8px 16px',
                            borderRadius: '6px',
                            textDecoration: 'none',
                            fontSize: '13px'
                        }}>
                            📧 Email Status
                        </a>
                        <a href="/dashboard/rechnungen" style={{
                            background: 'rgba(255, 255, 255, 0.1)',
                            color: '#fff',
                            padding: '8px 16px',
                            borderRadius: '6px',
                            textDecoration: 'none',
                            fontSize: '13px'
                        }}>
                            📄 Alle Rechnungen
                        </a>
                    </div>
                </div>
            </div>
        </div>
    )
}
