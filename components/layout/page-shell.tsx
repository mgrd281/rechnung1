'use client'

import React from 'react'

interface PageShellProps {
    children: React.ReactNode
    className?: string
}

/**
 * Standardized page wrapper for consistent layout across all pages.
 * Provides max-width container, padding, and centering.
 */
export function PageShell({ children, className = '' }: PageShellProps) {
    return (
        <div
            className={`w-full max-w-[1280px] mx-auto px-6 py-6 ${className}`}
        >
            {children}
        </div>
    )
}
