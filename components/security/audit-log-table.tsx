'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Search, Download, History, User, Lock, Globe } from "lucide-react"

export function AuditLogTable() {
    const [logs, setLogs] = useState<any[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        fetch('/api/security/audit-log')
            .then(res => res.json())
            .then(data => {
                setLogs(data)
                setLoading(false)
            })
    }, [])

    return (
        <Card className="border-slate-200 shadow-sm overflow-hidden flex flex-col h-[calc(100vh-320px)] min-h-[500px]">
            <CardHeader className="border-b flex flex-row items-center justify-between py-4 bg-slate-50/10">
                <div className="flex items-center gap-2">
                    <History className="w-5 h-5 text-slate-400" />
                    <CardTitle className="text-base">Audit Log</CardTitle>
                </div>
                <div className="flex gap-2">
                    <div className="relative w-64">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <Input
                            placeholder="Logs durchsuchen..."
                            className="pl-9 h-9 border-slate-200 bg-white"
                        />
                    </div>
                    <Button variant="outline" size="sm" className="h-9 font-bold"><Download className="w-4 h-4 mr-2" /> CSV Export</Button>
                </div>
            </CardHeader>
            <div className="flex-1 overflow-auto">
                <table className="w-full text-sm text-left">
                    <thead className="bg-slate-50 text-slate-500 font-bold text-[10px] uppercase tracking-wider sticky top-0 z-10 border-b">
                        <tr>
                            <th className="px-6 py-4">Wer</th>
                            <th className="px-6 py-4">Aktion</th>
                            <th className="px-6 py-4">Ziel</th>
                            <th className="px-6 py-4">Zeitpunkt</th>
                            <th className="px-6 py-4 text-right">IP-Adresse</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y">
                        {loading ? (
                            <tr><td colSpan={5} className="px-6 py-12 text-center text-slate-400">Lädt Audit Logs...</td></tr>
                        ) : logs.length === 0 ? (
                            <tr><td colSpan={5} className="px-6 py-12 text-center text-slate-400">Keine Einträge vorhanden.</td></tr>
                        ) : (
                            logs.map((log) => (
                                <tr key={log.id} className="hover:bg-slate-50/50 transition-colors">
                                    <td className="px-6 py-4 flex items-center gap-2">
                                        <div className="h-6 w-6 rounded-full bg-slate-100 flex items-center justify-center">
                                            <User className="w-3 h-3 text-slate-500" />
                                        </div>
                                        <span className="font-medium text-slate-900">{log.user}</span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-1.5">
                                            <Lock className="w-3.5 h-3.5 text-slate-400" />
                                            <span className="text-xs font-bold uppercase tracking-tight">{log.action.replace(/_/g, ' ')}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-slate-600 font-mono text-xs">{log.target}</td>
                                    <td className="px-6 py-4 text-slate-500">{new Date(log.timestamp).toLocaleString('de-DE')}</td>
                                    <td className="px-6 py-4 text-right text-slate-400 font-mono text-xs">
                                        <div className="flex items-center justify-end gap-1">
                                            <Globe className="w-3 h-3" />
                                            {log.ip}
                                        </div>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </Card>
    )
}
