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

export async function POST(request: NextRequest) {
    try {
        const { text, type } = await request.json()

        if (!text) {
            return NextResponse.json({ error: 'Text is required' }, { status: 400 })
        }

        if (!process.env.OPENAI_API_KEY) {
            return NextResponse.json({ error: 'OpenAI API key is not configured' }, { status: 500 })
        }

        let prompt = ''
        if (type === 'description') {
            prompt = `Rewrite the following product description to be more engaging, sales-oriented, and SEO-friendly. Keep the same key information but make it sound professional and persuasive. Use HTML formatting (paragraphs, bullet points) for better readability. Language: German.

            Original Text:
            ${text}`
        } else {
            // Default rewrite
            prompt = `Rewrite the following text to be more professional and clear. Language: German.
            
            Original Text:
            ${text}`
        }

        const openai = getOpenAIClient()
        let completion;
        try {
            completion = await openai.chat.completions.create({
                messages: [{ role: 'user', content: prompt }],
                model: 'gpt-4o',
            })
        } catch (e) {
            console.warn('GPT-4o failed, falling back to gpt-4-turbo...', e)
            try {
                completion = await openai.chat.completions.create({
                    messages: [{ role: 'user', content: prompt }],
                    model: 'gpt-4-turbo',
                })
            } catch (e2) {
                console.warn('GPT-4-turbo failed, falling back to gpt-3.5-turbo...', e2)
                completion = await openai.chat.completions.create({
                    messages: [{ role: 'user', content: prompt }],
                    model: 'gpt-3.5-turbo',
                })
            }
        }

        const rewrittenText = completion.choices[0].message.content

        return NextResponse.json({ success: true, text: rewrittenText })

    } catch (error) {
        console.error('Error rewriting text with AI:', error)
        return NextResponse.json({ error: 'Failed to rewrite text' }, { status: 500 })
    }
}
