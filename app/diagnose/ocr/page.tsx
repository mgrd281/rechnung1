'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useAuthenticatedFetch } from '@/lib/api-client'
import { Loader2, AlertTriangle, CheckCircle, FileText } from 'lucide-react'

export default function OCRDiagnosisPage() {
    const authenticatedFetch = useAuthenticatedFetch()
    const [file, setFile] = useState<File | null>(null)
    const [loading, setLoading] = useState(false)
    const [result, setResult] = useState<any>(null)
    const [error, setError] = useState<string | null>(null)

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setFile(e.target.files[0])
            setResult(null)
            setError(null)
        }
    }

    const runDiagnosis = async () => {
        if (!file) return

        setLoading(true)
        setError(null)
        setResult(null)

        try {
            const formData = new FormData()
            formData.append('file', file)

            const response = await authenticatedFetch('/api/ocr/analyze', {
                method: 'POST',
                body: formData
            })

            const data = await response.json()

            if (!response.ok) {
                throw new Error(data.error || `HTTP Error ${response.status}`)
            }

            setResult(data)
        } catch (err: any) {
            console.error(err)
            setError(err.message || 'Ein unbekannter Fehler ist aufgetreten')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="container mx-auto py-10 max-w-4xl">
            <div className="mb-8">
                <h1 className="text-3xl font-bold mb-2">OCR Diagnose Tool</h1>
                <p className="text-gray-600">
                    Laden Sie hier ein problematisches Dokument hoch, um die Rohdaten der KI-Analyse zu sehen.
                    Dies hilft zu verstehen, warum Beträge oder Daten nicht erkannt werden.
                </p>
            </div>

            <div className="grid gap-6">
                <Card>
                    <CardHeader>
                        <CardTitle>Datei auswählen</CardTitle>
                        <CardDescription>PDF, JPG, PNG (Max 10MB)</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid w-full max-w-sm items-center gap-1.5">
                            <Label htmlFor="file">Dokument</Label>
                            <Input id="file" type="file" onChange={handleFileChange} accept=".pdf,.jpg,.jpeg,.png" />
                        </div>
                        <Button onClick={runDiagnosis} disabled={!file || loading}>
                            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            {loading ? 'Analysiere...' : 'Diagnose starten'}
                        </Button>
                    </CardContent>
                </Card>

                {error && (
                    <Card className="border-red-200 bg-red-50">
                        <CardHeader>
                            <CardTitle className="text-red-700 flex items-center">
                                <AlertTriangle className="mr-2 h-5 w-5" />
                                Fehler aufgetreten
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <pre className="text-red-600 whitespace-pre-wrap">{error}</pre>
                        </CardContent>
                    </Card>
                )}

                {result && (
                    <div className="space-y-6">
                        <Card className={result.success ? "border-green-200 bg-green-50" : "border-orange-200 bg-orange-50"}>
                            <CardHeader>
                                <CardTitle className="flex items-center">
                                    {result.success ? <CheckCircle className="mr-2 h-5 w-5 text-green-600" /> : <AlertTriangle className="mr-2 h-5 w-5 text-orange-600" />}
                                    Analyse Status: {result.success ? 'Erfolgreich' : 'Fehlerhaft'}
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <Label className="font-bold">Erkannter Betrag:</Label>
                                        <div className="text-lg">{result.data?.totalAmount !== undefined ? `${result.data.totalAmount} €` : <span className="text-red-500">Nicht gefunden</span>}</div>
                                    </div>
                                    <div>
                                        <Label className="font-bold">Erkanntes Datum:</Label>
                                        <div className="text-lg">{result.data?.date || <span className="text-red-500">Nicht gefunden</span>}</div>
                                    </div>
                                    <div>
                                        <Label className="font-bold">Kategorie:</Label>
                                        <div>{result.data?.category || '-'}</div>
                                    </div>
                                    <div>
                                        <Label className="font-bold">Händler:</Label>
                                        <div>{result.data?.supplier || '-'}</div>
                                    </div>
                                    <div>
                                        <Label className="font-bold">KI Status:</Label>
                                        <div className={`font-mono ${result.data?.ai_status === 'OK' ? 'text-green-600' : 'text-red-600'}`}>
                                            {result.data?.ai_status || 'N/A'}
                                        </div>
                                    </div>
                                    <div>
                                        <Label className="font-bold">Confidence:</Label>
                                        <div>{result.data?.confidence || '-'}</div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center">
                                    <FileText className="mr-2 h-5 w-5" />
                                    Extrahierter Text (Ausschnitt)
                                </CardTitle>
                                <CardDescription>Das sieht die KI vom Dokument (erste 500 Zeichen)</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="bg-slate-100 p-4 rounded-md font-mono text-xs overflow-auto max-h-[300px] whitespace-pre-wrap">
                                    {result.data?.debug_text || 'Kein Text extrahiert'}
                                </div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle>Vollständige JSON Antwort</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <pre className="bg-slate-950 text-slate-50 p-4 rounded-md overflow-auto max-h-[500px] text-xs">
                                    {JSON.stringify(result, null, 2)}
                                </pre>
                            </CardContent>
                        </Card>
                    </div>
                )}
            </div>
        </div>
    )
}
