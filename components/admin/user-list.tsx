'use client'

import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { MoreVertical, Shield, Clock } from "lucide-react"

interface UserListProps {
    users: any[]
    onSelectUser: (user: any) => void
}

export function UserList({ users, onSelectUser }: UserListProps) {
    if (users.length === 0) {
        return <div className="text-center py-10 text-slate-500">Keine Benutzer gefunden.</div>
    }

    return (
        <div className="space-y-3">
            {users.map((user) => (
                <Card
                    key={user.id}
                    className="border-slate-200 hover:border-violet-300 hover:shadow-md transition-all cursor-pointer group"
                    onClick={() => onSelectUser(user)}
                >
                    <CardContent className="p-4 flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <Avatar className="h-10 w-10 border border-slate-100">
                                <AvatarImage src={user.image} />
                                <AvatarFallback className="bg-slate-100 text-slate-600 font-bold">
                                    {user.name?.[0] || user.email[0].toUpperCase()}
                                </AvatarFallback>
                            </Avatar>
                            <div className="space-y-1">
                                <div className="flex items-center gap-2">
                                    <span className="font-semibold text-slate-900">{user.name || 'Unbenannt'}</span>
                                    {user.isSuspended && <Badge variant="destructive" className="h-5 px-1.5 text-[10px]">Gesperrt</Badge>}
                                </div>
                                <div className="flex items-center gap-2 text-sm text-slate-500">
                                    <span>{user.email}</span>
                                    <span className="text-slate-300">•</span>
                                    <Badge variant="secondary" className="h-5 px-1.5 text-[10px] font-normal bg-slate-100 text-slate-600 border-slate-200">
                                        {user.role}
                                    </Badge>
                                </div>
                            </div>
                        </div>

                        <div className="flex items-center gap-6">
                            <div className="text-right hidden sm:block">
                                <p className="text-xs text-slate-400 uppercase font-bold tracking-wider mb-1">Letzter Login</p>
                                <div className="flex items-center justify-end gap-1.5 text-sm text-slate-600">
                                    <Clock className="w-3.5 h-3.5 text-slate-400" />
                                    {user.lastLoginAt ? new Date(user.lastLoginAt).toLocaleDateString() : 'Nie'}
                                </div>
                            </div>
                            <Button variant="ghost" size="icon" className="group-hover:bg-slate-100">
                                <MoreVertical className="w-4 h-4 text-slate-400 group-hover:text-slate-600" />
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            ))}
        </div>
    )
}
