'use client'

import { useState, useCallback, useEffect } from 'react'

export interface IpBlock {
    id: string
    ipAddress: string
    reason: string | null
    type?: 'PERMANENT' | 'TEMPORARY'
    createdAt: string
    expiresAt?: string | null
    country?: string
    attempts?: number
}

interface UseIpBlocksResult {
    blocks: IpBlock[]
    isLoading: boolean
    error: string | null
    // Mutations
    addBlock: (ipAddress: string, reason?: string, duration?: string) => Promise<{ ok: boolean; error?: string }>
    deleteBlock: (id: string) => Promise<{ ok: boolean; error?: string }>
    bulkUnblock: (ids: string[]) => Promise<{ ok: boolean; deletedCount?: number; error?: string }>
    // Utilities
    refetch: () => Promise<void>
    clearError: () => void
}

export function useIpBlocks(): UseIpBlocksResult {
    const [blocks, setBlocks] = useState<IpBlock[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    const fetchBlocks = useCallback(async () => {
        try {
            setIsLoading(true)
            setError(null)
            const res = await fetch('/api/security/blocked-ips')
            const data = await res.json()

            if (!res.ok) {
                throw new Error(data.error || 'Fehler beim Laden der Sperrliste')
            }

            setBlocks(data.blockedIps || [])
        } catch (err: any) {
            setError(err.message || 'Unbekannter Fehler')
            console.error('[useIpBlocks] Error fetching:', err)
        } finally {
            setIsLoading(false)
        }
    }, [])

    useEffect(() => {
        fetchBlocks()
    }, [fetchBlocks])

    const addBlock = useCallback(async (
        ipAddress: string,
        reason?: string,
        duration?: string
    ): Promise<{ ok: boolean; error?: string }> => {
        try {
            const res = await fetch('/api/security/blocked-ips', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ipAddress: ipAddress.trim(),
                    reason: reason?.trim() || null,
                    duration
                })
            })

            const data = await res.json()

            if (!res.ok) {
                return { ok: false, error: data.error || 'Fehler beim Erstellen der Sperre' }
            }

            // Add to local state immediately (optimistic)
            if (data.blockedIp) {
                setBlocks(prev => [data.blockedIp, ...prev.filter(b => b.id !== data.blockedIp.id)])
            }

            return { ok: true }
        } catch (err: any) {
            console.error('[useIpBlocks] Error adding:', err)
            return { ok: false, error: err.message || 'Netzwerkfehler' }
        }
    }, [])

    const deleteBlock = useCallback(async (id: string): Promise<{ ok: boolean; error?: string }> => {
        // Store for rollback
        const previousBlocks = blocks

        // Optimistic update
        setBlocks(prev => prev.filter(b => b.id !== id))

        try {
            const res = await fetch(`/api/security/blocked-ips?id=${encodeURIComponent(id)}`, {
                method: 'DELETE'
            })

            const data = await res.json()

            if (!res.ok) {
                // Rollback on error
                setBlocks(previousBlocks)
                return { ok: false, error: data.error || 'Fehler beim Entfernen der Sperre' }
            }

            return { ok: true }
        } catch (err: any) {
            // Rollback on error
            setBlocks(previousBlocks)
            console.error('[useIpBlocks] Error deleting:', err)
            return { ok: false, error: err.message || 'Netzwerkfehler' }
        }
    }, [blocks])

    const bulkUnblock = useCallback(async (ids: string[]): Promise<{ ok: boolean; deletedCount?: number; error?: string }> => {
        if (ids.length === 0) {
            return { ok: false, error: 'Keine IPs ausgewählt' }
        }

        // Store for rollback
        const previousBlocks = blocks

        // Optimistic update
        setBlocks(prev => prev.filter(b => !ids.includes(b.id)))

        try {
            const res = await fetch('/api/security/blocked-ips/bulk-unblock', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ids })
            })

            const data = await res.json()

            if (!res.ok) {
                // Rollback on error
                setBlocks(previousBlocks)
                return { ok: false, error: data.error || 'Fehler beim Bulk-Entsperren' }
            }

            return { ok: true, deletedCount: data.deletedCount }
        } catch (err: any) {
            // Rollback on error
            setBlocks(previousBlocks)
            console.error('[useIpBlocks] Error bulk unblocking:', err)
            return { ok: false, error: err.message || 'Netzwerkfehler' }
        }
    }, [blocks])

    const clearError = useCallback(() => {
        setError(null)
    }, [])

    return {
        blocks,
        isLoading,
        error,
        addBlock,
        deleteBlock,
        bulkUnblock,
        refetch: fetchBlocks,
        clearError
    }
}
