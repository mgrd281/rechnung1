import NextAuth, { DefaultSession } from "next-auth"

declare module "next-auth" {
    /**
     * Returned by `useSession`, `getSession` and received as a prop on the `SessionProvider` React Context
     */
    interface Session {
        user: {
            /** The user's specific organization ID. */
            organizationId?: string | null
            /** The user's ID. */
            id?: string
        } & DefaultSession["user"]
    }

    interface User {
        organizationId?: string | null
    }
}

declare module "next-auth/jwt" {
    interface JWT {
        organizationId?: string | null
    }
}
