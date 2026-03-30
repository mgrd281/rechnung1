export const dynamic = "force-dynamic"
import { NextResponse } from 'next/server'

import { auth } from "@/lib/auth"
import { ShopifyAPI } from '@/lib/shopify-api'

export async function GET(req: Request) {
    try {
        const session = await auth()
        if (!session) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const shopify = new ShopifyAPI()

        // 1. Get Blogs to find the correct Blog ID
        const blogs = await shopify.getBlogs()
        if (!blogs || blogs.length === 0) {
            return NextResponse.json({ ok: true, data: { items: [], total: 0 } })
        }

        // Assume the first blog is the main one (or filter by specific name if needed)
        // Usually "News" or "Blog"
        const mainBlog = blogs[0]

        // 2. Get Articles
        const articles = await shopify.getArticles(mainBlog.id, { limit: 250 })

        // 3. Map to Item Model
        const items = articles.map((article: any) => ({
            id: article.id,
            title: article.title,
            status: article.published_at ? 'published' : 'draft',
            seoScore: null, // Not available in Shopify API directly
            publishedAt: article.published_at,
            updatedAt: article.updated_at,
            shopifyArticleId: article.id.toString(),
            url: `${mainBlog.handle}/${article.handle}` // Construct relative URL
        }))

        // Sort by publishedAt desc
        items.sort((a, b) => new Date(b.publishedAt || b.updatedAt).getTime() - new Date(a.publishedAt || a.updatedAt).getTime())

        return NextResponse.json({
            ok: true,
            data: {
                items,
                total: items.length,
                page: 1,
                pageSize: items.length
            }
        })

    } catch (error: any) {
        console.error('Error fetching content posts:', error)
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}

export async function DELETE(req: Request) {
    try {
        const session = await auth()
        if (!session) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        // Extract ID from URL
        const url = new URL(req.url)
        // Since we can't easily use dynamic routes in the same file for "DELETE /:id", 
        // we'll expect the ID as a query param or parse the last segment if we were using Next.js App Router dynamic folders.
        // But the user asked for `DELETE /api/content/posts/:id`. 
        // To support that, I should technically place this in `app/api/content/posts/[id]/route.ts`.
        // However, I can also support DELETE with body or query param `?id=...` in this file to keep it simple if the user allows.
        // The user SPECIFIED `DELETE /api/content/posts/:id`. 
        // So I MUST create `app/api/content/posts/[id]/route.ts`.

        // Wait, I cannot export DELETE in this file if it's meant for a specific ID unless I use query params.
        // I will Create the folder `[id]` and move DELETE there.

        return NextResponse.json({ error: 'Method not allowed. Use /api/content/posts/[id]' }, { status: 405 })

    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}
