'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Package, Clock, Truck, Check, ChevronRight, Search, RotateCcw } from 'lucide-react';
import { Header, Footer } from '@/components/layout';
import { CartDrawer } from '@/components/cart';
import { Button, Badge } from '@/components/ui';
import { formatRupiah, formatDate } from '@/lib/utils';
import useCartStore from '@/store/cart';

// Mock orders data (di real app, ini dari API GET /api/orders)
const mockOrders = [
    {
        id: '1',
        orderNumber: 'INV-241216-ABC123',
        status: 'SHIPPED',
        trackingNumber: 'SOC6900000000000', // Contoh resi JNE
        courier: 'jne',
        items: [
            { id: 'p1', name: 'Serum Vitamin C Brightening', image: 'https://images.unsplash.com/photo-1620916566398-39f1143ab7be?w=200', quantity: 2, price: 149000 },
            { id: 'p2', name: 'Moisturizer Hydrating Gel', image: 'https://images.unsplash.com/photo-1611930022073-b7a4ba5fcccd?w=200', quantity: 1, price: 145000 },
        ],
        total: 443000,
        createdAt: '2024-12-16T10:30:00Z',
    },
    {
        id: '2',
        orderNumber: 'INV-241210-DEF456',
        status: 'DELIVERED', // Asumsi sudah sampai tapi belum confirm
        items: [
            { id: 'p3', name: 'Sunscreen SPF 50+ PA++++', image: 'https://images.unsplash.com/photo-1556228578-0d85b1a4d571?w=200', quantity: 1, price: 159000 },
        ],
        total: 174000,
        createdAt: '2024-12-10T14:20:00Z',
    },
    {
        id: '3',
        orderNumber: 'INV-241205-GHI789',
        status: 'COMPLETED',
        items: [
            { id: 'p4', name: 'Lipstick Matte Velvet', image: 'https://images.unsplash.com/photo-1586495777744-4413f21062fa?w=200', quantity: 3, price: 99000 },
        ],
        total: 312000,
        createdAt: '2024-12-05T09:15:00Z',
    },
];

const statusConfig = {
    PENDING_PAYMENT: { label: 'Menunggu Pembayaran', color: 'warning', icon: Clock },
    PAID: { label: 'Dibayar', color: 'primary', icon: Check },
    PROCESSING: { label: 'Sedang Diproses', color: 'primary', icon: Package },
    SHIPPED: { label: 'Dalam Pengiriman', color: 'primary', icon: Truck },
    DELIVERED: { label: 'Diterima', color: 'success', icon: Check },
    COMPLETED: { label: 'Selesai', color: 'success', icon: Check },
    CANCELLED: { label: 'Dibatalkan', color: 'danger', icon: Clock },
};

const tabs = [
    { value: '', label: 'Semua' },
    { value: 'PENDING_PAYMENT', label: 'Belum Bayar' },
    { value: 'PROCESSING', label: 'Diproses' },
    { value: 'SHIPPED', label: 'Dikirim' },
    { value: 'COMPLETED', label: 'Selesai' },
];

export default function OrdersPage() {
    const router = useRouter();
    const { addItem, openCart } = useCartStore();
    const [activeTab, setActiveTab] = useState('');
    const [search, setSearch] = useState('');

    const filteredOrders = mockOrders.filter((order) => {
        const matchesTab = !activeTab || order.status === activeTab ||
            (activeTab === 'COMPLETED' && (order.status === 'COMPLETED' || order.status === 'DELIVERED'));
        const matchesSearch = order.orderNumber.toLowerCase().includes(search.toLowerCase());
        return matchesTab && matchesSearch;
    });

    const handleReorder = (order) => {
        // Add all items from order to cart
        order.items.forEach(item => {
            // Mapping mock item to product structure expected by addItem
            const product = {
                id: item.id || `mock-${Math.random()}`,
                name: item.name,
                basePrice: item.price,
                stock: 99, // Mock stock
                images: [item.image]
            };
            addItem(product, null, item.quantity);
        });

        openCart();
        // Optional: redirect to cart or stay here
        // router.push('/cart'); 
        alert('Produk berhasil ditambahkan ke keranjang!');
    };

    return (
        <>
            <Header />
            <CartDrawer />
            <main className="flex-1 bg-neutral-50">
                <div className="container-app py-8">
                    {/* Header */}
                    <div className="mb-6">
                        <Link href="/account" className="inline-flex items-center gap-2 text-neutral-500 hover:text-primary-500 mb-2">
                            <ArrowLeft className="w-4 h-4" />
                            Kembali ke Akun
                        </Link>
                        <h1 className="text-2xl font-bold text-neutral-800">Pesanan Saya</h1>
                    </div>

                    {/* Tabs */}
                    <div className="bg-white rounded-xl shadow-sm mb-6">
                        <div className="flex overflow-x-auto hide-scrollbar border-b border-neutral-100">
                            {tabs.map((tab) => (
                                <button
                                    key={tab.value}
                                    onClick={() => setActiveTab(tab.value)}
                                    className={`px-6 py-4 font-medium whitespace-nowrap transition-colors relative ${activeTab === tab.value
                                        ? 'text-primary-500'
                                        : 'text-neutral-500 hover:text-neutral-700'
                                        }`}
                                >
                                    {tab.label}
                                    {activeTab === tab.value && (
                                        <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary-500" />
                                    )}
                                </button>
                            ))}
                        </div>

                        {/* Search */}
                        <div className="p-4">
                            <div className="relative max-w-md">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400" />
                                <input
                                    type="text"
                                    placeholder="Cari nomor pesanan..."
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-neutral-200 focus:outline-none focus:border-primary-500"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Orders List */}
                    {filteredOrders.length > 0 ? (
                        <div className="space-y-4">
                            {filteredOrders.map((order) => {
                                const StatusIcon = statusConfig[order.status]?.icon || Package;
                                const statusLabel = statusConfig[order.status]?.label || order.status;
                                const statusColor = statusConfig[order.status]?.color || 'secondary';

                                return (
                                    <div key={order.id} className="bg-white rounded-xl shadow-sm overflow-hidden">
                                        {/* Order Header */}
                                        <div className="p-4 border-b border-neutral-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                                            <div className="flex items-center gap-3">
                                                <StatusIcon className="w-5 h-5 text-primary-500" />
                                                <div>
                                                    <p className="font-semibold text-neutral-800">{order.orderNumber}</p>
                                                    <p className="text-sm text-neutral-500">
                                                        {formatDate(order.createdAt, { day: 'numeric', month: 'long', year: 'numeric' })}
                                                    </p>
                                                </div>
                                            </div>
                                            <Badge variant={statusColor}>
                                                {statusLabel}
                                            </Badge>
                                        </div>

                                        {/* Order Items */}
                                        <div className="p-4">
                                            {order.items.map((item, index) => (
                                                <div key={index} className={`flex gap-4 ${index > 0 ? 'mt-4 pt-4 border-t border-neutral-100' : ''}`}>
                                                    <div className="relative w-16 h-16 rounded-lg overflow-hidden bg-neutral-100 flex-shrink-0">
                                                        <Image src={item.image} alt={item.name} fill className="object-cover" />
                                                    </div>
                                                    <div className="flex-1">
                                                        <p className="font-medium text-neutral-800">{item.name}</p>
                                                        <p className="text-sm text-neutral-500">{item.quantity} x {formatRupiah(item.price)}</p>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>

                                        {/* Order Footer */}
                                        <div className="p-4 bg-neutral-50 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                            <div>
                                                <p className="text-sm text-neutral-500">Total Pesanan</p>
                                                <p className="text-lg font-bold text-primary-500">{formatRupiah(order.total)}</p>
                                            </div>
                                            <div className="flex gap-2">
                                                {order.status === 'COMPLETED' && (
                                                    <Button
                                                        variant="secondary"
                                                        size="sm"
                                                        onClick={() => handleReorder(order)}
                                                        className="flex items-center gap-2"
                                                    >
                                                        <RotateCcw className="w-3 h-3" />
                                                        Beli Lagi
                                                    </Button>
                                                )}
                                                <Link href={`/account/orders/${order.id}`}>
                                                    <Button size="sm">
                                                        Lihat Detail
                                                        <ChevronRight className="w-4 h-4" />
                                                    </Button>
                                                </Link>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    ) : (
                        <div className="bg-white rounded-xl shadow-sm p-12 text-center">
                            <Package className="w-16 h-16 text-neutral-300 mx-auto mb-4" />
                            <h3 className="text-lg font-semibold text-neutral-800 mb-2">Belum ada pesanan</h3>
                            <p className="text-neutral-500 mb-6">Yuk mulai belanja dan temukan produk favoritmu!</p>
                            <Link href="/products">
                                <Button>Mulai Belanja</Button>
                            </Link>
                        </div>
                    )}
                </div>
            </main>
            <Footer />
        </>
    );
}
