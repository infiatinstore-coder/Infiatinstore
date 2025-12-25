'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Search, ShoppingCart, User, Menu, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import useCartStore from '@/store/cart';
import useUserStore from '@/store/user';
import { categories } from '@/data/categories';

export default function Header({ variant = 'default', title = '', showBack = false }) {
    const router = useRouter();
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [isScrolled, setIsScrolled] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');

    // Zustand selectors - more stable for SSR/hydration
    const toggleCart = useCartStore((state) => state.toggleCart);
    const openCart = useCartStore((state) => state.openCart);
    const items = useCartStore((state) => state.items);
    const itemsCount = items.reduce((count, item) => count + item.quantity, 0);

    const { isAuthenticated, user } = useUserStore();

    useEffect(() => {
        const handleScroll = () => {
            setIsScrolled(window.scrollY > 0);
        };
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    const handleSearch = (e) => {
        e.preventDefault();
        if (searchQuery.trim()) {
            router.push(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
        }
    };

    if (variant === 'default') {
        return (
            <header className={cn(
                "sticky top-0 z-50 w-full transition-all duration-200 bg-gradient-to-r from-[#EE4D2D] to-[#FF7337]",
                isScrolled ? "shadow-md py-2" : "py-3 md:py-4"
            )}>
                <div className="container-app flex items-center gap-4 px-4 md:px-0 justify-between">

                    {/* Mobile Menu Toggle */}
                    <button
                        className="md:hidden text-white"
                        onClick={() => setIsMenuOpen(true)}
                    >
                        <Menu className="w-6 h-6" />
                    </button>

                    {/* LOGO */}
                    <Link href="/" className="flex items-center gap-2 flex-shrink-0 group">
                        <div className="relative w-10 h-10 md:w-12 md:h-12 bg-white rounded-lg flex items-center justify-center shadow-lg overflow-hidden p-1">
                            <img src="/logo-infiatin.png" alt="Infiatin Store" className="w-full h-full object-contain" />
                        </div>
                        <div className="flex flex-col text-white leading-none">
                            <span className="font-display font-bold text-lg md:text-2xl tracking-tight">Infiatin Store</span>
                        </div>
                    </Link>

                    {/* SEARCH BAR (Functional) */}
                    <div className="flex-1 max-w-2xl hidden md:block">
                        <form onSubmit={handleSearch} className="bg-white p-1 rounded-sm shadow-sm flex items-center">
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder="Cari produk..."
                                className="flex-1 px-4 py-2 outline-none text-sm text-gray-700 placeholder:text-gray-400"
                            />
                            <button
                                type="submit"
                                className="bg-[#EE4D2D] px-6 py-2 rounded-sm hover:opacity-90 transition-opacity"
                            >
                                <Search className="w-5 h-5 text-white" />
                            </button>
                        </form>
                    </div>

                    {/* RIGHT ACTIONS (Cart & Auth Only) */}
                    <div className="flex items-center gap-3 md:gap-6">
                        {/* Cart */}
                        <button
                            onClick={toggleCart}
                            className="text-white hover:opacity-90 transition-opacity relative p-1"
                        >
                            <ShoppingCart className="w-6 h-6" />
                            {itemsCount > 0 && (
                                <span className="absolute -top-1 -right-1 bg-white text-[#EE4D2D] text-[10px] font-bold px-1.5 py-0.5 rounded-full border border-[#EE4D2D]">
                                    {itemsCount}
                                </span>
                            )}
                        </button>

                        {/* Auth / Profile (Only real links) */}
                        <div className="hidden md:flex items-center gap-3 text-sm font-medium text-white">
                            {isAuthenticated ? (
                                <Link href="/account" className="flex items-center gap-2 hover:opacity-90">
                                    <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
                                        <User className="w-4 h-4" />
                                    </div>
                                    <span>{user?.name?.split(' ')[0] || 'Akun'}</span>
                                </Link>
                            ) : (
                                <>
                                    <Link href="/auth/register" className="hover:opacity-90">Daftar</Link>
                                    <span className="h-4 w-[1px] bg-white/40"></span>
                                    <Link href="/auth/login" className="hover:opacity-90">Log In</Link>
                                </>
                            )}
                        </div>
                    </div>
                </div>

                {/* Mobile Search Bar */}
                <div className="md:hidden px-4 mt-3">
                    <form onSubmit={handleSearch} className="bg-white p-1.5 rounded-sm flex items-center shadow-inner">
                        <Search className="w-4 h-4 text-gray-400 ml-2" />
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="flex-1 px-3 py-1 outline-none text-sm"
                            placeholder="Cari produk..."
                        />
                    </form>
                </div>

                {/* Mobile Drawer (Clean Links Only) */}
                {isMenuOpen && (
                    <div className="fixed inset-0 z-[100] md:hidden">
                        <div className="absolute inset-0 bg-black/50" onClick={() => setIsMenuOpen(false)}></div>
                        <div className="absolute top-0 left-0 w-[80%] max-w-[300px] h-full bg-white shadow-xl flex flex-col">
                            <div className="p-4 bg-[#EE4D2D] text-white flex justify-between items-center">
                                <span className="font-bold text-lg">Menu</span>
                                <button onClick={() => setIsMenuOpen(false)}><X className="w-6 h-6" /></button>
                            </div>
                            <div className="flex-1 overflow-y-auto py-2">
                                <Link href="/" onClick={() => setIsMenuOpen(false)} className="block px-4 py-3 border-b border-gray-100 font-medium text-gray-700">Beranda</Link>
                                <Link href="/products" onClick={() => setIsMenuOpen(false)} className="block px-4 py-3 border-b border-gray-100 font-medium text-gray-700">Semua Produk</Link>
                                <div className="px-4 py-3 bg-gray-50 text-xs font-bold text-gray-400 uppercase">Kategori</div>
                                {categories.map(cat => (
                                    <Link key={cat.id} href={`/products?category=${cat.slug}`} onClick={() => setIsMenuOpen(false)} className="block px-6 py-2.5 text-sm text-gray-600 hover:text-[#EE4D2D]">
                                        {cat.name}
                                    </Link>
                                ))}
                            </div>
                            {/* Mobile Auth Bottom */}
                            {!isAuthenticated && (
                                <div className="p-4 border-t border-gray-100 flex gap-3">
                                    <Link href="/auth/login" className="flex-1 py-2 text-center border border-gray-300 rounded text-sm font-medium text-gray-700">Login</Link>
                                    <Link href="/auth/register" className="flex-1 py-2 text-center bg-[#EE4D2D] text-white rounded text-sm font-medium">Daftar</Link>
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </header>
        );
    }
    return null;
}
