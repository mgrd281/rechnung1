'use client'

import { useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
    MessageSquare,
    Send,
    ArrowLeft,
    Bot,
    User,
    Sparkles,
    TrendingUp,
    FileText,
    Calculator,
    AlertTriangle,
    Mail,
    Package,
    Loader2,
    Trash2
} from 'lucide-react'

interface Message {
    id: string
    role: 'user' | 'assistant'
    content: string
    timestamp: Date
}

interface QuickPrompt {
    icon: React.ReactNode
    label: string
    prompt: string
    color: string
}

const quickPrompts: QuickPrompt[] = [
    {
        icon: <TrendingUp className="h-4 w-4" />,
        label: 'Tagesumsatz',
        prompt: 'Gib mir eine Zusammenfassung der heutigen Verkäufe für alle Produkte.',
        color: 'bg-green-100 text-green-700 hover:bg-green-200'
    },
    {
        icon: <FileText className="h-4 w-4" />,
        label: '7-Tage Analyse',
        prompt: 'Analysiere die Verkäufe von digitalen Schlüsseln der letzten 7 Tage.',
        color: 'bg-blue-100 text-blue-700 hover:bg-blue-200'
    },
    {
        icon: <Calculator className="h-4 w-4" />,
        label: 'Steuerübersicht',
        prompt: 'Wie hoch ist die geschuldete Steuer für diesen Monat?',
        color: 'bg-purple-100 text-purple-700 hover:bg-purple-200'
    },
    {
        icon: <AlertTriangle className="h-4 w-4" />,
        label: 'Verdächtige Bestellungen',
        prompt: 'Gibt es verdächtige Bestellungen, auf die ich achten sollte?',
        color: 'bg-red-100 text-red-700 hover:bg-red-200'
    },
    {
        icon: <Mail className="h-4 w-4" />,
        label: 'Kundenmail',
        prompt: 'Verfasse eine professionelle E-Mail an einen Kunden, der seinen PlayStation-Key nicht aktivieren konnte.',
        color: 'bg-orange-100 text-orange-700 hover:bg-orange-200'
    },
    {
        icon: <Package className="h-4 w-4" />,
        label: 'Top Produkte',
        prompt: 'Welche Produkte haben bisher den höchsten Gewinn erzielt?',
        color: 'bg-indigo-100 text-indigo-700 hover:bg-indigo-200'
    }
]

export default function ChatPage() {
    const [messages, setMessages] = useState<Message[]>([])
    const [input, setInput] = useState('')
    const [isLoading, setIsLoading] = useState(false)
    const [stats, setStats] = useState<any>(null)
    const messagesEndRef = useRef<HTMLDivElement>(null)
    const inputRef = useRef<HTMLTextAreaElement>(null)

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }

    useEffect(() => {
        scrollToBottom()
    }, [messages])

    useEffect(() => {
        // Add welcome message
        if (messages.length === 0) {
            setMessages([{
                id: 'welcome',
                role: 'assistant',
                content: `Hallo! 👋 Ich bin Ihr intelligenter Geschäftsassistent.

Ich kann Ihnen helfen bei:
• 📊 Verkaufs- und Umsatzanalysen
• 📈 Trends und Statistiken
• 💰 Steuerberechnungen und Finanzberichten
• ⚠️ Erkennung auffälliger Bestellungen
• ✉️ Verfassen professioneller Kunden-E-Mails
• 📦 Bestands- und Produktberichten

Wählen Sie eine der Schnellaktionen unten oder stellen Sie einfach Ihre Frage!`,
                timestamp: new Date()
            }])
        }
    }, [])

    const sendMessage = async (messageText?: string) => {
        const text = messageText || input.trim()
        if (!text || isLoading) return

        const userMessage: Message = {
            id: `user-${Date.now()}`,
            role: 'user',
            content: text,
            timestamp: new Date()
        }

        setMessages(prev => [...prev, userMessage])
        setInput('')
        setIsLoading(true)

        try {
            const response = await fetch('/api/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    message: text,
                    conversationHistory: messages
                        .filter(m => m.id !== 'welcome')
                        .map(m => ({ role: m.role, content: m.content }))
                })
            })

            const data = await response.json()

            if (data.success) {
                const assistantMessage: Message = {
                    id: `assistant-${Date.now()}`,
                    role: 'assistant',
                    content: data.reply,
                    timestamp: new Date()
                }
                setMessages(prev => [...prev, assistantMessage])
                if (data.stats) setStats(data.stats)
            } else {
                throw new Error(data.error || 'Unknown error')
            }
        } catch (error: any) {
            console.error('Chat error:', error)
            const errorMessage: Message = {
                id: `error-${Date.now()}`,
                role: 'assistant',
                content: `❌ Ein Fehler ist aufgetreten: ${error.message}. Bitte versuchen Sie es erneut.`,
                timestamp: new Date()
            }
            setMessages(prev => [...prev, errorMessage])
        } finally {
            setIsLoading(false)
        }
    }

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault()
            sendMessage()
        }
    }

    const clearChat = () => {
        setMessages([{
            id: 'welcome',
            role: 'assistant',
            content: `Hallo! 👋 Der Chatverlauf wurde geleert. Wie kann ich Ihnen helfen?`,
            timestamp: new Date()
        }])
    }

    const formatMessage = (content: string) => {
        // Convert markdown-like formatting to HTML
        return content
            .split('\n')
            .map((line, i) => {
                // Handle bullet points
                if (line.startsWith('• ') || line.startsWith('- ')) {
                    return `<li class="ml-4">${line.substring(2)}</li>`
                }
                // Handle numbered lists
                if (/^\d+\.\s/.test(line)) {
                    return `<li class="ml-4">${line.substring(line.indexOf(' ') + 1)}</li>`
                }
                // Handle headers
                if (line.startsWith('## ')) {
                    return `<h3 class="font-bold text-lg mt-3 mb-1">${line.substring(3)}</h3>`
                }
                if (line.startsWith('# ')) {
                    return `<h2 class="font-bold text-xl mt-4 mb-2">${line.substring(2)}</h2>`
                }
                // Handle bold
                line = line.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                // Handle code
                line = line.replace(/`(.*?)`/g, '<code class="bg-gray-100 px-1 rounded">$1</code>')

                return line ? `<p class="mb-1">${line}</p>` : '<br/>'
            })
            .join('')
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-50">
            {/* Header */}
            <header className="bg-white/80 backdrop-blur-md shadow-sm border-b sticky top-0 z-50">
                <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center py-4">
                        <div className="flex items-center">
                            <Link href="/dashboard">
                                <Button variant="ghost" size="sm" className="mr-4">
                                    <ArrowLeft className="h-4 w-4 mr-2" />
                                    Dashboard
                                </Button>
                            </Link>
                            <div className="flex items-center">
                                <div className="relative">
                                    <Bot className="h-8 w-8 text-blue-600" />
                                    <Sparkles className="h-4 w-4 text-yellow-500 absolute -top-1 -right-1" />
                                </div>
                                <div className="ml-3">
                                    <h1 className="text-xl font-bold text-gray-900">Intelligenter Geschäftsassistent</h1>
                                    <p className="text-xs text-gray-500">AI Business Assistant • GPT-4</p>
                                </div>
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            {stats && (
                                <div className="hidden md:flex items-center gap-4 text-sm text-gray-600 bg-gray-100 px-4 py-2 rounded-full">
                                    <span>📊 {stats.totalInvoices} Rechnungen</span>
                                    <span className="text-gray-300">|</span>
                                    <span>💰 €{stats.totalRevenue?.toFixed(2)}</span>
                                </div>
                            )}
                            <Button variant="outline" size="sm" onClick={clearChat}>
                                <Trash2 className="h-4 w-4 mr-2" />
                                Löschen
                            </Button>
                        </div>
                    </div>
                </div>
            </header>

            {/* Main Chat Area */}
            <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
                <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                    {/* Quick Prompts Sidebar */}
                    <div className="lg:col-span-1 order-2 lg:order-1">
                        <Card className="sticky top-24">
                            <CardHeader className="pb-3">
                                <CardTitle className="text-sm font-medium text-gray-700">
                                    ⚡ Schnellauswahl
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-2">
                                {quickPrompts.map((prompt, index) => (
                                    <button
                                        key={index}
                                        onClick={() => sendMessage(prompt.prompt)}
                                        disabled={isLoading}
                                        className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all ${prompt.color} disabled:opacity-50`}
                                    >
                                        {prompt.icon}
                                        <span>{prompt.label}</span>
                                    </button>
                                ))}
                            </CardContent>
                        </Card>
                    </div>

                    {/* Chat Messages */}
                    <div className="lg:col-span-3 order-1 lg:order-2">
                        <Card className="min-h-[600px] flex flex-col">
                            {/* Messages Container */}
                            <CardContent className="flex-1 overflow-y-auto p-4 space-y-4 max-h-[500px]">
                                {messages.map((message) => (
                                    <div
                                        key={message.id}
                                        className={`flex items-start gap-3 ${message.role === 'user' ? 'flex-row-reverse' : ''
                                            }`}
                                    >
                                        {/* Avatar */}
                                        <div
                                            className={`flex-shrink-0 w-9 h-9 rounded-full flex items-center justify-center ${message.role === 'user'
                                                ? 'bg-blue-600 text-white'
                                                : 'bg-gradient-to-br from-purple-500 to-blue-500 text-white'
                                                }`}
                                        >
                                            {message.role === 'user' ? (
                                                <User className="h-5 w-5" />
                                            ) : (
                                                <Bot className="h-5 w-5" />
                                            )}
                                        </div>

                                        {/* Message Bubble */}
                                        <div
                                            className={`max-w-[80%] rounded-2xl px-4 py-3 ${message.role === 'user'
                                                ? 'bg-blue-600 text-white rounded-tr-sm'
                                                : 'bg-white shadow-md border border-gray-100 rounded-tl-sm'
                                                }`}
                                        >
                                            <div
                                                className={`text-sm leading-relaxed ${message.role === 'assistant' ? 'text-gray-800' : ''
                                                    }`}
                                                dangerouslySetInnerHTML={{ __html: formatMessage(message.content) }}
                                            />
                                            <p
                                                className={`text-xs mt-2 ${message.role === 'user' ? 'text-blue-200' : 'text-gray-400'
                                                    }`}
                                            >
                                                {message.timestamp.toLocaleTimeString('de-DE', {
                                                    hour: '2-digit',
                                                    minute: '2-digit'
                                                })}
                                            </p>
                                        </div>
                                    </div>
                                ))}

                                {/* Loading Indicator */}
                                {isLoading && (
                                    <div className="flex items-start gap-3">
                                        <div className="flex-shrink-0 w-9 h-9 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 text-white flex items-center justify-center">
                                            <Bot className="h-5 w-5" />
                                        </div>
                                        <div className="bg-white shadow-md border border-gray-100 rounded-2xl rounded-tl-sm px-4 py-3">
                                            <div className="flex items-center gap-2 text-gray-500">
                                                <Loader2 className="h-4 w-4 animate-spin" />
                                                <span className="text-sm">Analysiere...</span>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                <div ref={messagesEndRef} />
                            </CardContent>

                            {/* Input Area */}
                            <div className="border-t bg-gray-50/50 p-4">
                                <div className="flex items-end gap-3">
                                    <div className="flex-1 relative">
                                        <textarea
                                            ref={inputRef}
                                            value={input}
                                            onChange={(e) => setInput(e.target.value)}
                                            onKeyDown={handleKeyDown}
                                            placeholder="Stellen Sie Ihre Frage hier... (z.B.: Wie hoch ist der Umsatz heute?)"
                                            className="w-full resize-none rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent min-h-[50px] max-h-[150px]"
                                            rows={1}
                                            disabled={isLoading}
                                        />
                                    </div>
                                    <Button
                                        onClick={() => sendMessage()}
                                        disabled={!input.trim() || isLoading}
                                        className="h-[50px] px-5 bg-blue-600 hover:bg-blue-700 rounded-xl"
                                    >
                                        {isLoading ? (
                                            <Loader2 className="h-5 w-5 animate-spin" />
                                        ) : (
                                            <Send className="h-5 w-5" />
                                        )}
                                    </Button>
                                </div>
                                <p className="text-xs text-gray-400 mt-2 text-center">
                                    Powered by GPT-4 • Sie können auf Deutsch, Englisch oder Arabisch fragen
                                </p>
                            </div>
                        </Card>
                    </div>
                </div>
            </main>
        </div>
    )
}
