// ================================================
// PRODUCT INTELLIGENCE - MAIN PAGE
// ================================================

import { Metadata } from 'next'
import { ProductIntelligenceDashboard } from '@/components/product-intelligence/dashboard'

export const metadata: Metadata = {
    title: 'Product Intelligence | Enterprise Platform',
    description: 'Globale Product Discovery mit KI-gestützter Analyse und Trend-Erkennung'
}

export default function ProductIntelligencePage() {
    return (
        <div className="space-y-8">
            <div className="border-b border-slate-100 pb-6">
                <div className="flex items-center gap-3 mb-2">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg">
                        <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 00 2-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                        </svg>
                    </div>
                    <div>
                        <h1 className="text-3xl font-black text-slate-900 tracking-tight">
                            Product Intelligence
                        </h1>
                        <p className="text-sm text-slate-500 font-medium mt-1">
                            Globale Product Discovery · Trend-Erkennung · Profit-Estimation · KI-Optimierung
                        </p>
                    </div>
                </div>
            </div>

            <ProductIntelligenceDashboard />
        </div>
    )
}
