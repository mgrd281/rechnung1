import crypto from 'crypto'

export function verifyShopifyWebhook(body: string, hmac: string, secret: string): boolean {
    try {
        const generatedHash = crypto
            .createHmac('sha256', secret)
            .update(body, 'utf8')
            .digest('base64')

        return crypto.timingSafeEqual(
            Buffer.from(generatedHash),
            Buffer.from(hmac)
        )
    } catch (e) {
        console.error('Webhook verification failed:', e)
        return false
    }
}
