'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Search, Eye, Check, X, AlertCircle } from 'lucide-react';
import { Button, Badge } from '@/components/ui';
import { formatRupiah, formatDate } from '@/lib/utils';

// Mock refunds data
const mockRefunds = [
    {
        id: '1',
        orderNumber: 'INV-241215-ABC123',
        customer: { name: 'Budi Santoso', email: 'budi@email.com' },
        product: {
            name: 'Serum Vitamin C Brightening',
            image: 'https://images.unsplash.com/photo-1620916566398-39f1143ab7be?w=200',
            quantity: 2,
        },
        type: 'PRODUCT_ISSUE',
        reason: 'Produk rusak saat diterima',
        amount: 298000,
        status: 'PENDING',
        requestedAt: '2024-12-16T10:30:00Z',
        evidence: ['image1.jpg', 'image2.jpg'],
    },
    {
        id: '2',
        orderNumber: 'INV-241214-DEF456',
        customer: { name: 'Siti Aminah', email: 'siti@email.com' },
        product: {
            name: 'Moisturizer Hydrating Gel',
            image: 'https://images.unsplash.com/photo-1611930022073-b7a4ba5fcccd?w=200',
            quantity: 1,
        },
        type: 'WRONG_ITEM',
        reason: 'Produk yang dikirim tidak sesuai pesanan',
        amount: 145000,
        status: 'APPROVED',
        requestedAt: '2024-12-14T14:20:00Z',
        approvedAt: '2024-12-15T09:00:00Z',
        evidence: ['image3.jpg'],
    },
    {
        id: '3',
        orderNumber: 'INV-241213-GHI789',
        customer: { name: 'Ahmad Wijaya', email: 'ahmad@email.com' },
        product: {
            name: 'Sunscreen SPF 50+',
            image: 'https://images.unsplash.com/photo-1556228578-0d85b1a4d571?w=200',
            quantity: 1,
        },
        type: 'CHANGED_MIND',
        reason: 'Berubah pikiran, tidak jadi mau beli',
        amount: 159000,
        status: 'REJECTED',
        requestedAt: '2024-12-13T16:45:00Z',
        rejectedAt: '2024-12-14T10:00:00Z',
        rejectionNote: 'Alasan tidak valid untuk refund',
        evidence: [],
    },
];

const typeConfig = {
    PRODUCT_ISSUE: { label: 'Produk Bermasalah', icon: AlertCircle },
    WRONG_ITEM: { label: 'Barang Salah', icon: AlertCircle },
    NOT_RECEIVED: { label: 'Tidak Diterima', icon: AlertCircle },
    CHANGED_MIND: { label: 'Berubah Pikiran', icon: AlertCircle },
};

const statusConfig = {
    PENDING: { label: 'Menunggu Review', color: 'warning' },
    APPROVED: { label: 'Disetujui', color: 'success' },
    REJECTED: { label: 'Ditolak', color: 'danger' },
    PROCESSED: { label: 'Diproses', color: 'primary' },
    COMPLETED: { label: 'Selesai', color: 'success' },
};

export default function RefundsPage() {
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState('');

    const filteredRefunds = mockRefunds.filter((refund) => {
        const matchesSearch = refund.orderNumber.toLowerCase().includes(search.toLowerCase()) ||
            refund.customer.name.toLowerCase().includes(search.toLowerCase());
        const matchesStatus = !statusFilter || refund.status === statusFilter;
        return matchesSearch && matchesStatus;
    });

    const handleApprove = (id) => {
        alert(`Refund ${id} disetujui`);
    };

    const handleReject = (id) => {
        const reason = prompt('Alasan penolakan:');
        if (reason) {
            alert(`Refund ${id} ditolak dengan alasan: ${reason}`);
        }
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-display font-bold text-neutral-800">Refund</h1>
                <p className="text-neutral-500">Kelola permintaan refund pelanggan</p>
            </div>

            {/* Stats */}
            <div className="grid sm:grid-cols-4 gap-4">
                <div className="bg-white rounded-xl p-5 shadow-sm">
                    <p className="text-sm text-neutral-500 mb-1">Total Refund</p>
                    <p className="text-2xl font-bold text-neutral-800">{mockRefunds.length}</p>
                </div>
                <div className="bg-white rounded-xl p-5 shadow-sm">
                    <p className="text-sm text-neutral-500 mb-1">Menunggu</p>
                    <p className="text-2xl font-bold text-amber-600">
                        {mockRefunds.filter(r => r.status === 'PENDING').length}
                    </p>
                </div>
                <div className="bg-white rounded-xl p-5 shadow-sm">
                    <p className="text-sm text-neutral-500 mb-1">Disetujui</p>
                    <p className="text-2xl font-bold text-green-600">
                        {mockRefunds.filter(r => r.status === 'APPROVED').length}
                    </p>
                </div>
                <div className="bg-white rounded-xl p-5 shadow-sm">
                    <p className="text-sm text-neutral-500 mb-1">Ditolak</p>
                    <p className="text-2xl font-bold text-red-600">
                        {mockRefunds.filter(r => r.status === 'REJECTED').length}
                    </p>
                </div>
            </div>

            {/* Filters */}
            <div className="bg-white rounded-xl p-4 shadow-sm">
                <div className="flex flex-col sm:flex-row gap-4">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400" />
                        <input
                            type="text"
                            placeholder="Cari nomor order atau nama..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-neutral-200 focus:outline-none focus:border-primary-500"
                        />
                    </div>
                    <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        className="px-4 py-2.5 rounded-lg border border-neutral-200 focus:outline-none focus:border-primary-500"
                    >
                        <option value="">Semua Status</option>
                        <option value="PENDING">Menunggu</option>
                        <option value="APPROVED">Disetujui</option>
                        <option value="REJECTED">Ditolak</option>
                    </select>
                </div>
            </div>

            {/* Refunds List */}
            <div className="space-y-4">
                {filteredRefunds.map((refund) => {
                    const TypeIcon = typeConfig[refund.type].icon;
                    return (
                        <div key={refund.id} className="bg-white rounded-xl shadow-sm overflow-hidden">
                            {/* Header */}
                            <div className="p-5 border-b border-neutral-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                                <div>
                                    <div className="flex items-center gap-2 mb-1">
                                        <Link href={`/admin/orders/${refund.id}`} className="font-semibold text-primary-500 hover:underline">
                                            {refund.orderNumber}
                                        </Link>
                                        <Badge variant={statusConfig[refund.status].color}>
                                            {statusConfig[refund.status].label}
                                        </Badge>
                                    </div>
                                    <p className="text-sm text-neutral-500">
                                        {refund.customer.name} • {formatDate(refund.requestedAt, { day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' })}
                                    </p>
                                </div>
                                <p className="text-lg font-bold text-primary-500">{formatRupiah(refund.amount)}</p>
                            </div>

                            {/* Body */}
                            <div className="p-5">
                                <div className="flex gap-4 mb-4">
                                    <div className="relative w-16 h-16 rounded-lg overflow-hidden bg-neutral-100 flex-shrink-0">
                                        <Image src={refund.product.image} alt={refund.product.name} fill className="object-cover" />
                                    </div>
                                    <div className="flex-1">
                                        <p className="font-medium text-neutral-800">{refund.product.name}</p>
                                        <p className="text-sm text-neutral-500">{refund.product.quantity} item</p>
                                    </div>
                                </div>

                                <div className="bg-neutral-50 rounded-xl p-4 mb-4">
                                    <div className="flex items-center gap-2 mb-2">
                                        <TypeIcon className="w-5 h-5 text-neutral-600" />
                                        <span className="font-medium text-neutral-700">{typeConfig[refund.type].label}</span>
                                    </div>
                                    <p className="text-neutral-600">{refund.reason}</p>
                                </div>

                                {refund.evidence.length > 0 && (
                                    <div className="mb-4">
                                        <p className="text-sm font-medium text-neutral-700 mb-2">Bukti ({refund.evidence.length} foto)</p>
                                        <div className="flex gap-2">
                                            {refund.evidence.map((img, i) => (
                                                <div key={i} className="w-16 h-16 bg-neutral-100 rounded-lg" />
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {refund.status === 'REJECTED' && refund.rejectionNote && (
                                    <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-4">
                                        <p className="text-sm font-medium text-red-800 mb-1">Alasan Penolakan:</p>
                                        <p className="text-red-700">{refund.rejectionNote}</p>
                                    </div>
                                )}

                                {refund.status === 'PENDING' && (
                                    <div className="flex gap-3">
                                        <Button variant="success" onClick={() => handleApprove(refund.id)}>
                                            <Check className="w-4 h-4" />
                                            Setujui Refund
                                        </Button>
                                        <Button variant="danger" onClick={() => handleReject(refund.id)}>
                                            <X className="w-4 h-4" />
                                            Tolak
                                        </Button>
                                        <Link href={`/admin/orders/${refund.id}`} className="ml-auto">
                                            <Button variant="secondary">
                                                <Eye className="w-4 h-4" />
                                                Lihat Order
                                            </Button>
                                        </Link>
                                    </div>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>

            {filteredRefunds.length === 0 && (
                <div className="bg-white rounded-xl shadow-sm p-12 text-center">
                    <AlertCircle className="w-16 h-16 text-neutral-300 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-neutral-800 mb-2">Tidak ada refund</h3>
                    <p className="text-neutral-500">Belum ada permintaan refund yang perlu direview</p>
                </div>
            )}
        </div>
    );
}
