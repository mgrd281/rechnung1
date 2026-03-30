const fs = require('fs')

const TOKEN = 'REDACTED_SHOPIFY_TOKEN'
const SHOP = '45dv93-bk.myshopify.com'
const THEME_ID = '180712997131'

async function downloadAsset(key) {
    console.log(`Downloading ${key}...`)
    const resp = await fetch(`https://${SHOP}/admin/api/2024-01/themes/${THEME_ID}/assets.json?asset[key]=${key}`, {
        headers: { 'X-Shopify-Access-Token': TOKEN }
    })
    const data = await resp.json()
    if (data.asset && data.asset.value) {
        fs.writeFileSync('temp_asset.liquid', data.asset.value)
        console.log('✅ Saved to temp_asset.liquid')
    } else {
        console.error('❌ Failed:', data)
    }
}

const key = process.argv[2]
if (key) downloadAsset(key)
else console.log('Provide asset key')
