import { NextRequest, NextResponse } from 'next/server';
import { shopifyUtils } from '@/lib/shopify-app';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
    const shop = req.nextUrl.searchParams.get('shop');
    if (!shop) {
        return NextResponse.json({ error: 'Missing shop parameter' }, { status: 400 });
    }

    // Sanitize shop
    const sanitizedShop = shopifyUtils.sanitizeShop(shop);
    if (!sanitizedShop) {
        return NextResponse.json({ error: 'Invalid shop parameter' }, { status: 400 });
    }

    const redirectUri = `${process.env.SHOPIFY_APP_URL}/api/shopify/auth/callback`;
    const state = Math.random().toString(36).substring(7);

    const query = new URLSearchParams({
        client_id: process.env.SHOPIFY_API_KEY!,
        scope: process.env.SCOPES || 'read_orders,write_orders',
        redirect_uri: redirectUri,
        state: state
    });

    const url = `https://${sanitizedShop}/admin/oauth/authorize?${query.toString()}`;

    const response = NextResponse.redirect(url);
    response.cookies.set('shopify_oauth_state', state, { secure: true, httpOnly: true, sameSite: 'lax' });
    return response;
}
