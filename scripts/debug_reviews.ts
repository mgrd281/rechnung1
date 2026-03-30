
const { prisma } = require('./lib/prisma')

async function debugReviews() {
    try {
        console.log('--- Debugging Reviews ---')

        // 1. Check total count
        const totalCount = await prisma.review.count()
        console.log(`Total reviews in DB: ${totalCount}`)

        // 2. Check a few reviews to see their structure
        const sampleReviews = await prisma.review.findMany({
            take: 5,
            select: {
                id: true,
                productId: true,
                productTitle: true,
                status: true,
                organizationId: true
            }
        })
        console.log('Sample Reviews:', JSON.stringify(sampleReviews, null, 2))

        // 3. Check if there are any approved reviews
        const approvedCount = await prisma.review.count({
            where: { status: 'APPROVED' }
        })
        console.log(`Approved reviews: ${approvedCount}`)

    } catch (e) {
        console.error(e)
    } finally {
        await prisma.$disconnect()
    }
}

debugReviews()
