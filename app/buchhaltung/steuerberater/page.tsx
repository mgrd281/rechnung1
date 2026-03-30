'use client'

import { HeaderNavIcons } from '@/components/navigation/header-nav-icons'
import { useState } from 'react'
import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { Separator } from '@/components/ui/separator'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
    ArrowLeft,
    MessageSquare,
    Upload,
    FileText,
    Download,
    Settings,
    Shield,
    CheckCircle2,
    AlertCircle,
    HelpCircle,
    FileSpreadsheet,
    Image as ImageIcon,
    Database,
    Briefcase,
    UserPlus,
    ChevronRight,
    Calendar,
    Loader2,
    ExternalLink
} from 'lucide-react'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { useToast } from "@/components/ui/toast"

export default function TaxAdvisorPage() {
    const { showToast } = useToast()
    const [selectedExport, setSelectedExport] = useState<'bookings' | 'invoices' | null>(null)
    const [datevConnected, setDatevConnected] = useState(false)
    const [isConnecting, setIsConnecting] = useState(false)
    const [showConnectionDialog, setShowConnectionDialog] = useState(false)

    const handleConnect = () => {
        setIsConnecting(true)
        // Simulate connection delay
        setTimeout(() => {
            setIsConnecting(false)
            setShowConnectionDialog(false)
            setDatevConnected(true)
            showToast("Verbindung erfolgreich: Ihr Steuerberater wurde erfolgreich verknüpft.", "success")
        }, 2000)
    }

    const handleHelp = () => {
        showToast("Hilfe & Support: Wenden Sie sich an support@example.com", "success")
    }

    const handleDatevLogin = () => {
        showToast("Weiterleitung zu DATEV...", "success")
        // Simulate redirect
        setTimeout(() => {
            window.open('https://www.datev.de/unternehmen-online', '_blank')
        }, 1000)
    }

    // Export Configuration State
    const [exportConfig, setExportConfig] = useState({
        consultantNumber: '',
        clientNumber: '',
        fiscalYearStart: new Date().getFullYear() + '-01-01',
        startDate: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0],
        endDate: new Date().toISOString().split('T')[0],
        includeLocked: false,
        includeOpen: true,
        docs: {
            income: true,
            expense: true,
            outgoing: true,
            images: true,
            invoiceData: true
        }
    })

    return (
        <div className="min-h-screen bg-gray-50/50">
            {/* Header */}
            
            <header className="bg-white shadow-sm border-b sticky top-0 z-10">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center py-4">
                        <div className="flex items-center gap-4">
                            <HeaderNavIcons />
                            <div className="mx-1" />
                            <div className="flex items-center space-x-3">
                                <div className="p-2 bg-blue-50 rounded-lg">
                                    <Briefcase className="h-6 w-6 text-blue-600" />
                                </div>
                                <div>
                                    <h1 className="text-xl font-bold text-gray-900">Steuerberater</h1>
                                    <p className="text-sm text-gray-500">Zusammenarbeit & Exporte</p>
                                </div>
                            </div>
                        </div>
                        <div className="flex items-center space-x-3">
                            <Button variant="outline" className="hidden sm:flex" onClick={handleHelp}>
                                <HelpCircle className="h-4 w-4 mr-2" />
                                Hilfe
                            </Button>
                        </div>
                    </div>
                </div>
            </header>

            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">

                {/* 1. Bereich: Steuerberater & Nachrichten */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

                    {/* A) Nachrichten */}
                    <Card className="border-none shadow-md overflow-hidden">
                        <CardHeader className="bg-gradient-to-r from-blue-50 to-white border-b border-blue-100/50">
                            <div className="flex justify-between items-center">
                                <CardTitle className="flex items-center text-blue-900">
                                    <MessageSquare className="h-5 w-5 mr-2 text-blue-600" />
                                    Nachrichten vom Steuerberater
                                </CardTitle>
                                <Badge variant="secondary" className="bg-blue-100 text-blue-700">0 Neu</Badge>
                            </div>
                        </CardHeader>
                        <CardContent className="p-8">
                            <div className="flex flex-col items-center justify-center text-center space-y-4 py-6">
                                <div className="h-24 w-24 bg-blue-50 rounded-full flex items-center justify-center mb-2">
                                    <CheckCircle2 className="h-10 w-10 text-blue-300" />
                                </div>
                                <h3 className="text-lg font-medium text-gray-900">Alles erledigt!</h3>
                                <p className="text-gray-500 max-w-sm">
                                    Aktuell liegen keine neuen Nachrichten oder Aufgaben von Ihrem Steuerberater vor.
                                </p>
                                <div className="pt-4 w-full max-w-xs">
                                    <div className="bg-yellow-50 border border-yellow-100 rounded-lg p-3 text-sm text-yellow-800 flex items-start text-left">
                                        <AlertCircle className="h-4 w-4 mr-2 mt-0.5 text-yellow-600 shrink-0" />
                                        <span>Nächster Upload-Termin: 10. {new Date().toLocaleString('de-DE', { month: 'long' })}</span>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* B) Steuerberater-Verknüpfung */}
                    <Card className="border-none shadow-md overflow-hidden flex flex-col">
                        <CardHeader className="bg-gradient-to-r from-purple-50 to-white border-b border-purple-100/50">
                            <CardTitle className="flex items-center text-purple-900">
                                <UserPlus className="h-5 w-5 mr-2 text-purple-600" />
                                Steuerberater-Verknüpfung
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-8 flex-1 flex flex-col justify-center">
                            <div className="space-y-6">
                                <div className="flex items-start space-x-4">
                                    <div className="h-12 w-12 bg-purple-100 rounded-xl flex items-center justify-center shrink-0">
                                        <Shield className="h-6 w-6 text-purple-600" />
                                    </div>
                                    <div>
                                        <h3 className="font-medium text-gray-900">Direkte Verbindung herstellen</h3>
                                        <p className="text-sm text-gray-500 mt-1">
                                            Ermöglichen Sie Ihrem Steuerberater direkten Zugriff auf Ihre Buchungsdaten und Belege. Sicher und effizient.
                                        </p>
                                    </div>
                                </div>

                                <Dialog open={showConnectionDialog} onOpenChange={setShowConnectionDialog}>
                                    <DialogTrigger asChild>
                                        <Button className="w-full bg-purple-600 hover:bg-purple-700 text-white shadow-lg shadow-purple-200">
                                            Verknüpfung einrichten
                                        </Button>
                                    </DialogTrigger>
                                    <DialogContent>
                                        <DialogHeader>
                                            <DialogTitle>Steuerberater verknüpfen</DialogTitle>
                                            <DialogDescription>
                                                Geben Sie den Einladungscode Ihres Steuerberaters ein, um eine direkte Verbindung herzustellen.
                                            </DialogDescription>
                                        </DialogHeader>
                                        <div className="grid gap-4 py-4">
                                            <div className="grid grid-cols-4 items-center gap-4">
                                                <Label htmlFor="invite-code" className="text-right">
                                                    Code
                                                </Label>
                                                <Input id="invite-code" placeholder="z.B. 123-ABC-456" className="col-span-3" />
                                            </div>
                                        </div>
                                        <DialogFooter>
                                            <Button variant="outline" onClick={() => setShowConnectionDialog(false)}>Abbrechen</Button>
                                            <Button onClick={handleConnect} disabled={isConnecting}>
                                                {isConnecting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                                {isConnecting ? 'Verbinde...' : 'Verbinden'}
                                            </Button>
                                        </DialogFooter>
                                    </DialogContent>
                                </Dialog>

                                <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="text-sm font-medium text-gray-900">Noch keinen Steuerberater?</p>
                                            <p className="text-xs text-gray-500">Finden Sie den passenden Experten.</p>
                                        </div>
                                        <Button variant="outline" size="sm" className="text-xs">
                                            Empfehlungen
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* 2. Bereich: Exporte */}
                <div className="space-y-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <h2 className="text-2xl font-bold text-gray-900">Daten-Export</h2>
                            <p className="text-gray-500 mt-1">Wählen Sie aus, welche Daten Sie für Ihren Steuerberater exportieren möchten.</p>
                        </div>
                        <Button variant="ghost" className="text-blue-600 hover:text-blue-700 hover:bg-blue-50">
                            <HelpCircle className="h-4 w-4 mr-2" />
                            Wie funktioniert der Export?
                        </Button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Card: Buchungsdaten + Belegbilder */}
                        <div
                            className={`group relative bg-white rounded-2xl p-6 border-2 transition-all cursor-pointer hover:shadow-lg ${selectedExport === 'bookings' ? 'border-blue-600 shadow-blue-100' : 'border-transparent shadow-sm hover:border-gray-200'}`}
                            onClick={() => setSelectedExport('bookings')}
                        >
                            <div className="flex items-start justify-between mb-4">
                                <div className="p-3 bg-blue-100 rounded-xl group-hover:bg-blue-600 group-hover:text-white transition-colors text-blue-600">
                                    <Database className="h-6 w-6" />
                                </div>
                                {selectedExport === 'bookings' && (
                                    <div className="h-6 w-6 bg-blue-600 rounded-full flex items-center justify-center">
                                        <CheckCircle2 className="h-4 w-4 text-white" />
                                    </div>
                                )}
                            </div>
                            <h3 className="text-lg font-bold text-gray-900 mb-2">Buchungsdaten + Belegbilder</h3>
                            <p className="text-gray-500 text-sm mb-6">
                                Vollständiger Export aller Buchungssätze, Stammdaten und verknüpfter Belegbilder. Ideal für den Jahresabschluss.
                            </p>
                            <Button
                                variant={selectedExport === 'bookings' ? 'default' : 'outline'}
                                className={`w-full ${selectedExport === 'bookings' ? 'bg-blue-600 hover:bg-blue-700' : ''}`}
                            >
                                Auswählen
                            </Button>
                        </div>

                        {/* Card: Rechnungsdaten + Belegbilder */}
                        <div
                            className={`group relative bg-white rounded-2xl p-6 border-2 transition-all cursor-pointer hover:shadow-lg ${selectedExport === 'invoices' ? 'border-blue-600 shadow-blue-100' : 'border-transparent shadow-sm hover:border-gray-200'}`}
                            onClick={() => setSelectedExport('invoices')}
                        >
                            <div className="flex items-start justify-between mb-4">
                                <div className="p-3 bg-indigo-100 rounded-xl group-hover:bg-indigo-600 group-hover:text-white transition-colors text-indigo-600">
                                    <FileText className="h-6 w-6" />
                                </div>
                                {selectedExport === 'invoices' && (
                                    <div className="h-6 w-6 bg-blue-600 rounded-full flex items-center justify-center">
                                        <CheckCircle2 className="h-4 w-4 text-white" />
                                    </div>
                                )}
                            </div>
                            <h3 className="text-lg font-bold text-gray-900 mb-2">Rechnungsdaten + Belegbilder</h3>
                            <p className="text-gray-500 text-sm mb-6">
                                Export der Rechnungslisten inkl. Netto, MwSt und Debitor/Kreditor-Daten sowie der Belegbilder.
                            </p>
                            <Button
                                variant={selectedExport === 'invoices' ? 'default' : 'outline'}
                                className={`w-full ${selectedExport === 'invoices' ? 'bg-blue-600 hover:bg-blue-700' : ''}`}
                            >
                                Auswählen
                            </Button>
                        </div>
                    </div>
                </div>

                {/* 3. Bereich: Export-Konfiguration (Slide-down) */}
                {selectedExport && (
                    <div className="animate-in fade-in slide-in-from-top-4 duration-500">
                        <Card className="border-none shadow-xl bg-white overflow-hidden ring-1 ring-gray-200">
                            <div className="h-1.5 bg-gradient-to-r from-blue-500 to-indigo-600 w-full" />
                            <CardHeader>
                                <CardTitle className="flex items-center text-xl">
                                    <Settings className="h-5 w-5 mr-2 text-gray-500" />
                                    Export konfigurieren
                                </CardTitle>
                                <CardDescription>
                                    Passen Sie die Einstellungen für Ihren {selectedExport === 'bookings' ? 'Buchungsdaten' : 'Rechnungsdaten'}-Export an.
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-8">

                                {/* Stammdaten Grid */}
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                    <div className="space-y-2">
                                        <Label>Beraternummer</Label>
                                        <Input
                                            placeholder="z.B. 1001"
                                            value={exportConfig.consultantNumber}
                                            onChange={(e) => setExportConfig({ ...exportConfig, consultantNumber: e.target.value })}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Mandantennummer</Label>
                                        <Input
                                            placeholder="z.B. 10001"
                                            value={exportConfig.clientNumber}
                                            onChange={(e) => setExportConfig({ ...exportConfig, clientNumber: e.target.value })}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Wirtschaftsjahresbeginn</Label>
                                        <Input
                                            type="date"
                                            value={exportConfig.fiscalYearStart}
                                            onChange={(e) => setExportConfig({ ...exportConfig, fiscalYearStart: e.target.value })}
                                        />
                                    </div>
                                </div>

                                <Separator />

                                {/* Zeitraum & Optionen Grid */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                    <div className="space-y-4">
                                        <h4 className="font-medium text-gray-900 flex items-center">
                                            <Calendar className="h-4 w-4 mr-2 text-gray-500" />
                                            Zeitraum
                                        </h4>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="space-y-2">
                                                <Label>Von</Label>
                                                <Input
                                                    type="date"
                                                    value={exportConfig.startDate}
                                                    onChange={(e) => setExportConfig({ ...exportConfig, startDate: e.target.value })}
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <Label>Bis</Label>
                                                <Input
                                                    type="date"
                                                    value={exportConfig.endDate}
                                                    onChange={(e) => setExportConfig({ ...exportConfig, endDate: e.target.value })}
                                                />
                                            </div>
                                        </div>

                                        <div className="pt-2 space-y-3">
                                            <div className="flex items-center space-x-2">
                                                <Checkbox
                                                    id="includeLocked"
                                                    checked={exportConfig.includeLocked}
                                                    onCheckedChange={(c) => setExportConfig({ ...exportConfig, includeLocked: c as boolean })}
                                                />
                                                <Label htmlFor="includeLocked" className="font-normal text-gray-600">Auch festgeschriebene Daten exportieren</Label>
                                            </div>
                                            <div className="flex items-center space-x-2">
                                                <Checkbox
                                                    id="includeOpen"
                                                    checked={exportConfig.includeOpen}
                                                    onCheckedChange={(c) => setExportConfig({ ...exportConfig, includeOpen: c as boolean })}
                                                />
                                                <Label htmlFor="includeOpen" className="font-normal text-gray-600">Auch offene Rechnungen & Belege exportieren</Label>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="space-y-4">
                                        <h4 className="font-medium text-gray-900 flex items-center">
                                            <FileText className="h-4 w-4 mr-2 text-gray-500" />
                                            Umfang
                                        </h4>
                                        <div className="bg-gray-50 p-4 rounded-xl space-y-3 border border-gray-100">
                                            <div className="flex items-center space-x-2">
                                                <Checkbox
                                                    id="docIncome"
                                                    checked={exportConfig.docs.income}
                                                    onCheckedChange={(c) => setExportConfig({ ...exportConfig, docs: { ...exportConfig.docs, income: c as boolean } })}
                                                />
                                                <Label htmlFor="docIncome">Einnahmenbelege</Label>
                                            </div>
                                            <div className="flex items-center space-x-2">
                                                <Checkbox
                                                    id="docExpense"
                                                    checked={exportConfig.docs.expense}
                                                    onCheckedChange={(c) => setExportConfig({ ...exportConfig, docs: { ...exportConfig.docs, expense: c as boolean } })}
                                                />
                                                <Label htmlFor="docExpense">Ausgabebelege</Label>
                                            </div>
                                            <div className="flex items-center space-x-2">
                                                <Checkbox
                                                    id="docOutgoing"
                                                    checked={exportConfig.docs.outgoing}
                                                    onCheckedChange={(c) => setExportConfig({ ...exportConfig, docs: { ...exportConfig.docs, outgoing: c as boolean } })}
                                                />
                                                <Label htmlFor="docOutgoing">Ausgangsrechnungen & Gutschriften</Label>
                                            </div>
                                            <Separator className="my-2" />
                                            <div className="flex items-center space-x-2">
                                                <Checkbox
                                                    id="docImages"
                                                    checked={exportConfig.docs.images}
                                                    onCheckedChange={(c) => setExportConfig({ ...exportConfig, docs: { ...exportConfig.docs, images: c as boolean } })}
                                                />
                                                <Label htmlFor="docImages" className="flex items-center">
                                                    <ImageIcon className="h-3 w-3 mr-1 text-gray-400" />
                                                    Belegbilder
                                                </Label>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                            </CardContent>
                            <CardFooter className="bg-gray-50 p-6 flex flex-col sm:flex-row justify-between items-center gap-4">
                                <div className="flex space-x-2 w-full sm:w-auto">
                                    <Button variant="outline" className="flex-1 sm:flex-none">
                                        <FileText className="h-4 w-4 mr-2 text-red-600" />
                                        PDF
                                    </Button>
                                    <Button variant="outline" className="flex-1 sm:flex-none">
                                        <FileSpreadsheet className="h-4 w-4 mr-2 text-green-600" />
                                        Excel
                                    </Button>
                                    <Button variant="outline" className="flex-1 sm:flex-none">
                                        <Database className="h-4 w-4 mr-2 text-gray-600" />
                                        CSV
                                    </Button>
                                </div>
                                <Button className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white px-8 h-11 shadow-lg shadow-blue-200">
                                    <Download className="h-4 w-4 mr-2" />
                                    ZIP-Archiv herunterladen
                                </Button>
                            </CardFooter>
                        </Card>
                    </div>
                )}

                {/* 4. Bereich: DATEV Schnittstelle */}
                <Card className="border-none shadow-md overflow-hidden bg-white">
                    <div className="absolute top-0 right-0 p-4 opacity-10">
                        <div className="text-6xl font-bold text-green-900">DATEV</div>
                    </div>
                    <CardHeader className="border-b border-gray-100">
                        <CardTitle className="flex items-center text-green-800">
                            <div className="h-8 w-8 bg-green-100 rounded-lg flex items-center justify-center mr-3">
                                <CheckCircle2 className="h-5 w-5 text-green-600" />
                            </div>
                            DATEV Buchungsdatenservice
                        </CardTitle>
                        <CardDescription>
                            Übertragen Sie Ihre Buchungsdaten und Belegbilder direkt und sicher an DATEV Unternehmen online.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="p-8">
                        <div className="flex flex-col md:flex-row gap-8 items-start">
                            <div className="flex-1 space-y-6 w-full">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label>Beraternummer</Label>
                                        <Input placeholder="1001" />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Mandantennummer</Label>
                                        <Input placeholder="10001" />
                                    </div>
                                </div>
                                <div className="flex items-center space-x-2">
                                    <Checkbox id="datevOpen" />
                                    <Label htmlFor="datevOpen">Auch offene Rechnungen & Belege übertragen</Label>
                                </div>
                                <Button
                                    className="w-full bg-green-600 hover:bg-green-700 text-white"
                                    onClick={handleDatevLogin}
                                >
                                    Zur DATEV Anmeldung
                                    <ExternalLink className="h-4 w-4 ml-2" />
                                </Button>
                            </div>

                            <div className="w-full md:w-72 bg-green-50 rounded-xl p-5 border border-green-100">
                                <h4 className="font-medium text-green-900 mb-2 flex items-center">
                                    <Shield className="h-4 w-4 mr-2" />
                                    Sicher & Zertifiziert
                                </h4>
                                <p className="text-sm text-green-800/80 leading-relaxed">
                                    Diese Schnittstelle nutzt den offiziellen DATEV Buchungsdatenservice. Ihre Daten werden verschlüsselt übertragen und direkt in der Kanzlei Ihres Steuerberaters bereitgestellt.
                                </p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

            </main>
        </div>
    )
}
