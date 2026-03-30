'use client'

import { useAuth } from '@/lib/auth-context'
import { useEffect, useState } from 'react'

export default function DebugPage() {
  const { user, isAuthenticated, loading } = useAuth()
  const [clientInfo, setClientInfo] = useState<any>({})

  useEffect(() => {
    setClientInfo({
      userAgent: navigator.userAgent,
      url: window.location.href,
      localStorage: {
        authData: localStorage.getItem('rechnungsprofi_auth'),
        keys: Object.keys(localStorage)
      },
      cookies: document.cookie,
      screenSize: `${window.screen.width}x${window.screen.height}`,
      windowSize: `${window.innerWidth}x${window.innerHeight}`
    })
  }, [])

  const testAuth = () => {
    console.log('Testing auth...')
    console.log('User:', user)
    console.log('Authenticated:', isAuthenticated)
    console.log('Loading:', loading)
  }

  const clearAuth = () => {
    localStorage.removeItem('rechnungsprofi_auth')
    window.location.reload()
  }

  return (
    <div style={{ padding: '20px', fontFamily: 'monospace', fontSize: '14px' }}>
      <h1>🔍 Debug Dashboard</h1>
      
      <div style={{ marginBottom: '20px' }}>
        <button onClick={testAuth} style={{ marginRight: '10px', padding: '5px 10px' }}>
          Test Auth
        </button>
        <button onClick={clearAuth} style={{ padding: '5px 10px', backgroundColor: '#ff4444', color: 'white' }}>
          Clear Auth
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
        <div>
          <h2>🔐 Auth Status</h2>
          <pre style={{ backgroundColor: '#f5f5f5', padding: '10px', borderRadius: '5px' }}>
{JSON.stringify({
  loading,
  isAuthenticated,
  user
}, null, 2)}
          </pre>
        </div>

        <div>
          <h2>🌐 Client Info</h2>
          <pre style={{ backgroundColor: '#f5f5f5', padding: '10px', borderRadius: '5px' }}>
{JSON.stringify(clientInfo, null, 2)}
          </pre>
        </div>
      </div>

      <div style={{ marginTop: '20px' }}>
        <h2>🔗 Navigation Links</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px' }}>
          <a href="/auth/login" style={{ padding: '10px', backgroundColor: '#007bff', color: 'white', textDecoration: 'none', borderRadius: '5px', textAlign: 'center' }}>
            Original Login
          </a>
          <a href="/auth/register" style={{ padding: '10px', backgroundColor: '#28a745', color: 'white', textDecoration: 'none', borderRadius: '5px', textAlign: 'center' }}>
            Original Register
          </a>
          <a href="/simple-login" style={{ padding: '10px', backgroundColor: '#17a2b8', color: 'white', textDecoration: 'none', borderRadius: '5px', textAlign: 'center' }}>
            Simple Login
          </a>
          <a href="/simple-register" style={{ padding: '10px', backgroundColor: '#6f42c1', color: 'white', textDecoration: 'none', borderRadius: '5px', textAlign: 'center' }}>
            Simple Register
          </a>
          <a href="/dashboard" style={{ padding: '10px', backgroundColor: '#fd7e14', color: 'white', textDecoration: 'none', borderRadius: '5px', textAlign: 'center' }}>
            Dashboard
          </a>
          <a href="/working-test" style={{ padding: '10px', backgroundColor: '#6c757d', color: 'white', textDecoration: 'none', borderRadius: '5px', textAlign: 'center' }}>
            Working Test
          </a>
        </div>
      </div>

      <div style={{ marginTop: '20px' }}>
        <h2>📋 Console Logs</h2>
        <p>Check browser console (F12) for detailed logs</p>
      </div>
    </div>
  )
}
