'use client';

import Link from 'next/link';
import { Zap, Star, Sparkles, Gift, PackageOpen } from 'lucide-react';

const menuItems = [
    { icon: Zap, label: 'Flash Sale', href: '/flash-sale', color: 'text-red-500 bg-red-50' },
    { icon: Star, label: 'Paling Laris', href: '/products?sort=best_selling', color: 'text-orange-500 bg-orange-50' },
    { icon: Sparkles, label: 'Produk Baru', href: '/products?sort=newest', color: 'text-blue-500 bg-blue-50' },
    { icon: Gift, label: 'Paket Hemat', href: '/products?category=paket-oleh-oleh', color: 'text-purple-500 bg-purple-50' },
    { icon: PackageOpen, label: 'Semua Produk', href: '/products', color: 'text-green-500 bg-green-50' },
];

export default function QuickAccessMenu() {
    return (
        <div className="flex justify-between md:justify-around overflow-x-auto pb-2 -mx-4 px-4 md:mx-0 md:px-0 hide-scrollbar gap-4 md:gap-8 pt-2">
            {menuItems.map((item, index) => (
                <Link
                    key={index}
                    href={item.href}
                    className="flex flex-col items-center justify-start group min-w-[64px] md:min-w-[80px]"
                >
                    <div className={`w-10 h-10 md:w-12 md:h-12 ${item.color} rounded-xl flex items-center justify-center mb-1.5 shadow-sm border border-transparent group-hover:border-gray-200 group-hover:-translate-y-1 transition-all duration-300`}>
                        <item.icon className="w-5 h-5 md:w-6 md:h-6" strokeWidth={2} />
                    </div>
                    <span className="text-[10px] md:text-xs text-center font-medium text-gray-700 group-hover:text-[#EE4D2D] transition-colors leading-tight line-clamp-2 w-full max-w-[80px]">
                        {item.label}
                    </span>
                </Link>
            ))}
        </div>
    );
}
