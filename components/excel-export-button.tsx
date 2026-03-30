'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import {
    FileSpreadsheet,
    Loader2,
    Download
} from 'lucide-react'
import { toast } from 'sonner'

interface ExcelExportButtonProps {
    selectedIds?: string[]
    filters?: any
    totalCount?: number
    selectedCount?: number
    className?: string
    variant?: "outline" | "ghost" | "secondary" | "default"
}

export default function ExcelExportButton({
    selectedIds = [],
    filters = {},
    totalCount = 0,
    selectedCount = 0,
    className = "",
    variant = "outline"
}: ExcelExportButtonProps) {
    const [loading, setLoading] = useState(false)

    const handleExport = async () => {
        setLoading(true)
        try {
            const response = await fetch('/api/exports/invoices/excel', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    selectedIds: selectedIds.length > 0 ? selectedIds : undefined,
                    filters
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
            const date = new Date()
            const monthStr = (date.getMonth() + 1).toString().padStart(2, '0')
            link.download = `Karinex_Finanzreport_${date.getFullYear()}_${monthStr}.xlsx`
            document.body.appendChild(link)
            link.click()
            document.body.removeChild(link)
            window.URL.revokeObjectURL(url)

            toast.success('Excel-Finanzreport erfolgreich generiert')
        } catch (error: any) {
            console.error('Excel Export Fehler:', error)
            toast.error(error.message || 'Fehler beim Generieren des Excel-Berichts')
        } finally {
            setLoading(false)
        }
    }

    const count = selectedCount > 0 ? selectedCount : (filters?.displayedInvoices?.length || totalCount)
    const isEnabled = count > 0

    return (
        <Button
            variant={variant}
            onClick={handleExport}
            disabled={loading || !isEnabled}
            className={`${className} group transition-all flex items-center gap-2`}
            title="Exportiert den Karinex Enterprise Finanzreport (Excel)"
        >
            {loading ? (
                <Loader2 className="h-[18px] w-[18px] animate-spin text-emerald-600" />
            ) : (
                <FileSpreadsheet className="h-[18px] w-[18px] text-emerald-600" />
            )}
            <span>{loading ? 'Generiere...' : 'Excel'}</span>
        </Button>
    )
}
