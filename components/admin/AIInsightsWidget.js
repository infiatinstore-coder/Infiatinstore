'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

/**
 * AI Insights Widget for Admin Dashboard
 * Displays inventory alerts, recommendations, and quick stats
 */
export default function AIInsightsWidget() {
    const [insights, setInsights] = useState(null);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('alerts');

    useEffect(() => {
        fetchInsights();
    }, []);

    const fetchInsights = async () => {
        try {
            setLoading(true);
            const res = await fetch('/api/ai/inventory-insights');
            if (res.ok) {
                const data = await res.json();
                if (data.success) {
                    setInsights(data.insights);
                }
            }
        } catch (error) {
            console.error('Error fetching AI insights:', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="bg-white rounded-xl border border-gray-200 p-4 animate-pulse">
                <div className="flex items-center gap-2 mb-4">
                    <div className="w-6 h-6 bg-gray-200 rounded-full"></div>
                    <div className="h-5 bg-gray-200 rounded w-32"></div>
                </div>
                <div className="space-y-3">
                    {[1, 2, 3].map(i => (
                        <div key={i} className="h-12 bg-gray-100 rounded-lg"></div>
                    ))}
                </div>
            </div>
        );
    }

    if (!insights) {
        return null;
    }

    const tabs = [
        { id: 'alerts', label: 'Alerts', count: insights.lowStockAlerts.length },
        { id: 'restock', label: 'Restock', count: insights.restockRecommendations.length },
        { id: 'velocity', label: 'Velocity', count: 0 }
    ];

    return (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            {/* Header */}
            <div className="px-4 py-3 bg-gradient-to-r from-teal-500 to-teal-600 text-white">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <span className="text-lg">✨</span>
                        <h3 className="font-semibold">AI Insights</h3>
                    </div>
                    <button
                        onClick={fetchInsights}
                        className="text-white/70 hover:text-white text-xs flex items-center gap-1"
                    >
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                        </svg>
                        Refresh
                    </button>
                </div>
            </div>

            {/* Summary Stats */}
            <div className="grid grid-cols-4 gap-2 p-3 bg-gray-50 border-b">
                <div className="text-center">
                    <p className="text-lg font-bold text-gray-800">{insights.summary.totalProducts}</p>
                    <p className="text-[10px] text-gray-500">Total</p>
                </div>
                <div className="text-center">
                    <p className="text-lg font-bold text-green-600">{insights.summary.healthyStock}</p>
                    <p className="text-[10px] text-gray-500">Sehat</p>
                </div>
                <div className="text-center">
                    <p className="text-lg font-bold text-amber-500">{insights.summary.lowStock}</p>
                    <p className="text-[10px] text-gray-500">Rendah</p>
                </div>
                <div className="text-center">
                    <p className="text-lg font-bold text-red-500">{insights.summary.outOfStock}</p>
                    <p className="text-[10px] text-gray-500">Habis</p>
                </div>
            </div>

            {/* Tabs */}
            <div className="flex border-b">
                {tabs.map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`flex-1 py-2 text-xs font-medium transition ${activeTab === tab.id
                                ? 'text-teal-600 border-b-2 border-teal-600 bg-teal-50/50'
                                : 'text-gray-500 hover:text-gray-700'
                            }`}
                    >
                        {tab.label}
                        {tab.count > 0 && (
                            <span className={`ml-1 px-1.5 py-0.5 rounded-full text-[10px] ${activeTab === tab.id ? 'bg-teal-100 text-teal-700' : 'bg-gray-100'
                                }`}>
                                {tab.count}
                            </span>
                        )}
                    </button>
                ))}
            </div>

            {/* Content */}
            <div className="p-3 max-h-64 overflow-y-auto">
                {activeTab === 'alerts' && (
                    <div className="space-y-2">
                        {insights.lowStockAlerts.length === 0 ? (
                            <p className="text-center text-gray-400 text-sm py-4">
                                ✅ Semua stok dalam kondisi baik
                            </p>
                        ) : (
                            insights.lowStockAlerts.map(alert => (
                                <Link
                                    key={alert.id}
                                    href={`/admin/products/${alert.id}`}
                                    className={`block p-2.5 rounded-lg border transition hover:shadow-sm ${alert.urgency === 'critical' ? 'bg-red-50 border-red-200' :
                                            alert.urgency === 'high' ? 'bg-orange-50 border-orange-200' :
                                                'bg-amber-50 border-amber-200'
                                        }`}
                                >
                                    <div className="flex items-start justify-between gap-2">
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-medium text-gray-800 truncate">
                                                {alert.name}
                                            </p>
                                            <p className="text-xs text-gray-500">
                                                {alert.category} • {alert.salesCount} terjual
                                            </p>
                                        </div>
                                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium whitespace-nowrap ${alert.urgency === 'critical' ? 'bg-red-100 text-red-700' :
                                                alert.urgency === 'high' ? 'bg-orange-100 text-orange-700' :
                                                    'bg-amber-100 text-amber-700'
                                            }`}>
                                            {alert.stock} sisa
                                        </span>
                                    </div>
                                    <p className="text-[11px] mt-1 text-gray-600">{alert.message}</p>
                                </Link>
                            ))
                        )}
                    </div>
                )}

                {activeTab === 'restock' && (
                    <div className="space-y-2">
                        {insights.restockRecommendations.length === 0 ? (
                            <p className="text-center text-gray-400 text-sm py-4">
                                📦 Tidak ada rekomendasi restock saat ini
                            </p>
                        ) : (
                            insights.restockRecommendations.map(rec => (
                                <div
                                    key={rec.productId}
                                    className={`p-2.5 rounded-lg border ${rec.urgency === 'urgent' ? 'bg-red-50 border-red-200' :
                                            rec.urgency === 'soon' ? 'bg-amber-50 border-amber-200' :
                                                'bg-blue-50 border-blue-200'
                                        }`}
                                >
                                    <div className="flex items-center justify-between mb-1">
                                        <p className="text-sm font-medium text-gray-800 truncate">
                                            {rec.productName}
                                        </p>
                                        <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${rec.urgency === 'urgent' ? 'bg-red-100 text-red-700' :
                                                rec.urgency === 'soon' ? 'bg-amber-100 text-amber-700' :
                                                    'bg-blue-100 text-blue-700'
                                            }`}>
                                            {rec.daysUntilEmpty}d
                                        </span>
                                    </div>
                                    <p className="text-[11px] text-gray-600">{rec.message}</p>
                                    <p className="text-[10px] text-gray-500 mt-1">
                                        Rekomendasi: +{rec.recommendedRestock} unit
                                    </p>
                                </div>
                            ))
                        )}
                    </div>
                )}

                {activeTab === 'velocity' && (
                    <div className="space-y-2">
                        {insights.salesVelocity.map(item => (
                            <div
                                key={item.productId}
                                className="p-2.5 rounded-lg bg-gray-50 border border-gray-100"
                            >
                                <div className="flex items-center justify-between mb-1">
                                    <p className="text-sm font-medium text-gray-800 truncate">
                                        {item.productName}
                                    </p>
                                    <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${item.velocity === 'fast' ? 'bg-green-100 text-green-700' :
                                            item.velocity === 'medium' ? 'bg-amber-100 text-amber-700' :
                                                'bg-gray-100 text-gray-600'
                                        }`}>
                                        {item.velocity === 'fast' ? '🔥 Laris' :
                                            item.velocity === 'medium' ? '📈 Sedang' : '📊 Lambat'}
                                    </span>
                                </div>
                                <div className="flex items-center gap-3 text-[11px] text-gray-500">
                                    <span>{item.soldLast30Days} terjual/30d</span>
                                    <span>~{item.dailyAverage}/hari</span>
                                    <span>Stok: {item.currentStock}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Footer */}
            <div className="px-3 py-2 bg-gray-50 border-t">
                <Link
                    href="/admin/products"
                    className="text-xs text-teal-600 hover:text-teal-700 font-medium flex items-center justify-center gap-1"
                >
                    Kelola Semua Produk
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                </Link>
            </div>
        </div>
    );
}
