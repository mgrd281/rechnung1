'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { AlertCircle, CheckCircle, RefreshCw, Globe } from 'lucide-react'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'

export default function WidgetDebugPage() {
    const [productId, setProductId] = useState('123456')
    const [scriptStatus, setScriptStatus] = useState<'loading' | 'loaded' | 'error'>('loading')
    const [apiStatus, setApiStatus] = useState<'loading' | 'success' | 'error' | 'idle'>('idle')
    const [apiResponse, setApiResponse] = useState<any>(null)
    const [widgetRendered, setWidgetRendered] = useState(false)

    // Check if script is loaded
    useEffect(() => {
        const checkScript = () => {
            // We'll manually inject the script for testing
            const existingScript = document.querySelector('script[src="/review-widget.js"]')
            if (existingScript) {
                existingScript.remove()
            }

            const script = document.createElement('script')
            script.src = '/review-widget.js'
            script.async = true
            script.onload = () => {
                setScriptStatus('loaded')
                // Trigger init if available
                if ((window as any).initStarRating) {
                    (window as any).initStarRating()
                }
            }
            script.onerror = () => setScriptStatus('error')
            document.body.appendChild(script)
        }

        checkScript()
    }, [])

    const testApi = async () => {
        setApiStatus('loading')
        try {
            const res = await fetch(`/api/reviews/public?productId=${productId}`)
            const data = await res.json()
            setApiResponse(data)
            setApiStatus('success')
        } catch (error) {
            console.error(error)
            setApiStatus('error')
        }
    }

    return (
        <div className="min-h-screen bg-gray-50 p-8">
            <div className="max-w-4xl mx-auto space-y-8">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">Widget Debugger</h1>
                        <p className="text-gray-500">Diagnose problems with the Review Widget integration</p>
                    </div>
                    <Button variant="outline" onClick={() => window.location.reload()}>
                        <RefreshCw className="h-4 w-4 mr-2" />
                        Reset
                    </Button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Step 1: Script Loading */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                1. Script Loading
                                {scriptStatus === 'loaded' && <CheckCircle className="h-5 w-5 text-green-500" />}
                                {scriptStatus === 'error' && <AlertCircle className="h-5 w-5 text-red-500" />}
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-sm text-gray-600 mb-4">
                                Checks if <code>/review-widget.js</code> can be loaded by the browser.
                            </p>
                            <div className="flex items-center gap-2 p-3 bg-gray-100 rounded text-sm font-mono">
                                <Globe className="h-4 w-4" />
                                /review-widget.js
                                <span className={`ml-auto px-2 py-0.5 rounded text-xs ${scriptStatus === 'loaded' ? 'bg-green-100 text-green-800' :
                                        scriptStatus === 'error' ? 'bg-red-100 text-red-800' :
                                            'bg-yellow-100 text-yellow-800'
                                    }`}>
                                    {scriptStatus.toUpperCase()}
                                </span>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Step 2: API Connectivity */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                2. API Connectivity
                                {apiStatus === 'success' && <CheckCircle className="h-5 w-5 text-green-500" />}
                                {apiStatus === 'error' && <AlertCircle className="h-5 w-5 text-red-500" />}
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-2">
                                <Label>Test Product ID</Label>
                                <div className="flex gap-2">
                                    <Input
                                        value={productId}
                                        onChange={(e) => setProductId(e.target.value)}
                                        placeholder="e.g. 123456"
                                    />
                                    <Button onClick={testApi} disabled={apiStatus === 'loading'}>
                                        Test
                                    </Button>
                                </div>
                            </div>

                            {apiResponse && (
                                <div className="p-3 bg-gray-900 text-green-400 rounded text-xs font-mono overflow-auto max-h-[150px]">
                                    <pre>{JSON.stringify(apiResponse, null, 2)}</pre>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>

                {/* Step 3: Widget Rendering Preview */}
                <Card>
                    <CardHeader>
                        <CardTitle>3. Live Widget Preview</CardTitle>
                        <CardDescription>
                            This area simulates your Shopify product page.
                            The widget should appear below if everything is working.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-8 border-t pt-6">

                        {/* Star Rating Container */}
                        <div className="space-y-2">
                            <Label className="text-gray-500">Star Rating Widget (.rechnung-profi-stars)</Label>
                            <div
                                className="rechnung-profi-stars p-4 border border-dashed border-gray-300 rounded bg-gray-50"
                                data-product-id={productId}
                            >
                                {/* Widget should inject here */}
                                <span className="text-gray-400 text-sm italic">Widget loading area...</span>
                            </div>
                        </div>

                        {/* Full Reviews Widget Container */}
                        <div className="space-y-2">
                            <Label className="text-gray-500">Full Reviews Widget (#rechnung-profi-reviews-widget)</Label>
                            <div
                                id="rechnung-profi-reviews-widget"
                                className="p-4 border border-dashed border-gray-300 rounded bg-gray-50 min-h-[200px]"
                                data-product-id={productId}
                            >
                                {/* Widget should inject here */}
                                <span className="text-gray-400 text-sm italic">Reviews list should appear here...</span>
                            </div>
                        </div>

                    </CardContent>
                </Card>

                <Alert>
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>Troubleshooting Tips</AlertTitle>
                    <AlertDescription>
                        <ul className="list-disc list-inside text-sm space-y-1 mt-2">
                            <li>Ensure <code>review-widget.js</code> is added to your Shopify theme (usually in <code>theme.liquid</code>).</li>
                            <li>Verify that the Product ID matches what is in your database.</li>
                            <li>Check the browser console for CORS errors or 404s.</li>
                        </ul>
                    </AlertDescription>
                </Alert>
            </div>
        </div>
    )
}
