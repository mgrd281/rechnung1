'use client'

import { HeaderNavIcons } from '@/components/navigation/header-nav-icons'
import React from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card'
import { ArrowLeft, Home, FileText, Upload, FileSpreadsheet, Keyboard, ScanLine, ArrowRight } from 'lucide-react'

export default function NewPurchaseInvoicePage() {
    const router = useRouter()

    return (
        <div className="container mx-auto p-6 max-w-5xl space-y-12 pb-32">

            {/* Header */}
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                    <HeaderNavIcons />
                    <div className="mx-1" />
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight text-slate-900">Neue Einkaufsrechnung</h1>
                        <p className="text-sm text-slate-500">Wählen Sie eine Methode zur Erfassung</p>
                    </div>
                </div>
            </div>

            {/* Selection Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">

                {/* 1. Manual */}
                <Card className="relative group hover:shadow-xl transition-all duration-200 border-2 border-transparent hover:border-blue-100 cursor-pointer overflow-hidden">
                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-400 to-blue-600"></div>
                    <CardHeader className="text-center pt-10 pb-6">
                        <div className="mx-auto w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-200">
                            <Keyboard className="h-8 w-8 text-blue-600" />
                        </div>
                        <CardTitle className="text-xl">Manuell erfassen</CardTitle>
                        <CardDescription>
                            Daten händisch eingeben
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="text-center pb-8 px-8">
                        <p className="text-sm text-slate-500 mb-6">
                            Ideal für einzelne Belege, Tankquittungen oder wenn keine Datei vorliegt.
                        </p>
                        <Link href="/purchase-invoices/new/manual" className="w-full">
                            <Button className="w-full bg-slate-900 group-hover:bg-blue-600 transition-colors">
                                Wählen <ArrowRight className="ml-2 h-4 w-4" />
                            </Button>
                        </Link>
                    </CardContent>
                </Card>

                {/* 2. Upload / OCR */}
                <Card className="relative group hover:shadow-xl transition-all duration-200 border-2 border-transparent hover:border-violet-100 cursor-pointer overflow-hidden">
                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-violet-400 to-violet-600"></div>
                    <CardHeader className="text-center pt-10 pb-6">
                        <div className="mx-auto w-16 h-16 bg-violet-50 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-200 relative">
                            <ScanLine className="h-8 w-8 text-violet-600" />
                            <div className="absolute -top-1 -right-1 bg-violet-100 text-violet-700 text-[10px] font-bold px-2 py-0.5 rounded-full border border-violet-200">AI</div>
                        </div>
                        <CardTitle className="text-xl">Rechnung hochladen</CardTitle>
                        <CardDescription>
                            PDF / Foto mit AI-Erkennung
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="text-center pb-8 px-8">
                        <p className="text-sm text-slate-500 mb-6">
                            Laden Sie Belege hoch. Unsere AI extrahiert Datum, Betrag & Lieferant automatisch.
                        </p>
                        <Link href="/purchase-invoices/new/upload" className="w-full">
                            <Button className="w-full bg-slate-900 group-hover:bg-violet-600 transition-colors">
                                Wählen <ArrowRight className="ml-2 h-4 w-4" />
                            </Button>
                        </Link>
                    </CardContent>
                </Card>

                {/* 3. CSV Import */}
                <Card className="relative group hover:shadow-xl transition-all duration-200 border-2 border-transparent hover:border-emerald-100 cursor-pointer overflow-hidden">
                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-emerald-400 to-emerald-600"></div>
                    <CardHeader className="text-center pt-10 pb-6">
                        <div className="mx-auto w-16 h-16 bg-emerald-50 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-200">
                            <FileSpreadsheet className="h-8 w-8 text-emerald-600" />
                        </div>
                        <CardTitle className="text-xl">CSV Import</CardTitle>
                        <CardDescription>
                            Massen-Import via Excel/CSV
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="text-center pb-8 px-8">
                        <p className="text-sm text-slate-500 mb-6">
                            Für den Import vieler Rechnungen gleichzeitig aus anderen Systemen.
                        </p>
                        <Link href="/upload" className="w-full">
                            <Button className="w-full bg-slate-900 group-hover:bg-emerald-600 transition-colors">
                                Wählen <ArrowRight className="ml-2 h-4 w-4" />
                            </Button>
                        </Link>
                    </CardContent>
                </Card>

            </div>
        </div>
    )
}
