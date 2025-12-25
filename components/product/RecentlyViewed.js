'use client';

import { useState, useEffect } from 'react';
import { ProductCard } from '@/components/product';

export function RecentlyViewedProducts() {
    const [products, setProducts] = useState([]);

    useEffect(() => {
        const STORAGE_KEY = 'infiatin-recently-viewed';
        try {
            const stored = localStorage.getItem(STORAGE_KEY);
            if (stored) {
                const recentlyViewed = JSON.parse(stored);
                // Only show first 6-10 items
                setProducts(recentlyViewed.slice(0, 10));
            }
        } catch (error) {
            console.error('Failed to load recently viewed:', error);
        }
    }, []);

    if (products.length === 0) {
        return null; // Don't show section if empty
    }

    return (
        <section className="py-8 bg-white">
            <div className="container-app">
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-bold text-neutral-800">
                        Terakhir Dilihat
                    </h2>
                    <button
                        onClick={() => {
                            localStorage.removeItem('infiatin-recently-viewed');
                            setProducts([]);
                        }}
                        className="text-sm text-neutral-500 hover:text-primary-500"
                    >
                        Hapus Riwayat
                    </button>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                    {products.map((product) => (
                        <ProductCard key={product.id} product={product} />
                    ))}
                </div>
            </div>
        </section>
    );
}
