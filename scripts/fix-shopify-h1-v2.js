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
    // 1. modern-contact-form.liquid
    await updateAsset('sections/modern-contact-form.liquid', (content) => {
        return content.replace(/<h1 class="contact-title">\{\{ section\.settings\.heading \}\}<\/h1>/,
            '<h1 class="contact-title">{{ section.settings.heading }} – Support & Service Karinex</h1>')
    })

    // 2. modern-live-chat.liquid
    await updateAsset('sections/modern-live-chat.liquid', (content) => {
        return content.replace(/<h1 class="chat-title" id="chat-title">\{\{ section\.settings\.heading \}\}<\/h1>/,
            '<h1 class="chat-title" id="chat-title">{{ section.settings.heading }} – Karinex Live-Support</h1>')
    })

    console.log('Additional SEO H1 Fixes completed.')
}

fixH1s().catch(console.error)
