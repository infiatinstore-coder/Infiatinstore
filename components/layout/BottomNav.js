'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import { Home, Search, Bell, User, ShoppingCart } from 'lucide-react';
import { cn } from '@/lib/utils';
import useCartStore from '@/store/cart';
import useUserStore from '@/store/user';

const navItems = [
    {
        name: 'Beranda',
        href: '/',
        icon: Home,
        exactMatch: true,
    },
    {
        name: 'Cari',
        href: '/search',
        icon: Search,
    },
    {
        name: 'Notifikasi',
        href: '/account/notifications',
        icon: Bell,
        requireAuth: true,
    },
    {
        name: 'Saya',
        href: '/account',
        icon: User,
    },
    {
        name: 'Keranjang',
        href: '/cart',
        icon: ShoppingCart,
        showBadge: true,
    },
];

export default function BottomNav() {
    const pathname = usePathname();
    const { getItemsCount } = useCartStore();
    const { isAuthenticated } = useUserStore();
    const [isMounted, setIsMounted] = useState(false);

    // Only get cart count after component mounts to avoid hydration mismatch
    const itemsCount = isMounted ? getItemsCount() : 0;

    useEffect(() => {
        setIsMounted(true);
    }, []);

    // Don't show on checkout, admin, or auth pages
    const hideOnPages = ['/checkout', '/admin', '/auth'];
    const shouldHide = hideOnPages.some(page => pathname.startsWith(page));

    if (shouldHide) return null;

    const isActive = (item) => {
        if (item.exactMatch) {
            return pathname === item.href;
        }
        return pathname.startsWith(item.href);
    };

    const getHref = (item) => {
        // If user not authenticated and requires auth, redirect to login
        if (item.requireAuth && !isAuthenticated) {
            return '/auth/login';
        }
        // If user not authenticated and going to account, redirect to login
        if (item.href === '/account' && !isAuthenticated) {
            return '/auth/login';
        }
        return item.href;
    };

    return (
        <>
            {/* Spacer to prevent content from being hidden behind bottom nav */}
            <div className="h-16 lg:hidden" />

            {/* Bottom Navigation */}
            <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-neutral-200 lg:hidden safe-area-pb">
                <div className="flex items-center justify-around h-16">
                    {navItems.map((item) => {
                        const active = isActive(item);
                        const Icon = item.icon;
                        const href = getHref(item);

                        return (
                            <Link
                                key={item.name}
                                href={href}
                                className={cn(
                                    "flex flex-col items-center justify-center flex-1 h-full relative transition-colors",
                                    active
                                        ? "text-primary-500"
                                        : "text-neutral-500 hover:text-neutral-700"
                                )}
                            >
                                <div className="relative">
                                    <Icon
                                        className={cn(
                                            "w-6 h-6 transition-transform",
                                            active && "scale-110"
                                        )}
                                        strokeWidth={active ? 2.5 : 2}
                                    />
                                    {/* Badge for cart */}
                                    {item.showBadge && itemsCount > 0 && (
                                        <span className="absolute -top-2 -right-2 min-w-[18px] h-[18px] bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center px-1">
                                            {itemsCount > 99 ? '99+' : itemsCount}
                                        </span>
                                    )}
                                    {/* Notification badge placeholder */}
                                    {item.name === 'Notifikasi' && isAuthenticated && (
                                        <span className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full" />
                                    )}
                                </div>
                                <span className={cn(
                                    "text-[10px] mt-1 font-medium",
                                    active && "font-semibold"
                                )}>
                                    {item.name}
                                </span>

                                {/* Active indicator */}
                                {active && (
                                    <div className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-0.5 bg-primary-500 rounded-full" />
                                )}
                            </Link>
                        );
                    })}
                </div>
            </nav>
        </>
    );
}
