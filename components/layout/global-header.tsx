'use client'

import React from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Home } from 'lucide-react'
import { SectionMeta } from '@/types/section-meta'
import { Button } from '@/components/ui/button'

interface GlobalHeaderProps {
    sectionMeta: SectionMeta
    /** Optional status element (e.g., status pill) to display on the right */
    statusElement?: React.ReactNode
    /** Optional action element (e.g., primary button) to display on the right */
    actionElement?: React.ReactNode
}

export function GlobalHeader({ sectionMeta, statusElement, actionElement }: GlobalHeaderProps) {
    const router = useRouter()

    const handleBack = () => {
        if (window.history.length > 1) {
            router.back()
        } else {
            router.push('/dashboard')
        }
    }

    const handleHome = () => {
        router.push('/dashboard')
    }

    const IconComponent = sectionMeta.icon
    const iconColor = sectionMeta.color || '#64748B'

    return (
        <div className="
            flex flex-col sm:flex-row sm:items-start sm:justify-between 
            gap-4 mb-8 pb-6 border-b border-slate-200
            /* Mobile Sticky Header Overrides */
            sticky top-0 z-50 bg-white/95 backdrop-blur-sm 
            pt-[env(safe-area-inset-top)] 
            max-sm:mb-4 max-sm:pb-4 max-sm:-mx-4 max-sm:px-4 max-sm:shadow-sm
        ">
            {/* Left Column: Navigation + Section Info */}
            <div className="flex items-start gap-4">
                {/* Navigation Buttons */}
                <div className="flex items-center gap-2 pt-0.5">
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={handleBack}
                        className="h-9 w-9 rounded-full hover:bg-slate-100 transition-colors"
                        title="Zurück"
                    >
                        <ArrowLeft className="h-5 w-5 text-slate-600" />
                    </Button>

                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={handleHome}
                        className="h-9 w-9 rounded-full hover:bg-slate-100 transition-colors"
                        title="Zur Startseite"
                    >
                        <Home className="h-5 w-5 text-slate-600" />
                    </Button>
                </div>

                {/* Divider */}
                <div className="h-10 w-px bg-slate-200 hidden sm:block" />

                {/* Section Info with Icon, Title, and Subtitle */}
                <div className="flex items-start gap-3">
                    <div
                        className="flex items-center justify-center h-10 w-10 rounded-lg flex-shrink-0"
                        style={{ backgroundColor: `${iconColor}15` }}
                    >
                        <IconComponent
                            className="h-5 w-5"
                            style={{ color: iconColor }}
                        />
                    </div>

                    <div className="flex flex-col">
                        <h1 className="text-xl font-bold text-slate-900 leading-tight">
                            {sectionMeta.title}
                        </h1>
                        {sectionMeta.description && (
                            <p
                                className="text-sm text-slate-500 mt-1.5"
                                style={{
                                    maxWidth: '720px',
                                    whiteSpace: 'normal',
                                    overflowWrap: 'anywhere',
                                    lineHeight: '1.4',
                                    color: 'rgba(0,0,0,0.55)'
                                }}
                            >
                                {sectionMeta.description}
                            </p>
                        )}
                    </div>
                </div>
            </div>

            {/* Right Column: Status + Actions */}
            {(statusElement || actionElement) && (
                <div className="flex items-center gap-3 flex-shrink-0">
                    {statusElement}
                    {actionElement}
                </div>
            )}
        </div>
    )
}
