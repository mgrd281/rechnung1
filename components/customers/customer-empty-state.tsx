'use client'

import { Button } from "@/components/ui/button"
import { Users, Plus, ShoppingBag } from "lucide-react"

export function CustomerEmptyState() {
    return (
        <div className="bg-white border-2 border-dashed border-slate-200 rounded-3xl p-20 flex flex-col items-center justify-center text-center space-y-6">
            <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center relative">
                <Users className="w-10 h-10 text-slate-300" />
                <div className="absolute -bottom-1 -right-1 bg-white p-1 rounded-full border border-slate-100 shadow-sm">
                    <Plus className="w-4 h-4 text-blue-600" />
                </div>
            </div>
            <div className="max-w-md space-y-2">
                <h2 className="text-2xl font-black uppercase tracking-tight text-slate-900">NOCH KEINE KUNDEN</h2>
                <p className="text-slate-500 font-medium tracking-tight">Verbinden Sie Ihren Shopify-Store oder erstellen Sie manuell Ihren ersten Kunden, um mit der Kundenintelligenz zu beginnen.</p>
            </div>
            <div className="flex flex-col sm:flex-row gap-3">
                <Button className="bg-slate-900 hover:bg-slate-800 font-black h-12 px-8 rounded-xl shadow-xl shadow-slate-200 uppercase tracking-widest text-[10px]">
                    <Plus className="w-4 h-4 mr-2" /> ERSTEN KUNDEN ERSTELLEN
                </Button>
                <Button variant="outline" className="border-slate-200 font-black h-12 px-8 rounded-xl uppercase tracking-widest text-[10px]">
                    <ShoppingBag className="w-4 h-4 mr-2" /> SHOPIFY VERBINDEN
                </Button>
            </div>
        </div>
    )
}

