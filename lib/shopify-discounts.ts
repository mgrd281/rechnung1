import { ShopifyAPI } from './shopify-api'
import { getShopifySettings } from './shopify-settings'

export async function createCustomerDiscount(
    shopifyCustomerId: string,
    discountPercentage: number,
    validityDays: number
): Promise<string | null> {
    try {
        const settings = getShopifySettings()
        if (!settings.enabled) return null

        const api = new ShopifyAPI(settings)

        // Generate a unique code
        // Format: WELCOME10-{CUSTOMER_ID_LAST_4} or random
        // Using random string for better uniqueness and security
        const randomSuffix = Math.random().toString(36).substring(2, 7).toUpperCase()
        const code = `WELCOME${discountPercentage}-${randomSuffix}`

        // Calculate end date
        const endDate = new Date()
        endDate.setDate(endDate.getDate() + validityDays)

        // 1. Create Price Rule
        // We create a price rule specific to this customer to ensure 1-time usage per customer
        const priceRulePayload = {
            price_rule: {
                title: code,
                target_type: "line_item",
                target_selection: "all",
                allocation_method: "across",
                value_type: "percentage",
                value: `-${discountPercentage}.0`,
                customer_selection: "prerequisite",
                prerequisite_customer_ids: [parseInt(shopifyCustomerId)],
                starts_at: new Date().toISOString(),
                ends_at: endDate.toISOString(),
                once_per_customer: true,
                usage_limit: 1
            }
        }

        // Note: We need to access the private makeRequest method or add a public method to ShopifyAPI.
        // Since makeRequest is private, we'll extend the class or use a workaround.
        // Ideally, we should add createPriceRule to ShopifyAPI, but for now let's assume we can add a helper or use 'any' cast if needed,
        // but better to add a method to ShopifyAPI. 
        // Since I cannot easily modify the large ShopifyAPI class without potentially breaking things or dealing with large file edits,
        // I will use a new instance and cast to any to access makeRequest if I have to, OR better:
        // I will implement the fetch call directly here using the settings, duplicating the basic fetch logic to avoid touching the big file too much.

        const baseUrl = `https://${settings.shopDomain}/admin/api/${settings.apiVersion}`

        const response = await fetch(`${baseUrl}/price_rules.json`, {
            method: 'POST',
            headers: {
                'X-Shopify-Access-Token': settings.accessToken,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(priceRulePayload)
        })

        if (!response.ok) {
            const errorText = await response.text()
            console.error('Failed to create price rule:', errorText)
            return null
        }

        const data = await response.json()
        const priceRuleId = data.price_rule.id

        // 2. Create Discount Code
        const discountCodePayload = {
            discount_code: {
                code: code
            }
        }

        const codeResponse = await fetch(`${baseUrl}/price_rules/${priceRuleId}/discount_codes.json`, {
            method: 'POST',
            headers: {
                'X-Shopify-Access-Token': settings.accessToken,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(discountCodePayload)
        })

        if (!codeResponse.ok) {
            const errorText = await codeResponse.text()
            console.error('Failed to create discount code:', errorText)
            return null
        }

        return code
    } catch (error) {
        console.error('Error creating discount code:', error)
        return null
    }
}
