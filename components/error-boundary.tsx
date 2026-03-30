'use client'

import React, { Component, ErrorInfo, ReactNode } from 'react'
import { TriangleAlert, RefreshCcw } from 'lucide-react'
import { Button } from './ui/button'

interface Props {
    children?: ReactNode
    fallback?: ReactNode
}

interface State {
    hasError: boolean
    error?: Error
}

export class ErrorBoundary extends Component<Props, State> {
    public state: State = {
        hasError: false
    }

    public static getDerivedStateFromError(error: Error): State {
        return { hasError: true, error }
    }

    public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        console.error('Uncaught error:', error, errorInfo)
    }

    public render() {
        if (this.state.hasError) {
            if (this.props.fallback) {
                return this.props.fallback
            }

            return (
                <div className="p-12 text-center bg-white border border-slate-100 shadow-sm rounded-[2rem] space-y-6">
                    <div className="w-16 h-16 bg-slate-50 text-slate-400 rounded-2xl flex items-center justify-center mx-auto border border-slate-100">
                        <TriangleAlert className="w-8 h-8" />
                    </div>
                    <div>
                        <h3 className="text-lg font-black text-slate-900 uppercase tracking-tight">Teil konnte nicht geladen werden</h3>
                        <p className="text-sm font-medium text-slate-500 mt-1">Ein Hintergrund-Prozess wurde unerwartet beendet.</p>
                    </div>
                    <Button
                        variant="ghost"
                        onClick={() => this.setState({ hasError: false })}
                        className="h-12 px-8 font-black text-[10px] uppercase bg-slate-900 text-white rounded-xl shadow-xl shadow-slate-200 hover:bg-slate-800"
                    >
                        <RefreshCcw className="w-4 h-4 mr-2" /> Neu laden
                    </Button>
                </div>
            )
        }

        return this.props.children
    }
}
