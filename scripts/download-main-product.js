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

https.get(options, (res) => {
    let data = ''
    res.on('data', (chunk) => { data += chunk })
    res.on('end', () => {
        try {
            const json = JSON.parse(data)
            if (json.asset && json.asset.value) {
                fs.writeFileSync('main-product.liquid', json.asset.value)
                console.log('✅ Success')
            } else {
                console.error('❌ Asset value missing', Object.keys(json))
            }
        } catch (e) {
            console.error('❌ JSON Parse Error:', e.message)
            fs.writeFileSync('error_response.json', data)
        }
    })
}).on('error', (e) => {
    console.error('❌ Request Error:', e.message)
})
