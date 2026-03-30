'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from "@/lib/utils"
import {
    LayoutDashboard,
    Users,
    Shield,
    Lock,
    Activity,
    Settings,
    LogOut,
    MapPin,
    Bot,
    RefreshCw,
    Youtube,
    TrendingUp,
    Link2
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { useSession, signOut } from "next-auth/react"

const sidebarItems = [
    {
        title: "Overview",
        href: "/admin",
        icon: LayoutDashboard,
        matcher: (pathname: string) => pathname === "/admin"
    },
    {
        title: "Benutzer",
        href: "/admin/users",
        icon: Users,
        matcher: (pathname: string) => pathname.startsWith("/admin/users")
    },
    {
        title: "Rollen & Rechte",
        href: "/admin/roles",
        icon: Shield,
        matcher: (pathname: string) => pathname.startsWith("/admin/roles")
    },
    {
        title: "Sicherheit",
        href: "/admin/security",
        icon: Lock,
        matcher: (pathname: string) => pathname.startsWith("/admin/security")
    },
    {
        title: "Aktivität",
        href: "/admin/audit",
        icon: Activity,
        matcher: (pathname: string) => pathname.startsWith("/admin/audit")
    },
    {
        title: "Kundenkarte",
        href: "/admin/map",
        icon: MapPin,
        matcher: (pathname: string) => pathname.startsWith("/admin/map")
    },
    {
        title: "Einstellungen",
        href: "/admin/settings",
        icon: Settings,
        matcher: (pathname: string) => pathname.startsWith("/admin/settings")
    },
    {
        title: "AI Automatisierung",
        href: "/ai-automation",
        icon: Bot,
        matcher: (pathname: string) => pathname.startsWith("/ai-automation")
    },
    {
        title: "404 & Weiterleitungen",
        href: "/admin/redirects",
        icon: RefreshCw,
        matcher: (pathname: string) => pathname.startsWith("/admin/redirects")
    },
    {
        title: "SEO Intelligence",
        href: "/seo-intelligence",
        icon: TrendingUp,
        matcher: (pathname: string) => pathname.startsWith("/seo-intelligence") && !pathname.includes('backlinks')
    },
    {
        title: "Diagnose",
        href: "/diagnostic",
        icon: Activity,
        matcher: (pathname: string) => pathname === "/diagnostic"
    }
]

export function AdminSidebar() {
    const pathname = usePathname()

    return (
        <div className="w-64 border-r border-slate-200 bg-white flex flex-col h-screen sticky top-0">
            <div className="p-6 border-b border-slate-200">
                <div className="flex items-center gap-2 font-bold text-xl text-slate-900">
                    <div className="w-8 h-8 bg-slate-900 rounded-lg flex items-center justify-center text-white">
                        A
                    </div>
                    Admin Panel
                </div>
            </div>

            <div className="flex-1 overflow-y-auto py-6 px-4 space-y-1">
                {sidebarItems.map((item) => {
                    const isActive = item.matcher(pathname)
                    return (
                        <Link key={item.href} href={item.href}>
                            <Button
                                variant="ghost"
                                className={cn(
                                    "w-full justify-start gap-3 mb-1",
                                    isActive
                                        ? "bg-slate-100 text-slate-900 font-semibold"
                                        : "text-slate-500 hover:text-slate-900 hover:bg-slate-50"
                                )}
                            >
                                <item.icon className={cn("w-5 h-5", isActive ? "text-violet-600" : "text-slate-400")} />
                                {item.title}
                            </Button>
                        </Link>
                    )
                })}
            </div>

            <div className="p-4 border-t border-slate-200">
                <UserProfile />
                <Button variant="outline" className="w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-50 border-red-100" onClick={() => signOut()}>
                    <LogOut className="w-4 h-4 mr-2" />
                    Abmelden
                </Button>
            </div>
        </div>
    )
}

function UserProfile() {
    const { data: session } = useSession()

    if (!session?.user) return null

    const user = session.user
    const initials = user.name
        ? user.name.split(' ').map((n: string) => n[0]).join('').substring(0, 2).toUpperCase()
        : 'AD'

    return (
        <div className="flex items-center gap-3 px-2 py-3 mb-2">
            <div className="w-8 h-8 rounded-full bg-violet-100 text-violet-700 flex items-center justify-center font-bold text-sm overflow-hidden">
                {user.image ? (
                    <img src={user.image} alt={user.name || 'User'} className="w-full h-full object-cover" />
                ) : (
                    initials
                )}
            </div>
            <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-slate-900 truncate">
                    {user.name || 'Administrator'}
                </p>
                <p className="text-xs text-slate-500 truncate">{user.email}</p>
            </div>
        </div>
    )
}
