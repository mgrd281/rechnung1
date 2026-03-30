
'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import {
    DndContext,
    closestCenter,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
} from '@dnd-kit/core'
import {
    SortableContext,
    sortableKeyboardCoordinates,
    verticalListSortingStrategy,
    useSortable
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import {
    Layout,
    Palette,
    Move,
    Save,
    RotateCcw,
    ChevronLeft,
    RefreshCw,
    Code
} from 'lucide-react'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue
} from '@/components/ui/select'
import { Slider } from '@/components/ui/slider'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { toast } from 'sonner'
import { InvoiceTemplate } from '@/lib/invoice-templates'
import { useAuthenticatedFetch } from '@/lib/api-client'
import { DEFAULT_HTML_TEMPLATE } from '@/lib/default-html-template'

interface ElementPosition {
    id: string
    name: string
    x: number
    y: number
    width?: number
    height?: number
    scale?: number
    color?: string
}

function DraggableElement({
    element,
    isSelected,
    onClick,
    primaryColor
}: {
    element: ElementPosition
    isSelected: boolean
    onClick: () => void
    primaryColor: string
}) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
    } = useSortable({ id: element.id })

    const activeColor = element.color || primaryColor

    const style = {
        position: 'absolute' as const,
        left: `${element.x}mm`,
        top: `${element.y}mm`,
        transform: CSS.Translate.toString(transform),
        cursor: 'move',
        zIndex: isSelected ? 50 : 10,
        transition: transform ? 'none' : 'all 0.1s ease-out',
    }

    return (
        <div
            ref={setNodeRef}
            style={style}
            {...attributes}
            {...listeners}
            onClick={(e) => {
                e.stopPropagation()
                onClick()
            }}
            className={`group border-2 transition-all p-2 rounded ${isSelected ? 'border-blue-500 bg-blue-50/10 ring-2 ring-blue-500/20' : 'border-transparent hover:border-dashed hover:border-gray-300'
                }`}
        >
            <div className="absolute -top-6 left-0 bg-blue-500 text-white text-[9px] px-2 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                {element.name} ({Math.round(element.x)}mm, {Math.round(element.y)}mm)
            </div>

            {element.id === 'logo' && (
                <div className="flex flex-col items-start min-w-[30mm]">
                    <div className="text-white px-3 py-1.5 font-bold uppercase tracking-wide" style={{ backgroundColor: activeColor, fontSize: `${16 * (element.scale || 1)}px` }}>
                        KARNEX
                    </div>
                </div>
            )}

            {element.id === 'senderLine' && (
                <div className="text-[7px] text-gray-500 whitespace-nowrap" style={{ color: activeColor }}>
                    Karina Khrystych • Havighorster Redder 51 • 22115 Hamburg
                </div>
            )}

            {element.id === 'infoBox' && (
                <div className="w-[60mm] h-[45mm] p-3 shadow-sm flex flex-col justify-start" style={{ backgroundColor: '#E8F3F1' }}>
                    <div className="font-bold text-[10px] mb-3">Rechnung</div>
                    <div className="space-y-1.5">
                        <div className="flex justify-between text-[8px]"><span className="text-gray-500">Rechnungs-Nr.</span> <span className="font-bold">RE-1000</span></div>
                        <div className="flex justify-between text-[8px]"><span className="text-gray-500">Kunden-Nr.</span> <span className="font-bold">inv-1758</span></div>
                        <div className="flex justify-between text-[8px]"><span className="text-gray-500">Rechnungsdatum</span> <span className="font-bold">15.1.2024</span></div>
                    </div>
                </div>
            )}

            {element.id === 'recipient' && (
                <div className="w-[80mm] space-y-1">
                    <div className="font-bold text-[11px]">Max Mustermann</div>
                    <div className="text-[9px] text-gray-600">Musterstraße 123</div>
                    <div className="text-[9px] text-gray-600">12345 Berlin</div>
                    <div className="text-[9px] text-gray-600">Germany</div>
                </div>
            )}

            {element.id === 'title' && (
                <div className="text-xl font-bold" style={{ color: activeColor }}>RECHNUNG</div>
            )}

            {element.id === 'body' && (
                <div className="text-[9px] text-gray-700 w-[150mm]">
                    Vielen Dank für Ihren Auftrag. Wir berechnen Ihnen folgende Lieferung bzw. Leistung:
                </div>
            )}

            {element.id === 'table' && (
                <div className="w-[170mm] border border-gray-100 rounded overflow-hidden bg-white shadow-sm">
                    <div className="grid grid-cols-6 text-[8px] p-2 font-bold" style={{ backgroundColor: '#E8F3F1', color: '#3C504B' }}>
                        <div>Bezeichnung</div>
                        <div>EAN</div>
                        <div>Menge</div>
                        <div>MwSt.</div>
                        <div>Preis</div>
                        <div className="text-right">Gesamt</div>
                    </div>
                    <div className="p-3 space-y-2">
                        {[1].map(i => (
                            <div key={i} className="grid grid-cols-6 border-b pb-1 last:border-0 border-gray-50 items-center">
                                <div className="text-[9px] font-medium">Premium T-Shirt</div>
                                <div className="text-center text-[8px]">TSHIRT-001</div>
                                <div className="text-center text-[8px]">1 Stk.</div>
                                <div className="text-center text-[8px]">19%</div>
                                <div className="text-center text-[8px]">84.03</div>
                                <div className="text-right text-[8px] font-bold text-gray-900">84.03</div>
                            </div>
                        ))}
                    </div>
                    <div className="p-3 bg-gray-50/20 border-t border-gray-50 flex flex-col items-end space-y-1">
                        <div className="flex justify-between w-32 text-[8px] text-gray-500"><span>Summe netto:</span> <span className="font-medium text-gray-900">84.03</span></div>
                        <div className="flex justify-between w-32 text-[8px] text-gray-500"><span>MwSt. 19%:</span> <span className="font-medium text-gray-900">15.97</span></div>
                        <div className="flex justify-between w-32 text-[9px] border-t pt-1 mt-1"><span className="font-bold">Gesamt:</span> <span className="font-bold">100.00</span></div>
                    </div>
                </div>
            )}

            {element.id === 'footer' && (
                <div className="w-[170mm] h-[25mm] p-4 grid grid-cols-3 gap-6 text-[7px]" style={{ backgroundColor: '#E8F3F1', color: '#3C504B' }}>
                    <div className="space-y-1">
                        <div className="font-bold">Karina Khrystych</div>
                        <div className="opacity-70">Havighorster Redder 51</div>
                        <div className="opacity-70">22115 Hamburg</div>
                        <div className="opacity-70">DE</div>
                    </div>
                    <div className="space-y-1">
                        <div className="font-bold">Geschäftsführer: Karina Khrystych</div>
                        <div className="opacity-70">Telefon: +4915563133856</div>
                        <div className="opacity-70">E-Mail: Rechnung@karinex.de</div>
                        <div className="opacity-70 mt-2">Steuernummer: DE452578048</div>
                    </div>
                    <div className="space-y-1">
                        <div className="font-bold">Bankverbindungen</div>
                        <div className="opacity-70">N26</div>
                        <div className="opacity-70">IBAN: DE22 1001 1001 2087 5043 11</div>
                        <div className="opacity-70">BIC: NTSBDEB1XXX</div>
                        <div className="opacity-70 mt-1">USt-IdNr.: DE123456789</div>
                    </div>
                </div>
            )}
        </div>
    )
}

export default function InvoiceDesigner() {
    const authenticatedFetch = useAuthenticatedFetch()
    const [templates, setTemplates] = useState<InvoiceTemplate[]>([])
    const [selectedTemplate, setSelectedTemplate] = useState<InvoiceTemplate | null>(null)
    const [elements, setElements] = useState<ElementPosition[]>([
        { id: 'logo', name: 'Logo / Branding', x: 20, y: 18, scale: 1 },
        { id: 'senderLine', name: 'Absenderzeile', x: 20, y: 52 },
        { id: 'infoBox', name: 'Info-Box (Oben Rechts)', x: 130, y: 45 },
        { id: 'recipient', name: 'Empfänger-Adresse', x: 20, y: 75 },
        { id: 'title', name: 'Dokument-Titel', x: 20, y: 135 },
        { id: 'body', name: 'Einleitungstext', x: 20, y: 145 },
        { id: 'table', name: 'Artikeltabelle', x: 20, y: 160 },
        { id: 'footer', name: 'Fußzeile', x: 20, y: 255 },
    ])
    const [selectedElementId, setSelectedElementId] = useState<string | null>(null)
    const [primaryColor, setPrimaryColor] = useState('#5B8272')
    const [isSaving, setIsSaving] = useState(false)
    const [customHtml, setCustomHtml] = useState('')

    useEffect(() => {
        loadTemplates()
    }, [])

    const loadTemplates = async () => {
        try {
            const res = await authenticatedFetch('/api/invoice-templates')
            const result = await res.json()
            if (result.success) {
                setTemplates(result.data)
                if (result.data.length > 0) {
                    await handleTemplateChange(result.data[0].id, result.data)
                }
            }
        } catch (e) {
            console.error('Error loading templates:', e)
        }
    }

    const handleTemplateChange = async (id: string, currentTemplates?: InvoiceTemplate[]) => {
        const list = currentTemplates || templates
        const t = list.find(item => item.id === id)
        if (t) {
            setSelectedTemplate(t)
            setPrimaryColor(t.styling?.primaryColor || '#000000')

            const defaultElements = [
                { id: 'logo', name: 'Logo / Branding', x: 20, y: 18, scale: 1 },
                { id: 'senderLine', name: 'Absenderzeile', x: 20, y: 52 },
                { id: 'infoBox', name: 'Info-Box (Oben Rechts)', x: 130, y: 45 },
                { id: 'recipient', name: 'Empfänger-Adresse', x: 20, y: 75 },
                { id: 'title', name: 'Dokument-Titel', x: 20, y: 135 },
                { id: 'body', name: 'Einleitungstext', x: 20, y: 145 },
                { id: 'table', name: 'Artikeltabelle', x: 20, y: 160 },
                { id: 'footer', name: 'Fußzeile', x: 20, y: 255 },
            ]

            if (t.layout) {
                setElements(defaultElements.map(el => {
                    const saved = (t.layout as any)[el.id]
                    if (saved) return { ...el, x: saved.x, y: saved.y, scale: saved.scale || el.scale, color: saved.color }
                    return el
                }))
            } else {
                setElements(defaultElements)
            }
            setCustomHtml(t.customHtml || DEFAULT_HTML_TEMPLATE.trim())
        }
    }

    const sensors = useSensors(
        useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
        useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
    )

    const handleDragEnd = (event: any) => {
        const { active, delta } = event
        if (!active) return

        setElements((prev) =>
            prev.map((el) => {
                if (el.id === active.id) {
                    const mmDeltaX = delta.x / 3.78
                    const mmDeltaY = delta.y / 3.78
                    return {
                        ...el,
                        x: Math.max(0, Math.min(210, el.x + mmDeltaX)),
                        y: Math.max(0, Math.min(297, el.y + mmDeltaY))
                    }
                }
                return el
            })
        )
    }

    const updateElementStyle = (id: string, updates: Partial<ElementPosition>) => {
        setElements(prev => prev.map(el => el.id === id ? { ...el, ...updates } : el))
    }

    const handleSave = async () => {
        if (!selectedTemplate) return
        setIsSaving(true)

        const layout: any = {}
        elements.forEach(el => {
            layout[el.id] = { x: el.x, y: el.y, scale: el.scale, color: el.color }
        })

        const updated: any = {
            ...selectedTemplate,
            styling: {
                ...selectedTemplate.styling,
                primaryColor,
                secondaryColor: (selectedTemplate.styling as any)?.secondaryColor || '#6b7280',
                textColor: (selectedTemplate.styling as any)?.textColor || '#000000',
                backgroundColor: (selectedTemplate.styling as any)?.backgroundColor || '#ffffff'
            },
            layout,
            customHtml
        }

        try {
            const res = await authenticatedFetch('/api/invoice-templates', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(updated)
            })
            const result = await res.json()

            if (result.success) {
                toast.success('تم حفظ التعديلات بنجاح!', {
                    description: 'Änderungen gespeichert.',
                })
                loadTemplates()
            } else {
                throw new Error(result.error)
            }
        } catch (e: any) {
            toast.error('Fehler beim Speichern: ' + (e.message || 'Unknown error'))
        } finally {
            setIsSaving(false)
        }
    }

    const selectedElement = elements.find(e => e.id === selectedElementId)

    return (
        <div className="flex flex-col h-screen bg-[#f8fafc] overflow-hidden">
            {/* Header Bar - Basic Style */}
            <div className="h-16 border-b bg-white flex items-center justify-between px-6 z-20 shadow-sm">
                <div className="flex items-center space-x-4">
                    <Button variant="ghost" size="sm" onClick={() => window.history.back()}>
                        <ChevronLeft className="w-4 h-4 mr-1" /> Back
                    </Button>
                    <div className="h-6 w-px bg-gray-200"></div>
                    <div>
                        <h1 className="text-lg font-bold flex items-center">
                            <Layout className="w-5 h-5 mr-2 text-blue-600" />
                            Invoice Designer / مصمم الفواتير
                        </h1>
                        <p className="text-[10px] text-gray-400 font-medium uppercase tracking-wider">{selectedTemplate?.name}</p>
                    </div>
                </div>

                <div className="flex items-center space-x-3">
                    <Button variant="outline" size="sm" onClick={() => handleTemplateChange(selectedTemplate?.id || '')}>
                        <RotateCcw className="w-4 h-4 mr-2" /> Reset
                    </Button>
                    <Button size="sm" className="bg-blue-600 hover:bg-blue-700" onClick={handleSave} disabled={isSaving}>
                        {isSaving ? <RefreshCw className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                        {isSaving ? 'Speichere...' : 'حفظ التعديلات'}
                    </Button>
                </div>
            </div>

            <div className="flex flex-1 overflow-hidden relative">
                {/* Left Sidebar - Clean Basic Style */}
                <div className="w-80 border-r bg-white p-6 overflow-y-auto z-10 custom-scrollbar">
                    <Tabs defaultValue="style" className="w-full">
                        <TabsList className="grid w-full grid-cols-3 mb-6">
                            <TabsTrigger value="layout"><Move className="w-4 h-4 mr-1" /> Layout</TabsTrigger>
                            <TabsTrigger value="style"><Palette className="w-4 h-4 mr-1" /> Style</TabsTrigger>
                            <TabsTrigger value="code"><Code className="w-4 h-4 mr-1" /> HTML</TabsTrigger>
                        </TabsList>

                        <TabsContent value="layout" className="space-y-6">
                            <div className="space-y-2">
                                <Label className="text-xs font-bold text-gray-400 uppercase tracking-widest">Vorlage wählen</Label>
                                <Select value={selectedTemplate?.id} onValueChange={handleTemplateChange}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Vorlage wählen" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {templates.map(t => (
                                            <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <Separator />

                            <div className="space-y-3">
                                <Label className="text-xs font-bold text-gray-400 uppercase tracking-widest">Positionieren</Label>
                                <div className="grid grid-cols-1 gap-2">
                                    {elements.map(el => (
                                        <div
                                            key={el.id}
                                            className={`p-3 rounded-lg border cursor-pointer transition-all flex items-center justify-between ${selectedElementId === el.id ? 'border-blue-500 bg-blue-50' : 'hover:bg-gray-50'
                                                }`}
                                            onClick={() => setSelectedElementId(el.id)}
                                        >
                                            <span className="text-xs font-medium text-gray-700">{el.name}</span>
                                            <Move className={`w-3 h-3 ${selectedElementId === el.id ? 'text-blue-500' : 'text-gray-300'}`} />
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </TabsContent>

                        <TabsContent value="style" className="space-y-8">
                            {selectedElementId ? (
                                <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} className="space-y-6">
                                    <div className="p-4 bg-gray-50 rounded-lg border border-gray-100">
                                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Ausgewählt:</p>
                                        <p className="text-sm font-bold text-gray-900">{selectedElement?.name}</p>
                                    </div>

                                    <div className="space-y-4">
                                        <Label className="text-xs font-bold text-gray-400 uppercase tracking-widest">Farbe / Color</Label>
                                        <div className="flex items-center space-x-3">
                                            <Input
                                                type="color"
                                                value={selectedElement?.color || primaryColor}
                                                onChange={(e) => updateElementStyle(selectedElementId, { color: e.target.value })}
                                                className="h-10 w-10 p-1 cursor-pointer"
                                            />
                                            <Input
                                                type="text"
                                                value={selectedElement?.color || primaryColor}
                                                onChange={(e) => updateElementStyle(selectedElementId, { color: e.target.value })}
                                                className="font-mono text-xs uppercase"
                                            />
                                        </div>
                                    </div>

                                    {selectedElementId === 'logo' && (
                                        <div className="space-y-4">
                                            <Label className="text-xs font-bold text-gray-400 uppercase tracking-widest">Skalierung / Scale</Label>
                                            <Slider
                                                value={[selectedElement?.scale || 1]}
                                                min={0.5}
                                                max={2.5}
                                                step={0.1}
                                                onValueChange={([val]) => updateElementStyle('logo', { scale: val })}
                                            />
                                            <p className="text-center text-[10px] text-gray-400 font-bold">{selectedElement?.scale}x</p>
                                        </div>
                                    )}

                                    <Button variant="ghost" size="sm" className="w-full text-[10px] uppercase font-bold text-gray-400" onClick={() => setSelectedElementId(null)}>
                                        Auswahl aufheben
                                    </Button>
                                </motion.div>
                            ) : (
                                <div className="space-y-6">
                                    <div className="space-y-4">
                                        <Label className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">Hauptfarbe (Global)</Label>
                                        <div className="flex space-x-3">
                                            <Input
                                                type="color"
                                                value={primaryColor}
                                                onChange={(e) => setPrimaryColor(e.target.value)}
                                                className="h-12 w-12 p-1 cursor-pointer"
                                            />
                                            <Input
                                                type="text"
                                                value={primaryColor}
                                                onChange={(e) => setPrimaryColor(e.target.value)}
                                                className="font-mono text-sm uppercase"
                                            />
                                        </div>
                                    </div>
                                    <div className="p-4 bg-blue-50/50 rounded-lg text-center border border-blue-50">
                                        <p className="text-[11px] text-blue-600 font-medium">
                                            Klicke auf ein Element auf dem Blatt, um es individuell zu gestalten.
                                        </p>
                                    </div>
                                </div>
                            )}
                        </TabsContent>
                        <TabsContent value="code" className="space-y-4">
                            <div className="space-y-4 flex flex-col h-full">
                                <div className="flex items-center justify-between">
                                    <Label className="text-xs font-bold text-gray-400 uppercase tracking-widest">HTML Template Code</Label>
                                    <Button
                                        variant="outline"
                                        size="xs"
                                        className="h-7 text-[10px] bg-blue-50 text-blue-600 border-blue-100 hover:bg-blue-100"
                                        onClick={() => {
                                            if (confirm('هل تريد استعادة الكود الأصلي؟ سيتم مسح التعديلات الحالية.')) {
                                                setCustomHtml(DEFAULT_HTML_TEMPLATE.trim())
                                            }
                                        }}
                                    >
                                        <RotateCcw className="w-3 h-3 mr-1" /> Restore Default
                                    </Button>
                                </div>

                                <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                                    <p className="text-[10px] text-slate-600 font-bold mb-2 uppercase tracking-tight">المتغيرات المتاحة (Variables):</p>
                                    <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-[9px] font-mono text-blue-700 bg-white p-2 rounded border border-slate-100">
                                        <div>{"{{number}}"} - رقم الفاتورة</div>
                                        <div>{"{{date}}"} - تاريخ اليوم</div>
                                        <div>{"{{customer_name}}"} - اسم العميل</div>
                                        <div>{"{{total}}"} - المجموع الكلي</div>
                                        <div>{"{{items_table}}"} - جدول المواد</div>
                                        <div>{"{{logo_name}}"} - اسم الشعار</div>
                                        <div>{"{{tax_id}}"} - رقم الضريبة</div>
                                        <div>{"{{bank_name}}"} - اسم البنك</div>
                                    </div>
                                </div>

                                <Textarea
                                    value={customHtml}
                                    onChange={(e) => setCustomHtml(e.target.value)}
                                    placeholder="<div class='invoice'>...</div>"
                                    className="min-h-[500px] flex-1 font-mono text-[11px] bg-[#1e293b] text-emerald-400 p-5 leading-relaxed custom-scrollbar border-none shadow-inner rounded-xl focus-visible:ring-1 focus-visible:ring-emerald-500/30"
                                />

                                <div className="p-3 bg-amber-50 rounded-xl border border-amber-100">
                                    <div className="flex items-start">
                                        <div className="p-1 bg-amber-100 rounded mr-2 mt-0.5">
                                            <Code className="w-3 h-3 text-amber-700" />
                                        </div>
                                        <p className="text-[10px] text-amber-800 leading-relaxed font-medium">
                                            <strong>ملاحظة هامة:</strong> عند حفظ كود HTML، سيتم استخدامه في طباعة الـ PDF بدلاً من التصميم المرئي. يمكنك استخدام CSS كامل داخل وسم &lt;style&gt;.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </TabsContent>
                    </Tabs>
                </div>

                {/* Center - Visual Designer Surface - Paper Style */}
                <div className="flex-1 bg-gray-200/40 p-12 flex justify-center items-start overflow-auto custom-scrollbar">
                    <DndContext
                        sensors={sensors}
                        collisionDetection={closestCenter}
                        onDragEnd={handleDragEnd}
                    >
                        <motion.div
                            layout
                            className="bg-white shadow-xl relative flex-shrink-0"
                            style={{
                                width: '210mm',
                                height: '297mm',
                                minWidth: '210mm',
                                minHeight: '297mm'
                            }}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            onClick={() => setSelectedElementId(null)}
                        >
                            {/* Paper Margins */}
                            <div className="absolute inset-[20mm] border border-blue-500/5 border-dashed pointer-events-none"></div>

                            <SortableContext items={elements.map(e => e.id)} strategy={verticalListSortingStrategy}>
                                {elements.map(el => (
                                    <DraggableElement
                                        key={el.id}
                                        element={el}
                                        isSelected={selectedElementId === el.id}
                                        onClick={() => setSelectedElementId(el.id)}
                                        primaryColor={primaryColor}
                                    />
                                ))}
                            </SortableContext>
                        </motion.div>
                    </DndContext>
                </div>
            </div>

            <style jsx global>{`
                .custom-scrollbar::-webkit-scrollbar {
                    width: 4px;
                }
                .custom-scrollbar::-webkit-scrollbar-track {
                    background: transparent;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb {
                    background: #cbd5e1;
                    border-radius: 10px;
                }
            `}</style>
        </div>
    )
}
