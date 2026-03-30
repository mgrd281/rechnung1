const fs = require('fs')

const TOKEN = 'REDACTED_SHOPIFY_TOKEN'
const SHOP = '45dv93-bk.myshopify.com'
const BLOG_ID = '114484707595'
const ARTICLE_ID = '642802286859'

async function fixArticle() {
    console.log('Fixing article: removing expired AI images...')
    const data = JSON.parse(fs.readFileSync('article_content.json', 'utf8'))
    let html = data.article.body_html

    // Remove img tags with the broken domain
    const regex = /<img[^>]*src="https:\/\/oaidalleapiprodscus\.blob\.core\.windows\.net\/[^"]*"[^>]*>/g
    const fixedHtml = html.replace(regex, '<!-- Removed expired AI image -->')

    if (html !== fixedHtml) {
        console.log('Detected broken images. Updating article...')
        const response = await fetch(`https://${SHOP}/admin/api/2024-01/blogs/${BLOG_ID}/articles/${ARTICLE_ID}.json`, {
            method: 'PUT',
            headers: {
                'X-Shopify-Access-Token': TOKEN,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                article: {
                    id: ARTICLE_ID,
                    body_html: fixedHtml
                }
            })
        })

        if (response.ok) {
            console.log('✅ Article updated and broken images removed.')
        } else {
            console.error('❌ Failed to update article:', await response.text())
        }
    } else {
        console.log('No broken images found to remove.')
    }
}

fixArticle()
