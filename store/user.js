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
            logout: () => {
                set({
                    user: null,
                    token: null,
                    isAuthenticated: false
                });
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
