import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export const useUserStore = create(
    persist(
        (set, get) => ({
            user: null,
            token: null,
            isAuthenticated: false,

            // Set user after login/register
            setUser: (user, token) => {
                set({
                    user,
                    token,
                    isAuthenticated: !!user
                });
            },

            // Update user profile
            updateUser: (userData) => {
                set((state) => ({
                    user: state.user ? { ...state.user, ...userData } : null,
                }));
            },

            // Logout
            logout: async () => {
                // Call logout API to clear httpOnly cookie
                try {
                    await fetch('/api/auth/logout', {
                        method: 'POST',
                        credentials: 'include'
                    });
                } catch (error) {
                    console.error('Logout API error:', error);
                    // Continue with logout even if API fails
                }

                set({
                    user: null,
                    token: null,
                    isAuthenticated: false
                });

                // Clear localStorage
                if (typeof window !== 'undefined') {
                    localStorage.removeItem('auth-token');
                    localStorage.removeItem('infiya-user');
                    // Redirect to homepage
                    window.location.href = '/';
                }
            },

            // Check if user is authenticated
            checkAuth: () => {
                const { token } = get();
                return !!token;
            },
        }),
        {
            name: 'infiya-user',
        }
    )
);

export default useUserStore;
