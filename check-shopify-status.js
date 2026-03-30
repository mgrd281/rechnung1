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

async function checkShopify() {
    console.log('Checking Shopify Connection...')

    // Load env vars manually
    const env = { ...loadEnv('.env'), ...loadEnv('.env.local'), ...loadEnv('.env.development') }

    const shop = env.SHOPIFY_SHOP_DOMAIN
    const token = env.SHOPIFY_ACCESS_TOKEN
    const version = env.SHOPIFY_API_VERSION || '2024-01'

    if (!shop || !token) {
        console.error('❌ Missing Shopify credentials in .env files')
        console.log('Found keys:', Object.keys(env))
        return
    }

    console.log(`Target Shop: ${shop}`)

    try {
        const response = await fetch(`https://${shop}/admin/api/${version}/shop.json`, {
            headers: {
                'X-Shopify-Access-Token': token,
                'Content-Type': 'application/json'
            }
        })

        if (response.ok) {
            const data = await response.json()
            console.log('✅ Connection Successful!')
            console.log(`Shop Name: ${data.shop.name}`)
            console.log(`Email: ${data.shop.email}`)
            console.log(`Currency: ${data.shop.currency}`)
            console.log(`Plan: ${data.shop.plan_name}`)
        } else {
            console.error(`❌ Connection Failed: ${response.status} ${response.statusText}`)
            const errorText = await response.text()
            console.error('Error Details:', errorText)
        }

    } catch (error) {
        console.error('❌ Network Error:', error.message)
    }
}

checkShopify()
