'use client';

import { useState } from 'react';
import { Search, MessageSquare, Eye, Check, Mail, Phone, Calendar } from 'lucide-react';
import { Button, Badge, Modal } from '@/components/ui';
import { formatDate } from '@/lib/utils';

// Mock contact messages data
const mockMessages = [
    {
        id: '1',
        name: 'Budi Santoso',
        email: 'budi@email.com',
        phone: '081234567890',
        subject: 'Pertanyaan tentang produk',
        message: 'Halo, saya ingin bertanya mengenai stok produk Serum Vitamin C. Apakah masih tersedia?',
        status: 'NEW',
        createdAt: '2024-12-16T10:30:00Z',
    },
    {
        id: '2',
        name: 'Siti Aminah',
        email: 'siti@email.com',
        phone: null,
        subject: 'Keluhan pengiriman',
        message: 'Pesanan saya sudah 5 hari belum sampai. Tolong dicek. Nomor order: INV-241210-001',
        status: 'IN_PROGRESS',
        createdAt: '2024-12-15T14:20:00Z',
    },
    {
        id: '3',
        name: 'Ahmad Wijaya',
        email: 'ahmad@email.com',
        phone: '081234567891',
        subject: 'Request kerjasama',
        message: 'Saya tertarik untuk kerjasama sebagai reseller. Bisa minta informasi lebih lanjut?',
        status: 'RESOLVED',
        createdAt: '2024-12-14T09:15:00Z',
        repliedAt: '2024-12-14T15:00:00Z',
    },
];

const statusConfig = {
    NEW: { label: 'Baru', color: 'warning' },
    IN_PROGRESS: { label: 'Dalam Proses', color: 'primary' },
    RESOLVED: { label: 'Selesai', color: 'success' },
    CLOSED: { label: 'Ditutup', color: 'secondary' },
};

export default function ContactMessagesPage() {
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState('');
    const [selectedMessage, setSelectedMessage] = useState(null);

    const filteredMessages = mockMessages.filter((msg) => {
        const matchesSearch = msg.name.toLowerCase().includes(search.toLowerCase()) ||
            msg.email.toLowerCase().includes(search.toLowerCase()) ||
            msg.subject.toLowerCase().includes(search.toLowerCase());
        const matchesStatus = !statusFilter || msg.status === statusFilter;
        return matchesSearch && matchesStatus;
    });

    const handleStatusUpdate = (id, newStatus) => {
        alert(`Status pesan ${id} diubah ke ${newStatus}`);
        setSelectedMessage(null);
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-display font-bold text-neutral-800">Contact Messages</h1>
                <p className="text-neutral-500">Kelola pesan dari pelanggan</p>
            </div>

            {/* Stats */}
            <div className="grid sm:grid-cols-4 gap-4">
                <div className="bg-white rounded-xl p-5 shadow-sm">
                    <p className="text-sm text-neutral-500 mb-1">Total Pesan</p>
                    <p className="text-2xl font-bold text-neutral-800">{mockMessages.length}</p>
                </div>
                <div className="bg-white rounded-xl p-5 shadow-sm">
                    <p className="text-sm text-neutral-500 mb-1">Baru</p>
                    <p className="text-2xl font-bold text-amber-600">
                        {mockMessages.filter(m => m.status === 'NEW').length}
                    </p>
                </div>
                <div className="bg-white rounded-xl p-5 shadow-sm">
                    <p className="text-sm text-neutral-500 mb-1">Dalam Proses</p>
                    <p className="text-2xl font-bold text-primary-500">
                        {mockMessages.filter(m => m.status === 'IN_PROGRESS').length}
                    </p>
                </div>
                <div className="bg-white rounded-xl p-5 shadow-sm">
                    <p className="text-sm text-neutral-500 mb-1">Selesai</p>
                    <p className="text-2xl font-bold text-green-600">
                        {mockMessages.filter(m => m.status === 'RESOLVED').length}
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
                            placeholder="Cari nama, email, atau subjek..."
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
                        <option value="NEW">Baru</option>
                        <option value="IN_PROGRESS">Dalam Proses</option>
                        <option value="RESOLVED">Selesai</option>
                        <option value="CLOSED">Ditutup</option>
                    </select>
                </div>
            </div>

            {/* Messages Table */}
            <div className="bg-white rounded-xl shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-neutral-50 border-b border-neutral-100">
                            <tr>
                                <th className="px-4 py-3 text-left text-sm font-semibold text-neutral-600">Pengirim</th>
                                <th className="px-4 py-3 text-left text-sm font-semibold text-neutral-600">Subjek</th>
                                <th className="px-4 py-3 text-left text-sm font-semibold text-neutral-600">Status</th>
                                <th className="px-4 py-3 text-left text-sm font-semibold text-neutral-600">Tanggal</th>
                                <th className="px-4 py-3 text-center text-sm font-semibold text-neutral-600">Aksi</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-neutral-100">
                            {filteredMessages.map((message) => (
                                <tr key={message.id} className="hover:bg-neutral-50">
                                    <td className="px-4 py-4">
                                        <p className="font-medium text-neutral-800">{message.name}</p>
                                        <p className="text-sm text-neutral-500 flex items-center gap-1">
                                            <Mail className="w-3 h-3" />
                                            {message.email}
                                        </p>
                                        {message.phone && (
                                            <p className="text-sm text-neutral-500 flex items-center gap-1">
                                                <Phone className="w-3 h-3" />
                                                {message.phone}
                                            </p>
                                        )}
                                    </td>
                                    <td className="px-4 py-4">
                                        <p className="font-medium text-neutral-700">{message.subject}</p>
                                        <p className="text-sm text-neutral-500 line-clamp-1">{message.message}</p>
                                    </td>
                                    <td className="px-4 py-4">
                                        <Badge variant={statusConfig[message.status].color}>
                                            {statusConfig[message.status].label}
                                        </Badge>
                                    </td>
                                    <td className="px-4 py-4 text-sm text-neutral-500">
                                        {formatDate(message.createdAt, { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                                    </td>
                                    <td className="px-4 py-4 text-center">
                                        <button
                                            onClick={() => setSelectedMessage(message)}
                                            className="inline-flex items-center gap-1 px-3 py-1.5 text-sm text-primary-500 hover:bg-primary-50 rounded-lg"
                                        >
                                            <Eye className="w-4 h-4" />
                                            Detail
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {filteredMessages.length === 0 && (
                    <div className="p-12 text-center">
                        <MessageSquare className="w-16 h-16 text-neutral-300 mx-auto mb-4" />
                        <h3 className="text-lg font-semibold text-neutral-800 mb-2">Tidak ada pesan</h3>
                        <p className="text-neutral-500">Belum ada pesan dari pelanggan</p>
                    </div>
                )}
            </div>

            {/* Detail Modal */}
            {selectedMessage && (
                <Modal
                    isOpen={!!selectedMessage}
                    onClose={() => setSelectedMessage(null)}
                    title="Detail Pesan"
                >
                    <div className="space-y-4">
                        <div>
                            <label className="text-sm font-medium text-neutral-500">Pengirim</label>
                            <p className="text-neutral-800">{selectedMessage.name}</p>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="text-sm font-medium text-neutral-500">Email</label>
                                <p className="text-neutral-800">{selectedMessage.email}</p>
                            </div>
                            <div>
                                <label className="text-sm font-medium text-neutral-500">Telepon</label>
                                <p className="text-neutral-800">{selectedMessage.phone || '-'}</p>
                            </div>
                        </div>
                        <div>
                            <label className="text-sm font-medium text-neutral-500">Subjek</label>
                            <p className="text-neutral-800">{selectedMessage.subject}</p>
                        </div>
                        <div>
                            <label className="text-sm font-medium text-neutral-500">Pesan</label>
                            <p className="text-neutral-800 whitespace-pre-wrap">{selectedMessage.message}</p>
                        </div>
                        <div>
                            <label className="text-sm font-medium text-neutral-500">Status</label>
                            <div className="mt-1">
                                <Badge variant={statusConfig[selectedMessage.status].color}>
                                    {statusConfig[selectedMessage.status].label}
                                </Badge>
                            </div>
                        </div>
                        {selectedMessage.repliedAt && (
                            <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                                <p className="text-sm text-green-800">
                                    <Check className="w-4 h-4 inline mr-1" />
                                    Dibalas pada {formatDate(selectedMessage.repliedAt, { day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' })}
                                </p>
                            </div>
                        )}
                    </div>
                    <div className="flex gap-3 mt-6">
                        {selectedMessage.status === 'NEW' && (
                            <Button onClick={() => handleStatusUpdate(selectedMessage.id, 'IN_PROGRESS')}>
                                Proses Pesan
                            </Button>
                        )}
                        {selectedMessage.status === 'IN_PROGRESS' && (
                            <Button variant="success" onClick={() => handleStatusUpdate(selectedMessage.id, 'RESOLVED')}>
                                <Check className="w-4 h-4" />
                                Tandai Selesai
                            </Button>
                        )}
                        <Button variant="secondary" onClick={() => setSelectedMessage(null)}>
                            Tutup
                        </Button>
                    </div>
                </Modal>
            )}
        </div>
    );
}
