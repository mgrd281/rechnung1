export const dynamic = "force-dynamic"
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
    try {
        // Clear the access gate cookie
        const response = NextResponse.json({ success: true });

        response.cookies.set('access_gate_unlocked', '', {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            maxAge: 0, // Expire immediately
            path: '/'
        });

        return response;

    } catch (error: any) {
        console.error('Logout error:', error);
        return NextResponse.json(
            { success: false, error: 'Logout fehlgeschlagen' },
            { status: 500 }
        );
    }
}
