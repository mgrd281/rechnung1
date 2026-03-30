import { prisma } from '@/lib/prisma'

export const DEFAULT_GOOGLE_SHOPPING_SETTINGS = {
    productSelection: 'all',
    filterCustomerReviews: true,
    filterImportedReviews: true,
    filterEmptyComments: false,
    countryFilter: 'all',
    keywordFilter: '',
    productIdentification: 'gtin'
}

export async function getGoogleShoppingSettings() {
    const organization = await prisma.organization.findFirst()
    if (!organization) return DEFAULT_GOOGLE_SHOPPING_SETTINGS

    const settings = await prisma.googleShoppingSettings.findUnique({
        where: { organizationId: organization.id }
    })

    return settings || DEFAULT_GOOGLE_SHOPPING_SETTINGS
}

export async function saveGoogleShoppingSettings(settings: any) {
    const organization = await prisma.organization.findFirst()
    if (!organization) throw new Error('No organization found')

    await prisma.googleShoppingSettings.upsert({
        where: { organizationId: organization.id },
        update: {
            productSelection: settings.productSelection,
            filterCustomerReviews: settings.filterCustomerReviews,
            filterImportedReviews: settings.filterImportedReviews,
            filterEmptyComments: settings.filterEmptyComments,
            countryFilter: settings.countryFilter,
            keywordFilter: settings.keywordFilter,
            productIdentification: settings.productIdentification
        },
        create: {
            organizationId: organization.id,
            productSelection: settings.productSelection || DEFAULT_GOOGLE_SHOPPING_SETTINGS.productSelection,
            filterCustomerReviews: settings.filterCustomerReviews ?? DEFAULT_GOOGLE_SHOPPING_SETTINGS.filterCustomerReviews,
            filterImportedReviews: settings.filterImportedReviews ?? DEFAULT_GOOGLE_SHOPPING_SETTINGS.filterImportedReviews,
            filterEmptyComments: settings.filterEmptyComments ?? DEFAULT_GOOGLE_SHOPPING_SETTINGS.filterEmptyComments,
            countryFilter: settings.countryFilter || DEFAULT_GOOGLE_SHOPPING_SETTINGS.countryFilter,
            keywordFilter: settings.keywordFilter || DEFAULT_GOOGLE_SHOPPING_SETTINGS.keywordFilter,
            productIdentification: settings.productIdentification || DEFAULT_GOOGLE_SHOPPING_SETTINGS.productIdentification
        }
    })
}
