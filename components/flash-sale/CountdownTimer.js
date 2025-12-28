'use client';

import { useState, useEffect } from 'react';

export function CountdownTimer({ endTime, onExpire }) {
    const [timeLeft, setTimeLeft] = useState(calculateTimeLeft());

    function calculateTimeLeft() {
        const difference = new Date(endTime).getTime() - Date.now();

        if (difference <= 0) {
            return { days: 0, hours: 0, minutes: 0, seconds: 0, expired: true };
        }

        return {
            days: Math.floor(difference / (1000 * 60 * 60 * 24)),
            hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
            minutes: Math.floor((difference / 1000 / 60) % 60),
            seconds: Math.floor((difference / 1000) % 60),
            expired: false,
        };
    }

    useEffect(() => {
        const timer = setInterval(() => {
            const newTimeLeft = calculateTimeLeft();
            setTimeLeft(newTimeLeft);

            if (newTimeLeft.expired && onExpire) {
                onExpire();
                clearInterval(timer);
            }
        }, 1000);

        return () => clearInterval(timer);
    }, [endTime, onExpire]);

    if (timeLeft.expired) {
        return (
            <div className="flex items-center gap-2 text-red-500 font-semibold">
                <span>Berakhir!</span>
            </div>
        );
    }

    const TimeBlock = ({ value, label }) => (
        <div className="flex flex-col items-center">
            <div className="bg-gradient-to-br from-red-500 to-red-600 text-white rounded-lg px-3 py-2 min-w-[50px] text-center shadow-lg">
                <span className="text-2xl font-bold font-mono">
                    {String(value).padStart(2, '0')}
                </span>
            </div>
            <span className="text-xs text-neutral-500 mt-1 uppercase tracking-wider">{label}</span>
        </div>
    );

    return (
        <div className="flex items-center gap-2">
            {timeLeft.days > 0 && (
                <>
                    <TimeBlock value={timeLeft.days} label="Hari" />
                    <span className="text-2xl font-bold text-red-500">:</span>
                </>
            )}
            <TimeBlock value={timeLeft.hours} label="Jam" />
            <span className="text-2xl font-bold text-red-500">:</span>
            <TimeBlock value={timeLeft.minutes} label="Menit" />
            <span className="text-2xl font-bold text-red-500">:</span>
            <TimeBlock value={timeLeft.seconds} label="Detik" />
        </div>
    );
}

export function FlashSaleProgress({ soldCount, stockLimit }) {
    const percentage = Math.min((soldCount / stockLimit) * 100, 100);
    const isAlmostGone = percentage >= 80;

    return (
        <div className="w-full">
            <div className="relative h-3 bg-red-100 rounded-full overflow-hidden">
                <div
                    className={`absolute left-0 top-0 h-full rounded-full transition-all duration-500 ${isAlmostGone
                            ? 'bg-gradient-to-r from-red-500 to-red-600 animate-pulse'
                            : 'bg-gradient-to-r from-orange-400 to-red-500'
                        }`}
                    style={{ width: `${percentage}%` }}
                />
            </div>
            <div className="flex justify-between mt-1 text-xs">
                <span className={isAlmostGone ? 'text-red-500 font-semibold' : 'text-neutral-500'}>
                    {isAlmostGone ? '🔥 Hampir Habis!' : `Terjual ${soldCount}`}
                </span>
                <span className="text-neutral-400">Tersisa {stockLimit - soldCount}</span>
            </div>
        </div>
    );
}
