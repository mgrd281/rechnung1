const fs = require('fs')
const TOKEN = 'REDACTED_SHOPIFY_TOKEN'
const SHOP = '45dv93-bk.myshopify.com'

async function searchPages(query) {
    console.log(`Searching for "${query}" in pages...`)
    const resp = await fetch(`https://${SHOP}/admin/api/2024-01/pages.json`, {
        headers: { 'X-Shopify-Access-Token': TOKEN }
    })
    const { pages } = await resp.json()
    for (const page of pages) {
        if (page.body_html && page.body_html.includes(query)) {
            console.log(`✅ Found in Page: ${page.title} (ID: ${page.id})`)
        }
    }
}

searchPages(process.argv[2])
