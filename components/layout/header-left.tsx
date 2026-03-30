'use client'

import React from 'react'
import Link from 'next/link'
import { FileText, ChevronDown, Check } from 'lucide-react'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger
} from "@/components/ui/dropdown-menu"
import { Badge } from "@/components/ui/badge"

export function HeaderLeft() {
    return (
        <div className="flex items-center gap-3">
            <Link href="/dashboard" className="flex items-center justify-center bg-white rounded-md w-8 h-8 shadow-[0_0_10px_rgba(255,255,255,0.2)] hover:shadow-[0_0_15px_rgba(255,255,255,0.4)] transition-all">
                <FileText className="w-4 h-4 text-[#0B0D12]" />
            </Link>

            {/* Workspace Switcher */}
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <button className="flex items-center gap-2 px-2 py-1 rounded hover:bg-white/5 transition-colors group">
                        <div className="flex flex-col items-start gap-0.5">
                            <span className="text-white font-medium text-sm leading-none group-hover:text-white/90">
                                RechnungsProfi
                                <span className="text-white/40 font-normal mx-1">/</span>
                                <span className="text-white/70">Shopify Store</span>
                            </span>
                        </div>
                        <ChevronDown className="w-3 h-3 text-white/30 group-hover:text-white/70 transition-colors" />
                    </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-[240px] bg-[#0B0D12] border-white/10 text-white" align="start">
                    <DropdownMenuLabel className="text-white/50 text-[10px] uppercase tracking-wider font-medium">Workspaces</DropdownMenuLabel>

                    <DropdownMenuItem className="focus:bg-white/10 focus:text-white cursor-pointer justify-between group">
                        <div className="flex items-center gap-2">
                            <div className="w-5 h-5 bg-white/10 rounded flex items-center justify-center text-[10px] font-bold">R</div>
                            <span>RechnungsProfi</span>
                        </div>
                        <Check className="w-3 h-3 text-emerald-500" />
                    </DropdownMenuItem>

                    <DropdownMenuItem className="focus:bg-white/10 focus:text-white cursor-pointer justify-between opacity-50">
                        <div className="flex items-center gap-2">
                            <div className="w-5 h-5 bg-indigo-500/20 text-indigo-400 rounded flex items-center justify-center text-[10px] font-bold">D</div>
                            <span>Dev Environment</span>
                        </div>
                    </DropdownMenuItem>

                    <DropdownMenuSeparator className="bg-white/10" />
                    <DropdownMenuItem className="focus:bg-white/10 focus:text-white cursor-pointer pl-8 text-xs text-white/50">
                        + Organisation erstellen
                    </DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>
        </div>
    )
}
