'use client'

import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { ABANDONED_CART_TEMPLATES, getPersonalizedTemplate } from '@/lib/abandoned-cart-templates'
import { Mail, Percent, Clock, Send, Eye, Loader2 } from 'lucide-react'
import { useToast } from '@/components/ui/toast'

interface EmailComposerProps {
    isOpen: boolean
    onClose: () => void
    cart: any
    onSent: () => void
}

export function EmailComposer({ isOpen, onClose, cart, onSent }: EmailComposerProps) {
    const { showToast } = useToast()
    const [templateId, setTemplateId] = useState(ABANDONED_CART_TEMPLATES[0].id)
    const [discountValue, setDiscountValue] = useState(10)
    const [expiryHours, setExpiryHours] = useState(24)
    const [manualCouponCode, setManualCouponCode] = useState('')
    const [loading, setLoading] = useState(false)
    const [preview, setPreview] = useState<any>(null)

    // Update preview when template or variables change
    useEffect(() => {
        if (!cart) return

        const itemsList = Array.isArray(cart.lineItems)
            ? cart.lineItems.map((item: any) => `- ${item.quantity}x ${item.title}`).join('\n')
            : 'Ihre Artikel'

        const personalized = getPersonalizedTemplate(templateId, {
            customerName: cart.email.split('@')[0],
            shopName: 'Mein Shop', // Fallback
            itemsList,
            discountCode: manualCouponCode || 'RECOVERY-CODE',
            expiryTime: `${expiryHours} Stunden`,
            expiryHours: expiryHours.toString(),
            cartUrl: cart.cartUrl
        })
        setPreview(personalized)
    }, [templateId, discountValue, expiryHours, manualCouponCode, cart])

    const handleSend = async () => {
        setLoading(true)
        try {
            const response = await fetch('/api/abandoned-carts/send-email', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    cartId: cart.id,
                    templateId,
                    discountValue,
                    expiryHours,
                    manualCouponCode
                })
            })

            if (response.ok) {
                showToast(`Die Recovery-E-Mail wurde erfolgreich an ${cart.email} verschickt.`, 'success')
                onSent()
                onClose()
            } else {
                throw new Error('Fehler beim Senden')
            }
        } catch (error) {
            showToast('Die E-Mail konnte nicht gesendet werden.', 'error')
        } finally {
            setLoading(false)
        }
    }

    if (!cart) return null

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Mail className="w-5 h-5 text-black" />
                        Recovery E-Mail senden
                    </DialogTitle>
                    <DialogDescription>
                        Senden Sie eine personalisierte E-Mail an {cart.email}, um den Warenkorb zu retten.
                    </DialogDescription>
                </DialogHeader>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-4">
                    {/* Settings Column */}
                    <div className="space-y-6">
                        <div className="space-y-2">
                            <Label>E-Mail Template wählen</Label>
                            <Select value={templateId} onValueChange={setTemplateId}>
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    {ABANDONED_CART_TEMPLATES.map(t => (
                                        <SelectItem key={t.id} value={t.id}>
                                            {t.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            <p className="text-xs text-gray-500 italic">
                                {ABANDONED_CART_TEMPLATES.find(t => t.id === templateId)?.description}
                            </p>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label className="flex items-center gap-1">
                                    <Percent className="w-3 h-3" /> Rabatt (%)
                                </Label>
                                <Input
                                    type="number"
                                    value={discountValue}
                                    onChange={(e) => setDiscountValue(Number(e.target.value))}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label className="flex items-center gap-1">
                                    <Clock className="w-3 h-3" /> Gültigkeit (Std.)
                                </Label>
                                <Input
                                    type="number"
                                    value={expiryHours}
                                    onChange={(e) => setExpiryHours(Number(e.target.value))}
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label className="flex items-center gap-1 text-black font-semibold">
                                <Percent className="w-3 h-3" /> Manueller Gutscheincode (Optional)
                            </Label>
                            <Input
                                placeholder="z.B. SAVE10"
                                value={manualCouponCode}
                                onChange={(e) => setManualCouponCode(e.target.value.toUpperCase())}
                                className="border-gray-200 focus:ring-black"
                            />
                            <p className="text-[10px] text-gray-500">
                                Falls leer, wird automatisch ein Code in Shopify erstellt.
                            </p>
                        </div>

                        <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
                            <h4 className="text-sm font-semibold text-blue-900 mb-1">Hinweis</h4>
                            <p className="text-xs text-blue-700">
                                Wenn Sie einen Rabatt angeben, wird automatisch ein einmaliger Shopify-Coupon erstellt und in die E-Mail eingefügt.
                            </p>
                        </div>
                    </div>

                    {/* Preview Column */}
                    <div className="bg-gray-50 p-6 rounded-lg border border-gray-200 flex flex-col h-[500px]">
                        <div className="flex items-center justify-between mb-4">
                            <h4 className="text-sm font-bold text-gray-700 flex items-center gap-2">
                                <Eye className="w-4 h-4" /> Vorschau
                            </h4>
                            <span className="text-[10px] uppercase font-bold text-gray-400">Marketing-Ansicht</span>
                        </div>

                        {preview && (
                            <div className="flex-1 bg-white p-4 rounded border shadow-sm overflow-y-auto text-sm">
                                <div className="mb-4 pb-2 border-b">
                                    <span className="text-gray-400">Betreff:</span> <span className="font-medium text-gray-800">{preview.subject}</span>
                                </div>
                                {templateId === 'professional-marketing' ? (
                                    <div className="space-y-4">
                                        <div className="text-gray-600 leading-relaxed italic border-l-2 border-black pl-3 py-1">
                                            {preview.body.split('[CartItemsHTML]')[0]}
                                        </div>

                                        {/* Premium Product Cards Preview */}
                                        <div className="space-y-3">
                                            {(cart.lineItems as any[] || []).slice(0, 3).map((item, idx) => {
                                                const originalPrice = parseFloat(item.price) || 0;
                                                const discountedPrice = originalPrice * ((100 - discountValue) / 100);
                                                const saved = originalPrice - discountedPrice;
                                                return (
                                                    <div key={idx} className="flex gap-4 p-4 border border-gray-100 rounded-xl bg-white shadow-sm">
                                                        <div className="w-16 h-16 bg-gray-50 border border-gray-100 rounded-lg overflow-hidden flex-shrink-0">
                                                            <img
                                                                src={item.image?.src || 'https://via.placeholder.com/64?text=Product'}
                                                                alt={item.title}
                                                                className="w-full h-full object-cover"
                                                            />
                                                        </div>
                                                        <div className="flex-1 min-w-0">
                                                            <div className="font-bold text-gray-900 truncate text-sm">{item.title}</div>
                                                            <div className="text-[10px] text-gray-400">Menge: {item.quantity}</div>
                                                            <div className="mt-1 flex flex-col">
                                                                <div className="flex items-center gap-2">
                                                                    <span className="text-[10px] text-gray-400 line-through">{originalPrice.toFixed(2)} {cart.currency}</span>
                                                                    <span className="text-sm font-black text-black">{discountedPrice.toFixed(2)} {cart.currency}</span>
                                                                </div>
                                                                <span className="text-[10px] text-[#C62828] font-bold">Sie sparen {saved.toFixed(2)} {cart.currency}</span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>

                                        <div className="text-gray-600 leading-relaxed italic border-l-2 border-black pl-3 py-1">
                                            {preview.body.split('[CartItemsHTML]')[1]}
                                        </div>

                                        {/* Premium Discount Section Preview */}
                                        <div className="bg-white border-2 border-black p-5 rounded-xl text-center relative overflow-hidden shadow-md">
                                            <div className="absolute top-0 left-0 w-full h-1 bg-[#C9A24D]"></div>
                                            <div className="text-[9px] text-gray-500 uppercase font-black tracking-[0.2em] mb-2">Nur für kurze Zeit</div>
                                            <div className="text-3xl font-black text-black tracking-widest">{manualCouponCode || 'RECOVERY-CODE'}</div>
                                            <div className="text-[10px] text-gray-400 mt-2">Gültig für {expiryHours} Stunden</div>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="whitespace-pre-wrap text-gray-600 leading-relaxed font-serif">
                                        {preview.body}
                                    </div>
                                )}

                                <div className="mt-8 flex flex-col items-center gap-3">
                                    <Button variant="secondary" className="bg-black text-white hover:bg-gray-800 w-full max-w-xs h-14 text-base font-black shadow-xl rounded-lg uppercase tracking-wider">
                                        {preview.cta}
                                    </Button>
                                    <div className="text-[10px] text-gray-400 flex flex-col items-center gap-1 mt-6 font-medium">
                                        <span>Vielen Dank für Ihr Vertrauen in <strong>Karinex</strong>.</span>
                                        <span>© 2026 Karinex.</span>
                                        <div className="flex gap-3 mt-2 uppercase tracking-tighter font-bold">
                                            <span>✓ Rückgabe</span>
                                            <span>✓ Sicher bezahlen</span>
                                            <span>✓ Support</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                <DialogFooter className="mt-8 border-t pt-4">
                    <Button variant="ghost" onClick={onClose} disabled={loading}>
                        Abbrechen
                    </Button>
                    <Button
                        onClick={handleSend}
                        disabled={loading}
                        className="bg-black hover:bg-gray-800 text-white w-32 font-bold"
                    >
                        {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4 mr-2" />}
                        Senden
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
