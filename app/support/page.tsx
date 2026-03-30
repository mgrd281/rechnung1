'use client'

import React, { useState, useEffect } from 'react'
import { SupportSidebar } from '@/components/support/support-sidebar'
import { SupportHeader } from '@/components/support/support-header'
import { TicketList } from '@/components/support/ticket-list'
import { TicketDetail } from '@/components/support/ticket-detail'
import { useToast } from '@/components/ui/toast'

export default function SupportPage() {
    const [view, setView] = useState('inbox')
    const [tickets, setTickets] = useState<any[]>([])
    const [selectedTicket, setSelectedTicket] = useState<any | null>(null)
    const [loading, setLoading] = useState(true)
    const { showToast } = useToast()

    // Fetch Tickets
    useEffect(() => {
        loadTickets()
    }, [])

    const loadTickets = async () => {
        setLoading(true)
        try {
            const res = await fetch('/api/support/tickets')
            const json = await res.json()
            if (json.success) {
                setTickets(json.data)
            }
        } catch (e) {
            console.error(e)
            showToast('Fehler beim Laden der Tickets', 'error')
        } finally {
            setLoading(false)
        }
    }

    const handleUpdateTicket = async (id: string, updates: any) => {
        // Optimistic Update
        setTickets(tickets.map(t => t.id === id ? { ...t, ...updates } : t))
        if (selectedTicket?.id === id) {
            setSelectedTicket({ ...selectedTicket, ...updates })
        }

        try {
            const res = await fetch(`/api/support/tickets/${id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(updates)
            })
            if (!res.ok) throw new Error('Failed to update')
            showToast('Ticket aktualisiert', 'success')
        } catch (error) {
            showToast('Fehler beim Speichern', 'error')
            loadTickets() // Revert on error
        }
    }

    // Filter Logic
    const filteredTickets = tickets.filter(t => {
        if (view === 'inbox') return t.status === 'OPEN'
        if (view === 'solved') return t.status === 'CLOSED'
        if (view === 'waiting') return t.status === 'PENDING'
        return true
    })

    return (
        <div className="flex flex-col h-screen bg-white overflow-hidden">
            <SupportHeader />

            <div className="flex flex-1 overflow-hidden">
                {/* 1. Sidebar */}
                <SupportSidebar
                    view={view}
                    onViewChange={(v) => {
                        setView(v)
                        setSelectedTicket(null)
                    }}
                    count={tickets.filter(t => t.status === 'OPEN').length}
                />

                {/* 2. Ticket List */}
                <div className="w-[380px] border-r border-gray-200 flex flex-col bg-white overflow-hidden">
                    <div className="p-4 border-b border-gray-100 flex items-center justify-between bg-white z-10">
                        <h3 className="font-bold text-gray-900">
                            {view === 'inbox' ? 'Posteingang' :
                                view === 'solved' ? 'Gelöst' :
                                    view === 'waiting' ? 'Wartend' : 'Alle Tickets'}
                        </h3>
                        <span className="text-xs text-gray-500 font-medium">
                            {filteredTickets.length} Tickets
                        </span>
                    </div>
                    <div className="flex-1 overflow-y-auto">
                        <TicketList
                            tickets={filteredTickets}
                            selectedId={selectedTicket?.id}
                            onSelect={setSelectedTicket}
                            loading={loading}
                        />
                    </div>
                </div>

                {/* 3. Detail View */}
                <TicketDetail
                    ticket={selectedTicket}
                    onUpdate={handleUpdateTicket}
                />
            </div>

            
        </div>
    )
}
