const fs = require('fs')

const TOKEN = 'REDACTED_SHOPIFY_TOKEN'
const SHOP = '45dv93-bk.myshopify.com'
const THEME_ID = '180712997131'

const MISSING_FILES = [
    'global.js',
    'details-disclosure.js',
    'details-modal.js',
    'cart-notification.js',
    'search-form.js'
]

async function fixScripts() {
    console.log('Fixing snippets/scripts.liquid: commenting out missing assets...')

    const resp = await fetch(`https://${SHOP}/admin/api/2024-01/themes/${THEME_ID}/assets.json?asset[key]=snippets/scripts.liquid`, {
        headers: { 'X-Shopify-Access-Token': TOKEN }
    })
    const data = await resp.json()
    let content = data.asset.value

    let updated = false
    MISSING_FILES.forEach(file => {
        // Find line with this file and asset_url and wrap in comment
        const regex = new RegExp(`<script src="{{ '${file}' \\| asset_url }}" defer><\\/script>`, 'g')
        if (content.match(regex)) {
            console.log(`Found missing file reference: ${file}. Commenting out...`)
            content = content.replace(regex, `{% comment %}<script src="{{ '${file}' | asset_url }}" defer></script>{% endcomment %}<!-- SEO FIX: File missing -->`)
            updated = true
        }
    })

    if (updated) {
        const updateResp = await fetch(`https://${SHOP}/admin/api/2024-01/themes/${THEME_ID}/assets.json`, {
            method: 'PUT',
            headers: {
                'X-Shopify-Access-Token': TOKEN,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                asset: {
                    key: 'snippets/scripts.liquid',
                    value: content
                }
            })
        })

        if (updateResp.ok) {
            console.log('✅ snippets/scripts.liquid updated.')
        } else {
            console.error('❌ Failed to update snippet:', await updateResp.text())
        }
    } else {
        console.log('No missing script references found to fix.')
    }
}

fixScripts()
