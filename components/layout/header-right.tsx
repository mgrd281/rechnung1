'use client'

import React from 'react'
import { Bell, ChevronDown, User, CheckCircle2, History, ShieldAlert, LogOut, Settings, CreditCard } from 'lucide-react'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger
} from "@/components/ui/dropdown-menu"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

export function HeaderRight({ user, logout }: { user: any, logout: () => void }) {
    return (
        <div className="flex items-center gap-4">
            {/* System Status */}
            <div className="hidden lg:flex items-center gap-2 px-2 py-1 rounded-full hover:bg-white/5 transition-colors cursor-help" title="System Status: Normal">
                <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.4)]"></div>
                <span className="text-xs font-medium text-white/50">Operational</span>
            </div>

            {/* Notifications */}
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <button className="relative w-8 h-8 flex items-center justify-center rounded-full text-white/60 hover:text-white hover:bg-white/10 transition-colors">
                        <Bell className="w-4 h-4" />
                        <span className="absolute top-2 right-2 w-1.5 h-1.5 bg-indigo-500 rounded-full border border-[#0B0D12]"></span>
                    </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-80 p-0 mr-4 bg-[#0B0D12] border-white/10 text-white" align="end">
                    <div className="p-3 border-b border-white/10 flex justify-between items-center">
                        <span className="text-sm font-semibold">Benachrichtigungen</span>
                        <Badge variant="secondary" className="bg-white/10 text-white hover:bg-white/20">3 Neu</Badge>
                    </div>
                    <div className="max-h-[300px] overflow-y-auto">
                        <NotificationItem
                            icon={CheckCircle2}
                            color="text-emerald-400"
                            title="Import abgeschlossen"
                            desc="142 Produkte wurden erfolgreich importiert."
                            time="2m"
                        />
                        <NotificationItem
                            icon={ShieldAlert}
                            color="text-amber-400"
                            title="Sicherheitshinweis"
                            desc="Neuer Login von unbekannter IP (Berlin)."
                            time="1h"
                        />
                        <NotificationItem
                            icon={CreditCard}
                            color="text-violet-400"
                            title="Zahlung erhalten"
                            desc="Rechnung #3929 wurde beglichen."
                            time="2h"
                        />
                    </div>
                    <div className="p-2 border-t border-white/10 bg-white/5 text-center">
                        <button className="text-xs text-white/50 hover:text-white transition-colors">Alle markieren</button>
                    </div>
                </DropdownMenuContent>
            </DropdownMenu>

            {/* User Menu */}
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <button className="flex items-center gap-3 pl-2 pr-1 py-1 rounded-full hover:bg-white/5 transition-all group">
                        <Avatar className="w-8 h-8 border border-white/10">
                            <AvatarImage src={user?.image} />
                            <AvatarFallback className="bg-gradient-to-br from-violet-600 to-indigo-600 text-[10px] text-white">
                                {user?.firstName?.[0] || user?.email?.[0]?.toUpperCase()}
                            </AvatarFallback>
                        </Avatar>
                        <div className="hidden sm:flex flex-col items-start text-left">
                            <span className="text-xs font-semibold text-white/90 group-hover:text-white leading-tight">
                                {user?.name || user?.email?.split('@')[0]}
                            </span>
                            <span className="text-[10px] text-white/50 uppercase tracking-wider font-medium">
                                {user?.isAdmin ? 'Admin' : 'User'}
                            </span>
                        </div>
                        <ChevronDown className="w-3 h-3 text-white/30 group-hover:text-white/70 transition-colors hidden sm:block" />
                    </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56 bg-[#1A1D24] border-white/10 text-white" align="end">
                    <DropdownMenuLabel className="text-white/50 text-xs font-normal">Mein Account</DropdownMenuLabel>
                    <DropdownMenuItem className="focus:bg-white/10 focus:text-white cursor-pointer gap-2">
                        <User className="w-4 h-4 text-white/50" />
                        Profil
                    </DropdownMenuItem>
                    <DropdownMenuItem className="focus:bg-white/10 focus:text-white cursor-pointer gap-2">
                        <Settings className="w-4 h-4 text-white/50" />
                        Einstellungen
                    </DropdownMenuItem>
                    <DropdownMenuSeparator className="bg-white/10" />
                    <DropdownMenuItem className="focus:bg-white/10 focus:text-white cursor-pointer gap-2" onClick={() => logout()}>
                        <LogOut className="w-4 h-4 text-white/50" />
                        Abmelden
                    </DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>
        </div>
    )
}

function NotificationItem({ icon: Icon, color, title, desc, time }: any) {
    return (
        <div className="p-3 hover:bg-white/5 transition-colors cursor-pointer flex gap-3 border-b border-white/5 last:border-0 relative group">
            <div className={`mt-0.5 ${color}`}>
                <Icon className="w-4 h-4" />
            </div>
            <div>
                <h4 className="text-xs font-medium text-white group-hover:text-violet-200 transition-colors">{title}</h4>
                <p className="text-[11px] text-white/60 leading-snug mt-0.5">{desc}</p>
                <span className="text-[10px] text-white/30 mt-1 block">{time} ago</span>
            </div>
            <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 absolute right-3 top-4 opacity-100 group-hover:opacity-0 transition-opacity"></div>
        </div>
    )
}
