export const dynamic = "force-dynamic"
import { NextRequest, NextResponse } from 'next/server';
import { PayPalService } from '@/lib/paypal-service';
;
import { auth } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const session = await auth();
  
  // Cast user to any or a custom type to access organizationId added in callbacks
  const user = session?.user as any;

  if (!user || !user.organizationId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const searchParams = req.nextUrl.searchParams;
  const from = searchParams.get('from') ? new Date(searchParams.get('from')!) : new Date(new Date().setFullYear(new Date().getFullYear() - 1));
  const to = searchParams.get('to') ? new Date(searchParams.get('to')!) : new Date();

  try {
    const service = new PayPalService(user.organizationId);
    const transactions = await service.listTransactions(from, to);
    return NextResponse.json(transactions);
  } catch (error: any) {
    console.error('Error fetching PayPal transactions:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
    const session = await auth();
    const user = session?.user as any;

    if (!user || !user.organizationId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    try {
        const body = await req.json();
        const service = new PayPalService(user.organizationId);

        if (body.action === 'sync') {
            // Trigger manual sync for a period or specific id?
            // For MVP, maybe just "Check recent"
            // Or if body has 'captureId'
            if (body.captureId) {
                const tx = await service.syncTransaction(body.captureId);
                return NextResponse.json(tx);
            }
        } else if (body.action === 'sync_history') {
             const count = await service.fetchTransactionsFromPayPal();
             return NextResponse.json({ synced: count });
        }

        
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    } catch (error: any) {
        console.error('Error in PayPal POST:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
