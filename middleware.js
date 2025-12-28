import { NextResponse } from 'next/server';
import { jwtVerify } from 'jose';

// === CONFIGURATION ===
const PUBLIC_PATHS = [
    '/',
    '/products',
    '/products/',
    /^\/products\/[^\/]+$/, // Regex untuk /products/[slug]
    '/auth/login',
    '/auth/register',
    '/about',
    '/contact',
    '/help',
    '/privacy',
    '/terms',
    '/refund-policy',
    '/search',
    '/cart',
    '/api/auth/login',
    '/api/auth/register',
    '/api/products',
    '/api/categories',
    '/api/reviews',
];

const ADMIN_PATHS = ['/admin'];
const ACCOUNT_PATHS = ['/account', '/checkout'];

// === HELPER FUNCTIONS ===
function isPublicPath(pathname) {
    return PUBLIC_PATHS.some(pattern => {
        if (typeof pattern === 'string') return pathname.startsWith(pattern);
        if (pattern instanceof RegExp) return pattern.test(pathname);
        return false;
    });
}

function redirectToLogin(request, redirectPath) {
    const url = new URL('/auth/login', request.url);
    url.searchParams.set('redirect', redirectPath);
    return NextResponse.redirect(url);
}

function redirectTo403(request) {
    // Redirect to admin login for admin paths
    const url = new URL('/admin/login', request.url);
    return NextResponse.redirect(url);
}

// === MAIN MIDDLEWARE LOGIC ===
export async function middleware(request) {
    const { pathname } = request.nextUrl;

    // Skip middleware untuk path publik dan admin login
    if (isPublicPath(pathname) || pathname === '/admin/login') {
        return NextResponse.next();
    }

    // Ambil token dari cookie atau Authorization header
    const token = request.cookies.get('auth-token')?.value ||
        request.headers.get('authorization')?.replace('Bearer ', '');

    // Jika tidak ada token & path butuh auth → redirect login
    if (!token) {
        if (ADMIN_PATHS.some(path => pathname.startsWith(path))) {
            return redirectTo403(request); // Admin path tanpa token = 403
        }
        if (ACCOUNT_PATHS.some(path => pathname.startsWith(path))) {
            return redirectToLogin(request, pathname);
        }
        return NextResponse.next();
    }

    try {
        // Decode JWT menggunakan Jose
        const secret = new TextEncoder().encode(process.env.JWT_SECRET);
        const { payload } = await jwtVerify(token, secret);

        // Validasi payload structure
        if (!payload.sub || !payload.role) {
            throw new Error('Invalid token payload');
        }

        // Inject user data ke headers untuk API routes
        const response = NextResponse.next();
        response.headers.set('x-user-id', payload.sub);
        response.headers.set('x-user-role', payload.role);
        response.headers.set('x-user-email', payload.email || '');

        // === RBAC LOGIC ===
        // Admin paths hanya untuk role ADMIN & SUPER_ADMIN
        if (ADMIN_PATHS.some(path => pathname.startsWith(path))) {
            if (!['ADMIN', 'SUPER_ADMIN'].includes(payload.role)) {
                return redirectTo403(request);
            }
        }

        // Account paths hanya untuk user aktif
        if (ACCOUNT_PATHS.some(path => pathname.startsWith(path))) {
            if (payload.status === 'SUSPENDED') {
                return redirectTo403(request);
            }
        }

        return response;
    } catch (error) {
        console.error('JWT verification failed:', {
            path: pathname,
            error: error.message,
            tokenPreview: token ? token.substring(0, 10) + '...' : null,
        });

        // Token expired atau invalid → clear cookie & redirect
        const response = redirectToLogin(request, pathname);
        response.cookies.delete('auth-token');
        return response;
    }
}

// === MATCHER CONFIG ===
export const config = {
    matcher: [
        /*
         * Match all request paths except for the ones starting with:
         * - _next/static (static files)
         * - _next/image (image optimization files)
         * - favicon.ico, sitemap.xml, robots.txt (metadata files)
         */
        '/((?!_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt).*)',
    ],
};
