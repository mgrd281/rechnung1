'use client'

import { Button } from "@/components/ui/button"
import { ShieldCheck, ShieldAlert, ShieldX } from "lucide-react"

interface SecurityHeaderProps {
    riskLevel: string
    onBlockUser: () => void
}

export function SecurityHeader({ riskLevel, onBlockUser }: SecurityHeaderProps) {
    let statusColor = "bg-emerald-500"
    let statusText = "Protected"
    let StatusIcon = ShieldCheck

    if (riskLevel === 'Medium') {
        statusColor = "bg-amber-500"
        statusText = "Warning"
        StatusIcon = ShieldAlert
    } else if (riskLevel === 'High') {
        statusColor = "bg-red-500"
        statusText = "Under Attack"
        StatusIcon = ShieldX
    }

    return (
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
            <div>
                <h1 className="text-3xl font-bold tracking-tight text-slate-900">Security Center</h1>
                <p className="text-slate-500 mt-1">Live protection for your shop</p>
            </div>

            <div className="flex items-center gap-4">
                <div className="flex items-center gap-2 px-3 py-1.5 bg-white rounded-full border border-slate-200 shadow-sm">
                    <span className={`w-2.5 h-2.5 rounded-full ${statusColor} animate-pulse`} />
                    <span className="text-sm font-medium text-slate-700">{statusText}</span>
                </div>

                <div className="flex gap-2">
                    <Button variant="outline">Security Regeln</Button>
                    <Button
                        className="bg-red-600 hover:bg-red-700 text-white"
                        onClick={onBlockUser}
                    >
                        + Blockieren
                    </Button>
                </div>
            </div>
        </div>
    )
}
