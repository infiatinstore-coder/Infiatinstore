'use client';

import { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

// Ramadhan 2026 Banner Data
const banners = [
    {
        id: 1,
        image: '/images/banners/banner-1.png',
        alt: '🌙 Promo Spesial Ramadhan 2026 - Kurma Premium',
        link: '/products',
        title: 'Promo Ramadhan 2026',
        subtitle: 'Kurma Premium Langsung dari Arab',
    },
    {
        id: 2,
        image: '/images/banners/banner-2.png',
        alt: 'Kurma Ajwa Madinah - Kurma Nabi',
        link: '/products?category=kurma-buah-kering',
        title: 'Kurma Ajwa Madinah',
        subtitle: 'Disunnahkan 7 butir di pagi hari',
    },
    {
        id: 3,
        image: '/images/banners/banner-3.png',
        alt: 'Kurma Sukkari Al-Qassim',
        link: '/products?category=kurma-buah-kering',
        title: 'Kurma Sukkari Raja',
        subtitle: 'Manis legit seperti karamel',
    },
    {
        id: 4,
        image: '/images/banners/banner-4.png',
        alt: 'Paket Oleh-Oleh Haji Hemat',
        link: '/products?category=paket-oleh-oleh',
        title: 'Paket Oleh-Oleh Hemat',
        subtitle: 'Mulai dari Rp 25.000/paket',
    },
];

export default function BannerCarousel() {
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isAutoPlaying, setIsAutoPlaying] = useState(true);
    const intervalRef = useRef(null);

    const goToSlide = (index) => {
        setCurrentIndex(index);
    };

    const goToPrevious = () => {
        setCurrentIndex((prev) => (prev === 0 ? banners.length - 1 : prev - 1));
    };

    const goToNext = () => {
        setCurrentIndex((prev) => (prev === banners.length - 1 ? 0 : prev + 1));
    };

    // Auto-play functionality
    useEffect(() => {
        if (isAutoPlaying) {
            intervalRef.current = setInterval(() => {
                goToNext();
            }, 4000);
        }

        return () => {
            if (intervalRef.current) {
                clearInterval(intervalRef.current);
            }
        };
    }, [isAutoPlaying, currentIndex]);

    const handleMouseEnter = () => setIsAutoPlaying(false);
    const handleMouseLeave = () => setIsAutoPlaying(true);

    return (
        <div
            className="relative w-full overflow-hidden"
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
        >
            {/* Banner Container */}
            <div
                className="flex transition-transform duration-500 ease-out"
                style={{ transform: `translateX(-${currentIndex * 100}%)` }}
            >
                {banners.map((banner) => (
                    <Link
                        key={banner.id}
                        href={banner.link}
                        className="w-full flex-shrink-0"
                    >
                        <div className="relative aspect-[3/1] md:aspect-[4/1] w-full">
                            <Image
                                src={banner.image}
                                alt={banner.alt}
                                fill
                                className="object-cover"
                                priority={banner.id === 1}
                                sizes="100vw"
                            />
                            {/* Overlay Gradient for Text Readability if needed */}
                            <div className="absolute inset-0 bg-black/10" />
                        </div>
                    </Link>
                ))}
            </div>

            {/* Navigation Arrows - Desktop only */}
            <button
                onClick={goToPrevious}
                className="hidden md:flex absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/80 backdrop-blur-sm rounded-full items-center justify-center shadow-md hover:bg-white transition-colors"
                aria-label="Previous slide"
            >
                <ChevronLeft className="w-6 h-6 text-neutral-700" />
            </button>
            <button
                onClick={goToNext}
                className="hidden md:flex absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/80 backdrop-blur-sm rounded-full items-center justify-center shadow-md hover:bg-white transition-colors"
                aria-label="Next slide"
            >
                <ChevronRight className="w-6 h-6 text-neutral-700" />
            </button>

            {/* Dots Indicator */}
            <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex items-center gap-1.5">
                {banners.map((_, index) => (
                    <button
                        key={index}
                        onClick={() => goToSlide(index)}
                        className={cn(
                            "transition-all duration-300 rounded-full",
                            currentIndex === index
                                ? "w-6 h-2 bg-white"
                                : "w-2 h-2 bg-white/50 hover:bg-white/70"
                        )}
                        aria-label={`Go to slide ${index + 1}`}
                    />
                ))}
            </div>
        </div>
    );
}
