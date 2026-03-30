// German and international email provider configurations

export interface EmailProviderConfig {
  name: string
  host: string
  port: number
  secure: boolean
  requiresAuth: boolean
  domains: string[]
  instructions?: string
}

export const EMAIL_PROVIDERS: EmailProviderConfig[] = [
  // German Providers
  {
    name: 'Web.de',
    host: 'smtp.web.de',
    port: 587,
    secure: false,
    requiresAuth: true,
    domains: ['web.de'],
    instructions: 'Verwenden Sie Ihre Web.de E-Mail-Adresse und Ihr Passwort. Stellen Sie sicher, dass IMAP/POP3 in den Web.de Einstellungen aktiviert ist.'
  },
  {
    name: 'GMX.de',
    host: 'mail.gmx.net',
    port: 587,
    secure: false,
    requiresAuth: true,
    domains: ['gmx.de', 'gmx.net', 'gmx.at', 'gmx.ch'],
    instructions: 'Verwenden Sie Ihre GMX E-Mail-Adresse und Ihr Passwort. Aktivieren Sie "Externe E-Mail-Programme" in den GMX Einstellungen.'
  },
  {
    name: 'T-Online',
    host: 'securesmtp.t-online.de',
    port: 587,
    secure: false,
    requiresAuth: true,
    domains: ['t-online.de'],
    instructions: 'Verwenden Sie Ihre T-Online E-Mail-Adresse und Ihr Passwort.'
  },
  {
    name: '1&1 (IONOS)',
    host: 'smtp.1und1.de',
    port: 587,
    secure: false,
    requiresAuth: true,
    domains: ['1und1.de', '1and1.com'],
    instructions: 'Verwenden Sie Ihre 1&1 E-Mail-Adresse und Ihr Passwort.'
  },
  
  // International Providers
  {
    name: 'Microsoft 365',
    host: 'smtp.office365.com',
    port: 587,
    secure: false,
    requiresAuth: true,
    domains: ['outlook.com', 'hotmail.com', 'live.com', 'office365.com', 'karinex.de'],
    instructions: 'Verwenden Sie Ihr Microsoft 365 Passwort. Aktivieren Sie "Send As" für Custom Domain Aliases.'
  },
  {
    name: 'Gmail',
    host: 'smtp.gmail.com',
    port: 587,
    secure: false,
    requiresAuth: true,
    domains: ['gmail.com', 'googlemail.com'],
    instructions: 'Verwenden Sie ein App-Passwort, nicht Ihr normales Passwort. Aktivieren Sie die 2-Faktor-Authentifizierung.'
  },
  {
    name: 'Outlook/Hotmail',
    host: 'smtp-mail.outlook.com',
    port: 587,
    secure: false,
    requiresAuth: true,
    domains: ['outlook.com', 'hotmail.com', 'live.com', 'msn.com'],
    instructions: 'Verwenden Sie Ihre Outlook E-Mail-Adresse und Ihr Passwort.'
  },
  {
    name: 'Yahoo',
    host: 'smtp.mail.yahoo.com',
    port: 587,
    secure: false,
    requiresAuth: true,
    domains: ['yahoo.com', 'yahoo.de'],
    instructions: 'Verwenden Sie ein App-Passwort für Yahoo Mail.'
  }
]

// Auto-detect email provider based on email address
export function detectEmailProvider(email: string): EmailProviderConfig | null {
  const domain = email.split('@')[1]?.toLowerCase()
  if (!domain) return null

  return EMAIL_PROVIDERS.find(provider => 
    provider.domains.includes(domain)
  ) || null
}

// Get SMTP configuration for email address
export function getSmtpConfig(email: string): {
  host: string
  port: number
  secure: boolean
  provider?: EmailProviderConfig
} {
  const provider = detectEmailProvider(email)
  
  if (provider) {
    return {
      host: provider.host,
      port: provider.port,
      secure: provider.secure,
      provider
    }
  }

  // Default fallback configuration
  return {
    host: process.env.EMAIL_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.EMAIL_PORT || '587'),
    secure: false
  }
}

// Validate email configuration for German providers
export function validateGermanEmailConfig(email: string, password: string): {
  isValid: boolean
  errors: string[]
  suggestions: string[]
} {
  const errors: string[] = []
  const suggestions: string[] = []
  
  if (!email || !password) {
    errors.push('E-Mail-Adresse und Passwort sind erforderlich')
    return { isValid: false, errors, suggestions }
  }

  const provider = detectEmailProvider(email)
  
  if (!provider) {
    suggestions.push('Unbekannter E-Mail-Anbieter. Überprüfen Sie die SMTP-Einstellungen manuell.')
  }

  // Specific validations for German providers
  if (provider?.name === 'Web.de') {
    suggestions.push('Stellen Sie sicher, dass IMAP/POP3 in Ihren Web.de Einstellungen aktiviert ist')
    suggestions.push('Gehen Sie zu Web.de → Einstellungen → POP3/IMAP → Aktivieren')
  }

  if (provider?.name === 'GMX.de') {
    suggestions.push('Aktivieren Sie "Externe E-Mail-Programme" in den GMX Einstellungen')
    suggestions.push('Gehen Sie zu GMX → Einstellungen → E-Mail → Externe E-Mail-Programme')
  }

  if (provider?.name === 'Gmail') {
    if (!password.includes('-') || password.length !== 16) {
      errors.push('Gmail benötigt ein App-Passwort (16 Zeichen mit Bindestrichen)')
      suggestions.push('Erstellen Sie ein App-Passwort in den Google-Kontoeinstellungen')
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
    suggestions
  }
}
