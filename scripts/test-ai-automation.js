#!/usr/bin/env node

/**
 * Test script for AI Automation System
 * Run this to test content generation and publishing
 */

const testAIAutomation = async () => {
    console.log('🤖 AI Automation Test Started')
    console.log('================================\n')

    try {
        // Test endpoint
        const url = 'http://localhost:3000/api/ai/test-generate'

        console.log('📡 Sending request to:', url)
        console.log('⏳ Generating content...\n')

        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                action: 'GENERATE_TEST_CONTENT'
            })
        })

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`)
        }

        const result = await response.json()

        if (result.success) {
            console.log('✅ TEST ERFOLGREICH!\n')
            console.log('📊 Ergebnisse:')
            console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')

            const { test } = result

            console.log('\n🔑 Keyword:')
            console.log(`   "${test.keyword.keyword}"`)
            console.log(`   Volume: ${test.keyword.volume} | Difficulty: ${test.keyword.difficulty}`)

            console.log('\n📝 Generierter Inhalt:')
            console.log(`   Titel: "${test.content.title}"`)
            console.log(`   Slug: ${test.content.slug}`)
            console.log(`   Wörter: ${test.content.wordCount}`)
            console.log(`   SEO Score: ${test.content.seoScore}/100`)

            console.log('\n🎯 SEO Check:')
            console.log(`   Bestanden: ${test.seoCheck.passed ? '✅ JA' : '❌ NEIN'}`)
            console.log(`   Score: ${test.seoCheck.score}/100`)
            if (test.seoCheck.issues.length > 0) {
                console.log(`   Probleme: ${test.seoCheck.issues.join(', ')}`)
            }

            console.log('\n📤 Veröffentlichung:')
            console.log(`   Status: ${test.publishResult.status}`)
            console.log(`   Grund: ${test.publishResult.reason}`)
            if (test.publishResult.publishedUrl) {
                console.log(`   URL: ${test.publishResult.publishedUrl}`)
            }

            console.log('\n📋 Aktivitätslog:')
            console.log(`   Event: ${test.activityLog.event}`)
            console.log(`   Detail: ${test.activityLog.detail}`)
            console.log(`   Status: ${test.activityLog.status}`)
            console.log(`   Zeit: ${new Date(test.activityLog.timestamp).toLocaleString('de-DE')}`)

            console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
            console.log(`\n${test.message}`)

        } else {
            console.log('❌ TEST FEHLGESCHLAGEN')
            console.log('Fehler:', result.error)
        }

    } catch (error) {
        console.error('\n❌ FEHLER:', error.message)
        console.error('\n💡 Tipps:')
        console.error('   1. Stelle sicher, dass der Dev-Server läuft (npm run dev)')
        console.error('   2. Überprüfe, ob Port 3000 verfügbar ist')
        console.error('   3. Stelle sicher, dass du eingeloggt bist')
    }

    console.log('\n================================')
    console.log('🏁 Test beendet\n')
}

// Run the test
testAIAutomation()
