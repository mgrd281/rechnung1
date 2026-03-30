export const dynamic = "force-dynamic"
import { NextRequest, NextResponse } from 'next/server'
import { sendInvoiceEmail } from '@/lib/email-service'

// Test email sending to different providers
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { testType = 'all' } = body

    const testResults = []

    // Test email addresses for different providers
    const testProviders = [
      {
        name: 'Web.de',
        email: 'test@web.de',
        domain: 'web.de'
      },
      {
        name: 'GMX.de', 
        email: 'test@gmx.de',
        domain: 'gmx.de'
      },
      {
        name: 'Gmail',
        email: 'test@gmail.com',
        domain: 'gmail.com'
      },
      {
        name: 'Outlook',
        email: 'test@outlook.com',
        domain: 'outlook.com'
      }
    ]

    // Filter providers based on test type
    let providersToTest = testProviders
    if (testType !== 'all') {
      providersToTest = testProviders.filter(p => 
        p.domain === testType || p.name.toLowerCase().includes(testType.toLowerCase())
      )
    }

    console.log(`🧪 Starting provider tests for: ${providersToTest.map(p => p.name).join(', ')}`)

    // Test each provider
    for (const provider of providersToTest) {
      console.log(`\n📧 Testing ${provider.name} (${provider.email})...`)
      
      try {
        const result = await sendInvoiceEmail(
          `test-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
          provider.email,
          `Test Customer ${provider.name}`,
          `TEST-${Date.now()}`,
          'Karina Khrystych'
        )

        testResults.push({
          provider: provider.name,
          email: provider.email,
          success: result.success,
          messageId: result.messageId,
          logId: result.logId,
          error: result.error || null,
          timestamp: new Date().toISOString()
        })

        if (result.success) {
          console.log(`✅ ${provider.name}: SUCCESS - Message ID: ${result.messageId}`)
        } else {
          console.log(`❌ ${provider.name}: FAILED - ${result.error}`)
        }

        // Small delay between tests to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 1000))

      } catch (error) {
        console.error(`❌ ${provider.name}: EXCEPTION -`, error)
        
        testResults.push({
          provider: provider.name,
          email: provider.email,
          success: false,
          messageId: null,
          logId: null,
          error: error instanceof Error ? error.message : 'Unknown error',
          timestamp: new Date().toISOString()
        })
      }
    }

    // Calculate summary statistics
    const totalTests = testResults.length
    const successfulTests = testResults.filter(r => r.success).length
    const failedTests = totalTests - successfulTests
    const successRate = totalTests > 0 ? (successfulTests / totalTests) * 100 : 0

    const summary = {
      totalTests,
      successfulTests,
      failedTests,
      successRate: Math.round(successRate * 100) / 100,
      testType,
      timestamp: new Date().toISOString()
    }

    console.log(`\n📊 Test Summary:`)
    console.log(`   Total: ${totalTests}`)
    console.log(`   Success: ${successfulTests}`)
    console.log(`   Failed: ${failedTests}`)
    console.log(`   Success Rate: ${summary.successRate}%`)

    return NextResponse.json({
      success: true,
      message: `Provider tests completed: ${successfulTests}/${totalTests} successful`,
      summary,
      results: testResults
    })

  } catch (error) {
    console.error('Error in provider testing:', error)
    
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to run provider tests',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

// Get available test providers
export async function GET() {
  try {
    const providers = [
      {
        name: 'Web.de',
        domain: 'web.de',
        description: 'German email provider - tests deliverability to Web.de mailboxes'
      },
      {
        name: 'GMX.de',
        domain: 'gmx.de', 
        description: 'German email provider - tests deliverability to GMX mailboxes'
      },
      {
        name: 'Gmail',
        domain: 'gmail.com',
        description: 'Google email service - tests deliverability to Gmail'
      },
      {
        name: 'Outlook',
        domain: 'outlook.com',
        description: 'Microsoft email service - tests deliverability to Outlook'
      }
    ]

    return NextResponse.json({
      success: true,
      providers,
      usage: {
        testAll: 'POST /api/test-providers with {"testType": "all"}',
        testSpecific: 'POST /api/test-providers with {"testType": "gmail"}',
        availableTypes: ['all', 'web.de', 'gmx.de', 'gmail', 'outlook']
      }
    })

  } catch (error) {
    console.error('Error getting provider info:', error)
    
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to get provider information'
      },
      { status: 500 }
    )
  }
}
