'use client'

import React from 'react'
import { Mail, MessageCircle, Phone, Clock, AlertCircle } from 'lucide-react'
import { Badge } from "@/components/ui/badge"
import { formatDistanceToNow } from 'date-fns'
import { de } from 'date-fns/locale'

interface TicketListProps {
    tickets: any[]
    selectedId: string | null
    onSelect: (ticket: any) => void
    loading: boolean
}

export function TicketList({ tickets, selectedId, onSelect, loading }: TicketListProps) {
    if (loading) {
        return (
            <div className="flex flex-col gap-2 p-4">
                {[1, 2, 3].map(i => (
                    <div key={i} className="h-24 bg-gray-100 animate-pulse rounded-xl"></div>
                ))}
            </div>
        )
    }

    if (tickets.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center h-[500px] text-gray-400 p-8 text-center">
                <Mail className="w-12 h-12 mb-4 opacity-20" />
                <p>Keine Tickets gefunden</p>
            </div>
        )
    }

    return (
        <div className="divide-y divide-gray-100 flex flex-col h-full bg-white">
            {tickets.map((ticket) => (
                <div
                    key={ticket.id}
                    onClick={() => onSelect(ticket)}
                    className={`p-4 cursor-pointer hover:bg-gray-50 transition-all border-l-4 ${selectedId === ticket.id
                            ? 'bg-blue-50/50 border-blue-500'
                            : 'border-transparent'
                        }`}
                >
                    <div className="flex justify-between items-start mb-1">
                        <div className="flex items-center gap-2">
                            <div className={`w-2 h-2 rounded-full ${ticket.status === 'OPEN' ? 'bg-blue-500' : 'bg-gray-300'}`}></div>
                            <span className={`text-sm font-semibold truncate max-w-[180px] ${ticket.status === 'OPEN' ? 'text-gray-900' : 'text-gray-600'}`}>
                                {ticket.customer?.name || ticket.customerEmail || 'Unbekannt'}
                            </span>
                        </div>
                        <span className="text-[10px] text-gray-400 whitespace-nowrap">
                            {formatDistanceToNow(new Date(ticket.updatedAt || ticket.createdAt), { addSuffix: true, locale: de })}
                        </span>
                    </div>

                    <h4 className={`text-xs mb-1.5 line-clamp-1 ${selectedId === ticket.id ? 'font-bold text-gray-900' : 'font-medium text-gray-700'}`}>
                        {ticket.subject || 'Kein Betreff'}
                    </h4>

                    <p className="text-[11px] text-gray-500 line-clamp-2 leading-relaxed mb-2">
                        {ticket.messages?.[0]?.content || 'Keine Nachrichtenvorschau verfügbar...'}
                    </p>

                    <div className="flex items-center gap-2">
                        <ChannelIcon type="email" />
                        {ticket.priority && (
                            <Badge variant="outline" className={`text-[10px] h-5 px-1.5 ${ticket.priority === 'HIGH' ? 'bg-red-50 text-red-600 border-red-100' : 'bg-gray-50 text-gray-500 border-gray-100'}`}>
                                {ticket.priority}
                            </Badge>
                        )}
                        <Badge variant="outline" className="text-[10px] h-5 px-1.5 bg-gray-50 text-gray-500 border-gray-100">
                            #{ticket.orderNumber || 'GEN'}
                        </Badge>
                    </div>
                </div>
            ))}
        </div>
    )
}

function ChannelIcon({ type }: { type: string }) {
    // Mock mapping
    const icons = {
        email: <Mail className="w-3 h-3 text-gray-400" />,
        chat: <MessageCircle className="w-3 h-3 text-blue-400" />,
        phone: <Phone className="w-3 h-3 text-green-400" />
    }
    return icons[type as keyof typeof icons] || icons.email
}
