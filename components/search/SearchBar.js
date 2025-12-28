'use client';

import { useState, useEffect } from 'react';
import { Search, X } from 'lucide-react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';

export function SearchBar({ initialQuery = '' }) {
    const router = useRouter();
    const [query, setQuery] = useState(initialQuery);
    const [suggestions, setSuggestions] = useState({ products: [], categories: [] });
    const [isOpen, setIsOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        if (query.length < 2) {
            setSuggestions({ products: [], categories: [] });
            setIsOpen(false);
            return;
        }

        const timeoutId = setTimeout(async () => {
            setIsLoading(true);
            try {
                const response = await fetch(`/api/products/suggestions?q=${encodeURIComponent(query)}&limit=5`);
                const data = await response.json();

                if (data.success) {
                    setSuggestions(data.suggestions);
                    setIsOpen(true);
                }
            } catch (error) {
                console.error('Search error:', error);
            } finally {
                setIsLoading(false);
            }
        }, 300); // Debounce 300ms

        return () => clearTimeout(timeoutId);
    }, [query]);

    const handleSearch = (e) => {
        e.preventDefault();
        if (query.trim()) {
            router.push(`/products?q=${encodeURIComponent(query.trim())}`);
            setIsOpen(false);
        }
    };

    const handleProductClick = (slug) => {
        router.push(`/products/${slug}`);
        setIsOpen(false);
        setQuery('');
    };

    const handleCategoryClick = (slug) => {
        router.push(`/products?category=${slug}`);
        setIsOpen(false);
        setQuery('');
    };

    return (
        <div className="relative w-full max-w-2xl">
            <form onSubmit={handleSearch} className="relative">
                <input
                    type="text"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Cari produk..."
                    className="w-full px-4 py-3 pl-12 pr-12 rounded-xl border-2 border-neutral-200 focus:border-primary-500 focus:outline-none transition-colors"
                />
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400" />

                {query && (
                    <button
                        type="button"
                        onClick={() => {
                            setQuery('');
                            setIsOpen(false);
                        }}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600"
                    >
                        <X className="w-5 h-5" />
                    </button>
                )}

                {isLoading && (
                    <div className="absolute right-12 top-1/2 -translate-y-1/2">
                        <div className="w-4 h-4 border-2 border-primary-500 border-t-transparent rounded-full animate-spin"></div>
                    </div>
                )}
            </form>

            {/* Suggestions Dropdown */}
            {isOpen && (suggestions.products.length > 0 || suggestions.categories.length > 0) && (
                <div className="absolute top-full mt-2 w-full bg-white rounded-xl shadow-xl border border-neutral-200 overflow-hidden z-50">
                    {/* Products */}
                    {suggestions.products.length > 0 && (
                        <div className="p-2">
                            <p className="px-3 py-2 text-xs font-semibold text-neutral-500 uppercase">Produk</p>
                            {suggestions.products.map((product) => (
                                <button
                                    key={product.id}
                                    onClick={() => handleProductClick(product.slug)}
                                    className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-neutral-50 transition-colors text-left"
                                >
                                    {product.image && (
                                        <div className="relative w-12 h-12 rounded-lg overflow-hidden bg-neutral-100 flex-shrink-0">
                                            <Image
                                                src={product.image}
                                                alt={product.name}
                                                fill
                                                className="object-cover"
                                            />
                                        </div>
                                    )}
                                    <div className="flex-1 min-w-0">
                                        <p className="font-medium text-neutral-800 truncate">{product.name}</p>
                                        <p className="text-sm text-primary-600 font-semibold">
                                            {new Intl.NumberFormat('id-ID', {
                                                style: 'currency',
                                                currency: 'IDR',
                                                minimumFractionDigits: 0,
                                            }).format(product.price)}
                                        </p>
                                    </div>
                                </button>
                            ))}
                        </div>
                    )}

                    {/* Categories */}
                    {suggestions.categories.length > 0 && (
                        <div className="p-2 border-t border-neutral-100">
                            <p className="px-3 py-2 text-xs font-semibold text-neutral-500 uppercase">Kategori</p>
                            {suggestions.categories.map((category) => (
                                <button
                                    key={category.id}
                                    onClick={() => handleCategoryClick(category.slug)}
                                    className="w-full flex items-center justify-between px-3 py-2 rounded-lg hover:bg-neutral-50 transition-colors text-left"
                                >
                                    <span className="font-medium text-neutral-800">{category.name}</span>
                                    <span className="text-sm text-neutral-500">{category.productCount} produk</span>
                                </button>
                            ))}
                        </div>
                    )}

                    {/* View All Results */}
                    <div className="p-2 border-t border-neutral-100">
                        <button
                            onClick={handleSearch}
                            className="w-full px-3 py-2 text-center text-primary-600 hover:bg-primary-50 rounded-lg transition-colors font-medium"
                        >
                            Lihat semua hasil untuk &quot;{query}&quot;
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
