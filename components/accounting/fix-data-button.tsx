'use client'

import { Button } from '@/components/ui/button'
import { useState } from 'react'
import { RefreshCw } from 'lucide-react'
import { useRouter } from 'next/navigation'

export function FixDataButton() {
    const [loading, setLoading] = useState(false)
    const router = useRouter()

    const handleClick = async (e: React.MouseEvent) => {
        e.preventDefault()
        if (!confirm('Dies wird alle Daten der Standard-Organisation zuweisen. Fortfahren?')) return

        setLoading(true)
        try {
            const res = await fetch('/api/debug/fix-org-ids', { method: 'POST' })
            const data = await res.json()
            if (res.ok) {
                alert(`Daten erfolgreich korrigiert!\n\nAktualisiert:\nRechnungen: ${data.updated.invoices}\nAusgaben: ${data.updated.expenses}\nEinnahmen: ${data.updated.income}`)
                router.refresh()
            } else {
                alert('Fehler: ' + data.error)
            }
        } catch (err) {
            alert('Ein Fehler ist aufgetreten')
        } finally {
            setLoading(false)
        }
    }

    return (
        <Button
            onClick={handleClick}
            disabled={loading}
            variant="destructive"
        >
            {loading ? <RefreshCw className="mr-2 h-4 w-4 animate-spin" /> : null}
            Daten-Zuordnung korrigieren (Fix Org IDs)
        </Button>
    )
}
