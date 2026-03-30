// ================================================
// PRODUCT CANDIDATES TABLE
// ================================================

'use client'

import { useState, useEffect } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table'
import {
    TrendingUp, AlertTriangle, CheckCircle2,
    ExternalLink, Eye, XCircle, Loader2
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { ProductCandidate, TrendBadge } from '@/types/product-intelligence'

interface ProductCandidatesTableProps {
    limit?: number
    status?: string
    refreshKey?: number
}

export function ProductCandidatesTable({ limit = 50, status = 'new', refreshKey = 0 }: ProductCandidatesTableProps) {
    const [products, setProducts] = useState<ProductCandidate[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        loadProducts()
    }, [status, limit, refreshKey])

    const loadProducts = async () => {
        setLoading(true)
        try {
            const res = await fetch(`/api/product-intelligence/products?status=${status}&limit=${limit}`)
            const data = await res.json()

            if (data.success) {
                setProducts(data.products || [])
            }
        } catch (error) {
            console.error('Failed to load products:', error)
        } finally {
            setLoading(false)
        }
    }

    if (loading) {
        return (
            <div className="p-20 flex items-center justify-center">
                <Loader2 className="w-8 h-8 text-slate-400 animate-spin" />
            </div>
        )
    }

    if (products.length === 0) {
        return (
            <div className="p-20 text-center">
                <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-4">
                    <Eye className="w-8 h-8 text-slate-400" />
                </div>
                <h3 className="text-lg font-black text-slate-900 mb-2">Keine Produkte gefunden</h3>
                <p className="text-sm text-slate-500">Starten Sie einen Deep Search, um Produkte zu entdecken.</p>
            </div>
        )
    }

    return (
        <div className="overflow-x-auto">
            <Table>
                <TableHeader>
                    <TableRow className="hover:bg-transparent bg-slate-50/50 border-y border-slate-100">
                        <TableCell className="text-[10px] font-black uppercase tracking-wider text-slate-500 w-[350px]">Produkt</TableCell>
                        <TableCell className="text-[10px] font-black uppercase tracking-wider text-slate-500 w-[100px]">Trend</TableCell>
                        <TableCell className="text-[10px] font-black uppercase tracking-wider text-slate-500 w-[120px]">Profit</TableCell>
                        <TableCell className="text-[10px] font-black uppercase tracking-wider text-slate-500 w-[100px]">Demand</TableCell>
                        <TableCell className="text-[10px] font-black uppercase tracking-wider text-slate-500 w-[100px]">Risk</TableCell>
                        <TableCell className="text-[10px] font-black uppercase tracking-wider text-slate-500">Competitor Prices</TableCell>
                        <TableCell className="text-[10px] font-black uppercase tracking-wider text-slate-500 text-right">Actions</TableCell>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {products.map((product) => (
                        <TableRow key={product.id} className="group hover:bg-slate-50/50 transition-colors">
                            {/* Product Info */}
                            <TableCell className="py-4 align-top">
                                <div className="flex gap-3">
                                    <div className="w-16 h-16 rounded-lg bg-slate-100 border border-slate-200 overflow-hidden flex-shrink-0">
                                        {product.images?.[0] ? (
                                            <img src={product.images[0]} alt={product.title} className="w-full h-full object-cover" />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center text-slate-400 text-xs font-black">
                                                NO IMG
                                            </div>
                                        )}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <h4 className="font-bold text-slate-900 text-sm leading-tight mb-1 truncate">{product.title}</h4>
                                        <div className="flex items-center gap-2 flex-wrap">
                                            {product.brand && (
                                                <Badge variant="secondary" className="bg-slate-100 text-slate-700 text-[9px] px-2 h-5 font-bold">
                                                    {product.brand}
                                                </Badge>
                                            )}
                                            {product.category && (
                                                <span className="text-[10px] text-slate-500 font-medium">{product.category}</span>
                                            )}
                                        </div>
                                        <div className="mt-2 flex items-center gap-2">
                                            {product.detectedPrice && (
                                                <span className="text-lg font-black text-indigo-600">{product.detectedPrice.toFixed(2)}€</span>
                                            )}
                                            {product.ean && (
                                                <span className="text-[9px] text-slate-400 font-medium">EAN: {product.ean}</span>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </TableCell>

                            {/* Trend */}
                            <TableCell className="align-top py-5">
                                <TrendIndicator score={product.trendScore} />
                            </TableCell>

                            {/* Profit */}
                            <TableCell className="align-top py-5">
                                {product.estimatedProfit !== null && product.estimatedProfit !== undefined ? (
                                    <div className="space-y-1">
                                        <div className="text-base font-black text-emerald-600">
                                            {product.estimatedProfit.toFixed(2)}€
                                        </div>
                                        <div className="text-[10px] text-slate-500 font-medium">
                                            {product.marginPercent?.toFixed(1)}% Marge
                                        </div>
                                    </div>
                                ) : (
                                    <span className="text-xs text-slate-400">N/A</span>
                                )}
                            </TableCell>

                            {/* Demand */}
                            <TableCell className="align-top py-5">
                                <DemandBadge level={product.demandLevel} />
                            </TableCell>

                            {/* Risk */}
                            <TableCell className="align-top py-5">
                                <RiskIndicator score={product.riskScore} />
                            </TableCell>

                            {/* Competitor Prices */}
                            <TableCell className="align-top py-5">
                                {product.competitorPrices && product.competitorPrices.length > 0 ? (
                                    <div className="space-y-1">
                                        <div className="text-xs font-bold text-slate-700">
                                            Min: {product.minCompetitorPrice?.toFixed(2)}€
                                        </div>
                                        <div className="text-[10px] text-slate-500">
                                            Ø {product.avgCompetitorPrice?.toFixed(2)}€
                                        </div>
                                    </div>
                                ) : (
                                    <span className="text-xs text-slate-400">Keine Daten</span>
                                )}
                            </TableCell>

                            {/* Actions */}
                            <TableCell className="align-top py-5 text-right">
                                <div className="flex items-center justify-end gap-2">
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-8 w-8 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"
                                        onClick={() => window.open(product.sourceUrl, '_blank')}
                                    >
                                        <ExternalLink className="w-4 h-4 text-slate-600" />
                                    </Button>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        className="h-8 text-xs font-bold border-slate-200 opacity-0 group-hover:opacity-100 transition-opacity"
                                    >
                                        Review
                                    </Button>
                                </div>
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </div>
    )
}

function TrendIndicator({ score }: { score: number }) {
    let badge: TrendBadge = 'stable'
    let color = 'text-slate-600'
    let bgColor = 'bg-slate-100'
    let borderColor = 'border-slate-200'
    let icon = '📊'

    if (score >= 80) {
        badge = 'hot'
        color = 'text-orange-700'
        bgColor = 'bg-orange-50'
        borderColor = 'border-orange-200'
        icon = '🔥'
    } else if (score >= 60) {
        badge = 'rising'
        color = 'text-emerald-700'
        bgColor = 'bg-emerald-50'
        borderColor = 'border-emerald-200'
        icon = '⚡'
    } else if (score >= 40) {
        badge = 'stable'
        color = 'text-blue-700'
        bgColor = 'bg-blue-50'
        borderColor = 'border-blue-200'
        icon = '🧊'
    }

    return (
        <div className="flex flex-col gap-2">
            <Badge className={cn('text-[9px] font-black px-2 h-6 border', bgColor, color, borderColor)}>
                {icon} {badge.toUpperCase()}
            </Badge>
            <div className="text-2xl font-black text-slate-900">{score}</div>
        </div>
    )
}

function DemandBadge({ level }: { level: string }) {
    const configs = {
        high: { label: 'HIGH', color: 'text-emerald-700', bg: 'bg-emerald-50', border: 'border-emerald-200' },
        medium: { label: 'MEDIUM', color: 'text-amber-700', bg: 'bg-amber-50', border: 'border-amber-200' },
        low: { label: 'LOW', color: 'text-slate-600', bg: 'bg-slate-100', border: 'border-slate-200' }
    }

    const config = configs[level as keyof typeof configs] || configs.medium

    return (
        <Badge className={cn('text-[9px] font-black px-2 h-6 border', config.bg, config.color, config.border)}>
            {config.label}
        </Badge>
    )
}

function RiskIndicator({ score }: { score: number }) {
    let level: 'safe' | 'medium' | 'high' = 'medium'
    let color = 'text-amber-700'
    let bgColor = 'bg-amber-50'
    let borderColor = 'border-amber-200'
    let icon = <AlertTriangle className="w-3 h-3" />

    if (score <= 30) {
        level = 'safe'
        color = 'text-emerald-700'
        bgColor = 'bg-emerald-50'
        borderColor = 'border-emerald-200'
        icon = <CheckCircle2 className="w-3 h-3" />
    } else if (score > 60) {
        level = 'high'
        color = 'text-rose-700'
        bgColor = 'bg-rose-50'
        borderColor = 'border-rose-200'
        icon = <XCircle className="w-3 h-3" />
    }

    return (
        <div className="flex flex-col gap-1">
            <Badge className={cn('text-[9px] font-black px-2 h-6 border inline-flex items-center gap-1 w-fit', bgColor, color, borderColor)}>
                {icon}
                {level.toUpperCase()}
            </Badge>
            <div className="text-xs font-bold text-slate-500">{score}/100</div>
        </div>
    )
}
