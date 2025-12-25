'use client';

import { X, Plus, Minus, Trash2, ShoppingBag } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { formatRupiah } from '@/lib/utils';
import { Button } from '@/components/ui';
import useCartStore from '@/store/cart';

export default function CartDrawer() {
    // Zustand selectors - stable for SSR
    const items = useCartStore((state) => state.items);
    const isOpen = useCartStore((state) => state.isOpen);
    const closeCart = useCartStore((state) => state.closeCart);
    const removeItem = useCartStore((state) => state.removeItem);
    const increaseQuantity = useCartStore((state) => state.increaseQuantity);
    const decreaseQuantity = useCartStore((state) => state.decreaseQuantity);
    const getTotal = useCartStore((state) => state.getTotal);

    const total = getTotal();

    if (!isOpen) return null;

    return (
        <>
            {/* Overlay */}
            <div
                className="fixed inset-0 bg-black/50 z-50 transition-opacity"
                onClick={closeCart}
            />

            {/* Drawer */}
            <div className="fixed right-0 top-0 h-full w-full max-w-md bg-white z-50 shadow-xl animate-slide-down flex flex-col">
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-neutral-100">
                    <h2 className="text-lg font-bold text-neutral-800 flex items-center gap-2">
                        <ShoppingBag className="w-5 h-5" />
                        Keranjang Belanja
                    </h2>
                    <button
                        onClick={closeCart}
                        className="p-2 hover:bg-neutral-100 rounded-lg transition-colors"
                    >
                        <X className="w-5 h-5 text-neutral-500" />
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-4">
                    {items.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-full text-center">
                            <ShoppingBag className="w-16 h-16 text-neutral-300 mb-4" />
                            <h3 className="font-semibold text-neutral-600 mb-2">Keranjang Kosong</h3>
                            <p className="text-sm text-neutral-400 mb-4">
                                Yuk, mulai belanja dan temukan produk favoritmu!
                            </p>
                            <Button onClick={closeCart} variant="primary">
                                Mulai Belanja
                            </Button>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {items.map((item) => (
                                <div key={item.id} className="flex gap-4 p-3 bg-neutral-50 rounded-xl">
                                    {/* Image */}
                                    <div className="relative w-20 h-20 rounded-lg overflow-hidden flex-shrink-0">
                                        <Image
                                            src={item.image}
                                            alt={item.name}
                                            fill
                                            className="object-cover"
                                        />
                                    </div>

                                    {/* Info */}
                                    <div className="flex-1 min-w-0">
                                        <h4 className="font-medium text-neutral-800 text-sm line-clamp-2 mb-1">
                                            {item.name}
                                        </h4>
                                        {item.variantName && (
                                            <p className="text-xs text-neutral-500 mb-1">{item.variantName}</p>
                                        )}
                                        <p className="font-bold text-primary-500">
                                            {formatRupiah(item.salePrice || item.basePrice)}
                                        </p>

                                        {/* Quantity Controls */}
                                        <div className="flex items-center justify-between mt-2">
                                            <div className="flex items-center gap-2">
                                                <button
                                                    onClick={() => decreaseQuantity(item.id)}
                                                    disabled={item.quantity <= 1}
                                                    className="w-7 h-7 flex items-center justify-center rounded-lg border border-neutral-200 hover:border-primary-500 disabled:opacity-50 disabled:cursor-not-allowed"
                                                >
                                                    <Minus className="w-3 h-3" />
                                                </button>
                                                <span className="w-8 text-center font-medium text-sm">
                                                    {item.quantity}
                                                </span>
                                                <button
                                                    onClick={() => increaseQuantity(item.id)}
                                                    disabled={item.quantity >= item.stock}
                                                    className="w-7 h-7 flex items-center justify-center rounded-lg border border-neutral-200 hover:border-primary-500 disabled:opacity-50 disabled:cursor-not-allowed"
                                                >
                                                    <Plus className="w-3 h-3" />
                                                </button>
                                            </div>
                                            <button
                                                onClick={() => removeItem(item.id)}
                                                className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Footer */}
                {items.length > 0 && (
                    <div className="border-t border-neutral-100 p-4 space-y-4">
                        <div className="flex items-center justify-between">
                            <span className="text-neutral-600">Subtotal</span>
                            <span className="text-lg font-bold text-neutral-800">{formatRupiah(total)}</span>
                        </div>
                        <p className="text-xs text-neutral-400">
                            Ongkos kirim dan diskon dihitung saat checkout
                        </p>
                        <div className="grid grid-cols-2 gap-3">
                            <Link href="/cart" onClick={closeCart}>
                                <Button variant="secondary" fullWidth>Lihat Keranjang</Button>
                            </Link>
                            <Link href="/checkout" onClick={closeCart}>
                                <Button variant="primary" fullWidth>Checkout</Button>
                            </Link>
                        </div>
                    </div>
                )}
            </div>
        </>
    );
}
