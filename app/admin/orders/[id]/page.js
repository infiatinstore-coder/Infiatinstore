'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useParams } from 'next/navigation';
import {
    ArrowLeft,
    Package,
    Truck,
    CreditCard,
    MapPin,
    Clock,
    Check,
    X,
    Printer,
    MessageCircle
} from 'lucide-react';
import { formatRupiah, formatDate } from '@/lib/utils';
import { Button, Badge } from '@/components/ui';

// Mock order detail
const mockOrder = {
    id: '1',
    orderNumber: 'INV-241216-ABC123',
    status: 'PAID',
    customer: {
        name: 'Budi Santoso',
        email: 'budi@email.com',
        phone: '081234567890',
    },
    address: {
        recipientName: 'Budi Santoso',
        phone: '081234567890',
        fullAddress: 'Jl. Sudirman No. 123, RT 01/RW 02, Kelurahan Menteng, Kecamatan Menteng',
        city: 'Jakarta Pusat',
        postalCode: '10310',
    },
    items: [
        {
            id: '1',
            name: 'Serum Vitamin C Brightening',
            variant: null,
            image: 'https://images.unsplash.com/photo-1620916566398-39f1143ab7be?w=200',
            quantity: 2,
            price: 149000,
        },
        {
            id: '2',
            name: 'Moisturizer Hydrating Gel',
            variant: null,
            image: 'https://images.unsplash.com/photo-1611930022073-b7a4ba5fcccd?w=200',
            quantity: 1,
            price: 145000,
        },
    ],
    subtotal: 443000,
    shippingCost: 15000,
    discount: 44300,
    tax: 43857,
    total: 457557,
    payment: {
        method: 'Bank BCA',
        status: 'SUCCESS',
        paidAt: '2024-12-16T10:35:00Z',
    },
    shipment: {
        courier: 'JNE',
        service: 'REG',
        trackingNumber: null,
        estimatedDays: '3-5',
    },
    notes: 'Tolong packing rapi ya kak, ini untuk hadiah.',
    createdAt: '2024-12-16T10:30:00Z',
};

const statusConfig = {
    PENDING_PAYMENT: { label: 'Menunggu Bayar', color: 'warning' },
    PAID: { label: 'Dibayar', color: 'primary' },
    PROCESSING: { label: 'Diproses', color: 'primary' },
    SHIPPED: { label: 'Dikirim', color: 'primary' },
    DELIVERED: { label: 'Diterima', color: 'success' },
    COMPLETED: { label: 'Selesai', color: 'success' },
    CANCELLED: { label: 'Dibatalkan', color: 'danger' },
};

export default function OrderDetailPage() {
    const params = useParams();
    const [order, setOrder] = useState(mockOrder);
    const [trackingNumber, setTrackingNumber] = useState('');
    const [adminNotes, setAdminNotes] = useState('');
    const [showAdminNotes, setShowAdminNotes] = useState(false);

    const handleUpdateStatus = (newStatus) => {
        setOrder({ ...order, status: newStatus });
        alert(`Status berhasil diubah menjadi ${statusConfig[newStatus].label}`);
    };

    const handleShip = () => {
        if (!trackingNumber) {
            alert('Masukkan nomor resi');
            return;
        }
        setOrder({
            ...order,
            status: 'SHIPPED',
            shipment: { ...order.shipment, trackingNumber },
        });
        alert('Pesanan berhasil dikirim!');
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <Link href="/admin/orders" className="inline-flex items-center gap-2 text-neutral-500 hover:text-primary-500 mb-2">
                        <ArrowLeft className="w-4 h-4" />
                        Kembali ke Pesanan
                    </Link>
                    <div className="flex items-center gap-3">
                        <h1 className="text-2xl font-display font-bold text-neutral-800">
                            {order.orderNumber}
                        </h1>
                        <Badge variant={statusConfig[order.status].color}>
                            {statusConfig[order.status].label}
                        </Badge>
                    </div>
                    <p className="text-neutral-500 mt-1">
                        <Clock className="w-4 h-4 inline mr-1" />
                        {formatDate(order.createdAt, { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    </p>
                </div>
                <div className="flex gap-2">
                    <Button variant="secondary">
                        <Printer className="w-4 h-4" />
                        Cetak Invoice
                    </Button>
                    <Button variant="secondary">
                        <MessageCircle className="w-4 h-4" />
                        Hubungi Customer
                    </Button>
                </div>
            </div>

            {/* Shipping Deadline Alert (for PAID/PROCESSING orders) */}
            {(order.status === 'PAID' || order.status === 'PROCESSING') && (
                <div className="bg-amber-50 border-2 border-amber-200 rounded-xl p-4">
                    <div className="flex items-start gap-3">
                        <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center flex-shrink-0">
                            <Clock className="w-5 h-5 text-amber-600" />
                        </div>
                        <div className="flex-1">
                            <h3 className="font-semibold text-amber-900 mb-1">
                                ⚠️ Deadline Pengiriman
                            </h3>
                            <p className="text-sm text-amber-700 mb-2">
                                Pesanan harus diproses dan dikirim dalam <strong>2 x 24 jam</strong> sejak pembayaran dikonfirmasi
                            </p>
                            {order.payment?.paidAt && (() => {
                                const paidTime = new Date(order.payment.paidAt);
                                const deadlineTime = new Date(paidTime.getTime() + (48 * 60 * 60 * 1000)); // +48 hours
                                const now = new Date();
                                const remaining = deadlineTime - now;
                                const hoursLeft = Math.max(0, Math.floor(remaining / (1000 * 60 * 60)));
                                const minutesLeft = Math.max(0, Math.floor((remaining % (1000 * 60 * 60)) / (1000 * 60)));

                                const isUrgent = hoursLeft < 6;
                                const isVeryUrgent = hoursLeft < 2;

                                return (
                                    <div className="flex items-center gap-4">
                                        <div className={`px-4 py-2 rounded-lg font-mono text-lg font-bold ${isVeryUrgent ? 'bg-red-100 text-red-700' :
                                            isUrgent ? 'bg-amber-100 text-amber-700' :
                                                'bg-blue-100 text-blue-700'
                                            }`}>
                                            {hoursLeft}h {minutesLeft}m
                                        </div>
                                        <div className="text-sm text-amber-600">
                                            <div>Deadline: {deadlineTime.toLocaleString('id-ID')}</div>
                                            {isVeryUrgent && <div className="font-semibold text-red-600">SEGERA PROSES!</div>}
                                        </div>
                                    </div>
                                );
                            })()}
                        </div>
                    </div>
                </div>
            )}

            <div className="grid lg:grid-cols-3 gap-6">
                {/* Left Column - Order Details */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Items */}
                    <div className="bg-white rounded-xl shadow-sm">
                        <div className="p-4 border-b border-neutral-100 flex items-center gap-2">
                            <Package className="w-5 h-5 text-primary-500" />
                            <h2 className="font-semibold text-neutral-800">Item Pesanan</h2>
                        </div>
                        <div className="divide-y divide-neutral-100">
                            {order.items.map((item) => (
                                <div key={item.id} className="p-4 flex gap-4">
                                    <div className="relative w-16 h-16 rounded-lg overflow-hidden bg-neutral-100">
                                        <Image src={item.image} alt={item.name} fill className="object-cover" />
                                    </div>
                                    <div className="flex-1">
                                        <p className="font-medium text-neutral-800">{item.name}</p>
                                        {item.variant && <p className="text-sm text-neutral-500">{item.variant}</p>}
                                        <p className="text-sm text-neutral-500">{item.quantity} x {formatRupiah(item.price)}</p>
                                    </div>
                                    <p className="font-semibold text-neutral-800">
                                        {formatRupiah(item.price * item.quantity)}
                                    </p>
                                </div>
                            ))}
                        </div>
                        <div className="p-4 border-t border-neutral-100 space-y-2">
                            <div className="flex justify-between text-sm">
                                <span className="text-neutral-500">Subtotal</span>
                                <span>{formatRupiah(order.subtotal)}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="text-neutral-500">Ongkos Kirim</span>
                                <span>{formatRupiah(order.shippingCost)}</span>
                            </div>
                            {order.discount > 0 && (
                                <div className="flex justify-between text-sm text-green-600">
                                    <span>Diskon</span>
                                    <span>-{formatRupiah(order.discount)}</span>
                                </div>
                            )}
                            <div className="flex justify-between text-sm">
                                <span className="text-neutral-500">PPN (11%)</span>
                                <span>{formatRupiah(order.tax)}</span>
                            </div>
                            <div className="flex justify-between font-bold text-lg pt-2 border-t border-neutral-100">
                                <span>Total</span>
                                <span className="text-primary-500">{formatRupiah(order.total)}</span>
                            </div>
                        </div>
                    </div>

                    {/* Notes */}
                    {order.notes && (
                        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
                            <p className="text-sm font-medium text-amber-800 mb-1">Catatan dari Customer:</p>
                            <p className="text-amber-700">{order.notes}</p>
                        </div>
                    )}

                    {/* Actions based on status */}
                    {order.status === 'PAID' && (
                        <div className="bg-white rounded-xl shadow-sm p-4">
                            <h3 className="font-semibold text-neutral-800 mb-4">Proses Pesanan</h3>
                            <div className="flex gap-3">
                                <Button onClick={() => handleUpdateStatus('PROCESSING')}>
                                    <Check className="w-4 h-4" />
                                    Proses Pesanan
                                </Button>
                                <Button variant="danger" onClick={() => handleUpdateStatus('CANCELLED')}>
                                    <X className="w-4 h-4" />
                                    Batalkan
                                </Button>
                            </div>
                        </div>
                    )}

                    {order.status === 'PROCESSING' && (
                        <div className="bg-white rounded-xl shadow-sm p-4">
                            <h3 className="font-semibold text-neutral-800 mb-4">Kirim Pesanan</h3>
                            <div className="flex gap-3">
                                <input
                                    type="text"
                                    placeholder="Masukkan nomor resi"
                                    value={trackingNumber}
                                    onChange={(e) => setTrackingNumber(e.target.value)}
                                    className="flex-1 px-4 py-2.5 rounded-lg border border-neutral-200 focus:outline-none focus:border-primary-500"
                                />
                                <Button onClick={handleShip}>
                                    <Truck className="w-4 h-4" />
                                    Kirim
                                </Button>
                            </div>
                        </div>
                    )}
                </div>

                {/* Right Column - Customer & Shipping */}
                <div className="space-y-6">
                    {/* Customer Info */}
                    <div className="bg-white rounded-xl shadow-sm p-4">
                        <h3 className="font-semibold text-neutral-800 mb-4">Pelanggan</h3>
                        <div className="space-y-2">
                            <p className="font-medium text-neutral-800">{order.customer.name}</p>
                            <p className="text-sm text-neutral-500">{order.customer.email}</p>
                            <p className="text-sm text-neutral-500">{order.customer.phone}</p>
                        </div>
                    </div>

                    {/* Shipping Address */}
                    <div className="bg-white rounded-xl shadow-sm p-4">
                        <div className="flex items-center gap-2 mb-4">
                            <MapPin className="w-5 h-5 text-primary-500" />
                            <h3 className="font-semibold text-neutral-800">Alamat Pengiriman</h3>
                        </div>
                        <div className="space-y-1 text-sm">
                            <p className="font-medium text-neutral-800">{order.address.recipientName}</p>
                            <p className="text-neutral-500">{order.address.phone}</p>
                            <p className="text-neutral-500">{order.address.fullAddress}</p>
                            <p className="text-neutral-500">{order.address.city} {order.address.postalCode}</p>
                        </div>
                    </div>

                    {/* Shipping Info */}
                    <div className="bg-white rounded-xl shadow-sm p-4">
                        <div className="flex items-center gap-2 mb-4">
                            <Truck className="w-5 h-5 text-primary-500" />
                            <h3 className="font-semibold text-neutral-800">Pengiriman</h3>
                        </div>
                        <div className="space-y-2 text-sm">
                            <div className="flex justify-between">
                                <span className="text-neutral-500">Kurir</span>
                                <span className="text-neutral-800">{order.shipment.courier} {order.shipment.service}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-neutral-500">Estimasi</span>
                                <span className="text-neutral-800">{order.shipment.estimatedDays} hari</span>
                            </div>
                            {order.shipment.trackingNumber && (
                                <div className="flex justify-between">
                                    <span className="text-neutral-500">No. Resi</span>
                                    <span className="font-medium text-primary-500">{order.shipment.trackingNumber}</span>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Payment Info */}
                    <div className="bg-white rounded-xl shadow-sm p-4">
                        <div className="flex items-center gap-2 mb-4">
                            <CreditCard className="w-5 h-5 text-primary-500" />
                            <h3 className="font-semibold text-neutral-800">Pembayaran</h3>
                        </div>
                        <div className="space-y-2 text-sm">
                            <div className="flex justify-between">
                                <span className="text-neutral-500">Metode</span>
                                <span className="text-neutral-800">{order.payment.method}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-neutral-500">Status</span>
                                <Badge variant="success" size="sm">{order.payment.status}</Badge>
                            </div>
                            {order.payment.paidAt && (
                                <div className="flex justify-between">
                                    <span className="text-neutral-500">Dibayar</span>
                                    <span className="text-neutral-800">
                                        {formatDate(order.payment.paidAt, { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                                    </span>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Admin Internal Notes */}
                    <div className="bg-white rounded-xl shadow-sm p-4">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="font-semibold text-neutral-800">📝 Catatan Internal</h3>
                            <button
                                onClick={() => setShowAdminNotes(!showAdminNotes)}
                                className="text-sm text-primary-500 hover:text-primary-600"
                            >
                                {showAdminNotes ? 'Tutup' : 'Tambah Catatan'}
                            </button>
                        </div>

                        {showAdminNotes && (
                            <div className="space-y-3">
                                <textarea
                                    value={adminNotes}
                                    onChange={(e) => setAdminNotes(e.target.value)}
                                    placeholder="Tulis catatan internal untuk tim admin..."
                                    className="w-full px-3 py-2 border border-neutral-200 rounded-lg focus:outline-none focus:border-primary-500 min-h-[100px]"
                                />
                                <div className="flex gap-2 justify-end">
                                    <button
                                        onClick={() => {
                                            setShowAdminNotes(false);
                                            setAdminNotes('');
                                        }}
                                        className="px-4 py-2 text-neutral-600 hover:bg-neutral-100 rounded-lg"
                                    >
                                        Batal
                                    </button>
                                    <button
                                        onClick={() => {
                                            alert('Catatan tersimpan: ' + adminNotes);
                                            setShowAdminNotes(false);
                                        }}
                                        className="px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600"
                                    >
                                        Simpan
                                    </button>
                                </div>
                            </div>
                        )}

                        {!showAdminNotes && order.adminNotes && (
                            <div className="text-sm text-neutral-600 bg-neutral-50 p-3 rounded-lg">
                                {order.adminNotes}
                            </div>
                        )}

                        {!showAdminNotes && !order.adminNotes && (
                            <p className="text-sm text-neutral-400 italic">Belum ada catatan internal</p>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
