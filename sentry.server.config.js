/**
 * Sentry Server Configuration
 */

import * as Sentry from "@sentry/nextjs";

const SENTRY_DSN = process.env.SENTRY_DSN || process.env.NEXT_PUBLIC_SENTRY_DSN;

Sentry.init({
    dsn: SENTRY_DSN,
    tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
    environment: process.env.NODE_ENV,

    // Server-specific settings
    beforeSend(event, hint) {
        // Don't send in development
        if (process.env.NODE_ENV === 'development') {
            console.error('Sentry Server Error:', hint.originalException || hint.syntheticException);
            return null;
        }

        // Add server context
        event.tags = {
            ...event.tags,
            server: 'nextjs',
        };

        return event;
    },
});

export default Sentry;
