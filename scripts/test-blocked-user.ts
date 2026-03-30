
import { prisma } from '../lib/prisma'
import { ensureOrganization } from '../lib/db-operations'

async function main() {
  console.log('Testing Blocked User Creation...')

  try {
    // 1. Ensure Organization
    const org = await ensureOrganization()
    console.log('Organization ID:', org.id)

    // 2. Create Blocked User
    const testEmail = 'test-block@example.com'
    
    // Cleanup if exists
    await prisma.blockedUser.deleteMany({
      where: { email: testEmail }
    })

    const blockedUser = await prisma.blockedUser.create({
      data: {
        organizationId: org.id,
        email: testEmail,
        reason: 'Test Block',
        blockedBy: 'Test Script'
      }
    })

    console.log('Successfully created blocked user:', blockedUser)

    // 3. Verify it exists
    const found = await prisma.blockedUser.findFirst({
      where: {
        organizationId: org.id,
        email: testEmail
      }
    })

    if (found) {
        console.log('Verification successful: User is in database')
    } else {
        console.error('Verification failed: User not found')
    }

    // Cleanup
    await prisma.blockedUser.delete({
        where: { id: blockedUser.id }
    })
    console.log('Cleanup successful')

  } catch (error) {
    console.error('Test failed:', error)
  } finally {
    await prisma.$disconnect()
  }
}

main()
