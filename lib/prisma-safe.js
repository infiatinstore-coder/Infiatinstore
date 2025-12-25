/**
 * PRISMA CLIENT WITH TIMEOUT & ERROR HANDLING
 * Production-grade database connection configuration
 * Project: infiya.store
 */

import { PrismaClient } from '@prisma/client';

const globalForPrisma = global;

// Custom Prisma instance with production settings
const prismaClientSingleton = () => {
    return new PrismaClient({
        log: process.env.NODE_ENV === 'development'
            ? ['query', 'error', 'warn']
            : ['error'],

        // Database connection pool settings
        datasources: {
            db: {
                url: process.env.DATABASE_URL,
            },
        },
    });
};

if (!globalForPrisma.prisma) {
    globalForPrisma.prisma = prismaClientSingleton();
}

const prisma = globalForPrisma.prisma;

// ============================================================
// P0 FIX: QUERY TIMEOUT & FAIL-SAFE WRAPPER
// Prevents: Long-running queries blocking the app
// Degrades gracefully on DB issues
// ============================================================

/**
 * Wrapper untuk database queries dengan timeout & retry
 * @param {Function} operation - Prisma operation to execute
 * @param {Object} options - { timeout, retries, fallback }
 */
export async function withDatabaseSafety(operation, options = {}) {
    const {
        timeout = 10000, // 10 seconds default
        retries = 2,
        fallback = null,
        operationName = 'Database Query'
    } = options;

    for (let attempt = 1; attempt <= retries; attempt++) {
        try {
            // Create timeout promise
            const timeoutPromise = new Promise((_, reject) => {
                setTimeout(() => {
                    reject(new Error(`${operationName} timeout after ${timeout}ms`));
                }, timeout);
            });

            // Race between operation and timeout
            const result = await Promise.race([
                operation(),
                timeoutPromise
            ]);

            return result;

        } catch (error) {
            console.error(`[DB] ${operationName} failed (attempt ${attempt}/${retries}):`, error.message);

            // If last attempt, handle final failure
            if (attempt === retries) {
                // Check if it's a connection error
                if (error.code === 'P2024' || error.message.includes('timeout') || error.message.includes('ECONNREFUSED')) {
                    console.error(`[DB CRITICAL] Database connection issue detected`);

                    // Return fallback if provided
                    if (fallback !== null) {
                        console.log(`[DB] Returning fallback value`);
                        return fallback;
                    }

                    // Throw specific error for monitoring
                    throw new DatabaseConnectionError('Database connection failed', error);
                }

                // Re-throw other errors
                throw error;
            }

            // Wait before retry (exponential backoff)
            await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
        }
    }
}

/**
 * Custom error class for database issues
 */
export class DatabaseConnectionError extends Error {
    constructor(message, originalError) {
        super(message);
        this.name = 'DatabaseConnectionError';
        this.originalError = originalError;
        this.statusCode = 503; // Service Unavailable
    }
}

/**
 * Health check - verify database connectivity
 */
export async function checkDatabaseHealth() {
    try {
        await prisma.$queryRaw`SELECT 1`;
        return { healthy: true, latency: 0 };
    } catch (error) {
        console.error('[DB HEALTH] Database check failed:', error);
        return { healthy: false, error: error.message };
    }
}

/**
 * Graceful shutdown
 */
export async function disconnectDatabase() {
    try {
        await prisma.$disconnect();
        console.log('[DB] Disconnected successfully');
    } catch (error) {
        console.error('[DB] Error during disconnect:', error);
    }
}

// Handle process termination
if (process.env.NODE_ENV === 'production') {
    process.on('beforeExit', disconnectDatabase);
    process.on('SIGINT', disconnectDatabase);
    process.on('SIGTERM', disconnectDatabase);
}

export default prisma;
