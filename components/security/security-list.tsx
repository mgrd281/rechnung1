'use client'

import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ShieldCheck, Mail, Globe, Clock, MoreVertical, Trash2 } from "lucide-react"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

interface SecurityItem {
    id: string
    kind: 'email' | 'ip'
    value: string
    reason?: string
    blockedAt: string
    type: string
    blockedBy?: string
}

interface SecurityListProps {
    items: SecurityItem[]
    isLoading: boolean
    onUnblock: (id: string, kind: 'email' | 'ip') => void
    onOpenBlockModal: () => void
}

export function SecurityList({ items, isLoading, onUnblock, onOpenBlockModal }: SecurityListProps) {
    if (isLoading) {
        return <div className="p-8 text-center text-slate-400">Loading security data...</div>
    }

    if (items.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center p-12 bg-slate-50/50 rounded-2xl border border-dashed border-slate-200 text-center">
                <div className="h-20 w-20 bg-emerald-100 rounded-full flex items-center justify-center mb-6">
                    <ShieldCheck className="h-10 w-10 text-emerald-600" />
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-2">Keine blockierten Benutzer</h3>
                <p className="text-slate-500 max-w-md mb-8">
                    Ihr Shop ist aktuell sauber. Blockieren Sie verdächtige Kunden manuell oder aktivieren Sie den automatischen Schutz.
                </p>
                <div className="flex gap-4">
                    <Button onClick={onOpenBlockModal} className="bg-slate-900 hover:bg-slate-800">
                        + Benutzer blockieren
                    </Button>
                    {/* Add Automation Button Link here if needed */}
                </div>
            </div>
        )
    }

    return (
        <div className="space-y-4">
            {items.map((item) => (
                <Card key={item.id} className="group border-slate-200 hover:border-slate-300 transition-colors">
                    <CardContent className="p-4 flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <div className={`h-10 w-10 rounded-full flex items-center justify-center ${item.kind === 'email' ? 'bg-violet-100 text-violet-600' : 'bg-orange-100 text-orange-600'}`}>
                                {item.kind === 'email' ? <Mail className="h-5 w-5" /> : <Globe className="h-5 w-5" />}
                            </div>
                            <div>
                                <h4 className="font-bold text-slate-900">{item.value}</h4>
                                <div className="flex items-center gap-2 text-xs text-slate-500 mt-1">
                                    <Badge variant="outline" className="text-[10px] uppercase font-bold tracking-wider">
                                        {item.type}
                                    </Badge>
                                    <span className="flex items-center gap-1">
                                        <Clock className="w-3 h-3" />
                                        {new Date(item.blockedAt).toLocaleDateString()}
                                    </span>
                                    {item.reason && (
                                        <span className="text-slate-400">• {item.reason}</span>
                                    )}
                                </div>
                            </div>
                        </div>

                        <div className="flex items-center gap-4">
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-slate-900">
                                        <MoreVertical className="h-4 w-4" />
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                    <DropdownMenuItem onClick={() => onUnblock(item.id, item.kind)} className="text-red-600 focus:text-red-700 focus:bg-red-50">
                                        <Trash2 className="mr-2 h-4 w-4" /> Entsperren
                                    </DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </div>
                    </CardContent>
                </Card>
            ))}
        </div>
    )
}
