'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Search, Filter, Eye, Mail, Phone, Calendar, ChevronLeft, ChevronRight } from 'lucide-react';
import { formatDate } from '@/lib/utils';
import { Badge } from '@/components/ui';

// Mock customers data
const mockCustomers = [
    {
        id: '1',
        name: 'Budi Santoso',
        email: 'budi@email.com',
        phone: '081234567890',
        totalOrders: 12,
        totalSpent: 4560000,
        status: 'ACTIVE',
        joinedAt: '2024-01-15T10:30:00Z',
        lastOrder: '2024-12-16T10:30:00Z',
    },
    {
        id: '2',
        name: 'Siti Aminah',
        email: 'siti@email.com',
        phone: '081234567891',
        totalOrders: 8,
        totalSpent: 2340000,
        status: 'ACTIVE',
        joinedAt: '2024-02-20T14:20:00Z',
        lastOrder: '2024-12-15T09:15:00Z',
    },
    {
        id: '3',
        name: 'Ahmad Wijaya',
        email: 'ahmad@email.com',
        phone: '081234567892',
        totalOrders: 3,
        totalSpent: 890000,
        status: 'ACTIVE',
        joinedAt: '2024-11-05T16:45:00Z',
        lastOrder: '2024-12-10T14:20:00Z',
    },
    {
        id: '4',
        name: 'Dewi Lestari',
        email: 'dewi@email.com',
        phone: '081234567893',
        totalOrders: 0,
        totalSpent: 0,
        status: 'SUSPENDED',
        joinedAt: '2024-12-01T09:00:00Z',
        lastOrder: null,
    },
];

const statusConfig = {
    ACTIVE: { label: 'Aktif', color: 'success' },
    SUSPENDED: { label: 'Suspend', color: 'danger' },
};

export default function CustomersPage() {
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState('');
    const [page, setPage] = useState(1);

    const filteredCustomers = mockCustomers.filter((customer) => {
        const matchesSearch = customer.name.toLowerCase().includes(search.toLowerCase()) ||
            customer.email.toLowerCase().includes(search.toLowerCase());
        const matchesStatus = !statusFilter || customer.status === statusFilter;
        return matchesSearch && matchesStatus;
    });

    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-display font-bold text-neutral-800">Pelanggan</h1>
                <p className="text-neutral-500">Kelola data pelanggan toko Anda</p>
            </div>

            {/* Stats Cards */}
            <div className="grid sm:grid-cols-3 gap-4">
                <div className="bg-white rounded-xl p-5 shadow-sm">
                    <p className="text-sm text-neutral-500 mb-1">Total Pelanggan</p>
                    <p className="text-2xl font-bold text-neutral-800">{mockCustomers.length}</p>
                </div>
                <div className="bg-white rounded-xl p-5 shadow-sm">
                    <p className="text-sm text-neutral-500 mb-1">Pelanggan Aktif</p>
                    <p className="text-2xl font-bold text-green-600">
                        {mockCustomers.filter(c => c.status === 'ACTIVE').length}
                    </p>
                </div>
                <div className="bg-white rounded-xl p-5 shadow-sm">
                    <p className="text-sm text-neutral-500 mb-1">New This Month</p>
                    <p className="text-2xl font-bold text-primary-500">12</p>
                </div>
            </div>

            {/* Filters */}
            <div className="bg-white rounded-xl p-4 shadow-sm">
                <div className="flex flex-col sm:flex-row gap-4">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400" />
                        <input
                            type="text"
                            placeholder="Cari nama atau email..."
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
                        <option value="ACTIVE">Aktif</option>
                        <option value="SUSPENDED">Suspend</option>
                    </select>
                </div>
            </div>

            {/* Customers Table */}
            <div className="bg-white rounded-xl shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-neutral-50 border-b border-neutral-100">
                            <tr>
                                <th className="px-4 py-3 text-left text-sm font-semibold text-neutral-600">Pelanggan</th>
                                <th className="px-4 py-3 text-left text-sm font-semibold text-neutral-600">Kontak</th>
                                <th className="px-4 py-3 text-left text-sm font-semibold text-neutral-600">Total Pesanan</th>
                                <th className="px-4 py-3 text-left text-sm font-semibold text-neutral-600">Total Belanja</th>
                                <th className="px-4 py-3 text-left text-sm font-semibold text-neutral-600">Status</th>
                                <th className="px-4 py-3 text-left text-sm font-semibold text-neutral-600">Bergabung</th>
                                <th className="px-4 py-3 text-center text-sm font-semibold text-neutral-600">Aksi</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-neutral-100">
                            {filteredCustomers.map((customer) => (
                                <tr key={customer.id} className="hover:bg-neutral-50">
                                    <td className="px-4 py-4">
                                        <p className="font-medium text-neutral-800">{customer.name}</p>
                                    </td>
                                    <td className="px-4 py-4">
                                        <div className="space-y-1">
                                            <p className="text-sm text-neutral-600 flex items-center gap-1">
                                                <Mail className="w-3 h-3" />
                                                {customer.email}
                                            </p>
                                            <p className="text-sm text-neutral-600 flex items-center gap-1">
                                                <Phone className="w-3 h-3" />
                                                {customer.phone}
                                            </p>
                                        </div>
                                    </td>
                                    <td className="px-4 py-4 text-neutral-600">{customer.totalOrders}</td>
                                    <td className="px-4 py-4 font-semibold text-neutral-800">
                                        Rp{customer.totalSpent.toLocaleString('id-ID')}
                                    </td>
                                    <td className="px-4 py-4">
                                        <Badge variant={statusConfig[customer.status].color}>
                                            {statusConfig[customer.status].label}
                                        </Badge>
                                    </td>
                                    <td className="px-4 py-4 text-sm text-neutral-500">
                                        {formatDate(customer.joinedAt, { day: 'numeric', month: 'short', year: 'numeric' })}
                                    </td>
                                    <td className="px-4 py-4 text-center">
                                        <button className="inline-flex items-center gap-1 px-3 py-1.5 text-sm text-primary-500 hover:bg-primary-50 rounded-lg">
                                            <Eye className="w-4 h-4" />
                                            Detail
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                <div className="px-4 py-4 border-t border-neutral-100 flex items-center justify-between">
                    <p className="text-sm text-neutral-500">
                        Menampilkan {filteredCustomers.length} pelanggan
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
