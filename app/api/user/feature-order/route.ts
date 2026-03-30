import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth';
import { loadUsersFromDisk, saveUsersToDisk } from '@/lib/server-storage'

export const dynamic = 'force-dynamic'

export async function POST(req: Request) {
    try {
        const session = await auth()
        const userEmail = session?.user?.email

        if (!userEmail) {
            return new NextResponse('Unauthorized', { status: 401 })
        }

        const body = await req.json()
        const { featureOrder } = body

        if (!Array.isArray(featureOrder)) {
            return new NextResponse('Invalid data', { status: 400 })
        }

        const users = loadUsersFromDisk()
        const userIndex = users.findIndex((u: any) => u.email === userEmail)

        if (userIndex !== -1) {
            users[userIndex].featureOrder = featureOrder
            saveUsersToDisk(users)
        } else {
            console.warn(`User ${userEmail} not found in local storage for feature order update`)
        }

        return NextResponse.json({ success: true })
    } catch (error) {
        console.error('Error saving feature order:', error)
        return new NextResponse('Internal Error', { status: 500 })
    }
}

export async function GET(req: Request) {
    try {
        const session = await auth()
        const userEmail = session?.user?.email

        if (!userEmail) {
            return new NextResponse('Unauthorized', { status: 401 })
        }

        const users = loadUsersFromDisk()
        const user = users.find((u: any) => u.email === userEmail)

        return NextResponse.json({ featureOrder: user?.featureOrder || null })
    } catch (error) {
        console.error('Error fetching feature order:', error)
        return new NextResponse('Internal Error', { status: 500 })
    }
}
