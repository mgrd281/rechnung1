'use client'

import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetFooter } from "@/components/ui/sheet"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Shield, Clock, MapPin, Search, Lock, LogOut, Ban, Trash2, Mail } from "lucide-react"
import { Separator } from "@/components/ui/separator"

interface UserDrawerProps {
    user: any | null
    isOpen: boolean
    onClose: () => void
}

export function UserDrawer({ user, isOpen, onClose }: UserDrawerProps) {
    if (!user) return null

    return (
        <Sheet open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <SheetContent className="w-[400px] sm:w-[540px] overflow-y-auto">
                <SheetHeader className="mb-6">
                    <div className="flex items-center gap-4">
                        <Avatar className="h-16 w-16">
                            <AvatarImage src={user.image} />
                            <AvatarFallback className="text-lg font-bold bg-violet-100 text-violet-700">
                                {user.name?.[0] || user.email[0].toUpperCase()}
                            </AvatarFallback>
                        </Avatar>
                        <div>
                            <SheetTitle className="text-xl">{user.name || 'Unbenannt'}</SheetTitle>
                            <SheetDescription className="text-sm font-medium text-slate-500">{user.email}</SheetDescription>
                            <div className="flex gap-2 mt-2">
                                <Badge variant="outline" className="border-violet-200 text-violet-700 bg-violet-50">
                                    {user.role}
                                </Badge>
                                {user.isSuspended && <Badge variant="destructive">Gesperrt</Badge>}
                            </div>
                        </div>
                    </div>
                </SheetHeader>

                <Tabs defaultValue="overview" className="w-full">
                    <TabsList className="w-full justify-start border-b rounded-none h-auto p-0 bg-transparent space-x-6">
                        <TabsTrigger
                            value="overview"
                            className="rounded-none border-b-2 border-transparent data-[state=active]:border-violet-600 data-[state=active]:shadow-none px-0 py-2"
                        >
                            Übersicht
                        </TabsTrigger>
                        <TabsTrigger
                            value="security"
                            className="rounded-none border-b-2 border-transparent data-[state=active]:border-violet-600 data-[state=active]:shadow-none px-0 py-2"
                        >
                            Sicherheit
                        </TabsTrigger>
                        <TabsTrigger
                            value="activity"
                            className="rounded-none border-b-2 border-transparent data-[state=active]:border-violet-600 data-[state=active]:shadow-none px-0 py-2"
                        >
                            Aktivität
                        </TabsTrigger>
                    </TabsList>

                    <TabsContent value="overview" className="space-y-6 pt-6 animate-in slide-in-from-right-4 duration-300">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1">
                                <p className="text-xs font-medium text-slate-500 uppercase">Beigetreten am</p>
                                <div className="flex items-center gap-2">
                                    <Clock className="w-4 h-4 text-slate-400" />
                                    <span className="text-sm font-medium">{new Date(user.createdAt).toLocaleDateString()}</span>
                                </div>
                            </div>
                            <div className="space-y-1">
                                <p className="text-xs font-medium text-slate-500 uppercase">Letzter Login</p>
                                <div className="flex items-center gap-2">
                                    <Clock className="w-4 h-4 text-slate-400" />
                                    <span className="text-sm font-medium">
                                        {user.lastLoginAt ? new Date(user.lastLoginAt).toLocaleString() : 'Nie'}
                                    </span>
                                </div>
                            </div>
                            <div className="space-y-1">
                                <p className="text-xs font-medium text-slate-500 uppercase">Standort</p>
                                <div className="flex items-center gap-2">
                                    <MapPin className="w-4 h-4 text-slate-400" />
                                    <span className="text-sm font-medium">{user.country || 'Unbekannt'}</span>
                                </div>
                            </div>
                            <div className="space-y-1">
                                <p className="text-xs font-medium text-slate-500 uppercase">IP Adresse</p>
                                <div className="flex items-center gap-2">
                                    <Search className="w-4 h-4 text-slate-400" />
                                    <span className="text-sm font-medium">{user.lastIp || '-'}</span>
                                </div>
                            </div>
                        </div>

                        <Separator />

                        <div className="space-y-4">
                            <h4 className="font-medium text-sm">Quick Actions</h4>
                            <div className="grid grid-cols-2 gap-3">
                                <Button variant="outline" className="justify-start">
                                    <Mail className="w-4 h-4 mr-2" /> E-Mail senden
                                </Button>
                                <Button variant="outline" className="justify-start">
                                    <Shield className="w-4 h-4 mr-2" /> Rolle ändern
                                </Button>
                            </div>
                        </div>
                    </TabsContent>

                    <TabsContent value="security" className="space-y-6 pt-6">
                        <div className="p-4 bg-orange-50 border border-orange-100 rounded-lg space-y-4">
                            <div className="flex items-start gap-3">
                                <Shield className="w-5 h-5 text-orange-600 mt-0.5" />
                                <div>
                                    <h4 className="font-medium text-orange-900">Account Aktionen</h4>
                                    <p className="text-sm text-orange-700 mt-1">Gefährliche Aktionen hier verwalten.</p>
                                </div>
                            </div>
                            <div className="flex flex-col gap-2">
                                <Button variant="outline" className="bg-white border-orange-200 text-orange-700 hover:bg-orange-100 hover:text-orange-800 justify-start">
                                    <LogOut className="w-4 h-4 mr-2" />
                                    Logout erzwingen
                                </Button>
                                <Button variant="outline" className="bg-white border-orange-200 text-orange-700 hover:bg-orange-100 hover:text-orange-800 justify-start">
                                    <Lock className="w-4 h-4 mr-2" />
                                    Password Reset senden
                                </Button>
                            </div>
                        </div>

                        <div className="p-4 bg-red-50 border border-red-100 rounded-lg space-y-4">
                            <div className="flex items-start gap-3">
                                <Ban className="w-5 h-5 text-red-600 mt-0.5" />
                                <div>
                                    <h4 className="font-medium text-red-900">Danger Zone</h4>
                                    <p className="text-sm text-red-700 mt-1">Diese Aktionen sind irreversibel.</p>
                                </div>
                            </div>
                            <div className="flex flex-col gap-2">
                                <Button variant="destructive" className="justify-start">
                                    <Ban className="w-4 h-4 mr-2" />
                                    Benutzer sperren
                                </Button>
                                <Button variant="destructive" className="justify-start opacity-90 hover:opacity-100">
                                    <Trash2 className="w-4 h-4 mr-2" />
                                    Account löschen
                                </Button>
                            </div>
                        </div>
                    </TabsContent>

                    <TabsContent value="activity" className="pt-6">
                        <p className="text-sm text-slate-500 text-center py-8">Keine jüngsten Aktivitäten aufgezeichnet.</p>
                    </TabsContent>
                </Tabs>
            </SheetContent>
        </Sheet>
    )
}
