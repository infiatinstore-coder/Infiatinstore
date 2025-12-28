'use client';

import { ShieldCheck, Lock, Truck, RefreshCw, CreditCard, Headphones } from 'lucide-react';

/**
 * Trust Badges Component
 * Displays security and trust indicators like major marketplaces
 */

export function TrustBadges({ variant = 'horizontal' }) {
    const badges = [
        {
            icon: ShieldCheck,
            title: 'Barang 100% Original',
            color: 'text-green-600',
        },
        {
            icon: Lock,
            title: 'Transaksi Aman SSL',
            color: 'text-blue-600',
        },
        {
            icon: Truck,
            title: 'Pengiriman Terpercaya',
            color: 'text-orange-600',
        },
        {
            icon: RefreshCw,
            title: 'Garansi Uang Kembali',
            color: 'text-purple-600',
        },
    ];

    if (variant === 'minimal') {
        return (
            <div className="flex items-center justify-center gap-4 py-3 bg-neutral-50 rounded-lg">
                {badges.map((badge, i) => (
                    <div key={i} className="flex items-center gap-1 text-xs text-neutral-600">
                        <badge.icon className={`w-4 h-4 ${badge.color}`} />
                        <span className="hidden sm:inline">{badge.title}</span>
                    </div>
                ))}
            </div>
        );
    }

    return (
        <div className={`grid ${variant === 'horizontal' ? 'grid-cols-2 md:grid-cols-4' : 'grid-cols-2'} gap-4`}>
            {badges.map((badge, i) => (
                <div
                    key={i}
                    className="flex flex-col items-center p-4 bg-white rounded-xl border border-neutral-100 hover:shadow-md transition-shadow"
                >
                    <div className={`p-3 rounded-full bg-neutral-50 ${badge.color}`}>
                        <badge.icon className="w-6 h-6" />
                    </div>
                    <span className="mt-2 text-sm text-center text-neutral-700 font-medium">
                        {badge.title}
                    </span>
                </div>
            ))}
        </div>
    );
}

/**
 * Security Banner for Checkout
 */
export function SecurityBanner() {
    return (
        <div className="bg-gradient-to-r from-green-50 to-blue-50 border border-green-200 rounded-lg p-4">
            <div className="flex items-center gap-3">
                <div className="p-2 bg-green-100 rounded-full">
                    <ShieldCheck className="w-6 h-6 text-green-600" />
                </div>
                <div>
                    <h4 className="font-semibold text-green-800">Transaksi Anda Dilindungi</h4>
                    <p className="text-sm text-green-700">
                        Pembayaran diproses melalui gateway terenkripsi SSL 256-bit
                    </p>
                </div>
            </div>
            <div className="mt-3 flex items-center gap-4 text-xs text-neutral-600">
                <span className="flex items-center gap-1">
                    <Lock className="w-3 h-3" /> SSL Secured
                </span>
                <span className="flex items-center gap-1">
                    <CreditCard className="w-3 h-3" /> PCI DSS Compliant
                </span>
                <span className="flex items-center gap-1">
                    <Headphones className="w-3 h-3" /> 24/7 Support
                </span>
            </div>
        </div>
    );
}

/**
 * Payment Methods Display
 */
export function PaymentMethods() {
    const methods = [
        { name: 'BCA', type: 'VA' },
        { name: 'Mandiri', type: 'VA' },
        { name: 'BNI', type: 'VA' },
        { name: 'BRI', type: 'VA' },
        { name: 'QRIS', type: 'E-Wallet' },
        { name: 'GoPay', type: 'E-Wallet' },
        { name: 'OVO', type: 'E-Wallet' },
        { name: 'ShopeePay', type: 'E-Wallet' },
    ];

    return (
        <div className="space-y-3">
            <h4 className="font-medium text-neutral-800">Metode Pembayaran</h4>
            <div className="flex flex-wrap gap-2">
                {methods.map((method, i) => (
                    <span
                        key={i}
                        className="px-3 py-1.5 bg-neutral-100 rounded-lg text-xs font-medium text-neutral-700"
                    >
                        {method.name}
                    </span>
                ))}
            </div>
            <p className="text-xs text-neutral-500">
                Pembayaran diproses oleh Midtrans - Payment Gateway Terpercaya Indonesia
            </p>
        </div>
    );
}

/**
 * Guarantee Banner
 */
export function GuaranteeBanner() {
    return (
        <div className="bg-gradient-to-r from-purple-500 to-indigo-600 text-white rounded-xl p-6">
            <div className="flex items-start gap-4">
                <div className="p-3 bg-white/20 rounded-full">
                    <ShieldCheck className="w-8 h-8" />
                </div>
                <div>
                    <h3 className="text-xl font-bold">Jaminan 100% Uang Kembali</h3>
                    <p className="mt-1 text-purple-100">
                        Belanja tanpa khawatir! Jika produk tidak sesuai, kami kembalikan uang Anda.
                    </p>
                    <ul className="mt-3 space-y-1 text-sm text-purple-100">
                        <li>✓ Pengajuan refund dalam 7 hari</li>
                        <li>✓ Proses cepat 3-5 hari kerja</li>
                        <li>✓ Tanpa ribet</li>
                    </ul>
                </div>
            </div>
        </div>
    );
}
