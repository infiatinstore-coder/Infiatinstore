'use client';

import Link from 'next/link';
import { Construction, ArrowLeft, Clock } from 'lucide-react';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';

/**
 * Halaman yang ditampilkan ketika fitur di-disable oleh admin
 */
export default function FeatureDisabledPage({
    featureName = 'Fitur ini',
    description = 'sedang dalam pengembangan',
    backUrl = '/',
    backLabel = 'Kembali ke Beranda'
}) {
    return (
        <>
            <Header />
            <main className="min-h-screen bg-gradient-to-b from-neutral-50 to-neutral-100 flex items-center justify-center p-4">
                <div className="max-w-md w-full text-center">
                    {/* Icon */}
                    <div className="w-24 h-24 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-6">
                        <Construction className="w-12 h-12 text-primary-500" />
                    </div>

                    {/* Content */}
                    <h1 className="text-2xl font-bold text-neutral-800 mb-2">
                        {featureName}
                    </h1>
                    <p className="text-neutral-600 mb-6">
                        {description}
                    </p>

                    {/* Info Box */}
                    <div className="bg-white rounded-xl p-4 shadow-sm mb-6">
                        <div className="flex items-center justify-center gap-2 text-primary-600">
                            <Clock className="w-5 h-5" />
                            <span className="font-medium">Segera Hadir!</span>
                        </div>
                        <p className="text-sm text-neutral-500 mt-2">
                            Kami sedang menyiapkan fitur terbaik untuk Anda.
                            Silakan cek kembali nanti.
                        </p>
                    </div>

                    {/* Back Button */}
                    <Link
                        href={backUrl}
                        className="inline-flex items-center gap-2 px-6 py-3 bg-primary-500 text-white rounded-lg font-medium hover:bg-primary-600 transition-colors"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        {backLabel}
                    </Link>
                </div>
            </main>
            <Footer />
        </>
    );
}

/**
 * Wrapper component untuk cek feature flag
 */
export function FeatureGate({
    featureKey,
    featureFlags,
    children,
    featureName,
    backUrl = '/account',
    backLabel = 'Kembali'
}) {
    // Jika flags belum loaded, tampilkan loading
    if (!featureFlags) {
        return (
            <>
                <Header />
                <main className="min-h-screen bg-neutral-50 flex items-center justify-center">
                    <div className="animate-spin w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full" />
                </main>
                <Footer />
            </>
        );
    }

    // Jika fitur disabled, tampilkan halaman disabled
    if (!featureFlags[featureKey]) {
        return (
            <FeatureDisabledPage
                featureName={featureName || 'Fitur ini'}
                description="sedang dalam tahap pengembangan dan akan segera tersedia."
                backUrl={backUrl}
                backLabel={backLabel}
            />
        );
    }

    // Jika enabled, render children
    return children;
}
