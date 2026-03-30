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
    console.log('Fixing snippets/scripts.liquid...')

    const contentData = JSON.parse(fs.readFileSync('snippets_scripts.json', 'utf8'))
    let content = contentData.asset.value

    let updated = false
    MISSING_FILES.forEach(file => {
        // Use a more flexible regex to match the lines accurately
        const lineRegex = new RegExp(`<script src="{{ '${file}' \\| asset_url }}" defer><\\/script>`, 'g')
        if (content.match(lineRegex)) {
            console.log(`✅ Commenting out missing asset: ${file}`)
            content = content.replace(lineRegex, `{% comment %}<script src="{{ '${file}' | asset_url }}" defer></script>{% endcomment %}<!-- SEO FIX: File missing -->`)
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
            console.log('✅ Success: snippets/scripts.liquid updated.')
        } else {
            console.error('❌ Error updating snippet:', await updateResp.text())
        }
    } else {
        console.log('No matching missing scripts found in snippet.')
    }
}

fixScripts()
