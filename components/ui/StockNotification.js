'use client';

import { useState } from 'react';
import { Bell, Check, X } from 'lucide-react';

/**
 * Stock Notification Component
 * Allows users to subscribe for "back in stock" alerts
 */

export function StockNotification({ productId, productName }) {
    const [email, setEmail] = useState('');
    const [isOpen, setIsOpen] = useState(false);
    const [isSubmitted, setIsSubmitted] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);

        try {
            // Save notification subscription
            const response = await fetch('/api/notifications/stock', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    email,
                    productId,
                    productName
                }),
            });

            if (!response.ok) {
                throw new Error('Gagal mendaftar notifikasi');
            }

            setIsSubmitted(true);
            setEmail('');
        } catch (err) {
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    };

    if (isSubmitted) {
        return (
            <div className="flex items-center gap-2 p-3 bg-green-50 rounded-lg text-green-700">
                <Check className="w-5 h-5" />
                <span className="text-sm">Kami akan kabari Anda saat stok tersedia!</span>
            </div>
        );
    }

    if (!isOpen) {
        return (
            <button
                onClick={() => setIsOpen(true)}
                className="flex items-center gap-2 px-4 py-2 bg-neutral-100 hover:bg-neutral-200 rounded-lg text-neutral-700 transition-colors"
            >
                <Bell className="w-4 h-4" />
                <span className="text-sm font-medium">Kabari Saat Tersedia</span>
            </button>
        );
    }

    return (
        <div className="p-4 bg-neutral-50 rounded-lg border border-neutral-200">
            <div className="flex items-start justify-between mb-3">
                <div>
                    <h4 className="font-medium text-neutral-800">Notifikasi Stok</h4>
                    <p className="text-sm text-neutral-500">
                        Dapatkan email saat produk ini tersedia
                    </p>
                </div>
                <button
                    onClick={() => setIsOpen(false)}
                    className="text-neutral-400 hover:text-neutral-600"
                >
                    <X className="w-5 h-5" />
                </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-3">
                <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Email Anda"
                    required
                    className="w-full px-3 py-2 border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                />

                {error && (
                    <p className="text-sm text-red-500">{error}</p>
                )}

                <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full py-2 bg-primary-500 hover:bg-primary-600 text-white rounded-lg font-medium disabled:opacity-50 transition-colors"
                >
                    {isLoading ? 'Mendaftar...' : 'Kabari Saya'}
                </button>
            </form>
        </div>
    );
}

/**
 * Price Drop Notification
 */
export function PriceDropNotification({ productId }) {
    const [email, setEmail] = useState('');
    const [isOpen, setIsOpen] = useState(false);
    const [isSubmitted, setIsSubmitted] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        // Would save to database
        setIsSubmitted(true);
    };

    if (isSubmitted) {
        return (
            <span className="flex items-center gap-1 text-sm text-green-600">
                <Check className="w-4 h-4" />
                Tersimpan!
            </span>
        );
    }

    if (!isOpen) {
        return (
            <button
                onClick={() => setIsOpen(true)}
                className="text-sm text-primary-600 hover:text-primary-700 hover:underline"
            >
                🔔 Kabari saat harga turun
            </button>
        );
    }

    return (
        <form onSubmit={handleSubmit} className="flex gap-2">
            <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Email"
                required
                className="flex-1 px-3 py-1.5 text-sm border rounded-lg"
            />
            <button
                type="submit"
                className="px-3 py-1.5 bg-primary-500 text-white text-sm rounded-lg"
            >
                OK
            </button>
        </form>
    );
}
