'use client'

import { useEffect, useState } from 'react'
import { MapContainer, TileLayer, Marker, Popup, Tooltip } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'
import 'leaflet-defaulticon-compatibility/dist/leaflet-defaulticon-compatibility.css'
import 'leaflet-defaulticon-compatibility'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { MapPin, Users, Loader2 } from 'lucide-react'

interface LocationData {
    name: string
    lat: number
    lng: number
    count: number
    type: 'city' | 'country'
    customers: Array<{
        id: string
        name: string
        email: string
    }>
}

export default function CustomerMap() {
    const [locations, setLocations] = useState<LocationData[]>([])
    const [loading, setLoading] = useState(true)
    const [stats, setStats] = useState({ totalCustomers: 0, totalCities: 0, totalCountries: 0 })

    useEffect(() => {
        async function fetchLocations() {
            try {
                const res = await fetch('/api/admin/customers/locations')
                const data = await res.json()
                setLocations(data.locations)

                // Calculate Stats
                const totalCust = data.locations.reduce((acc: number, curr: LocationData) => acc + curr.count, 0)
                const cities = new Set(data.locations.filter((l: LocationData) => l.type === 'city').map((l: LocationData) => l.name)).size
                const countries = new Set(data.locations.filter((l: LocationData) => l.type === 'country').map((l: LocationData) => l.name)).size // Approximation

                setStats({
                    totalCustomers: totalCust,
                    totalCities: cities,
                    totalCountries: countries
                })

            } catch (e) {
                console.error("Failed to load map data", e)
            } finally {
                setLoading(false)
            }
        }
        fetchLocations()
    }, [])

    if (loading) {
        return (
            <div className="h-[600px] w-full flex items-center justify-center bg-slate-50/50 border rounded-lg">
                <div className="flex flex-col items-center gap-2">
                    <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
                    <p className="text-sm text-slate-500">Lade Kartendaten...</p>
                </div>
            </div>
        )
    }

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card>
                    <CardHeader className="pb-2">
                        <CardDescription>Kartierte Kunden</CardDescription>
                        <CardTitle className="text-2xl">{stats.totalCustomers}</CardTitle>
                    </CardHeader>
                </Card>
                <Card>
                    <CardHeader className="pb-2">
                        <CardDescription>Städte</CardDescription>
                        <CardTitle className="text-2xl">{stats.totalCities}</CardTitle>
                    </CardHeader>
                </Card>
                <Card>
                    <CardHeader className="pb-2">
                        <CardDescription>Regionen (Fallback)</CardDescription>
                        <CardTitle className="text-2xl">{locations.filter(l => l.type === 'country').length}</CardTitle>
                    </CardHeader>
                </Card>
            </div>

            <Card className="overflow-hidden border-slate-200 shadow-sm">
                <div className="h-[600px] w-full relative z-0">
                    <MapContainer
                        center={[51.1657, 10.4515]} // Germany Center
                        zoom={6}
                        scrollWheelZoom={true}
                        className="h-full w-full"
                    >
                        <TileLayer
                            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                            url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
                        />

                        {locations.map((loc, idx) => (
                            <Marker
                                key={idx}
                                position={[loc.lat, loc.lng]}
                            >
                                <Popup className="min-w-[200px]">
                                    <div className="space-y-2">
                                        <div className="flex items-center justify-between border-b pb-2 mb-2">
                                            <h3 className="font-bold flex items-center gap-2">
                                                <MapPin className="h-4 w-4 text-violet-600" />
                                                {loc.name}
                                            </h3>
                                            <Badge variant="secondary" className="text-xs">
                                                {loc.count} Kunden
                                            </Badge>
                                        </div>

                                        <div className="space-y-1 max-h-[150px] overflow-y-auto">
                                            {loc.customers.map(c => (
                                                <div key={c.id} className="text-sm flex items-center gap-2 py-1">
                                                    <div className="h-6 w-6 rounded-full bg-slate-100 flex items-center justify-center text-[10px] font-medium text-slate-600">
                                                        {c.name?.[0] || 'U'}
                                                    </div>
                                                    <div className="flex-1 overflow-hidden text-ellipsis whitespace-nowrap">
                                                        <span className="font-medium text-slate-700">{c.name || 'Unbekannt'}</span>
                                                    </div>
                                                </div>
                                            ))}
                                            {loc.count > 5 && (
                                                <p className="text-xs text-slate-400 text-center italic mt-1">
                                                    + {loc.count - 5} weitere
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                </Popup>
                                <Tooltip direction="top" offset={[0, -20]} opacity={1}>
                                    <span className="font-medium">{loc.name} ({loc.count})</span>
                                </Tooltip>
                            </Marker>
                        ))}
                    </MapContainer>
                </div>
            </Card>
        </div>
    )
}
