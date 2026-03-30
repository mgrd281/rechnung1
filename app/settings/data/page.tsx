'use client'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { Database, Download, Upload, FileJson, FileSpreadsheet } from 'lucide-react'

export default function DataSettingsPage() {
    return (
        <div className="space-y-6 max-w-4xl animate-in fade-in duration-500">
            <div className="flex justify-between items-start">
                <div className="space-y-1">
                    <h2 className="text-2xl font-bold tracking-tight text-slate-900">Daten & Export</h2>
                    <p className="text-slate-500">Verwalten Sie Ihre Daten, Backups und Exporte.</p>
                </div>
            </div>

            <Separator />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card className="border-slate-200">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Database className="h-5 w-5 text-violet-600" /> System Backup
                        </CardTitle>
                        <CardDescription>
                            Erstellen Sie ein vollständiges Backup aller Datenbank-Einträge.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Button
                            className="w-full" variant="outline"
                            onClick={() => window.open('/api/backup/download', '_blank')}
                        >
                            <Download className="h-4 w-4 mr-2" />
                            Backup herunterladen (.json)
                        </Button>
                        <p className="text-xs text-slate-400 mt-2 text-center">
                            Enthält Kunden, Rechnungen und Einstellungen.
                        </p>
                    </CardContent>
                </Card>

                <Card className="border-slate-200">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <FileSpreadsheet className="h-5 w-5 text-emerald-600" /> CSV Export
                        </CardTitle>
                        <CardDescription>
                            Exportieren Sie Rechnungsdaten für die Buchhaltung.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Button
                            className="w-full" variant="outline"
                            onClick={() => window.open('/api/export/invoices', '_blank')}
                        >
                            <Download className="h-4 w-4 mr-2" />
                            Rechnungen exportieren (.csv)
                        </Button>
                        <p className="text-xs text-slate-400 mt-2 text-center">
                            Optimiert für DATEV und Lexware Import.
                        </p>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
