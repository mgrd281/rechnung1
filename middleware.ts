import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { jwtVerify } from 'jose'

// Protected routes that require authentication
const protectedRoutes = [
    '/digital-products',
    '/orders',
    '/customers',
    '/settings',
    '/analytics',
    '/buchhaltung',
    '/upload',
    '/reviews',
    '/reminders',
]

// Protected API routes
const protectedApiRoutes = [
    '/api/digital-products',
    '/api/orders',
    '/api/customers',
    '/api/settings',
    '/api/analytics',
    '/api/shopify',
    '/api/reminders',
    '/api/reviews',
    '/api/backup',
    '/api/accounting',
    '/api/files',
]

// Public routes that don't need auth
const publicRoutes = [
    '/landing',
    '/login',
    '/api/auth/login',
    '/api/auth/logout',
    '/api/auth/register',
    '/api/auth/gate', // Auth verification endpoint
    '/api/reviews/public', // Public reviews fetching
    '/api/analytics', // Allow all analytics subroutes to be public to avoid UI errors
    '/api/ai/track', // Public tracking pixel
    '/api/ai/automation', // Make automation API accessible but still internally auth-checked
]

export async function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl

    // CORS Handling for Analytics & Security (from Shopify Store)
    if (pathname.startsWith('/api/analytics') || pathname.startsWith('/api/security') || pathname.startsWith('/analytics-tracker.js')) {
        // Handle Preflight OPTIONS request
        if (request.method === 'OPTIONS') {
            return new NextResponse(null, {
                status: 204,
                headers: {
                    'Access-Control-Allow-Origin': '*',
                    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS, PUT, PATCH, DELETE',
                    'Access-Control-Allow-Headers': 'Content-Type, x-user-info, x-user-id, x-user-email, x-user-role',
                    'Access-Control-Max-Age': '86400',
                },
            });
        }

        const response = NextResponse.next();
        response.headers.set('Access-Control-Allow-Origin', '*');
        response.headers.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');
        response.headers.set('Access-Control-Allow-Headers', 'Content-Type, x-user-info, x-user-id, x-user-email, x-user-role');

        // If it's a public analytics route, allow it
        if (publicRoutes.some(route => pathname.startsWith(route))) {
            return response;
        }
    }

    // Allow public routes
    if (publicRoutes.some(route => pathname.startsWith(route))) {
        return NextResponse.next()
    }

    // Check if route needs protection
    const isProtectedPage = protectedRoutes.some(route => pathname.startsWith(route))
    const isProtectedApi = protectedApiRoutes.some(route => pathname.startsWith(route))

    // Webhooks & Emergency Sync Exception (Always Public)
    if (
        pathname.startsWith('/api/webhooks/shopify') ||
        pathname.startsWith('/api/shopify/webhooks') ||
        pathname.startsWith('/api/shopify/emergency-sync') ||
        pathname.startsWith('/api/health') ||
        pathname.startsWith('/api/public') ||
        pathname.startsWith('/api/debug')
    ) {
        return NextResponse.next()
    }

    if (!isProtectedPage && !isProtectedApi) {
        return NextResponse.next()
    }

    // Get token from cookie
    const token = request.cookies.get('auth-token')?.value

    if (!token) {
        console.log('❌ No auth token found for:', pathname)

        if (isProtectedApi) {
            return NextResponse.json(
                {
                    success: false,
                    error: 'Unauthorized',
                    message: 'Authentifizierung erforderlich. Bitte melden Sie sich an.'
                },
                { status: 401 }
            )
        }

        // Redirect to login for protected pages
        const loginUrl = new URL('/login', request.url)
        loginUrl.searchParams.set('redirect', pathname)
        return NextResponse.redirect(loginUrl)
    }

    // Verify JWT token
    try {
        const secret = new TextEncoder().encode(
            process.env.JWT_SECRET || 'your-secret-key-change-in-production'
        )

        const { payload } = await jwtVerify(token, secret)

        // Check if token is expired
        if (payload.exp && payload.exp < Math.floor(Date.now() / 1000)) {
            console.log('❌ Token expired for:', pathname)

            if (isProtectedApi) {
                return NextResponse.json(
                    {
                        success: false,
                        error: 'Session Expired',
                        message: 'Ihre Sitzung ist abgelaufen. Bitte melden Sie sich erneut an.'
                    },
                    { status: 401 }
                )
            }

            const loginUrl = new URL('/login', request.url)
            loginUrl.searchParams.set('redirect', pathname)
            loginUrl.searchParams.set('session', 'expired')
            return NextResponse.redirect(loginUrl)
        }

        // Check user role for admin-only routes
        const userRole = (payload.role as string)?.toUpperCase() // Normalize to uppercase

        // All protected routes require at least 'user' role
        // You can add more granular checks here
        if (!userRole || (userRole !== 'ADMIN' && userRole !== 'MANAGER' && userRole !== 'USER')) {
            console.log('❌ Insufficient permissions for:', pathname, 'Role:', userRole)

            if (isProtectedApi) {
                return NextResponse.json(
                    {
                        success: false,
                        error: 'Forbidden',
                        message: 'Sie haben keine Berechtigung für diese Aktion.'
                    },
                    { status: 403 }
                )
            }

            return NextResponse.redirect(new URL('/landing', request.url))
        }

        console.log('✅ Auth OK:', pathname, 'User:', payload.email, 'Role:', userRole)

        // Add user info to request headers (for API routes that need it)
        const requestHeaders = new Headers(request.headers)

        // Prepare base64 encoded user info for x-user-info (legacy/compat support)
        const userInfo = {
            id: payload.userId,
            email: payload.email,
            role: payload.role,
            firstName: payload.firstName || '',
            lastName: payload.lastName || ''
        }
        const userInfoBase64 = btoa(JSON.stringify(userInfo))

        requestHeaders.set('x-user-info', userInfoBase64)
        requestHeaders.set('x-user-id', payload.userId as string)
        requestHeaders.set('x-user-email', payload.email as string)
        requestHeaders.set('x-user-role', payload.role as string)

        return NextResponse.next({
            request: {
                headers: requestHeaders,
            },
        })

    } catch (error) {
        console.error('❌ JWT verification failed:', error)

        if (isProtectedApi) {
            return NextResponse.json(
                {
                    success: false,
                    error: 'Invalid Token',
                    message: 'Ungültiges Authentifizierungstoken. Bitte melden Sie sich erneut an.'
                },
                { status: 401 }
            )
        }

        const loginUrl = new URL('/login', request.url)
        loginUrl.searchParams.set('redirect', pathname)
        loginUrl.searchParams.set('error', 'invalid-token')
        return NextResponse.redirect(loginUrl)
    }
}

export const config = {
    matcher: [
        /*
         * Match all request paths except:
         * - _next/static (static files)
         * - _next/image (image optimization files)
         * - favicon.ico (favicon file)
         * - public folder
         * - sounds (public sounds)
         */
        '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|mp3|wav|js)$).*)',
    ],
}
