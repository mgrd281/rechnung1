'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { CreditCard, Save, Loader2, Building } from 'lucide-react'
import { useToast } from '@/components/ui/toast'
import { setCompanySettingsClient } from '@/lib/company-settings'

interface CompanySettings {
    bankName: string
    iban: string
    bic: string
    // Needed for full update but not shown here
    companyName: string
    taxNumber: string
    address: string
    postalCode: string
    city: string
    country: string
    logoPath?: string
}

export default function BillingSettingsPage() {
    const [settings, setSettings] = useState<CompanySettings>({
        bankName: '',
        iban: '',
        bic: '',
        companyName: '',
        taxNumber: '',
        address: '',
        postalCode: '',
        city: '',
        country: ''
    })

    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [isDirty, setIsDirty] = useState(false)
    const [initialSettings, setInitialSettings] = useState<CompanySettings | null>(null)

    const { showToast } = useToast()

    useEffect(() => {
        loadSettings()
    }, [])

    useEffect(() => {
        if (!initialSettings) return
        const isChanged = JSON.stringify(settings) !== JSON.stringify(initialSettings)
        setIsDirty(isChanged)
    }, [settings, initialSettings])

    const loadSettings = async () => {
        try {
            setLoading(true)
            const res = await fetch('/api/company-settings')
            if (res.ok) {
                const data = await res.json()
                setSettings(data)
                setInitialSettings(data)
            }
        } catch (error) {
            console.error(error)
            showToast('Fehler beim Laden', 'error')
        } finally {
            setLoading(false)
        }
    }

    const handleSave = async () => {
        setSaving(true)
        try {
            const res = await fetch('/api/company-settings', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(settings),
            })

            if (!res.ok) throw new Error('Failed to save')

            // Update client/local storage for PDF generation
            const mappedSettings = {
                id: 'default-org',
                companyName: settings.companyName,
                taxNumber: settings.taxNumber,
                zip: settings.postalCode,
                logoUrl: settings.logoPath || null,
                name: settings.companyName,
                taxId: settings.taxNumber,
                zipCode: settings.postalCode,
                logo: settings.logoPath || null,
                address: settings.address,
                city: settings.city,
                country: settings.country,
                bankName: settings.bankName,
                iban: settings.iban,
                bic: settings.bic,
                phone: '',
                email: '',
                pdfTemplateEnabled: false,
                pdfTemplateCode: '',
                pdfTemplateMode: 'custom_only' as const
            }
            setCompanySettingsClient(mappedSettings)

            setInitialSettings(settings)
            setIsDirty(false)
            showToast('Zahlungsdaten gespeichert', 'success')
        } catch (error) {
            showToast('Fehler beim Speichern', 'error')
        } finally {
            setSaving(false)
        }
    }

    if (loading) return <div className="h-64 flex items-center justify-center"><Loader2 className="animate-spin text-violet-600" /></div>

    return (
        <div className="space-y-6 max-w-4xl animate-in fade-in duration-500">
            <div className="flex justify-between items-start">
                <div className="space-y-1">
                    <h2 className="text-2xl font-bold tracking-tight text-slate-900">Abrechnung & Finanzen</h2>
                    <p className="text-slate-500">Bankverbindung und steuerliche Informationen.</p>
                </div>
                <Button
                    onClick={handleSave}
                    disabled={saving || !isDirty}
                    className={`shadow-lg transition-all duration-300 ${isDirty ? 'bg-violet-600 hover:bg-violet-700 translate-y-0 opacity-100' : 'bg-slate-200 text-slate-400 cursor-not-allowed translate-y-2 opacity-0 lg:opacity-100 lg:translate-y-0'}`}
                >
                    {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
                    {saving ? 'Speichern...' : 'Speichern'}
                </Button>
            </div>

            <Separator />

            <Card className="border-slate-200 shadow-sm">
                <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                        <Building className="h-5 w-5 text-violet-600" /> Bankverbindung
                    </CardTitle>
                    <CardDescription>Diese Daten werden in der Fußzeile der Rechnung angezeigt.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="space-y-2">
                        <Label>Bankname</Label>
                        <Input
                            value={settings.bankName}
                            onChange={e => setSettings({ ...settings, bankName: e.target.value })}
                            placeholder="Commerzbank"
                            className="bg-slate-50 border-slate-200"
                        />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label>IBAN</Label>
                            <Input
                                value={settings.iban}
                                onChange={e => setSettings({ ...settings, iban: e.target.value })}
                                placeholder="DE..."
                                className="bg-slate-50 border-slate-200 font-mono"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>BIC</Label>
                            <Input
                                value={settings.bic}
                                onChange={e => setSettings({ ...settings, bic: e.target.value })}
                                placeholder="COBA..."
                                className="bg-slate-50 border-slate-200 font-mono"
                            />
                        </div>
                    </div>
                </CardContent>
            </Card>

            <Card className="border-slate-200 shadow-sm">
                <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                        <CreditCard className="h-5 w-5 text-violet-600" /> Steuerliche Erfassung
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label>Steuernummer</Label>
                            <Input
                                value={settings.taxNumber}
                                onChange={e => setSettings({ ...settings, taxNumber: e.target.value })}
                                className="bg-slate-50 border-slate-200"
                            />
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
