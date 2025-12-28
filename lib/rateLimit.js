import { RateLimiterMemory } from 'rate-limiter-flexible';
import { NextResponse } from 'next/server';
import { RateLimitError } from './errors';

/**
 * Rate Limiter Configuration (like Shopee/Tokopedia)
 * Prevents abuse & DDoS attacks
 */

// Global rate limiter - 100 requests per minute per IP
const globalLimiter = new RateLimiterMemory({
    points: 100, // 100 requests
    duration: 60, // per 60 seconds
});

// Auth endpoints - more strict (10 requests per minute)
const authLimiter = new RateLimiterMemory({
    points: 10,
    duration: 60,
    blockDuration: 300, // Block for 5 minutes if exceeded
});

// Payment endpoints - very strict (5 requests per minute)
const paymentLimiter = new RateLimiterMemory({
    points: 5,
    duration: 60,
    blockDuration: 600, // Block for 10 minutes
});

// Search endpoints - moderate (30 requests per minute)
const searchLimiter = new RateLimiterMemory({
    points: 30,
    duration: 60,
});

/**
 * Get client identifier (IP address)
 */
function getClientId(request) {
    const forwarded = request.headers.get('x-forwarded-for');
    const realIp = request.headers.get('x-real-ip');
    return forwarded?.split(',')[0] || realIp || 'unknown';
}

/**
 * Rate limit middleware factory
 */
export function rateLimit(limiter = globalLimiter, options = {}) {
    return async (request) => {
        const clientId = getClientId(request);

        try {
            await limiter.consume(clientId);
            return null; // Allow request
        } catch (rejRes) {
            const retryAfter = Math.ceil(rejRes.msBeforeNext / 1000);

            return NextResponse.json({
                success: false,
                message: 'Too many requests, please try again later',
                retryAfter,
            }, {
                status: 429,
                headers: {
                    'Retry-After': retryAfter.toString(),
                    'X-RateLimit-Limit': limiter.points.toString(),
                    'X-RateLimit-Remaining': '0',
                    'X-RateLimit-Reset': new Date(Date.now() + rejRes.msBeforeNext).toISOString(),
                },
            });
        }
    };
}

/**
 * Pre-configured limiters
 */
export const rateLimiters = {
    global: () => rateLimit(globalLimiter),
    auth: () => rateLimit(authLimiter),
    payment: () => rateLimit(paymentLimiter),
    search: () => rateLimit(searchLimiter),
};

/**
 * Apply rate limit to API route
 */
export async function checkRateLimit(request, type = 'global') {
    const limiter = rateLimiters[type];
    if (!limiter) {
        throw new Error(`Invalid limiter type: ${type}`);
    }

    const result = await limiter()(request);
    if (result) {
        throw new RateLimitError();
    }
}
