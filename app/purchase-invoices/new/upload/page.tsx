'use client'

import { HeaderNavIcons } from '@/components/navigation/header-nav-icons'
import React, { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card'
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import {
    ArrowLeft,
    Home,
    Upload,
    FileText,
    X,
    CheckCircle2,
    Loader2,
    ScanLine,
    ShieldCheck,
    AlertCircle,
    ArrowRight
} from 'lucide-react'
import { toast } from 'sonner'
import { useAuthenticatedFetch } from '@/lib/api-client'

export default function PurchaseInvoiceUploadPage() {
    const router = useRouter()
    const authenticatedFetch = useAuthenticatedFetch()

    const [isDragging, setIsDragging] = useState(false)
    const [file, setFile] = useState<File | null>(null)
    const [uploadStep, setUploadStep] = useState<'idle' | 'uploading' | 'analyzing' | 'complete'>('idle')
    const [progress, setProgress] = useState(0)

    const handleDragOver = useCallback((e: React.DragEvent) => {
        e.preventDefault()
        setIsDragging(true)
    }, [])

    const handleDragLeave = useCallback((e: React.DragEvent) => {
        e.preventDefault()
        setIsDragging(false)
    }, [])

    const handleDrop = useCallback((e: React.DragEvent) => {
        e.preventDefault()
        setIsDragging(false)
        const droppedFile = e.dataTransfer.files[0]
        if (droppedFile && (droppedFile.type === 'application/pdf' || droppedFile.type.startsWith('image/'))) {
            setFile(droppedFile)
        } else {
            toast.error("Bitte nur PDF oder Bilder hochladen.")
        }
    }, [])

    const validateFile = (file: File): boolean => {
        const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png']
        if (!allowedTypes.includes(file.type)) {
            toast.error("Ungültiger Dateityp. Bitte nur PDF, JPG oder PNG hochladen.")
            return false
        }
        if (file.size > 20 * 1024 * 1024) {
            toast.error("Datei zu groß. Das Maximum beträgt 20MB.")
            return false
        }
        return true
    }

    const startUpload = async () => {
        if (!file) return
        if (!validateFile(file)) return

        setUploadStep('uploading')
        setProgress(15)

        try {
            // Send file to OCR endpoint
            const formData = new FormData()
            formData.append('file', file)

            const response = await authenticatedFetch('/api/ocr/purchase-invoice', {
                method: 'POST',
                body: formData
            })

            setProgress(60)
            setUploadStep('analyzing')

            const result = await response.json()

            if (!response.ok || !result.ok) {
                throw new Error(result.error || 'Fehler bei der OCR Analyse')
            }

            setProgress(100)
            setUploadStep('complete')

            toast.success("Beleg erfolgreich analysiert!")

            // Redirect to manual edit page with extracted data
            const ocrData = {
                ...result.data.extracted,
                documentId: result.data.documentId,
                // We'll pass a temporary blob URL or handle file upload separately if needed, 
                // but for now, let's keep the user's flow.
                fileName: file.name
            }

            const encodedData = encodeURIComponent(JSON.stringify(ocrData))
            router.push(`/purchase-invoices/new/manual?ocrData=${encodedData}`)

        } catch (error: any) {
            console.error('OCR Upload Error:', error)
            toast.error(error.message || "Upload fehlgeschlagen")
            setUploadStep('idle')
            setProgress(0)
        }
    }

    return (
        <div className="container mx-auto p-6 max-w-4xl space-y-8 pb-32">

            {/* Header */}
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                    <HeaderNavIcons />
                    <div className="mx-1" />
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight text-slate-900">Rechnung hochladen</h1>
                        <p className="text-sm text-slate-500">AI-gestützte Belegerkennung (OCR)</p>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 space-y-6">
                    {/* Dropzone */}
                    <Card
                        className={`relative border-2 border-dashed transition-all duration-200 min-h-[400px] flex flex-col items-center justify-center p-12 text-center overflow-hidden
                            ${isDragging ? 'border-violet-500 bg-violet-50' : 'border-slate-200 bg-slate-50/50 hover:bg-slate-50'}
                            ${file ? 'border-emerald-500 bg-emerald-50/10' : ''}`}
                        onDragOver={handleDragOver}
                        onDragLeave={handleDragLeave}
                        onDrop={handleDrop}
                    >
                        {!file ? (
                            <div className="space-y-4">
                                <div className="mx-auto w-20 h-20 bg-violet-100 rounded-3xl flex items-center justify-center animate-pulse">
                                    <Upload className="h-10 w-10 text-violet-600" />
                                </div>
                                <div>
                                    <h3 className="text-xl font-bold text-slate-900">Datei hier ablegen</h3>
                                    <p className="text-slate-500 mt-2 max-w-xs mx-auto">
                                        Ziehen Sie Ihre PDF oder Bild-Rechnung hierher oder klicken Sie zum Auswählen.
                                    </p>
                                </div>
                                <Button variant="outline" className="mt-4" onClick={() => document.getElementById('file-upload')?.click()}>
                                    Datei auswählen
                                </Button>
                                <input
                                    type="file"
                                    id="file-upload"
                                    className="hidden"
                                    accept="application/pdf,image/*"
                                    onChange={(e) => e.target.files?.[0] && setFile(e.target.files[0])}
                                />
                            </div>
                        ) : (
                            <div className="space-y-6 w-full max-w-md">
                                <div className="mx-auto w-24 h-24 bg-white shadow-md rounded-2xl flex items-center justify-center relative">
                                    <FileText className="h-12 w-12 text-blue-600" />
                                    <button
                                        onClick={(e) => { e.stopPropagation(); setFile(null); }}
                                        className="absolute -top-2 -right-2 h-7 w-7 bg-white border border-slate-200 rounded-full flex items-center justify-center text-slate-400 hover:text-red-500 shadow-sm transition-colors"
                                    >
                                        <X className="h-4 w-4" />
                                    </button>
                                </div>
                                <div>
                                    <h3 className="text-lg font-bold text-slate-900 truncate px-4">{file.name}</h3>
                                    <p className="text-sm text-slate-500">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                                </div>

                                {uploadStep === 'idle' ? (
                                    <Button
                                        className="w-full bg-violet-600 hover:bg-violet-700 text-white h-12 gap-2 shadow-lg"
                                        onClick={startUpload}
                                    >
                                        <ScanLine className="h-5 w-5" /> Analyse starten
                                    </Button>
                                ) : (
                                    <div className="space-y-4 text-center">
                                        <div className="flex items-center justify-center gap-2 text-violet-600 font-medium">
                                            {uploadStep === 'uploading' && <><Loader2 className="h-5 w-5 animate-spin" /> Datei wird hochgeladen...</>}
                                            {uploadStep === 'analyzing' && <><ScanLine className="h-5 w-5 animate-pulse" /> AI extrahiert Daten...</>}
                                            {uploadStep === 'complete' && <><CheckCircle2 className="h-5 w-5" /> Fertig!</>}
                                        </div>
                                        <Progress value={progress} className="h-2 bg-slate-100" />
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Security Badge */}
                        <div className="absolute bottom-6 flex items-center gap-2 text-[10px] text-slate-400 font-medium uppercase tracking-wider">
                            <ShieldCheck className="h-3 w-3" /> SSL-Verschlüsselt & DSGVO-Konform
                        </div>
                    </Card>

                    {/* Features Info */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Card className="border-none bg-slate-50/50 p-4 flex gap-3">
                            <div className="h-8 w-8 rounded-lg bg-blue-100 flex items-center justify-center shrink-0">
                                <ScanLine className="h-4 w-4 text-blue-600" />
                            </div>
                            <div>
                                <h4 className="text-sm font-bold text-slate-900">Automatische Erkennung</h4>
                                <p className="text-xs text-slate-500 mt-1">Betrag, Datum, MwSt und Lieferant werden automatisch erkannt.</p>
                            </div>
                        </Card>
                        <Card className="border-none bg-slate-50/50 p-4 flex gap-3">
                            <div className="h-8 w-8 rounded-lg bg-emerald-100 flex items-center justify-center shrink-0">
                                <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                            </div>
                            <div>
                                <h4 className="text-sm font-bold text-slate-900">Dubletten-Check</h4>
                                <p className="text-xs text-slate-500 mt-1">System erkennt automatisch, ob eine Rechnung bereits existiert.</p>
                            </div>
                        </Card>
                    </div>
                </div>

                {/* Sidebar Tips */}
                <div className="space-y-6">
                    <Card className="border-slate-200 shadow-sm bg-gradient-to-br from-white to-violet-50">
                        <CardHeader className="p-6">
                            <CardTitle className="text-lg flex items-center gap-2">
                                <AlertCircle className="h-5 w-5 text-violet-500" /> Profi-Tipp
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="px-6 pb-8 space-y-4">
                            <p className="text-sm text-slate-600 leading-relaxed">
                                Achten Sie darauf, dass alle Ecken des Belegs sichtbar sind und die Schrift gut lesbar ist.
                            </p>
                            <div className="space-y-2">
                                <div className="flex items-center gap-2 text-xs text-slate-500">
                                    <CheckCircle2 className="h-3 w-3 text-emerald-500" /> PDF Dokumente bevorzugt
                                </div>
                                <div className="flex items-center gap-2 text-xs text-slate-500">
                                    <CheckCircle2 className="h-3 w-3 text-emerald-500" /> Keine Schatten auf dem Foto
                                </div>
                                <div className="flex items-center gap-2 text-xs text-slate-500">
                                    <CheckCircle2 className="h-3 w-3 text-emerald-500" /> Hoher Kontrast
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="border-none bg-blue-600 text-white shadow-lg overflow-hidden relative">
                        <div className="absolute -top-4 -right-4 w-24 h-24 bg-white/10 rounded-full blur-2xl"></div>
                        <CardContent className="p-6 space-y-4">
                            <h4 className="font-bold text-lg">Keine Lust auf Upload?</h4>
                            <p className="text-blue-100 text-sm">
                                Erfassen Sie Ihre Belege einfach manuell über unser Formular.
                            </p>
                            <Link href="/purchase-invoices/new/manual">
                                <Button className="w-full bg-white text-blue-600 hover:bg-blue-50 border-none font-bold">
                                    Manuell erfassen <ArrowRight className="ml-2 h-4 w-4" />
                                </Button>
                            </Link>
                        </CardContent>
                    </Card>
                </div>
            </div>

        </div>
    )
}
