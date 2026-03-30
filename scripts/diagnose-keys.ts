
import 'dotenv/config'
import { PrismaClient } from '@prisma/client'
import { getDigitalProductByShopifyId, getAvailableKey } from '../lib/digital-products'
import { sendEmail } from '../lib/email-service'

const prisma = new PrismaClient()

async function main() {
    console.log('🔍 Starting Key Delivery Diagnosis...')

    // 1. Check Environment Variables
    console.log('\n1. Checking Environment Configuration:')
    console.log('   EMAIL_DEV_MODE:', process.env.EMAIL_DEV_MODE)
    console.log('   SMTP_HOST:', process.env.SMTP_HOST || 'NOT SET')
    console.log('   SMTP_USER:', process.env.SMTP_USER ? '***SET***' : 'NOT SET')
    console.log('   SMTP_PASS:', process.env.SMTP_PASS ? '***SET***' : 'NOT SET')
    console.log('   EMAIL_FROM:', process.env.EMAIL_FROM || 'NOT SET')

    if (process.env.EMAIL_DEV_MODE === 'true') {
        console.warn('   ⚠️  WARNING: EMAIL_DEV_MODE is enabled. Real emails will NOT be sent.')
    }

    // 2. Check Digital Products
    console.log('\n2. Checking Digital Products in Database:')
    const products = await prisma.digitalProduct.findMany({
        include: {
            _count: {
                select: { keys: { where: { isUsed: false } } }
            }
        }
    })

    if (products.length === 0) {
        console.error('   ❌ No Digital Products found in database.')
    } else {
        products.forEach(p => {
            console.log(`   - Product: "${p.title}" (Shopify ID: ${p.shopifyProductId})`)
            console.log(`     Available Keys: ${p._count.keys}`)
            if (p._count.keys === 0) {
                console.warn('     ⚠️  NO KEYS AVAILABLE!')
            }
        })
    }

    // 3. Test Email Sending (Simulated)
    console.log('\n3. Testing Email Sending Logic:')
    try {
        const testResult = await sendEmail({
            to: 'test@example.com',
            subject: 'Test Email from Diagnostic Script',
            html: '<p>This is a test email.</p>'
        })
        console.log('   Email Send Result:', testResult)
    } catch (error) {
        console.error('   ❌ Email Send Failed:', error)
    }

    console.log('\nDiagnosis Complete.')
}

main()
    .catch(e => {
        console.error(e)
        process.exit(1)
    })
    .finally(async () => {
        await prisma.$disconnect()
    })
