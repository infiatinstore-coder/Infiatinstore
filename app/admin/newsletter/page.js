'use client';

import { useState } from 'react';
import { Search, Mail, Download, Trash2, X } from 'lucide-react';
import { Button, Badge } from '@/components/ui';
import { formatDate } from '@/lib/utils';

// Mock newsletter subscribers data
const mockSubscribers = [
    {
        id: '1',
        email: 'customer1@email.com',
        name: 'Budi Santoso',
        status: 'ACTIVE',
        subscribedAt: '2024-12-01T10:30:00Z',
    },
    {
        id: '2',
        email: 'customer2@email.com',
        name: 'Siti Aminah',
        status: 'ACTIVE',
        subscribedAt: '2024-12-10T14:20:00Z',
    },
    {
        id: '3',
        email: 'customer3@email.com',
        name: null,
        status: 'ACTIVE',
        subscribedAt: '2024-12-15T09:15:00Z',
    },
    {
        id: '4',
        email: 'unsubscribed@email.com',
        name: 'Ahmad Wijaya',
        status: 'UNSUBSCRIBED',
        subscribedAt: '2024-11-20T16:45:00Z',
        unsubscribedAt: '2024-12-10T10:00:00Z',
    },
];

const statusConfig = {
    ACTIVE: { label: 'Aktif', color: 'success' },
    UNSUBSCRIBED: { label: 'Unsubscribed', color: 'secondary' },
};

export default function NewsletterPage() {
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState('');

    const filteredSubscribers = mockSubscribers.filter((sub) => {
        const matchesSearch = sub.email.toLowerCase().includes(search.toLowerCase()) ||
            (sub.name && sub.name.toLowerCase().includes(search.toLowerCase()));
        const matchesStatus = !statusFilter || sub.status === statusFilter;
        return matchesSearch && matchesStatus;
    });

    const handleExport = () => {
        const activeEmails = mockSubscribers
            .filter(s => s.status === 'ACTIVE')
            .map(s => s.email)
            .join('\n');

        const blob = new Blob([activeEmails], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `newsletter-subscribers-${new Date().toISOString().split('T')[0]}.txt`;
        a.click();
    };

    const handleDelete = (id) => {
        if (confirm('Yakin ingin menghapus subscriber ini?')) {
            alert(`Subscriber ${id} dihapus`);
        }
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-display font-bold text-neutral-800">Newsletter Subscribers</h1>
                    <p className="text-neutral-500">Kelola subscribers newsletter</p>
                </div>
                <Button onClick={handleExport}>
                    <Download className="w-4 h-4" />
                    Export Email
                </Button>
            </div>

            {/* Stats */}
            <div className="grid sm:grid-cols-3 gap-4">
                <div className="bg-white rounded-xl p-5 shadow-sm">
                    <p className="text-sm text-neutral-500 mb-1">Total Subscribers</p>
                    <p className="text-2xl font-bold text-neutral-800">{mockSubscribers.length}</p>
                </div>
                <div className="bg-white rounded-xl p-5 shadow-sm">
                    <p className="text-sm text-neutral-500 mb-1">Active</p>
                    <p className="text-2xl font-bold text-green-600">
                        {mockSubscribers.filter(s => s.status === 'ACTIVE').length}
                    </p>
                </div>
                <div className="bg-white rounded-xl p-5 shadow-sm">
                    <p className="text-sm text-neutral-500 mb-1">Unsubscribed</p>
                    <p className="text-2xl font-bold text-neutral-500">
                        {mockSubscribers.filter(s => s.status === 'UNSUBSCRIBED').length}
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
                            placeholder="Cari email atau nama..."
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
                        <option value="UNSUBSCRIBED">Unsubscribed</option>
                    </select>
                </div>
            </div>

            {/* Subscribers Table */}
            <div className="bg-white rounded-xl shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-neutral-50 border-b border-neutral-100">
                            <tr>
                                <th className="px-4 py-3 text-left text-sm font-semibold text-neutral-600">Email</th>
                                <th className="px-4 py-3 text-left text-sm font-semibold text-neutral-600">Nama</th>
                                <th className="px-4 py-3 text-left text-sm font-semibold text-neutral-600">Status</th>
                                <th className="px-4 py-3 text-left text-sm font-semibold text-neutral-600">Subscribe Date</th>
                                <th className="px-4 py-3 text-center text-sm font-semibold text-neutral-600">Aksi</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-neutral-100">
                            {filteredSubscribers.map((subscriber) => (
                                <tr key={subscriber.id} className="hover:bg-neutral-50">
                                    <td className="px-4 py-4">
                                        <div className="flex items-center gap-2">
                                            <Mail className="w-4 h-4 text-neutral-400" />
                                            <span className="font-medium text-neutral-800">{subscriber.email}</span>
                                        </div>
                                    </td>
                                    <td className="px-4 py-4 text-neutral-600">{subscriber.name || '-'}</td>
                                    <td className="px-4 py-4">
                                        <Badge variant={statusConfig[subscriber.status].color}>
                                            {statusConfig[subscriber.status].label}
                                        </Badge>
                                    </td>
                                    <td className="px-4 py-4 text-sm text-neutral-500">
                                        {formatDate(subscriber.subscribedAt, { day: 'numeric', month: 'short', year: 'numeric' })}
                                    </td>
                                    <td className="px-4 py-4 text-center">
                                        <button
                                            onClick={() => handleDelete(subscriber.id)}
                                            className="inline-flex items-center gap-1 px-3 py-1.5 text-sm text-red-500 hover:bg-red-50 rounded-lg"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                            Hapus
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {filteredSubscribers.length === 0 && (
                    <div className="p-12 text-center">
                        <Mail className="w-16 h-16 text-neutral-300 mx-auto mb-4" />
                        <h3 className="text-lg font-semibold text-neutral-800 mb-2">Tidak ada subscriber</h3>
                        <p className="text-neutral-500">Belum ada subscriber untuk newsletter</p>
                    </div>
                )}
            </div>
        </div>
    );
}
