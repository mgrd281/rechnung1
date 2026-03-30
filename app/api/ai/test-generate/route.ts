import { NextResponse } from 'next/server'

import { auth } from "@/lib/auth"
import { KeywordEngine } from '@/lib/keyword-engine'

export const dynamic = 'force-dynamic'

/**
 * Test endpoint to trigger AI content generation
 * This will generate a test blog post and simulate publishing
 */
export async function POST(req: Request) {
    try {
        const session = await auth()
        if (!session?.user?.email) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const body = await req.json()
        const { action } = body

        if (action !== 'GENERATE_TEST_CONTENT') {
            return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
        }

        console.log(`[AI Test] Starting content generation test by ${session.user.email}`)

        // Step 1: Keyword Research
        const keywordEngine = new KeywordEngine('test-org')
        const keywords = await keywordEngine.discoverOpportunities()
        const selectedKeyword = keywords[0]

        console.log(`[AI Test] Selected keyword: ${selectedKeyword.keyword}`)

        // Step 2: Generate Content (simulated)
        const generatedContent = {
            title: `Die Zukunft von ${selectedKeyword.keyword}: Ein umfassender Leitfaden`,
            slug: selectedKeyword.keyword.toLowerCase().replace(/\s+/g, '-'),
            content: generateTestBlogContent(selectedKeyword.keyword),
            seoScore: Math.floor(Math.random() * 20) + 80, // 80-100
            keywords: [selectedKeyword.keyword, 'nachhaltig', 'premium', 'qualität'],
            metaDescription: `Entdecken Sie alles über ${selectedKeyword.keyword}. Professionelle Beratung und hochwertige Produkte für anspruchsvolle Kunden.`,
            generatedAt: new Date().toISOString()
        }

        console.log(`[AI Test] Content generated with SEO score: ${generatedContent.seoScore}`)

        // Step 3: SEO Check
        const seoCheck = {
            score: generatedContent.seoScore,
            passed: generatedContent.seoScore >= 80,
            issues: generatedContent.seoScore < 90 ? ['Meta description could be longer'] : [],
            recommendations: ['Add more internal links', 'Include product images']
        }

        // Step 4: Simulate Publishing
        const publishResult = {
            success: seoCheck.passed,
            publishedUrl: seoCheck.passed ? `/blog/${generatedContent.slug}` : null,
            status: seoCheck.passed ? 'PUBLISHED' : 'DRAFT_SAVED',
            reason: seoCheck.passed ? 'SEO score meets threshold' : 'SEO score below 80',
            timestamp: new Date().toISOString()
        }

        console.log(`[AI Test] Publish result: ${publishResult.status}`)

        // Step 5: Create activity log
        const activityLog = {
            event: publishResult.success ? 'ARTICLE_PUBLISHED' : 'DRAFT_CREATED',
            detail: generatedContent.title,
            keyword: selectedKeyword.keyword,
            seoScore: generatedContent.seoScore,
            status: publishResult.success ? 'SUCCESS' : 'PENDING_REVIEW',
            timestamp: new Date().toISOString(),
            user: session.user.email
        }

        return NextResponse.json({
            success: true,
            test: {
                keyword: selectedKeyword,
                content: {
                    title: generatedContent.title,
                    slug: generatedContent.slug,
                    wordCount: generatedContent.content.split(' ').length,
                    seoScore: generatedContent.seoScore
                },
                seoCheck,
                publishResult,
                activityLog,
                message: publishResult.success
                    ? `✅ Test erfolgreich! Artikel "${generatedContent.title}" wurde generiert und würde veröffentlicht werden (SEO Score: ${generatedContent.seoScore}/100)`
                    : `⚠️ Artikel generiert aber nicht veröffentlicht (SEO Score: ${generatedContent.seoScore}/100 - Minimum: 80)`
            }
        })

    } catch (error: any) {
        console.error('[AI Test] Error:', error)
        return NextResponse.json({
            success: false,
            error: error.message || 'Test failed'
        }, { status: 500 })
    }
}

/**
 * Generate test blog content
 */
function generateTestBlogContent(keyword: string): string {
    return `
# Die Zukunft von ${keyword}: Ein umfassender Leitfaden

## Einleitung

In der heutigen Zeit gewinnt ${keyword} zunehmend an Bedeutung. Immer mehr Menschen erkennen den Wert von hochwertigen, nachhaltigen Produkten.

## Warum ${keyword} wichtig ist

${keyword} steht für Qualität, Langlebigkeit und zeitloses Design. In diesem Artikel erfahren Sie alles, was Sie über ${keyword} wissen müssen.

### Die Vorteile

1. **Nachhaltigkeit**: Hochwertige Materialien bedeuten längere Lebensdauer
2. **Stil**: Zeitloses Design, das nie aus der Mode kommt
3. **Funktionalität**: Durchdachte Features für den Alltag

## Worauf Sie achten sollten

Bei der Auswahl von ${keyword} gibt es einige wichtige Faktoren zu beachten:

- Material und Verarbeitung
- Design und Funktionalität
- Preis-Leistungs-Verhältnis
- Nachhaltigkeit und Herkunft

## Unsere Empfehlungen

Wir haben eine sorgfältig kuratierte Auswahl an ${keyword} zusammengestellt, die höchsten Qualitätsansprüchen genügt.

## Fazit

${keyword} ist mehr als nur ein Produkt - es ist eine Investition in Qualität und Nachhaltigkeit. Entdecken Sie jetzt unsere Kollektion und finden Sie Ihr perfektes Stück.

---

*Dieser Artikel wurde automatisch generiert vom AI Automation Center. Alle Empfehlungen basieren auf sorgfältiger Recherche und Qualitätskriterien.*
`.trim()
}
