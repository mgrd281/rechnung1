import { NextRequest, NextResponse } from 'next/server';
import { storeSession, checkSubscription, createSubscription } from '@/lib/shopify-app';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
    try {
        const searchParams = req.nextUrl.searchParams;
        const shop = searchParams.get('shop');
        const code = searchParams.get('code');
        const state = searchParams.get('state');

        const savedState = req.cookies.get('shopify_oauth_state')?.value;

        if (!shop || !code || !state) {
            return NextResponse.json({ error: 'Missing parameters' }, { status: 400 });
        }

        if (state !== savedState) {
            return NextResponse.json({ error: 'Invalid state' }, { status: 403 });
        }

        // Exchange code for token
        const accessTokenResponse = await fetch(`https://${shop}/admin/oauth/access_token`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                client_id: process.env.SHOPIFY_API_KEY,
                client_secret: process.env.SHOPIFY_API_SECRET,
                code
            })
        });

        if (!accessTokenResponse.ok) {
            const errorText = await accessTokenResponse.text();
            console.error('Failed to exchange token:', errorText);
            return NextResponse.json({ error: 'Failed to exchange token' }, { status: 500 });
        }

        const tokenData = await accessTokenResponse.json();
        const accessToken = tokenData.access_token;

        // Store Session
        const session = {
            id: `offline_${shop}`,
            shop: shop,
            state: state,
            isOnline: false,
            accessToken: accessToken,
            scope: tokenData.scope
        };

        await storeSession(session);

        // Register Webhooks
        const webhookUrl = `${process.env.SHOPIFY_APP_URL}/api/shopify/webhooks`;
        const topics = ['orders/create', 'orders/updated'];

        for (const topic of topics) {
            try {
                const response = await fetch(`https://${shop}/admin/api/2024-10/webhooks.json`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'X-Shopify-Access-Token': accessToken
                    },
                    body: JSON.stringify({
                        webhook: {
                            topic: topic,
                            address: webhookUrl,
                            format: 'json'
                        }
                    })
                });

                if (response.ok) {
                    console.log(`✅ Registered webhook ${topic} for ${shop}`);
                } else {
                    const err = await response.json();
                    // Ignore if already exists (422)
                    if (!JSON.stringify(err).includes('taken')) {
                        console.warn(`⚠️ Failed to register webhook ${topic}:`, err);
                    }
                }
            } catch (error) {
                console.warn(`⚠️ Failed to register webhook ${topic}:`, error);
            }
        }

        // Check Billing
        const hasSubscription = await checkSubscription(session);

        if (!hasSubscription) {
            const returnUrl = `https://${shop}/admin/apps/${process.env.SHOPIFY_API_KEY}`;
            const charge = await createSubscription(session, returnUrl);
            if (charge && charge.confirmation_url) {
                return NextResponse.redirect(charge.confirmation_url);
            }
        }

        // Redirect to App (Embedded)
        const appUrl = `https://${shop}/admin/apps/${process.env.SHOPIFY_API_KEY}`;
        return NextResponse.redirect(appUrl);

    } catch (error) {
        console.error('OAuth Callback Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
