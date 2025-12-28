/**
 * Professional Logging Utility for Infiatin Store
 * 
 * Usage:
 * - logger.dev() - Development only (hidden in production)
 * - logger.info() - Production info logs (with emoji)
 * - logger.error() - Always logged errors
 * - logger.warn() - Warnings
 */

const isDevelopment = process.env.NODE_ENV === 'development';
const isProduction = process.env.NODE_ENV === 'production';

export const logger = {
    /**
     * Development-only logs (hidden in production)
     * Use for debugging that shouldn't clutter prod logs
     */
    dev: (...args) => {
        if (isDevelopment) {
            console.log('[DEV]', ...args);
        }
    },

    /**
     * Production info logs - important system events
     * Use emoji markers for easy filtering in logs
     */
    info: (...args) => {
        console.log(...args);
    },

    /**
     * Production success logs
     */
    success: (message, ...args) => {
        console.log('✅', message, ...args);
    },

    /**
     * Warnings - always shown
     */
    warn: (message, ...args) => {
        console.warn('⚠️', message, ...args);
    },

    /**
     * Errors - always logged
     */
    error: (message, error) => {
        console.error('❌', message);
        if (error) {
            console.error('Error details:', error);
        }
    },

    /**
     * System/Cron jobs
     */
    system: (message, ...args) => {
        console.log('🤖', message, ...args);
    },

    /**
     * Email related logs
     */
    email: (message, ...args) => {
        console.log('📧', message, ...args);
    },

    /**
     * Upload/File operations
     */
    upload: (message, ...args) => {
        console.log('📤', message, ...args);
    },

    /**
     * Order operations
     */
    order: (message, ...args) => {
        console.log('🛒', message, ...args);
    },

    /**
     * Security/Auth operations
     */
    security: (message, ...args) => {
        console.log('🔐', message, ...args);
    }
};

// Export default for convenience
export default logger;
