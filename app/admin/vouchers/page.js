'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Plus, Search, Edit, Trash2, Copy, Check, Tag } from 'lucide-react';
import { Button, Badge } from '@/components/ui';
import { formatRupiah, formatDate } from '@/lib/utils';

// Mock vouchers data
const mockVouchers = [
    {
        id: '1',
        code: 'PERTAMA',
        type: 'PERCENTAGE',
        value: 10,
        maxDiscount: 50000,
        minPurchase: 100000,
        usageLimit: 1000,
        usedCount: 234,
        validFrom: '2024-12-01T00:00:00Z',
        validUntil: '2024-12-31T23:59:59Z',
        status: 'ACTIVE',
    },
    {
        id: '2',
        code: 'GRATIS ONGKIR',
        type: 'FREE_SHIPPING',
        value: 0,
        maxDiscount: null,
        minPurchase: 200000,
        usageLimit: 500,
        usedCount: 89,
        validFrom: '2024-12-15T00:00:00Z',
        validUntil: '2025-01-15T23:59:59Z',
        status: 'ACTIVE',
    },
    {
        id: '3',
        code: 'DISKON50K',
        type: 'FIXED_AMOUNT',
        value: 50000,
        maxDiscount: null,
        minPurchase: 300000,
        usageLimit: 100,
        usedCount: 100,
        validFrom: '2024-11-01T00:00:00Z',
        validUntil: '2024-11-30T23:59:59Z',
        status: 'EXPIRED',
    },
];

const typeConfig = {
    PERCENTAGE: { label: 'Persentase', color: 'primary' },
    FIXED_AMOUNT: { label: 'Nominal', color: 'success' },
    FREE_SHIPPING: { label: 'Gratis Ongkir', color: 'secondary' },
};

const statusConfig = {
    ACTIVE: { label: 'Aktif', color: 'success' },
    INACTIVE: { label: 'Nonaktif', color: 'secondary' },
    EXPIRED: { label: 'Kadaluarsa', color: 'danger' },
};

export default function VouchersPage() {
    const [search, setSearch] = useState('');
    const [copiedId, setCopiedId] = useState(null);

    const handleCopyCode = (code, id) => {
        navigator.clipboard.writeText(code);
        setCopiedId(id);
        setTimeout(() => setCopiedId(null), 2000);
    };

    const filteredVouchers = mockVouchers.filter((voucher) =>
        voucher.code.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-display font-bold text-neutral-800">Voucher</h1>
                    <p className="text-neutral-500">Kelola voucher dan promo toko Anda</p>
                </div>
                <Link href="/admin/vouchers/new">
                    <Button>
                        <Plus className="w-4 h-4" />
                        Buat Voucher
                    </Button>
                </Link>
            </div>

            {/* Stats */}
            <div className="grid sm:grid-cols-3 gap-4">
                <div className="bg-white rounded-xl p-5 shadow-sm">
                    <p className="text-sm text-neutral-500 mb-1">Total Voucher</p>
                    <p className="text-2xl font-bold text-neutral-800">{mockVouchers.length}</p>
                </div>
                <div className="bg-white rounded-xl p-5 shadow-sm">
                    <p className="text-sm text-neutral-500 mb-1">Voucher Aktif</p>
                    <p className="text-2xl font-bold text-green-600">
                        {mockVouchers.filter(v => v.status === 'ACTIVE').length}
                    </p>
                </div>
                <div className="bg-white rounded-xl p-5 shadow-sm">
                    <p className="text-sm text-neutral-500 mb-1">Total Penggunaan</p>
                    <p className="text-2xl font-bold text-primary-500">
                        {mockVouchers.reduce((sum, v) => sum + v.usedCount, 0)}
                    </p>
                </div>
            </div>

            {/* Search */}
            <div className="bg-white rounded-xl p-4 shadow-sm">
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400" />
                    <input
                        type="text"
                        placeholder="Cari kode voucher..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-neutral-200 focus:outline-none focus:border-primary-500"
                    />
                </div>
            </div>

            {/* Vouchers Grid */}
            <div className="grid md:grid-cols-2 gap-6">
                {filteredVouchers.map((voucher) => (
                    <div key={voucher.id} className="bg-white rounded-xl shadow-sm overflow-hidden border-2 border-neutral-100">
                        {/* Header */}
                        <div className="p-5 bg-gradient-to-r from-primary-500 to-primary-600 text-white">
                            <div className="flex items-start justify-between">
                                <div className="flex items-center gap-3">
                                    <Tag className="w-6 h-6" />
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <h3 className="text-xl font-bold font-mono">{voucher.code}</h3>
                                            <button
                                                onClick={() => handleCopyCode(voucher.code, voucher.id)}
                                                className="p-1 hover:bg-white/20 rounded"
                                            >
                                                {copiedId === voucher.id ? (
                                                    <Check className="w-4 h-4" />
                                                ) : (
                                                    <Copy className="w-4 h-4" />
                                                )}
                                            </button>
                                        </div>
                                        <Badge variant="light" className="mt-1">
                                            {typeConfig[voucher.type].label}
                                        </Badge>
                                    </div>
                                </div>
                                <Badge variant={statusConfig[voucher.status].color}>
                                    {statusConfig[voucher.status].label}
                                </Badge>
                            </div>
                        </div>

                        {/* Body */}
                        <div className="p-5 space-y-4">
                            {/* Value */}
                            <div className="flex items-center justify-between">
                                <span className="text-neutral-500">Nilai Diskon</span>
                                <span className="font-bold text-primary-500">
                                    {voucher.type === 'PERCENTAGE'
                                        ? `${voucher.value}%`
                                        : voucher.type === 'FIXED_AMOUNT'
                                            ? formatRupiah(voucher.value)
                                            : 'Gratis'}
                                </span>
                            </div>

                            {voucher.maxDiscount && (
                                <div className="flex items-center justify-between">
                                    <span className="text-neutral-500">Maks Diskon</span>
                                    <span className="font-medium text-neutral-800">{formatRupiah(voucher.maxDiscount)}</span>
                                </div>
                            )}

                            <div className="flex items-center justify-between">
                                <span className="text-neutral-500">Min Pembelian</span>
                                <span className="font-medium text-neutral-800">{formatRupiah(voucher.minPurchase)}</span>
                            </div>

                            {/* Usage */}
                            <div>
                                <div className="flex items-center justify-between mb-2">
                                    <span className="text-neutral-500">Penggunaan</span>
                                    <span className="font-medium text-neutral-800">
                                        {voucher.usedCount} / {voucher.usageLimit}
                                    </span>
                                </div>
                                <div className="w-full bg-neutral-100 rounded-full h-2">
                                    <div
                                        className="bg-primary-500 h-2 rounded-full transition-all"
                                        style={{ width: `${(voucher.usedCount / voucher.usageLimit) * 100}%` }}
                                    />
                                </div>
                            </div>

                            {/* Period */}
                            <div className="pt-4 border-t border-neutral-100">
                                <p className="text-sm text-neutral-500 mb-1">Periode Berlaku</p>
                                <p className="text-sm font-medium text-neutral-800">
                                    {formatDate(voucher.validFrom, { day: 'numeric', month: 'short' })} - {formatDate(voucher.validUntil, { day: 'numeric', month: 'short', year: 'numeric' })}
                                </p>
                            </div>
                        </div>

                        {/* Actions */}
                        <div className="px-5 py-4 bg-neutral-50 flex gap-2">
                            <button className="flex items-center gap-2 px-4 py-2 text-sm text-neutral-700 hover:bg-white rounded-lg">
                                <Edit className="w-4 h-4" />
                                Edit
                            </button>
                            <button className="flex items-center gap-2 px-4 py-2 text-sm text-red-500 hover:bg-red-50 rounded-lg ml-auto">
                                <Trash2 className="w-4 h-4" />
                                Hapus
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
