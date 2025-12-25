'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowLeft, Heart, ShoppingCart, Trash2, Star } from 'lucide-react';
import { Header, Footer } from '@/components/layout';
import { CartDrawer } from '@/components/cart';
import { Button } from '@/components/ui';
import { formatRupiah, calculateDiscountPercentage } from '@/lib/utils';
import useCartStore from '@/store/cart';

// Mock wishlist data
const mockWishlist = [
    {
        id: '1',
        name: 'Serum Vitamin C Brightening',
        slug: 'serum-vitamin-c-brightening',
        image: 'https://images.unsplash.com/photo-1620916566398-39f1143ab7be?w=400',
        basePrice: 189000,
        salePrice: 149000,
        stock: 50,
        rating: 4.8,
        reviewCount: 234,
    },
    {
        id: '2',
        name: 'Moisturizer Hydrating Gel',
        slug: 'moisturizer-hydrating-gel',
        image: 'https://images.unsplash.com/photo-1611930022073-b7a4ba5fcccd?w=400',
        basePrice: 145000,
        salePrice: null,
        stock: 75,
        rating: 4.6,
        reviewCount: 156,
    },
    {
        id: '3',
        name: 'Sunscreen SPF 50+ PA++++',
        slug: 'sunscreen-spf-50',
        image: 'https://images.unsplash.com/photo-1556228578-0d85b1a4d571?w=400',
        basePrice: 175000,
        salePrice: 159000,
        stock: 100,
        rating: 4.9,
        reviewCount: 412,
    },
];

export default function WishlistPage() {
    const [wishlist, setWishlist] = useState(mockWishlist);
    const { addItem, openCart } = useCartStore();

    const handleRemove = (id) => {
        setWishlist(wishlist.filter((item) => item.id !== id));
    };

    const handleAddToCart = (product) => {
        addItem(product);
        openCart();
    };

    return (
        <>
            <Header />
            <CartDrawer />
            <main className="flex-1 bg-neutral-50">
                <div className="container-app py-8">
                    {/* Header */}
                    <div className="mb-6">
                        <Link href="/account" className="inline-flex items-center gap-2 text-neutral-500 hover:text-primary-500 mb-2">
                            <ArrowLeft className="w-4 h-4" />
                            Kembali ke Akun
                        </Link>
                        <div className="flex items-center justify-between">
                            <div>
                                <h1 className="text-2xl font-bold text-neutral-800">Wishlist Saya</h1>
                                <p className="text-neutral-500">{wishlist.length} produk favorit</p>
                            </div>
                            {wishlist.length > 0 && (
                                <Button variant="secondary" onClick={() => setWishlist([])}>
                                    <Trash2 className="w-4 h-4" />
                                    Hapus Semua
                                </Button>
                            )}
                        </div>
                    </div>

                    {/* Wishlist Items */}
                    {wishlist.length > 0 ? (
                        <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                            {wishlist.map((product) => {
                                const discountPercentage = calculateDiscountPercentage(product.basePrice, product.salePrice);

                                return (
                                    <div key={product.id} className="bg-white rounded-xl shadow-sm overflow-hidden group">
                                        {/* Image */}
                                        <Link href={`/products/${product.slug}`}>
                                            <div className="relative aspect-square overflow-hidden bg-neutral-100">
                                                <Image
                                                    src={product.image}
                                                    alt={product.name}
                                                    fill
                                                    className="object-cover transition-transform duration-500 group-hover:scale-105"
                                                />
                                                {discountPercentage > 0 && (
                                                    <span className="absolute top-3 left-3 px-2 py-1 bg-red-500 text-white text-xs font-medium rounded-lg">
                                                        -{discountPercentage}%
                                                    </span>
                                                )}
                                                <button
                                                    onClick={(e) => {
                                                        e.preventDefault();
                                                        handleRemove(product.id);
                                                    }}
                                                    className="absolute top-3 right-3 w-9 h-9 bg-white rounded-full flex items-center justify-center shadow-lg text-red-500 hover:bg-red-50 transition-colors"
                                                >
                                                    <Heart className="w-5 h-5 fill-current" />
                                                </button>
                                            </div>
                                        </Link>

                                        {/* Content */}
                                        <div className="p-4">
                                            <Link href={`/products/${product.slug}`}>
                                                <h3 className="font-semibold text-neutral-800 line-clamp-2 mb-2 group-hover:text-primary-500 transition-colors">
                                                    {product.name}
                                                </h3>
                                            </Link>

                                            {/* Rating */}
                                            <div className="flex items-center gap-1 mb-2">
                                                <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                                                <span className="text-sm font-medium text-neutral-700">{product.rating}</span>
                                                <span className="text-sm text-neutral-400">({product.reviewCount})</span>
                                            </div>

                                            {/* Price */}
                                            <div className="flex items-center gap-2 mb-4">
                                                {product.salePrice ? (
                                                    <>
                                                        <span className="text-lg font-bold text-primary-500">
                                                            {formatRupiah(product.salePrice)}
                                                        </span>
                                                        <span className="text-sm text-neutral-400 line-through">
                                                            {formatRupiah(product.basePrice)}
                                                        </span>
                                                    </>
                                                ) : (
                                                    <span className="text-lg font-bold text-neutral-800">
                                                        {formatRupiah(product.basePrice)}
                                                    </span>
                                                )}
                                            </div>

                                            {/* Actions */}
                                            <Button
                                                fullWidth
                                                onClick={() => handleAddToCart(product)}
                                                disabled={product.stock === 0}
                                            >
                                                <ShoppingCart className="w-4 h-4" />
                                                {product.stock === 0 ? 'Stok Habis' : 'Tambah ke Keranjang'}
                                            </Button>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    ) : (
                        <div className="bg-white rounded-xl shadow-sm p-12 text-center">
                            <Heart className="w-16 h-16 text-neutral-300 mx-auto mb-4" />
                            <h3 className="text-lg font-semibold text-neutral-800 mb-2">Wishlist kosong</h3>
                            <p className="text-neutral-500 mb-6">Simpan produk favorit Anda di sini</p>
                            <Link href="/products">
                                <Button>Jelajahi Produk</Button>
                            </Link>
                        </div>
                    )}
                </div>
            </main>
            <Footer />
        </>
    );
}
