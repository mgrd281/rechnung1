import NextAuth from "next-auth"
import Credentials from "next-auth/providers/credentials"
import Google from "next-auth/providers/google"
import Apple from "next-auth/providers/apple"
import { prisma } from "@/lib/prisma"
import { PrismaAdapter } from "@auth/prisma-adapter"
import bcrypt from "bcryptjs"

export const { handlers, auth, signIn, signOut } = NextAuth({
    adapter: PrismaAdapter(prisma),
    session: { strategy: "jwt" },
    debug: true,
    trustHost: true,
    providers: [
        Google({
            clientId: process.env.GOOGLE_CLIENT_ID,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        }),
        Apple({
            clientId: process.env.APPLE_ID,
            clientSecret: process.env.APPLE_SECRET,
        }),
        Credentials({
            name: "Credentials",
            credentials: {
                email: { label: "Email", type: "email" },
                password: { label: "Password", type: "password" }
            },
            async authorize(credentials) {
                if (!credentials?.email || !credentials?.password) {
                    return null
                }

                const user = await prisma.user.findUnique({
                    where: {
                        email: credentials.email as string
                    }
                })

                // Check password hash
                if (!user || !user.passwordHash) {
                    return null
                }

                const isPasswordValid = await bcrypt.compare(
                    credentials.password as string,
                    user.passwordHash
                )

                if (!isPasswordValid) {
                    return null
                }

                return {
                    id: String(user.id),
                    email: user.email,
                    name: user.name,
                    organizationId: user.organizationId
                }
            }
        })
    ],
    callbacks: {
        async session({ session, token }) {
            if (session.user && token.sub) {
                session.user.id = token.sub
                // @ts-ignore
                session.user.organizationId = token.organizationId
            }
            return session
        },
        async jwt({ token, user }) {
            if (user) {
                token.sub = user.id
                // @ts-ignore
                token.organizationId = user.organizationId
            }
            return token
        }
    },
    pages: {
        signIn: '/login',
    }
})
