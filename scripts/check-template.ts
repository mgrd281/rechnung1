import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
    const templateId = '1dec1e79-fd80-4f75-be89-101ffe93ff52'
    const template = await prisma.invoiceTemplate.findUnique({
        where: { id: templateId }
    })

    if (template) {
        console.log('Template Name:', template.name)
        console.log('Has customHtml:', !!(template as any).customHtml)
        console.log('customHtml length:', (template as any).customHtml?.length)
        console.log('Settings:', JSON.stringify(template.settings, null, 2))
    } else {
        console.log('Template not found')
    }
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect())
