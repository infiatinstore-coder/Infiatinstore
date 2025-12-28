'use client';

import { useEffect, useState } from 'react';

export function PWAInstaller() {
    const [deferredPrompt, setDeferredPrompt] = useState(null);
    const [showInstallButton, setShowInstallButton] = useState(false);

    useEffect(() => {
        // Register service worker
        if ('serviceWorker' in navigator) {
            window.addEventListener('load', () => {
                navigator.serviceWorker
                    .register('/sw.js')
                    .then((registration) => {
                        console.log('✅ Service Worker registered:', registration.scope);
                    })
                    .catch((error) => {
                        console.log('❌ Service Worker registration failed:', error);
                    });
            });
        }

        // Handle install prompt - STORE EVENT, don't prompt immediately
        const handleBeforeInstallPrompt = (e) => {
            e.preventDefault();
            setDeferredPrompt(e);

            // Show install button after 10 seconds (optional)
            setTimeout(() => {
                setShowInstallButton(true);
            }, 10000);
        };

        window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

        // Track install 
        window.addEventListener('appinstalled', () => {
            console.log('✅ PWA installed successfully');
            setShowInstallButton(false);
        });

        return () => {
            window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
        };
    }, []);

    const handleInstallClick = async () => {
        if (!deferredPrompt) return;

        // Show install prompt (this is now triggered by user click - valid gesture!)
        deferredPrompt.prompt();

        const { outcome } = await deferredPrompt.userChoice;

        if (outcome === 'accepted') {
            console.log('✅ User installed PWA');
        } else {
            console.log('❌ User dismissed install');
        }

        setDeferredPrompt(null);
        setShowInstallButton(false);
    };

    // Only render button if we have a deferred prompt and want to show it
    if (!showInstallButton || !deferredPrompt) {
        return null;
    }

    return (
        <div className="fixed bottom-4 right-4 z-50 animate-slide-up">
            <button
                onClick={handleInstallClick}
                className="bg-primary-500 text-white px-4 py-3 rounded-lg shadow-lg flex items-center gap-2 hover:bg-primary-600 transition-colors"
            >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Install App
            </button>
        </div>
    );
}
