'use client'

import { Card, CardContent } from "@/components/ui/card"
import { ShieldAlert, Users, Activity } from "lucide-react"

interface Stats {
    blockedEmails: number
    blockedIps: number
    recentAttempts: number
}

export function SecurityKpiCards({ stats }: { stats: Stats }) {
    return (
        <div className="grid gap-4 md:grid-cols-3 mb-8">
            <Card className="border-slate-200 shadow-sm hover:shadow-md transition-shadow">
                <CardContent className="p-6 flex items-center gap-4">
                    <div className="p-3 bg-red-100 rounded-full text-red-600">
                        <Users className="w-6 h-6" />
                    </div>
                    <div>
                        <p className="text-sm font-medium text-slate-500">Blockierte E-Mails</p>
                        <h3 className="text-2xl font-bold text-slate-900">{stats.blockedEmails}</h3>
                    </div>
                </CardContent>
            </Card>

            <Card className="border-slate-200 shadow-sm hover:shadow-md transition-shadow">
                <CardContent className="p-6 flex items-center gap-4">
                    <div className="p-3 bg-orange-100 rounded-full text-orange-600">
                        <ShieldAlert className="w-6 h-6" />
                    </div>
                    <div>
                        <p className="text-sm font-medium text-slate-500">Blockierte IPs</p>
                        <h3 className="text-2xl font-bold text-slate-900">{stats.blockedIps}</h3>
                    </div>
                </CardContent>
            </Card>

            <Card className="border-slate-200 shadow-sm hover:shadow-md transition-shadow">
                <CardContent className="p-6 flex items-center gap-4">
                    <div className="p-3 bg-blue-100 rounded-full text-blue-600">
                        <Activity className="w-6 h-6" />
                    </div>
                    <div>
                        <p className="text-sm font-medium text-slate-500">Versuche (24h)</p>
                        <h3 className="text-2xl font-bold text-slate-900">{stats.recentAttempts}</h3>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
