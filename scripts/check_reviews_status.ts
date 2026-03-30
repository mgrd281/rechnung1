
import { PrismaClient } from '@prisma/client'
import dotenv from 'dotenv'

dotenv.config()

const prisma = new PrismaClient()

async function main() {
    console.log('Checking Widget Settings...')
    const organization = await prisma.organization.findFirst()
    if (!organization) {
        console.log('No organization found.')
        return
    }

    const settings = await prisma.widgetSettings.findUnique({
        where: { organizationId: organization.id }
    })

    console.log('Widget Settings:', settings)

    if (settings) {
        if (settings.reviewsEnabled === false) {
            console.log('Reviews are DISABLED. Enabling them...')
            await prisma.widgetSettings.update({
                where: { organizationId: organization.id },
                data: { reviewsEnabled: true }
            })
            console.log('Reviews enabled.')
        } else {
            console.log('Reviews are already ENABLED.')
        }
    } else {
        console.log('No widget settings found. Creating default...')
        await prisma.widgetSettings.create({
            data: {
                organizationId: organization.id,
                primaryColor: '#2563eb',
                layout: 'list',
                reviewsEnabled: true
            }
        })
        console.log('Default settings created with reviews ENABLED.')
    }

    console.log('Checking Reviews...')
    const reviewsCount = await prisma.review.count()
    console.log(`Total Reviews: ${reviewsCount}`)

    const approvedReviews = await prisma.review.count({
        where: { status: 'APPROVED' }
    })
    console.log(`Approved Reviews: ${approvedReviews}`)

    const pendingReviews = await prisma.review.count({
        where: { status: 'PENDING' }
    })
    console.log(`Pending Reviews: ${pendingReviews}`)
}

main()
    .catch((e) => {
        console.error(e)
        process.exit(1)
    })
    .finally(async () => {
        await prisma.$disconnect()
    })
