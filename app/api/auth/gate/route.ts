export const dynamic = "force-dynamic"
import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function POST(request: NextRequest) {
    try {
        const { password } = await request.json();

        // Get the gate password from environment variable
        const GATE_PASSWORD = process.env.ACCESS_GATE_PASSWORD || 'demo123';

        // Verify password
        if (password !== GATE_PASSWORD) {
            return NextResponse.json(
                { success: false, error: 'Falsches Passwort' },
                { status: 401 }
            );
        }

        // Set cookie for 12 hours
        const response = NextResponse.json({ success: true });

        response.cookies.set('access_gate_unlocked', 'true', {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            maxAge: 60 * 60 * 12, // 12 hours
            path: '/'
        });

        return response;

    } catch (error: any) {
        console.error('Access gate error:', error);
        return NextResponse.json(
            { success: false, error: 'Ein Fehler ist aufgetreten' },
            { status: 500 }
        );
    }
}

// Optional: GET endpoint to check if gate is unlocked
export async function GET(request: NextRequest) {
    const cookieStore = await cookies();
    const isUnlocked = cookieStore.get('access_gate_unlocked')?.value === 'true';

    return NextResponse.json({ unlocked: isUnlocked });
}
