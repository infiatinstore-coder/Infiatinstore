import { jwtVerify, SignJWT } from 'jose';

const JWT_SECRET = new TextEncoder().encode(
    process.env.JWT_SECRET
);

/**
 * Verify authentication from request headers or cookies
 */
export async function verifyAuth(request) {
    // Check headers injected by middleware first
    const userId = request.headers.get('x-user-id');
    const role = request.headers.get('x-user-role');
    const email = request.headers.get('x-user-email');

    if (userId && role) {
        return {
            success: true,
            user: { id: userId, role, email },
            source: 'middleware'
        };
    }

    // Fallback: decode token directly (for edge cases or API routes)
    const token = request.cookies.get('auth-token')?.value ||
        request.headers.get('authorization')?.replace('Bearer ', '');

    if (!token) {
        return { success: false, error: 'No token provided' };
    }

    try {
        const { payload } = await jwtVerify(token, JWT_SECRET);
        return {
            success: true,
            user: {
                id: payload.sub,
                role: payload.role,
                email: payload.email,
                status: payload.status
            },
            source: 'direct'
        };
    } catch (error) {
        return { success: false, error: error.message };
    }
}

/**
 * Generate JWT token for user
 */
export async function generateToken(user) {
    const token = await new SignJWT({
        sub: user.id,
        role: user.role,
        email: user.email,
        status: user.status || 'ACTIVE'
    })
        .setProtectedHeader({ alg: 'HS256' })
        .setIssuedAt()
        .setExpirationTime('7d') // 7 days expiration
        .sign(JWT_SECRET);

    return token;
}

/**
 * Wrapper for API routes that require authentication
 */
export function requireAuth(handler) {
    return async function (request, context) {
        const auth = await verifyAuth(request);

        if (!auth.success) {
            return Response.json(
                { success: false, message: auth.error || 'Unauthorized' },
                { status: 401 }
            );
        }

        // Add user to context
        context.user = auth.user;
        return handler(request, context);
    };
}

/**
 * Wrapper for API routes that require admin role
 */
export function requireAdmin(handler) {
    return async function (request, context) {
        const auth = await verifyAuth(request);

        if (!auth.success) {
            return Response.json(
                { success: false, message: auth.error || 'Unauthorized' },
                { status: 401 }
            );
        }

        if (!['ADMIN', 'SUPER_ADMIN'].includes(auth.user.role)) {
            return Response.json(
                { success: false, message: 'Admin access required' },
                { status: 403 }
            );
        }

        context.user = auth.user;
        return handler(request, context);
    };
}
