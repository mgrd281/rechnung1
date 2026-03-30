'use client'

import { HeaderNavIcons } from '@/components/navigation/header-nav-icons'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card'
import { Plus, Trash2, Edit, Play, Pause, Home, MapPin, Euro, RefreshCw, Bell } from 'lucide-react'
import { useToast } from '@/components/ui/toast'
import { useAuthenticatedFetch } from '@/lib/api-client'
import { Switch } from '@/components/ui/switch'

interface Profile {
    id: string
    name: string
    isActive: boolean
    city?: string
    zipCode?: string
    transactionType: string
    propertyType: string
    priceMax?: number
    roomsMin?: number
    areaMin?: number
    lastRunAt?: string
}

export default function RealEstatePage() {
    const authenticatedFetch = useAuthenticatedFetch()
    const { showToast } = useToast()
    const [profiles, setProfiles] = useState<Profile[]>([])
    const [loading, setLoading] = useState(true)
    const [runningTest, setRunningTest] = useState(false)

    useEffect(() => {
        fetchProfiles()
    }, [])

    const fetchProfiles = async () => {
        try {
            const res = await authenticatedFetch('/api/real-estate/profiles')
            if (res.ok) {
                const data = await res.json()
                setProfiles(data)
            }
        } catch (error) {
            console.error('Failed to fetch profiles', error)
        } finally {
            setLoading(false)
        }
    }

    const toggleStatus = async (id: string, currentStatus: boolean) => {
        try {
            const res = await authenticatedFetch(`/api/real-estate/profiles/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ isActive: !currentStatus })
            })
            if (res.ok) {
                setProfiles(profiles.map(p => p.id === id ? { ...p, isActive: !currentStatus } : p))
                showToast(currentStatus ? 'Profil pausiert' : 'Profil aktiviert', 'success')
            }
        } catch (error) {
            showToast('Fehler beim Ändern des Status', 'error')
        }
    }

    const deleteProfile = async (id: string) => {
        if (!confirm('Möchten Sie dieses Suchprofil wirklich löschen?')) return

        try {
            const res = await authenticatedFetch(`/api/real-estate/profiles/${id}`, {
                method: 'DELETE'
            })
            if (res.ok) {
                setProfiles(profiles.filter(p => p.id !== id))
                showToast('Profil gelöscht', 'success')
            }
        } catch (error) {
            showToast('Fehler beim Löschen', 'error')
        }
    }

    const runTest = async () => {
        setRunningTest(true)
        showToast('Suche wird ausgeführt...', 'info')
        try {
            const res = await fetch('/api/cron/real-estate')
            const data = await res.json()
            if (res.ok) {
                showToast(`Test erfolgreich! ${data.sent || 0} Benachrichtigungen gesendet.`, 'success')
                fetchProfiles() // Update last run time
            } else {
                showToast('Fehler beim Test-Lauf', 'error')
            }
        } catch (error) {
            showToast('Netzwerkfehler', 'error')
        } finally {
            setRunningTest(false)
        }
    }

    if (loading) return <div className="p-8 text-center">Laden...</div>

    return (
        <div className="min-h-screen bg-gray-50 p-8">
            <div className="max-w-6xl mx-auto">
                <div className="flex justify-between items-center mb-8">
                    <div className="flex items-center gap-4">
                        <HeaderNavIcons />
                        <div className="mx-1" />
                        <div>
                            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
                                <Bell className="h-8 w-8 text-blue-600" />
                                Immobilien-Alarm
                            </h1>
                            <p className="text-gray-600 mt-2">Überwachen Sie neue Angebote auf ImmobilienScout24</p>
                        </div>
                    </div>
                    <div className="flex gap-4">
                        <Button variant="outline" onClick={runTest} disabled={runningTest}>
                            <RefreshCw className={`h-4 w-4 mr-2 ${runningTest ? 'animate-spin' : ''}`} />
                            Test-Lauf starten
                        </Button>
                        <Link href="/real-estate/new">
                            <Button>
                                <Plus className="h-4 w-4 mr-2" />
                                Neues Suchprofil
                            </Button>
                        </Link>
                    </div>
                </div>

                {profiles.length === 0 ? (
                    <Card className="text-center p-12">
                        <div className="flex flex-col items-center">
                            <Home className="h-12 w-12 text-gray-300 mb-4" />
                            <h3 className="text-lg font-medium text-gray-900">Keine Suchprofile</h3>
                            <p className="text-gray-500 mb-6">Erstellen Sie Ihr erstes Suchprofil, um Benachrichtigungen zu erhalten.</p>
                            <Link href="/real-estate/new">
                                <Button>Profil anlegen</Button>
                            </Link>
                        </div>
                    </Card>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {profiles.map(profile => (
                            <Card key={profile.id} className={!profile.isActive ? 'opacity-75' : ''}>
                                <CardHeader className="pb-3">
                                    <div className="flex justify-between items-start">
                                        <CardTitle className="text-lg font-semibold truncate pr-2" title={profile.name}>
                                            {profile.name}
                                        </CardTitle>
                                        <Switch
                                            checked={profile.isActive}
                                            onCheckedChange={() => toggleStatus(profile.id, profile.isActive)}
                                        />
                                    </div>
                                    <CardDescription className="flex items-center gap-1">
                                        {profile.transactionType === 'RENT' ? 'Miete' : 'Kauf'} • {profile.propertyType === 'HOUSE' ? 'Haus' : 'Wohnung'}
                                    </CardDescription>
                                </CardHeader>
                                <CardContent className="text-sm space-y-2">
                                    <div className="flex items-center gap-2 text-gray-600">
                                        <MapPin className="h-4 w-4" />
                                        <span>{profile.city || profile.zipCode || 'Deutschland'}</span>
                                    </div>
                                    <div className="flex items-center gap-2 text-gray-600">
                                        <Euro className="h-4 w-4" />
                                        <span>Bis {profile.priceMax?.toLocaleString()} €</span>
                                    </div>
                                    <div className="flex items-center gap-2 text-gray-600">
                                        <Home className="h-4 w-4" />
                                        <span>Ab {profile.roomsMin || 0} Zi. • {profile.areaMin || 0} m²</span>
                                    </div>
                                </CardContent>
                                <CardFooter className="flex justify-between border-t pt-4 text-xs text-gray-500">
                                    <span>Letzter Check: {profile.lastRunAt ? new Date(profile.lastRunAt).toLocaleTimeString() : '-'}</span>
                                    <div className="flex gap-2">
                                        <Link href={`/real-estate/${profile.id}`}>
                                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                                <Edit className="h-4 w-4" />
                                            </Button>
                                        </Link>
                                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-red-500 hover:text-red-600" onClick={() => deleteProfile(profile.id)}>
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </CardFooter>
                            </Card>
                        ))}
                    </div>
                )}
            </div>
        </div>
    )
}
