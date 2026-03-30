import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'

export const dynamic = 'force-dynamic'

// Lazy initialization of OpenAI client
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

export const maxDuration = 60; // Allow up to 60 seconds for AI processing


export async function POST(request: NextRequest) {
    try {
        const { product } = await request.json()

        if (!product) {
            return NextResponse.json({ error: 'Product data is required' }, { status: 400 })
        }

        if (!process.env.OPENAI_API_KEY) {
            return NextResponse.json({ error: 'OpenAI API key is not configured' }, { status: 500 })
        }

        // Strip HTML from description to force AI to focus on content, not structure
        const cleanDescription = product.description ? product.description.replace(/<[^>]*>/g, ' ') : ''

        const prompt = `Du bist ein erstklassiger SEO-Copywriter. Deine Aufgabe ist es, eine KOMPLETT NEUE Produktbeschreibung zu schreiben.

WICHTIG:
- Du darfst KEINE Sätze aus dem Originaltext kopieren.
- Schreibe den Text von Grund auf neu.
- Nutze nur die Fakten (Spezifikationen, Features), aber formuliere alles neu.
- Der Stil muss verkaufsfördernd, professionell und für den deutschen Markt optimiert sein.

Antworte AUSSCHLIESSLICH mit einem gültigen JSON-Objekt.

Struktur des JSON-Objekts:
1. "title": Ein neuer, optimierter Titel (max 70 Zeichen).
2. "description": Eine HTML-formatierte Beschreibung (NUR <h3>, <ul>, <li>, <p>, <strong> erlaubt).
   - Aufbau:
     - <h3>Subheadline (Der Hauptnutzen in einem Satz)</h3>
     - <p>Einleitung (Warum dieses Produkt? USP hervorheben)</p>
     - <h3>Vorteile</h3>
     - <ul><li><strong>Vorteil 1</strong>: Erklärung</li>...</ul>
     - <h3>Funktionen</h3>
     - <ul><li>Feature 1</li>...</ul>
     - <h3>Fazit</h3>
     - <p>Zusammenfassung und Kaufempfehlung</p>
3. "tags": Array mit 5-10 Tags.
4. "metaTitle": SEO Titel.
5. "metaDescription": SEO Beschreibung.
6. "handle": URL-Slug.
7. "variantMetafields": Objekt mit Google Shopping Feldern:
   - "age_group": "adult", "kids", "toddler", "infant" oder "newborn" (meist "adult").
   - "condition": "new", "refurbished" oder "used" (meist "new").
   - "gender": "male", "female" oder "unisex" (meist "unisex").
   - "mpn": Herstellernummer (falls gefunden).
   - "size_type": "regular" (oder leer).
   - "size_system": "DE" (oder leer).
   - "custom_label_0": Leer oder spezifisches Label.
   - "custom_label_1": Leer.
   - "custom_label_2": Leer.
   - "custom_label_3": Leer.
   - "custom_label_4": Leer.
8. "productMetafields": Objekt mit speziellen Produktfeldern:
   - "emoji_benefits": Kurze Liste von Vorteilen mit Emojis getrennt durch " | " (z.B. "🚀 Sofort-Download | 🔒 Sicher | 🇩🇪 Support").
   - "collapsible_row_content_1": HTML-Inhalt für einen ausklappbaren Reiter (z.B. "Installationsanleitung" oder "Systemanforderungen").
9. "shipping": Objekt mit Versanddaten:
   - "hs_code": HS-Code für den Zoll (z.B. "852349" für Software).
   - "origin_country": ISO 2-Code des Herkunftslandes (z.B. "US" oder "DE").
   - "weight": Gewicht in kg (0 für rein digitale Produkte).
10. "image_alt_text": Ein SEO-optimierter Alt-Text für das Hauptbild (max 120 Zeichen).
11. "faq": HTML-Inhalt für einen weiteren ausklappbaren Reiter "Häufige Fragen" (3-4 relevante Fragen & Antworten).

Produktdaten (Quelle):
Name: ${product.title}
Beschreibung (Rohdaten): ${cleanDescription}
Specs: ${product.specifications || 'N/A'}
Features: ${product.features || 'N/A'}
Kategorie: ${product.product_type || 'General'}

Erstelle jetzt das JSON-Objekt mit dem NEUEN Text.`

        const openai = getOpenAIClient()
        const completion = await openai.chat.completions.create({
            messages: [{ role: 'user', content: prompt }],
            model: 'gpt-4o',
            response_format: { type: "json_object" } // Force JSON mode
        })

        const content = completion.choices[0].message.content
        if (!content) throw new Error('No content received from AI')

        const aiData = JSON.parse(content)

        return NextResponse.json({
            success: true,
            enhancedText: aiData.description,
            newTitle: aiData.title,
            tags: aiData.tags,
            metaTitle: aiData.metaTitle,
            metaDescription: aiData.metaDescription,
            handle: aiData.handle,
            variantMetafields: aiData.variantMetafields,
            productMetafields: aiData.productMetafields,
            shipping: aiData.shipping,
            image_alt_text: aiData.image_alt_text,
            faq: aiData.faq
        })

    } catch (error: any) {
        console.error('Error enhancing product with AI:', error)
        const errorMessage = error.response?.data?.error?.message || error.message || 'Failed to enhance product'
        return NextResponse.json({ error: errorMessage }, { status: 500 })
    }
}
