
import { prisma } from './lib/prisma.ts'

async function checkReviews() {
    try {
        const count = await prisma.review.count()
        console.log(`Total reviews in database: ${count}`)

        const reviews = await prisma.review.findMany({
            take: 5,
            select: { id: true, title: true, createdAt: true }
        })
        console.log('Recent reviews:', reviews)
    } catch (e) {
        console.error(e)
    } finally {
        await prisma.$disconnect()
    }
}

checkReviews()
