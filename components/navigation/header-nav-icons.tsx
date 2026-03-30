'use client'

import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Home, ShoppingBag } from 'lucide-react'
import { Button } from '@/components/ui/button'

export function HeaderNavIcons() {
    const router = useRouter()

    return (
        <div className="flex items-center gap-3">
            <Button
                variant="outline"
                size="icon"
                onClick={() => router.back()}
                className="h-10 w-10 rounded-xl border-slate-200 bg-white/50 hover:bg-slate-50 shadow-sm transition-all"
                aria-label="Zurück"
                title="Zurück"
            >
                <ArrowLeft className="h-[18px] w-[18px] text-slate-600" strokeWidth={2} />
            </Button>

            <Link href="/dashboard">
                <Button
                    variant="outline"
                    size="icon"
                    className="h-10 w-10 rounded-xl border-slate-200 bg-white/50 hover:bg-slate-50 shadow-sm transition-all"
                    aria-label="Dashboard"
                    title="Dashboard"
                >
                    <Home className="h-[18px] w-[18px] text-slate-600" strokeWidth={2} />
                </Button>
            </Link>
        </div>
    )
}
