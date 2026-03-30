const fs = require('fs')
const path = require('path')

const TOKEN = 'REDACTED_SHOPIFY_TOKEN'
const SHOP = '45dv93-bk.myshopify.com'
const THEME_ID = '180712997131'

async function searchTheme(query) {
    console.log(`Searching for "${query}" in theme assets (excluding locales/assets)...`)

    try {
        const resp = await fetch(`https://${SHOP}/admin/api/2024-01/themes/${THEME_ID}/assets.json`, {
            headers: { 'X-Shopify-Access-Token': TOKEN }
        })
        const data = await resp.json()
        if (!data.assets) {
            console.error('Failed to get assets:', data)
            return
        }

        const assets = data.assets

        for (const asset of assets) {
            // Skip locales and compiled assets
            if (asset.key.startsWith('locales/') || asset.key.startsWith('assets/')) continue;

            // Only search text files
            if (asset.key.endsWith('.liquid') || asset.key.endsWith('.json')) {
                // Rate limiting: sleep a bit
                await new Promise(r => setTimeout(r, 500))

                const assetResp = await fetch(`https://${SHOP}/admin/api/2024-01/themes/${THEME_ID}/assets.json?asset[key]=${asset.key}`, {
                    headers: { 'X-Shopify-Access-Token': TOKEN }
                })
                const assetData = await assetResp.json()
                if (assetData.asset && assetData.asset.value) {
                    const content = assetData.asset.value
                    if (content.includes(query)) {
                        console.log(`✅ Found in: ${asset.key}`)
                        const lines = content.split('\n')
                        lines.forEach((line, i) => {
                            if (line.includes(query)) {
                                console.log(`   ${i + 1}: ${line.trim()}`)
                            }
                        })
                    }
                }
            }
        }
    } catch (err) {
        console.error('Global error:', err)
    }
}

const query = process.argv[2]
if (query) searchTheme(query)
else console.log('Please provide a search query')
