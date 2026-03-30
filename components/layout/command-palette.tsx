'use client'

import React, { useState, useEffect } from 'react'
import { Dialog, DialogContent } from "@/components/ui/dialog"
import { Search, FileText, Users, Settings, Zap, ArrowRight, Shield, Link2, Youtube } from "lucide-react"
import { useRouter } from 'next/navigation'
import { Badge } from "@/components/ui/badge"

export function CommandPalette() {
    const [open, setOpen] = useState(false)
    const [search, setSearch] = useState('')
    const router = useRouter()

    useEffect(() => {
        const down = (e: KeyboardEvent) => {
            if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
                e.preventDefault()
                setOpen((open) => !open)
            }
        }
        document.addEventListener('keydown', down)
        return () => document.removeEventListener('keydown', down)
    }, [])

    const runCommand = (command: () => void) => {
        setOpen(false)
        command()
    }

    const groups = [
        {
            group: 'Vorschläge',
            items: [
                { icon: FileText, label: 'Neue Rechnung erstellen', action: () => router.push('/invoices/new'), shortcut: 'N R' },
                { icon: Users, label: 'Neuer Kunde', action: () => router.push('/customers/new'), shortcut: 'N K' },
            ]
        },
        {
            group: 'Gehe zu',
            items: [
                { icon: Zap, label: 'Growth Hub', action: () => router.push('/settings/marketing') },
                { icon: Shield, label: 'Security Center', action: () => router.push('/settings/security') },
                { icon: Link2, label: 'Backlinks Intelligence', action: () => router.push('/seo-intelligence?tab=backlinks') },
                { icon: Youtube, label: 'عناكب الفيديو (Video Spider)', action: () => router.push('/admin/video-spider') },
                { icon: Settings, label: 'Einstellungen', action: () => router.push('/settings') },
            ]
        }
    ]

    return (
        <>
            {/* Trigger Button (Desktop) */}
            <button
                onClick={() => setOpen(true)}
                className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 hover:bg-white/15 text-white/50 text-sm w-[320px] lg:w-[420px] transition-all border border-transparent hover:border-white/10"
            >
                <Search className="w-3.5 h-3.5" />
                <span>Suchen oder Befehl eingeben...</span>
                <span className="ml-auto text-xs bg-white/10 px-1.5 py-0.5 rounded text-white/40">Cmd K</span>
            </button>

            {/* Trigger Button (Mobile) */}
            <button
                onClick={() => setOpen(true)}
                className="md:hidden flex items-center justify-center p-2 rounded-full text-white/70 hover:bg-white/10"
            >
                <Search className="w-5 h-5" />
            </button>

            <Dialog open={open} onOpenChange={setOpen}>
                <DialogContent className="p-0 gap-0 bg-[#0B0D12] border-white/10 text-white max-w-2xl overflow-hidden shadow-2xl">
                    <div className="flex items-center border-b border-white/10 px-4 py-3">
                        <Search className="w-4 h-4 text-white/50 mr-3" />
                        <input
                            className="flex-1 bg-transparent outline-none placeholder:text-white/30 text-sm h-6"
                            placeholder="Wonach suchen Sie?"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            autoFocus
                        />
                        <Badge variant="outline" className="text-xs text-white/30 border-white/10">ESC</Badge>
                    </div>

                    <div className="py-2 max-h-[400px] overflow-y-auto">
                        {groups.map((group) => (
                            <div key={group.group} className="px-2 mb-4">
                                <div className="px-2 text-[10px] font-medium text-white/30 uppercase tracking-wider mb-1">
                                    {group.group}
                                </div>
                                {group.items.map((item: any) => (
                                    <button
                                        key={item.label}
                                        onClick={() => runCommand(item.action)}
                                        className="w-full flex items-center gap-3 px-3 py-2.5 rounded-md hover:bg-white/10 text-left group transition-colors"
                                    >
                                        <div className="w-8 h-8 rounded-md bg-white/5 flex items-center justify-center text-white/70 group-hover:text-white group-hover:bg-white/10">
                                            <item.icon className="w-4 h-4" />
                                        </div>
                                        <div className="flex-1">
                                            <span className="text-sm text-white/80 group-hover:text-white">{item.label}</span>
                                        </div>
                                        {item.shortcut && (
                                            <div className="flex gap-1">
                                                {item.shortcut.split(' ').map((key: string) => (
                                                    <span key={key} className="text-[10px] bg-white/10 px-1.5 py-0.5 rounded text-white/50 min-w-[1.2rem] text-center border border-white/5">
                                                        {key}
                                                    </span>
                                                ))}
                                            </div>
                                        )}
                                        <ArrowRight className="w-3 h-3 text-white/30 opacity-0 group-hover:opacity-100 -translate-x-1 group-hover:translate-x-0 transition-all" />
                                    </button>
                                ))}
                            </div>
                        ))}

                        {/* Footer */}
                        <div className="px-4 py-2 border-t border-white/5 text-[10px] text-white/30 flex justify-between">
                            <span>RechnungsProfi Command</span>
                            <span>v2.4.0</span>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
        </>
    )
}
