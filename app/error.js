'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';
import { Button } from '@/components/ui';

export default function Error({ error, reset }) {
    useEffect(() => {
        console.error(error);
    }, [error]);

    return (
        <div className="min-h-screen bg-gradient-to-br from-red-50 via-white to-orange-50 flex items-center justify-center p-4">
            <div className="text-center max-w-md">
                <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
                    <AlertTriangle className="w-10 h-10 text-red-500" />
                </div>

                <h1 className="text-3xl font-display font-bold text-neutral-800 mb-4">
                    Oops! Terjadi Kesalahan
                </h1>
                <p className="text-neutral-600 mb-8">
                    Maaf, terjadi kesalahan yang tidak terduga. Tim kami telah diberitahu dan sedang memperbaiki masalah ini.
                </p>

                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                    <Button onClick={() => reset()}>
                        <RefreshCw className="w-4 h-4" />
                        Coba Lagi
                    </Button>
                    <Link href="/">
                        <Button variant="secondary">
                            <Home className="w-4 h-4" />
                            Kembali ke Home
                        </Button>
                    </Link>
                </div>

                <div className="mt-12 pt-8 border-t border-neutral-200">
                    <p className="text-sm text-neutral-500 mb-2">Butuh bantuan?</p>
                    <Link href="/help" className="text-primary-500 hover:underline">
                        Hubungi Customer Service
                    </Link>
                </div>
            </div>
        </div>
    );
}
