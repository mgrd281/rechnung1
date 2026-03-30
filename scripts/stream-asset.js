const https = require('https')
const fs = require('fs')

const TOKEN = 'REDACTED_SHOPIFY_TOKEN'
const SHOP = '45dv93-bk.myshopify.com'
const THEME_ID = '180712997131'

const options = {
    hostname: SHOP,
    path: `/admin/api/2024-01/themes/${THEME_ID}/assets.json?asset[key]=sections/main-product.liquid`,
    headers: { 'X-Shopify-Access-Token': TOKEN }
}

const file = fs.createWriteStream('raw_response.json')

https.get(options, (res) => {
    console.log('Status code:', res.statusCode)
    res.pipe(file)
    file.on('finish', () => {
        console.log('✅ Stream finished')
        file.close()
    })
}).on('error', (e) => {
    console.error('❌ Request Error:', e.message)
})
