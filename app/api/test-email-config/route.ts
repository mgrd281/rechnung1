export const dynamic = "force-dynamic"
import { NextRequest, NextResponse } from 'next/server'
import { verifyEmailConfig } from '@/lib/email-service'
import { detectEmailProvider, validateGermanEmailConfig } from '@/lib/email-providers'

export async function GET() {
  try {
    const diagnostics = {
      timestamp: new Date().toISOString(),
      environment: {
        // Show both SMTP_* and legacy EMAIL_* for clarity
        SMTP_HOST: process.env.SMTP_HOST || 'NOT_SET',
        SMTP_PORT: process.env.SMTP_PORT || 'NOT_SET',
        SMTP_USER: process.env.SMTP_USER ? `***@${process.env.SMTP_USER.split('@')[1]}` : 'NOT_SET',
        SMTP_PASS: process.env.SMTP_PASS ? '***SET***' : 'NOT_SET',
        EMAIL_HOST: process.env.EMAIL_HOST || 'NOT_SET',
        EMAIL_PORT: process.env.EMAIL_PORT || 'NOT_SET',
        EMAIL_USER: process.env.EMAIL_USER ? `***@${process.env.EMAIL_USER.split('@')[1]}` : 'NOT_SET',
        EMAIL_PASS: process.env.EMAIL_PASS ? '***SET***' : 'NOT_SET',
        EMAIL_FROM: process.env.EMAIL_FROM || 'NOT_SET',
        EMAIL_DEV_MODE: process.env.EMAIL_DEV_MODE || 'NOT_SET'
      },
      provider: null as any,
      validation: null as any,
      connection: null as any,
      recommendations: [] as string[]
    }

    // Detect email provider: prefer SMTP_USER, fallback to EMAIL_USER
    const userForDetection = process.env.SMTP_USER || process.env.EMAIL_USER || ''
    if (userForDetection) {
      const provider = detectEmailProvider(userForDetection)
      diagnostics.provider = provider ? {
        name: provider.name,
        host: provider.host,
        port: provider.port,
        domains: provider.domains,
        instructions: provider.instructions
      } : 'Unknown Provider'

      // Validate configuration
      if (process.env.SMTP_PASS || process.env.EMAIL_PASS) {
        diagnostics.validation = validateGermanEmailConfig(
          userForDetection,
          process.env.SMTP_PASS || process.env.EMAIL_PASS || ''
        )
      }
    }

    // Test connection
    if (process.env.EMAIL_DEV_MODE !== 'true') {
      try {
        const isValid = await verifyEmailConfig()
        diagnostics.connection = {
          status: isValid ? 'SUCCESS' : 'FAILED',
          message: isValid ? 'Email configuration verified successfully' : 'Email configuration verification failed'
        }
      } catch (error) {
        diagnostics.connection = {
          status: 'ERROR',
          message: error instanceof Error ? error.message : 'Unknown error',
          error: error
        }
      }
    } else {
      diagnostics.connection = {
        status: 'DEV_MODE',
        message: 'Running in development mode - connection test skipped'
      }
    }

    // Generate recommendations
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
      diagnostics.recommendations.push('Set EMAIL_USER and EMAIL_PASS environment variables')
    }

    if (process.env.EMAIL_DEV_MODE === 'true') {
      diagnostics.recommendations.push('Set EMAIL_DEV_MODE=false for real email sending')
    }

    if (diagnostics.provider && typeof diagnostics.provider === 'object') {
      diagnostics.recommendations.push(`Provider detected: ${diagnostics.provider.name}`)
      if (diagnostics.provider.instructions) {
        diagnostics.recommendations.push(diagnostics.provider.instructions)
      }
    }

    if (diagnostics.validation && !diagnostics.validation.isValid) {
      diagnostics.recommendations.push(...diagnostics.validation.suggestions)
    }

    return NextResponse.json({
      success: true,
      diagnostics
    })

  } catch (error) {
    console.error('Error in email diagnostics:', error)
    
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to run email diagnostics',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { testEmail } = body

    if (!testEmail) {
      return NextResponse.json(
        { success: false, error: 'Test email address is required' },
        { status: 400 }
      )
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(testEmail)) {
      return NextResponse.json(
        { success: false, error: 'Invalid email format' },
        { status: 400 }
      )
    }

    // Detect provider for test email
    const provider = detectEmailProvider(testEmail)
    const domain = testEmail.split('@')[1]

    const result = {
      email: testEmail,
      domain: domain,
      provider: provider ? {
        name: provider.name,
        host: provider.host,
        port: provider.port,
        supported: true,
        instructions: provider.instructions
      } : {
        name: 'Unknown',
        host: 'Unknown',
        port: 'Unknown',
        supported: false,
        instructions: 'This email provider is not in our database. You may need to configure SMTP settings manually.'
      },
      recommendations: [] as string[]
    }

    // Add specific recommendations
    if (provider) {
      if (provider.name === 'Web.de') {
        result.recommendations.push('Aktivieren Sie POP3/IMAP in den Web.de Einstellungen')
        result.recommendations.push('Gehen Sie zu Web.de → Einstellungen → POP3/IMAP → Aktivieren')
      } else if (provider.name === 'GMX.de') {
        result.recommendations.push('Aktivieren Sie "Externe E-Mail-Programme" in GMX')
        result.recommendations.push('Gehen Sie zu GMX → E-Mail → Einstellungen → POP3/IMAP')
      } else if (provider.name === 'Gmail') {
        result.recommendations.push('Verwenden Sie ein App-Passwort, nicht Ihr normales Passwort')
        result.recommendations.push('Aktivieren Sie die 2-Faktor-Authentifizierung in Google')
      }
    } else {
      result.recommendations.push('Unbekannter E-Mail-Anbieter')
      result.recommendations.push('Konfigurieren Sie SMTP-Einstellungen manuell')
      result.recommendations.push('Kontaktieren Sie Ihren E-Mail-Anbieter für SMTP-Details')
    }

    return NextResponse.json({
      success: true,
      result
    })

  } catch (error) {
    console.error('Error testing email provider:', error)
    
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to test email provider',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
