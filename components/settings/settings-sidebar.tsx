'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import {
    Settings,
    CreditCard,
    Zap,
    Shield,
    Database,
    Code2,
    Building2
} from 'lucide-react'

const sidebarItems = [
    {
        title: 'Allgemein',
        href: '/settings',
        icon: Building2,
        matchExact: true
    },
    {
        title: 'Abrechnung',
        href: '/settings/billing',
        icon: CreditCard
    },
    {
        title: 'Automatisierung',
        href: '/settings/automation',
        icon: Zap
    },
    {
        title: 'Daten & Export',
        href: '/settings/data',
        icon: Database
    },
    {
        title: 'Sicherheit',
        href: '/settings/security',
        icon: Shield
    },
    {
        title: 'Entwickler',
        href: '/settings/developers',
        icon: Code2
    }
]

export function SettingsSidebar() {
    const pathname = usePathname()

    return (
        <nav className="flex flex-col space-y-1">
            {sidebarItems.map((item) => {
                const isActive = item.matchExact
                    ? pathname === item.href
                    : pathname.startsWith(item.href)

                return (
                    <Link
                        key={item.href}
                        href={item.href}
                        className={cn(
                            "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200",
                            isActive
                                ? "bg-white text-violet-700 shadow-sm border border-slate-200/60"
                                : "text-slate-500 hover:text-slate-900 hover:bg-slate-100/50"
                        )}
                    >
                        <item.icon className={cn("h-4 w-4", isActive ? "text-violet-600" : "text-slate-400")} />
                        {item.title}
                    </Link>
                )
            })}
        </nav>
    )
}
