import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Upload, FileText, Sparkles, CheckCircle, AlertTriangle, Trash2 } from 'lucide-react'

export interface PendingFile {
    id: string
    file: File
    meta: {
        description: string
        category: string
        date: string
        amount: string
        supplier?: string
        invoiceNumber?: string
    }
    status: 'pending' | 'analyzing' | 'error' | 'success'
}

interface ReceiptUploaderProps {
    onFilesAdded: (files: File[]) => void
    pendingFiles: PendingFile[]
    setPendingFiles: React.Dispatch<React.SetStateAction<PendingFile[]>>
    onUpload: () => void
    loading: boolean
    uploadProgress: number
}

export function ReceiptUploader({
    onFilesAdded,
    pendingFiles,
    setPendingFiles,
    onUpload,
    loading,
    uploadProgress
}: ReceiptUploaderProps) {
    const [isDragging, setIsDragging] = useState(false)

    const onDragOver = (e: React.DragEvent) => {
        e.preventDefault()
        setIsDragging(true)
    }

    const onDragLeave = (e: React.DragEvent) => {
        e.preventDefault()
        setIsDragging(false)
    }

    const onDrop = (e: React.DragEvent) => {
        e.preventDefault()
        setIsDragging(false)
        if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
            onFilesAdded(Array.from(e.dataTransfer.files))
        }
    }

    const removeFile = (index: number) => {
        setPendingFiles(prev => prev.filter((_, i) => i !== index))
    }

    return (
        <div className="space-y-6">
            <Card className="h-full border-dashed border-2 hover:border-blue-400 transition-colors">
                <CardHeader>
                    <CardTitle className="flex items-center">
                        <Upload className="h-5 w-5 mr-2 text-blue-600" />
                        Beleg hochladen
                    </CardTitle>
                    <CardDescription>Drag & Drop oder Klicken zum Auswählen</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div
                        className={`rounded-xl p-8 text-center transition-colors cursor-pointer ${isDragging ? 'bg-blue-50' : 'bg-gray-50 hover:bg-gray-100'
                            }`}
                        onDragOver={onDragOver}
                        onDragLeave={onDragLeave}
                        onDrop={onDrop}
                        onClick={() => document.getElementById('file-upload')?.click()}
                    >
                        <input
                            id="file-upload"
                            type="file"
                            multiple
                            className="hidden"
                            onChange={(e) => {
                                if (e.target.files && e.target.files.length > 0) {
                                    onFilesAdded(Array.from(e.target.files))
                                }
                            }}
                            accept=".pdf,.jpg,.png,.docx,.xlsx,.xls,.csv"
                        />

                        <div className="space-y-2">
                            <div className="h-12 w-12 bg-white rounded-full shadow-sm mx-auto flex items-center justify-center">
                                <Upload className={`h-6 w-6 ${isDragging ? 'text-blue-600' : 'text-blue-400'}`} />
                            </div>
                            <p className="font-medium text-gray-900">
                                {isDragging ? 'Dateien hier ablegen' : 'Dateien auswählen oder hierher ziehen'}
                            </p>
                            <p className="text-xs text-gray-500">PDF, JPG, PNG, DOCX, CSV, Excel (Unbegrenzt)</p>
                        </div>
                    </div>

                    {pendingFiles.length > 0 && (
                        <div className="space-y-3 animate-in fade-in slide-in-from-top-2">
                            <div className="max-h-[400px] overflow-y-auto space-y-3 border rounded-md p-2 bg-gray-50">
                                {pendingFiles.map((pf, index) => (
                                    <div key={pf.id} className="bg-white p-3 rounded border text-sm space-y-3 shadow-sm">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center truncate">
                                                <FileText className="h-4 w-4 text-blue-500 mr-2 flex-shrink-0" />
                                                <span className="truncate max-w-[150px] font-medium">{pf.file.name}</span>
                                            </div>
                                            <div className="flex items-center space-x-2">
                                                {pf.status === 'analyzing' && (
                                                    <div className="flex items-center text-xs text-blue-600">
                                                        <Sparkles className="h-3 w-3 mr-1 animate-pulse" />
                                                        Analysiere...
                                                    </div>
                                                )}
                                                {pf.status === 'success' && (
                                                    <div className="flex items-center text-xs text-green-600">
                                                        <CheckCircle className="h-3 w-3 mr-1" />
                                                        Analysiert
                                                    </div>
                                                )}
                                                {pf.status === 'error' && (
                                                    <div className="flex items-center text-xs text-red-600">
                                                        <AlertTriangle className="h-3 w-3 mr-1" />
                                                        Fehler
                                                    </div>
                                                )}
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    className="h-6 w-6 p-0 text-red-500 hover:text-red-700"
                                                    onClick={(e) => {
                                                        e.stopPropagation()
                                                        removeFile(index)
                                                    }}
                                                >
                                                    <Trash2 className="h-3 w-3" />
                                                </Button>
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-2 gap-2">
                                            <div>
                                                <Label className="text-xs">Betrag (€)</Label>
                                                <Input
                                                    className="h-7 text-xs"
                                                    value={pf.meta.amount}
                                                    onChange={(e) => {
                                                        const val = e.target.value
                                                        setPendingFiles(prev => prev.map(p => p.id === pf.id ? { ...p, meta: { ...p.meta, amount: val } } : p))
                                                    }}
                                                    placeholder="0.00"
                                                />
                                            </div>
                                            <div>
                                                <Label className="text-xs">Kategorie</Label>
                                                <Select
                                                    value={pf.meta.category}
                                                    onValueChange={(v) => setPendingFiles(prev => prev.map(p => p.id === pf.id ? { ...p, meta: { ...p.meta, category: v } } : p))}
                                                >
                                                    <SelectTrigger className="h-7 text-xs">
                                                        <SelectValue />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="EXPENSE">Ausgabe</SelectItem>
                                                        <SelectItem value="INCOME">Einnahme</SelectItem>
                                                        <SelectItem value="OTHER">Sonstiges</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                        </div>
                                        <div className="grid grid-cols-2 gap-2">
                                            <div>
                                                <Label className="text-xs">Händler / Vendor</Label>
                                                <Input
                                                    className="h-7 text-xs"
                                                    value={pf.meta.supplier || ''}
                                                    onChange={(e) => {
                                                        const val = e.target.value
                                                        setPendingFiles(prev => prev.map(p => p.id === pf.id ? { ...p, meta: { ...p.meta, supplier: val } } : p))
                                                    }}
                                                    placeholder="z.B. Amazon, Rewe"
                                                />
                                            </div>
                                            <div>
                                                <Label className="text-xs">Datum</Label>
                                                <Input
                                                    type="date"
                                                    className="h-7 text-xs"
                                                    value={pf.meta.date}
                                                    onChange={(e) => {
                                                        const val = e.target.value
                                                        setPendingFiles(prev => prev.map(p => p.id === pf.id ? { ...p, meta: { ...p.meta, date: val } } : p))
                                                    }}
                                                />
                                            </div>
                                        </div>
                                        <div>
                                            <Label className="text-xs">Beschreibung</Label>
                                            <Input
                                                className="h-7 text-xs"
                                                value={pf.meta.description}
                                                onChange={(e) => {
                                                    const val = e.target.value
                                                    setPendingFiles(prev => prev.map(p => p.id === pf.id ? { ...p, meta: { ...p.meta, description: val } } : p))
                                                }}
                                            />
                                        </div>
                                    </div>
                                ))}
                            </div>

                            <Button
                                onClick={onUpload}
                                disabled={loading || pendingFiles.some(f => f.status === 'analyzing')}
                                className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50"
                            >
                                {loading ? `Wird hochgeladen... ${uploadProgress}%` :
                                    pendingFiles.some(f => f.status === 'analyzing') ? 'Bitte warten (Analyse läuft)...' :
                                        `${pendingFiles.length} Dateien hochladen`}
                            </Button>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    )
}
