const fs = require('fs')

const TOKEN = 'REDACTED_SHOPIFY_TOKEN'
const SHOP = '45dv93-bk.myshopify.com'
const THEME_ID = '180712997131'

async function searchTheme(query) {
    console.log(`Searching for "${query}" in theme assets (slow mode)...`)

    const resp = await fetch(`https://${SHOP}/admin/api/2024-01/themes/${THEME_ID}/assets.json`, {
        headers: { 'X-Shopify-Access-Token': TOKEN }
    })
    const data = await resp.json()
    const assets = data.assets

    for (const asset of assets) {
        if (!asset.key.endsWith('.liquid') && !asset.key.endsWith('.json')) continue
        if (asset.key.startsWith('locales/')) continue

        await new Promise(r => setTimeout(r, 1000)) // 1 second delay between requests

        try {
            const assetResp = await fetch(`https://${SHOP}/admin/api/2024-01/themes/${THEME_ID}/assets.json?asset[key]=${asset.key}`, {
                headers: { 'X-Shopify-Access-Token': TOKEN }
            })
            const assetData = await assetResp.json()
            if (assetData.asset && assetData.asset.value) {
                const content = assetData.asset.value
                if (content.includes(query)) {
                    console.log(`✅ ${asset.key}`)
                    const lines = content.split('\n')
                    lines.forEach((l, i) => {
                        if (l.includes(query)) console.log(`   ${i + 1}: ${l.trim()}`)
                    })
                }
            }
        } catch (e) {
            console.error(`Error fetching ${asset.key}:`, e.message)
        }
    }
}

searchTheme('<h1')
