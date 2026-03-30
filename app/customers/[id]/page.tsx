'use client'

import { HeaderNavIcons } from '@/components/navigation/header-nav-icons'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import {
    ArrowLeft,
    Mail,
    Phone,
    MapPin,
    FileText,
    CreditCard,
    Key,
    MessageSquare,
    StickyNote,
    Plus,
    Download,
    ExternalLink,
    Clock,
    CheckCircle,
    AlertCircle,
    XCircle,
    User,
    MoreHorizontal,
    Building2,
    Tag,
    Truck
} from 'lucide-react'
import { useAuthenticatedFetch } from '@/lib/api-client'
import { format } from 'date-fns'
import { de } from 'date-fns/locale'

export default function CustomerProfilePage({ params }: { params: { id: string } }) {
    const router = useRouter()
    const authenticatedFetch = useAuthenticatedFetch()
    const [customer, setCustomer] = useState<any>(null)
    const [loading, setLoading] = useState(true)
    const [activeTab, setActiveTab] = useState('overview')

    useEffect(() => {
        fetchCustomer()
    }, [params.id])

    const fetchCustomer = async () => {
        try {
            const response = await authenticatedFetch(`/api/customers/${params.id}`)
            if (response.ok) {
                const data = await response.json()
                setCustomer(data)
            } else {
                console.error('Failed to fetch customer')
            }
        } catch (error) {
            console.error('Error fetching customer:', error)
        } finally {
            setLoading(false)
        }
    }

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
        )
    }

    if (!customer) {
        return (
            <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">Kunde nicht gefunden</h2>
                <Button onClick={() => router.push('/customers')}>Zurück zur Übersicht</Button>
            </div>
        )
    }

    // Helper functions
    const formatCurrency = (amount: number, currency: string = 'EUR') => {
        return new Intl.NumberFormat('de-DE', { style: 'currency', currency }).format(amount)
    }

    const formatDate = (dateString: string) => {
        if (!dateString) return '-'
        return format(new Date(dateString), 'dd.MM.yyyy HH:mm', { locale: de })
    }

    const getInvoiceStatusBadge = (status: string) => {
        switch (status?.toUpperCase()) {
            case 'PAID':
            case 'BEZAHLT':
            case 'COMPLETED':
                return <Badge className="bg-green-100 text-green-800 hover:bg-green-100">Bezahlt</Badge>
            case 'OPEN':
            case 'OFFEN':
            case 'PENDING':
                return <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100">Offen</Badge>
            case 'OVERDUE':
            case 'ÜBERFÄLLIG':
                return <Badge className="bg-red-100 text-red-800 hover:bg-red-100">Überfällig</Badge>
            case 'CANCELLED':
            case 'STORNIERT':
                return <Badge className="bg-gray-100 text-gray-800 hover:bg-gray-100">Storniert</Badge>
            default:
                return <Badge variant="outline">{status}</Badge>
        }
    }

    const getCustomerStatusBadge = (status: string) => {
        switch (status) {
            case 'ACTIVE': return <Badge className="bg-green-100 text-green-800 hover:bg-green-200 border-green-200">Aktiv</Badge>
            case 'INACTIVE': return <Badge className="bg-gray-100 text-gray-800 hover:bg-gray-200 border-gray-200">Inaktiv</Badge>
            case 'VIP': return <Badge className="bg-purple-100 text-purple-800 hover:bg-purple-200 border-purple-200">VIP</Badge>
            case 'NEW': return <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-200 border-yellow-200">Neu</Badge>
            default: return null
        }
    }

    // Calculate stats
    const totalInvoices = customer.invoices?.length || 0
    const totalPayments = customer.payments?.reduce((sum: number, p: any) => sum + Number(p.amount), 0) || 0
    const lastInvoice = customer.invoices?.[0]
    const lastKey = customer.licenseKeys?.[0]
    const openTickets = customer.supportTickets?.filter((t: any) => t.status === 'OPEN').length || 0

    return (
        <div className="min-h-screen bg-gray-50 pb-12">
            {/* Header */}
            <header className="bg-white shadow-sm border-b sticky top-0 z-10 backdrop-blur-xl bg-white/80">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center py-4">
                        <div className="flex items-center gap-4">
                            <HeaderNavIcons />
                            <div>
                                <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                                    {customer.name}
                                    {getCustomerStatusBadge(customer.status)}
                                </h1>
                                <div className="flex items-center text-sm text-gray-500 mt-1 gap-4">
                                    <span className="flex items-center gap-1">
                                        <User className="w-3 h-3" /> ID: {customer.id.substring(0, 8)}...
                                    </span>
                                    <span className="flex items-center gap-1">
                                        <Clock className="w-3 h-3" /> Kunde seit {format(new Date(customer.createdAt), 'dd.MM.yyyy')}
                                    </span>
                                    {customer.type === 'BUSINESS' && (
                                        <span className="flex items-center gap-1 text-blue-600">
                                            <Building2 className="w-3 h-3" /> Geschäftskunde
                                        </span>
                                    )}
                                </div>
                            </div>
                        </div>
                        <div className="flex gap-2">
                            <Button variant="outline">
                                <MoreHorizontal className="w-4 h-4 mr-2" />
                                Aktionen
                            </Button>
                            <Button>
                                <Plus className="w-4 h-4 mr-2" />
                                Neues Ticket
                            </Button>
                        </div>
                    </div>
                </div>
            </header>

            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Sidebar Info */}
                    <div className="space-y-6">
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-lg">Kundendaten</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                {customer.tags && customer.tags.length > 0 && (
                                    <div className="flex flex-wrap gap-2 pb-4 border-b">
                                        {customer.tags.map((tag: string, i: number) => (
                                            <Badge key={i} variant="secondary" className="text-xs">
                                                <Tag className="w-3 h-3 mr-1" /> {tag}
                                            </Badge>
                                        ))}
                                    </div>
                                )}

                                <div className="flex items-start gap-3">
                                    <Mail className="w-5 h-5 text-gray-400 mt-0.5" />
                                    <div>
                                        <p className="text-sm font-medium text-gray-900">E-Mail</p>
                                        <a href={`mailto:${customer.email}`} className="text-sm text-blue-600 hover:underline">{customer.email}</a>
                                    </div>
                                </div>

                                <div className="flex items-start gap-3">
                                    <Phone className="w-5 h-5 text-gray-400 mt-0.5" />
                                    <div>
                                        <p className="text-sm font-medium text-gray-900">Telefon</p>
                                        <p className="text-sm text-gray-600">{customer.phone || '-'}</p>
                                    </div>
                                </div>

                                <div className="flex items-start gap-3">
                                    <MapPin className="w-5 h-5 text-gray-400 mt-0.5" />
                                    <div>
                                        <p className="text-sm font-medium text-gray-900">Rechnungsadresse</p>
                                        <p className="text-sm text-gray-600">
                                            {customer.address}<br />
                                            {customer.zipCode} {customer.city}<br />
                                            {customer.country}
                                        </p>
                                    </div>
                                </div>

                                {customer.deliveryAddress && (
                                    <div className="flex items-start gap-3 pt-2 border-t mt-2">
                                        <Truck className="w-5 h-5 text-gray-400 mt-0.5" />
                                        <div>
                                            <p className="text-sm font-medium text-gray-900">Lieferadresse</p>
                                            <p className="text-sm text-gray-600">
                                                {customer.deliveryAddress}<br />
                                                {customer.deliveryZip} {customer.deliveryCity}<br />
                                                {customer.deliveryCountry}
                                            </p>
                                        </div>
                                    </div>
                                )}

                                {customer.taxId && (
                                    <div className="flex items-start gap-3 pt-2 border-t mt-2">
                                        <FileText className="w-5 h-5 text-gray-400 mt-0.5" />
                                        <div>
                                            <p className="text-sm font-medium text-gray-900">Steuer-ID / USt-ID</p>
                                            <p className="text-sm text-gray-600">{customer.taxId}</p>
                                        </div>
                                    </div>
                                )}
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle className="text-lg">Statistik</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="flex justify-between items-center">
                                    <span className="text-sm text-gray-600">Rechnungen</span>
                                    <span className="font-medium">{totalInvoices}</span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-sm text-gray-600">Gesamtzahlungen (LTV)</span>
                                    <span className="font-medium text-green-600">{formatCurrency(customer.ltv || totalPayments)}</span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-sm text-gray-600">Durchschn. Bestellung</span>
                                    <span className="font-medium text-blue-600">{formatCurrency(customer.aov || 0)}</span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-sm text-gray-600">Offene Tickets</span>
                                    <Badge variant={openTickets > 0 ? "destructive" : "secondary"}>{openTickets}</Badge>
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Main Content Tabs */}
                    <div className="lg:col-span-2">
                        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                            <TabsList className="grid w-full grid-cols-5 mb-8">
                                <TabsTrigger value="overview">Übersicht</TabsTrigger>
                                <TabsTrigger value="invoices">Rechnungen</TabsTrigger>
                                <TabsTrigger value="keys">Keys</TabsTrigger>
                                <TabsTrigger value="support">Support</TabsTrigger>
                                <TabsTrigger value="notes">Notizen</TabsTrigger>
                            </TabsList>

                            {/* OVERVIEW TAB */}
                            <TabsContent value="overview" className="space-y-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <Card>
                                        <CardHeader className="pb-2">
                                            <CardTitle className="text-sm font-medium text-gray-500">Letzte Rechnung</CardTitle>
                                        </CardHeader>
                                        <CardContent>
                                            {lastInvoice ? (
                                                <div>
                                                    <div className="text-2xl font-bold">{formatCurrency(Number(lastInvoice.totalGross), lastInvoice.currency)}</div>
                                                    <p className="text-xs text-gray-500 mt-1">
                                                        {lastInvoice.invoiceNumber} • {format(new Date(lastInvoice.issueDate), 'dd.MM.yyyy')}
                                                    </p>
                                                </div>
                                            ) : (
                                                <p className="text-sm text-gray-500">Keine Rechnungen</p>
                                            )}
                                        </CardContent>
                                    </Card>

                                    <Card>
                                        <CardHeader className="pb-2">
                                            <CardTitle className="text-sm font-medium text-gray-500">Letzter Key</CardTitle>
                                        </CardHeader>
                                        <CardContent>
                                            {lastKey ? (
                                                <div>
                                                    <div className="text-lg font-bold truncate">{lastKey.digitalProduct?.title || 'Produkt'}</div>
                                                    <p className="text-xs text-gray-500 mt-1">
                                                        Versendet am {format(new Date(lastKey.createdAt), 'dd.MM.yyyy')}
                                                    </p>
                                                </div>
                                            ) : (
                                                <p className="text-sm text-gray-500">Keine Keys</p>
                                            )}
                                        </CardContent>
                                    </Card>
                                </div>

                                <Card>
                                    <CardHeader>
                                        <CardTitle>Letzte Aktivitäten</CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="space-y-4">
                                            {/* Combine and sort recent activities could go here */}
                                            <p className="text-sm text-gray-500 italic">Aktivitäten-Feed wird geladen...</p>
                                        </div>
                                    </CardContent>
                                </Card>
                            </TabsContent>

                            {/* INVOICES TAB */}
                            <TabsContent value="invoices">
                                <Card>
                                    <CardHeader>
                                        <CardTitle>Rechnungen & Zahlungen</CardTitle>
                                        <CardDescription>Alle Rechnungen und zugehörige Zahlungen dieses Kunden</CardDescription>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="space-y-4">
                                            {customer.invoices?.map((invoice: any) => (
                                                <div key={invoice.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors">
                                                    <div className="flex items-center gap-4">
                                                        <div className="bg-blue-100 p-2 rounded-lg">
                                                            <FileText className="w-5 h-5 text-blue-600" />
                                                        </div>
                                                        <div>
                                                            <p className="font-medium text-gray-900">{invoice.invoiceNumber}</p>
                                                            <p className="text-sm text-gray-500">{formatDate(invoice.issueDate)}</p>
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center gap-6">
                                                        <div className="text-right">
                                                            <p className="font-medium text-gray-900">{formatCurrency(Number(invoice.totalGross), invoice.currency)}</p>
                                                            {getInvoiceStatusBadge(invoice.status)}
                                                        </div>
                                                        <Button variant="ghost" size="sm">
                                                            <Download className="w-4 h-4" />
                                                        </Button>
                                                    </div>
                                                </div>
                                            ))}
                                            {(!customer.invoices || customer.invoices.length === 0) && (
                                                <div className="text-center py-8 text-gray-500">Keine Rechnungen vorhanden</div>
                                            )}
                                        </div>
                                    </CardContent>
                                </Card>
                            </TabsContent>

                            {/* KEYS TAB */}
                            <TabsContent value="keys">
                                <Card>
                                    <CardHeader>
                                        <CardTitle>Digitale Produktschlüssel</CardTitle>
                                        <CardDescription>Versendete Lizenzen und Keys</CardDescription>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="space-y-4">
                                            {customer.licenseKeys?.map((key: any) => (
                                                <div key={key.id} className="flex items-center justify-between p-4 border rounded-lg">
                                                    <div className="flex items-center gap-4">
                                                        <div className="bg-purple-100 p-2 rounded-lg">
                                                            <Key className="w-5 h-5 text-purple-600" />
                                                        </div>
                                                        <div>
                                                            <p className="font-medium text-gray-900">{key.digitalProduct?.title || 'Unbekanntes Produkt'}</p>
                                                            <p className="text-sm font-mono text-gray-600 mt-1">
                                                                {key.key.length > 10
                                                                    ? `${key.key.substring(0, 5)}...${key.key.substring(key.key.length - 5)}`
                                                                    : key.key}
                                                            </p>
                                                        </div>
                                                    </div>
                                                    <div className="text-right">
                                                        <Badge variant={key.isUsed ? "secondary" : "default"}>
                                                            {key.isUsed ? "Genutzt" : "Aktiv"}
                                                        </Badge>
                                                        <p className="text-xs text-gray-500 mt-1">{formatDate(key.createdAt)}</p>
                                                    </div>
                                                </div>
                                            ))}
                                            {(!customer.licenseKeys || customer.licenseKeys.length === 0) && (
                                                <div className="text-center py-8 text-gray-500">Keine Keys vorhanden</div>
                                            )}
                                        </div>
                                    </CardContent>
                                </Card>
                            </TabsContent>

                            {/* SUPPORT TAB */}
                            <TabsContent value="support">
                                <Card>
                                    <CardHeader className="flex flex-row items-center justify-between">
                                        <div>
                                            <CardTitle>Support & Kommunikation</CardTitle>
                                            <CardDescription>Tickets und E-Mails</CardDescription>
                                        </div>
                                        <Button size="sm">
                                            <Plus className="w-4 h-4 mr-2" />
                                            Neues Ticket
                                        </Button>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="space-y-6">
                                            {/* Tickets List */}
                                            <div className="space-y-4">
                                                {customer.supportTickets?.map((ticket: any) => (
                                                    <div key={ticket.id} className="border rounded-lg p-4 cursor-pointer hover:border-blue-300 transition-colors">
                                                        <div className="flex justify-between items-start mb-2">
                                                            <div className="flex items-center gap-2">
                                                                <Badge variant="outline">#{ticket.id.substring(0, 6)}</Badge>
                                                                <h3 className="font-medium text-gray-900">{ticket.subject || 'Kein Betreff'}</h3>
                                                            </div>
                                                            <Badge className={ticket.status === 'OPEN' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}>
                                                                {ticket.status}
                                                            </Badge>
                                                        </div>
                                                        <p className="text-sm text-gray-600 line-clamp-2 mb-3">
                                                            {ticket.messages?.[0]?.content || 'Keine Nachrichtenvorschau'}
                                                        </p>
                                                        <div className="flex items-center text-xs text-gray-500 gap-4">
                                                            <span className="flex items-center gap-1">
                                                                <Clock className="w-3 h-3" /> {formatDate(ticket.createdAt)}
                                                            </span>
                                                            <span className="flex items-center gap-1">
                                                                <MessageSquare className="w-3 h-3" /> {ticket.messages?.length || 0} Nachrichten
                                                            </span>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>

                                            {/* Emails List (Gmail Integration Mock) */}
                                            {customer.emails && customer.emails.length > 0 && (
                                                <div className="mt-8">
                                                    <h3 className="text-sm font-medium text-gray-500 mb-4 uppercase tracking-wider">E-Mails (Gmail)</h3>
                                                    <div className="space-y-4">
                                                        {customer.emails.map((email: any) => (
                                                            <div key={email.id} className="flex gap-4 p-4 bg-gray-50 rounded-lg">
                                                                <div className="bg-white p-2 rounded-full h-fit border">
                                                                    <Mail className="w-4 h-4 text-gray-600" />
                                                                </div>
                                                                <div className="flex-1">
                                                                    <div className="flex justify-between items-start">
                                                                        <h4 className="font-medium text-gray-900">{email.subject}</h4>
                                                                        <span className="text-xs text-gray-500">{formatDate(email.receivedAt)}</span>
                                                                    </div>
                                                                    <p className="text-sm text-gray-600 mt-1">{email.snippet || email.content.substring(0, 100)}...</p>
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}

                                            {(!customer.supportTickets?.length && !customer.emails?.length) && (
                                                <div className="text-center py-8 text-gray-500">Keine Kommunikation vorhanden</div>
                                            )}
                                        </div>
                                    </CardContent>
                                </Card>
                            </TabsContent>

                            {/* NOTES TAB */}
                            <TabsContent value="notes">
                                <Card>
                                    <CardHeader className="flex flex-row items-center justify-between">
                                        <div>
                                            <CardTitle>Interne Notizen</CardTitle>
                                            <CardDescription>Nur für das Team sichtbar</CardDescription>
                                        </div>
                                        <Button size="sm" variant="outline">
                                            <Plus className="w-4 h-4 mr-2" />
                                            Notiz hinzufügen
                                        </Button>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="space-y-4">
                                            {customer.notes?.map((note: any) => (
                                                <div key={note.id} className="bg-yellow-50 border border-yellow-100 p-4 rounded-lg">
                                                    <p className="text-gray-800 whitespace-pre-wrap">{note.content}</p>
                                                    <div className="flex justify-between items-center mt-3 text-xs text-gray-500">
                                                        <span>{note.author}</span>
                                                        <span>{formatDate(note.createdAt)}</span>
                                                    </div>
                                                </div>
                                            ))}
                                            {(!customer.notes || customer.notes.length === 0) && (
                                                <div className="text-center py-8 text-gray-500">Keine Notizen vorhanden</div>
                                            )}
                                        </div>
                                    </CardContent>
                                </Card>
                            </TabsContent>
                        </Tabs>
                    </div>
                </div>
            </main>
        </div>
    )
}
