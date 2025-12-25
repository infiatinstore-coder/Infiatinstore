/**
 * Sentry Configuration for Error Monitoring
 * 
 * This will catch and report:
 * - Unhandled exceptions
 * - API errors
 * - Database errors
 * - Performance issues
 */

import * as Sentry from "@sentry/nextjs";

const SENTRY_DSN = process.env.SENTRY_DSN || process.env.NEXT_PUBLIC_SENTRY_DSN;

Sentry.init({
    dsn: SENTRY_DSN,

    // Set tracesSampleRate to 1.0 to capture 100% of transactions for performance monitoring.
    // We recommend adjusting this value in production
    tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,

    // Capture Replay for 10% of all sessions,
    // plus for 100% of sessions with an error
    replaysSessionSampleRate: 0.1,
    replaysOnErrorSampleRate: 1.0,

    // Note: if you want to override the automatic release value, do not set a
    // `release` value here - use the environment variable `SENTRY_RELEASE`, so
    // that it will also get attached to your source maps

    environment: process.env.NODE_ENV,

    // Ignore common non-critical errors
    ignoreErrors: [
        // Browser extensions
        'top.GLOBALS',
        'canvas.contentDocument',
        // Random plugins/extensions
        'originalCreateNotification',
        'atomicFindClose',
        // Facebook borked
        'fb_xd_fragment',
        // Network errors
        'NetworkError',
        'Network request failed',
    ],

    beforeSend(event, hint) {
        // Filter out development errors
        if (process.env.NODE_ENV === 'development') {
            console.error('Sentry Error:', hint.originalException || hint.syntheticException);
            return null; // Don't send to Sentry in dev
        }

        // Add custom context
        if (event.request) {
            event.tags = {
                ...event.tags,
                endpoint: event.request.url,
            };
        }

        return event;
    },

    integrations: [
        new Sentry.Replay({
            maskAllText: true,
            blockAllMedia: true,
        }),
    ],
});

// Export for manual error reporting
export default Sentry;
