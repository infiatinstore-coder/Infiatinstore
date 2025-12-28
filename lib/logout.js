/**
 * Logout utility function
 * Clears all authentication state and cookies, then redirects to login
 * This runs only on client side
 */
export function performLogout(zustandLogout) {
    // First clear Zustand state
    if (zustandLogout) {
        zustandLogout();
    }

    // Then clear browser storage and cookies (client-side only)
    if (typeof window !== 'undefined') {
        // Delete auth-token cookie
        document.cookie = 'auth-token=; Path=/; Expires=Thu, 01 Jan 1970 00:00:01 GMT;';

        // Clear localStorage token if exists
        try {
            localStorage.removeItem('auth-token');
            localStorage.removeItem('infiya-user');
        } catch (e) {
            // Ignore storage errors
        }

        // Redirect to login page
        window.location.href = '/auth/login';
    }
}
