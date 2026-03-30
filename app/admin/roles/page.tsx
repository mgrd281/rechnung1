'use client'

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Button } from "@/components/ui/button"
import { Shield, Save } from "lucide-react"

const permissions = [
    { id: 'users.read', label: 'Benutzer anzeigen' },
    { id: 'users.write', label: 'Benutzer bearbeiten' },
    { id: 'users.delete', label: 'Benutzer löschen' },
    { id: 'settings.manage', label: 'Einstellungen verwalten' },
    { id: 'security.manage', label: 'Sicherheit & Logs' },
    { id: 'billing.manage', label: 'Abrechnung verwalten' },
]

export default function RolesPage() {
    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <div>
                <h1 className="text-2xl font-bold tracking-tight text-slate-900">Rollen & Rechte</h1>
                <p className="text-slate-500">Definieren Sie differenzierte Zugriffsrechte für Ihre Administratoren.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* ADMIN ROLE */}
                <Card className="border-slate-200 border-l-4 border-l-violet-600">
                    <CardHeader>
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-violet-100 text-violet-600 rounded-lg">
                                    <Shield className="w-5 h-5" />
                                </div>
                                <div>
                                    <CardTitle>Administrator</CardTitle>
                                    <CardDescription>Voller Systemzugriff</CardDescription>
                                </div>
                            </div>
                            <Button disabled variant="outline" size="sm">System</Button>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-3">
                            {permissions.map((perm) => (
                                <div key={perm.id} className="flex items-center space-x-2">
                                    <Checkbox id={`admin-${perm.id}`} checked disabled />
                                    <label htmlFor={`admin-${perm.id}`} className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                                        {perm.label}
                                    </label>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>

                {/* MANAGER ROLE (Editable) */}
                <Card className="border-slate-200">
                    <CardHeader>
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-blue-100 text-blue-600 rounded-lg">
                                    <Shield className="w-5 h-5" />
                                </div>
                                <div>
                                    <CardTitle>Manager</CardTitle>
                                    <CardDescription>Eingeschränkter Zugriff</CardDescription>
                                </div>
                            </div>
                            <Button size="sm" className="bg-slate-900 text-white">
                                <Save className="w-4 h-4 mr-2" /> Speichern
                            </Button>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-3">
                            {permissions.map((perm) => (
                                <div key={perm.id} className="flex items-center space-x-2">
                                    <Checkbox
                                        id={`manager-${perm.id}`}
                                        defaultChecked={['users.read', 'users.write', 'billing.manage'].includes(perm.id)}
                                    />
                                    <label htmlFor={`manager-${perm.id}`} className="text-sm font-medium leading-none">
                                        {perm.label}
                                    </label>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
