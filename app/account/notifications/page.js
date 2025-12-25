'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Bell, Package, Tag, MessageCircle, ChevronRight, Check, Trash2 } from 'lucide-react';
import { Header, Footer } from '@/components/layout';
import { CartDrawer } from '@/components/cart';
import { Button } from '@/components/ui';
import useUserStore from '@/store/user';
import { formatDistanceToNow } from '@/lib/utils';

// Mock notifications data - akan diganti dengan API call
const mockNotifications = [
    {
        id: '1',
        type: 'ORDER',
        title: 'Pesanan Dikirim',
        message: 'Pesanan #INF20241222001 telah dikirim. Lacak pengirimanmu sekarang!',
        data: { orderId: 'INF20241222001' },
        read: false,
        createdAt: new Date(Date.now() - 1000 * 60 * 30), // 30 mins ago
    },
    {
        id: '2',
        type: 'PROMO',
        title: '🎉 Flash Sale Dimulai!',
        message: 'Diskon hingga 70% untuk produk skincare. Buruan sebelum kehabisan!',
        data: { link: '/flash-sale' },
        read: false,
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 2), // 2 hours ago
    },
    {
        id: '3',
        type: 'ORDER',
        title: 'Pembayaran Dikonfirmasi',
        message: 'Pembayaran untuk pesanan #INF20241221005 telah dikonfirmasi.',
        data: { orderId: 'INF20241221005' },
        read: true,
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24), // 1 day ago
    },
    {
        id: '4',
        type: 'SYSTEM',
        title: 'Selamat Datang di Infiatin Store!',
        message: 'Terima kasih sudah mendaftar. Nikmati gratis ongkir untuk pembelian pertamamu dengan kode PERTAMA.',
        data: null,
        read: true,
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 7), // 7 days ago
    },
];

const notificationIcons = {
    ORDER: Package,
    PROMO: Tag,
    SYSTEM: Bell,
    CHAT: MessageCircle,
};

const notificationColors = {
    ORDER: 'bg-blue-100 text-blue-600',
    PROMO: 'bg-red-100 text-red-600',
    SYSTEM: 'bg-primary-100 text-primary-600',
    CHAT: 'bg-green-100 text-green-600',
};

export default function NotificationsPage() {
    const { isAuthenticated } = useUserStore();
    const [notifications, setNotifications] = useState(mockNotifications);
    const [filter, setFilter] = useState('all'); // all, unread

    const filteredNotifications = filter === 'unread'
        ? notifications.filter(n => !n.read)
        : notifications;

    const unreadCount = notifications.filter(n => !n.read).length;

    const markAsRead = (id) => {
        setNotifications(prev =>
            prev.map(n => n.id === id ? { ...n, read: true } : n)
        );
    };

    const markAllAsRead = () => {
        setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    };

    const deleteNotification = (id) => {
        setNotifications(prev => prev.filter(n => n.id !== id));
    };

    const formatTime = (date) => {
        const now = new Date();
        const diff = now - date;
        const minutes = Math.floor(diff / 60000);
        const hours = Math.floor(diff / 3600000);
        const days = Math.floor(diff / 86400000);

        if (minutes < 60) return `${minutes} menit lalu`;
        if (hours < 24) return `${hours} jam lalu`;
        if (days < 7) return `${days} hari lalu`;
        return date.toLocaleDateString('id-ID');
    };

    if (!isAuthenticated) {
        return (
            <>
                <Header />
                <CartDrawer />
                <main className="flex-1 bg-neutral-50 flex items-center justify-center">
                    <div className="text-center px-4">
                        <Bell className="w-16 h-16 text-neutral-300 mx-auto mb-4" />
                        <h1 className="text-xl font-bold text-neutral-800 mb-2">
                            Notifikasi
                        </h1>
                        <p className="text-neutral-500 mb-6">
                            Masuk untuk melihat notifikasi
                        </p>
                        <Link href="/auth/login">
                            <Button>Masuk</Button>
                        </Link>
                    </div>
                </main>
                <Footer />
            </>
        );
    }

    return (
        <>
            <Header />
            <CartDrawer />
            <main className="flex-1 bg-neutral-50">
                <div className="container-app py-6">
                    {/* Header */}
                    <div className="flex items-center justify-between mb-6">
                        <div>
                            <h1 className="text-2xl font-bold text-neutral-800">Notifikasi</h1>
                            {unreadCount > 0 && (
                                <p className="text-sm text-neutral-500">
                                    {unreadCount} notifikasi belum dibaca
                                </p>
                            )}
                        </div>
                        {unreadCount > 0 && (
                            <Button variant="ghost" size="sm" onClick={markAllAsRead}>
                                <Check className="w-4 h-4" />
                                Tandai Semua Dibaca
                            </Button>
                        )}
                    </div>

                    {/* Filter Tabs */}
                    <div className="flex gap-2 mb-6">
                        <button
                            onClick={() => setFilter('all')}
                            className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${filter === 'all'
                                    ? 'bg-primary-500 text-white'
                                    : 'bg-white text-neutral-600 hover:bg-neutral-100'
                                }`}
                        >
                            Semua
                        </button>
                        <button
                            onClick={() => setFilter('unread')}
                            className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${filter === 'unread'
                                    ? 'bg-primary-500 text-white'
                                    : 'bg-white text-neutral-600 hover:bg-neutral-100'
                                }`}
                        >
                            Belum Dibaca
                            {unreadCount > 0 && (
                                <span className="ml-2 px-2 py-0.5 bg-red-500 text-white text-xs rounded-full">
                                    {unreadCount}
                                </span>
                            )}
                        </button>
                    </div>

                    {/* Notifications List */}
                    {filteredNotifications.length > 0 ? (
                        <div className="space-y-3">
                            {filteredNotifications.map((notification) => {
                                const Icon = notificationIcons[notification.type] || Bell;
                                const colorClass = notificationColors[notification.type] || 'bg-neutral-100 text-neutral-600';

                                return (
                                    <div
                                        key={notification.id}
                                        className={`bg-white rounded-xl p-4 shadow-sm transition-all ${!notification.read ? 'border-l-4 border-primary-500' : ''
                                            }`}
                                        onClick={() => markAsRead(notification.id)}
                                    >
                                        <div className="flex gap-4">
                                            <div className={`w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 ${colorClass}`}>
                                                <Icon className="w-6 h-6" />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-start justify-between gap-2">
                                                    <h3 className={`font-semibold ${!notification.read ? 'text-neutral-800' : 'text-neutral-600'}`}>
                                                        {notification.title}
                                                    </h3>
                                                    <span className="text-xs text-neutral-400 whitespace-nowrap">
                                                        {formatTime(notification.createdAt)}
                                                    </span>
                                                </div>
                                                <p className="text-sm text-neutral-500 mt-1 line-clamp-2">
                                                    {notification.message}
                                                </p>
                                                <div className="flex items-center justify-between mt-3">
                                                    {notification.data?.orderId && (
                                                        <Link
                                                            href={`/orders/${notification.data.orderId}`}
                                                            className="text-sm text-primary-500 font-medium hover:underline flex items-center gap-1"
                                                        >
                                                            Lihat Detail
                                                            <ChevronRight className="w-4 h-4" />
                                                        </Link>
                                                    )}
                                                    {notification.data?.link && (
                                                        <Link
                                                            href={notification.data.link}
                                                            className="text-sm text-primary-500 font-medium hover:underline flex items-center gap-1"
                                                        >
                                                            Lihat Promo
                                                            <ChevronRight className="w-4 h-4" />
                                                        </Link>
                                                    )}
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            deleteNotification(notification.id);
                                                        }}
                                                        className="text-neutral-400 hover:text-red-500 transition-colors ml-auto"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    ) : (
                        <div className="bg-white rounded-xl p-12 text-center">
                            <Bell className="w-16 h-16 text-neutral-300 mx-auto mb-4" />
                            <h3 className="text-lg font-semibold text-neutral-800 mb-2">
                                Tidak ada notifikasi
                            </h3>
                            <p className="text-neutral-500">
                                {filter === 'unread'
                                    ? 'Semua notifikasi sudah dibaca'
                                    : 'Kamu belum memiliki notifikasi'}
                            </p>
                        </div>
                    )}
                </div>
            </main>
            <Footer />
        </>
    );
}
