'use client'

import { HeaderNavIcons } from '@/components/navigation/header-nav-icons'
import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import Link from 'next/link'
import { ArrowLeft, Save, Plus, Trash2, Copy, RefreshCw, Edit } from 'lucide-react'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { RichTextEditor } from '@/components/ui/rich-text-editor'
import { Checkbox } from '@/components/ui/checkbox'
import { useToast } from '@/components/ui/toast'
export default function DigitalProductDetailPage() {
    const params = useParams()
    const router = useRouter()
    const [product, setProduct] = useState<any>(null)
    const [keys, setKeys] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [newKeys, setNewKeys] = useState('')
    const [template, setTemplate] = useState('')
    const [savingTemplate, setSavingTemplate] = useState(false)
    const [addingKeys, setAddingKeys] = useState(false)
    const [uploadProgress, setUploadProgress] = useState(0)

    // Download Settings State
    const [downloadUrl, setDownloadUrl] = useState('')
    const [buttonText, setButtonText] = useState('Download')
    const [buttonColor, setButtonColor] = useState('#000000')
    const [buttonTextColor, setButtonTextColor] = useState('#ffffff')
    const [buttonAlignment, setButtonAlignment] = useState('left')
    const [buttons, setButtons] = useState<{ url: string, text: string, color: string, textColor: string }[]>([])
    const [savingSettings, setSavingSettings] = useState(false)
    // Edit product state
    const [isEditingProduct, setIsEditingProduct] = useState(false)
    const [editProductData, setEditProductData] = useState({ title: '' })
    const [showSourceCode, setShowSourceCode] = useState(false)
    const [activeKeyTab, setActiveKeyTab] = useState<'history' | 'inventory'>('history')


    const [selectedVariant, setSelectedVariant] = useState<string>('any')
    const [variants, setVariants] = useState<any[]>([])
    const [selectedKeys, setSelectedKeys] = useState<Set<string>>(new Set())
    const [resendingKeys, setResendingKeys] = useState<Set<string>>(new Set()) // Track resending state
    const { showToast } = useToast()

    // Variant Settings State
    const [variantSettings, setVariantSettings] = useState<any[]>([])
    const [selectedTemplateVariant, setSelectedTemplateVariant] = useState<string>('default')
    const [keysFilterVariant, setKeysFilterVariant] = useState<string>('all')

    useEffect(() => {
        loadData()
    }, [params.id])

    const loadData = async () => {
        setLoading(true)
        try {
            const [prodRes, keysRes] = await Promise.all([
                fetch(`/api/digital-products/${params.id}`),
                fetch(`/api/digital-products/${params.id}/keys`)
            ])

            const prodData = await prodRes.json()
            const keysData = await keysRes.json()

            if (prodData.success) {
                setProduct(prodData.data)
                if (prodData.data.shopifyProduct && prodData.data.shopifyProduct.variants) {
                    setVariants(prodData.data.shopifyProduct.variants)
                }

                // Load Variant Settings
                if (prodData.data.variantSettings) {
                    setVariantSettings(prodData.data.variantSettings)
                }

                setTemplate(prodData.data.emailTemplate || getDefaultTemplate())
                setDownloadUrl(prodData.data.downloadUrl || '')
                setButtonText(prodData.data.buttonText || 'Download')
                setButtonColor(prodData.data.buttonColor || '#000000')
                setButtonTextColor(prodData.data.buttonTextColor || '#ffffff')
                setButtonAlignment(prodData.data.buttonAlignment || 'left')

                // Initialize buttons from new JSON field or legacy fields
                if (prodData.data.downloadButtons && Array.isArray(prodData.data.downloadButtons) && prodData.data.downloadButtons.length > 0) {
                    setButtons(prodData.data.downloadButtons)
                } else if (prodData.data.downloadUrl) {
                    // Migration: Create first button from legacy fields
                    setButtons([{
                        url: prodData.data.downloadUrl,
                        text: prodData.data.buttonText || 'Download',
                        color: prodData.data.buttonColor || '#000000',
                        textColor: prodData.data.buttonTextColor || '#ffffff'
                    }])
                } else {
                    setButtons([])
                }
            }
            if (keysData.success) {
                setKeys(keysData.data)
            }
        } catch (error) {
            console.error(error)
        } finally {
            setLoading(false)
        }
    }

    const handleAddKeys = async () => {
        if (!newKeys.trim()) return
        setAddingKeys(true)
        setUploadProgress(0)

        try {
            // Split by newline OR comma, then trim and filter empty
            const allKeys = newKeys.split(/[\n,]+/).map(k => k.trim()).filter(k => k && k.length > 0)
            const totalKeys = allKeys.length
            const chunkSize = 1000
            let processed = 0

            if (totalKeys === 0) {
                setAddingKeys(false)
                return
            }

            for (let i = 0; i < totalKeys; i += chunkSize) {
                const chunk = allKeys.slice(i, i + chunkSize)

                try {
                    const res = await fetch(`/api/digital-products/${params.id}/keys`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            keys: chunk,
                            shopifyVariantId: selectedVariant !== 'any' ? selectedVariant : null
                        })
                    })

                    if (!res.ok) {
                        console.error('Failed to upload chunk', i)
                    }

                    processed += chunk.length
                    setUploadProgress(Math.round((processed / totalKeys) * 100))
                } catch (err) {
                    console.error('Error uploading chunk:', err)
                }
            }

            setNewKeys('')
            setUploadProgress(0)
            loadData() // Reload to see new keys
            alert(`${totalKeys} Keys wurden erfolgreich hinzugefügt.`)
        } catch (error) {
            console.error(error)
            alert('Ein Fehler ist aufgetreten.')
        } finally {
            setAddingKeys(false)
        }
    }

    const handleSaveTemplate = async () => {
        setSavingTemplate(true)
        try {
            const res = await fetch(`/api/digital-products/${params.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    emailTemplate: selectedTemplateVariant === 'default' ? template : undefined,
                    downloadUrl,
                    buttonText,
                    buttonColor,
                    buttonTextColor,
                    buttonAlignment,
                    downloadButtons: selectedTemplateVariant === 'default' ? buttons : undefined,
                    variantSettings: selectedTemplateVariant !== 'default' ? [{
                        shopifyVariantId: selectedTemplateVariant,
                        emailTemplate: template,
                        downloadButtons: buttons
                    }] : undefined
                })
            })

            // If we are saving a variant, we should also update our local state to reflect that
            if (selectedTemplateVariant !== 'default') {
                const newSettings = [...variantSettings]
                const existingIndex = newSettings.findIndex(s => s.shopifyVariantId === selectedTemplateVariant)
                if (existingIndex >= 0) {
                    newSettings[existingIndex] = { ...newSettings[existingIndex], emailTemplate: template, downloadButtons: buttons }
                } else {
                    newSettings.push({ shopifyVariantId: selectedTemplateVariant, emailTemplate: template, downloadButtons: buttons })
                }
                setVariantSettings(newSettings)
            } else {
                // Reload data to ensure main product is synced if we saved default
                // Actually we can just wait for the alert
            }

            if (res.ok) {
                alert('Einstellungen gespeichert')
            } else {
                alert('Fehler beim Speichern')
            }
        } catch (error) {
            console.error(error)
        } finally {
            setSavingTemplate(false)
        }
    }




    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return

        setAddingKeys(true)
        setUploadProgress(0)

        const reader = new FileReader()
        reader.onload = async (event) => {
            const text = event.target?.result as string
            if (!text) return

            const allKeys = text.split(/[\n,]+/).map(k => k.trim()).filter(k => k && k.length > 0)
            const totalKeys = allKeys.length
            const chunkSize = 1000
            let processed = 0

            for (let i = 0; i < totalKeys; i += chunkSize) {
                const chunk = allKeys.slice(i, i + chunkSize)

                try {
                    await fetch(`/api/digital-products/${params.id}/keys`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            keys: chunk,
                            shopifyVariantId: selectedVariant !== 'any' ? selectedVariant : null
                        })
                    })

                    processed += chunk.length
                    setUploadProgress(Math.round((processed / totalKeys) * 100))
                } catch (err) {
                    console.error('Error uploading chunk:', err)
                    // Continue with next chunk or stop? For now continue
                }
            }

            setAddingKeys(false)
            setUploadProgress(0)
            loadData()
            alert(`${totalKeys} Keys wurden verarbeitet.`)
            // Reset file input
            e.target.value = ''
        }
        reader.readAsText(file)
    }

    const getDefaultTemplate = () => {
        return `Hallo {{ customer_name }},
<br/><br/>
vielen Dank für Ihre Bestellung!
<br/><br/>
Hier ist Ihr Produktschlüssel für {{ product_title }}:
<br/>
{{ license_key }}
<br/><br/>
Anleitung:
<br/>
1. ...
<br/>
2. ...
<br/><br/>
Viel Spaß!`
    }

    if (loading) return <div className="p-8 text-center">Laden...</div>
    if (!product) return <div className="p-8 text-center">Produkt nicht gefunden</div>

    const filteredKeys = keys.filter(k => {
        if (keysFilterVariant === 'all') return true
        if (keysFilterVariant === 'none') return k.shopifyVariantId === null
        return String(k.shopifyVariantId) === String(keysFilterVariant)
    })

    const availableKeys = filteredKeys.filter(k => !k.isUsed).length
    const usedKeys = filteredKeys.filter(k => k.isUsed).length

    const handleDeleteKey = async (keyId: string) => {
        if (!confirm('Möchten Sie diesen Key wirklich löschen?')) return

        try {
            const res = await fetch(`/api/digital-products/${params.id}/keys?keyId=${keyId}`, {
                method: 'DELETE'
            })

            if (res.ok) {
                loadData()
            } else {
                alert('Fehler beim Löschen')
            }
        } catch (error) {
            console.error(error)
        }
    }

    const handleSelectAll = (checked: boolean) => {
        if (checked) {
            const displayedKeys = activeKeyTab === 'history'
                ? keys.filter(k => k.isUsed)
                : keys.filter(k => !k.isUsed)
            setSelectedKeys(new Set(displayedKeys.map(k => k.id)))
        } else {
            setSelectedKeys(new Set())
        }
    }

    const handleSelectKey = (keyId: string, checked: boolean) => {
        const newSelected = new Set(selectedKeys)
        if (checked) {
            newSelected.add(keyId)
        } else {
            newSelected.delete(keyId)
        }
        setSelectedKeys(newSelected)
    }

    const handleBulkDelete = async () => {
        if (selectedKeys.size === 0) return
        if (!confirm(`Sind Sie sicher, dass Sie die ${selectedKeys.size} ausgewählten Keys löschen möchten?`)) return

        try {
            const res = await fetch(`/api/digital-products/${params.id}/keys`, {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ keyIds: Array.from(selectedKeys) })
            })

            if (res.ok) {
                alert(`${selectedKeys.size} Keys wurden erfolgreich gelöscht.`)
                setSelectedKeys(new Set())
                loadData()
            } else {
                alert('Fehler beim Löschen der Keys')
            }
        } catch (error) {
            console.error(error)
            alert('Ein Fehler ist aufgetreten')
        }
    }

    return (
        <div className="min-h-screen bg-gray-50">
            <header className="bg-white shadow-sm border-b sticky top-0 z-10">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <HeaderNavIcons />
                        <div className="flex items-center gap-2">
                            <h1 className="text-xl font-bold text-gray-900">{product.title}</h1>
                            <Button variant="ghost" size="icon" onClick={() => {
                                setEditProductData({ title: product.title })
                                setIsEditingProduct(true)
                            }} title="Bearbeiten">
                                <Edit className="w-4 h-4" />
                            </Button>
                        </div>
                        <p className="text-xs text-gray-500">ID: {product.shopifyProductId}</p>
                    </div>
                    {/* Edit Product Dialog */}
                    <Dialog open={isEditingProduct} onOpenChange={setIsEditingProduct}>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>Produkt bearbeiten</DialogTitle>
                                <DialogDescription>Ändern Sie die Produktinformationen.</DialogDescription>
                            </DialogHeader>
                            <div className="grid gap-4 py-4">
                                <div className="grid grid-cols-4 items-center gap-4">
                                    <Label htmlFor="productTitle" className="text-right">Titel</Label>
                                    <Input id="productTitle" value={editProductData.title} className="col-span-3" onChange={e => setEditProductData({ ...editProductData, title: e.target.value })} />
                                </div>
                            </div>
                            <DialogFooter>
                                <Button onClick={async () => {
                                    try {
                                        const res = await fetch(`/api/digital-products/${params.id}`, {
                                            method: 'PUT',
                                            headers: { 'Content-Type': 'application/json' },
                                            body: JSON.stringify(editProductData)
                                        })
                                        if (res.ok) {
                                            const updated = await res.json()
                                            setProduct(updated.data)
                                            setIsEditingProduct(false)
                                            alert('Produkt aktualisiert')
                                        } else {
                                            alert('Fehler beim Aktualisieren')
                                        }
                                    } catch (e) {
                                        console.error(e)
                                        alert('Ein Fehler ist aufgetreten')
                                    }
                                }}>Speichern</Button>
                                <Button variant="ghost" onClick={() => setIsEditingProduct(false)}>Abbrechen</Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>

                </div>
            </header>

            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Stats Column */}
                    <div className="lg:col-span-1 space-y-6">
                        <Card>
                            <CardHeader>
                                <CardTitle>Status</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className={`flex justify-between items-center p-3 rounded-lg ${availableKeys < 10 ? 'bg-yellow-50 border border-yellow-200' : 'bg-green-50'}`}>
                                    <div className="flex flex-col">
                                        <span className={`${availableKeys < 10 ? 'text-yellow-800' : 'text-green-700'} font-medium`}>Verfügbar</span>
                                        {availableKeys < 10 && (
                                            <span className="text-xs text-yellow-600 font-semibold mt-1">⚠️ Niedriger Bestand</span>
                                        )}
                                    </div>
                                    <span className={`text-2xl font-bold ${availableKeys < 10 ? 'text-yellow-800' : 'text-green-700'}`}>{availableKeys}</span>
                                </div>
                                <div className="flex justify-between items-center p-3 bg-gray-100 rounded-lg">
                                    <span className="text-gray-700 font-medium">Verbraucht</span>
                                    <span className="text-2xl font-bold text-gray-700">{usedKeys}</span>
                                </div>
                                <div className="pt-4 border-t">
                                    <p className="text-sm text-gray-500">
                                        Gesamt: {filteredKeys.length} Keys
                                    </p>
                                </div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle>Keys hinzufügen</CardTitle>
                                <CardDescription>
                                    Fügen Sie neue Produktschlüssel hinzu (Text oder Datei).
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                {variants.length > 1 && (
                                    <div>
                                        <Label className="mb-2 block">Variante wählen</Label>
                                        <select
                                            className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                            value={selectedVariant}
                                            onChange={e => setSelectedVariant(e.target.value)}
                                        >
                                            <option value="any">Alle Varianten / Keine spezifische</option>
                                            {variants.map(v => (
                                                <option key={v.id} value={v.id}>
                                                    {v.title}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                )}

                                <div>
                                    <Label className="mb-2 block">Text-Eingabe (kleine Mengen)</Label>
                                    <Textarea
                                        placeholder="XXXX-XXXX-XXXX-XXXX&#10;YYYY-YYYY-YYYY-YYYY"
                                        className="min-h-[100px] font-mono"
                                        value={newKeys}
                                        onChange={e => setNewKeys(e.target.value)}
                                    />
                                    <Button
                                        className="w-full mt-2"
                                        onClick={handleAddKeys}
                                        disabled={addingKeys || !newKeys.trim()}
                                    >
                                        {addingKeys ? 'Fügt hinzu...' : 'Text-Keys speichern'}
                                    </Button>
                                </div>

                                <div className="border-t pt-4">
                                    <Label className="mb-2 block">Datei-Upload (große Mengen)</Label>
                                    <Input
                                        type="file"
                                        accept=".txt,.csv"
                                        onChange={handleFileUpload}
                                        disabled={addingKeys}
                                    />
                                    <p className="text-xs text-muted-foreground mt-1">
                                        Unterstützt .txt und .csv (ein Key pro Zeile).
                                    </p>
                                    {uploadProgress > 0 && uploadProgress < 100 && (
                                        <div className="w-full bg-gray-200 rounded-full h-2.5 mt-2">
                                            <div className="bg-blue-600 h-2.5 rounded-full" style={{ width: `${uploadProgress}%` }}></div>
                                            <p className="text-xs text-center mt-1">{uploadProgress}% hochgeladen</p>
                                        </div>
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Main Content Column */}
                    <div className="lg:col-span-2">
                        <Tabs defaultValue="keys">
                            <TabsList className="mb-4">
                                <TabsTrigger value="keys">Produktschlüssel Liste</TabsTrigger>
                                <TabsTrigger value="template">E-Mail Nachricht</TabsTrigger>
                            </TabsList>

                            <TabsContent value="keys">
                                <Card>
                                    <CardHeader>
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <CardTitle>Produktschlüssel Verwaltung</CardTitle>
                                                <CardDescription>
                                                    Verwalten Sie Ihre Keys und sehen Sie die Verkaufshistorie ein.
                                                </CardDescription>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <select
                                                    className="h-9 w-[200px] rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                                                    value={keysFilterVariant}
                                                    onChange={e => setKeysFilterVariant(e.target.value)}
                                                >
                                                    <option value="all">Alle Varianten</option>
                                                    <option value="none">Keine spezifische</option>
                                                    {variants.map(v => (
                                                        <option key={v.id} value={v.id}>{v.title}</option>
                                                    ))}
                                                </select>
                                                <div className="flex bg-gray-100 p-1 rounded-lg">
                                                    <button
                                                        onClick={() => setActiveKeyTab('history')}
                                                        className={`px-4 py-2 text-sm font-medium rounded-md transition-all ${activeKeyTab === 'history' ? 'bg-white shadow text-gray-900' : 'text-gray-500 hover:text-gray-900'}`}
                                                    >
                                                        Verkaufshistorie
                                                    </button>
                                                    <button
                                                        onClick={() => setActiveKeyTab('inventory')}
                                                        className={`px-4 py-2 text-sm font-medium rounded-md transition-all ${activeKeyTab === 'inventory' ? 'bg-white shadow text-gray-900' : 'text-gray-500 hover:text-gray-900'}`}
                                                    >
                                                        Verfügbare Keys
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    </CardHeader>
                                    <CardContent>
                                        {selectedKeys.size > 0 && (
                                            <div className="bg-blue-50 border border-blue-200 text-blue-800 px-4 py-3 rounded-md mb-4 flex items-center justify-between">
                                                <span className="font-medium">{selectedKeys.size} Keys ausgewählt</span>
                                                <Button
                                                    variant="destructive"
                                                    size="sm"
                                                    onClick={handleBulkDelete}
                                                    className="bg-red-600 hover:bg-red-700 text-white"
                                                >
                                                    <Trash2 className="w-4 h-4 mr-2" />
                                                    Ausgewählte löschen
                                                </Button>
                                            </div>
                                        )}

                                        {/* Card-Based Layout - Professional SaaS Style */}
                                        <div className="space-y-4">
                                            {(() => {
                                                const displayedKeys = activeKeyTab === 'history'
                                                    ? filteredKeys.filter(k => k.isUsed).sort((a, b) => new Date(b.usedAt).getTime() - new Date(a.usedAt).getTime())
                                                    : filteredKeys.filter(k => !k.isUsed);

                                                if (displayedKeys.length === 0) {
                                                    return (
                                                        <div className="text-center py-12 text-gray-500">
                                                            {activeKeyTab === 'history' ? 'Noch keine Verkäufe' : 'Keine Keys verfügbar'}
                                                        </div>
                                                    );
                                                }

                                                return displayedKeys.map((key) => (
                                                    <div
                                                        key={key.id}
                                                        className="group relative bg-white border border-gray-200 rounded-xl hover:border-blue-300 hover:shadow-sm transition-all duration-200 overflow-hidden"
                                                    >
                                                        <div className="flex items-stretch h-full">
                                                            {/* 1. Checkbox Column */}
                                                            <div className="flex-shrink-0 w-12 flex items-center justify-center border-r border-gray-50 bg-gray-50/30">
                                                                <Checkbox
                                                                    checked={selectedKeys.has(key.id)}
                                                                    onCheckedChange={(checked) => handleSelectKey(key.id, checked as boolean)}
                                                                />
                                                            </div>

                                                            {/* 2. Main Content (Zones A & B) */}
                                                            <div className="flex-1 p-5 min-w-0 flex flex-col justify-center">
                                                                {/* ZONE A: Header (Key + Status) */}
                                                                <div className="flex items-center gap-4 mb-4">
                                                                    <span className="font-mono text-lg font-bold text-gray-900 tracking-tight select-all">
                                                                        {key.key}
                                                                    </span>
                                                                    {/* Status Badge - Subtle & Clean */}
                                                                    {key.isUsed ? (
                                                                        <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide bg-red-50 text-red-600 border border-red-100/50">
                                                                            Verbraucht
                                                                        </span>
                                                                    ) : (
                                                                        <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide bg-emerald-50 text-emerald-600 border border-emerald-100/50">
                                                                            Verfügbar
                                                                        </span>
                                                                    )}
                                                                </div>

                                                                {/* ZONE B: Metadata Grid (2x2) */}
                                                                {activeKeyTab === 'history' ? (
                                                                    <div className="grid grid-cols-2 gap-x-8 gap-y-4">
                                                                        {/* Row 1: Variant & Date */}
                                                                        <div>
                                                                            <div className="text-[10px] uppercase tracking-wider text-gray-400 font-semibold mb-1">Variante</div>
                                                                            <div className="text-sm font-medium text-gray-700 truncate">
                                                                                {key.shopifyVariantId ? (
                                                                                    variants.find(v => String(v.id) === String(key.shopifyVariantId))?.title || key.shopifyVariantId
                                                                                ) : (
                                                                                    <span className="text-gray-400 italic">Alle Varianten</span>
                                                                                )}
                                                                            </div>
                                                                        </div>
                                                                        <div>
                                                                            <div className="text-[10px] uppercase tracking-wider text-gray-400 font-semibold mb-1">Verwendet am</div>
                                                                            <div className="text-sm font-medium text-gray-700 font-mono">
                                                                                {key.usedAt ? new Date(key.usedAt).toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '-'}
                                                                            </div>
                                                                        </div>

                                                                        {/* Row 2: Order & Customer */}
                                                                        <div>
                                                                            <div className="text-[10px] uppercase tracking-wider text-gray-400 font-semibold mb-1">Bestellung</div>
                                                                            <div className="text-sm font-medium text-gray-900 font-mono">
                                                                                {key.orderId ? (
                                                                                    <span className="bg-gray-100 text-gray-700 px-1.5 py-0.5 rounded text-xs">{key.orderId}</span>
                                                                                ) : (
                                                                                    key.shopifyOrderId ? (
                                                                                        <span className="bg-gray-100 text-gray-700 px-1.5 py-0.5 rounded text-xs">
                                                                                            {key.shopifyOrderId.startsWith('#') || key.shopifyOrderId.startsWith('TEST') ? key.shopifyOrderId : `#${key.shopifyOrderId}`}
                                                                                        </span>
                                                                                    ) : '-'
                                                                                )}
                                                                            </div>
                                                                        </div>
                                                                        <div>
                                                                            <div className="text-[10px] uppercase tracking-wider text-gray-400 font-semibold mb-1">Kunde</div>
                                                                            <div
                                                                                className="text-sm font-medium text-blue-600 truncate max-w-[200px] cursor-help"
                                                                                title={key.customer?.email || 'Unbekannt'}
                                                                            >
                                                                                {key.customer?.email || '-'}
                                                                            </div>
                                                                        </div>
                                                                    </div>
                                                                ) : (
                                                                    /* For Available Keys - Simpler Layout */
                                                                    <div className="grid grid-cols-2 gap-x-8 gap-y-4">
                                                                        <div>
                                                                            <div className="text-[10px] uppercase tracking-wider text-gray-400 font-semibold mb-1">Variante</div>
                                                                            <div className="text-sm font-medium text-gray-700 truncate">
                                                                                {key.shopifyVariantId ? (
                                                                                    variants.find(v => String(v.id) === String(key.shopifyVariantId))?.title || key.shopifyVariantId
                                                                                ) : (
                                                                                    <span className="text-gray-400 italic">Alle Varianten</span>
                                                                                )}
                                                                            </div>
                                                                        </div>
                                                                        <div>
                                                                            <div className="text-[10px] uppercase tracking-wider text-gray-400 font-semibold mb-1">Hinzugefügt am</div>
                                                                            <div className="text-sm font-medium text-gray-700 font-mono">
                                                                                {new Date(key.createdAt).toLocaleDateString('de-DE')}
                                                                            </div>
                                                                        </div>
                                                                    </div>
                                                                )}
                                                            </div>

                                                            {/* 3. ZONE C: Actions Side Column */}
                                                            <div className="flex-shrink-0 w-14 flex flex-col items-center justify-center gap-3 border-l border-gray-100 bg-gray-50/50">
                                                                {activeKeyTab === 'history' && (
                                                                    <Button
                                                                        variant="ghost"
                                                                        size="sm"
                                                                        className="h-8 w-8 p-0 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                                                        title="E-Mail erneut senden"
                                                                        disabled={resendingKeys.has(key.id)}
                                                                        onClick={async () => {
                                                                            setResendingKeys(prev => new Set([...prev, key.id]))
                                                                            try {
                                                                                const res = await fetch(`/api/digital-products/${params.id}/keys`, {
                                                                                    method: 'POST',
                                                                                    headers: { 'Content-Type': 'application/json' },
                                                                                    body: JSON.stringify({ action: 'resend', keyId: key.id })
                                                                                })
                                                                                if (res.ok) {
                                                                                    showToast('E-Mail versendet', 'success')
                                                                                    loadData()
                                                                                } else {
                                                                                    showToast('Fehler beim Senden', 'error')
                                                                                }
                                                                            } catch (e) {
                                                                                showToast('Netzwerkfehler', 'error')
                                                                            } finally {
                                                                                setTimeout(() => {
                                                                                    setResendingKeys(prev => {
                                                                                        const next = new Set(prev)
                                                                                        next.delete(key.id)
                                                                                        return next
                                                                                    })
                                                                                }, 2000)
                                                                            }
                                                                        }}
                                                                    >
                                                                        <RefreshCw className={`w-4 h-4 ${resendingKeys.has(key.id) ? 'animate-spin' : ''}`} />
                                                                    </Button>
                                                                )}

                                                                <Button
                                                                    variant="ghost"
                                                                    size="sm"
                                                                    className="h-8 w-8 p-0 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                                                    onClick={() => handleDeleteKey(key.id)}
                                                                    title="Schlüssel löschen"
                                                                >
                                                                    <Trash2 className="w-4 h-4" />
                                                                </Button>
                                                            </div>
                                                        </div>
                                                    </div>
                                                ));
                                            })()}
                                        </div>

                                    </CardContent>
                                </Card>
                            </TabsContent>

                            <TabsContent value="template">
                                <Card>
                                    <CardHeader>
                                        <CardTitle>E-Mail Vorlage & Download-Buttons</CardTitle>
                                        <CardDescription>
                                            Passen Sie die Nachricht an und konfigurieren Sie optional Download-Buttons.
                                        </CardDescription>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="flex justify-end mb-6">
                                            <div className="flex items-center gap-2">
                                                <Label>Vorlage bearbeiten für:</Label>
                                                <select
                                                    className="h-9 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring w-[250px]"
                                                    value={selectedTemplateVariant}
                                                    onChange={e => {
                                                        const newVariant = e.target.value
                                                        setSelectedTemplateVariant(newVariant)

                                                        // Load settings for this variant
                                                        if (newVariant === 'default') {
                                                            setTemplate(product.emailTemplate || getDefaultTemplate())
                                                            if (product.downloadButtons && Array.isArray(product.downloadButtons)) {
                                                                setButtons(product.downloadButtons)
                                                            } else {
                                                                setButtons([])
                                                            }
                                                        } else {
                                                            const setting = variantSettings.find(s => s.shopifyVariantId === newVariant)
                                                            if (setting) {
                                                                setTemplate(setting.emailTemplate || getDefaultTemplate())
                                                                if (setting.downloadButtons && Array.isArray(setting.downloadButtons)) {
                                                                    setButtons(setting.downloadButtons)
                                                                } else {
                                                                    setButtons([])
                                                                }
                                                            } else {
                                                                // No setting yet, maybe copy from default or empty?
                                                                // Let's copy from default for better UX, but maybe user wants empty?
                                                                // User asked for "Copy from default" button. So start empty or with default?
                                                                // Let's start with default content but mark as new
                                                                setTemplate(product.emailTemplate || getDefaultTemplate())
                                                                if (product.downloadButtons && Array.isArray(product.downloadButtons)) {
                                                                    setButtons(product.downloadButtons)
                                                                } else {
                                                                    setButtons([])
                                                                }
                                                            }
                                                        }
                                                    }}
                                                >
                                                    <option value="default">Standard (Alle Varianten)</option>
                                                    {variants.map(v => (
                                                        <option key={v.id} value={v.id}>Variante: {v.title}</option>
                                                    ))}
                                                </select>
                                            </div>
                                        </div>

                                        {selectedTemplateVariant !== 'default' && (
                                            <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 px-4 py-3 rounded-md mb-6 flex items-center justify-between">
                                                <div className="flex items-center gap-2">
                                                    <span className="text-sm">
                                                        Sie bearbeiten die Vorlage für <strong>{variants.find(v => String(v.id) === selectedTemplateVariant)?.title}</strong>.
                                                        Falls keine spezifische Vorlage gespeichert wird, wird die Standard-Vorlage verwendet.
                                                    </span>
                                                </div>
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() => {
                                                        // Copy from default
                                                        setTemplate(product.emailTemplate || getDefaultTemplate())
                                                        if (product.downloadButtons && Array.isArray(product.downloadButtons)) {
                                                            setButtons(product.downloadButtons)
                                                        } else {
                                                            setButtons([])
                                                        }
                                                        alert('Inhalte von Standard-Vorlage übernommen.')
                                                    }}
                                                >
                                                    <Copy className="w-3 h-3 mr-2" />
                                                    Von Standard übernehmen
                                                </Button>
                                            </div>
                                        )}

                                        <div className="space-y-8">
                                            <div className="space-y-4">
                                                <div className="bg-blue-50 p-4 rounded-md text-sm text-blue-800">
                                                    <strong>Verfügbare Variablen:</strong><br />
                                                    {'{{ customer_name }}'} - Name des Kunden<br />
                                                    {'{{ customer_salutation }}'} - Automatische Anrede (z.B. Sehr geehrter Herr...)<br />
                                                    {'{{ product_title }}'} - Name des Produkts<br />
                                                    {'{{ license_key }}'} - Der zugewiesene Key<br />
                                                    {'{{ download_button }}'} - Die Download-Buttons (wird durch die Konfiguration unten erstellt)<br />
                                                    <br />
                                                    <strong>Formatierung:</strong><br />
                                                    Nutzen Sie die Toolbar, um Texte zu formatieren (Fett, Kursiv, Listen) oder Links einzufügen.
                                                </div>

                                                <div className="space-y-2">
                                                    <div className="flex justify-between items-center">
                                                        <Label>Nachrichtentext</Label>
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            onClick={() => setShowSourceCode(!showSourceCode)}
                                                            className="text-xs text-gray-500 hover:text-gray-900"
                                                        >
                                                            {showSourceCode ? (
                                                                <>
                                                                    <RefreshCw className="w-3 h-3 mr-1" />
                                                                    Visueller Editor
                                                                </>
                                                            ) : (
                                                                <>
                                                                    <span className="font-mono text-xs mr-1">{'<>'}</span>
                                                                    HTML-Code bearbeiten
                                                                </>
                                                            )}
                                                        </Button>
                                                    </div>

                                                    {showSourceCode ? (
                                                        <Textarea
                                                            value={template}
                                                            onChange={e => setTemplate(e.target.value)}
                                                            className="min-h-[400px] font-mono text-sm"
                                                            placeholder="<html>...</html>"
                                                        />
                                                    ) : (
                                                        <RichTextEditor
                                                            value={template}
                                                            onChange={setTemplate}
                                                            placeholder="Schreiben Sie hier Ihre E-Mail..."
                                                            className="min-h-[400px]"
                                                        />
                                                    )}
                                                </div>
                                            </div>

                                            <div className="border-t pt-6">
                                                <h3 className="text-lg font-semibold mb-4">Download-Buttons Konfiguration</h3>
                                                <p className="text-sm text-gray-500 mb-4">
                                                    Erstellen Sie hier einen oder mehrere Buttons. Diese erscheinen an der Stelle von <code>{'{{ download_button }}'}</code>.
                                                </p>

                                                <div className="space-y-6">
                                                    {/* Global Alignment Setting */}
                                                    <div className="max-w-xs">
                                                        <Label>Ausrichtung aller Buttons</Label>
                                                        <select
                                                            className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 mt-1"
                                                            value={buttonAlignment}
                                                            onChange={e => setButtonAlignment(e.target.value)}
                                                        >
                                                            <option value="left">Links</option>
                                                            <option value="center">Zentriert</option>
                                                            <option value="right">Rechts</option>
                                                        </select>
                                                    </div>

                                                    {/* Button List */}
                                                    {buttons.map((btn, index) => (
                                                        <div key={index} className="p-4 border rounded-lg bg-gray-50 relative">
                                                            <div className="absolute top-2 right-2">
                                                                <Button
                                                                    variant="ghost"
                                                                    size="sm"
                                                                    className="text-red-500 hover:text-red-700 hover:bg-red-50"
                                                                    onClick={() => {
                                                                        const newButtons = [...buttons];
                                                                        newButtons.splice(index, 1);
                                                                        setButtons(newButtons);
                                                                    }}
                                                                >
                                                                    <Trash2 className="w-4 h-4" />
                                                                </Button>
                                                            </div>

                                                            <h4 className="text-sm font-medium mb-3">Button {index + 1}</h4>

                                                            <div className="space-y-4">
                                                                <div className="space-y-2">
                                                                    <Label>Download URL</Label>
                                                                    <Input
                                                                        placeholder="https://example.com/download.zip"
                                                                        value={btn.url}
                                                                        onChange={e => {
                                                                            const newButtons = [...buttons];
                                                                            newButtons[index].url = e.target.value;
                                                                            setButtons(newButtons);
                                                                        }}
                                                                    />
                                                                </div>

                                                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                                                    <div className="space-y-2">
                                                                        <Label>Button Text</Label>
                                                                        <Input
                                                                            value={btn.text}
                                                                            onChange={e => {
                                                                                const newButtons = [...buttons];
                                                                                newButtons[index].text = e.target.value;
                                                                                setButtons(newButtons);
                                                                            }}
                                                                        />
                                                                    </div>
                                                                    <div className="space-y-2">
                                                                        <Label>Hintergrundfarbe</Label>
                                                                        <div className="flex gap-2">
                                                                            <Input
                                                                                type="color"
                                                                                className="w-12 p-1 h-10"
                                                                                value={btn.color}
                                                                                onChange={e => {
                                                                                    const newButtons = [...buttons];
                                                                                    newButtons[index].color = e.target.value;
                                                                                    setButtons(newButtons);
                                                                                }}
                                                                            />
                                                                            <Input
                                                                                value={btn.color}
                                                                                onChange={e => {
                                                                                    const newButtons = [...buttons];
                                                                                    newButtons[index].color = e.target.value;
                                                                                    setButtons(newButtons);
                                                                                }}
                                                                            />
                                                                        </div>
                                                                    </div>
                                                                    <div className="space-y-2">
                                                                        <Label>Textfarbe</Label>
                                                                        <div className="flex gap-2">
                                                                            <Input
                                                                                type="color"
                                                                                className="w-12 p-1 h-10"
                                                                                value={btn.textColor}
                                                                                onChange={e => {
                                                                                    const newButtons = [...buttons];
                                                                                    newButtons[index].textColor = e.target.value;
                                                                                    setButtons(newButtons);
                                                                                }}
                                                                            />
                                                                            <Input
                                                                                value={btn.textColor}
                                                                                onChange={e => {
                                                                                    const newButtons = [...buttons];
                                                                                    newButtons[index].textColor = e.target.value;
                                                                                    setButtons(newButtons);
                                                                                }}
                                                                            />
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    ))}

                                                    <Button
                                                        variant="outline"
                                                        onClick={() => setButtons([...buttons, { url: '', text: 'Download', color: '#000000', textColor: '#ffffff' }])}
                                                    >
                                                        <Plus className="w-4 h-4 mr-2" />
                                                        Weiteren Button hinzufügen
                                                    </Button>

                                                    {buttons.length > 0 && (
                                                        <div className="p-4 border rounded-lg bg-gray-50 mt-4">
                                                            <Label className="mb-2 block text-gray-500">Vorschau:</Label>
                                                            <div className={`flex flex-col gap-3 ${buttonAlignment === 'center' ? 'items-center' : (buttonAlignment === 'right' ? 'items-end' : 'items-start')}`}>
                                                                {buttons.map((btn, i) => (
                                                                    <a
                                                                        key={i}
                                                                        href="#"
                                                                        style={{
                                                                            backgroundColor: btn.color,
                                                                            color: btn.textColor,
                                                                            padding: '12px 24px',
                                                                            borderRadius: '6px',
                                                                            textDecoration: 'none',
                                                                            fontWeight: 'bold',
                                                                            display: 'inline-block',
                                                                            width: '280px',
                                                                            textAlign: 'center',
                                                                            boxSizing: 'border-box',
                                                                            whiteSpace: 'normal',
                                                                            wordWrap: 'break-word'
                                                                        }}
                                                                        onClick={e => e.preventDefault()}
                                                                    >
                                                                        {btn.text}
                                                                    </a>
                                                                ))}
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>

                                            <div className="flex justify-end pt-4 border-t gap-2">
                                                <Dialog>
                                                    <DialogTrigger asChild>
                                                        <Button variant="outline">
                                                            <RefreshCw className="w-4 h-4 mr-2" />
                                                            E-Mail Vorschau
                                                        </Button>
                                                    </DialogTrigger>
                                                    <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
                                                        <DialogHeader>
                                                            <DialogTitle>E-Mail Vorschau</DialogTitle>
                                                            <DialogDescription>
                                                                So sieht die E-Mail für den Kunden aus (mit Beispieldaten).
                                                            </DialogDescription>
                                                        </DialogHeader>
                                                        <div className="border rounded-md bg-gray-50 p-6 min-h-[400px] shadow-sm">
                                                            <div className="bg-white border rounded p-8 max-w-[600px] mx-auto shadow-sm" dangerouslySetInnerHTML={{
                                                                __html: (() => {
                                                                    // 1. Get template
                                                                    let html = template || '';

                                                                    // 2. Convert newlines to BR (MATCHING BACKEND LOGIC)
                                                                    // The backend blindly replaces \n with <br/>, so we must do the same to show accurate preview
                                                                    // html = html.replace(/\n/g, '<br/>');

                                                                    // 3. Replace variables
                                                                    html = html
                                                                        .replace(/{{ customer_name }}/g, 'Max Mustermann')
                                                                        .replace(/{{ customer_salutation }}/g, 'Sehr geehrter Herr Mustermann')
                                                                        .replace(/{{ product_title }}/g, product?.title || 'Beispiel Produkt')
                                                                        .replace(/{{ license_key }}/g, 'XXXX-YYYY-ZZZZ-AAAA');

                                                                    // 4. Generate button HTML
                                                                    let buttonsHtml = '';
                                                                    if (buttons.length > 0) {
                                                                        const btns = buttons.map(btn => `
                                                                            <div style="margin-bottom: 12px;">
                                                                                <a href="#" style="background-color: ${btn.color}; color: ${btn.textColor}; padding: 12px 24px; border-radius: 6px; text-decoration: none; font-weight: bold; display: inline-block; width: 280px; text-align: center; box-sizing: border-box; white-space: normal; word-wrap: break-word;">
                                                                                    ${btn.text}
                                                                                </a>
                                                                            </div>
                                                                        `).join('');

                                                                        const textAlign = buttonAlignment === 'center' ? 'center' : (buttonAlignment === 'right' ? 'right' : 'left');
                                                                        buttonsHtml = `<div style="margin: 20px 0; text-align: ${textAlign};">${btns}</div>`;
                                                                    }

                                                                    // 5. Inject buttons
                                                                    html = html.replace(/{{ download_button }}/g, buttonsHtml);

                                                                    return html;
                                                                })()
                                                            }} />
                                                        </div>
                                                    </DialogContent>
                                                </Dialog>

                                                <Button onClick={handleSaveTemplate} disabled={savingTemplate}>
                                                    <Save className="w-4 h-4 mr-2" />
                                                    {savingTemplate ? 'Speichert...' : 'Alles speichern'}
                                                </Button>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            </TabsContent>
                        </Tabs>
                    </div>
                </div>
            </main >
            
        </div >
    )
}
