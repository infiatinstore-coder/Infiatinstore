'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Search, Filter, Eye, ChevronLeft, ChevronRight, Download } from 'lucide-react';
import { formatRupiah, formatDate } from '@/lib/utils';
import { Button, Badge } from '@/components/ui';

// Mock orders data
const mockOrders = [
    {
        id: '1',
        orderNumber: 'INV-241216-ABC123',
        customer: { name: 'Budi Santoso', email: 'budi@email.com' },
        items: 3,
        total: 345000,
        status: 'PENDING_PAYMENT',
        paymentMethod: 'Bank BCA',
        createdAt: '2024-12-16T10:30:00Z',
    },
    {
        id: '2',
        orderNumber: 'INV-241216-DEF456',
        customer: { name: 'Siti Aminah', email: 'siti@email.com' },
        items: 2,
        total: 189000,
        status: 'PAID',
        paymentMethod: 'GoPay',
        createdAt: '2024-12-16T09:15:00Z',
    },
    {
        id: '3',
        orderNumber: 'INV-241216-GHI789',
        customer: { name: 'Ahmad Wijaya', email: 'ahmad@email.com' },
        items: 5,
        total: 567000,
        status: 'PROCESSING',
        paymentMethod: 'QRIS',
        createdAt: '2024-12-16T08:00:00Z',
    },
    {
        id: '4',
        orderNumber: 'INV-241215-JKL012',
        customer: { name: 'Dewi Lestari', email: 'dewi@email.com' },
        items: 1,
        total: 234000,
        status: 'SHIPPED',
        paymentMethod: 'Bank Mandiri',
        createdAt: '2024-12-15T16:45:00Z',
    },
    {
        id: '5',
        orderNumber: 'INV-241215-MNO345',
        customer: { name: 'Rudi Hartono', email: 'rudi@email.com' },
        items: 4,
        total: 412000,
        status: 'DELIVERED',
        paymentMethod: 'OVO',
        createdAt: '2024-12-15T14:20:00Z',
    },
];

const statusConfig = {
    PENDING_PAYMENT: { label: 'Menunggu Bayar', color: 'warning' },
    PAID: { label: 'Dibayar', color: 'primary' },
    PROCESSING: { label: 'Diproses', color: 'primary' },
    SHIPPED: { label: 'Dikirim', color: 'primary' },
    DELIVERED: { label: 'Diterima', color: 'success' },
    COMPLETED: { label: 'Selesai', color: 'success' },
    CANCELLED: { label: 'Dibatalkan', color: 'danger' },
    REFUNDED: { label: 'Refund', color: 'danger' },
};

const statusFilters = [
    { value: '', label: 'Semua Status' },
    { value: 'PENDING_PAYMENT', label: 'Menunggu Bayar' },
    { value: 'PAID', label: 'Dibayar' },
    { value: 'PROCESSING', label: 'Diproses' },
    { value: 'SHIPPED', label: 'Dikirim' },
    { value: 'DELIVERED', label: 'Diterima' },
    { value: 'COMPLETED', label: 'Selesai' },
    { value: 'CANCELLED', label: 'Dibatalkan' },
];

export default function OrdersPage() {
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState('');
    const [page, setPage] = useState(1);

    const filteredOrders = mockOrders.filter((order) => {
        const matchesSearch = order.orderNumber.toLowerCase().includes(search.toLowerCase()) ||
            order.customer.name.toLowerCase().includes(search.toLowerCase());
        const matchesStatus = !statusFilter || order.status === statusFilter;
        return matchesSearch && matchesStatus;
    });

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-display font-bold text-neutral-800">Pesanan</h1>
                    <p className="text-neutral-500">Kelola semua pesanan pelanggan</p>
                </div>
                <Button variant="secondary">
                    <Download className="w-4 h-4" />
                    Export
                </Button>
            </div>

            {/* Filters */}
            <div className="bg-white rounded-xl p-4 shadow-sm">
                <div className="flex flex-col sm:flex-row gap-4">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400" />
                        <input
                            type="text"
                            placeholder="Cari nomor pesanan atau nama..."
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
                        {statusFilters.map((filter) => (
                            <option key={filter.value} value={filter.value}>
                                {filter.label}
                            </option>
                        ))}
                    </select>
                </div>
            </div>

            {/* Orders Table */}
            <div className="bg-white rounded-xl shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-neutral-50 border-b border-neutral-100">
                            <tr>
                                <th className="px-4 py-3 text-left text-sm font-semibold text-neutral-600">No. Pesanan</th>
                                <th className="px-4 py-3 text-left text-sm font-semibold text-neutral-600">Pelanggan</th>
                                <th className="px-4 py-3 text-left text-sm font-semibold text-neutral-600">Items</th>
                                <th className="px-4 py-3 text-left text-sm font-semibold text-neutral-600">Total</th>
                                <th className="px-4 py-3 text-left text-sm font-semibold text-neutral-600">Status</th>
                                <th className="px-4 py-3 text-left text-sm font-semibold text-neutral-600">Tanggal</th>
                                <th className="px-4 py-3 text-center text-sm font-semibold text-neutral-600">Aksi</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-neutral-100">
                            {filteredOrders.map((order) => (
                                <tr key={order.id} className="hover:bg-neutral-50">
                                    <td className="px-4 py-4">
                                        <Link href={`/admin/orders/${order.id}`} className="font-medium text-primary-500 hover:underline">
                                            {order.orderNumber}
                                        </Link>
                                    </td>
                                    <td className="px-4 py-4">
                                        <p className="font-medium text-neutral-800">{order.customer.name}</p>
                                        <p className="text-sm text-neutral-500">{order.customer.email}</p>
                                    </td>
                                    <td className="px-4 py-4 text-neutral-600">{order.items} item</td>
                                    <td className="px-4 py-4 font-semibold text-neutral-800">{formatRupiah(order.total)}</td>
                                    <td className="px-4 py-4">
                                        <Badge variant={statusConfig[order.status].color}>
                                            {statusConfig[order.status].label}
                                        </Badge>
                                    </td>
                                    <td className="px-4 py-4 text-neutral-600">
                                        {formatDate(order.createdAt, { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                                    </td>
                                    <td className="px-4 py-4 text-center">
                                        <Link
                                            href={`/admin/orders/${order.id}`}
                                            className="inline-flex items-center gap-1 px-3 py-1.5 text-sm text-primary-500 hover:bg-primary-50 rounded-lg"
                                        >
                                            <Eye className="w-4 h-4" />
                                            Detail
                                        </Link>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                <div className="px-4 py-4 border-t border-neutral-100 flex items-center justify-between">
                    <p className="text-sm text-neutral-500">
                        Menampilkan {filteredOrders.length} pesanan
                    </p>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => setPage(p => Math.max(1, p - 1))}
                            disabled={page === 1}
                            className="p-2 rounded-lg border border-neutral-200 hover:bg-neutral-50 disabled:opacity-50"
                        >
                            <ChevronLeft className="w-4 h-4" />
                        </button>
                        <span className="px-4 py-2 text-sm font-medium">Page {page}</span>
                        <button
                            onClick={() => setPage(p => p + 1)}
                            className="p-2 rounded-lg border border-neutral-200 hover:bg-neutral-50"
                        >
                            <ChevronRight className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
