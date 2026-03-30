'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import {
    FileText,
    Loader2,
    Settings2,
    FileCheck2,
    Download,
    Eye,
    Layout,
    PieChart,
    Table as TableIcon,
    FilePlus2,
    Check,
    ChevronRight,
    Search,
    Type,
    Image as ImageIcon,
    BarChart3
} from 'lucide-react'
import { toast } from 'sonner'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Badge } from "@/components/ui/badge"

interface DocxExportButtonProps {
    selectedIds?: string[]
    filters?: any
    totalCount?: number
    selectedCount?: number
    className?: string
    variant?: "outline" | "ghost" | "secondary" | "default"
}

export default function DocxExportButton({
    selectedIds = [],
    filters = {},
    totalCount = 0,
    selectedCount = 0,
    className = "",
    variant = "outline"
}: DocxExportButtonProps) {
    const [loading, setLoading] = useState(false)
    const [open, setOpen] = useState(false)
    const [previewTab, setPreviewTab] = useState('config')

    // Report Configuration State
    const [options, setOptions] = useState({
        onlyPaid: false,
        onlyCancelled: false,
        includeCover: true,
        includeExecutiveSummary: true,
        includeCharts: true,
        includeDetailTable: true,
        includeNotes: false,
        reportTitle: "Finanzbericht",
        companyName: "Karinex"
    })

    const handleExport = async () => {
        setLoading(true)
        try {
            const statuses = []
            if (options.onlyPaid) statuses.push('PAID')
            if (options.onlyCancelled) statuses.push('CANCELLED', 'VOIDED', 'STORNIERT')

            const response = await fetch('/api/exports/invoices/docx', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    selectedIds: selectedIds.length > 0 ? selectedIds : undefined,
                    filters,
                    exportOptions: {
                        statuses: statuses.length > 0 ? statuses : undefined,
                        ...options
                    }
                })
            })

            if (!response.ok) {
                const err = await response.json().catch(() => ({}))
                throw new Error(err.error || 'Export fehlgeschlagen')
            }

            const blob = await response.blob()
            const url = window.URL.createObjectURL(blob)
            const link = document.createElement('a')
            link.href = url
            link.download = `${options.companyName}_Bericht_${new Date().toISOString().slice(0, 10)}.docx`
            document.body.appendChild(link)
            link.click()
            document.body.removeChild(link)
            window.URL.revokeObjectURL(url)

            toast.success('Word-Bericht erfolgreich generiert')
            setOpen(false)
        } catch (error: any) {
            console.error('Word Export Fehler:', error)
            toast.error(error.message || 'Fehler beim Generieren des Word-Berichts')
        } finally {
            setLoading(false)
        }
    }

    const count = selectedCount > 0 ? selectedCount : (filters?.displayedInvoices?.length || totalCount)
    const isEnabled = count > 0

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button
                    variant={variant}
                    disabled={isEnabled === false}
                    className={`${className} group transition-all flex items-center gap-2`}
                    title="Enterprise Word Bericht-Generator"
                >
                    <FileText className="h-[18px] w-[18px] text-blue-600" />
                    <span>Word Bericht</span>
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[1000px] h-[85vh] p-0 overflow-hidden border-none shadow-2xl flex flex-col">
                <div className="flex flex-1 overflow-hidden">
                    {/* LEFT SIDE: Config Panel */}
                    <div className="w-[380px] border-r bg-gray-50 flex flex-col h-full">
                        <div className="p-6 border-b bg-white">
                            <div className="flex items-center gap-2 text-blue-600 mb-1">
                                <FilePlus2 className="h-5 w-5" />
                                <h2 className="text-lg font-bold">Bericht konfigurieren</h2>
                            </div>
                            <p className="text-xs text-gray-500">Erstellen Sie einen professionellen Report nach Ihren Vorgaben.</p>
                        </div>

                        <ScrollArea className="flex-1 p-6">
                            <div className="space-y-8">
                                {/* Section 1: Data Filter */}
                                <div className="space-y-4">
                                    <div className="flex items-center gap-2">
                                        <Badge variant="outline" className="h-5 bg-blue-50 text-blue-600 border-blue-100">1</Badge>
                                        <h3 className="text-sm font-bold text-gray-900 uppercase tracking-tight">Status-Filter</h3>
                                    </div>
                                    <div className="grid gap-3">
                                        <label className="flex items-center gap-3 p-3 rounded-xl border bg-white hover:border-blue-300 transition-all cursor-pointer shadow-sm">
                                            <Checkbox
                                                checked={options.onlyPaid}
                                                onCheckedChange={(val) => setOptions(prev => ({ ...prev, onlyPaid: !!val }))}
                                            />
                                            <div className="flex-1">
                                                <div className="text-sm font-medium">Nur Bezahlt</div>
                                                <div className="text-[10px] text-gray-400">Schließt alle offenen Posten aus</div>
                                            </div>
                                        </label>
                                        <label className="flex items-center gap-3 p-3 rounded-xl border bg-white hover:border-blue-300 transition-all cursor-pointer shadow-sm">
                                            <Checkbox
                                                checked={options.onlyCancelled}
                                                onCheckedChange={(val) => setOptions(prev => ({ ...prev, onlyCancelled: !!val }))}
                                            />
                                            <div className="flex-1">
                                                <div className="text-sm font-medium">Nur Storniert</div>
                                                <div className="text-[10px] text-gray-400">Zeigt nur Gutschriften/Stornos</div>
                                            </div>
                                        </label>
                                    </div>
                                </div>

                                {/* Section 2: Layout Sections */}
                                <div className="space-y-4">
                                    <div className="flex items-center gap-2">
                                        <Badge variant="outline" className="h-5 bg-orange-50 text-orange-600 border-orange-100">2</Badge>
                                        <h3 className="text-sm font-bold text-gray-900 uppercase tracking-tight">Bericht-Struktur</h3>
                                    </div>
                                    <div className="space-y-3">
                                        <div className="flex items-center justify-between p-2">
                                            <Label className="flex items-center gap-2 cursor-pointer">
                                                <Layout className="h-4 w-4 text-gray-400" />
                                                Deckblatt
                                            </Label>
                                            <Switch
                                                checked={options.includeCover}
                                                onCheckedChange={(val) => setOptions(prev => ({ ...prev, includeCover: val }))}
                                            />
                                        </div>
                                        <div className="flex items-center justify-between p-2">
                                            <Label className="flex items-center gap-2 cursor-pointer">
                                                <Type className="h-4 w-4 text-gray-400" />
                                                Management Summary
                                            </Label>
                                            <Switch
                                                checked={options.includeExecutiveSummary}
                                                onCheckedChange={(val) => setOptions(prev => ({ ...prev, includeExecutiveSummary: val }))}
                                            />
                                        </div>
                                        <div className="flex items-center justify-between p-2">
                                            <Label className="flex items-center gap-2 cursor-pointer">
                                                <BarChart3 className="h-4 w-4 text-gray-400" />
                                                Diagramme & Analysen
                                            </Label>
                                            <Switch
                                                checked={options.includeCharts}
                                                onCheckedChange={(val) => setOptions(prev => ({ ...prev, includeCharts: val }))}
                                            />
                                        </div>
                                        <div className="flex items-center justify-between p-2">
                                            <Label className="flex items-center gap-2 cursor-pointer">
                                                <TableIcon className="h-4 w-4 text-gray-400" />
                                                Detaillierte Tabelle
                                            </Label>
                                            <Switch
                                                checked={options.includeDetailTable}
                                                onCheckedChange={(val) => setOptions(prev => ({ ...prev, includeDetailTable: val }))}
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div className="pt-4 border-t opacity-50 pointer-events-none">
                                    <div className="flex items-center gap-2 mb-4">
                                        <Settings2 className="h-4 w-4" />
                                        <span className="text-xs font-bold uppercase tracking-widest">Enterprise Branding</span>
                                    </div>
                                    <div className="space-y-3">
                                        <div className="text-xs px-2 py-1 rounded-md bg-white border italic text-gray-400">Corporate Header: Karinex Logst...</div>
                                        <div className="text-xs px-2 py-1 rounded-md bg-white border italic text-gray-400">Template: Modern Standard v2</div>
                                    </div>
                                </div>
                            </div>
                        </ScrollArea>
                    </div>

                    {/* RIGHT SIDE: Preview Panel */}
                    <div className="flex-1 bg-gray-200 p-8 overflow-hidden flex flex-col items-center">
                        <div className="w-full max-w-[600px] mb-4 flex justify-between items-end px-2">
                            <span className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">Live Vorschau (WYSIWYG)</span>
                            <Badge className="bg-white text-gray-900 border-none shadow-sm h-6 px-3">
                                {count} Rechnungen erfasst
                            </Badge>
                        </div>

                        <div className="flex-1 w-full max-w-[600px] bg-white shadow-[0_10px_40px_rgba(0,0,0,0.15)] rounded-t-sm flex flex-col overflow-hidden relative border border-gray-100">
                            {/* Word Style Header */}
                            <div className="h-12 border-b bg-white flex items-center justify-center relative">
                                <div className="absolute left-6 text-[8px] text-gray-300 font-serif">A4 Standard / 210 x 297 mm</div>
                                <div className="w-16 h-1 bg-gray-100 rounded-full" />
                            </div>

                            <ScrollArea className="flex-1 p-12">
                                <div className="space-y-12">
                                    {/* Cover Page */}
                                    {options.includeCover && (
                                        <div className="flex flex-col items-center justify-center min-h-[400px] border-b pb-12">
                                            <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center mb-6">
                                                <ImageIcon className="h-6 w-6 text-blue-600" />
                                            </div>
                                            <h1 className="text-4xl font-black text-gray-900 mb-2">{options.reportTitle}</h1>
                                            <h2 className="text-lg text-blue-600 font-medium tracking-wide">{options.companyName} Logistics</h2>
                                            <div className="mt-20 text-xs text-gray-400 text-center font-mono">
                                                Generiert am: {new Date().toLocaleDateString('de-DE')}<br />
                                                Dokument-Ref: KRF-{Math.random().toString(36).substring(7).toUpperCase()}
                                            </div>
                                        </div>
                                    )}

                                    {/* Summary Section */}
                                    {options.includeExecutiveSummary && (
                                        <div className="space-y-4">
                                            <h2 className="text-xl font-bold border-b-2 border-blue-600 pb-1 w-fit">Executive Summary</h2>
                                            <div className="grid grid-cols-3 gap-4">
                                                <div className="p-4 bg-gray-50 rounded-lg">
                                                    <div className="text-[10px] font-bold text-gray-400 uppercase">Total Brutto</div>
                                                    <div className="text-lg font-bold text-gray-900">... €</div>
                                                </div>
                                                <div className="p-4 bg-gray-50 rounded-lg">
                                                    <div className="text-[10px] font-bold text-gray-400 uppercase">Bezahlt</div>
                                                    <div className="text-lg font-bold text-green-600">... €</div>
                                                </div>
                                                <div className="p-4 bg-gray-50 rounded-lg">
                                                    <div className="text-[10px] font-bold text-gray-400 uppercase">Offen</div>
                                                    <div className="text-lg font-bold text-orange-600">... €</div>
                                                </div>
                                            </div>
                                            <p className="text-xs text-gray-600 leading-relaxed italic">
                                                Dieser Bericht umfasst eine Analyse der Finanzströme für den gewählten Zeitraum.
                                                Es wurden {count} Dokumente berücksichtigt, davon {options.onlyPaid ? 'nur bezahlte' : 'verschiedene'} Status.
                                            </p>
                                        </div>
                                    )}

                                    {/* Chart Placeholder */}
                                    {options.includeCharts && (
                                        <div className="space-y-4">
                                            <div className="flex items-center gap-2">
                                                <div className="h-1 w-6 bg-blue-600" />
                                                <h3 className="text-base font-bold text-gray-900">Umsatz & Status Verteilung</h3>
                                            </div>
                                            <div className="grid grid-cols-2 gap-4 h-[120px]">
                                                <div className="bg-gray-50 rounded border flex items-center justify-center">
                                                    <BarChart3 className="h-8 w-8 text-gray-200" />
                                                </div>
                                                <div className="bg-gray-50 rounded border flex items-center justify-center">
                                                    <PieChart className="h-8 w-8 text-gray-200" />
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {/* Table Placeholder */}
                                    {options.includeDetailTable && (
                                        <div className="space-y-4">
                                            <h3 className="text-base font-bold text-gray-900">Transaktionsdetails</h3>
                                            <div className="border rounded">
                                                <div className="grid grid-cols-4 gap-2 bg-gray-100 p-2 font-bold text-[8px] uppercase">
                                                    <div>Datum</div>
                                                    <div>Nummer</div>
                                                    <div>Kunde</div>
                                                    <div className="text-right">Betrag</div>
                                                </div>
                                                <div className="p-2 space-y-2">
                                                    {[1, 2, 3, 4, 5].map(i => (
                                                        <div key={i} className="grid grid-cols-4 gap-2 border-b border-gray-50 pb-1 text-[8px] text-gray-600">
                                                            <div className="w-10 h-1.5 bg-gray-100 rounded" />
                                                            <div className="w-16 h-1.5 bg-gray-200 rounded" />
                                                            <div className="w-20 h-1.5 bg-gray-100 rounded" />
                                                            <div className="w-12 h-1.5 bg-gray-200 rounded ml-auto" />
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </ScrollArea>
                        </div>
                    </div>
                </div>

                {/* Footer Actions */}
                <div className="p-4 border-t bg-white flex items-center justify-between">
                    <div className="flex items-center gap-4 ml-2">
                        <div className="flex items-center gap-1.5">
                            <div className="h-2 w-2 rounded-full bg-blue-600" />
                            <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Enterprise Edition</span>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <Button variant="ghost" onClick={() => setOpen(false)} disabled={loading} className="rounded-lg">
                            Abbrechen
                        </Button>
                        <Button
                            onClick={handleExport}
                            disabled={loading}
                            className="bg-blue-600 hover:bg-blue-700 text-white shadow-xl shadow-blue-200 h-10 px-8 rounded-lg font-bold flex items-center gap-2"
                        >
                            {loading ? (
                                <>
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                    Bericht wird generiert...
                                </>
                            ) : (
                                <>
                                    <Download className="h-4 w-4" />
                                    Als DOCX herunterladen
                                </>
                            )}
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    )
}
