'use client'

import { useState, useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import {
    Search, Globe, Trash2, ShieldX, Clock, ArrowRight, MoreHorizontal,
    CheckCircle2, Activity, Loader2, Download, AlertCircle, ShieldOff,
    AlertTriangle
} from "lucide-react"
import { Checkbox } from "@/components/ui/checkbox"
import { useIpBlocks, IpBlock } from "@/hooks/use-ip-blocks"
import { useToast } from "@/components/ui/toast"
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog"

// IP validation helper
function validateIpAddress(ip: string): { valid: boolean; error?: string } {
    const trimmed = ip.trim()
    if (!trimmed) {
        return { valid: false, error: 'IP-Adresse ist erforderlich' }
    }

    // IPv4
    const ipv4Regex = /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/
    // IPv6 full
    const ipv6Regex = /^(?:[0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}$/
    // IPv6 compressed
    const ipv6CompressedRegex = /^((?:[0-9a-fA-F]{1,4}(?::[0-9a-fA-F]{1,4})*)?)::((?:[0-9a-fA-F]{1,4}(?::[0-9a-fA-F]{1,4})*)?)$/

    if (ipv4Regex.test(trimmed) || ipv6Regex.test(trimmed) || ipv6CompressedRegex.test(trimmed)) {
        return { valid: true }
    }

    return { valid: false, error: 'Ungültige IP-Adresse. Bitte geben Sie eine gültige IPv4 oder IPv6 Adresse ein.' }
}

// Format date to DD.MM.YYYY
function formatDate(dateString: string): string {
    try {
        const date = new Date(dateString)
        return date.toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' })
    } catch {
        return dateString
    }
}

export function IpManagement() {
    const { blocks, isLoading, error, addBlock, deleteBlock, bulkUnblock, refetch } = useIpBlocks()
    const { showToast } = useToast()

    // Form state
    const [ip, setIp] = useState('')
    const [reason, setReason] = useState('Abuse')
    const [duration, setDuration] = useState('permanent')
    const [isGlobal, setIsGlobal] = useState(false)
    const [search, setSearch] = useState('')

    // Loading states
    const [isAdding, setIsAdding] = useState(false)
    const [deletingId, setDeletingId] = useState<string | null>(null)
    const [isBulkDeleting, setIsBulkDeleting] = useState(false)
    const [isExporting, setIsExporting] = useState(false)

    // Selection state
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())

    // Confirm dialog state
    const [confirmDialog, setConfirmDialog] = useState<{
        open: boolean
        type: 'single' | 'bulk'
        id?: string
        ip?: string
    }>({ open: false, type: 'single' })

    // Validation error
    const [inputError, setInputError] = useState<string | null>(null)

    // Filter blocks by search
    const filteredBlocks = useMemo(() => {
        if (!search.trim()) return blocks
        const searchLower = search.toLowerCase()
        return blocks.filter(block =>
            block.ipAddress.toLowerCase().includes(searchLower) ||
            block.reason?.toLowerCase().includes(searchLower)
        )
    }, [blocks, search])

    // Handle Add
    const handleAdd = async () => {
        setInputError(null)

        const validation = validateIpAddress(ip)
        if (!validation.valid) {
            setInputError(validation.error || 'Ungültige Eingabe')
            return
        }

        // Check for duplicates
        const exists = blocks.some(b => b.ipAddress === ip.trim())
        if (exists) {
            setInputError('Diese IP ist bereits gesperrt')
            return
        }

        setIsAdding(true)
        const result = await addBlock(ip.trim(), reason, duration)
        setIsAdding(false)

        if (result.ok) {
            setIp('')
            setReason('Abuse')
            setDuration('permanent')
            showToast(`IP ${ip.trim()} wurde erfolgreich gesperrt.`, 'success')
        } else {
            setInputError(result.error || 'Fehler beim Erstellen der Sperre')
        }
    }

    // Handle single delete
    const handleDelete = async (id: string) => {
        setDeletingId(id)
        const result = await deleteBlock(id)
        setDeletingId(null)
        setConfirmDialog({ open: false, type: 'single' })

        if (result.ok) {
            setSelectedIds(prev => {
                const next = new Set(prev)
                next.delete(id)
                return next
            })
            showToast('IP-Sperre wurde erfolgreich aufgehoben.', 'success')
        } else {
            showToast(result.error || 'Fehler beim Entfernen der Sperre', 'error')
        }
    }

    // Handle bulk delete
    const handleBulkUnblock = async () => {
        if (selectedIds.size === 0) return

        setIsBulkDeleting(true)
        const result = await bulkUnblock(Array.from(selectedIds))
        setIsBulkDeleting(false)
        setConfirmDialog({ open: false, type: 'bulk' })

        if (result.ok) {
            setSelectedIds(new Set())
            showToast(`${result.deletedCount || selectedIds.size} IP-Sperren wurden erfolgreich aufgehoben.`, 'success')
        } else {
            showToast(result.error || 'Fehler beim Bulk-Entsperren', 'error')
        }
    }

    // Handle export
    const handleExport = async () => {
        setIsExporting(true)

        try {
            const dataToExport = filteredBlocks
            const csvRows = [
                ['IP-Adresse', 'Grund', 'Blockiert am', 'Läuft ab'].join(';'),
                ...dataToExport.map(block => [
                    block.ipAddress,
                    block.reason || '-',
                    formatDate(block.createdAt),
                    block.expiresAt ? formatDate(block.expiresAt) : 'Permanent'
                ].join(';'))
            ]

            const csvContent = csvRows.join('\n')
            const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' })
            const url = URL.createObjectURL(blob)
            const link = document.createElement('a')
            link.href = url
            link.download = `ip-sperren-${new Date().toISOString().split('T')[0]}.csv`
            document.body.appendChild(link)
            link.click()
            document.body.removeChild(link)
            URL.revokeObjectURL(url)

            showToast(`${dataToExport.length} Einträge exportiert.`, 'success')
        } catch (err) {
            showToast('Beim Export ist ein Fehler aufgetreten.', 'error')
        } finally {
            setIsExporting(false)
        }
    }

    // Toggle single selection
    const toggleSelection = (id: string) => {
        setSelectedIds(prev => {
            const next = new Set(prev)
            if (next.has(id)) {
                next.delete(id)
            } else {
                next.add(id)
            }
            return next
        })
    }

    // Toggle all selection
    const toggleAllSelection = () => {
        if (selectedIds.size === filteredBlocks.length) {
            setSelectedIds(new Set())
        } else {
            setSelectedIds(new Set(filteredBlocks.map(b => b.id)))
        }
    }

    const allSelected = filteredBlocks.length > 0 && selectedIds.size === filteredBlocks.length

    return (
        <>
            {/* Confirm Dialog */}
            <AlertDialog open={confirmDialog.open} onOpenChange={(open) => setConfirmDialog(prev => ({ ...prev, open }))}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle className="flex items-center gap-2">
                            <AlertTriangle className="h-5 w-5 text-amber-500" />
                            {confirmDialog.type === 'bulk' ? 'Mehrere Sperren aufheben?' : 'Sperre aufheben?'}
                        </AlertDialogTitle>
                        <AlertDialogDescription>
                            {confirmDialog.type === 'bulk'
                                ? `Möchten Sie wirklich ${selectedIds.size} IP-Sperren aufheben? Diese Aktion kann nicht rückgängig gemacht werden.`
                                : `Möchten Sie die Sperre für ${confirmDialog.ip} wirklich aufheben?`
                            }
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={deletingId !== null || isBulkDeleting}>Abbrechen</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={() => {
                                if (confirmDialog.type === 'bulk') {
                                    handleBulkUnblock()
                                } else if (confirmDialog.id) {
                                    handleDelete(confirmDialog.id)
                                }
                            }}
                            disabled={deletingId !== null || isBulkDeleting}
                            className="bg-red-600 hover:bg-red-700"
                        >
                            {(deletingId !== null || isBulkDeleting) && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                            Aufheben
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            <div className="grid gap-6 lg:grid-cols-[380px,1fr]">
                {/* Create Block Form */}
                <div className="space-y-6">
                    <Card className="border-slate-200 shadow-sm">
                        <CardHeader className="border-b bg-slate-50/50">
                            <CardTitle className="text-base flex items-center gap-2">
                                <ShieldX className="w-4 h-4 text-red-600" /> Sperre erstellen
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-6 space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="ip">IP-Adresse</Label>
                                <Input
                                    id="ip"
                                    placeholder="z.B. 192.168.1.1"
                                    value={ip}
                                    onChange={(e) => {
                                        setIp(e.target.value)
                                        setInputError(null)
                                    }}
                                    className={`border-slate-200 focus:ring-slate-900 ${inputError ? 'border-red-500 focus:ring-red-500' : ''}`}
                                    disabled={isAdding}
                                />
                                {inputError ? (
                                    <p className="text-xs text-red-500 flex items-center gap-1">
                                        <AlertCircle className="w-3 h-3" />
                                        {inputError}
                                    </p>
                                ) : (
                                    <p className="text-[10px] text-slate-400">IPv4 oder IPv6 werden unterstützt.</p>
                                )}
                            </div>

                            <div className="space-y-2">
                                <Label>Grund</Label>
                                <Select value={reason} onValueChange={setReason} disabled={isAdding}>
                                    <SelectTrigger className="border-slate-200">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="Abuse">Verstoß gegen Nutzungsbedingungen</SelectItem>
                                        <SelectItem value="Brute-Force">Brute-Force Angriffe</SelectItem>
                                        <SelectItem value="Spam">Spam-Verdacht</SelectItem>
                                        <SelectItem value="Suspicious">Verdächtiges Verhalten</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-2">
                                <Label>Dauer</Label>
                                <div className="grid grid-cols-2 gap-2">
                                    {['1h', '24h', '7d', 'permanent'].map((d) => (
                                        <Button
                                            key={d}
                                            variant={duration === d ? 'default' : 'outline'}
                                            size="sm"
                                            className={`text-xs h-8 ${duration === d ? 'bg-slate-900 text-white' : ''}`}
                                            onClick={() => setDuration(d)}
                                            disabled={isAdding}
                                        >
                                            {d === 'permanent' ? 'Permanent' : d}
                                        </Button>
                                    ))}
                                </div>
                            </div>

                            <div className="flex items-center justify-between pt-2">
                                <Label className="text-xs text-slate-600">Global blockieren</Label>
                                <Switch checked={isGlobal} onCheckedChange={setIsGlobal} disabled={isAdding} />
                            </div>

                            <Button
                                className="w-full bg-red-600 hover:bg-red-700 text-white shadow-lg shadow-red-100 mt-2"
                                onClick={handleAdd}
                                disabled={isAdding}
                            >
                                {isAdding ? (
                                    <>
                                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                        Wird gesperrt...
                                    </>
                                ) : (
                                    <>
                                        Sperre aktivieren <ArrowRight className="w-4 h-4 ml-2" />
                                    </>
                                )}
                            </Button>
                        </CardContent>
                    </Card>

                    <div className="p-4 bg-blue-50 border border-blue-100 rounded-xl flex gap-3 text-blue-700">
                        <CheckCircle2 className="w-5 h-5 flex-shrink-0 mt-0.5" />
                        <div>
                            <p className="text-xs font-bold uppercase tracking-tight">Pro-Tipp</p>
                            <p className="text-xs mt-1 leading-relaxed opacity-90">Nutzen Sie Regeln, um Brute-Force Angriffe automatisch zu erkennen.</p>
                        </div>
                    </div>
                </div>

                {/* IP List Table */}
                <Card className="border-slate-200 shadow-sm flex flex-col h-[calc(100vh-320px)] min-h-[500px]">
                    <CardHeader className="border-b flex flex-row items-center justify-between py-4">
                        <div className="relative w-72">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                            <Input
                                placeholder="Sperrliste durchsuchen..."
                                className="pl-9 bg-slate-50 border-none focus-visible:ring-1 focus-visible:ring-slate-300 h-9"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                            />
                        </div>
                        <div className="flex gap-2">
                            <Button
                                variant="outline"
                                size="sm"
                                className="h-9 px-3 text-xs font-bold border-slate-200"
                                onClick={handleExport}
                                disabled={isExporting || filteredBlocks.length === 0}
                            >
                                {isExporting ? (
                                    <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                                ) : (
                                    <Download className="w-4 h-4 mr-1" />
                                )}
                                Export
                            </Button>
                            <Button
                                variant="ghost"
                                size="sm"
                                className="h-9 px-3 text-xs font-bold text-red-600 hover:bg-red-50"
                                onClick={() => setConfirmDialog({ open: true, type: 'bulk' })}
                                disabled={selectedIds.size === 0 || isBulkDeleting}
                            >
                                {isBulkDeleting && <Loader2 className="w-4 h-4 mr-1 animate-spin" />}
                                Bulk Unblock ({selectedIds.size})
                            </Button>
                        </div>
                    </CardHeader>

                    {/* Loading state */}
                    {isLoading && (
                        <div className="flex-1 flex items-center justify-center">
                            <div className="flex flex-col items-center gap-3 text-slate-400">
                                <Loader2 className="w-8 h-8 animate-spin" />
                                <p className="text-sm">Lade Sperrliste...</p>
                            </div>
                        </div>
                    )}

                    {/* Error state */}
                    {error && !isLoading && (
                        <div className="flex-1 flex items-center justify-center">
                            <div className="flex flex-col items-center gap-3 text-red-500">
                                <AlertCircle className="w-8 h-8" />
                                <p className="text-sm">{error}</p>
                                <Button variant="outline" size="sm" onClick={refetch}>
                                    Erneut versuchen
                                </Button>
                            </div>
                        </div>
                    )}

                    {/* Empty state */}
                    {!isLoading && !error && filteredBlocks.length === 0 && (
                        <div className="flex-1 flex items-center justify-center">
                            <div className="flex flex-col items-center gap-4 text-slate-400">
                                <div className="p-4 bg-slate-100 rounded-full">
                                    <ShieldOff className="w-10 h-10 text-slate-400" />
                                </div>
                                <div className="text-center">
                                    <p className="text-lg font-medium text-slate-600">
                                        {search ? 'Keine Ergebnisse' : 'Keine IP-Sperren vorhanden'}
                                    </p>
                                    <p className="text-sm mt-1">
                                        {search
                                            ? 'Versuchen Sie eine andere Suche.'
                                            : 'Erstellen Sie Ihre erste IP-Sperre, um Ihr System zu schützen.'
                                        }
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Data table */}
                    {!isLoading && !error && filteredBlocks.length > 0 && (
                        <div className="flex-1 overflow-auto">
                            <table className="w-full text-sm text-left">
                                <thead className="bg-slate-50 text-slate-500 font-bold text-[10px] uppercase tracking-wider sticky top-0 z-10 border-b">
                                    <tr>
                                        <th className="px-6 py-3 w-10">
                                            <Checkbox
                                                checked={allSelected}
                                                onCheckedChange={toggleAllSelection}
                                            />
                                        </th>
                                        <th className="px-6 py-3">IP-Adresse</th>
                                        <th className="px-6 py-3 text-center">Grund</th>
                                        <th className="px-6 py-3">Blockiert am</th>
                                        <th className="px-6 py-3">Läuft ab</th>
                                        <th className="px-6 py-3 text-right">Aktionen</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y">
                                    {filteredBlocks.map((block) => (
                                        <tr key={block.id} className="hover:bg-slate-50/50 transition-colors group">
                                            <td className="px-6 py-4">
                                                <Checkbox
                                                    checked={selectedIds.has(block.id)}
                                                    onCheckedChange={() => toggleSelection(block.id)}
                                                />
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-2">
                                                    <Globe className="w-4 h-4 text-slate-400" />
                                                    <span className="font-bold text-slate-900 font-mono">{block.ipAddress}</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-center">
                                                <Badge className="rounded-full text-[10px] font-bold bg-red-50 text-red-600 border-red-100">
                                                    {block.reason || 'Keine Angabe'}
                                                </Badge>
                                            </td>
                                            <td className="px-6 py-4 text-slate-500">{formatDate(block.createdAt)}</td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-1.5 text-slate-500">
                                                    <Clock className="w-3.5 h-3.5" />
                                                    {block.expiresAt ? (
                                                        formatDate(block.expiresAt)
                                                    ) : (
                                                        <Badge variant="outline" className="text-[10px] font-bold">Permanent</Badge>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="h-8 w-8 text-red-400 hover:text-red-900 hover:bg-red-50"
                                                        onClick={() => setConfirmDialog({
                                                            open: true,
                                                            type: 'single',
                                                            id: block.id,
                                                            ip: block.ipAddress
                                                        })}
                                                        disabled={deletingId === block.id}
                                                    >
                                                        {deletingId === block.id ? (
                                                            <Loader2 className="w-4 h-4 animate-spin" />
                                                        ) : (
                                                            <Trash2 className="w-4 h-4" />
                                                        )}
                                                    </Button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </Card>
            </div>
        </>
    )
}
