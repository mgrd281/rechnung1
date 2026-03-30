import { prisma } from '@/lib/prisma'

export interface WidgetSettings {
    primaryColor: string
    layout: 'list' | 'grid'
    emailEnabled: boolean
    emailDelayDays: number
    emailSubject: string
    emailBody: string
    reviewsEnabled: boolean
}

export const DEFAULT_WIDGET_SETTINGS: WidgetSettings = {
    primaryColor: '#2563eb',
    layout: 'list',
    emailEnabled: false,
    emailDelayDays: 3,
    emailSubject: 'Ihre Meinung ist uns wichtig! 🌟',
    emailBody: 'Hallo {customer_name},\n\nvielen Dank für Ihren Einkauf bei uns! Wir hoffen, Sie sind mit Ihrer Bestellung zufrieden.\n\nWir würden uns sehr freuen, wenn Sie sich einen Moment Zeit nehmen könnten, um eine Bewertung für {product_title} abzugeben.\n\n[Link zur Bewertung]\n\nVielen Dank und beste Grüße,\nIhr Team',
    reviewsEnabled: true
}

/**
 * Get Widget settings from database
 */
export async function getWidgetSettings(): Promise<WidgetSettings> {
    try {
        // Fallback to first organization for now
        const organization = await prisma.organization.findFirst()
        if (!organization) return DEFAULT_WIDGET_SETTINGS

        const settings = await prisma.widgetSettings.findUnique({
            where: { organizationId: organization.id }
        })

        if (settings) {
            return {
                primaryColor: settings.primaryColor,
                layout: settings.layout as 'list' | 'grid',
                emailEnabled: settings.emailEnabled,
                emailDelayDays: settings.emailDelayDays,
                emailSubject: settings.emailSubject,
                emailBody: settings.emailBody,
                reviewsEnabled: settings.reviewsEnabled
            }
        }
    } catch (error) {
        console.error('Error fetching Widget settings:', error)
    }

    return DEFAULT_WIDGET_SETTINGS
}

/**
 * Save Widget settings to database
 */
export async function saveWidgetSettings(settings: Partial<WidgetSettings>): Promise<void> {
    try {
        // Fallback to first organization for now
        const organization = await prisma.organization.findFirst()
        if (!organization) return

        await prisma.widgetSettings.upsert({
            where: { organizationId: organization.id },
            update: {
                primaryColor: settings.primaryColor,
                layout: settings.layout,
                emailEnabled: settings.emailEnabled,
                emailDelayDays: settings.emailDelayDays,
                emailSubject: settings.emailSubject,
                emailBody: settings.emailBody,
                reviewsEnabled: settings.reviewsEnabled
            },
            create: {
                organizationId: organization.id,
                primaryColor: settings.primaryColor || DEFAULT_WIDGET_SETTINGS.primaryColor,
                layout: settings.layout || DEFAULT_WIDGET_SETTINGS.layout,
                emailEnabled: settings.emailEnabled ?? DEFAULT_WIDGET_SETTINGS.emailEnabled,
                emailDelayDays: settings.emailDelayDays ?? DEFAULT_WIDGET_SETTINGS.emailDelayDays,
                emailSubject: settings.emailSubject || DEFAULT_WIDGET_SETTINGS.emailSubject,
                emailBody: settings.emailBody || DEFAULT_WIDGET_SETTINGS.emailBody,
                reviewsEnabled: settings.reviewsEnabled ?? DEFAULT_WIDGET_SETTINGS.reviewsEnabled
            }
        })
    } catch (error) {
        console.error('Error saving Widget settings:', error)
        throw error
    }
}
