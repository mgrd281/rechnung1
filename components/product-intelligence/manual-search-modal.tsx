// ================================================
// MANUAL SEARCH MODAL
// ================================================

'use client'

import { useState } from 'react'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Search, Sparkles, Loader2 } from 'lucide-react'

interface ManualSearchModalProps {
    isOpen: boolean
    onClose: () => void
    onSuccess: (jobId: string) => void
}

export function ManualSearchModal({ isOpen, onClose, onSuccess }: ManualSearchModalProps) {
    const [query, setQuery] = useState('')
    const [priceMin, setPriceMin] = useState('')
    const [priceMax, setPriceMax] = useState('')
    const [freshnessDays, setFreshnessDays] = useState('30')
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)

    const handleSearch = async () => {
        if (!query.trim()) {
            setError('Bitte Marke oder Kategorie eingeben')
            return
        }

        setLoading(true)
        setError(null)

        try {
            const res = await fetch('/api/product-intelligence/jobs', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    mode: 'manual',
                    query: query.trim(),
                    priceMin: priceMin ? parseFloat(priceMin) : undefined,
                    priceMax: priceMax ? parseFloat(priceMax) : undefined,
                    freshnessDays: parseInt(freshnessDays),
                    region: 'DE'
                })
            })

            const data = await res.json()

            if (data.success) {
                onSuccess(data.jobId)
                // Reset form
                setQuery('')
                setPriceMin('')
                setPriceMax('')
                setFreshnessDays('30')
            } else {
                setError(data.error || 'Fehler beim Starten der Suche')
            }
        } catch (err) {
            setError('Verbindungsfehler zum Server')
        } finally {
            setLoading(false)
        }
    }

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[600px] bg-white">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-3 text-2xl">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg">
                            <Search className="w-5 h-5 text-white" />
                        </div>
                        <span className="font-black">Manual Deep Search</span>
                    </DialogTitle>
                    <DialogDescription className="text-sm text-slate-500">
                        Geben Sie eine Marke oder Kategorie ein. Das System crawlt automatisch mehrere Quellen und findet neue Produkte.
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-6 py-4">
                    {/* Main Query */}
                    <div className="space-y-2">
                        <Label htmlFor="query" className="text-xs font-black uppercase tracking-wider text-slate-700">
                            Marke oder Kategorie *
                        </Label>
                        <div className="relative">
                            <Input
                                id="query"
                                placeholder="z.B. Apple, Samsung, Kopfhörer, Gaming"
                                value={query}
                                onChange={(e) => setQuery(e.target.value)}
                                className="h-12 pl-12 text-base border-slate-200 focus:border-indigo-500 focus:ring-indigo-500"
                                disabled={loading}
                            />
                            <Sparkles className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-indigo-500" />
                        </div>
                    </div>

                    {/* Price Range */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="priceMin" className="text-xs font-black uppercase tracking-wider text-slate-700">
                                Min Preis (€)
                            </Label>
                            <Input
                                id="priceMin"
                                type="number"
                                placeholder="0"
                                value={priceMin}
                                onChange={(e) => setPriceMin(e.target.value)}
                                className="h-10 border-slate-200"
                                disabled={loading}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="priceMax" className="text-xs font-black uppercase tracking-wider text-slate-700">
                                Max Preis (€)
                            </Label>
                            <Input
                                id="priceMax"
                                type="number"
                                placeholder="999"
                                value={priceMax}
                                onChange={(e) => setPriceMax(e.target.value)}
                                className="h-10 border-slate-200"
                                disabled={loading}
                            />
                        </div>
                    </div>

                    {/* Freshness */}
                    <div className="space-y-2">
                        <Label htmlFor="freshness" className="text-xs font-black uppercase tracking-wider text-slate-700">
                            Freshness (Tage)
                        </Label>
                        <select
                            id="freshness"
                            value={freshnessDays}
                            onChange={(e) => setFreshnessDays(e.target.value)}
                            className="w-full h-10 px-3 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50"
                            disabled={loading}
                        >
                            <option value="7">Letzte 7 Tage</option>
                            <option value="30">Letzte 30 Tage</option>
                            <option value="90">Letzte 90 Tage</option>
                        </select>
                    </div>

                    {/* Info Box */}
                    <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-4">
                        <p className="text-xs text-indigo-900 font-medium leading-relaxed">
                            <strong className="font-black">Was passiert:</strong><br />
                            • Mehrere Quellen werden automatisch durchsucht<br />
                            • Nur neue, hochwertige Produkte werden importiert<br />
                            • Duplikate werden automatisch entfernt<br />
                            • Produkte landen zur Review in der Datenbank
                        </p>
                    </div>

                    {/* Error */}
                    {error && (
                        <div className="bg-rose-50 border border-rose-100 rounded-lg p-3">
                            <p className="text-sm text-rose-700 font-medium">{error}</p>
                        </div>
                    )}
                </div>

                <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                    <Button
                        variant="outline"
                        onClick={onClose}
                        disabled={loading}
                        className="h-10"
                    >
                        Abbrechen
                    </Button>
                    <Button
                        onClick={handleSearch}
                        disabled={loading || !query.trim()}
                        className="h-10 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white shadow-lg px-6 font-bold"
                    >
                        {loading ? (
                            <>
                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                Crawling...
                            </>
                        ) : (
                            <>
                                <Search className="w-4 h-4 mr-2" />
                                Deep Search Starten
                            </>
                        )}
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    )
}
