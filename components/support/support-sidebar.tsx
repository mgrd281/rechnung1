'use client'

import React from 'react'
import { Inbox, Clock, CheckCircle2, AlertOctagon, Ban, Tag, MessageSquare, TrendingUp } from 'lucide-react'
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"

interface SupportSidebarProps {
    view: string
    onViewChange: (view: string) => void
    count: number
}

export function SupportSidebar({ view, onViewChange, count }: SupportSidebarProps) {
    const navItems = [
        { id: 'inbox', label: 'Posteingang', icon: Inbox, count: count, color: 'text-gray-700' },
        { id: 'assigned', label: 'Mir zugewiesen', icon: UserIcon, count: 0, color: 'text-gray-600' },
        { id: 'waiting', label: 'Wartend', icon: Clock, count: 2, color: 'text-amber-600' },
        { id: 'solved', label: 'Gelöst', icon: CheckCircle2, count: 124, color: 'text-emerald-600' },
        { id: 'spam', label: 'Spam', icon: Ban, count: 0, color: 'text-red-500' },
    ]

    const views = [
        { id: 'today', label: 'Heute erstellt', icon: Clock, color: 'bg-blue-100 text-blue-700' },
        { id: 'priority', label: 'Hohe Priorität', icon: AlertOctagon, color: 'bg-red-100 text-red-700' },
        { id: 'refund', label: 'Rückerstattung', icon: Tag, color: 'bg-purple-100 text-purple-700' },
    ]

    return (
        <div className="w-[260px] flex flex-col border-r border-gray-200 bg-gray-50/50 h-[calc(100vh-56px)] sticky top-[56px]">
            <div className="p-4 space-y-1">
                {navItems.map((item) => (
                    <button
                        key={item.id}
                        onClick={() => onViewChange(item.id)}
                        className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm font-medium transition-colors ${view === item.id
                                ? 'bg-white text-gray-900 shadow-sm ring-1 ring-gray-200'
                                : 'text-gray-600 hover:bg-gray-100/80 hover:text-gray-900'
                            }`}
                    >
                        <div className="flex items-center gap-3">
                            <item.icon className={`w-4 h-4 ${item.color}`} />
                            {item.label}
                        </div>
                        {item.count > 0 && (
                            <Badge variant="secondary" className="bg-gray-100 text-gray-600 h-5 px-1.5 min-w-[20px] justify-center">
                                {item.count}
                            </Badge>
                        )}
                    </button>
                ))}
            </div>

            <div className="px-4 py-2">
                <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2 px-2">
                    Gespeicherte Filter
                </div>
                <div className="space-y-0.5">
                    {views.map((item) => (
                        <button
                            key={item.id}
                            className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-gray-600 hover:bg-gray-100/80 transition-colors"
                        >
                            <div className={`w-2 h-2 rounded-full ${item.color.split(' ')[0].replace('bg-', 'bg-')}`}></div>
                            {item.label}
                        </button>
                    ))}
                </div>
            </div>

            <div className="mt-auto p-4 border-t border-gray-200">
                <div className="bg-white rounded-xl border border-gray-200 p-3 shadow-sm">
                    <div className="flex items-center gap-2 mb-2 text-xs font-semibold text-gray-500">
                        <TrendingUp className="w-3 h-3" />
                        Performance (Heute)
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-center">
                        <div>
                            <div className="text-lg font-bold text-gray-900">12m</div>
                            <div className="text-[10px] text-gray-500">Antwortzeit</div>
                        </div>
                        <div>
                            <div className="text-lg font-bold text-gray-900">98%</div>
                            <div className="text-[10px] text-gray-500">CSAT</div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}

function UserIcon({ className }: any) {
    return (
        <svg className={className} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>
    )
}
