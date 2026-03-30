'use client'

import { useState } from 'react'

export default function TestEmailPage() {
    const [email, setEmail] = useState('')
    const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')
    const [message, setMessage] = useState('')

    const handleSend = async () => {
        if (!email) return
        setStatus('loading')
        setMessage('')

        try {
            const res = await fetch('/api/test-email', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email })
            })
            const data = await res.json()

            if (data.success) {
                setStatus('success')
                setMessage('✅ Email sent successfully! Check your inbox (and spam folder).')
            } else {
                setStatus('error')
                setMessage(`❌ Error: ${data.error}`)
            }
        } catch (error) {
            setStatus('error')
            setMessage('❌ Network error or server failed.')
        }
    }

    return (
        <div className="p-10 max-w-md mx-auto">
            <h1 className="text-2xl font-bold mb-5">SMTP Email Test</h1>

            <div className="mb-4">
                <label className="block mb-2">Recipient Email:</label>
                <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full p-2 border rounded"
                    placeholder="Enter your email"
                />
            </div>

            <button
                onClick={handleSend}
                disabled={status === 'loading' || !email}
                className="w-full bg-blue-600 text-white p-2 rounded disabled:bg-gray-400"
            >
                {status === 'loading' ? 'Sending...' : 'Send Test Email'}
            </button>

            {message && (
                <div className={`mt-5 p-3 rounded ${status === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                    {message}
                </div>
            )}
        </div>
    )
}
