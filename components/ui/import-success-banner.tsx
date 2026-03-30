'use client'

import { useState, useEffect } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { CircleCheck, X } from 'lucide-react'
import { Button } from './button'

export function ImportSuccessBanner() {
    const searchParams = useSearchParams()
    const router = useRouter()
    const [isVisible, setIsVisible] = useState(false)
    const [count, setCount] = useState(0)

    useEffect(() => {
        if (searchParams.get('source') === 'csv_import') {
            setIsVisible(true)
            setCount(parseInt(searchParams.get('count') || '0'))

            // Auto-dismiss after 15 seconds
            const timer = setTimeout(() => {
                handleDismiss()
            }, 15000)

            return () => clearTimeout(timer)
        }
    }, [searchParams])

    const handleDismiss = () => {
        setIsVisible(false)
        // Clean up query params without full page refresh
        const params = new URLSearchParams(searchParams.toString())
        params.delete('source')
        params.delete('importId')
        params.delete('count')
        const query = params.toString()
        router.replace(window.location.pathname + (query ? `?${query}` : ''))
    }

    if (!isVisible) return null

    return (
        <div className="bg-emerald-600 px-4 py-2.5 text-white shadow-lg animate-in slide-in-from-top-full duration-700 sticky top-0 z-[100] w-full">
            <div className="max-w-7xl mx-auto flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="bg-white/20 rounded-full p-1">
                        <CircleCheck className="h-4 w-4 text-white" />
                    </div>
                    <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3">
                        <p className="text-sm font-black uppercase tracking-tight">
                            Import erfolgreich abgeschlossen
                        </p>
                        <span className="text-[11px] font-bold opacity-90 bg-black/10 px-2 py-0.5 rounded-full border border-white/10">
                            {count} {count === 1 ? 'Datensatz' : 'Datensätze'} übernommen
                        </span>
                    </div>
                </div>
                <button
                    onClick={handleDismiss}
                    className="p-1 hover:bg-white/10 rounded-full transition-colors"
                    aria-label="Schließen"
                >
                    <X className="h-4 w-4" />
                </button>
            </div>
        </div>
    )
}
