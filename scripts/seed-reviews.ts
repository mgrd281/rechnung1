import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const reviews = [
    {
        productTitle: 'Hugo Boss Champion Chronograph',
        productId: '7613272431538',
        customerName: 'Marcus Weber',
        customerEmail: 'm.weber@example.de',
        rating: 5,
        title: 'Hervorragende Qualität',
        content: 'Die Uhr ist einfach klasse. Das Design ist edel und die Verarbeitung top. Der Versand war zudem extrem schnell.',
        status: 'APPROVED',
        isVerified: true,
    },
    {
        productTitle: 'Premium Lederarmband Schwarz',
        productId: '8877665544',
        customerName: 'Sarah Schmidt',
        customerEmail: 'sarah.s@test.com',
        rating: 4,
        title: 'Sehr schön, etwas steif',
        content: 'Das Leder ist sehr hochwertig. Anfangs war es etwas steif, aber nach ein paar Tagen Tragezeit ist es perfekt.',
        status: 'APPROVED',
        isVerified: true,
    },
    {
        productTitle: 'Uhrenbeweger Classic',
        productId: '1122334455',
        customerName: 'Thomas Müller',
        customerEmail: 't.mueller@web.de',
        rating: 5,
        title: 'Flüsterleise!',
        content: 'Ich bin begeistert, wie leise dieser Uhrenbeweger ist. Er steht direkt neben meinem Bett und man hört absolut gar nichts.',
        status: 'APPROVED',
        isVerified: true,
    },
    {
        productTitle: 'Reiseetui für 3 Uhren',
        productId: '5544332211',
        customerName: 'Elena Fischer',
        customerEmail: 'e.fischer@gmx.net',
        rating: 5,
        title: 'Perfekt für den Urlaub',
        content: 'Sehr stabil und schützt die Uhren optimal. Die Kissen sind weich und passen für verschiedene Uhrengrößen.',
        status: 'PENDING',
        isVerified: false,
    },
    {
        productTitle: 'Ersatzfedersteg-Set',
        productId: '9988776655',
        customerName: 'Hans-Peter',
        customerEmail: 'hp.uhrenfan@t-online.de',
        rating: 3,
        title: 'Standardqualität',
        content: 'Erfüllt seinen Zweck, aber die Box könnte etwas stabiler sein. Dennoch ein faires Preis-Leistungs-Verhältnis.',
        status: 'APPROVED',
        isVerified: true,
    }
];

async function main() {
    const org = await prisma.organization.findFirst();
    if (!org) {
        console.error('No organization found to attach reviews to!');
        return;
    }

    console.log(`🌱 Seeding reviews for organization: ${org.name} (${org.id})`);

    for (const review of reviews) {
        await prisma.review.create({
            data: {
                ...review,
                organizationId: org.id,
            }
        });
    }

    console.log('✅ Successfully seeded 5 sample reviews.');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
