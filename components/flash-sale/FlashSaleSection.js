'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Zap, Clock } from 'lucide-react';
import { CountdownTimer, FlashSaleProgress } from './CountdownTimer';
import { formatRupiah } from '@/lib/utils';

export function FlashSaleSection() {
    const [flashSales, setFlashSales] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchFlashSales();
    }, []);

    const fetchFlashSales = async () => {
        try {
            const response = await fetch('/api/flash-sales?includeUpcoming=true&limit=1');
            const data = await response.json();

            if (data.success) {
                setFlashSales(data.flashSales);
            }
        } catch (error) {
            console.error('Failed to fetch flash sales:', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <section className="py-12 bg-gradient-to-r from-red-600 to-orange-500">
                <div className="container mx-auto px-4">
                    <div className="animate-pulse">
                        <div className="h-8 bg-white/20 rounded w-64 mb-6" />
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            {[1, 2, 3, 4].map((i) => (
                                <div key={i} className="bg-white/20 rounded-xl h-64" />
                            ))}
                        </div>
                    </div>
                </div>
            </section>
        );
    }

    if (!flashSales.length) {
        return null;
    }

    const currentSale = flashSales[0];

    return (
        <section className="py-12 bg-gradient-to-r from-red-600 via-red-500 to-orange-500 relative overflow-hidden">
            {/* Background Pattern */}
            <div className="absolute inset-0 opacity-10">
                <div className="absolute inset-0" style={{
                    backgroundImage: 'url("data:image/svg+xml,%3Csvg width="60" height="60" viewBox="0 0 60 60" xmlns="http://www.w3.org/2000/svg"%3E%3Cg fill="none" fill-rule="evenodd"%3E%3Cg fill="%23ffffff" fill-opacity="0.4"%3E%3Cpath d="M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z"/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")',
                }} />
            </div>

            <div className="container mx-auto px-4 relative z-10">
                {/* Header */}
                <div className="flex flex-col md:flex-row items-center justify-between mb-8 gap-4">
                    <div className="flex items-center gap-3">
                        <div className="bg-white/20 backdrop-blur-sm rounded-full p-3">
                            <Zap className="w-8 h-8 text-yellow-300 fill-yellow-300" />
                        </div>
                        <div>
                            <h2 className="text-3xl font-bold text-white">⚡ Flash Sale</h2>
                            <p className="text-white/80">{currentSale.name}</p>
                        </div>
                    </div>

                    <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4">
                        <div className="flex items-center gap-2 text-white/80 text-sm mb-2">
                            <Clock className="w-4 h-4" />
                            <span>Berakhir dalam:</span>
                        </div>
                        <CountdownTimer endTime={currentSale.endTime} />
                    </div>
                </div>

                {/* Products Grid */}
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
                    {currentSale.products.slice(0, 5).map((product) => (
                        <Link
                            key={product.id}
                            href={`/products/${product.slug}`}
                            className="group bg-white rounded-xl overflow-hidden shadow-xl hover:shadow-2xl transition-all duration-300 hover:-translate-y-1"
                        >
                            {/* Discount Badge */}
                            <div className="relative">
                                <div className="absolute top-2 left-2 z-10 bg-red-500 text-white text-xs font-bold px-2 py-1 rounded">
                                    -{product.discountPercentage}%
                                </div>

                                <div className="relative h-40 bg-neutral-100">
                                    {product.image ? (
                                        <Image
                                            src={product.image}
                                            alt={product.name}
                                            fill
                                            className="object-cover group-hover:scale-105 transition-transform duration-300"
                                        />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center text-neutral-400">
                                            <Zap className="w-12 h-12" />
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="p-3">
                                <h3 className="text-sm font-medium text-neutral-800 line-clamp-2 mb-2 group-hover:text-red-600">
                                    {product.name}
                                </h3>

                                <div className="flex flex-col gap-1 mb-3">
                                    <span className="text-lg font-bold text-red-600">
                                        {formatRupiah(product.flashSalePrice)}
                                    </span>
                                    <span className="text-xs text-neutral-400 line-through">
                                        {formatRupiah(product.originalPrice)}
                                    </span>
                                </div>

                                <FlashSaleProgress
                                    soldCount={product.soldCount}
                                    stockLimit={product.stockLimit}
                                />
                            </div>
                        </Link>
                    ))}
                </div>

                {/* View All Link */}
                <div className="text-center mt-8">
                    <Link
                        href={`/flash-sale/${currentSale.slug}`}
                        className="inline-flex items-center gap-2 bg-white text-red-600 font-semibold px-6 py-3 rounded-full hover:bg-red-50 transition-colors shadow-lg"
                    >
                        Lihat Semua Promo
                        <span className="text-xl">→</span>
                    </Link>
                </div>
            </div>
        </section>
    );
}
