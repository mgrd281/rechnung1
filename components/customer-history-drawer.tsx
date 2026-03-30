import { X, Mail, Phone, MapPin, FileText, Calendar, CreditCard, ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { useEffect, useState } from 'react'

interface CustomerHistoryDrawerProps {
    isOpen: boolean
    onClose: () => void
    customerEmail: string | null
    allInvoices: any[]
    onInvoiceClick?: (invoiceId: string) => void
}

export function CustomerHistoryDrawer({
    isOpen,
    onClose,
    customerEmail,
    allInvoices,
    onInvoiceClick
}: CustomerHistoryDrawerProps) {
    const [isVisible, setIsVisible] = useState(false)

    useEffect(() => {
        if (isOpen) {
            setIsVisible(true)
            document.body.style.overflow = 'hidden'
        } else {
            const timer = setTimeout(() => setIsVisible(false), 300)
            document.body.style.overflow = 'unset'
            return () => clearTimeout(timer)
        }
    }, [isOpen])

    if (!isVisible && !isOpen) return null

    // Filter invoices for this customer
    const customerInvoices = allInvoices.filter(inv =>
        (inv.customerEmail || inv.customer?.email || '').toLowerCase() === (customerEmail || '').toLowerCase()
    ).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())

    if (customerInvoices.length === 0) return null

    const customer = {
        name: customerInvoices[0].customerName || customerInvoices[0].customer?.name || 'Unbekannter Kunde',
        email: customerEmail,
        address: customerInvoices[0].customerAddress || customerInvoices[0].customer?.address,
        city: customerInvoices[0].customerCity || customerInvoices[0].customer?.city,
        zip: customerInvoices[0].customerZip || customerInvoices[0].customer?.zipCode,
        country: customerInvoices[0].customerCountry || customerInvoices[0].customer?.country,
    }

    // Calculate stats
    const totalOrders = customerInvoices.length
    const totalSpent = customerInvoices.reduce((sum, inv) => {
        const amount = parseFloat(inv.amount?.replace(/[^0-9.-]+/g, '') || '0')
        return sum + (isNaN(amount) ? 0 : amount)
    }, 0)

    const paidOrders = customerInvoices.filter(inv => inv.status === 'Bezahlt').length
    const openOrders = customerInvoices.filter(inv => inv.status === 'Offen').length

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'Bezahlt': return 'bg-green-100 text-green-800 border-green-200'
            case 'Offen': return 'bg-yellow-100 text-yellow-800 border-yellow-200'
            case 'Überfällig': return 'bg-red-100 text-red-800 border-red-200'
            case 'Storniert': return 'bg-gray-100 text-gray-800 border-gray-200'
            case 'Gutschrift': return 'bg-blue-100 text-blue-800 border-blue-200'
            default: return 'bg-gray-100 text-gray-600 border-gray-200'
        }
    }

    return (
        <div className="fixed inset-0 z-50 flex justify-end">
            {/* Backdrop */}
            <div
                className={`fixed inset-0 bg-black/30 backdrop-blur-sm transition-opacity duration-300 ${isOpen ? 'opacity-100' : 'opacity-0'
                    }`}
                onClick={onClose}
            />

            {/* Drawer Panel */}
            <div
                className={`relative w-full max-w-md bg-white shadow-2xl transform transition-transform duration-300 ease-in-out h-full flex flex-col ${isOpen ? 'translate-x-0' : 'translate-x-full'
                    }`}
            >
                {/* Header */}
                <div className="p-6 border-b bg-gray-50/50">
                    <div className="flex items-start justify-between mb-6">
                        <div className="flex items-center gap-4">
                            <div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold text-xl">
                                {customer.name.charAt(0).toUpperCase()}
                            </div>
                            <div>
                                <h2 className="text-lg font-bold text-gray-900">{customer.name}</h2>
                                <div className="flex items-center text-sm text-gray-500 mt-1">
                                    <Mail className="h-3.5 w-3.5 mr-1.5" />
                                    {customer.email}
                                </div>
                            </div>
                        </div>
                        <Button variant="ghost" size="icon" onClick={onClose} className="rounded-full hover:bg-gray-200/50">
                            <X className="h-5 w-5 text-gray-500" />
                        </Button>
                    </div>

                    {/* Quick Stats Grid */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="bg-white p-3 rounded-lg border shadow-sm">
                            <div className="text-xs text-gray-500 font-medium mb-1">Gesamtumsatz</div>
                            <div className="text-lg font-bold text-gray-900">
                                {new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' }).format(totalSpent)}
                            </div>
                        </div>
                        <div className="bg-white p-3 rounded-lg border shadow-sm">
                            <div className="text-xs text-gray-500 font-medium mb-1">Bestellungen</div>
                            <div className="text-lg font-bold text-gray-900 flex items-baseline gap-2">
                                {totalOrders}
                                <span className="text-xs font-normal text-gray-500">
                                    ({paidOrders} bezahlt)
                                </span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Content - Scrollable List */}
                <div className="flex-1 overflow-y-auto p-6">
                    <h3 className="text-sm font-semibold text-gray-900 mb-4 flex items-center">
                        <FileText className="h-4 w-4 mr-2 text-blue-600" />
                        Bestellhistorie
                    </h3>

                    <div className="space-y-4">
                        {customerInvoices.map((invoice) => (
                            <div
                                key={invoice.id}
                                className="group bg-white border rounded-xl p-4 hover:shadow-md transition-all duration-200 cursor-pointer relative overflow-hidden"
                                onClick={() => onInvoiceClick && onInvoiceClick(invoice.id)}
                            >
                                <div className="absolute left-0 top-0 bottom-0 w-1 bg-transparent group-hover:bg-blue-500 transition-colors" />

                                <div className="flex justify-between items-start mb-3">
                                    <div>
                                        <div className="font-semibold text-gray-900 flex items-center gap-2">
                                            {invoice.number || invoice.invoiceNumber}
                                            {invoice.shopifyOrderNumber && (
                                                <span className="text-xs font-normal text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded">
                                                    Shopify: {invoice.shopifyOrderNumber}
                                                </span>
                                            )}
                                        </div>
                                        <div className="text-xs text-gray-500 mt-1 flex items-center">
                                            <Calendar className="h-3 w-3 mr-1" />
                                            {new Date(invoice.date).toLocaleDateString('de-DE', {
                                                year: 'numeric',
                                                month: 'long',
                                                day: 'numeric'
                                            })}
                                        </div>
                                    </div>
                                    <Badge variant="outline" className={`${getStatusColor(invoice.status)}`}>
                                        {invoice.status}
                                    </Badge>
                                </div>

                                <div className="flex justify-between items-end">
                                    <div className="text-sm text-gray-600">
                                        {invoice.items?.length || 0} Artikel
                                    </div>
                                    <div className="text-right">
                                        <div className="font-bold text-gray-900 text-lg">
                                            {invoice.amount}
                                        </div>
                                    </div>
                                </div>

                                {/* Hover Action Indicator */}
                                <div className="absolute right-4 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity transform translate-x-2 group-hover:translate-x-0">
                                    <Button size="icon" variant="ghost" className="rounded-full bg-blue-50 text-blue-600">
                                        <ArrowRight className="h-4 w-4" />
                                    </Button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Footer */}
                <div className="p-4 border-t bg-gray-50 text-xs text-center text-gray-500">
                    Kunde seit {new Date(customerInvoices[customerInvoices.length - 1].date).getFullYear()}
                </div>
            </div>
        </div>
    )
}
