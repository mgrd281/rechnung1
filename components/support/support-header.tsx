'use client'

import React from 'react'
import { Search, Plus, SlidersHorizontal, BarChart } from 'lucide-react'
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import {
    DropdownMenu,
    DropdownMenuTrigger,
    DropdownMenuContent,
    DropdownMenuItem
} from "@/components/ui/dropdown-menu"

export function SupportHeader() {
    return (
        <header className="h-[56px] border-b border-gray-200 bg-white flex items-center justify-between px-4 sticky top-0 z-20">
            {/* Context Title or Breadcrumb */}
            <div className="font-semibold text-gray-900 flex items-center gap-2">
                Kundensupport Center
            </div>

            {/* Global Search */}
            <div className="flex-1 max-w-xl px-8">
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                        className="w-full h-9 pl-10 pr-4 bg-gray-100 border-transparent rounded-lg text-sm focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all outline-none placeholder:text-gray-400"
                        placeholder="Suchen (Cmd+K)"
                    />
                    <div className="absolute right-2 top-1/2 -translate-y-1/2 flex gap-1">
                        <span className="text-[10px] bg-white border border-gray-200 px-1.5 rounded text-gray-500">⌘</span>
                        <span className="text-[10px] bg-white border border-gray-200 px-1.5 rounded text-gray-500">K</span>
                    </div>
                </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" className="h-9 gap-2 text-gray-600">
                    <BarChart className="w-4 h-4" />
                    <span className="hidden sm:inline">Reports</span>
                </Button>

                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="default" size="sm" className="h-9 gap-2 bg-gray-900 hover:bg-black text-white shadow-sm">
                            <Plus className="w-4 h-4" />
                            <span>Ticket</span>
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                        <DropdownMenuItem>E-Mail Ticket</DropdownMenuItem>
                        <DropdownMenuItem>Interner Auftrag</DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>
        </header>
    )
}
