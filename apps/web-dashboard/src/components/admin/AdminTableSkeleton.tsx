const COL_WIDTHS = ["w-2/3", "w-full", "w-1/2", "w-3/4", "w-5/6"];

interface AdminTableSkeletonProps {
    rows?: number;
    cols?: number;
}

export function AdminTableSkeleton({ rows = 5, cols = 5 }: AdminTableSkeletonProps) {
    return (
        <>
            {/* Header row skeleton */}
            <tr className="border-b border-surface-100 dark:border-surface-800 bg-surface-50/50 dark:bg-surface-800/30">
                {Array.from({ length: cols }).map((_, j) => (
                    <th key={j} className="px-6 py-5">
                        <div className="h-2.5 bg-surface-200 dark:bg-surface-700 rounded-full w-16 animate-pulse" />
                    </th>
                ))}
            </tr>
            {/* Data rows skeleton */}
            {Array.from({ length: rows }).map((_, i) => (
                <tr
                    key={i}
                    className="border-b border-surface-100 dark:divide-surface-800 animate-pulse"
                    style={{ animationDelay: `${i * 60}ms` }}
                >
                    {Array.from({ length: cols }).map((_, j) => (
                        <td key={j} className="px-6 py-5">
                            <div
                                className={`h-4 bg-surface-100 dark:bg-surface-800 rounded-lg ${COL_WIDTHS[(i + j) % COL_WIDTHS.length]}`}
                            />
                        </td>
                    ))}
                </tr>
            ))}
        </>
    );
}
