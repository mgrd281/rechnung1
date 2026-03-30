export default function WorkingTestPage() {
  return (
    <div style={{ padding: '20px', fontFamily: 'Arial' }}>
      <h1>Working Test Page</h1>
      <p>If you can see this page, Next.js is working correctly.</p>
      
      <div style={{ marginTop: '20px' }}>
        <h2>Navigation Test:</h2>
        <ul>
          <li><a href="/auth/login">Login Page</a></li>
          <li><a href="/auth/register">Register Page</a></li>
          <li><a href="/simple-login">Simple Login</a></li>
          <li><a href="/test-auth">Test Auth</a></li>
          <li><a href="/dashboard">Dashboard</a></li>
        </ul>
      </div>

      <div style={{ marginTop: '20px', padding: '10px', backgroundColor: '#f0f0f0' }}>
        <h3>Debug Info:</h3>
        <p>Current URL: {typeof window !== 'undefined' ? window.location.href : 'Server Side'}</p>
        <p>User Agent: {typeof window !== 'undefined' ? navigator.userAgent : 'Server Side'}</p>
      </div>
    </div>
  )
}
