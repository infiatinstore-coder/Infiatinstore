'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useParams, useRouter } from 'next/navigation';
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
    MessageCircle,
    RefreshCw
} from 'lucide-react';
import { formatRupiah, formatDate } from '@/lib/utils';
import { Button, Badge } from '@/components/ui';

const statusConfig = {
    PENDING_PAYMENT: { label: 'Menunggu Bayar', color: 'warning' },
    PAID: { label: 'Dibayar', color: 'primary' },
    PROCESSING: { label: 'Diproses', color: 'primary' },
    SHIPPED: { label: 'Dikirim', color: 'primary' },
    DELIVERED: { label: 'Diterima', color: 'success' },
    COMPLETED: { label: 'Selesai', color: 'success' },
    CANCELLED: { label: 'Dibatalkan', color: 'danger' },
    FAILED: { label: 'Gagal', color: 'danger' },
};

export default function OrderDetailPage() {
    const params = useParams();
    const router = useRouter();
    const [order, setOrder] = useState(null);
    const [loading, setLoading] = useState(true);
    const [updating, setUpdating] = useState(false);
    const [trackingNumber, setTrackingNumber] = useState('');
    const [adminNotes, setAdminNotes] = useState('');
    const [showAdminNotes, setShowAdminNotes] = useState(false);

    useEffect(() => {
        fetchOrder();
    }, [params.id]);

    const fetchOrder = async () => {
        setLoading(true);
        try {
            const res = await fetch(`/api/orders/${params.id}`);
            const data = await res.json();

            if (data.success || data.order) {
                setOrder(data.order || data);
            } else {
                alert('Order tidak ditemukan');
                router.push('/admin/orders');
            }
        } catch (error) {
            console.error('Failed to fetch order:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleUpdateStatus = async (newStatus) => {
        if (!confirm(`Ubah status ke ${statusConfig[newStatus]?.label}?`)) return;

        setUpdating(true);
        try {
            const res = await fetch(`/api/orders/${params.id}/status`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: newStatus }),
            });

            if (res.ok) {
                alert(`✅ Status berhasil diubah ke ${statusConfig[newStatus].label}`);
                fetchOrder();
            } else {
                const data = await res.json();
                alert('❌ ' + (data.error || 'Gagal update status'));
            }
        } catch (error) {
            alert('❌ Terjadi kesalahan');
        } finally {
            setUpdating(false);
        }
    };

    const handleShip = async () => {
        if (!trackingNumber.trim()) {
            alert('Masukkan nomor resi');
            return;
        }

        setUpdating(true);
        try {
            const res = await fetch(`/api/orders/${params.id}/ship`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ trackingNumber }),
            });

            if (res.ok) {
                alert('✅ Pesanan berhasil dikirim!');
                setTrackingNumber('');
                fetchOrder();
            } else {
                const data = await res.json();
                alert('❌ ' + (data.error || 'Gagal mengirim'));
            }
        } catch (error) {
            alert('❌ Terjadi kesalahan');
        } finally {
            setUpdating(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <RefreshCw className="w-8 h-8 text-primary-500 animate-spin" />
            </div>
        );
    }

    if (!order) {
        return (
            <div className="text-center py-12">
                <p className="text-neutral-500">Order tidak ditemukan</p>
                <Link href="/admin/orders" className="text-primary-500 hover:underline mt-2 inline-block">
                    Kembali ke daftar pesanan
                </Link>
            </div>
        );
    }

    // Parse order data structure
    const customer = order.user || { name: order.guestName, email: order.guestEmail, phone: order.guestPhone };
    const address = order.shippingAddress || order.address || {};
    const items = order.items || [];
    const payment = order.payment || { method: order.paymentMethod, status: order.paymentStatus };
    const shipment = order.shipment || { courier: order.courier, service: order.courierService, trackingNumber: order.trackingNumber };

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
                        <Badge variant={statusConfig[order.status]?.color || 'secondary'}>
                            {statusConfig[order.status]?.label || order.status}
                        </Badge>
                    </div>
                    <p className="text-neutral-500 mt-1">
                        <Clock className="w-4 h-4 inline mr-1" />
                        {formatDate(order.createdAt, { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    </p>
                </div>
                <div className="flex gap-2">
                    <Button variant="secondary" onClick={fetchOrder}>
                        <RefreshCw className="w-4 h-4" />
                    </Button>
                    <Button variant="secondary">
                        <Printer className="w-4 h-4" />
                        Cetak Invoice
                    </Button>
                </div>
            </div>

            {/* Shipping Deadline Alert */}
            {(order.status === 'PAID' || order.status === 'PROCESSING') && order.paidAt && (
                <div className="bg-amber-50 border-2 border-amber-200 rounded-xl p-4">
                    <div className="flex items-start gap-3">
                        <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center flex-shrink-0">
                            <Clock className="w-5 h-5 text-amber-600" />
                        </div>
                        <div className="flex-1">
                            <h3 className="font-semibold text-amber-900 mb-1">⚠️ Deadline Pengiriman</h3>
                            <p className="text-sm text-amber-700">
                                Pesanan harus diproses dan dikirim dalam <strong>2 x 24 jam</strong> sejak pembayaran
                            </p>
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
                            <h2 className="font-semibold text-neutral-800">Item Pesanan ({items.length})</h2>
                        </div>
                        <div className="divide-y divide-neutral-100">
                            {items.map((item, idx) => (
                                <div key={item.id || idx} className="p-4 flex gap-4">
                                    <div className="relative w-16 h-16 rounded-lg overflow-hidden bg-neutral-100">
                                        {(item.product?.images?.[0] || item.image) ? (
                                            <Image
                                                src={item.product?.images?.[0] || item.image}
                                                alt={item.product?.name || item.name}
                                                fill
                                                className="object-cover"
                                            />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center text-neutral-400">
                                                <Package className="w-6 h-6" />
                                            </div>
                                        )}
                                    </div>
                                    <div className="flex-1">
                                        <p className="font-medium text-neutral-800">{item.product?.name || item.name}</p>
                                        {item.variant && <p className="text-sm text-neutral-500">{item.variant.name}</p>}
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
                                <span>{formatRupiah(order.shippingCost || 0)}</span>
                            </div>
                            {order.discount > 0 && (
                                <div className="flex justify-between text-sm text-green-600">
                                    <span>Diskon</span>
                                    <span>-{formatRupiah(order.discount)}</span>
                                </div>
                            )}
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
                                <Button onClick={() => handleUpdateStatus('PROCESSING')} disabled={updating}>
                                    <Check className="w-4 h-4" />
                                    {updating ? 'Memproses...' : 'Proses Pesanan'}
                                </Button>
                                <Button variant="danger" onClick={() => handleUpdateStatus('CANCELLED')} disabled={updating}>
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
                                <Button onClick={handleShip} disabled={updating}>
                                    <Truck className="w-4 h-4" />
                                    {updating ? 'Mengirim...' : 'Kirim'}
                                </Button>
                            </div>
                        </div>
                    )}

                    {order.status === 'DELIVERED' && (
                        <div className="bg-white rounded-xl shadow-sm p-4">
                            <h3 className="font-semibold text-neutral-800 mb-4">Selesaikan Pesanan</h3>
                            <Button onClick={() => handleUpdateStatus('COMPLETED')} disabled={updating}>
                                <Check className="w-4 h-4" />
                                {updating ? 'Memproses...' : 'Tandai Selesai'}
                            </Button>
                        </div>
                    )}
                </div>

                {/* Right Column */}
                <div className="space-y-6">
                    {/* Customer Info */}
                    <div className="bg-white rounded-xl shadow-sm p-4">
                        <h3 className="font-semibold text-neutral-800 mb-4">Pelanggan</h3>
                        <div className="space-y-2">
                            <p className="font-medium text-neutral-800">{customer.name || 'Guest'}</p>
                            <p className="text-sm text-neutral-500">{customer.email || '-'}</p>
                            <p className="text-sm text-neutral-500">{customer.phone || '-'}</p>
                        </div>
                    </div>

                    {/* Shipping Address */}
                    <div className="bg-white rounded-xl shadow-sm p-4">
                        <div className="flex items-center gap-2 mb-4">
                            <MapPin className="w-5 h-5 text-primary-500" />
                            <h3 className="font-semibold text-neutral-800">Alamat Pengiriman</h3>
                        </div>
                        <div className="space-y-1 text-sm">
                            <p className="font-medium text-neutral-800">{address.recipientName || customer.name}</p>
                            <p className="text-neutral-500">{address.phone || customer.phone}</p>
                            <p className="text-neutral-500">{address.fullAddress || address.street || order.shippingAddress}</p>
                            <p className="text-neutral-500">{address.city} {address.postalCode}</p>
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
                                <span className="text-neutral-800">{shipment.courier || order.courier || '-'} {shipment.service || order.courierService || ''}</span>
                            </div>
                            {(shipment.trackingNumber || order.trackingNumber) && (
                                <div className="flex justify-between">
                                    <span className="text-neutral-500">No. Resi</span>
                                    <span className="font-medium text-primary-500">{shipment.trackingNumber || order.trackingNumber}</span>
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
                                <span className="text-neutral-800">{payment.method || order.paymentMethod || '-'}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-neutral-500">Status</span>
                                <Badge variant={order.status === 'PAID' || order.status === 'COMPLETED' ? 'success' : 'warning'} size="sm">
                                    {payment.status || order.paymentStatus || order.status}
                                </Badge>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
