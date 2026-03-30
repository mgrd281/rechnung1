export const dynamic = "force-dynamic"
import { NextResponse } from 'next/server'

import { auth } from "@/lib/auth"
import { ShopifyAPI } from '@/lib/shopify-api'

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
    try {
        const session = await auth()
        if (!session) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const articleId = params.id
        if (!articleId) {
            return NextResponse.json({ error: 'Missing Article ID' }, { status: 400 })
        }

        const shopify = new ShopifyAPI()

        // 1. Get Blogs to find the correct Blog ID
        const blogs = await shopify.getBlogs()
        if (!blogs || blogs.length === 0) {
            return NextResponse.json({ error: 'No blogs found' }, { status: 404 })
        }
        const mainBlog = blogs[0]

        // 2. Delete Article
        await shopify.deleteArticle(mainBlog.id, articleId)

        return NextResponse.json({ ok: true })

    } catch (error: any) {
        console.error('Error deleting content post:', error)
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}
