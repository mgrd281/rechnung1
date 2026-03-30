'use client'

import { HeaderNavIcons } from '@/components/navigation/header-nav-icons'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { useToast } from '@/components/ui/toast'
import { useAuthenticatedFetch } from '@/lib/api-client'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'

interface ProfileFormProps {
    initialData?: any
    isEdit?: boolean
}

export function ProfileForm({ initialData, isEdit }: ProfileFormProps) {
    const router = useRouter()
    const { showToast } = useToast()
    const authenticatedFetch = useAuthenticatedFetch()
    const [loading, setLoading] = useState(false)

    const [formData, setFormData] = useState({
        name: initialData?.name || '',
        transactionType: initialData?.transactionType || 'RENT',
        propertyType: initialData?.propertyType || 'APARTMENT',
        city: initialData?.city || '',
        zipCode: initialData?.zipCode || '',
        district: initialData?.district || '',
        priceMax: initialData?.priceMax || '',
        roomsMin: initialData?.roomsMin || '',
        areaMin: initialData?.areaMin || ''
    })

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)

        try {
            const url = isEdit
                ? `/api/real-estate/profiles/${initialData.id}`
                : '/api/real-estate/profiles'

            const method = isEdit ? 'PUT' : 'POST'

            const res = await authenticatedFetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            })

            if (res.ok) {
                showToast(isEdit ? 'Profil aktualisiert' : 'Profil erstellt', 'success')
                router.push('/real-estate')
                router.refresh()
            } else {
                showToast('Fehler beim Speichern', 'error')
            }
        } catch (error) {
            showToast('Netzwerkfehler', 'error')
        } finally {
            setLoading(false)
        }
    }

    return (
        <form onSubmit={handleSubmit} className="max-w-2xl mx-auto py-8">
            <div className="mb-6 flex items-center gap-4">
                <HeaderNavIcons />
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>{isEdit ? 'Suchprofil bearbeiten' : 'Neues Suchprofil anlegen'}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="space-y-2">
                        <Label>Profil-Name</Label>
                        <Input
                            placeholder="z.B. Berlin Mitte 2-Zimmer"
                            value={formData.name}
                            onChange={e => setFormData({ ...formData, name: e.target.value })}
                            required
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label>Transaktion</Label>
                            <Select
                                value={formData.transactionType}
                                onValueChange={v => setFormData({ ...formData, transactionType: v })}
                            >
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="RENT">Miete</SelectItem>
                                    <SelectItem value="BUY">Kauf</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label>Immobilien-Typ</Label>
                            <Select
                                value={formData.propertyType}
                                onValueChange={v => setFormData({ ...formData, propertyType: v })}
                            >
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="APARTMENT">Wohnung</SelectItem>
                                    <SelectItem value="HOUSE">Haus</SelectItem>
                                    <SelectItem value="COMMERCIAL">Gewerbe</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    <div className="grid grid-cols-3 gap-4">
                        <div className="space-y-2">
                            <Label>Stadt</Label>
                            <Input
                                placeholder="Berlin"
                                value={formData.city}
                                onChange={e => setFormData({ ...formData, city: e.target.value })}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Stadtteil</Label>
                            <Input
                                placeholder="Mitte"
                                value={formData.district || ''}
                                onChange={e => setFormData({ ...formData, district: e.target.value })}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>PLZ</Label>
                            <Input
                                placeholder="10115"
                                value={formData.zipCode}
                                onChange={e => setFormData({ ...formData, zipCode: e.target.value })}
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-3 gap-4">
                        <div className="space-y-2">
                            <Label>Max. Preis (€)</Label>
                            <Input
                                type="number"
                                placeholder="1500"
                                value={formData.priceMax}
                                onChange={e => setFormData({ ...formData, priceMax: e.target.value })}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Min. Zimmer</Label>
                            <Input
                                type="number"
                                placeholder="2"
                                value={formData.roomsMin}
                                onChange={e => setFormData({ ...formData, roomsMin: e.target.value })}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Min. Fläche (m²)</Label>
                            <Input
                                type="number"
                                placeholder="60"
                                value={formData.areaMin}
                                onChange={e => setFormData({ ...formData, areaMin: e.target.value })}
                            />
                        </div>
                    </div>
                </CardContent>
                <CardFooter className="flex justify-end gap-4">
                    <Link href="/real-estate">
                        <Button variant="outline" type="button">Abbrechen</Button>
                    </Link>
                    <Button type="submit" disabled={loading}>
                        {loading ? 'Speichere...' : 'Speichern'}
                    </Button>
                </CardFooter>
            </Card>
        </form>
    )
}
