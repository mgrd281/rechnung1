'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { Loader2, Zap, Clock, Mail } from 'lucide-react'
import Link from 'next/link'

export default function AutomationSettingsPage() {
    return (
        <div className="space-y-6 max-w-4xl animate-in fade-in duration-500">
            <div className="flex justify-between items-start">
                <div className="space-y-1">
                    <h2 className="text-2xl font-bold tracking-tight text-slate-900">Automatisierung</h2>
                    <p className="text-slate-500">Workflows und automatische Benachrichtigungen.</p>
                </div>
            </div>

            <Separator />

            <div className="grid grid-cols-1 gap-6">
                <Card className="border-slate-200 shadow-sm hover:border-violet-200 hover:shadow-md transition-all cursor-pointer group">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
                        <div className="space-y-1">
                            <CardTitle className="text-lg flex items-center gap-2">
                                <Clock className="h-5 w-5 text-violet-600" /> Zahlungserinnerungen
                            </CardTitle>
                            <CardDescription>
                                Konfigurieren Sie den Mahnprozess für überfällige Rechnungen.
                            </CardDescription>
                        </div>
                        <div className="h-10 w-10 bg-violet-50 rounded-full flex items-center justify-center group-hover:bg-violet-100 transition-colors">
                            <Zap className="h-5 w-5 text-violet-600" />
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="bg-slate-50 rounded-lg p-4 border border-slate-100 space-y-3">
                            <div className="flex items-center gap-3 text-sm text-slate-600">
                                <div className="h-2 w-2 rounded-full bg-slate-300"></div>
                                <span>Bestellung</span>
                            </div>
                            <div className="h-4 border-l-2 border-slate-200 ml-[3px]"></div>
                            <div className="flex items-center gap-3 text-sm font-medium text-slate-900">
                                <div className="h-2 w-2 rounded-full bg-violet-500"></div>
                                <span>Rechnung per E-Mail</span>
                            </div>
                            <div className="h-4 border-l-2 border-slate-200 ml-[3px]"></div>
                            <div className="flex items-center gap-3 text-sm text-slate-600">
                                <div className="h-2 w-2 rounded-full bg-slate-300"></div>
                                <span>+3 Tage: Zahlungserinnerung</span>
                            </div>
                        </div>
                        <div className="mt-6 flex justify-end">
                            <Link href="/settings/payment-reminders">
                                <Button className="bg-white text-slate-900 border border-slate-200 hover:bg-slate-50 shadow-sm">
                                    Workflow bearbeiten
                                </Button>
                            </Link>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
