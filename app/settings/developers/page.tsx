'use client'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { Code2, Key, Webhook, ArrowRight } from 'lucide-react'
import Link from 'next/link'

export default function DevelopersSettingsPage() {
    return (
        <div className="space-y-6 max-w-4xl animate-in fade-in duration-500">
            <div className="flex justify-between items-start">
                <div className="space-y-1">
                    <h2 className="text-2xl font-bold tracking-tight text-slate-900">Entwickler</h2>
                    <p className="text-slate-500">API-Zugriff und Webhooks verwalten.</p>
                </div>
            </div>

            <Separator />

            <div className="grid grid-cols-1 gap-6">
                <Link href="/settings/api-keys">
                    <Card className="border-slate-200 hover:border-violet-300 hover:shadow-md transition-all cursor-pointer group">
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle className="flex items-center gap-2 text-base">
                                <Key className="h-5 w-5 text-violet-600" /> API Keys
                            </CardTitle>
                            <ArrowRight className="h-5 w-5 text-slate-300 group-hover:text-violet-600 transition-colors" />
                        </CardHeader>
                        <CardContent>
                            <CardDescription>
                                Erstellen und verwalten Sie API-Schlüssel für den Zugriff auf die REST API.
                            </CardDescription>
                        </CardContent>
                    </Card>
                </Link>

                {/* Placeholder for Webhooks */}
                <Card className="border-slate-200 opacity-60">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="flex items-center gap-2 text-base text-slate-500">
                            <Webhook className="h-5 w-5" /> Webhooks
                        </CardTitle>
                        <span className="text-xs font-bold px-2 py-1 bg-slate-100 rounded text-slate-500">Coming Soon</span>
                    </CardHeader>
                    <CardContent>
                        <CardDescription>
                            Benachrichtigungen über Ereignisse an externe URLs senden.
                        </CardDescription>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
