'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { ArrowLeft, Plus, Trash2, Copy, Save, RefreshCw, Edit } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { RichTextEditor } from '@/components/ui/rich-text-editor';
import { Input } from '@/components/ui/input';

interface DigitalProduct {
    id: string;
    title: string;
    shopifyProductId: string;
    emailTemplate?: string;
    downloadUrl?: string;
    buttonText?: string;
    buttonColor?: string;
    buttonTextColor?: string;
    buttonAlignment?: string;
    downloadButtons?: any[];
}

interface LicenseKey {
    id: string;
    key: string;
    isUsed: boolean;
    usedAt?: string;
    shopifyOrderId?: string;
    orderId?: string;
}

interface DigitalProductDetailViewProps {
    product: DigitalProduct;
    onBack: () => void;
}

export default function DigitalProductDetailView({ product, onBack }: DigitalProductDetailViewProps) {
    const [keys, setKeys] = useState<LicenseKey[]>([]);
    const [loading, setLoading] = useState(true);
    const [isAddKeysDialogOpen, setIsAddKeysDialogOpen] = useState(false);
    const [newKeysInput, setNewKeysInput] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Template state
    const [template, setTemplate] = useState(product.emailTemplate || '');
    const [savingTemplate, setSavingTemplate] = useState(false);

    // Download Settings State
    const [downloadUrl, setDownloadUrl] = useState(product.downloadUrl || '');
    const [buttonText, setButtonText] = useState(product.buttonText || 'Download');
    const [buttonColor, setButtonColor] = useState(product.buttonColor || '#000000');
    const [buttonTextColor, setButtonTextColor] = useState(product.buttonTextColor || '#ffffff');
    const [buttonAlignment, setButtonAlignment] = useState(product.buttonAlignment || 'left');
    const [buttons, setButtons] = useState<{ url: string, text: string, color: string, textColor: string }[]>([]);

    // UI State
    const [showSourceCode, setShowSourceCode] = useState(false);
    const [activeKeyTab, setActiveKeyTab] = useState<'history' | 'inventory'>('history');

    useEffect(() => {
        fetchKeys();
        // Also fetch fresh product data to get the template if it wasn't passed or is stale
        fetchProductDetails();
    }, [product.id]);

    const fetchProductDetails = async () => {
        try {
            const res = await fetch(`/api/digital-products/${product.id}`);
            const data = await res.json();
            if (data.success && data.data) {
                setTemplate(data.data.emailTemplate || getDefaultTemplate());
                setDownloadUrl(data.data.downloadUrl || '');
                setButtonText(data.data.buttonText || 'Download');
                setButtonColor(data.data.buttonColor || '#000000');
                setButtonTextColor(data.data.buttonTextColor || '#ffffff');
                setButtonAlignment(data.data.buttonAlignment || 'left');

                // Initialize buttons
                if (data.data.downloadButtons && Array.isArray(data.data.downloadButtons) && data.data.downloadButtons.length > 0) {
                    setButtons(data.data.downloadButtons);
                } else if (data.data.downloadUrl) {
                    // Migration
                    setButtons([{
                        url: data.data.downloadUrl,
                        text: data.data.buttonText || 'Download',
                        color: data.data.buttonColor || '#000000',
                        textColor: data.data.buttonTextColor || '#ffffff'
                    }]);
                } else {
                    setButtons([]);
                }
            }
        } catch (error) {
            console.error('Failed to fetch product details', error);
        }
    };

    const fetchKeys = async () => {
        try {
            const res = await fetch(`/api/digital-products/${product.id}/keys`);
            const data = await res.json();
            if (data.success) {
                setKeys(data.data);
            }
        } catch (error) {
            console.error('Failed to fetch keys', error);
        } finally {
            setLoading(false);
        }
    };

    const getDefaultTemplate = () => {
        return `Hallo {{ customer_name }},

Vielen Dank für Ihre Bestellung!

Hier ist Ihr Produktschlüssel für {{ product_title }}:
{{ license_key }}

Anleitung:
1. ...
2. ...

Viel Spaß!`;
    };

    const handleSaveTemplate = async () => {
        setSavingTemplate(true);
        try {
            const res = await fetch(`/api/digital-products/${product.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    emailTemplate: template,
                    downloadUrl,
                    buttonText,
                    buttonColor,
                    buttonTextColor,
                    buttonAlignment,
                    downloadButtons: buttons
                })
            });

            if (res.ok) {
                alert('Einstellungen gespeichert');
            } else {
                alert('Fehler beim Speichern');
            }
        } catch (error) {
            console.error(error);
            alert('Ein Fehler ist aufgetreten');
        } finally {
            setSavingTemplate(false);
        }
    };

    const handleAddKeys = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);

        try {
            // Split by newlines and filter empty
            const keysToAdd = newKeysInput.split('\n').map(k => k.trim()).filter(k => k);

            if (keysToAdd.length === 0) {
                alert('Bitte geben Sie mindestens einen Key ein.');
                setIsSubmitting(false);
                return;
            }

            const res = await fetch(`/api/digital-products/${product.id}/keys`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ keys: keysToAdd })
            });

            const data = await res.json();

            if (res.ok && data.success) {
                setNewKeysInput('');
                setIsAddKeysDialogOpen(false);
                fetchKeys();
            } else {
                alert(data.error || 'Fehler beim Hinzufügen der Keys');
            }
        } catch (error) {
            console.error('Failed to add keys', error);
            alert('Ein Fehler ist aufgetreten');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDeleteKey = async (keyId: string) => {
        if (!confirm('Möchten Sie diesen Key wirklich löschen?')) return;

        try {
            const res = await fetch(`/api/digital-products/${product.id}/keys?keyId=${keyId}`, {
                method: 'DELETE'
            });

            if (res.ok) {
                fetchKeys();
            } else {
                alert('Fehler beim Löschen des Keys');
            }
        } catch (error) {
            console.error('Failed to delete key', error);
        }
    };

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text);
    };

    const availableKeysCount = keys.filter(k => !k.isUsed).length;

    return (
        <div className="space-y-6 font-sans">
            <div className="flex items-center gap-4 mb-6">
                <Button variant="ghost" size="icon" onClick={onBack} className="hover:bg-slate-100">
                    <ArrowLeft className="w-5 h-5" />
                </Button>
                <div>
                    <h2 className="text-xl font-bold text-slate-900">{product.title}</h2>
                    <p className="text-sm text-slate-500">ID: {product.shopifyProductId}</p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card className="border-slate-200 shadow-sm">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-slate-500">Verfügbare Keys</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-blue-600">{availableKeysCount}</div>
                    </CardContent>
                </Card>
                <Card className="border-slate-200 shadow-sm">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-slate-500">Vergebene Keys</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-slate-700">{keys.length - availableKeysCount}</div>
                    </CardContent>
                </Card>
                <Card className="border-slate-200 shadow-sm">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-slate-500">Gesamt</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-slate-900">{keys.length}</div>
                    </CardContent>
                </Card>
            </div>

            <Tabs defaultValue="keys" className="w-full">
                <TabsList className="mb-4 bg-slate-100 p-1">
                    <TabsTrigger value="keys" className="data-[state=active]:bg-white data-[state=active]:text-blue-600 data-[state=active]:shadow-sm">Lizenzschlüssel</TabsTrigger>
                    <TabsTrigger value="template" className="data-[state=active]:bg-white data-[state=active]:text-blue-600 data-[state=active]:shadow-sm">E-Mail Nachricht</TabsTrigger>
                </TabsList>

                <TabsContent value="keys">
                    <Card className="border-slate-200 shadow-sm">
                        <CardHeader>
                            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                                <div>
                                    <CardTitle>Produktschlüssel Verwaltung</CardTitle>
                                    <CardDescription>
                                        Verwalten Sie Ihre Keys und sehen Sie die Verkaufshistorie ein.
                                    </CardDescription>
                                </div>
                                <div className="flex items-center gap-2">
                                    <div className="flex bg-slate-100 p-1 rounded-lg">
                                        <button
                                            onClick={() => setActiveKeyTab('history')}
                                            className={`px-4 py-2 text-sm font-medium rounded-md transition-all ${activeKeyTab === 'history' ? 'bg-white shadow text-blue-600' : 'text-slate-500 hover:text-slate-900'}`}
                                        >
                                            Verkaufshistorie
                                        </button>
                                        <button
                                            onClick={() => setActiveKeyTab('inventory')}
                                            className={`px-4 py-2 text-sm font-medium rounded-md transition-all ${activeKeyTab === 'inventory' ? 'bg-white shadow text-blue-600' : 'text-slate-500 hover:text-slate-900'}`}
                                        >
                                            Verfügbare Keys
                                        </button>
                                    </div>
                                    <Dialog open={isAddKeysDialogOpen} onOpenChange={setIsAddKeysDialogOpen}>
                                        <DialogTrigger asChild>
                                            <Button size="icon" className="bg-blue-600 hover:bg-blue-700 text-white h-9 w-9">
                                                <Plus className="w-5 h-5" />
                                            </Button>
                                        </DialogTrigger>
                                        <DialogContent>
                                            <DialogHeader>
                                                <DialogTitle>Neue Keys hinzufügen</DialogTitle>
                                            </DialogHeader>
                                            <form onSubmit={handleAddKeys} className="space-y-4 mt-4">
                                                <div className="space-y-2">
                                                    <Label htmlFor="keys">Keys (einer pro Zeile)</Label>
                                                    <Textarea
                                                        id="keys"
                                                        value={newKeysInput}
                                                        onChange={(e) => setNewKeysInput(e.target.value)}
                                                        placeholder="XXXXX-XXXXX-XXXXX-XXXXX&#10;YYYYY-YYYYY-YYYYY-YYYYY"
                                                        rows={10}
                                                        className="font-mono border-slate-200 focus:border-blue-500"
                                                        required
                                                    />
                                                </div>
                                                <div className="flex justify-end gap-2 mt-6">
                                                    <Button type="button" variant="outline" onClick={() => setIsAddKeysDialogOpen(false)}>Abbrechen</Button>
                                                    <Button type="submit" disabled={isSubmitting} className="bg-blue-600 hover:bg-blue-700 text-white">
                                                        {isSubmitting ? 'Speichern...' : 'Speichern'}
                                                    </Button>
                                                </div>
                                            </form>
                                        </DialogContent>
                                    </Dialog>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="overflow-x-auto -mx-6 md:mx-0">
                                <table className="w-full text-left text-sm">
                                    <thead className="bg-slate-50 border-b border-slate-200">
                                        <tr>
                                            <th className="px-6 py-4 font-medium text-slate-500">Key</th>
                                            <th className="px-6 py-4 font-medium text-slate-500">Status</th>
                                            {activeKeyTab === 'history' && (
                                                <>
                                                    <th className="px-6 py-4 font-medium text-slate-500">Bestellung</th>
                                                    <th className="px-6 py-4 font-medium text-slate-500">Genutzt am</th>
                                                </>
                                            )}
                                            <th className="px-6 py-4 font-medium text-slate-500 text-right">Aktion</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                        {(() => {
                                            const displayedKeys = activeKeyTab === 'history'
                                                ? keys.filter(k => k.isUsed).sort((a, b) => new Date(b.usedAt || 0).getTime() - new Date(a.usedAt || 0).getTime())
                                                : keys.filter(k => !k.isUsed);

                                            if (loading) {
                                                return <tr><td colSpan={5} className="px-6 py-8 text-center text-slate-500">Laden...</td></tr>;
                                            }

                                            if (displayedKeys.length === 0) {
                                                return (
                                                    <tr>
                                                        <td colSpan={activeKeyTab === 'history' ? 5 : 3} className="px-6 py-8 text-center text-slate-500">
                                                            {activeKeyTab === 'history' ? 'Noch keine Verkäufe' : 'Keine Keys verfügbar'}
                                                        </td>
                                                    </tr>
                                                );
                                            }

                                            return displayedKeys.map((key) => (
                                                <tr key={key.id} className="hover:bg-slate-50 transition-colors">
                                                    <td className="px-6 py-4 font-mono text-slate-700">
                                                        <div className="flex items-center gap-2">
                                                            {key.key}
                                                            <button onClick={() => copyToClipboard(key.key)} className="text-slate-400 hover:text-blue-600" title="Kopieren">
                                                                <Copy className="w-3 h-3" />
                                                            </button>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        {key.isUsed ? (
                                                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-600 border border-slate-200">
                                                                Verbraucht
                                                            </span>
                                                        ) : (
                                                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-600 border border-blue-100">
                                                                Verfügbar
                                                            </span>
                                                        )}
                                                    </td>
                                                    {activeKeyTab === 'history' && (
                                                        <>
                                                            <td className="px-6 py-4 text-slate-600">
                                                                {key.orderId ? (
                                                                    <span className="font-medium text-slate-900">{key.orderId}</span>
                                                                ) : (
                                                                    key.shopifyOrderId ? (
                                                                        key.shopifyOrderId.startsWith('#') || key.shopifyOrderId.startsWith('TEST')
                                                                            ? key.shopifyOrderId
                                                                            : `#${key.shopifyOrderId}`
                                                                    ) : '-'
                                                                )}
                                                            </td>
                                                            <td className="px-6 py-4 text-slate-600">
                                                                {key.usedAt ? new Date(key.usedAt).toLocaleDateString('de-DE') + ' ' + new Date(key.usedAt).toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' }) : '-'}
                                                            </td>
                                                        </>
                                                    )}
                                                    <td className="px-6 py-4 text-right">
                                                        <button
                                                            onClick={() => handleDeleteKey(key.id)}
                                                            className="text-slate-400 hover:text-red-600 transition-colors p-1"
                                                            title="Löschen"
                                                        >
                                                            <Trash2 className="w-4 h-4" />
                                                        </button>
                                                    </td>
                                                </tr>
                                            ));
                                        })()}
                                    </tbody>
                                </table>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="template">
                    <Card className="border-slate-200 shadow-sm">
                        <CardHeader>
                            <CardTitle>E-Mail Vorlage & Download-Buttons</CardTitle>
                            <CardDescription>
                                Passen Sie die Nachricht an und konfigurieren Sie optional Download-Buttons.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-8">
                                <div className="space-y-4">
                                    <div className="bg-blue-50 p-4 rounded-md text-sm text-blue-800 border border-blue-100">
                                        <strong>Verfügbare Variablen:</strong><br />
                                        {'{{ customer_name }}'} - Name des Kunden<br />
                                        {'{{ product_title }}'} - Name des Produkts<br />
                                        {'{{ license_key }}'} - Der zugewiesene Key<br />
                                        {'{{ download_button }}'} - Die Download-Buttons (wird durch die Konfiguration unten erstellt)<br />
                                    </div>

                                    <div className="space-y-2">
                                        <div className="flex justify-between items-center">
                                            <Label>Nachrichtentext</Label>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => setShowSourceCode(!showSourceCode)}
                                                className="text-xs text-slate-500 hover:text-slate-900"
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
                                                className="min-h-[400px] font-mono text-sm border-slate-200 focus:border-blue-500"
                                                placeholder="<html>...</html>"
                                            />
                                        ) : (
                                            <RichTextEditor
                                                value={template}
                                                onChange={setTemplate}
                                                placeholder="Schreiben Sie hier Ihre E-Mail..."
                                                className="min-h-[400px] border-slate-200"
                                            />
                                        )}
                                    </div>
                                </div>

                                <div className="border-t border-slate-200 pt-6">
                                    <h3 className="text-lg font-semibold mb-4 text-slate-800">Download-Buttons Konfiguration</h3>
                                    <p className="text-sm text-slate-500 mb-4">
                                        Erstellen Sie hier einen oder mehrere Buttons. Diese erscheinen an der Stelle von <code>{'{{ download_button }}'}</code>.
                                    </p>

                                    <div className="space-y-6">
                                        {/* Global Alignment Setting */}
                                        <div className="max-w-xs">
                                            <Label>Ausrichtung aller Buttons</Label>
                                            <select
                                                className="flex h-10 w-full items-center justify-between rounded-md border border-slate-200 bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:cursor-not-allowed disabled:opacity-50 mt-1"
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
                                            <div key={index} className="p-4 border border-slate-200 rounded-lg bg-slate-50 relative">
                                                <div className="absolute top-2 right-2">
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        className="text-slate-400 hover:text-red-600 hover:bg-red-50"
                                                        onClick={() => {
                                                            const newButtons = [...buttons];
                                                            newButtons.splice(index, 1);
                                                            setButtons(newButtons);
                                                        }}
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </Button>
                                                </div>

                                                <h4 className="text-sm font-medium mb-3 text-slate-700">Button {index + 1}</h4>

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
                                                            className="border-slate-200 focus:border-blue-500"
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
                                                                className="border-slate-200 focus:border-blue-500"
                                                            />
                                                        </div>
                                                        <div className="space-y-2">
                                                            <Label>Hintergrundfarbe</Label>
                                                            <div className="flex gap-2">
                                                                <Input
                                                                    type="color"
                                                                    className="w-12 p-1 h-10 border-slate-200"
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
                                                                    className="border-slate-200 focus:border-blue-500"
                                                                />
                                                            </div>
                                                        </div>
                                                        <div className="space-y-2">
                                                            <Label>Textfarbe</Label>
                                                            <div className="flex gap-2">
                                                                <Input
                                                                    type="color"
                                                                    className="w-12 p-1 h-10 border-slate-200"
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
                                                                    className="border-slate-200 focus:border-blue-500"
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
                                            className="border-dashed border-slate-300 text-slate-600 hover:border-blue-500 hover:text-blue-600"
                                        >
                                            <Plus className="w-4 h-4 mr-2" />
                                            Weiteren Button hinzufügen
                                        </Button>

                                        {buttons.length > 0 && (
                                            <div className="p-4 border border-slate-200 rounded-lg bg-slate-50 mt-4">
                                                <Label className="mb-2 block text-slate-500">Vorschau:</Label>
                                                <div className={`flex flex-wrap gap-2 ${buttonAlignment === 'center' ? 'justify-center' : (buttonAlignment === 'right' ? 'justify-end' : 'justify-start')}`}>
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
                                                                display: 'inline-block'
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

                                <div className="flex justify-end pt-4 border-t border-slate-200 gap-2">
                                    <Dialog>
                                        <DialogTrigger asChild>
                                            <Button variant="outline" className="border-slate-200 text-slate-700 hover:bg-slate-50">
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
                                                        html = html.replace(/\n/g, '<br/>');

                                                        // 3. Replace variables
                                                        html = html
                                                            .replace(/{{ customer_name }}/g, 'Max Mustermann')
                                                            .replace(/{{ product_title }}/g, product?.title || 'Beispiel Produkt')
                                                            .replace(/{{ license_key }}/g, 'XXXX-YYYY-ZZZZ-AAAA');

                                                        // 4. Generate button HTML
                                                        let buttonsHtml = '';
                                                        if (buttons.length > 0) {
                                                            const btns = buttons.map(btn => `
                                                                <div style="margin-bottom: 12px;">
                                                                    <a href="#" style="background-color: ${btn.color}; color: ${btn.textColor}; padding: 12px 24px; border-radius: 6px; text-decoration: none; font-weight: bold; display: inline-block;">
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

                                    <Button onClick={handleSaveTemplate} disabled={savingTemplate} className="bg-blue-600 hover:bg-blue-700 text-white">
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
    );
}
