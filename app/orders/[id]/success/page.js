'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { CheckCircle, Package, Clock, ArrowRight } from 'lucide-react';
import { Header, Footer } from '@/components/layout';
import { Button } from '@/components/ui';

export default function OrderSuccessPage({ params }) {
    const [order, setOrder] = useState(null);
    const orderId = params.id;

    useEffect(() => {
        // Fetch order details
        const fetchOrder = async () => {
            try {
                const response = await fetch(`/api/orders/${orderId}`);
                if (response.ok) {
                    const data = await response.json();
                    setOrder(data.order);
                }
            } catch (error) {
                console.error('Failed to fetch order:', error);
            }
        };

        if (orderId) {
            fetchOrder();
        }
    }, [orderId]);

    return (
        <>
            <Header />
            <main className="flex-1 bg-neutral-50 flex items-center justify-center py-20">
                <div className="container-app max-w-2xl">
                    <div className="bg-white rounded-3xl p-8 md:p-12 text-center">
                        {/* Success Icon */}
                        <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-green-100 mb-6">
                            <CheckCircle className="w-12 h-12 text-green-600" />
                        </div>

                        {/* Success Message */}
                        <h1 className="text-3xl font-bold text-neutral-800 mb-4">
                            Pembayaran Berhasil! 🎉
                        </h1>
                        <p className="text-neutral-600 mb-8">
                            Terima kasih atas pembelian Anda. Pesanan Anda sedang diproses.
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
                                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-green-100 text-green-700 text-sm font-medium">
                                            <CheckCircle className="w-4 h-4" />
                                            Dibayar
                                        </span>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Next Steps */}
                        <div className="bg-blue-50 rounded-2xl p-6 mb-8 text-left">
                            <h3 className="font-semibold text-neutral-800 mb-4 flex items-center gap-2">
                                <Package className="w-5 h-5 text-blue-600" />
                                Langkah Selanjutnya
                            </h3>
                            <ol className="space-y-3 text-sm text-neutral-600">
                                <li className="flex items-start gap-2">
                                    <span className="flex-shrink-0 w-5 h-5 rounded-full bg-blue-600 text-white text-xs flex items-center justify-center font-semibold">
                                        1
                                    </span>
                                    <span>Kami akan mengirim email konfirmasi ke alamat email Anda</span>
                                </li>
                                <li className="flex items-start gap-2">
                                    <span className="flex-shrink-0 w-5 h-5 rounded-full bg-blue-600 text-white text-xs flex items-center justify-center font-semibold">
                                        2
                                    </span>
                                    <span>Pesanan akan diproses dalam 1-2 hari kerja</span>
                                </li>
                                <li className="flex items-start gap-2">
                                    <span className="flex-shrink-0 w-5 h-5 rounded-full bg-blue-600 text-white text-xs flex items-center justify-center font-semibold">
                                        3
                                    </span>
                                    <span>Anda dapat melacak status pesanan di halaman "Pesanan Saya"</span>
                                </li>
                            </ol>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex flex-col sm:flex-row gap-4 justify-center">
                            <Link href={`/account/orders/${orderId}`}>
                                <Button variant="secondary" className="w-full sm:w-auto">
                                    Lihat Detail Pesanan
                                </Button>
                            </Link>
                            <Link href="/products">
                                <Button className="w-full sm:w-auto">
                                    Lanjut Belanja
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
