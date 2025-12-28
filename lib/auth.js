import { jwtVerify, SignJWT } from 'jose';
import { logTransactionGuardBlock } from './activityLogger';

// Validate JWT_SECRET at module load time
const JWT_SECRET_VALUE = process.env.JWT_SECRET;
if (!JWT_SECRET_VALUE) {
    console.error('❌ CRITICAL: JWT_SECRET environment variable is not set!');
    console.error('   Application cannot start without JWT_SECRET.');
    console.error('   Please add JWT_SECRET to your .env file (minimum 32 characters).');
    process.exit(1);
}

if (JWT_SECRET_VALUE.length < 32) {
    console.error(`❌ CRITICAL: JWT_SECRET is too short (${JWT_SECRET_VALUE.length} characters)`);
    console.error('   Minimum length is 32 characters for security.');
    console.error('   Please generate a stronger secret:');
    console.error('   node -e "console.log(require(\'crypto\').randomBytes(32).toString(\'hex\'))"');
    process.exit(1);
}

const JWT_SECRET = new TextEncoder().encode(JWT_SECRET_VALUE);

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
            users: { id: userId, role, email },
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
            users: {
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

        if (!['ADMIN', 'SUPER_ADMIN'].includes(auth.users.role)) {
            return Response.json(
                { success: false, message: 'Admin access required' },
                { status: 403 }
            );
        }

        context.user = auth.user;
        return handler(request, context);
    };
}

/**
 * Assert that user can perform transaction (cart/checkout/payment)
 * ONLY role 'USER' is allowed to transact
 * ADMIN, SUPER_ADMIN, SYSTEM, or unknown roles are BLOCKED
 * Guest (unauthenticated) is ALLOWED for guest checkout flow
 * 
 * @returns {{ canTransact: boolean, users: object|null, isGuest: boolean, error?: string }}
 */
export async function assertUserCanTransact(request) {
    const auth = await verifyAuth(request);

    // If not authenticated, allow (for guest checkout)
    if (!auth.success) {
        return { canTransact: true, users: null, isGuest: true };
    }

    const role = auth.users.role;
    const endpoint = request.url || 'unknown';
    const timestamp = new Date().toISOString();

    // Log attempt (minimal, no sensitive data)
    console.log(`[TRANSACT_GUARD] role=${role} endpoint=${endpoint} time=${timestamp}`);

    // HARD BLOCK: Only USER role can transact
    // ADMIN, SUPER_ADMIN, SYSTEM, or unknown roles are BLOCKED
    if (role !== 'USER') {
        console.warn(`[TRANSACT_GUARD] BLOCKED role=${role} endpoint=${endpoint} time=${timestamp}`);

        // Log security event (async, don't block response)
        logTransactionGuardBlock(auth.users.id, role, endpoint).catch(err => {
            console.error('[ActivityLog] Failed to log security event:', err);
        });

        return {
            canTransact: false,
            users: auth.users,
            isGuest: false,
            error: 'Role tidak diizinkan melakukan transaksi'
        };
    }

    return { canTransact: true, users: auth.users, isGuest: false };
}
