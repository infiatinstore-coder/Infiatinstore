'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Clock, AlertCircle, ArrowRight, RefreshCw } from 'lucide-react';
import { Header, Footer } from '@/components/layout';
import { Button } from '@/components/ui';

export default function OrderPendingPage({ params }) {
    const [order, setOrder] = useState(null);
    const [payment, setPayment] = useState(null);
    const orderId = params.id;

    useEffect(() => {
        // Fetch order & payment details
        const fetchOrderDetails = async () => {
            try {
                const [orderRes, paymentRes] = await Promise.all([
                    fetch(`/api/orders/${orderId}`),
                    fetch(`/api/payment/status?orderId=${orderId}`),
                ]);

                if (orderRes.ok) {
                    const orderData = await orderRes.json();
                    setOrder(orderData.order);
                }

                if (paymentRes.ok) {
                    const paymentData = await paymentRes.json();
                    setPayment(paymentData.payment);
                }
            } catch (error) {
                console.error('Failed to fetch order details:', error);
            }
        };

        if (orderId) {
            fetchOrderDetails();
        }
    }, [orderId]);

    return (
        <>
            <Header />
            <main className="flex-1 bg-neutral-50 flex items-center justify-center py-20">
                <div className="container-app max-w-2xl">
                    <div className="bg-white rounded-3xl p-8 md:p-12 text-center">
                        {/* Pending Icon */}
                        <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-yellow-100 mb-6">
                            <Clock className="w-12 h-12 text-yellow-600" />
                        </div>

                        {/* Pending Message */}
                        <h1 className="text-3xl font-bold text-neutral-800 mb-4">
                            Menunggu Pembayaran ⏳
                        </h1>
                        <p className="text-neutral-600 mb-8">
                            Pesanan Anda telah dibuat. Silakan selesaikan pembayaran untuk melanjutkan.
                        </p>

                        {/* Order Info */}
                        {order && (
                            <div className="bg-neutral-50 rounded-2xl p-6 mb-8 text-left">
                                <div className="grid gap-4">
                                    <div className="flex justify-between">
                                        <span className="text-neutral-500">Nomor Pesanan</span>
                                        <span className="font-semibold text-neutral-800">
                                            {order.orderNumber}
                                        </span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-neutral-500">Total Pembayaran</span>
                                        <span className="font-bold text-primary-500">
                                            Rp {order.total?.toLocaleString('id-ID')}
                                        </span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-neutral-500">Status</span>
                                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-yellow-100 text-yellow-700 text-sm font-medium">
                                            <Clock className="w-4 h-4" />
                                            Menunggu Pembayaran
                                        </span>
                                    </div>
                                    {payment?.expiresAt && (
                                        <div className="flex justify-between">
                                            <span className="text-neutral-500">Batas Waktu</span>
                                            <span className="font-medium text-red-600">
                                                {new Date(payment.expiresAt).toLocaleString('id-ID')}
                                            </span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* Payment Instructions */}
                        <div className="bg-blue-50 rounded-2xl p-6 mb-8 text-left">
                            <h3 className="font-semibold text-neutral-800 mb-4 flex items-center gap-2">
                                <AlertCircle className="w-5 h-5 text-blue-600" />
                                Cara Pembayaran
                            </h3>
                            <ol className="space-y-3 text-sm text-neutral-600">
                                <li className="flex items-start gap-2">
                                    <span className="flex-shrink-0 w-5 h-5 rounded-full bg-blue-600 text-white text-xs flex items-center justify-center font-semibold">
                                        1
                                    </span>
                                    <span>Cek email Anda untuk instruksi pembayaran lengkap</span>
                                </li>
                                <li className="flex items-start gap-2">
                                    <span className="flex-shrink-0 w-5 h-5 rounded-full bg-blue-600 text-white text-xs flex items-center justify-center font-semibold">
                                        2
                                    </span>
                                    <span>Lakukan pembayaran sesuai metode yang Anda pilih</span>
                                </li>
                                <li className="flex items-start gap-2">
                                    <span className="flex-shrink-0 w-5 h-5 rounded-full bg-blue-600 text-white text-xs flex items-center justify-center font-semibold">
                                        3
                                    </span>
                                    <span>Status pesanan akan otomatis berubah setelah pembayaran dikonfirmasi</span>
                                </li>
                            </ol>
                        </div>

                        {/* Warning */}
                        <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-8 text-left">
                            <p className="text-sm text-red-700">
                                <strong>⚠️ Penting:</strong> Harap selesaikan pembayaran sebelum batas waktu.
                                Pesanan akan otomatis dibatalkan jika pembayaran tidak diterima.
                            </p>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex flex-col sm:flex-row gap-4 justify-center">
                            <Link href={`/account/orders/${orderId}`}>
                                <Button variant="secondary" className="w-full sm:w-auto">
                                    <RefreshCw className="w-4 h-4" />
                                    Cek Status Pembayaran
                                </Button>
                            </Link>
                            <Link href="/products">
                                <Button className="w-full sm:w-auto">
                                    Kembali Belanja
                                    <ArrowRight className="w-4 h-4" />
                                </Button>
                            </Link>
                        </div>
                    </div>
                </div>
            </main>
            <Footer />
        </>
    );
}
