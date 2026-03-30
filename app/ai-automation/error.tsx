'use client'

import { useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { AlertTriangle, RefreshCcw, Home } from 'lucide-react'
import Link from 'next/link'

export default function Error({
    error,
    reset,
}: {
    error: Error & { digest?: string }
    reset: () => void
}) {
    useEffect(() => {
        // Log the error to an error reporting service
        console.error('AI-Automation Route Error:', error)
    }, [error])

    return (
        <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center p-4">
            <Card className="max-w-md w-full border-none shadow-2xl bg-white rounded-3xl overflow-hidden">
                <div className="h-2 bg-red-600 w-full" />
                <CardHeader className="p-8 text-center">
                    <div className="w-16 h-16 bg-red-50 text-red-600 rounded-2xl flex items-center justify-center mx-auto mb-6">
                        <AlertTriangle className="w-10 h-10" />
                    </div>
                    <CardTitle className="text-2xl font-black text-slate-900 uppercase">Hoppla!</CardTitle>
                    <CardDescription className="text-slate-500 font-medium mt-2">
                        Beim Laden des AI Automation Centers ist ein Fehler aufgetreten.
                        Das kann an einer fehlenden Verbindung oder einer fehlenden Konfiguration liegen.
                    </CardDescription>
                </CardHeader>
                <CardContent className="p-8 pt-0 space-y-4">
                    <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 mb-6">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Fehlermeldung</p>
                        <p className="text-xs font-mono text-red-600 break-words">{error.message || 'Unbekannter Laufzeitfehler'}</p>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        <Button
                            onClick={reset}
                            className="h-12 bg-slate-900 hover:bg-slate-800 text-white font-black text-xs uppercase tracking-widest rounded-2xl w-full"
                        >
                            <RefreshCcw className="w-4 h-4 mr-2" /> Nochmal versuchen
                        </Button>
                        <Link href="/dashboard" className="w-full">
                            <Button
                                variant="outline"
                                className="h-12 border-slate-200 text-slate-900 font-black text-xs uppercase tracking-widest rounded-2xl w-full"
                            >
                                <Home className="w-4 h-4 mr-2" /> Dashboard
                            </Button>
                        </Link>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
