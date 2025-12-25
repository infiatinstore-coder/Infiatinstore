/**
 * PWA Update Notification
 * Notifies users when new version is available
 */

'use client';

import { useState, useEffect } from 'react';

export default function PWAUpdateNotification() {
    const [showUpdate, setShowUpdate] = useState(false);
    const [registration, setRegistration] = useState(null);

    useEffect(() => {
        if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
            navigator.serviceWorker.ready.then((reg) => {
                setRegistration(reg);

                // Check for updates every hour
                setInterval(() => {
                    reg.update();
                }, 60 * 60 * 1000);
            });

            // Listen for new service worker
            navigator.serviceWorker.addEventListener('controllerchange', () => {
                setShowUpdate(true);
            });
        }
    }, []);

    const handleUpdate = () => {
        if (registration && registration.waiting) {
            registration.waiting.postMessage({ type: 'SKIP_WAITING' });
        }
        window.location.reload();
    };

    if (!showUpdate) return null;

    return (
        <div className="fixed top-4 right-4 bg-green-600 text-white p-4 rounded-lg shadow-2xl z-50 max-w-sm animate-slide-down">
            <div className="flex items-start gap-3">
                <svg className="w-6 h-6 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                <div className="flex-1">
                    <h4 className="font-bold mb-1">Update Tersedia!</h4>
                    <p className="text-sm opacity-90 mb-3">
                        Versi baru Infiatin Store sudah siap.
                    </p>
                    <button
                        onClick={handleUpdate}
                        className="bg-white text-green-600 px-4 py-2 rounded font-semibold text-sm hover:bg-gray-100 transition w-full"
                    >
                        Update Sekarang
                    </button>
                </div>
                <button
                    onClick={() => setShowUpdate(false)}
                    className="text-white hover:bg-white/20 rounded p-1 transition"
                >
                    ✕
                </button>
            </div>
        </div>
    );
}
