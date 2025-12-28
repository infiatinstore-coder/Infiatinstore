'use client';

import { LineChart, Line, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

export function SalesChart({ data, type = 'line' }) {
    const formatCurrency = (value) => {
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            minimumFractionDigits: 0,
        }).format(value);
    };

    const formatDate = (dateStr) => {
        const date = new Date(dateStr);
        return date.toLocaleDateString('id-ID', { month: 'short', day: 'numeric' });
    };

    const CustomTooltip = ({ active, payload }) => {
        if (active && payload && payload.length) {
            return (
                <div className="bg-white px-4 py-3 rounded-lg shadow-lg border border-neutral-200">
                    <p className="text-sm text-neutral-500 mb-1">
                        {formatDate(payload[0].payload.date)}
                    </p>
                    <p className="text-lg font-bold text-primary-600">
                        {formatCurrency(payload[0].value)}
                    </p>
                    <p className="text-sm text-neutral-600">
                        {payload[0].payload.orders} pesanan
                    </p>
                </div>
            );
        }
        return null;
    };

    const chartProps = {
        width: '100%',
        height: 300,
        data,
        margin: { top: 5, right: 30, left: 20, bottom: 5 },
    };

    return (
        <ResponsiveContainer width="100%" height={300}>
            {type === 'area' ? (
                <AreaChart {...chartProps}>
                    <defs>
                        <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#667eea" stopOpacity={0.8} />
                            <stop offset="95%" stopColor="#667eea" stopOpacity={0} />
                        </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis
                        dataKey="date"
                        tickFormatter={formatDate}
                        stroke="#64748b"
                        fontSize={12}
                    />
                    <YAxis
                        tickFormatter={(value) => `${(value / 1000000).toFixed(1)}M`}
                        stroke="#64748b"
                        fontSize={12}
                    />
                    <Tooltip content={<CustomTooltip />} />
                    <Area
                        type="monotone"
                        dataKey="revenue"
                        stroke="#667eea"
                        strokeWidth={2}
                        fillOpacity={1}
                        fill="url(#colorRevenue)"
                    />
                </AreaChart>
            ) : (
                <LineChart {...chartProps}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis
                        dataKey="date"
                        tickFormatter={formatDate}
                        stroke="#64748b"
                        fontSize={12}
                    />
                    <YAxis
                        tickFormatter={(value) => `${(value / 1000000).toFixed(1)}M`}
                        stroke="#64748b"
                        fontSize={12}
                    />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend />
                    <Line
                        type="monotone"
                        dataKey="revenue"
                        stroke="#667eea"
                        strokeWidth={3}
                        dot={{ fill: '#667eea', r: 4 }}
                        activeDot={{ r: 6 }}
                        name="Revenue"
                    />
                </LineChart>
            )}
        </ResponsiveContainer>
    );
}
