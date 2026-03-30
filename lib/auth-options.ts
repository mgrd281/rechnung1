import { NextAuthOptions } from "next-auth"
import CredentialsProvider from "next-auth/providers/credentials"
import GoogleProvider from "next-auth/providers/google"
import AppleProvider from "next-auth/providers/apple"
import { prisma } from "@/lib/prisma"
import { PrismaAdapter } from "@auth/prisma-adapter"
import bcrypt from "bcryptjs"

export const authOptions: NextAuthOptions = {
    adapter: PrismaAdapter(prisma) as any,
    session: {
        strategy: "jwt",
    },
    providers: [
        GoogleProvider({
            clientId: process.env.GOOGLE_CLIENT_ID || "",
            clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
        }),
        AppleProvider({
            clientId: process.env.APPLE_ID || "",
            clientSecret: process.env.APPLE_SECRET || "",
        }),
        CredentialsProvider({
            name: "Credentials",
            credentials: {
                email: { label: "Email", type: "email" },
                password: { label: "Password", type: "password" }
            },
            async authorize(credentials) {
                if (!credentials?.email || !credentials?.password) {
                    console.log('🔐 [NextAuth] Login failed: Missing credentials')
                    return null
                }

                // Ensure email is lowercased for consistent lookup
                const email = credentials.email.toLowerCase()
                console.log(`🔐 [NextAuth] Login attempt for: ${email}`)

                const user = await prisma.user.findUnique({
                    where: { email }
                })

                // Check password hash
                if (!user) {
                    console.log(`🔐 [NextAuth] Login failed: User not found (${email})`)
                    return null
                }

                if (!user.passwordHash) {
                    console.log(`🔐 [NextAuth] Login failed: User has no password hash (${email})`)
                    return null
                }

                const isPasswordValid = await bcrypt.compare(
                    credentials.password,
                    user.passwordHash
                )

                if (!isPasswordValid) {
                    console.log(`🔐 [NextAuth] Login failed: Password mismatch for ${email}`)
                    return null
                }

                console.log(`✅ [NextAuth] Login successful for: ${email} (Role: ${user.role})`)

                return {
                    id: user.id,
                    email: user.email,
                    name: user.name,
                    organizationId: user.organizationId
                }
            }
        })
    ],
    callbacks: {
        async session({ session, token }) {
            if (session.user) {
                // @ts-ignore
                session.user.id = token.sub
                // @ts-ignore
                session.user.organizationId = token.organizationId
                // @ts-ignore
                session.user.isAdmin = token.role === 'ADMIN'
            }
            return session
        },
        async jwt({ token, user, profile }) {
            if (user) {
                token.sub = user.id
                // @ts-ignore
                token.organizationId = (user as any).organizationId
            }

            // If it's the initial sign in, or we need to refresh the organizationId
            if (token.sub && !token.organizationId) {
                const dbUser = await prisma.user.findUnique({
                    where: { id: token.sub as string }
                })
                if (dbUser) {
                    // @ts-ignore
                    token.organizationId = dbUser.organizationId
                    // @ts-ignore
                    token.role = dbUser.role
                }
            }

            return token
        }
    },
    pages: {
        signIn: '/login',
    }
}
