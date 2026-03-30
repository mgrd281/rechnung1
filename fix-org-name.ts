import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

async function main() {
    const org = await prisma.organization.findFirst()
    if (org) {
        await prisma.organization.update({
            where: { id: org.id },
            data: {
                name: 'karinex',
                address: 'Havighorster Redder 51',
                city: 'Hamburg',
                zipCode: '22115',
                country: 'DE'
            }
        })
        console.log('✅ Organisation erfolgreich auf "karinex" aktualisiert.')
    } else {
        console.log('❌ Keine Organisation zum Aktualisieren gefunden.')
    }
}

main()
    .catch(e => console.error(e))
    .finally(() => prisma.$disconnect())
