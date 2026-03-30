import { prisma } from '@/lib/prisma';

// Manual Session Interface
export interface Session {
    id: string;
    shop: string;
    state: string;
    isOnline: boolean;
    accessToken?: string;
    scope?: string;
}

// Helper to store session in Prisma
export async function storeSession(session: Session) {
    const shop = session.shop;
    const accessToken = session.accessToken;

    if (!accessToken) return;

    const existingConnection = await prisma.shopifyConnection.findFirst({
        where: { shopName: shop },
        include: { organization: true }
    });

    if (existingConnection) {
        await prisma.shopifyConnection.update({
            where: { id: existingConnection.id },
            data: { accessToken, isActive: true }
        });
    } else {
        const orgName = shop.replace('.myshopify.com', '');
        const newOrg = await prisma.organization.create({
            data: {
                name: orgName,
                slug: `${orgName}-${Date.now()}`,
                address: 'Shopify Store',
                zipCode: '00000',
                city: 'Unknown',
                country: 'DE',
                shopifyConnection: {
                    create: {
                        shopName: shop,
                        accessToken: accessToken,
                        scopes: session.scope || '',
                        isActive: true
                    }
                }
            }
        });
    }
    return true;
}

export async function loadSession(shop: string): Promise<Session | undefined> {
    const connection = await prisma.shopifyConnection.findFirst({
        where: { shopName: shop, isActive: true }
    });

    if (!connection) return undefined;

    return {
        id: `offline_${shop}`,
        shop: shop,
        state: '',
        isOnline: false,
        accessToken: connection.accessToken,
        scope: connection.scopes
    };
}

export async function checkSubscription(session: Session) {
    const response = await fetch(`https://${session.shop}/admin/api/2024-10/recurring_application_charges.json`, {
        headers: {
            'X-Shopify-Access-Token': session.accessToken!
        }
    });

    if (!response.ok) return null;

    const data = await response.json();
    const charges = data.recurring_application_charges as any[];
    const activeCharge = charges.find((c: any) => c.status === 'active');
    return activeCharge;
}

export async function createSubscription(session: Session, returnUrl: string) {
    const response = await fetch(`https://${session.shop}/admin/api/2024-10/recurring_application_charges.json`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'X-Shopify-Access-Token': session.accessToken!
        },
        body: JSON.stringify({
            recurring_application_charge: {
                name: 'Pro Plan',
                price: 10.0,
                return_url: returnUrl,
                test: true
            }
        })
    });

    if (!response.ok) return null;

    const data = await response.json();
    return data.recurring_application_charge;
}

export const shopifyUtils = {
    sanitizeShop: (shop: string) => {
        // Simple regex for myshopify.com
        const regex = /^[a-zA-Z0-9][a-zA-Z0-9\-]*\.myshopify\.com$/;
        if (regex.test(shop)) return shop;
        return null;
    }
};
