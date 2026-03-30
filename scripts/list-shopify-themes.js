const fs = require('fs')
const path = require('path')

function loadEnv(filename) {
    try {
        const content = fs.readFileSync(path.join(__dirname, filename), 'utf8')
        const env = {}
        content.split('\n').forEach(line => {
            const [key, value] = line.split('=')
            if (key && value) {
                env[key.trim()] = value.trim().replace(/"/g, '')
            }
        })
        return env
    } catch (e) {
        return {}
    }
}

async function listThemes() {
    console.log('Fetching Shopify Themes...')
    const env = { ...loadEnv('.env'), ...loadEnv('.env.local'), ...loadEnv('.env.development') }
    const shop = env.SHOPIFY_SHOP_DOMAIN
    const token = env.SHOPIFY_ACCESS_TOKEN
    const version = env.SHOPIFY_API_VERSION || '2024-01'

    if (!shop || !token) {
        console.error('❌ Missing Shopify credentials')
        return
    }

    try {
        const response = await fetch(`https://${shop}/admin/api/${version}/themes.json`, {
            headers: {
                'X-Shopify-Access-Token': token,
                'Content-Type': 'application/json'
            }
        })

        if (response.ok) {
            const data = await response.json()
            console.log('✅ Themes found:')
            data.themes.forEach(theme => {
                console.log(`- [${theme.role}] ID: ${theme.id} | Name: ${theme.name}`)
            })
        } else {
            console.error(`❌ Failed: ${response.status}`)
            console.log(await response.text())
        }
    } catch (error) {
        console.error('❌ Error:', error.message)
    }
}

listThemes()
