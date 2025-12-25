'use client';

import { useState } from 'react';

/**
 * Social Login Buttons Component
 * Google and Facebook OAuth login buttons
 */
export default function SocialLoginButtons({ onSuccess, onError }) {
    const [loading, setLoading] = useState(null); // 'google' | 'facebook' | null

    // Google Login Handler
    const handleGoogleLogin = async () => {
        setLoading('google');
        try {
            // Load Google OAuth script if not loaded
            if (!window.google) {
                await loadScript('https://accounts.google.com/gsi/client');
            }

            // Initialize Google OAuth
            google.accounts.id.initialize({
                client_id: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID,
                callback: handleGoogleResponse,
            });

            // Prompt login
            google.accounts.id.prompt();

        } catch (error) {
            console.error('Google Login Error:', error);
            setLoading(null);
            onError?.(error);
        }
    };

    const handleGoogleResponse = async (response) => {
        try {
            // Decode JWT token
            const profile = parseJwt(response.credential);

            // Send to backend
            const res = await fetch('/api/auth/google', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    token: response.credential,
                    profile: {
                        email: profile.email,
                        name: profile.name,
                        picture: profile.picture,
                        sub: profile.sub
                    }
                })
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.error || 'Login failed');
            }

            setLoading(null);
            onSuccess?.(data);

        } catch (error) {
            console.error('Google Auth Error:', error);
            setLoading(null);
            onError?.(error);
        }
    };

    // Facebook Login Handler
    const handleFacebookLogin = async () => {
        setLoading('facebook');
        try {
            // Load Facebook SDK if not loaded
            if (!window.FB) {
                await loadFacebookSDK();
            }

            // Login with Facebook
            FB.login((response) => {
                if (response.authResponse) {
                    handleFacebookResponse(response.authResponse);
                } else {
                    setLoading(null);
                    onError?.(new Error('Facebook login cancelled'));
                }
            }, { scope: 'email,public_profile' });

        } catch (error) {
            console.error('Facebook Login Error:', error);
            setLoading(null);
            onError?.(error);
        }
    };

    const handleFacebookResponse = async (authResponse) => {
        try {
            // Get user profile
            FB.api('/me', { fields: 'email,name,picture' }, async (profile) => {
                // Send to backend
                const res = await fetch('/api/auth/facebook', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        token: authResponse.accessToken,
                        profile: {
                            email: profile.email,
                            name: profile.name,
                            picture: profile.picture,
                            id: profile.id
                        }
                    })
                });

                const data = await res.json();

                if (!res.ok) {
                    throw new Error(data.error || 'Login failed');
                }

                setLoading(null);
                onSuccess?.(data);
            });

        } catch (error) {
            console.error('Facebook Auth Error:', error);
            setLoading(null);
            onError?.(error);
        }
    };

    // Helper: Load external script
    const loadScript = (src) => {
        return new Promise((resolve, reject) => {
            const script = document.createElement('script');
            script.src = src;
            script.async = true;
            script.onload = resolve;
            script.onerror = reject;
            document.body.appendChild(script);
        });
    };

    // Helper: Load Facebook SDK
    const loadFacebookSDK = () => {
        return new Promise((resolve) => {
            window.fbAsyncInit = function () {
                FB.init({
                    appId: process.env.NEXT_PUBLIC_FACEBOOK_APP_ID,
                    cookie: true,
                    xfbml: true,
                    version: 'v18.0'
                });
                resolve();
            };

            const script = document.createElement('script');
            script.src = 'https://connect.facebook.net/en_US/sdk.js';
            script.async = true;
            document.body.appendChild(script);
        });
    };

    // Helper: Parse JWT
    const parseJwt = (token) => {
        const base64Url = token.split('.')[1];
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        const jsonPayload = decodeURIComponent(
            atob(base64)
                .split('')
                .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
                .join('')
        );
        return JSON.parse(jsonPayload);
    };

    return (
        <div className="flex flex-col gap-3 w-full">
            {/* Google Login Button */}
            <button
                onClick={handleGoogleLogin}
                disabled={loading !== null}
                className="flex items-center justify-center gap-3 w-full px-4 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
                {loading === 'google' ? (
                    <div className="w-5 h-5 border-2 border-gray-300 border-t-emerald-600 rounded-full animate-spin" />
                ) : (
                    <svg className="w-5 h-5" viewBox="0 0 24 24">
                        <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                        <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                        <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                        <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                    </svg>
                )}
                <span className="font-medium text-gray-700">Masuk dengan Google</span>
            </button>

            {/* Facebook Login Button */}
            <button
                onClick={handleFacebookLogin}
                disabled={loading !== null}
                className="flex items-center justify-center gap-3 w-full px-4 py-3 bg-[#1877F2] text-white rounded-lg hover:bg-[#166FE5] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
                {loading === 'facebook' ? (
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                    </svg>
                )}
                <span className="font-medium">Masuk dengan Facebook</span>
            </button>

            {/* Divider */}
            <div className="flex items-center gap-4 my-2">
                <div className="flex-1 h-px bg-gray-300"></div>
                <span className="text-sm text-gray-500">atau</span>
                <div className="flex-1 h-px bg-gray-300"></div>
            </div>
        </div>
    );
}
