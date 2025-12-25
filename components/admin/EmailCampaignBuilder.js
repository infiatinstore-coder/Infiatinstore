'use client';

import { useState, useEffect } from 'react';

/**
 * Email Campaign Builder Admin UI
 */
export default function EmailCampaignBuilder() {
    const [campaigns, setCampaigns] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [sending, setSending] = useState(false);

    const [formData, setFormData] = useState({
        subject: '',
        content: '',
        target: 'all',
        voucherCode: ''
    });

    const targetOptions = [
        { value: 'all', label: 'Semua Subscriber Newsletter', desc: 'Subscriber aktif newsletter' },
        { value: 'customers', label: 'Semua Customer', desc: 'User dengan email terverifikasi' },
        { value: 'non-buyers', label: 'Belum Pernah Beli', desc: 'User yang belum memiliki order' },
        { value: 'repeat-customers', label: 'Pelanggan Setia', desc: 'User dengan >1 order' }
    ];

    useEffect(() => {
        fetchCampaigns();
    }, []);

    const fetchCampaigns = async () => {
        try {
            const res = await fetch('/api/admin/email-campaign');
            if (res.ok) {
                const data = await res.json();
                setCampaigns(data.campaigns || []);
            }
        } catch (error) {
            console.error('Error fetching campaigns:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!formData.subject || !formData.content) {
            alert('Subject dan konten wajib diisi!');
            return;
        }

        setSending(true);
        try {
            const res = await fetch('/api/admin/email-campaign', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.error || 'Failed to send campaign');
            }

            alert(`Campaign berhasil dikirim ke ${data.campaign.recipientCount} penerima!`);
            setShowModal(false);
            setFormData({ subject: '', content: '', target: 'all', voucherCode: '' });
            fetchCampaigns();

        } catch (error) {
            alert('Error: ' + error.message);
        } finally {
            setSending(false);
        }
    };

    const getStatusBadge = (status) => {
        const styles = {
            DRAFT: 'bg-gray-100 text-gray-800',
            SENDING: 'bg-yellow-100 text-yellow-800',
            COMPLETED: 'bg-green-100 text-green-800',
            FAILED: 'bg-red-100 text-red-800'
        };
        return styles[status] || styles.DRAFT;
    };

    return (
        <div className="bg-white rounded-xl shadow-sm">
            {/* Header */}
            <div className="px-6 py-4 border-b flex justify-between items-center">
                <div>
                    <h2 className="text-lg font-semibold">Email Campaign</h2>
                    <p className="text-sm text-gray-500">Kirim email marketing ke subscribers</p>
                </div>
                <button
                    onClick={() => setShowModal(true)}
                    className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition text-sm font-medium"
                >
                    + Buat Campaign
                </button>
            </div>

            {/* Campaign List */}
            <div className="p-6">
                {loading ? (
                    <div className="text-center py-8">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600 mx-auto"></div>
                    </div>
                ) : campaigns.length === 0 ? (
                    <div className="text-center py-12">
                        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <svg xmlns="http://www.w3.org/2000/svg" className="w-8 h-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                            </svg>
                        </div>
                        <p className="text-gray-500">Belum ada campaign</p>
                        <button
                            onClick={() => setShowModal(true)}
                            className="mt-3 text-emerald-600 hover:underline text-sm"
                        >
                            Buat campaign pertama
                        </button>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Subject</th>
                                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Target</th>
                                    <th className="px-4 py-3 text-center text-sm font-medium text-gray-600">Terkirim</th>
                                    <th className="px-4 py-3 text-center text-sm font-medium text-gray-600">Status</th>
                                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Tanggal</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y">
                                {campaigns.map((campaign) => (
                                    <tr key={campaign.id} className="hover:bg-gray-50">
                                        <td className="px-4 py-3">
                                            <p className="font-medium text-gray-900">{campaign.subject}</p>
                                        </td>
                                        <td className="px-4 py-3 text-sm text-gray-600 capitalize">
                                            {campaign.target.replace('-', ' ')}
                                        </td>
                                        <td className="px-4 py-3 text-center">
                                            <span className="text-sm text-gray-900">{campaign.sentCount}</span>
                                            <span className="text-gray-400"> / </span>
                                            <span className="text-sm text-gray-600">{campaign.recipientCount}</span>
                                        </td>
                                        <td className="px-4 py-3 text-center">
                                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusBadge(campaign.status)}`}>
                                                {campaign.status}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3 text-sm text-gray-600">
                                            {new Date(campaign.createdAt).toLocaleDateString('id-ID')}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Create Campaign Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                        <div className="px-6 py-4 border-b flex justify-between items-center">
                            <h3 className="text-lg font-semibold">Buat Email Campaign</h3>
                            <button
                                onClick={() => setShowModal(false)}
                                className="text-gray-400 hover:text-gray-600"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="p-6 space-y-4">
                            {/* Target Audience */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Target Audience
                                </label>
                                <div className="grid grid-cols-2 gap-2">
                                    {targetOptions.map((opt) => (
                                        <label
                                            key={opt.value}
                                            className={`p-3 border rounded-lg cursor-pointer transition ${formData.target === opt.value
                                                    ? 'border-emerald-500 bg-emerald-50'
                                                    : 'border-gray-200 hover:border-gray-300'
                                                }`}
                                        >
                                            <input
                                                type="radio"
                                                name="target"
                                                value={opt.value}
                                                checked={formData.target === opt.value}
                                                onChange={(e) => setFormData({ ...formData, target: e.target.value })}
                                                className="sr-only"
                                            />
                                            <p className="font-medium text-sm">{opt.label}</p>
                                            <p className="text-xs text-gray-500">{opt.desc}</p>
                                        </label>
                                    ))}
                                </div>
                            </div>

                            {/* Subject */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Subject Email
                                </label>
                                <input
                                    type="text"
                                    value={formData.subject}
                                    onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                                    placeholder="e.g. Flash Sale 12.12 - Diskon hingga 70%!"
                                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500"
                                    required
                                />
                            </div>

                            {/* Content */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Konten Email
                                </label>
                                <textarea
                                    value={formData.content}
                                    onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                                    placeholder="Tulis konten email Anda di sini...

Gunakan {name} untuk nama penerima
Gunakan {voucher} untuk kode voucher"
                                    rows={8}
                                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500"
                                    required
                                />
                                <p className="text-xs text-gray-500 mt-1">
                                    Variable: {'{name}'} = nama penerima, {'{email}'} = email, {'{voucher}'} = kode voucher
                                </p>
                            </div>

                            {/* Voucher Code */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Kode Voucher (Opsional)
                                </label>
                                <input
                                    type="text"
                                    value={formData.voucherCode}
                                    onChange={(e) => setFormData({ ...formData, voucherCode: e.target.value })}
                                    placeholder="e.g. FLASHSALE50"
                                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500"
                                />
                            </div>

                            {/* Actions */}
                            <div className="flex gap-3 pt-4">
                                <button
                                    type="button"
                                    onClick={() => setShowModal(false)}
                                    className="flex-1 px-4 py-2 border rounded-lg hover:bg-gray-50"
                                >
                                    Batal
                                </button>
                                <button
                                    type="submit"
                                    disabled={sending}
                                    className="flex-1 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-50"
                                >
                                    {sending ? '⏳ Mengirim...' : '🚀 Kirim Campaign'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
