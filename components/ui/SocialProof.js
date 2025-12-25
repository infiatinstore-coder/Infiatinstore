'use client';

import { Eye, ShoppingCart, Clock, TrendingUp, Users, Flame } from 'lucide-react';
import { useState, useEffect } from 'react';

/**
 * Social Proof Components
 * Creates FOMO and trust like Shopee/Tokopedia
 */

/**
 * Sold Count Badge
 */
export function SoldCount({ count = 0 }) {
    const formatCount = (num) => {
        if (num >= 1000) {
            return (num / 1000).toFixed(1).replace('.0', '') + 'rb+';
        }
        return num + '+';
    };

    if (count === 0) return null;

    return (
        <span className="inline-flex items-center gap-1 text-sm text-neutral-500">
            <ShoppingCart className="w-3.5 h-3.5" />
            {formatCount(count)} terjual
        </span>
    );
}

/**
 * Real-time Viewers (simulated)
 */
export function ViewerCount({ productId, baseCount = 1 }) {
    const [viewers, setViewers] = useState(baseCount);

    useEffect(() => {
        // Simulate real-time viewers (1-5 random)
        const randomViewers = Math.floor(Math.random() * 5) + baseCount;
        setViewers(randomViewers);

        const interval = setInterval(() => {
            setViewers(prev => {
                const change = Math.random() > 0.5 ? 1 : -1;
                const newCount = prev + change;
                return Math.max(1, Math.min(newCount, 10));
            });
        }, 30000); // Update every 30 seconds

        return () => clearInterval(interval);
    }, [productId, baseCount]);

    return (
        <span className="inline-flex items-center gap-1 text-sm text-orange-600">
            <Eye className="w-3.5 h-3.5 animate-pulse" />
            {viewers} orang melihat produk ini
        </span>
    );
}

/**
 * Recent Purchases (simulated)
 */
export function RecentPurchases({ productName }) {
    const [show, setShow] = useState(false);
    const names = ['Budi', 'Ani', 'Dewi', 'Rudi', 'Siti', 'Ahmad', 'Lisa', 'Dian'];
    const cities = ['Jakarta', 'Surabaya', 'Bandung', 'Medan', 'Semarang', 'Makassar'];

    useEffect(() => {
        // Show notification periodically
        const showNotification = () => {
            setShow(true);
            setTimeout(() => setShow(false), 5000);
        };

        const timeout = setTimeout(showNotification, 10000);
        const interval = setInterval(showNotification, 60000);

        return () => {
            clearTimeout(timeout);
            clearInterval(interval);
        };
    }, []);

    if (!show) return null;

    const randomName = names[Math.floor(Math.random() * names.length)];
    const randomCity = cities[Math.floor(Math.random() * cities.length)];
    const randomMinutes = Math.floor(Math.random() * 30) + 1;

    return (
        <div className="fixed bottom-4 left-4 z-50 animate-slide-up">
            <div className="bg-white rounded-lg shadow-lg border border-neutral-200 p-3 max-w-xs">
                <div className="flex items-start gap-2">
                    <div className="p-1.5 bg-green-100 rounded-full">
                        <ShoppingCart className="w-3.5 h-3.5 text-green-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="text-sm text-neutral-800 truncate">
                            <strong>{randomName}</strong> dari {randomCity}
                        </p>
                        <p className="text-xs text-neutral-500">
                            baru saja membeli &quot;{productName?.slice(0, 20)}...&quot;
                        </p>
                        <p className="text-xs text-neutral-400 flex items-center gap-1 mt-1">
                            <Clock className="w-3 h-3" />
                            {randomMinutes} menit yang lalu
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}

/**
 * Trending Badge
 */
export function TrendingBadge() {
    return (
        <span className="inline-flex items-center gap-1 px-2 py-1 bg-red-500 text-white text-xs font-medium rounded-full">
            <TrendingUp className="w-3 h-3" />
            Trending
        </span>
    );
}

/**
 * Hot Item Badge
 */
export function HotBadge() {
    return (
        <span className="inline-flex items-center gap-1 px-2 py-1 bg-orange-500 text-white text-xs font-medium rounded-full animate-pulse">
            <Flame className="w-3 h-3" />
            Laris!
        </span>
    );
}

/**
 * Stock Urgency Text
 */
export function StockUrgency({ stock }) {
    if (stock > 20) return null;

    if (stock === 0) {
        return (
            <span className="text-red-600 font-medium text-sm">
                ❌ Stok Habis
            </span>
        );
    }

    if (stock <= 5) {
        return (
            <span className="text-red-600 font-medium text-sm animate-pulse">
                ⚠️ Tersisa {stock} lagi!
            </span>
        );
    }

    if (stock <= 20) {
        return (
            <span className="text-orange-600 font-medium text-sm">
                🔥 Sisa {stock} unit
            </span>
        );
    }

    return null;
}

/**
 * Combined Social Proof Section
 */
export function SocialProofSection({ soldCount, stock, showViewers = true, productId }) {
    return (
        <div className="flex flex-wrap items-center gap-3 py-2">
            <SoldCount count={soldCount} />
            {showViewers && <ViewerCount productId={productId} />}
            <StockUrgency stock={stock} />
        </div>
    );
}
