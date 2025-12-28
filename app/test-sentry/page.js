'use client';

import { useState } from 'react';

export default function TestSentryPage() {
    const [error, setError] = useState(null);

    const triggerError = () => {
        try {
            // Intentional error untuk test Sentry
            throw new Error('🧪 Test Sentry Error - This is intentional!');
        } catch (err) {
            setError(err.message);
            // Re-throw untuk Sentry capture
            throw err;
        }
    };

    const triggerUndefinedError = () => {
        // Undefined error
        const obj = null;
        console.log(obj.property); // This will throw
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 p-8">
            <div className="max-w-2xl mx-auto">
                <div className="bg-white rounded-2xl shadow-xl p-8">
                    <h1 className="text-3xl font-bold text-gray-800 mb-2">
                        🔍 Sentry Test Page
                    </h1>
                    <p className="text-gray-600 mb-8">
                        Klik tombol di bawah untuk test error monitoring
                    </p>

                    {error && (
                        <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-6">
                            <p className="text-red-700 font-medium">Error Triggered:</p>
                            <p className="text-red-600 text-sm mt-1">{error}</p>
                        </div>
                    )}

                    <div className="space-y-4">
                        <button
                            onClick={triggerError}
                            className="w-full bg-red-500 hover:bg-red-600 text-white font-semibold py-4 px-6 rounded-lg transition-colors shadow-md hover:shadow-lg"
                        >
                            🚨 Trigger Handled Error
                        </button>

                        <button
                            onClick={triggerUndefinedError}
                            className="w-full bg-orange-500 hover:bg-orange-600 text-white font-semibold py-4 px-6 rounded-lg transition-colors shadow-md hover:shadow-lg"
                        >
                            ⚠️ Trigger Undefined Error
                        </button>
                    </div>

                    <div className="mt-8 p-4 bg-blue-50 rounded-lg">
                        <h3 className="font-semibold text-blue-900 mb-2">📊 What to check:</h3>
                        <ol className="list-decimal list-inside text-sm text-blue-800 space-y-1">
                            <li>Klik salah satu tombol error di atas</li>
                            <li>Buka dashboard Sentry: <a href="https://sentry.io" target="_blank" rel="noopener noreferrer" className="underline">sentry.io</a></li>
                            <li>Pilih project: <strong>javascript-nextjs</strong></li>
                            <li>Lihat di tab <strong>Issues</strong></li>
                            <li>Error harus muncul dalam beberapa detik</li>
                        </ol>
                    </div>

                    <div className="mt-6 p-4 bg-green-50 rounded-lg">
                        <h3 className="font-semibold text-green-900 mb-2">✅ Expected Result:</h3>
                        <ul className="list-disc list-inside text-sm text-green-800 space-y-1">
                            <li>Error muncul di Sentry dashboard</li>
                            <li>Stack trace lengkap terlihat</li>
                            <li>Browser info & user context tercatat</li>
                            <li>Notifikasi email terkirim (jika enabled)</li>
                        </ul>
                    </div>
                </div>

                <div className="mt-8 text-center">
                    <a
                        href="/"
                        className="text-blue-600 hover:text-blue-800 font-medium"
                    >
                        ← Kembali ke Home
                    </a>
                </div>
            </div>
        </div>
    );
}
