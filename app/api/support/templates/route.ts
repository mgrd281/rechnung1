export const dynamic = "force-dynamic"

import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
    try {
        const templates = await prisma.responseTemplate.findMany({
            orderBy: { createdAt: 'desc' }
        })
        return NextResponse.json({ success: true, data: templates })
    } catch (error) {
        return NextResponse.json({ error: 'Failed to fetch templates' }, { status: 500 })
    }
}

export async function POST(req: Request) {
    try {
        const body = await req.json()
        const { title, content, keywords } = body

        // Get first org
        const org = await prisma.organization.findFirst()
        if (!org) return NextResponse.json({ error: 'No org' }, { status: 400 })

        const template = await prisma.responseTemplate.create({
            data: {
                organizationId: org.id,
                title,
                content,
                autoReplyKeywords: keywords || null
            }
        })

        return NextResponse.json({ success: true, data: template })
    } catch (error) {
        return NextResponse.json({ error: 'Failed to create template' }, { status: 500 })
    }
}

export async function DELETE(req: Request) {
    try {
        const { searchParams } = new URL(req.url)
        const id = searchParams.get('id')
        if (!id) return NextResponse.json({ error: 'ID required' }, { status: 400 })

        await prisma.responseTemplate.delete({ where: { id } })
        return NextResponse.json({ success: true })
    } catch (error) {
        return NextResponse.json({ error: 'Failed to delete' }, { status: 500 })
    }
}

export async function PUT(req: Request) {
    try {
        const body = await req.json()
        const { id, title, content, keywords } = body

        if (!id) return NextResponse.json({ error: 'ID required' }, { status: 400 })

        const template = await prisma.responseTemplate.update({
            where: { id },
            data: {
                title,
                content,
                autoReplyKeywords: keywords || null
            }
        })

        return NextResponse.json({ success: true, data: template })
    } catch (error) {
        return NextResponse.json({ error: 'Failed to update template' }, { status: 500 })
    }
}
