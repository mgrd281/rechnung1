const fs = require('fs')
const TOKEN = 'REDACTED_SHOPIFY_TOKEN'
const SHOP = '45dv93-bk.myshopify.com'

async function searchArticles(query) {
    console.log(`Searching for "${query}" in articles...`)

    // First get blogs
    const blogResp = await fetch(`https://${SHOP}/admin/api/2024-01/blogs.json`, {
        headers: { 'X-Shopify-Access-Token': TOKEN }
    })
    const { blogs } = await blogResp.json()

    for (const blog of blogs) {
        const articleResp = await fetch(`https://${SHOP}/admin/api/2024-01/blogs/${blog.id}/articles.json`, {
            headers: { 'X-Shopify-Access-Token': TOKEN }
        })
        const { articles } = await articleResp.json()
        for (const article of articles) {
            if (article.body_html && article.body_html.includes(query)) {
                console.log(`✅ Found in Article: ${article.title} (ID: ${article.id})`)
            }
        }
    }
}

searchArticles(process.argv[2])
