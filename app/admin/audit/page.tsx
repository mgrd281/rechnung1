'use client'

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Search, Filter, Download, Activity } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"

export default function AuditPage() {
    const logs = [
        { id: 1, action: 'USER_LOGIN', user: 'admin@system.com', ip: '192.168.1.1', time: 'Vor 2 Min', status: 'SUCCESS' },
        { id: 2, action: 'SETTINGS_UPDATE', user: 'manager@system.com', ip: '10.0.0.5', time: 'Vor 15 Min', status: 'SUCCESS' },
        { id: 3, action: 'USER_BLOCK', user: 'admin@system.com', ip: '192.168.1.1', time: 'Vor 1 Std', status: 'SUCCESS' },
        { id: 4, action: 'LOGIN_FAILED', user: 'unknown@attacker.com', ip: '45.2.1.99', time: 'Vor 3 Std', status: 'FAILED' },
    ]

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <div>
                <h1 className="text-2xl font-bold tracking-tight text-slate-900">Audit Log</h1>
                <p className="text-slate-500">Vollständiges Protokoll aller Systemaktivitäten.</p>
            </div>

            <Card className="border-slate-200">
                <div className="p-4 border-b border-slate-100 flex items-center justify-between gap-4">
                    <div className="relative flex-1 max-w-sm">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                        <Input placeholder="Logs durchsuchen..." className="pl-9" />
                    </div>
                    <div className="flex gap-2">
                        <Button variant="outline" size="sm"><Filter className="w-4 h-4 mr-2" /> Filter</Button>
                        <Button variant="outline" size="sm"><Download className="w-4 h-4 mr-2" /> Export CSV</Button>
                    </div>
                </div>
                <CardContent className="p-0">
                    <Table>
                        <TableHeader>
                            <TableRow className="bg-slate-50 hover:bg-slate-50">
                                <TableHead>Aktion</TableHead>
                                <TableHead>Benutzer</TableHead>
                                <TableHead>IP Addresse</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead className="text-right">Zeitpunkt</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {logs.map((log) => (
                                <TableRow key={log.id}>
                                    <TableCell className="font-mono text-xs font-medium">
                                        <div className="flex items-center gap-2">
                                            <Activity className="w-3 h-3 text-slate-400" />
                                            {log.action}
                                        </div>
                                    </TableCell>
                                    <TableCell>{log.user}</TableCell>
                                    <TableCell className="font-mono text-xs text-slate-500">{log.ip}</TableCell>
                                    <TableCell>
                                        <Badge variant="outline" className={log.status === 'SUCCESS' ? 'bg-green-50 text-green-700 border-green-200' : 'bg-red-50 text-red-700 border-red-200'}>
                                            {log.status}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="text-right text-slate-500">{log.time}</TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    )
}
