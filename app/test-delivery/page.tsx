
'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

export default function TestWebhookPage() {
    const [loading, setLoading] = useState(false)
    const [result, setResult] = useState<any>(null)
    const [orderId, setOrderId] = useState('123456789')
    const [productId, setProductId] = useState('')
    const [email, setEmail] = useState('test@example.com')
    const [products, setProducts] = useState<any[]>([])

    // Fetch configured digital products on mount
    useEffect(() => {
        fetch('/api/digital-products')
            .then(res => res.json())
            .then(data => {
                if (data.success) {
                    setProducts(data.data)
                    // Auto-select first product if available
                    if (data.data.length > 0) {
                        setProductId(data.data[0].shopifyProductId)
                    }
                }
            })
            .catch(err => console.error('Failed to fetch products:', err))
    }, [])

    const handleTest = async () => {
        setLoading(true)
        setResult(null)
        try {
            const payload = {
                id: parseInt(orderId),
                email: email,
                financial_status: 'paid',
                line_items: [
                    {
                        id: 999,
                        product_id: parseInt(productId),
                        title: products.find(p => p.shopifyProductId === productId)?.title || 'Test Product',
                        quantity: 1,
                        price: '10.00'
                    }
                ],
                customer: {
                    first_name: 'Test',
                    last_name: 'User',
                    email: email
                }
            }

            // We need to simulate the webhook signature verification or bypass it for testing
            // Since we can't easily generate a valid HMAC signature from the client without the secret,
            // we might need a dedicated test endpoint that skips verification or uses a test secret.
            // However, for now, let's try hitting the webhook endpoint directly and see if we can get a response.
            // Note: The real webhook endpoint verifies HMAC, so this might fail with 401/403.

            // Better approach: Create a dedicated server-side test route that calls the logic directly.
            const res = await fetch('/api/test-digital-delivery', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            })

            const data = await res.json()
            setResult(data)
        } catch (error) {
            setResult({ error: String(error) })
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="p-8 max-w-2xl mx-auto">
            <Card>
                <CardHeader>
                    <CardTitle>Test Digital Delivery</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div>
                        <Label>Select Digital Product</Label>
                        {products.length > 0 ? (
                            <select
                                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                value={productId}
                                onChange={e => setProductId(e.target.value)}
                            >
                                {products.map(p => (
                                    <option key={p.id} value={p.shopifyProductId}>
                                        {p.title} (Keys: {p._count?.keys || 0})
                                    </option>
                                ))}
                            </select>
                        ) : (
                            <div className="text-sm text-muted-foreground">Loading products or none configured...</div>
                        )}
                        <p className="text-xs text-muted-foreground mt-1">
                            Only products configured in "Digital Products" are shown here.
                        </p>
                    </div>
                    <div>
                        <Label>Test Email</Label>
                        <Input value={email} onChange={e => setEmail(e.target.value)} />
                    </div>
                    <Button onClick={handleTest} disabled={loading || !productId}>
                        {loading ? 'Testing...' : 'Simulate Paid Order'}
                    </Button>

                    {result && (
                        <div className="mt-4 p-4 bg-gray-100 rounded overflow-auto">
                            <pre>{JSON.stringify(result, null, 2)}</pre>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    )
}
