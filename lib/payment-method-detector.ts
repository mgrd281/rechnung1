/**
 * Payment Method Detection Utility
 * Determines whether digital product keys should be sent immediately based on payment method
 */

/**
 * Extract payment gateway information from Shopify order
 */
export function getPaymentMethod(order: any): string {
    // Get payment gateway names from the order
    if (order.payment_gateway_names && Array.isArray(order.payment_gateway_names)) {
        return order.payment_gateway_names[0]?.toLowerCase() || 'unknown'
    }

    // Fallback to gateway field
    if (order.gateway) {
        return order.gateway.toLowerCase()
    }

    return 'unknown'
}

/**
 * Check if payment method is a direct/instant payment (credit cards, PayPal, etc.)
 * These methods should trigger immediate key delivery when status is 'paid'
 */
export function isDirectPaymentMethod(paymentMethod: string): boolean {
    const method = paymentMethod.toLowerCase()

    // Credit card processors and instant payment methods
    const directMethods = [
        'shopify payments',
        'shop pay',
        'credit card',
        'visa',
        'mastercard',
        'maestro',
        'american express',
        'amex',
        'paypal',
        'paypal express',
        'stripe',
        'klarna',
        'apple pay',
        'google pay',
        'sofort',
        'giropay',
        'card',
        'bogus' // Shopify test gateway
    ]

    return directMethods.some(dm => method.includes(dm))
}

/**
 * Check if payment method is manual (invoice, bank transfer)
 * These methods should only send keys after manual payment confirmation
 */
export function isManualPaymentMethod(paymentMethod: string): boolean {
    const method = paymentMethod.toLowerCase()

    const manualMethods = [
        'invoice',
        'rechnung',
        'vorkasse',
        'bank transfer',
        'manual',
        'cash on delivery',
        'nachnahme'
    ]

    return manualMethods.some(mm => method.includes(mm))
}

/**
 * Main decision function: Should digital product keys be sent now?
 * 
 * @param order - Shopify order object from webhook
 * @param isUpdateWebhook - True if this is an orders/updated webhook (vs orders/create)
 * @returns boolean - True if keys should be sent immediately
 */
export function shouldSendKeysImmediately(order: any, isUpdateWebhook: boolean = false): boolean {
    const paymentMethod = getPaymentMethod(order)
    const financialStatus = order.financial_status

    console.log(`[Payment Detector] Method: ${paymentMethod}, Status: ${financialStatus}, IsUpdate: ${isUpdateWebhook}`)

    // Order is paid
    if (financialStatus === 'paid') {
        // Direct payment methods (credit cards, etc.)
        if (isDirectPaymentMethod(paymentMethod)) {
            // Send on first webhook (usually orders/create for instant payments)
            // Skip on updates if already sent (logic handled in caller)
            console.log(`[Payment Detector] ✅ Direct payment + paid status`)
            return true
        }

        // Manual payment methods (invoice, vorkasse)
        if (isManualPaymentMethod(paymentMethod)) {
            // Only send on UPDATE webhook (when manually marked as paid)
            if (isUpdateWebhook) {
                console.log(`[Payment Detector] ✅ Manual payment confirmed via update webhook`)
                return true
            } else {
                console.log(`[Payment Detector] ⏳ Manual payment on create - waiting for confirmation`)
                return false
            }
        }

        // Unknown payment method but paid - be cautious, send on update only
        if (isUpdateWebhook) {
            console.log(`[Payment Detector] ⚠️ Unknown payment method '${paymentMethod}' - sending on update to be safe`)
            return true
        }
    }

    // Not paid or pending - never send keys
    console.log(`[Payment Detector] ❌ Not ready to send keys (status: ${financialStatus})`)
    return false
}

/**
 * Check if this is likely a manual payment that needs confirmation
 */
export function requiresManualConfirmation(order: any): boolean {
    const paymentMethod = getPaymentMethod(order)
    const financialStatus = order.financial_status

    return isManualPaymentMethod(paymentMethod) && financialStatus === 'pending'
}
