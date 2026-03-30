const fs = require('fs')
const TOKEN = 'REDACTED_SHOPIFY_TOKEN'
const SHOP = '45dv93-bk.myshopify.com'

async function searchProducts(query) {
    console.log(`Searching for "${query}" in products...`)

    let url = `https://${SHOP}/admin/api/2024-01/products.json?limit=250`
    while (url) {
        const resp = await fetch(url, { headers: { 'X-Shopify-Access-Token': TOKEN } })
        const data = await resp.json()
        for (const product of data.products) {
            if (product.body_html && product.body_html.includes(query)) {
                console.log(`✅ Found in Product: ${product.title} (ID: ${product.id})`)
            }
        }

        // Handle pagination
        const link = resp.headers.get('link')
        if (link && link.includes('rel="next"')) {
            const match = link.match(/<([^>]+)>;\s*rel="next"/)
            url = match ? match[1] : null
        } else {
            url = null
        }
    }
}

searchProducts(process.argv[2])
