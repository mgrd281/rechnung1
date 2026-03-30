import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'

export const dynamic = 'force-dynamic'

// Access global storage for invoice data
declare global {
    var allInvoices: any[] | undefined
}

// Lazy initialization of OpenAI client (deferred to runtime)
let openaiClient: OpenAI | null = null

function getOpenAIClient(): OpenAI {
    if (!openaiClient) {
        if (!process.env.OPENAI_API_KEY) {
            throw new Error('OPENAI_API_KEY environment variable is not set')
        }
        openaiClient = new OpenAI({
            apiKey: process.env.OPENAI_API_KEY,
        })
    }
    return openaiClient
}

import { loadInvoicesFromDisk } from '@/lib/server-storage'

// Helper function to get invoice statistics
function getInvoiceStats() {
    // Always load fresh data from disk to ensure accuracy
    try {
        global.allInvoices = loadInvoicesFromDisk()
        console.log(`💬 Chat API loaded ${global.allInvoices.length} invoices from disk`)
    } catch (e) {
        console.warn('Failed to load invoices from disk for chat stats:', e)
        global.allInvoices = []
    }

    const invoices = global.allInvoices || []

    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const last7Days = new Date(today)
    last7Days.setDate(last7Days.getDate() - 7)

    const last30Days = new Date(today)
    last30Days.setDate(last30Days.getDate() - 30)

    // Calculate statistics
    const todayInvoices = invoices.filter(inv => {
        const invDate = new Date(inv.date)
        invDate.setHours(0, 0, 0, 0)
        return invDate.getTime() === today.getTime()
    })

    const last7DaysInvoices = invoices.filter(inv => {
        const invDate = new Date(inv.date)
        return invDate >= last7Days
    })

    const last30DaysInvoices = invoices.filter(inv => {
        const invDate = new Date(inv.date)
        return invDate >= last30Days
    })

    // Group by product
    const productSales: Record<string, { count: number, total: number }> = {}
    invoices.forEach(inv => {
        if (inv.items) {
            inv.items.forEach((item: any) => {
                const name = item.description || 'Unbekannt'
                if (!productSales[name]) {
                    productSales[name] = { count: 0, total: 0 }
                }
                productSales[name].count += item.quantity || 1
                productSales[name].total += item.total || 0
            })
        }
    })

    // Group by status
    const statusCounts: Record<string, number> = {}
    invoices.forEach(inv => {
        const status = inv.status || 'Unbekannt'
        statusCounts[status] = (statusCounts[status] || 0) + 1
    })

    // Calculate tax totals
    const totalTax = invoices.reduce((sum, inv) => sum + (inv.taxAmount || 0), 0)
    const totalRevenue = invoices.reduce((sum, inv) => sum + (inv.total || 0), 0)

    // Monthly breakdown
    const monthlyData: Record<string, { revenue: number, tax: number, count: number }> = {}
    invoices.forEach(inv => {
        const date = new Date(inv.date)
        const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
        if (!monthlyData[monthKey]) {
            monthlyData[monthKey] = { revenue: 0, tax: 0, count: 0 }
        }
        monthlyData[monthKey].revenue += inv.total || 0
        monthlyData[monthKey].tax += inv.taxAmount || 0
        monthlyData[monthKey].count += 1
    })

    return {
        totalInvoices: invoices.length,
        todayCount: todayInvoices.length,
        todayRevenue: todayInvoices.reduce((sum, inv) => sum + (inv.total || 0), 0),
        last7DaysCount: last7DaysInvoices.length,
        last7DaysRevenue: last7DaysInvoices.reduce((sum, inv) => sum + (inv.total || 0), 0),
        last30DaysCount: last30DaysInvoices.length,
        last30DaysRevenue: last30DaysInvoices.reduce((sum, inv) => sum + (inv.total || 0), 0),
        totalRevenue,
        totalTax,
        productSales,
        statusCounts,
        monthlyData,
        recentInvoices: invoices.slice(-10).map(inv => ({
            number: inv.number,
            customer: inv.customerName || inv.customer?.name || 'Unbekannt',
            total: inv.total,
            status: inv.status,
            date: inv.date,
            items: inv.items?.map((i: any) => i.description).join(', ')
        }))
    }
}

export async function POST(request: NextRequest) {
    try {
        const { message, conversationHistory = [] } = await request.json()

        if (!message) {
            return NextResponse.json({ error: 'Message is required' }, { status: 400 })
        }

        // Get current invoice statistics
        const stats = getInvoiceStats()

        // Build system prompt with context
        const systemPrompt = `Du bist ein intelligenter Geschäftsassistent für ein Rechnungssystem eines Online-Shops, der digitale Produkte wie Software-Lizenzen, Game Keys und ähnliches verkauft.

AKTUELLE GESCHÄFTSDATEN (Stand: ${new Date().toLocaleDateString('de-DE')} ${new Date().toLocaleTimeString('de-DE')}):

📊 ÜBERSICHT:
- Gesamtanzahl Rechnungen: ${stats.totalInvoices}
- Gesamtumsatz: €${stats.totalRevenue.toFixed(2)}
- Gesamte MwSt.: €${stats.totalTax.toFixed(2)}

📅 ZEITRAUM-STATISTIKEN:
- Heute: ${stats.todayCount} Rechnungen, €${stats.todayRevenue.toFixed(2)} Umsatz
- Letzte 7 Tage: ${stats.last7DaysCount} Rechnungen, €${stats.last7DaysRevenue.toFixed(2)} Umsatz
- Letzte 30 Tage: ${stats.last30DaysCount} Rechnungen, €${stats.last30DaysRevenue.toFixed(2)} Umsatz

📦 PRODUKTVERKÄUFE (Top-Produkte):
${Object.entries(stats.productSales)
                .sort((a, b) => b[1].total - a[1].total)
                .slice(0, 10)
                .map(([name, data]) => `- ${name}: ${data.count}x verkauft, €${data.total.toFixed(2)}`)
                .join('\n')}

📈 STATUS-VERTEILUNG:
${Object.entries(stats.statusCounts)
                .map(([status, count]) => `- ${status}: ${count} Rechnungen`)
                .join('\n')}

📆 MONATLICHE ÜBERSICHT:
${Object.entries(stats.monthlyData)
                .sort((a, b) => b[0].localeCompare(a[0]))
                .slice(0, 6)
                .map(([month, data]) => `- ${month}: ${data.count} Rechnungen, €${data.revenue.toFixed(2)} Umsatz, €${data.tax.toFixed(2)} MwSt.`)
                .join('\n')}

📋 LETZTE RECHNUNGEN:
${stats.recentInvoices.map(inv =>
                    `- ${inv.number}: ${inv.customer}, €${inv.total?.toFixed(2) || '0.00'}, ${inv.status}, ${inv.items?.substring(0, 50) || 'Keine Artikel'}`
                ).join('\n')}

DEINE AUFGABEN:
1. Beantworte Fragen zu Verkäufen, Umsätzen und Statistiken basierend auf den obigen Daten.
2. Analysiere Trends und gib Geschäftsempfehlungen.
3. Hilf beim Verfassen professioneller Kundennachrichten.
4. Erkenne mögliche Probleme oder Auffälligkeiten in den Daten.
5. Berechne Steuern und Finanzberichte.

WICHTIG - SPRACHE & KOMMUNIKATION:
- **ANTWORTE IMMER AUF DEUTSCH.**
- Egal in welcher Sprache der Nutzer fragt, antworte immer auf Deutsch.
- Sei professionell, höflich und lösungsorientiert.
- Formatiere Zahlen immer mit € und 2 Dezimalstellen.
- Nutze Emojis sparsam für bessere Lesbarkeit.
- Wenn du keine Daten hast, sage das ehrlich.`

        // Build messages array
        const messages: OpenAI.ChatCompletionMessageParam[] = [
            { role: 'system', content: systemPrompt },
            ...conversationHistory.map((msg: any) => ({
                role: msg.role as 'user' | 'assistant',
                content: msg.content
            })),
            { role: 'user', content: message }
        ]

        // Call OpenAI API
        const completion = await getOpenAIClient().chat.completions.create({
            model: 'gpt-4o-mini',
            messages,
            temperature: 0.7,
            max_tokens: 1500,
        })

        const reply = completion.choices[0]?.message?.content || 'Entschuldigung, ich konnte keine Antwort generieren.'

        return NextResponse.json({
            success: true,
            reply,
            stats: {
                totalInvoices: stats.totalInvoices,
                totalRevenue: stats.totalRevenue,
                todayRevenue: stats.todayRevenue
            }
        })

    } catch (error: any) {
        console.error('Chat API Error:', error)
        return NextResponse.json(
            {
                error: 'Failed to process chat request',
                details: error.message
            },
            { status: 500 }
        )
    }
}
