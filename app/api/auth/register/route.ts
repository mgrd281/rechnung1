export const dynamic = "force-dynamic"
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import { sendVerificationEmail } from '@/lib/email';
import crypto from 'crypto';

export async function POST(req: NextRequest) {
    try {
        const { email, password, name } = await req.json();

        if (!email || !password) {
            return NextResponse.json({ error: 'Email and password are required' }, { status: 400 });
        }

        const existingUser = await prisma.user.findUnique({
            where: { email }
        });

        if (existingUser) {
            return NextResponse.json({ error: 'User already exists' }, { status: 400 });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        const verificationToken = crypto.randomBytes(32).toString('hex');

        // Create user in database
        const newUser = await prisma.user.create({
            data: {
                email,
                name: name || email.split('@')[0],
                passwordHash: hashedPassword,
                verificationToken,
                emailVerified: null, // Not verified yet
                role: 'USER'
            }
        });

        // Send verification email
        sendVerificationEmail(email, verificationToken).catch(console.error);

        return NextResponse.json({
            success: true,
            message: 'Registration successful. Please check your email to verify your account.',
            userId: newUser.id
        });

    } catch (error) {
        console.error('Registration error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
