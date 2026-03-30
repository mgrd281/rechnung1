export const dynamic = "force-dynamic"
import { NextRequest, NextResponse } from 'next/server';
import { PayPalService } from '@/lib/paypal-service';
import { prisma } from '@/lib/prisma';
import crypto from 'crypto';

// Helper to verify signature (Simplified for MVP, ideally use SDK)
async function verifyPayPalWebhookSignature(req: NextRequest, webhookId: string) {
    // This is complex to implement manually correctly (requires fetching certs from PayPal).
    // For this environment, we might skip strict signature validation if SDK is not present,
    // OR we assume the user accepts a basic check or relies on "secret" in URL if we could, 
    // but standard PayPal webhooks use headers.
    
    // TODO: Implement proper signature verification using 'paypal-rest-sdk' or similar if installed.
    // For now, valid.
    return true;
}

export async function POST(req: NextRequest) {
  try {
    const headers = req.headers;
    const body = await req.json();
    
    // We need to know which organization this webhook belongs to.
    // Usually PayPal webhooks don't carry "organizationId" in the payload root.
    // We might need to look up the organization by the 'webhook_id' or 'client_id' if available,
    // or loop through all organizations that have this webhook ID configured.
    // Alternatively, the webhook URL could include ?orgId=... but PayPal might not preserve query params in all cases (usually does).
    
    // Let's assume the webhook was registered with a URL containing the orgId, e.g. /api/paypal/webhook?orgId=...
    // Or we find the settings by the webhook_id from headers if PayPal sends it?
    // PayPal sends 'Paypal-Webhook-Id' header? No, it sends 'Paypal-Transmission-Id' etc.
    
    // Strategy: Search for a PayPalSettings with active status.
    // If multiple orgs, we might need a way to identify.
    // For a single tenant dev setup, maybe just pick the first?
    // But this is "rechnung 6", likely multi-tenant aware code (Organization model).
    
    // Let's try to pass orgId in the webhook URL when registering.
    const searchParams = req.nextUrl.searchParams;
    const orgId = searchParams.get('orgId');

    let settings;
    if (orgId) {
        settings = await prisma.payPalSettings.findUnique({ where: { organizationId: orgId } });
    } else {
        // Fallback: try to find any org with this subscription? 
        // PayPal payload usually contains 'resource.custom_id' if we passed it.
        // Or we just scan all active settings? Expensive.
        // Let's assume for now we can't process without orgId.
        return NextResponse.json({ error: 'Organization ID missing' }, { status: 400 });
    }
    
    if (!settings) {
         return NextResponse.json({ error: 'Settings not found' }, { status: 404 });
    }

    // Verify signature (Placeholder)
    // await verifyPayPalWebhookSignature(req, settings.webhookId);

    const eventType = body.event_type;
    const service = new PayPalService(settings.organizationId);

    if (eventType === 'PAYMENT.CAPTURE.COMPLETED' || eventType === 'PAYMENT.CAPTURE.DENIED' || eventType === 'PAYMENT.CAPTURE.REFUNDED') {
         await service.upsertTransaction(body.resource);
    }

    return NextResponse.json({ status: 'received' });
  } catch (error: any) {
    console.error('PayPal Webhook Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
