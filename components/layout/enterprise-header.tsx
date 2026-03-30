'use client'

import React from 'react'
import { useAuth } from '@/hooks/use-auth-compat'
import { HeaderLeft } from './header-left'
import { HeaderRight } from './header-right'
import { CommandPalette } from './command-palette'

export function EnterpriseHeader() {
    const { user, logout } = useAuth()

    return (
        <header className="w-full bg-[#0B0D12] border-b border-white/10 flex items-center justify-between px-4 sm:px-6 h-[56px] fixed top-0 left-0 z-50">
            {/* Left: Brand & Workspace */}
            <div className="flex-1 flex justify-start">
                <HeaderLeft />
            </div>

            {/* Center: Command Palette */}
            <div className="flex-[2] flex justify-center">
                <CommandPalette />
            </div>

            {/* Right: Actions & User */}
            <div className="flex-1 flex justify-end">
                {user ? (
                    <HeaderRight user={user} logout={() => logout()} />
                ) : (
                    <div className="h-8 w-8 rounded-full bg-white/10 animate-pulse"></div> // Loading state
                )}
            </div>
        </header>
    )
}
