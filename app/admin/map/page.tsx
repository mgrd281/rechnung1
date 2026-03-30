'use client'

import dynamic from 'next/dynamic'
import { Skeleton } from "@/components/ui/skeleton"

const CustomerMap = dynamic(() => import('@/components/admin/customer-map'), {
    ssr: false,
    loading: () => <Skeleton className="h-[600px] w-full rounded-lg" />
})

export default function AdminMapPage() {
    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold tracking-tight">Kundenkarte</h1>
                <p className="text-muted-foreground">
                    Geografische Verteilung Ihrer Kundenbasis.
                </p>
            </div>

            <CustomerMap />
        </div>
    )
}
