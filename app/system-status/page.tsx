'use client'

import { HeaderNavIcons } from '@/components/navigation/header-nav-icons'
import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { AlertCircle, CheckCircle, RefreshCw, Database, Server } from 'lucide-react'

export default function SystemStatusPage() {
    const [status, setStatus] = useState<any>(null)
    const [loading, setLoading] = useState(true)
    const [lastCheck, setLastCheck] = useState<Date | null>(null)

    const checkStatus = async () => {
        setLoading(true)
        try {
            const res = await fetch('/api/system-status', { cache: 'no-store' })
            const data = await res.json()
            setStatus(data)
            setLastCheck(new Date())
        } catch (e) {
            setStatus({
                status: 'error',
                message: 'Konnte Status-API nicht erreichen.'
            })
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        checkStatus()
    }, [])

    return (
        <div className="min-h-screen bg-gray-50 p-8 flex items-center justify-center">
            <Card className="w-full max-w-2xl shadow-lg">
                <CardHeader>
                    <div className="flex justify-between items-center">
                        <div className="flex items-center gap-4">
                            <HeaderNavIcons />
                            <div className="mx-1" />
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-blue-50 rounded-lg">
                                    <Server className="w-8 h-8 text-blue-600" />
                                </div>
                                <div>
                                    <CardTitle className="text-2xl">System Status</CardTitle>
                                    <CardDescription>Diagnose der Datenbank-Verbindung</CardDescription>
                                </div>
                            </div>
                        </div>
                        <Button onClick={checkStatus} disabled={loading} variant="outline">
                            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                            Aktualisieren
                        </Button>
                    </div>
                </CardHeader>
                <CardContent className="space-y-6">

                    {/* Status Indicator */}
                    <div className={`p-6 rounded-xl border-2 ${loading ? 'bg-gray-50 border-gray-200' :
                        status?.status === 'healthy' ? 'bg-green-50 border-green-200' :
                            'bg-red-50 border-red-200'
                        }`}>
                        <div className="flex items-start gap-4">
                            {loading ? (
                                <RefreshCw className="w-8 h-8 text-gray-400 animate-spin" />
                            ) : status?.status === 'healthy' ? (
                                <CheckCircle className="w-8 h-8 text-green-600" />
                            ) : (
                                <AlertCircle className="w-8 h-8 text-red-600" />
                            )}

                            <div className="space-y-1">
                                <h3 className="text-lg font-bold">
                                    {loading ? 'Prüfe Verbindung...' :
                                        status?.status === 'healthy' ? 'System läuft normal' :
                                            'Systemfehler erkannt'}
                                </h3>
                                <p className="text-gray-600">
                                    {loading ? 'Bitte warten...' :
                                        status?.status === 'healthy' ? status.message :
                                            status?.error?.message || 'Unbekannter Fehler'}
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Technical Details */}
                    {!loading && status && (
                        <div className="space-y-4">
                            <h4 className="font-semibold text-gray-900 border-b pb-2">Technische Details</h4>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="p-3 bg-white border rounded-lg">
                                    <div className="flex items-center gap-2 text-gray-500 mb-1">
                                        <Database className="w-4 h-4" />
                                        <span className="text-xs font-medium uppercase">Datenbank</span>
                                    </div>
                                    <p className={`font-mono font-bold ${status.database === 'connected' ? 'text-green-600' : 'text-red-600'}`}>
                                        {status.database === 'connected' ? 'VERBUNDEN' : 'GETRENNT'}
                                    </p>
                                </div>

                                <div className="p-3 bg-white border rounded-lg">
                                    <div className="flex items-center gap-2 text-gray-500 mb-1">
                                        <Server className="w-4 h-4" />
                                        <span className="text-xs font-medium uppercase">Latenz</span>
                                    </div>
                                    <p className="font-mono font-bold text-gray-900">
                                        {status.latency || '-'}
                                    </p>
                                </div>
                            </div>

                            {status.error && (
                                <div className="mt-4">
                                    <p className="text-sm font-semibold text-red-800 mb-2">Fehlercode: {status.error.code}</p>
                                    <div className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto text-xs font-mono">
                                        {status.error.originalError}
                                    </div>

                                    {status.error.code === 'DB_OVERLOAD' && (
                                        <div className="mt-4 p-4 bg-yellow-50 text-yellow-800 rounded-lg border border-yellow-200">
                                            <p className="font-bold mb-1">💡 Lösungsvorschlag:</p>
                                            <p>Die Datenbank hat zu viele offene Verbindungen. Dies löst sich normalerweise von selbst, wenn Sie <strong>5-10 Minuten warten</strong>, bis die inaktiven Verbindungen geschlossen werden.</p>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    )}

                    {lastCheck && (
                        <p className="text-xs text-center text-gray-400">
                            Zuletzt geprüft: {lastCheck.toLocaleTimeString()}
                        </p>
                    )}
                </CardContent>
            </Card>
        </div>
    )
}
