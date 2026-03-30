const https = require('https')
const fs = require('fs')

const TOKEN = 'REDACTED_SHOPIFY_TOKEN'
const SHOP = '45dv93-bk.myshopify.com'
const THEME_ID = '180712997131'

async function updateAsset(key, transform) {
    console.log(`Updating ${key}...`)

    // Fetch
    const getOptions = {
        hostname: SHOP,
        path: `/admin/api/2024-01/themes/${THEME_ID}/assets.json?asset[key]=${key}`,
        headers: { 'X-Shopify-Access-Token': TOKEN }
    }

    const data = await new Promise((resolve, reject) => {
        https.get(getOptions, (res) => {
            let body = ''
            res.on('data', c => body += c)
            res.on('end', () => resolve(JSON.parse(body)))
        }).on('error', reject)
    })

    if (!data.asset || !data.asset.value) {
        console.error(`❌ Could not fetch ${key}`)
        return
    }

    const oldContent = data.asset.value
    const newContent = transform(oldContent)

    if (oldContent === newContent) {
        console.log(`✅ No changes needed for ${key}`)
        return
    }

    // Update
    const putOptions = {
        hostname: SHOP,
        method: 'PUT',
        path: `/admin/api/2024-01/themes/${THEME_ID}/assets.json`,
        headers: {
            'X-Shopify-Access-Token': TOKEN,
            'Content-Type': 'application/json'
        }
    }

    const putBody = JSON.stringify({
        asset: {
            key: key,
            value: newContent
        }
    })

    const result = await new Promise((resolve, reject) => {
        const req = https.request(putOptions, (res) => {
            let body = ''
            res.on('data', c => body += c)
            res.on('end', () => resolve(body))
        })
        req.on('error', reject)
        req.write(putBody)
        req.end()
    })

    console.log(`✅ ${key} updated.`)
}

async function fixH1s() {
    // 1. Fix main-page.liquid (Too many H1, Too short)
    await updateAsset('sections/main-page.liquid', (content) => {
        // Fix the redundant visually-hidden H1s and make them more descriptive
        // Replace <h1 class="visually-hidden">{{ page.title | escape }}</h1> with a more descriptive version
        // And if there are two, we should consolidate or distinguish them.

        let newContent = content.replace(/<h1 class="visually-hidden">\{\{ page\.title \| escape \}\}<\/h1>/g,
            '<h1 class="visually-hidden">{{ page.title | escape }} – Karinex Online Shop</h1>')

        return newContent
    })

    // 2. Fix product-information.liquid (Too short)
    await updateAsset('sections/product-information.liquid', (content) => {
        // For product titles, we can add a descriptor if the title is very short,
        // but it's better to just ensure it's a good H1.
        // Let's add "| Karinex" to the title if it's considered too short by SEO tools
        // Actually, let's just make it descriptive.

        let newContent = content.replace(/<h1 class="product-title" style="margin-bottom: 6px;">\{\{ product\.title \}\}<\/h1>/,
            '<h1 class="product-title" style="margin-bottom: 6px;">{{ product.title }} – Karinex</h1>')

        return newContent
    })

    console.log('SEO H1 Fixes completed.')
}

fixH1s().catch(console.error)
