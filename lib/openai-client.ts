import OpenAI from 'openai'

/**
 * Simple wrapper for OpenAI API.
 * Uses OPENAI_API_KEY from environment.
 */
export class OpenAIClient {
    private client: OpenAI

    constructor() {
        this.client = new OpenAI({
            apiKey: process.env.OPENAI_API_KEY || 'mock-key-if-missing'
        })
    }

    async generateSEOText(prompt: string, model = 'gpt-4o-mini'): Promise<string> {
        // If no API key, return a mock response for development
        if (!process.env.OPENAI_API_KEY) {
            console.warn('OPENAI_API_KEY missing - returning mock SEO text.')
            return "Optimierter SEO-Inhalt (Mock)"
        }

        try {
            const response = await this.client.chat.completions.create({
                model,
                messages: [
                    { role: 'system', content: 'Du bist ein erfahrener eCommerce SEO Experte. Antworte präzise und professionell.' },
                    { role: 'user', content: prompt }
                ],
                temperature: 0.7
            })

            return response.choices[0]?.message?.content || ''
        } catch (error) {
            console.error('OpenAI Error:', error)
            return ''
        }
    }

    async generateImage(prompt: string): Promise<string> {
        if (!process.env.OPENAI_API_KEY) {
            console.warn('OPENAI_API_KEY missing - returning mock image URL.')
            return 'https://images.unsplash.com/photo-1512428559087-560fa5ceab42?auto=format&fit=crop&w=1200&q=80'
        }

        try {
            console.log(`🎨 Generating AI image with prompt: ${prompt}`)
            const response = await this.client.images.generate({
                model: "dall-e-3",
                prompt: prompt,
                n: 1,
                size: "1024x1024",
                quality: "standard",
            })

            return response?.data?.[0]?.url || ''
        } catch (error) {
            console.error('OpenAI Image Error:', error)
            return ''
        }
    }
}

export const openaiClient = new OpenAIClient()
