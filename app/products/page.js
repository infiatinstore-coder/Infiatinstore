'use client';

import { useState, useMemo } from 'react';
import { useSearchParams } from 'next/navigation';
import { Filter, Grid3X3, List, SlidersHorizontal, X } from 'lucide-react';
import { Header, Footer } from '@/components/layout';
import { CartDrawer } from '@/components/cart';
import { ProductCard } from '@/components/product';
import { Button, Badge } from '@/components/ui';
import { products } from '@/data/products';
import { categories } from '@/data/categories';
import { formatRupiah } from '@/lib/utils';

const sortOptions = [
    { value: 'newest', label: 'Terbaru' },
    { value: 'price-low', label: 'Harga Terendah' },
    { value: 'price-high', label: 'Harga Tertinggi' },
    { value: 'popular', label: 'Paling Populer' },
    { value: 'rating', label: 'Rating Tertinggi' },
];

export default function ProductsPage() {
    const searchParams = useSearchParams();
    const categoryParam = searchParams.get('category');

    const [view, setView] = useState('grid'); // 'grid' | 'list'
    const [sortBy, setSortBy] = useState('newest');
    const [selectedCategory, setSelectedCategory] = useState(categoryParam || '');
    const [priceRange, setPriceRange] = useState({ min: 0, max: 1000000 });
    const [showFilters, setShowFilters] = useState(false);

    // Filter and sort products
    const filteredProducts = useMemo(() => {
        let result = [...products];

        // Filter by category
        if (selectedCategory) {
            const category = categories.find(c => c.slug === selectedCategory);
            if (category) {
                result = result.filter(p => p.categoryId === category.id);
            }
        }

        // Filter by price
        result = result.filter(p => {
            const price = p.salePrice || p.basePrice;
            return price >= priceRange.min && price <= priceRange.max;
        });

        // Sort
        switch (sortBy) {
            case 'price-low':
                result.sort((a, b) => (a.salePrice || a.basePrice) - (b.salePrice || b.basePrice));
                break;
            case 'price-high':
                result.sort((a, b) => (b.salePrice || b.basePrice) - (a.salePrice || a.basePrice));
                break;
            case 'popular':
                result.sort((a, b) => b.reviewCount - a.reviewCount);
                break;
            case 'rating':
                result.sort((a, b) => b.rating - a.rating);
                break;
            default:
                // newest - keep original order
                break;
        }

        return result;
    }, [selectedCategory, priceRange, sortBy]);

    const clearFilters = () => {
        setSelectedCategory('');
        setPriceRange({ min: 0, max: 1000000 });
        setSortBy('newest');
    };

    const hasActiveFilters = selectedCategory || priceRange.min > 0 || priceRange.max < 1000000;

    return (
        <>
            <Header />
            <CartDrawer />
            <main className="flex-1 bg-neutral-50">
                {/* Page Header */}
                <div className="bg-white border-b border-neutral-100">
                    <div className="container-app py-8">
                        <h1 className="text-3xl font-display font-bold text-neutral-800 mb-2">
                            {selectedCategory
                                ? categories.find(c => c.slug === selectedCategory)?.name || 'Produk'
                                : 'Semua Produk'}
                        </h1>
                        <p className="text-neutral-500">
                            {filteredProducts.length} produk ditemukan
                        </p>
                    </div>
                </div>

                <div className="container-app py-8">
                    <div className="flex gap-8">
                        {/* Sidebar Filters - Desktop */}
                        <aside className="hidden lg:block w-64 flex-shrink-0">
                            <div className="bg-white rounded-xl p-6 sticky top-24">
                                <div className="flex items-center justify-between mb-6">
                                    <h3 className="font-semibold text-neutral-800">Filter</h3>
                                    {hasActiveFilters && (
                                        <button
                                            onClick={clearFilters}
                                            className="text-sm text-primary-500 hover:underline"
                                        >
                                            Reset
                                        </button>
                                    )}
                                </div>

                                {/* Categories */}
                                <div className="mb-6">
                                    <h4 className="font-medium text-neutral-700 mb-3">Kategori</h4>
                                    <div className="space-y-2">
                                        <button
                                            onClick={() => setSelectedCategory('')}
                                            className={`w-full text-left px-3 py-2 rounded-lg transition-colors ${selectedCategory === ''
                                                    ? 'bg-primary-50 text-primary-600 font-medium'
                                                    : 'hover:bg-neutral-50'
                                                }`}
                                        >
                                            Semua Kategori
                                        </button>
                                        {categories.map((category) => (
                                            <button
                                                key={category.id}
                                                onClick={() => setSelectedCategory(category.slug)}
                                                className={`w-full text-left px-3 py-2 rounded-lg transition-colors ${selectedCategory === category.slug
                                                        ? 'bg-primary-50 text-primary-600 font-medium'
                                                        : 'hover:bg-neutral-50'
                                                    }`}
                                            >
                                                {category.name}
                                                <span className="text-neutral-400 text-sm ml-1">
                                                    ({category.productCount})
                                                </span>
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Price Range */}
                                <div>
                                    <h4 className="font-medium text-neutral-700 mb-3">Harga</h4>
                                    <div className="space-y-3">
                                        <div>
                                            <label className="text-sm text-neutral-500">Minimum</label>
                                            <input
                                                type="number"
                                                value={priceRange.min}
                                                onChange={(e) => setPriceRange({ ...priceRange, min: Number(e.target.value) })}
                                                className="input mt-1"
                                                placeholder="0"
                                            />
                                        </div>
                                        <div>
                                            <label className="text-sm text-neutral-500">Maximum</label>
                                            <input
                                                type="number"
                                                value={priceRange.max}
                                                onChange={(e) => setPriceRange({ ...priceRange, max: Number(e.target.value) })}
                                                className="input mt-1"
                                                placeholder="1000000"
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </aside>

                        {/* Main Content */}
                        <div className="flex-1">
                            {/* Toolbar */}
                            <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
                                {/* Mobile Filter Button */}
                                <button
                                    onClick={() => setShowFilters(true)}
                                    className="lg:hidden flex items-center gap-2 px-4 py-2 bg-white rounded-xl border border-neutral-200"
                                >
                                    <SlidersHorizontal className="w-4 h-4" />
                                    Filter
                                </button>

                                {/* Active Filters */}
                                {hasActiveFilters && (
                                    <div className="hidden lg:flex items-center gap-2">
                                        {selectedCategory && (
                                            <Badge variant="secondary" className="flex items-center gap-1">
                                                {categories.find(c => c.slug === selectedCategory)?.name}
                                                <button onClick={() => setSelectedCategory('')}>
                                                    <X className="w-3 h-3" />
                                                </button>
                                            </Badge>
                                        )}
                                    </div>
                                )}

                                {/* Sort & View */}
                                <div className="flex items-center gap-4 ml-auto">
                                    {/* Sort */}
                                    <select
                                        value={sortBy}
                                        onChange={(e) => setSortBy(e.target.value)}
                                        className="px-4 py-2 bg-white rounded-xl border border-neutral-200 focus:outline-none focus:border-primary-500"
                                    >
                                        {sortOptions.map((option) => (
                                            <option key={option.value} value={option.value}>
                                                {option.label}
                                            </option>
                                        ))}
                                    </select>

                                    {/* View Toggle */}
                                    <div className="hidden sm:flex items-center gap-1 bg-white rounded-xl p-1 border border-neutral-200">
                                        <button
                                            onClick={() => setView('grid')}
                                            className={`p-2 rounded-lg transition-colors ${view === 'grid' ? 'bg-primary-50 text-primary-500' : 'text-neutral-400'
                                                }`}
                                        >
                                            <Grid3X3 className="w-4 h-4" />
                                        </button>
                                        <button
                                            onClick={() => setView('list')}
                                            className={`p-2 rounded-lg transition-colors ${view === 'list' ? 'bg-primary-50 text-primary-500' : 'text-neutral-400'
                                                }`}
                                        >
                                            <List className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>
                            </div>

                            {/* Products Grid */}
                            {filteredProducts.length > 0 ? (
                                <div className={`grid gap-4 md:gap-6 ${view === 'grid'
                                        ? 'grid-cols-2 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4'
                                        : 'grid-cols-1'
                                    }`}>
                                    {filteredProducts.map((product) => (
                                        <ProductCard key={product.id} product={product} />
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-16">
                                    <p className="text-neutral-500 mb-4">Tidak ada produk yang ditemukan</p>
                                    <Button onClick={clearFilters} variant="secondary">
                                        Reset Filter
                                    </Button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Mobile Filters Modal */}
                {showFilters && (
                    <>
                        <div
                            className="fixed inset-0 bg-black/50 z-50 lg:hidden"
                            onClick={() => setShowFilters(false)}
                        />
                        <div className="fixed bottom-0 left-0 right-0 bg-white rounded-t-3xl z-50 lg:hidden max-h-[80vh] overflow-y-auto">
                            <div className="p-4 border-b border-neutral-100 flex items-center justify-between">
                                <h3 className="font-semibold text-neutral-800">Filter</h3>
                                <button onClick={() => setShowFilters(false)}>
                                    <X className="w-5 h-5 text-neutral-500" />
                                </button>
                            </div>
                            <div className="p-6 space-y-6">
                                {/* Categories */}
                                <div>
                                    <h4 className="font-medium text-neutral-700 mb-3">Kategori</h4>
                                    <div className="flex flex-wrap gap-2">
                                        <button
                                            onClick={() => setSelectedCategory('')}
                                            className={`px-4 py-2 rounded-full border transition-colors ${selectedCategory === ''
                                                    ? 'bg-primary-500 text-white border-primary-500'
                                                    : 'border-neutral-200'
                                                }`}
                                        >
                                            Semua
                                        </button>
                                        {categories.map((category) => (
                                            <button
                                                key={category.id}
                                                onClick={() => setSelectedCategory(category.slug)}
                                                className={`px-4 py-2 rounded-full border transition-colors ${selectedCategory === category.slug
                                                        ? 'bg-primary-500 text-white border-primary-500'
                                                        : 'border-neutral-200'
                                                    }`}
                                            >
                                                {category.name}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <div className="flex gap-3 pt-4">
                                    <Button
                                        variant="secondary"
                                        onClick={clearFilters}
                                        className="flex-1"
                                    >
                                        Reset
                                    </Button>
                                    <Button
                                        onClick={() => setShowFilters(false)}
                                        className="flex-1"
                                    >
                                        Terapkan
                                    </Button>
                                </div>
                            </div>
                        </div>
                    </>
                )}
            </main>
            <Footer />
        </>
    );
}
