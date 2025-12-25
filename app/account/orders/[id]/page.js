'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Package, Clock, Truck, Check, Copy, MapPin, Search, FileText, Download } from 'lucide-react';
import { Header, Footer } from '@/components/layout';
import { CartDrawer } from '@/components/cart';
import { Button, Badge } from '@/components/ui';
import { formatRupiah, formatDate } from '@/lib/utils';
import useCartStore from '@/store/cart';
import { printInvoice, downloadInvoice } from '@/lib/invoice';

const statusConfig = {
    PENDING_PAYMENT: { label: 'Menunggu Pembayaran', color: 'warning', icon: Clock },
    PAID: { label: 'Dibayar', color: 'primary', icon: Check },
    PROCESSING: { label: 'Sedang Diproses', color: 'primary', icon: Package },
    SHIPPED: { label: 'Dalam Pengiriman', color: 'primary', icon: Truck },
    DELIVERED: { label: 'Diterima', color: 'success', icon: Check },
    COMPLETED: { label: 'Selesai', color: 'success', icon: Check },
    CANCELLED: { label: 'Dibatalkan', color: 'danger', icon: Clock },
};

// Mock data for demo purposes if ID is not found/valid
const mockOrder = {
    id: '1',
    orderNumber: 'INV-241216-ABC123',
    status: 'SHIPPED',
    trackingNumber: 'SOC6900000000000',
    courier: 'jne',
    service: 'REG',
    items: [
        { id: 'p1', name: 'Serum Vitamin C Brightening', image: 'https://images.unsplash.com/photo-1620916566398-39f1143ab7be?w=200', quantity: 2, price: 149000 },
        { id: 'p2', name: 'Moisturizer Hydrating Gel', image: 'https://images.unsplash.com/photo-1611930022073-b7a4ba5fcccd?w=200', quantity: 1, price: 145000 },
    ],
    total: 443000,
    subtotal: 443000,
    shippingCost: 0,
    discount: 0,
    createdAt: '2024-12-16T10:30:00Z',
    paymentMethod: 'BANK_TRANSFER',
    shippingAddress: {
        recipientName: 'Budi Santoso',
        phone: '081234567890',
        address: 'Jl. Merdeka No. 45',
        city: 'Jakarta Pusat',
        province: 'DKI Jakarta',
        postalCode: '10110'
    }
};

export default function OrderDetailPage() {
    const params = useParams();
    const router = useRouter();
    const { addItem, openCart } = useCartStore();

    const [order, setOrder] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [trackingData, setTrackingData] = useState(null);
    const [showTracking, setShowTracking] = useState(false);
    const [trackingLoading, setTrackingLoading] = useState(false);

    // Fetch order details
    useEffect(() => {
        const fetchOrder = async () => {
            try {
                // If ID is simple number (mock), use mock data
                if (['1', '2', '3'].includes(params.id)) {
                    setOrder(mockOrder); // Use specific mock based on ID if needed
                    setLoading(false);
                    return;
                }

                const res = await fetch(`/api/orders/${params.id}`, {
                    headers: {
                        'Authorization': `Bearer ${localStorage.getItem('auth-token')}`
                    }
                });

                if (!res.ok) {
                    throw new Error('Gagal mengambil detail pesanan');
                }

                const data = await res.json();
                setOrder(data.order);
            } catch (err) {
                console.error(err);
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        if (params.id) {
            fetchOrder();
        }
    }, [params.id]);

    // Handle Tracking
    const handleTracking = async () => {
        if (!order?.trackingNumber || !order?.shipment?.courier && !order.courier) return;

        setShowTracking(true);
        if (trackingData) return; // Don't refetch if already have data

        setTrackingLoading(true);
        try {
            const res = await fetch('/api/tracking', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('auth-token')}`
                },
                body: JSON.stringify({
                    waybill: order.trackingNumber,
                    courier: order.shipment?.courier || order.courier
                })
            });

            const data = await res.json();

            if (data.success) {
                setTrackingData(data.data);
            } else {
                throw new Error(data.error);
            }
        } catch (err) {
            console.error('Tracking error:', err);
            // Fallback for mock/error
            setTrackingData({
                summary: { status: 'ON_PROCESS', courier_name: (order.shipment?.courier || order.courier).toUpperCase() },
                manifest: [
                    { manifest_description: 'Paket sedang dalam perjalanan menuju kota tujuan', manifest_date: '2024-12-17', manifest_time: '14:30' },
                    { manifest_description: 'Paket telah diterima oleh agen', manifest_date: '2024-12-16', manifest_time: '10:00' }
                ]
            });
        } finally {
            setTrackingLoading(false);
        }
    };

    // Handle Confirm Receipt
    const handleConfirm = async () => {
        if (!confirm('Apakah pesanan sudah Anda terima dengan baik? Status akan berubah menjadi Selesai.')) return;

        try {
            const res = await fetch(`/api/orders/${params.id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('auth-token')}`
                },
                body: JSON.stringify({ action: 'complete' })
            });

            if (res.ok) {
                alert('Terima kasih! Pesanan telah diselesaikan.');
                // Refresh order
                window.location.reload();
            } else {
                const data = await res.json();
                alert(data.error || 'Gagal konfirmasi pesanan');
            }
        } catch (err) {
            alert('Terjadi kesalahan koneksi');
        }
    };

    const handleReorder = () => {
        order.items.forEach(item => {
            const product = {
                id: item.productId || item.id,
                name: item.product?.name || item.name,
                basePrice: item.priceAtPurchase || item.price,
                stock: 999,
                images: item.product?.images || [item.image]
            };
            addItem(product, item.variantId || null, item.quantity);
        });
        openCart();
        alert('Produk berhasil ditambahkan ke keranjang!');
    };

    if (loading) return <div className="min-h-screen bg-neutral-50 flex items-center justify-center">Loading...</div>;
    if (error || !order) return <div className="min-h-screen bg-neutral-50 flex items-center justify-center">Order tidak ditemukan</div>;

    const StatusIcon = statusConfig[order.status]?.icon || Package;
    const statusColor = statusConfig[order.status]?.color || 'secondary';
    const statusLabel = statusConfig[order.status]?.label || order.status;

    return (
        <>
            <Header />
            <CartDrawer />
            <main className="flex-1 bg-neutral-50">
                <div className="container-app py-8">
                    {/* Header */}
                    <div className="mb-6 flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <Link href="/account/orders" className="p-2 hover:bg-neutral-200 rounded-full transition-colors">
                                <ArrowLeft className="w-5 h-5 text-neutral-600" />
                            </Link>
                            <div>
                                <h1 className="text-2xl font-bold text-neutral-800">Detail Pesanan</h1>
                                <p className="text-neutral-500">#{order.orderNumber}</p>
                            </div>
                        </div>
                        <Badge variant={statusColor} size="lg">
                            <StatusIcon className="w-4 h-4 mr-2" />
                            {statusLabel}
                        </Badge>
                    </div>

                    <div className="grid lg:grid-cols-3 gap-8">
                        {/* Main Content */}
                        <div className="lg:col-span-2 space-y-6">

                            {/* Tracking Section */}
                            {(order.status === 'SHIPPED' || order.status === 'DELIVERED') && (
                                <div className="bg-white rounded-xl shadow-sm p-6">
                                    <div className="flex items-center justify-between mb-4">
                                        <h2 className="font-bold text-neutral-800 flex items-center gap-2">
                                            <Truck className="w-5 h-5 text-primary-500" />
                                            Status Pengiriman
                                        </h2>
                                        {order.trackingNumber && (
                                            <div className="flex items-center gap-2 text-sm text-neutral-500 bg-neutral-100 px-3 py-1 rounded-full">
                                                <span>{order.shipment?.courier?.toUpperCase() || order.courier?.toUpperCase()}</span>
                                                <span className="font-mono">{order.trackingNumber}</span>
                                                <button onClick={() => navigator.clipboard.writeText(order.trackingNumber)} className="hover:text-primary-500">
                                                    <Copy className="w-3 h-3" />
                                                </button>
                                            </div>
                                        )}
                                    </div>

                                    {showTracking ? (
                                        <div className="border rounded-lg p-4 bg-neutral-50">
                                            {trackingLoading ? (
                                                <div className="text-center py-4">Mengambil data...</div>
                                            ) : trackingData ? (
                                                <div className="space-y-4">
                                                    <div className="font-semibold text-green-600 border-b pb-2">
                                                        Status: {trackingData.summary?.status}
                                                    </div>
                                                    <div className="space-y-4 max-h-60 overflow-y-auto">
                                                        {trackingData.manifest?.map((log, idx) => (
                                                            <div key={idx} className="flex gap-3 text-sm">
                                                                <div className="w-24 flex-shrink-0 text-neutral-500 text-xs">
                                                                    <div>{log.manifest_date}</div>
                                                                    <div>{log.manifest_time}</div>
                                                                </div>
                                                                <div className="relative pl-4 border-l-2 border-primary-200">
                                                                    <div className="absolute -left-[5px] top-1 w-2 h-2 rounded-full bg-primary-500"></div>
                                                                    <p className="text-neutral-800">{log.manifest_description}</p>
                                                                    <p className="text-xs text-neutral-500">{log.city_name}</p>
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            ) : (
                                                <div className="text-center text-red-500">Gagal memuat tracking</div>
                                            )}
                                        </div>
                                    ) : (
                                        <Button onClick={handleTracking} variant="outline" className="w-full">
                                            Lacak Paket
                                        </Button>
                                    )}

                                    {order.status === 'SHIPPED' && (
                                        <div className="mt-4 pt-4 border-t">
                                            <p className="text-sm text-neutral-600 mb-2">Sudah menerima paket?</p>
                                            <Button onClick={handleConfirm} className="w-full">
                                                Konfirmasi Pesanan Diterima
                                            </Button>
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Order Items */}
                            <div className="bg-white rounded-xl shadow-sm overflow-hidden">
                                <div className="p-4 border-b border-neutral-100">
                                    <h2 className="font-bold text-neutral-800">Produk Dibeli</h2>
                                </div>
                                <div className="divide-y divide-neutral-100">
                                    {order.items.map((item, idx) => (
                                        <div key={idx} className="p-4 flex gap-4">
                                            <div className="relative w-20 h-20 rounded-lg overflow-hidden bg-neutral-100 flex-shrink-0">
                                                <Image
                                                    src={item.product?.images?.[0] || item.image || '/placeholder.jpg'}
                                                    alt={item.product?.name || item.name}
                                                    fill
                                                    className="object-cover"
                                                />
                                            </div>
                                            <div className="flex-1">
                                                <h3 className="font-medium text-neutral-800">{item.product?.name || item.name}</h3>
                                                {item.variantName && <p className="text-sm text-neutral-500">Varian: {item.variantName}</p>}
                                                <div className="flex justify-between items-center mt-2">
                                                    <p className="text-neutral-500">{item.quantity} x {formatRupiah(item.priceAtPurchase || item.price)}</p>
                                                    <p className="font-semibold text-neutral-800">{formatRupiah((item.priceAtPurchase || item.price) * item.quantity)}</p>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                                <div className="p-4 bg-neutral-50 text-right">
                                    <Button variant="secondary" size="sm" onClick={handleReorder}>
                                        Beli Lagi
                                    </Button>
                                </div>
                            </div>

                        </div>

                        {/* Sidebar */}
                        <div className="space-y-6">
                            {/* Shipping Info */}
                            <div className="bg-white rounded-xl shadow-sm p-6">
                                <h2 className="font-bold text-neutral-800 mb-4 flex items-center gap-2">
                                    <MapPin className="w-5 h-5 text-neutral-400" />
                                    Informasi Pengiriman
                                </h2>
                                <div className="space-y-3 text-sm">
                                    <div>
                                        <p className="font-semibold text-neutral-800">{order.shippingAddress?.recipientName || order.address?.recipientName}</p>
                                        <p className="text-neutral-500">{order.shippingAddress?.phone || order.address?.phone}</p>
                                    </div>
                                    <p className="text-neutral-600 leading-relaxed">
                                        {order.shippingAddress?.address || order.address?.address},<br />
                                        {order.shippingAddress?.city || order.address?.city}, {order.shippingAddress?.province || order.address?.province}<br />
                                        {order.shippingAddress?.postalCode || order.address?.postalCode}
                                    </p>
                                    <div className="pt-3 border-t">
                                        <p className="text-neutral-500">Kurir:</p>
                                        <p className="font-medium">{order.shipment?.courier?.toUpperCase() || order.courier?.toUpperCase() || '-'} - {order.shipment?.serviceType || order.service || '-'}</p>
                                    </div>
                                </div>
                            </div>

                            {/* Payment Info */}
                            <div className="bg-white rounded-xl shadow-sm p-6">
                                <div className="flex items-center justify-between mb-4">
                                    <h2 className="font-bold text-neutral-800">Rincian Pembayaran</h2>
                                    {(order.status === 'PAID' || order.status === 'COMPLETED' || order.status === 'SHIPPED' || order.status === 'DELIVERED') && (
                                        <button
                                            onClick={() => printInvoice(order)}
                                            className="flex items-center gap-1 text-xs text-primary-600 hover:text-primary-700"
                                        >
                                            <FileText className="w-4 h-4" />
                                            Invoice
                                        </button>
                                    )}
                                </div>
                                <div className="space-y-2 text-sm">
                                    <div className="flex justify-between">
                                        <span className="text-neutral-500">Total Harga ({order.items.length} barang)</span>
                                        <span>{formatRupiah(order.subtotal || order.total - (order.shippingCost || 0))}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-neutral-500">Total Ongkos Kirim</span>
                                        <span>{formatRupiah(order.shipment?.cost || order.shippingCost || 0)}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-neutral-500">Diskon</span>
                                        <span className="text-green-600">-{formatRupiah(order.discount || 0)}</span>
                                    </div>
                                    <div className="pt-3 mt-3 border-t border-dashed flex justify-between font-bold text-lg">
                                        <span>Total Belanja</span>
                                        <span className="text-primary-600">{formatRupiah(order.total)}</span>
                                    </div>
                                </div>
                            </div>

                            {order.status === 'PENDING_PAYMENT' && (
                                <Button className="w-full">Bayar Sekarang</Button>
                            )}
                        </div>
                    </div>
                </div>
            </main>
            <Footer />
        </>
    );
}
