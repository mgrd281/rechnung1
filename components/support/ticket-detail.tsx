'use client'

import React, { useState } from 'react'
import { Send, Sparkles, MoreHorizontal, User, Mail, ShoppingBag, Shield, Clock, Reply, CheckCircle2, XCircle, Search } from 'lucide-react'
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import {
    DropdownMenu,
    DropdownMenuTrigger,
    DropdownMenuContent,
    DropdownMenuItem
} from "@/components/ui/dropdown-menu"
import { formatDistanceToNow } from 'date-fns'
import { de } from 'date-fns/locale'

interface TicketDetailProps {
    ticket: any
    onUpdate: (id: string, updates: any) => void
}

export function TicketDetail({ ticket, onUpdate }: TicketDetailProps) {
    const [replyText, setReplyText] = useState('')
    const [isGenerating, setIsGenerating] = useState(false)

    if (!ticket) {
        return (
            <div className="flex-1 flex flex-col items-center justify-center bg-white text-gray-400">
                <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-4 border border-gray-100">
                    <Search className="w-8 h-8 opacity-20" />
                </div>
                <p className="font-medium">Wählen Sie ein Ticket aus</p>
            </div>
        )
    }

    const handleGenerate = () => {
        setIsGenerating(true)
        setTimeout(() => {
            setReplyText("Guten Tag,\n\nvielen Dank für Ihre Nachricht. Ich habe Ihre Bestellung geprüft und kann bestätigen, dass...")
            setIsGenerating(false)
        }, 800)
    }

    return (
        <div className="flex-1 flex h-full bg-white relative">
            {/* Center: Conversation */}
            <div className="flex-1 flex flex-col min-w-0 border-r border-gray-200">
                {/* Header */}
                <div className="h-[60px] border-b border-gray-200 flex items-center justify-between px-6 bg-white shrink-0">
                    <div className="min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                            <span className="font-bold text-gray-900 truncate">{ticket.subject}</span>
                            <Badge variant="outline" className="bg-gray-100 text-gray-600 border-gray-200">#{ticket.orderNumber || 'GEN'}</Badge>
                        </div>
                        <div className="text-xs text-gray-500 flex items-center gap-1">
                            <span>via E-Mail</span>
                            <span>•</span>
                            <span>{new Date(ticket.createdAt).toLocaleString()}</span>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <Button variant="outline" size="sm" onClick={() => onUpdate(ticket.id, { status: 'CLOSED' })}>
                            <CheckCircle2 className="w-4 h-4 mr-2" />
                            Lösen
                        </Button>
                        <Button variant="ghost" size="icon">
                            <MoreHorizontal className="w-4 h-4 text-gray-500" />
                        </Button>
                    </div>
                </div>

                {/* Messages */}
                <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-gray-50/30">
                    {/* Customer Message */}
                    {ticket.messages?.[0] && (
                        <div className="flex gap-4 max-w-3xl">
                            <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold shrink-0">
                                {ticket.customer?.name?.[0] || 'K'}
                            </div>
                            <div>
                                <div className="flex items-baseline gap-2 mb-1">
                                    <span className="font-bold text-gray-900">{ticket.customer?.name || ticket.customerEmail}</span>
                                    <span className="text-xs text-gray-400">
                                        {formatDistanceToNow(new Date(ticket.createdAt), { addSuffix: true, locale: de })}
                                    </span>
                                </div>
                                <div className="bg-white border border-gray-200 p-4 rounded-xl rounded-tl-none shadow-sm text-gray-800 leading-relaxed text-sm">
                                    {ticket.messages[0].content}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Replies */}
                    {ticket.messages?.slice(1).map((msg: any, i: number) => (
                        <div key={i} className="flex gap-4 max-w-3xl ml-auto justify-end">
                            <div className="flex flex-col items-end">
                                <div className="flex items-baseline gap-2 mb-1">
                                    <span className="text-xs text-gray-400">Gerade eben</span>
                                    <span className="font-bold text-gray-900">Support</span>
                                </div>
                                <div className="bg-blue-50 border border-blue-100 p-4 rounded-xl rounded-tr-none text-blue-900 leading-relaxed text-sm shadow-sm">
                                    {msg.content}
                                </div>
                            </div>
                            <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center text-white shrink-0">
                                <Reply className="w-5 h-5" />
                            </div>
                        </div>
                    ))}
                </div>

                {/* Reply Box */}
                <div className="p-4 bg-white border-t border-gray-200">
                    <div className="relative">
                        {replyText === '' && (
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={handleGenerate}
                                className="absolute left-2 top-2 z-10 bg-white/80 backdrop-blur hover:bg-white text-violet-600 border border-violet-100 shadow-sm transition-all"
                            >
                                <Sparkles className={`w-3 h-3 mr-2 ${isGenerating ? 'animate-spin' : ''}`} />
                                {isGenerating ? 'Generiere...' : 'AI Antwort vorschlagen'}
                            </Button>
                        )}
                        <Textarea
                            value={replyText}
                            onChange={(e) => setReplyText(e.target.value)}
                            className="min-h-[120px] pb-12 resize-none bg-gray-50 focus:bg-white transition-colors border-gray-200 pt-10"
                            placeholder="Antwort verfassen..."
                        />
                        <div className="absolute bottom-3 right-3 flex gap-2">
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                                <MoreHorizontal className="w-4 h-4 text-gray-400" />
                            </Button>
                            <Button size="sm" className="bg-gray-900 hover:bg-black text-white" disabled={!replyText.trim()}>
                                Senden <Send className="w-3 h-3 ml-2" />
                            </Button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Right: Customer 360 */}
            <div className="w-[300px] bg-white flex flex-col shrink-0">
                <div className="h-[60px] border-b border-gray-200 flex items-center px-6">
                    <span className="font-semibold text-gray-900">Kundenprofil</span>
                </div>

                <div className="flex-1 overflow-y-auto p-6 space-y-8">
                    {/* Header Info */}
                    <div className="text-center">
                        <div className="w-20 h-20 bg-gray-100 rounded-full mx-auto mb-3 flex items-center justify-center text-2xl font-bold text-gray-400">
                            {ticket.customer?.name?.[0] || 'K'}
                        </div>
                        <h3 className="font-bold text-gray-900 text-lg">{ticket.customer?.name || 'Unbekannter Kunde'}</h3>
                        <p className="text-sm text-gray-500 flex items-center justify-center gap-1 mt-1">
                            <Mail className="w-3 h-3" />
                            {ticket.customerEmail}
                        </p>
                        <div className="flex justify-center gap-2 mt-4">
                            <Badge variant="secondary" className="bg-emerald-100 text-emerald-700 hover:bg-emerald-200">
                                VIP
                            </Badge>
                            <Badge variant="outline" className="border-gray-200 text-gray-600">
                                Deutsch
                            </Badge>
                        </div>
                    </div>

                    <Separator />

                    {/* Stats */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="bg-gray-50 p-3 rounded-lg text-center">
                            <div className="text-xs text-gray-500 uppercase tracking-wider mb-1">Umsatz</div>
                            <div className="font-bold text-gray-900">€0.00</div>
                        </div>
                        <div className="bg-gray-50 p-3 rounded-lg text-center">
                            <div className="text-xs text-gray-500 uppercase tracking-wider mb-1">Bestellungen</div>
                            <div className="font-bold text-gray-900">0</div>
                        </div>
                    </div>

                    {/* Order History Mock */}
                    <div>
                        <h4 className="font-bold text-sm text-gray-900 mb-3 flex items-center gap-2">
                            <ShoppingBag className="w-4 h-4 text-gray-400" />
                            Letzte Bestellungen
                        </h4>
                        <div className="space-y-3">
                            <div className="flex items-center justify-between text-sm p-3 border border-gray-100 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer">
                                <div>
                                    <div className="font-medium text-gray-900">#{ticket.orderNumber || '9999'}</div>
                                    <div className="text-xs text-gray-500">Vor 2 Tagen</div>
                                </div>
                                <Badge className="bg-green-100 text-green-700 hover:bg-green-200 h-5 text-[10px]">Paid</Badge>
                            </div>
                            <div className="flex items-center justify-between text-sm p-3 border border-gray-100 rounded-lg opacity-60">
                                <div>
                                    <div className="font-medium text-gray-900">#8291</div>
                                    <div className="text-xs text-gray-500">Vor 3 Monaten</div>
                                </div>
                                <Badge variant="secondary" className="bg-gray-100 text-gray-600 h-5 text-[10px]">Done</Badge>
                            </div>
                        </div>
                    </div>

                    {/* Actions */}
                    <div>
                        <h4 className="font-bold text-sm text-gray-900 mb-3 flex items-center gap-2">
                            <Shield className="w-4 h-4 text-gray-400" />
                            Aktionen
                        </h4>
                        <div className="space-y-2">
                            <Button variant="outline" className="w-full justify-start text-gray-600">
                                <Reply className="w-4 h-4 mr-2" />
                                Rechnung senden
                            </Button>
                            <Button variant="outline" className="w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-50 border-red-100">
                                <XCircle className="w-4 h-4 mr-2" />
                                Nutzer blockieren
                            </Button>
                        </div>
                    </div>

                </div>
            </div>
        </div>
    )
}
