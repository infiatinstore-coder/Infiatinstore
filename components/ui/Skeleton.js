export function ProductCardSkeleton() {
    return (
        <div className="bg-white rounded-2xl shadow-sm overflow-hidden animate-pulse">
            <div className="aspect-square bg-neutral-200"></div>
            <div className="p-4 space-y-3">
                <div className="h-4 bg-neutral-200 rounded w-3/4"></div>
                <div className="h-4 bg-neutral-200 rounded w-1/2"></div>
                <div className="h-8 bg-neutral-200 rounded"></div>
            </div>
        </div>
    );
}

export function OrderCardSkeleton() {
    return (
        <div className="bg-white rounded-2xl shadow-sm p-6 animate-pulse">
            <div className="flex items-center justify-between mb-4">
                <div className="h-6 bg-neutral-200 rounded w-1/3"></div>
                <div className="h-6 bg-neutral-200 rounded w-24"></div>
            </div>
            <div className="flex gap-4">
                <div className="w-16 h-16 bg-neutral-200 rounded-lg"></div>
                <div className="flex-1 space-y-2">
                    <div className="h-4 bg-neutral-200 rounded w-3/4"></div>
                    <div className="h-4 bg-neutral-200 rounded w-1/2"></div>
                </div>
            </div>
        </div>
    );
}

export function TableSkeleton({ rows = 5, cols = 6 }) {
    return (
        <div className="bg-white rounded-xl shadow-sm overflow-hidden animate-pulse">
            <div className="p-4 border-b border-neutral-100">
                <div className="flex gap-4">
                    {Array.from({ length: cols }).map((_, i) => (
                        <div key={i} className="h-4 bg-neutral-200 rounded flex-1"></div>
                    ))}
                </div>
            </div>
            {Array.from({ length: rows }).map((_, i) => (
                <div key={i} className="p-4 border-b border-neutral-100">
                    <div className="flex gap-4">
                        {Array.from({ length: cols }).map((_, j) => (
                            <div key={j} className="h-4 bg-neutral-200 rounded flex-1"></div>
                        ))}
                    </div>
                </div>
            ))}
        </div>
    );
}

export function StatCardSkeleton() {
    return (
        <div className="bg-white rounded-xl p-5 shadow-sm animate-pulse">
            <div className="h-4 bg-neutral-200 rounded w-1/2 mb-2"></div>
            <div className="h-8 bg-neutral-200 rounded w-3/4"></div>
        </div>
    );
}
