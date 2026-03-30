
import { PrismaClient } from '@prisma/client'
import * as dotenv from 'dotenv'

dotenv.config()

const prisma = new PrismaClient()

async function main() {
    try {
        // Fetch all invoice numbers
        const invoices = await prisma.invoice.findMany({
            select: {
                invoiceNumber: true,
            },
        })

        console.log(`Total invoices in database: ${invoices.length}`)

        // Extract numbers and sort them
        const invoiceNumbers = invoices
            .map((inv) => {
                // Remove any non-numeric characters (e.g., "INV-1001" -> 1001)
                // Adjust regex if invoice format is different (e.g. "2023-1001")
                // For now, assuming simple numeric or "#1001" format
                const match = inv.invoiceNumber.match(/\d+/)
                return match ? parseInt(match[0], 10) : null
            })
            .filter((num) => num !== null)
            .sort((a, b) => a! - b!) as number[]

        if (invoiceNumbers.length === 0) {
            console.log('No numeric invoice numbers found.')
            return
        }

        const min = invoiceNumbers[0]
        const max = invoiceNumbers[invoiceNumbers.length - 1]

        console.log(`Invoice number range: ${min} to ${max}`)

        const missingNumbers: number[] = []
        const expectedSet = new Set<number>()

        // Populate expected set
        for (let i = min; i <= max; i++) {
            expectedSet.add(i)
        }

        // Remove existing numbers from expected set
        invoiceNumbers.forEach((num) => {
            expectedSet.delete(num)
        })

        // Remaining numbers in expectedSet are missing
        expectedSet.forEach((num) => {
            missingNumbers.push(num)
        })

        if (missingNumbers.length > 0) {
            console.log('Missing invoice numbers:', missingNumbers.join(', '))
        } else {
            console.log('No missing numbers found in the sequence.')
        }

        // Specific check for 1001
        const has1001 = invoiceNumbers.includes(1001)
        console.log(`Invoice #1001 exists: ${has1001}`)

    } catch (error) {
        console.error('Error:', error)
    } finally {
        await prisma.$disconnect()
    }
}

main()
