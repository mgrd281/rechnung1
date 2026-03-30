
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
async function main() {
    const products = await prisma.digitalProduct.findMany({
        include: {
            keys: {
                where: { isUsed: false }
            }
        }
    });
    console.log('--- INVENTORY STATUS ---');
    products.forEach(p => {
        console.log('Product:', p.title);
        console.log('Shopify ID:', p.shopifyProductId);
        console.log('Available Keys:', p.keys.length);
        console.log('------------------------');
    });
}
main().catch(console.error);
