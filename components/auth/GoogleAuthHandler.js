'use client';

import { useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import useUserStore from '@/store/user';

function AuthHandlerContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const { setUser } = useUserStore();

    useEffect(() => {
        const token = searchParams.get('token');

        if (token) {
            // Save initial token
            localStorage.setItem('auth-token', token);

            // Fetch user data with this token
            fetch('/api/auth/me', {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            })
                .then(res => res.json())
                .then(userData => {
                    if (userData) {
                        setUser(userData, token);
                        // Remove token from URL for clean history
                        const newUrl = window.location.pathname;
                        window.history.replaceState({}, document.title, newUrl);

                        // Optional: Show success message/toast
                        // alert('Login Google Berhasil!'); 
                    }
                })
                .catch(err => {
                    console.error('Failed to fetch user after Google login', err);
                });
        }
    }, [searchParams, setUser, router]);

    return null;
}

export default function GoogleAuthHandler() {
    return (
        <Suspense fallback={null}>
            <AuthHandlerContent />
        </Suspense>
    );
}
