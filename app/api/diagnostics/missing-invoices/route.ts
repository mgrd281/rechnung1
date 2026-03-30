import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
    try {
        const searchParams = request.nextUrl.searchParams;
        const start = parseInt(searchParams.get('start') || '1001');
        const end = parseInt(searchParams.get('end') || '3591');

        if (isNaN(start) || isNaN(end)) {
            return NextResponse.json({ error: 'Invalid start or end numbers' }, { status: 400 });
        }

        // Fetch all invoice numbers
        const invoices = await prisma.invoice.findMany({
            select: {
                invoiceNumber: true
            }
        });

        // Extract numbers from invoice strings (e.g., "#1001" -> 1001)
        const existingNumbers = new Set<number>();

        invoices.forEach(inv => {
            // Remove non-numeric characters except potentially leading/trailing whitespace
            const cleanNum = inv.invoiceNumber.replace(/[^0-9]/g, '');
            const num = parseInt(cleanNum);
            if (!isNaN(num)) {
                existingNumbers.add(num);
            }
        });

        const missingNumbers: number[] = [];

        for (let i = start; i <= end; i++) {
            if (!existingNumbers.has(i)) {
                missingNumbers.push(i);
            }
        }

        return NextResponse.json({
            start,
            end,
            missingCount: missingNumbers.length,
            missingNumbers: missingNumbers.slice(0, 1000) // Limit to 1000 to avoid huge payloads
        });

    } catch (error: any) {
        console.error('Missing invoices check error:', error);
        return NextResponse.json(
            { error: 'Failed to check missing invoices' },
            { status: 500 }
        );
    }
}
