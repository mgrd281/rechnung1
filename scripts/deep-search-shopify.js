const fs = require('fs')

const TOKEN = 'REDACTED_SHOPIFY_TOKEN'
const SHOP = '45dv93-bk.myshopify.com'
const THEME_ID = '180712997131'

async function searchAll(query) {
    console.log(`Deep searching for "${query}" in ALL theme assets...`)
    const resp = await fetch(`https://${SHOP}/admin/api/2024-01/themes/${THEME_ID}/assets.json`, {
        headers: { 'X-Shopify-Access-Token': TOKEN }
    })
    const { assets } = await resp.json()

    for (const asset of assets) {
        // Skip binary files
        if (asset.content_type && (asset.content_type.includes('image') || asset.content_type.includes('font'))) continue;

        const assetResp = await fetch(`https://${SHOP}/admin/api/2024-01/themes/${THEME_ID}/assets.json?asset[key]=${asset.key}`, {
            headers: { 'X-Shopify-Access-Token': TOKEN }
        })
        const data = await assetResp.json()
        if (data.asset && data.asset.value && data.asset.value.includes(query)) {
            console.log(`✅ Found in: ${asset.key}`)
        }
    }
}

searchAll(process.argv[2])
