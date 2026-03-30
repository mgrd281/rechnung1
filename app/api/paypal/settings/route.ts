export const dynamic = "force-dynamic"
import { NextRequest, NextResponse } from 'next/server';
;
import { auth } from "@/lib/auth";
import { prisma } from '@/lib/prisma';
import { encrypt, decrypt } from '@/lib/crypto-utils';

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session || !session.user || !session.user.organizationId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const settings = await prisma.payPalSettings.findUnique({
      where: { organizationId: session.user.organizationId }
    });

    if (!settings) {
      return NextResponse.json({ isActive: false, clientId: '', webhookId: '' });
    }

    // Return masked secret or just empty, never real secret
    return NextResponse.json({
      isActive: settings.isActive,
      clientId: settings.clientId,
      webhookId: settings.webhookId,
      mode: settings.mode || 'live',
      hasSecret: !!settings.clientSecret // Tell UI we have a secret set
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session || !session.user || !session.user.organizationId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { clientId, clientSecret, isActive, mode } = body;

    // Validation
    if (!clientId && isActive) {
        return NextResponse.json({ error: 'Client ID required' }, { status: 400 });
    }

    const data: any = {
      isActive,
      clientId: clientId?.trim(),
      mode,
      organizationId: session.user.organizationId
    };

    // Only update secret if provided (allow empty to keep existing)
    if (clientSecret && clientSecret.length > 0) {
        data.clientSecret = encrypt(clientSecret.trim());
    }

    const settings = await prisma.payPalSettings.upsert({
      where: { organizationId: session.user.organizationId },
      create: {
          ...data,
          clientSecret: data.clientSecret || '' // Handle case where secret is needed on create
      },
      update: data
    });

    return NextResponse.json(settings);
  } catch (error: any) {
    console.error("Error saving PayPal settings:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
