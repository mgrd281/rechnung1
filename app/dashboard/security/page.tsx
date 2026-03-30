'use client'

import { PageHeader } from '@/components/layout/page-header'
import { HeaderNavIcons } from '@/components/navigation/header-nav-icons'
import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
    Shield,
    ShieldAlert,
    ShieldBan,
    Trash2,
    Plus,
    Search,
    Lock,
    AlertCircle,
    KeyRound,
    Globe,
    Activity,
    SlidersHorizontal,
    FileText,
    Download,
    ShieldX
} from 'lucide-react'
import { useAuthenticatedFetch } from '@/lib/api-client'
import { format } from 'date-fns'
import { de } from 'date-fns/locale'
import { useToast } from '@/components/ui/use-toast'

interface BlockedIp {
    id: string
    ipAddress: string
    reason: string | null
    createdAt: string
}

interface KPICardProps {
    icon: React.ReactNode
    label: string
    value: string | number
    trend?: string
    bgColor: string
    iconColor: string
}

function KPICard({ icon, label, value, trend, bgColor, iconColor }: KPICardProps) {
    return (
        <Card className="shadow-sm border-none">
            <CardContent className="p-4">
                <div className="flex items-center justify-between">
                    <div className="flex-1">
                        <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">{label}</p>
                        <p className="text-2xl font-bold text-gray-900 mt-1">{value}</p>
                        {trend && <p className="text-xs text-gray-400 mt-1">{trend}</p>}
                    </div>
                    <div className={`w-9 h-9 rounded-xl ${bgColor} flex items-center justify-center flex-shrink-0`}>
                        <div className={iconColor}>
                            {icon}
                        </div>
                    </div>
                </div>
            </CardContent>
        </Card>
    )
}

export default function SecurityPage() {
    const [blockedIps, setBlockedIps] = useState<BlockedIp[]>([])
    const [newIp, setNewIp] = useState('')
    const [newReason, setNewReason] = useState('')
    const [loading, setLoading] = useState(true)
    const [submitting, setSubmitting] = useState(false)
    const [searchTerm, setSearchTerm] = useState('')
    const [activeTab, setActiveTab] = useState('ip-blocks')
    const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)
    const [error, setError] = useState<string | null>(null)
    const { showToast } = useToast()

    const authenticatedFetch = useAuthenticatedFetch()

    const fetchBlockedIps = async () => {
        setLoading(true)
        try {
            const res = await authenticatedFetch('/api/security/blocked-ips')
            if (res.ok) {
                const data = await res.json()
                setBlockedIps(data.blockedIps)
            } else {
                const errorData = await res.json()
                showToast(errorData.error || "Sperrliste konnte nicht geladen werden", 'error')
            }
        } catch (e) {
            console.error("Failed to fetch blocked IPs", e)
            showToast("Verbindung zum Server fehlgeschlagen", 'error')
        } finally {
            setLoading(false)
        }
    }

    const validateIp = (ip: string): boolean => {
        // IPv4 validation
        const ipv4Regex = /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/
        // IPv6 validation (simplified)
        const ipv6Regex = /^(?:[0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}$/

        return ipv4Regex.test(ip) || ipv6Regex.test(ip)
    }

    const addIp = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!newIp.trim()) {
            setError('IP-Adresse ist erforderlich')
            return
        }

        if (!validateIp(newIp.trim())) {
            setError('Ungültige IP-Adresse. Bitte geben Sie eine gültige IPv4 oder IPv6 Adresse ein.')
            return
        }

        setError(null)
        setSubmitting(true)

        try {
            const res = await authenticatedFetch('/api/security/blocked-ips', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ipAddress: newIp.trim(), reason: newReason.trim() || null })
            })

            const data = await res.json()

            if (res.ok) {
                // Optimistic update
                setBlockedIps(prev => [data.blockedIp, ...prev])
                setNewIp('')
                setNewReason('')
                showToast(`IP ${newIp} wurde erfolgreich gesperrt`, 'success')
            } else {
                setError(data.error || 'Fehler beim Hinzufügen der Sperre')
                showToast(data.error || 'IP konnte nicht gesperrt werden', 'error')
            }
        } catch (e) {
            setError('Netzwerkfehler. Bitte versuchen Sie es erneut.')
            showToast("Verbindung zum Server fehlgeschlagen", 'error')
        } finally {
            setSubmitting(false)
        }
    }

    const removeIp = async (id: string, ipAddress: string) => {
        if (deleteConfirm !== id) {
            setDeleteConfirm(id)
            return
        }

        // Optimistic update
        setBlockedIps(prev => prev.filter(item => item.id !== id))
        setDeleteConfirm(null)

        try {
            const res = await authenticatedFetch(`/api/security/blocked-ips?id=${id}`, {
                method: 'DELETE'
            })

            if (res.ok) {
                showToast(`IP ${ipAddress} wurde entsperrt`, 'success')
            } else {
                // Revert on error
                fetchBlockedIps()
                const errorData = await res.json()
                showToast(errorData.error || 'Sperre konnte nicht entfernt werden', 'error')
            }
        } catch (e) {
            // Revert on error
            fetchBlockedIps()
            showToast("Verbindung zum Server fehlgeschlagen", 'error')
        }
    }

    useEffect(() => {
        fetchBlockedIps()
    }, [])

    const filteredIps = blockedIps.filter(item =>
        item.ipAddress.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (item.reason && item.reason.toLowerCase().includes(searchTerm.toLowerCase()))
    )

    return (
        <div className="min-h-screen bg-gray-50 p-8">
            <div className="max-w-7xl mx-auto">
                <div className="mb-6 flex items-center gap-4">
                    <HeaderNavIcons />
                </div>

                <PageHeader
                    title="Sicherheit & IP-Sperren"
                    subtitle="Enterprise‑Sicherheitsmonitoring & Zugriffskontrolle in Echtzeit."
                    actions={
                        <>
                            <div className="flex items-center gap-2 px-3 py-1.5 bg-emerald-100 text-emerald-700 rounded-full text-xs font-semibold">
                                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                Echtzeitschutz Aktiv
                            </div>
                            <Button variant="outline" size="sm" className="gap-2">
                                <Download className="w-4 h-4" />
                                Export
                            </Button>
                        </>
                    }
                />

                {/* KPI Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                    <KPICard
                        icon={<ShieldBan className="w-5 h-5" />}
                        label="Blockiert heute"
                        value="0"
                        trend="Keine Aktivität"
                        bgColor="bg-red-50"
                        iconColor="text-red-600"
                    />
                    <KPICard
                        icon={<KeyRound className="w-5 h-5" />}
                        label="Fehlgeschlagene Logins"
                        value="0"
                        trend="Letzte 24h"
                        bgColor="bg-amber-50"
                        iconColor="text-amber-600"
                    />
                    <KPICard
                        icon={<Lock className="w-5 h-5" />}
                        label="Aktive Sperren"
                        value={blockedIps.length}
                        bgColor="bg-blue-50"
                        iconColor="text-blue-600"
                    />
                    <KPICard
                        icon={<ShieldAlert className="w-5 h-5" />}
                        label="Risiko-Level"
                        value="Niedrig"
                        trend="Stabil"
                        bgColor="bg-emerald-50"
                        iconColor="text-emerald-600"
                    />
                </div>

                {/* Tabs */}
                <div className="mb-6 border-b border-gray-200">
                    <div className="flex gap-6">
                        {[
                            { id: 'ip-blocks', label: 'IP-Sperren', icon: Globe },
                            { id: 'live-events', label: 'Live-Events', icon: Activity },
                            { id: 'rules', label: 'Regeln', icon: SlidersHorizontal },
                            { id: 'audit', label: 'Audit-Log', icon: FileText }
                        ].map(tab => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`flex items-center gap-2 px-1 py-3 border-b-2 transition-colors ${activeTab === tab.id
                                    ? 'border-blue-600 text-blue-600'
                                    : 'border-transparent text-gray-500 hover:text-gray-700'
                                    }`}
                            >
                                <tab.icon className="w-4 h-4" />
                                <span className="text-sm font-medium">{tab.label}</span>
                            </button>
                        ))}
                    </div>
                </div>

                {/* IP Blocks Tab Content */}
                {activeTab === 'ip-blocks' && (
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        {/* Add IP Form */}
                        <div className="lg:col-span-1">
                            <Card className="shadow-sm border-gray-200">
                                <CardHeader>
                                    <CardTitle className="text-sm font-semibold uppercase tracking-wide flex items-center gap-2">
                                        <Lock className="w-4 h-4 text-red-500" /> Adresse Sperren
                                    </CardTitle>
                                    <CardDescription className="text-sm">
                                        Gesperrte IPs haben keinen Zugriff mehr auf Ihren Store.
                                    </CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <form onSubmit={addIp} className="space-y-4">
                                        <div className="space-y-2">
                                            <label className="text-xs font-medium text-gray-700">IP-Adresse</label>
                                            <Input
                                                placeholder="z.B. 192.168.1.1"
                                                value={newIp}
                                                onChange={(e) => {
                                                    setNewIp(e.target.value)
                                                    setError(null)
                                                }}
                                                className="font-mono text-sm"
                                                disabled={submitting}
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-xs font-medium text-gray-700">Grund (Optional)</label>
                                            <Input
                                                placeholder="z.B. Fraud Verdacht"
                                                value={newReason}
                                                onChange={(e) => setNewReason(e.target.value)}
                                                className="text-sm"
                                                disabled={submitting}
                                            />
                                        </div>

                                        {error && (
                                            <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                                                <p className="text-xs text-red-800 font-medium">{error}</p>
                                            </div>
                                        )}

                                        <Button
                                            type="submit"
                                            className="w-full bg-red-600 hover:bg-red-700 text-white font-semibold h-10"
                                            disabled={submitting}
                                        >
                                            {submitting ? (
                                                <>Wird gesperrt...</>
                                            ) : (
                                                <>
                                                    <Plus className="w-4 h-4 mr-2" /> IP sperren
                                                </>
                                            )}
                                        </Button>
                                    </form>

                                    <div className="mt-6 p-3 bg-amber-50 rounded-lg border border-amber-200">
                                        <div className="flex gap-2">
                                            <AlertCircle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
                                            <p className="text-xs text-amber-800 leading-relaxed">
                                                <strong>Vorsicht:</strong> Das Sperren einer IP-Adresse verhindert jegliche Interaktion des Nutzers mit Ihrem Store.
                                            </p>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>

                        {/* Blocklist Table */}
                        <div className="lg:col-span-2">
                            <Card className="shadow-sm border-gray-200 min-h-[500px]">
                                <CardHeader className="border-b bg-gray-50/50">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <CardTitle className="text-lg font-semibold">Aktive Sperrliste</CardTitle>
                                            <CardDescription className="text-sm">
                                                Aktuell sind {blockedIps.length} Adressen gesperrt.
                                            </CardDescription>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <div className="relative">
                                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                                <Input
                                                    placeholder="Suchen..."
                                                    className="pl-9 h-9 text-sm w-56 bg-white"
                                                    value={searchTerm}
                                                    onChange={(e) => setSearchTerm(e.target.value)}
                                                />
                                            </div>
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                disabled={filteredIps.length === 0}
                                                className="gap-2"
                                            >
                                                <ShieldX className="w-4 h-4" />
                                                Bulk Unblock
                                            </Button>
                                        </div>
                                    </div>
                                </CardHeader>
                                <CardContent className="p-0">
                                    <div className="divide-y divide-gray-100">
                                        {loading ? (
                                            <div className="p-20 text-center text-gray-400 text-sm">
                                                <div className="animate-spin w-8 h-8 border-4 border-gray-200 border-t-blue-600 rounded-full mx-auto mb-4" />
                                                Lade Sperrliste...
                                            </div>
                                        ) : filteredIps.length === 0 ? (
                                            <div className="p-20 text-center">
                                                <div className="bg-gray-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                                                    <Shield className="w-8 h-8 text-gray-300" />
                                                </div>
                                                <h3 className="text-gray-900 font-semibold text-lg">Keine Sperren</h3>
                                                <p className="text-gray-500 text-sm mt-1">
                                                    {searchTerm ? 'Keine Ergebnisse gefunden' : 'Es sind aktuell keine IP-Adressen gesperrt.'}
                                                </p>
                                            </div>
                                        ) : (
                                            filteredIps.map((item) => (
                                                <div key={item.id} className="p-4 hover:bg-gray-50/50 transition-all flex items-center justify-between">
                                                    <div className="flex items-center gap-4">
                                                        <div className="w-10 h-10 rounded-lg bg-red-50 flex items-center justify-center text-red-600">
                                                            <ShieldAlert className="w-5 h-5" />
                                                        </div>
                                                        <div>
                                                            <p className="text-sm font-semibold text-gray-900 font-mono">{item.ipAddress}</p>
                                                            <div className="flex items-center gap-3 mt-0.5">
                                                                <span className="text-xs text-gray-500">
                                                                    {format(new Date(item.createdAt), 'dd. MMM yyyy, HH:mm', { locale: de })} Uhr
                                                                </span>
                                                                {item.reason && (
                                                                    <>
                                                                        <span className="text-gray-300">•</span>
                                                                        <span className="text-xs text-red-600 font-medium">{item.reason}</span>
                                                                    </>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <Button
                                                        variant={deleteConfirm === item.id ? "destructive" : "ghost"}
                                                        size="sm"
                                                        className={deleteConfirm === item.id ? "" : "text-gray-400 hover:text-red-600 hover:bg-red-50"}
                                                        onClick={() => removeIp(item.id, item.ipAddress)}
                                                        onBlur={() => setDeleteConfirm(null)}
                                                    >
                                                        {deleteConfirm === item.id ? (
                                                            <>Bestätigen</>
                                                        ) : (
                                                            <Trash2 className="w-4 h-4" />
                                                        )}
                                                    </Button>
                                                </div>
                                            ))
                                        )}
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    </div>
                )}

                {/* Placeholder for other tabs */}
                {activeTab !== 'ip-blocks' && (
                    <Card className="shadow-sm border-gray-200">
                        <CardContent className="p-20 text-center">
                            <div className="bg-gray-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                                <Activity className="w-8 h-8 text-gray-300" />
                            </div>
                            <h3 className="text-gray-900 font-semibold text-lg">In Entwicklung</h3>
                            <p className="text-gray-500 text-sm mt-1">Dieser Bereich wird bald verfügbar sein.</p>
                        </CardContent>
                    </Card>
                )}
            </div>
        </div>
    )
}
