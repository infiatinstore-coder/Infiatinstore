import { NextResponse } from 'next/server';

/**
 * Standard API Response format (like Shopee/Tokopedia)
 */
export class ApiResponse {
    static success(data, message = 'Success', meta = {}) {
        return NextResponse.json({
            success: true,
            message,
            data,
            meta,
            timestamp: new Date().toISOString(),
        });
    }

    static error(message, status = 500, errors = null) {
        return NextResponse.json({
            success: false,
            message,
            errors,
            timestamp: new Date().toISOString(),
        }, { status });
    }

    static paginated(data, pagination) {
        return NextResponse.json({
            success: true,
            data,
            pagination: {
                page: pagination.page,
                limit: pagination.limit,
                totalItems: pagination.totalCount,
                totalPages: pagination.totalPages,
                hasNext: pagination.page < pagination.totalPages,
                hasPrev: pagination.page > 1,
            },
            timestamp: new Date().toISOString(),
        });
    }
}

/**
 * Custom Error Classes
 */
export class AppError extends Error {
    constructor(message, statusCode = 500, errors = null) {
        super(message);
        this.statusCode = statusCode;
        this.errors = errors;
        this.isOperational = true;
        Error.captureStackTrace(this, this.constructor);
    }
}

export class ValidationError extends AppError {
    constructor(errors) {
        super('Validation failed', 400, errors);
    }
}

export class UnauthorizedError extends AppError {
    constructor(message = 'Unauthorized') {
        super(message, 401);
    }
}

export class ForbiddenError extends AppError {
    constructor(message = 'Forbidden') {
        super(message, 403);
    }
}

export class NotFoundError extends AppError {
    constructor(resource = 'Resource') {
        super(`${resource} not found`, 404);
    }
}

export class ConflictError extends AppError {
    constructor(message = 'Conflict') {
        super(message, 409);
    }
}

export class RateLimitError extends AppError {
    constructor(message = 'Too many requests') {
        super(message, 429);
    }
}

/**
 * Error Handler Middleware
 */
export function errorHandler(error) {
    console.error('Error:', error);

    // Handle known operational errors
    if (error.isOperational) {
        return ApiResponse.error(
            error.message,
            error.statusCode,
            error.errors
        );
    }

    // Handle Prisma errors
    if (error.code === 'P2002') {
        return ApiResponse.error(
            'Data already exists',
            409,
            [{ field: error.meta?.target?.[0], message: 'Already exists' }]
        );
    }

    if (error.code === 'P2025') {
        return ApiResponse.error('Record not found', 404);
    }

    if (error.code === 'P2003') {
        return ApiResponse.error('Invalid reference', 400);
    }

    // Handle validation errors
    if (error.status === 400 && error.errors) {
        return ApiResponse.error(error.message, 400, error.errors);
    }

    // Handle unknown errors
    const isDev = process.env.NODE_ENV === 'development';
    return ApiResponse.error(
        isDev ? error.message : 'Internal server error',
        500,
        isDev ? [{ stack: error.stack }] : null
    );
}

/**
 * Async handler wrapper (prevents try-catch everywhere)
 */
export function asyncHandler(fn) {
    return async (...args) => {
        try {
            return await fn(...args);
        } catch (error) {
            return errorHandler(error);
        }
    };
}

/**
 * Logger (structured logging like enterprise apps)
 */
export const logger = {
    info: (message, meta = {}) => {
        console.log(JSON.stringify({
            level: 'info',
            message,
            ...meta,
            timestamp: new Date().toISOString(),
        }));
    },

    error: (message, error, meta = {}) => {
        console.error(JSON.stringify({
            level: 'error',
            message,
            error: {
                message: error.message,
                stack: error.stack,
            },
            ...meta,
            timestamp: new Date().toISOString(),
        }));
    },

    warn: (message, meta = {}) => {
        console.warn(JSON.stringify({
            level: 'warn',
            message,
            ...meta,
            timestamp: new Date().toISOString(),
        }));
    },

    debug: (message, meta = {}) => {
        if (process.env.NODE_ENV === 'development') {
            console.debug(JSON.stringify({
                level: 'debug',
                message,
                ...meta,
                timestamp: new Date().toISOString(),
            }));
        }
    },
};
