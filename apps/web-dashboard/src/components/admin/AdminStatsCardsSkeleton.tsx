interface AdminStatsCardsSkeletonProps {
    cards?: number;
}

export function AdminStatsCardsSkeleton({ cards = 4 }: AdminStatsCardsSkeletonProps) {
    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {Array.from({ length: cards }).map((_, i) => (
                <div
                    key={i}
                    className="animate-pulse rounded-3xl bg-white dark:bg-surface-900 border border-surface-100 dark:border-surface-800 p-6 space-y-4 shadow-sm"
                    style={{ animationDelay: `${i * 80}ms` }}
                >
                    <div className="flex items-center justify-between">
                        <div className="h-3 bg-surface-100 dark:bg-surface-800 rounded-full w-24" />
                        <div className="w-10 h-10 rounded-2xl bg-surface-100 dark:bg-surface-800" />
                    </div>
                    <div className="h-8 bg-surface-100 dark:bg-surface-800 rounded-xl w-20" />
                    <div className="h-2.5 bg-surface-100 dark:bg-surface-800 rounded-full w-32" />
                </div>
            ))}
        </div>
    );
}
