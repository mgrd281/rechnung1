'use client'

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { Shield, Server, Bell, Save } from "lucide-react"

export default function AdminSettingsPage() {
    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <div>
                <h1 className="text-3xl font-bold tracking-tight text-slate-900">Admin Einstellungen</h1>
                <p className="text-slate-500 mt-2">Verwalten Sie systemweite Konfigurationen und Sicherheitseinstellungen.</p>
            </div>

            <Separator className="my-6" />

            <div className="grid grid-cols-1 gap-6">
                {/* System Settings */}
                <Card className="border-slate-200">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Server className="h-5 w-5 text-violet-600" />
                            Systemstatus
                        </CardTitle>
                        <CardDescription>Steuern Sie den globalen Systemzugriff.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="flex items-center justify-between">
                            <div className="space-y-0.5">
                                <Label className="text-base">Wartungsmodus</Label>
                                <p className="text-sm text-slate-500">
                                    Wenn aktiviert, ist das System für normale Benutzer nicht erreichbar.
                                </p>
                            </div>
                            <Switch />
                        </div>
                        <Separator />
                        <div className="flex items-center justify-between">
                            <div className="space-y-0.5">
                                <Label className="text-base">Debug-Logging</Label>
                                <p className="text-sm text-slate-500">
                                    Erweiterte Protokollierung für Fehlerdiagnose aktivieren.
                                </p>
                            </div>
                            <Switch />
                        </div>
                    </CardContent>
                </Card>

                {/* Security Settings */}
                <Card className="border-slate-200">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Shield className="h-5 w-5 text-violet-600" />
                            Sicherheit
                        </CardTitle>
                        <CardDescription>Konfigurieren Sie sicherheitsrelevante Einstellungen.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="flex items-center justify-between">
                            <div className="space-y-0.5">
                                <Label className="text-base">2FA Erzwingen</Label>
                                <p className="text-sm text-slate-500">
                                    Zwei-Faktor-Authentifizierung für alle Admin-Konten erzwingen.
                                </p>
                            </div>
                            <Switch />
                        </div>
                        <Separator />
                        <div className="flex items-center justify-between">
                            <div className="space-y-0.5">
                                <Label className="text-base">IP-Beschränkung</Label>
                                <p className="text-sm text-slate-500">
                                    Admin-Zugriff nur von whitelisted IP-Adressen erlauben.
                                </p>
                            </div>
                            <Switch />
                        </div>
                    </CardContent>
                </Card>

                {/* Notifications */}
                <Card className="border-slate-200">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Bell className="h-5 w-5 text-violet-600" />
                            Benachrichtigungen
                        </CardTitle>
                        <CardDescription>Verwalten Sie Systembenachrichtigungen.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="flex items-center justify-between">
                            <div className="space-y-0.5">
                                <Label className="text-base">E-Mail-Benachrichtigungen</Label>
                                <p className="text-sm text-slate-500">
                                    Systemkritische Alarme per E-Mail versenden.
                                </p>
                            </div>
                            <Switch defaultChecked />
                        </div>
                    </CardContent>
                </Card>

                <div className="flex justify-end">
                    <Button className="bg-violet-600 hover:bg-violet-700 text-white">
                        <Save className="w-4 h-4 mr-2" />
                        Einstellungen speichern
                    </Button>
                </div>
            </div>
        </div>
    )
}
