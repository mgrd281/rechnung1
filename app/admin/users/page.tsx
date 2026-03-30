'use client'

import { useState, useEffect } from 'react'
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Search, Plus, Filter, Download } from "lucide-react"
import { UserList } from "@/components/admin/user-list"
import { UserDrawer } from "@/components/admin/user-drawer"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

export default function UsersPage() {
    const [users, setUsers] = useState([])
    const [loading, setLoading] = useState(true)
    const [searchTerm, setSearchTerm] = useState('')
    const [roleFilter, setRoleFilter] = useState('all')
    const [selectedUser, setSelectedUser] = useState<any>(null)

    useEffect(() => {
        const fetchUsers = async () => {
            setLoading(true)
            const params = new URLSearchParams()
            if (searchTerm) params.append('search', searchTerm)
            if (roleFilter !== 'all') params.append('role', roleFilter)

            const res = await fetch(`/api/admin/users?${params.toString()}`)
            const data = await res.json()
            setUsers(data.users || [])
            setLoading(false)
        }

        const debounce = setTimeout(fetchUsers, 300)
        return () => clearTimeout(debounce)
    }, [searchTerm, roleFilter])

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <UserDrawer
                user={selectedUser}
                isOpen={!!selectedUser}
                onClose={() => setSelectedUser(null)}
            />

            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-slate-900">Benutzerverwaltung</h1>
                    <p className="text-slate-500">Verwalten Sie Benutzer, Rollen und Zugriffsrechte.</p>
                </div>
                <Button className="bg-violet-600 hover:bg-violet-700 shadow-lg shadow-violet-100">
                    <Plus className="mr-2 h-4 w-4" /> Benutzer einladen
                </Button>
            </div>

            <div className="flex items-center gap-4 bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <Input
                        placeholder="Suchen nach Name oder E-Mail..."
                        className="pl-9 border-slate-200"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <Select value={roleFilter} onValueChange={setRoleFilter}>
                    <SelectTrigger className="w-[180px]">
                        <SelectValue placeholder="Rolle" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">Alle Rollen</SelectItem>
                        <SelectItem value="admin">Admin</SelectItem>
                        <SelectItem value="user">User</SelectItem>
                    </SelectContent>
                </Select>
                <Button variant="outline" size="icon"><Filter className="h-4 w-4" /></Button>
                <Button variant="outline" size="icon"><Download className="h-4 w-4" /></Button>
            </div>

            {loading ? (
                <div className="text-center py-20 text-slate-400">Lade Benutzer...</div>
            ) : (
                <UserList users={users} onSelectUser={setSelectedUser} />
            )}
        </div>
    )
}
