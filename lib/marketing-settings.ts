import { prisma } from '@/lib/prisma'

export interface MarketingSettings {
    fpdEnabled: boolean
    fpdPercentage: number
    fpdValidityDays: number
    fpdEmailSubject: string
    fpdEmailBody: string
    exitIntentEnabled: boolean
}

export const DEFAULT_MARKETING_SETTINGS: MarketingSettings = {
    fpdEnabled: false,
    fpdPercentage: 10,
    fpdValidityDays: 30,
    fpdEmailSubject: 'Ihr persönlicher 10%-Rabattcode als Dankeschön 🎁',
    fpdEmailBody: '',
    exitIntentEnabled: false
}

/**
 * Get Marketing settings from database
 */
export async function getMarketingSettings(): Promise<MarketingSettings> {
    try {
        // Fallback to first organization for now
        const organization = await prisma.organization.findFirst()
        if (!organization) return DEFAULT_MARKETING_SETTINGS

        const settings = await prisma.marketingSettings.findUnique({
            where: { organizationId: organization.id }
        })

        if (settings) {
            return {
                fpdEnabled: settings.fpdEnabled,
                fpdPercentage: settings.fpdPercentage,
                fpdValidityDays: settings.fpdValidityDays,
                fpdEmailSubject: settings.fpdEmailSubject,
                fpdEmailBody: settings.fpdEmailBody,
                exitIntentEnabled: settings.exitIntentEnabled
            }
        }
    } catch (error) {
        console.error('Error fetching Marketing settings:', error)
    }

    return DEFAULT_MARKETING_SETTINGS
}

/**
 * Save Marketing settings to database
 */
export async function saveMarketingSettings(settings: Partial<MarketingSettings>): Promise<void> {
    try {
        // Fallback to first organization for now
        const organization = await prisma.organization.findFirst()
        if (!organization) return

        await prisma.marketingSettings.upsert({
            where: { organizationId: organization.id },
            update: {
                fpdEnabled: settings.fpdEnabled,
                fpdPercentage: settings.fpdPercentage,
                fpdValidityDays: settings.fpdValidityDays,
                fpdEmailSubject: settings.fpdEmailSubject,
                fpdEmailBody: settings.fpdEmailBody,
                exitIntentEnabled: settings.exitIntentEnabled
            },
            create: {
                organizationId: organization.id,
                fpdEnabled: settings.fpdEnabled ?? DEFAULT_MARKETING_SETTINGS.fpdEnabled,
                fpdPercentage: settings.fpdPercentage ?? DEFAULT_MARKETING_SETTINGS.fpdPercentage,
                fpdValidityDays: settings.fpdValidityDays ?? DEFAULT_MARKETING_SETTINGS.fpdValidityDays,
                fpdEmailSubject: settings.fpdEmailSubject || DEFAULT_MARKETING_SETTINGS.fpdEmailSubject,
                fpdEmailBody: settings.fpdEmailBody || DEFAULT_MARKETING_SETTINGS.fpdEmailBody,
                exitIntentEnabled: settings.exitIntentEnabled ?? DEFAULT_MARKETING_SETTINGS.exitIntentEnabled
            }
        })
    } catch (error) {
        console.error('Error saving Marketing settings:', error)
        throw error
    }
}
