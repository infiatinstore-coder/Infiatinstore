'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import * as LucideIcons from 'lucide-react';
import { RefreshCw } from 'lucide-react';

// Helper to get icon component dynamically
const getIconComponent = (iconName) => {
    const Icon = LucideIcons[iconName];
    return Icon ? Icon : LucideIcons.Package; // Default fallback
};

export default function CategoryIconGrid() {
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchCategories = async () => {
            try {
                const res = await fetch('/api/categories');
                const data = await res.json();
                setCategories(data.categories || []);
            } catch (error) {
                console.error('Error fetching categories:', error);
            } finally {
                setLoading(false);
            }
        };
        fetchCategories();
    }, []);

    if (loading) {
        return (
            <div className="flex items-center justify-center py-8">
                <RefreshCw className="w-6 h-6 text-primary-500 animate-spin" />
            </div>
        );
    }

    const displayCategories = categories.slice(0, 10);

    return (
        <div className="grid grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-2 md:gap-4 mt-2">
            {displayCategories.map((category) => {
                const IconComponent = getIconComponent(category.icon);

                return (
                    <Link
                        key={category.id}
                        href={`/products?category=${category.slug}`}
                        className="flex flex-col items-center group cursor-pointer gap-2"
                    >
                        {/* Box Icon - Style Shopee: Square with minimal border */}
                        <div className="w-12 h-12 md:w-16 md:h-16 bg-white border border-gray-200 rounded-lg flex items-center justify-center group-hover:border-primary-500 transition-all duration-200 relative">
                            <IconComponent
                                className="w-6 h-6 md:w-8 md:h-8 text-gray-500 group-hover:text-primary-500 transition-colors duration-300"
                                strokeWidth={1.5}
                            />
                        </div>

                        {/* Text Label */}
                        <span className="text-[10px] md:text-xs text-center text-gray-600 font-medium group-hover:text-primary-600 leading-tight max-w-[80px] line-clamp-2 transition-colors">
                            {category.name}
                        </span>
                    </Link>
                );
            })}
        </div>
    );
}
