'use client'

import { useState, useEffect, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Loader2, RefreshCw, CheckCircle, XCircle, AlertTriangle, Database, Server, ShoppingBag, Upload, Download } from 'lucide-react'

export default function DiagnosticsPage() {
    const [report, setReport] = useState<any>(null)
    const [loading, setLoading] = useState(false)
    const [uploading, setUploading] = useState(false)
    const [file, setFile] = useState<File | null>(null)
    const fileInputRef = useRef<HTMLInputElement>(null)

    useEffect(() => {
        fetchDiagnostics()
    }, [])

    const fetchDiagnostics = async () => {
        setLoading(true)
        try {
            const res = await fetch('/api/diagnostics/system')
            const data = await res.json()
            setReport(data)
        } catch (error) {
            console.error('Failed to fetch diagnostics:', error)
        } finally {
            setLoading(false)
        }
    }

    const [progress, setProgress] = useState(0)
    const [status, setStatus] = useState('')

    const handleUpload = async () => {
        if (!file) return

        setUploading(true)
        setProgress(0)
        setStatus('Wird hochgeladen...')

        const formData = new FormData()
        formData.append('file', file)
        formData.append('type', 'restore')

        try {
            // Step 1: Upload File
            const uploadRes = await fetch('/api/diagnostics/upload', {
                method: 'POST',
                body: formData
            })

            if (!uploadRes.ok) throw new Error('Upload failed')

            const uploadData = await uploadRes.json()
            const filename = uploadData.filename

            // Step 2: Process in Chunks
            setStatus('Daten werden verarbeitet...')
            let offset = 0
            let done = false
            let total = 0

            while (!done) {
                const importRes = await fetch('/api/diagnostics/import', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ filename, offset, limit: 10 })
                })

                if (!importRes.ok) {
                    const errorData = await importRes.json()
                    throw new Error(errorData.error || 'Import failed')
                }

                const importData = await importRes.json()
                offset = importData.offset
                done = importData.done
                total = importData.total

                // Update Progress
                const percentage = Math.min(100, Math.round((offset / total) * 100))
                setProgress(percentage)
                setStatus(`Verarbeite ${Math.min(offset, total)} von ${total} Einträgen...`)
            }

            alert(`Erfolg! Alle Daten wurden wiederhergestellt.`)
            fetchDiagnostics()
            setFile(null)
            setProgress(0)
            setStatus('')
        } catch (error: any) {
            console.error('Process error:', error)
            alert(`Fehler: ${error.message || 'Unbekannter Fehler'}`)
        } finally {
            setUploading(false)
        }
    }

    const triggerUpload = () => {
        fileInputRef.current?.click()
    }

    const StatusIcon = ({ status }: { status: boolean }) => {
        return status ? <CheckCircle className="w-5 h-5 text-green-500" /> : <XCircle className="w-5 h-5 text-red-500" />
    }

    if (loading && !report) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-gray-50 p-8">
            <div className="max-w-5xl mx-auto space-y-6">
                <div className="flex justify-between items-center">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900">System Diagnostics</h1>
                        <p className="text-gray-500">Überprüfen Sie den Status Ihres Systems und Ihrer Daten.</p>
                    </div>
                    <div className="flex gap-3">
                        <Button onClick={fetchDiagnostics} disabled={loading}>
                            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                            Aktualisieren
                        </Button>
                    </div>
                </div>

                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 mt-8">
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Download className="h-5 w-5" />
                                Backup erstellen
                            </CardTitle>
                            <CardDescription>
                                Laden Sie eine vollständige Sicherungskopie Ihrer Datenbank herunter.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <Button
                                className="w-full"
                                onClick={async () => {
                                    try {
                                        const res = await fetch('/api/diagnostics/backup')
                                        if (!res.ok) throw new Error('Backup failed')
                                        const blob = await res.blob()
                                        const url = window.URL.createObjectURL(blob)
                                        const a = document.createElement('a')
                                        a.href = url
                                        a.download = `backup-${new Date().toISOString().split('T')[0]}.json`
                                        document.body.appendChild(a)
                                        a.click()
                                        window.URL.revokeObjectURL(url)
                                        document.body.removeChild(a)
                                    } catch (e) {
                                        alert('Fehler beim Erstellen des Backups')
                                    }
                                }}
                            >
                                Backup herunterladen (JSON)
                            </Button>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Upload className="h-5 w-5" />
                                Daten wiederherstellen
                            </CardTitle>
                            <CardDescription>
                                Laden Sie JSON-Dateien hoch, um fehlende Daten wiederherzustellen.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid w-full max-w-sm items-center gap-1.5">
                                <Label htmlFor="file-upload">JSON Datei auswählen</Label>
                                <Input id="file-upload" type="file" accept=".json" onChange={(e) => setFile(e.target.files?.[0] || null)} />
                            </div>
                            <Button
                                className="w-full"
                                disabled={!file || !!uploading}
                                onClick={handleUpload}
                            >
                                {uploading ? (
                                    <div className="flex flex-col items-center w-full gap-2">
                                        <div className="flex items-center gap-2">
                                            <Loader2 className="h-4 w-4 animate-spin" />
                                            <span>{status} ({progress}%)</span>
                                        </div>
                                        <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                                            <div
                                                className="h-full bg-blue-600 transition-all duration-300"
                                                style={{ width: `${progress}%` }}
                                            />
                                        </div>
                                    </div>
                                ) : (
                                    'JSON Datei hochladen'
                                )}
                            </Button>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <ShoppingBag className="h-5 w-5" />
                                Shopify Import
                            </CardTitle>
                            <CardDescription>
                                Importieren Sie fehlende Bestellungen direkt von Shopify.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <Button
                                className="w-full"
                                disabled={loading || !!uploading}
                                onClick={async () => {
                                    if (!confirm('Möchten Sie wirklich alle fehlenden Bestellungen von Shopify importieren? Dies kann einige Minuten dauern.')) return;

                                    setUploading(true)
                                    setStatus('Starte Import...')
                                    setProgress(0)

                                    try {
                                        let pageInfo = null
                                        let hasMore = true
                                        let totalImported = 0
                                        let totalSkipped = 0
                                        let pageCount = 0

                                        while (hasMore) {
                                            pageCount++
                                            setStatus(`Importiere Seite ${pageCount}... (Importiert: ${totalImported})`)

                                            // @ts-ignore
                                            const currentBatchResponse = await fetch('/api/diagnostics/import-shopify', {
                                                method: 'POST',
                                                headers: { 'Content-Type': 'application/json' },
                                                body: JSON.stringify({ page_info: pageInfo, limit: 50 })
                                            })

                                            // @ts-ignore
                                            const currentBatchData = await currentBatchResponse.json()
                                            if (!currentBatchResponse.ok) throw new Error(currentBatchData.error)

                                            totalImported += currentBatchData.imported
                                            totalSkipped += currentBatchData.skipped
                                            pageInfo = currentBatchData.next_page_info
                                            hasMore = currentBatchData.has_more

                                            // Artificial progress since we don't know total pages
                                            setProgress((prev) => Math.min(prev + 5, 95))
                                        }

                                        setProgress(100)
                                        alert(`Import erfolgreich abgeschlossen!\nImportiert: ${totalImported}\nÜbersprungen: ${totalSkipped}`)
                                        fetchDiagnostics()
                                    } catch (e: any) {
                                        console.error(e)
                                        alert(`Fehler: ${e.message}`)
                                    } finally {
                                        setUploading(false)
                                        setStatus('')
                                        setProgress(0)
                                    }
                                }}
                            >
                                {uploading ? (
                                    <div className="flex flex-col items-center w-full gap-2">
                                        <div className="flex items-center gap-2">
                                            <Loader2 className="h-4 w-4 animate-spin" />
                                            <span>{status}</span>
                                        </div>
                                        <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                                            <div
                                                className="h-full bg-blue-600 transition-all duration-300"
                                                style={{ width: `${progress}%` }}
                                            />
                                        </div>
                                    </div>
                                ) : (
                                    'Fehlende Rechnungen importieren'
                                )}
                            </Button>
                        </CardContent>
                    </Card>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Storage Health */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Database className="w-5 h-5" />
                                Datenspeicher (Local JSON)
                            </CardTitle>
                            <CardDescription>Status der lokalen JSON-Dateien</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {report?.storage && Object.entries(report.storage).map(([key, val]: [string, any]) => {
                                if (key === 'error') return null
                                return (
                                    <div key={key} className="flex items-center justify-between p-3 bg-white rounded-lg border">
                                        <div className="flex items-center gap-3">
                                            <StatusIcon status={val.exists} />
                                            <div>
                                                <p className="font-medium capitalize">{key}</p>
                                                <p className="text-xs text-gray-500">{val.path}</p>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <p className="font-bold">{val.count !== undefined ? val.count : '-'} Einträge</p>
                                            <p className="text-xs text-gray-500">{val.stats?.size || '0 KB'}</p>
                                        </div>
                                    </div>
                                )
                            })}
                            {report?.storage?.error && (
                                <div className="p-3 bg-red-50 text-red-700 rounded-lg text-sm">
                                    Error: {report.storage.error}
                                </div>
                            )}

                            <div className="p-4 bg-blue-50 text-blue-800 rounded-lg text-sm">
                                <p className="font-semibold mb-1">Daten wiederherstellen:</p>
                                <p>Wenn Dateien fehlen (rotes X), laden Sie bitte Ihre lokalen <code>invoices.json</code> oder <code>customers.json</code> Dateien über den "JSON Datei hochladen" Button oben rechts hoch.</p>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Shopify Connection */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <ShoppingBag className="w-5 h-5" />
                                Shopify Verbindung
                            </CardTitle>
                            <CardDescription>Status der API-Verbindung</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className={`p-4 rounded-lg border flex items-start gap-3 ${report?.shopify?.status === 'connected' ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
                                {report?.shopify?.status === 'connected' ? (
                                    <CheckCircle className="w-5 h-5 text-green-600 mt-0.5" />
                                ) : (
                                    <AlertTriangle className="w-5 h-5 text-red-600 mt-0.5" />
                                )}
                                <div>
                                    <p className={`font-medium ${report?.shopify?.status === 'connected' ? 'text-green-900' : 'text-red-900'}`}>
                                        {report?.shopify?.status === 'connected' ? 'Verbunden' : 'Verbindungsfehler'}
                                    </p>
                                    <p className={`text-sm mt-1 ${report?.shopify?.status === 'connected' ? 'text-green-700' : 'text-red-700'}`}>
                                        {report?.shopify?.message}
                                    </p>
                                    {report?.shopify?.shop && (
                                        <p className="text-xs mt-2 text-gray-500">Shop: {report.shopify.shop}</p>
                                    )}
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* System Info */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Server className="w-5 h-5" />
                                System Info
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-2 text-sm">
                            <div className="flex justify-between py-2 border-b">
                                <span className="text-gray-500">Environment</span>
                                <span className="font-mono">{report?.system?.nodeEnv}</span>
                            </div>
                            <div className="flex justify-between py-2 border-b">
                                <span className="text-gray-500">Working Directory</span>
                                <span className="font-mono text-xs max-w-[200px] truncate" title={report?.system?.cwd}>{report?.system?.cwd}</span>
                            </div>
                            <div className="flex justify-between py-2 border-b">
                                <span className="text-gray-500">Timestamp</span>
                                <span className="font-mono">{new Date(report?.timestamp).toLocaleString()}</span>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    )
}
