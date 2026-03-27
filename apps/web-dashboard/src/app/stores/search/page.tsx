import { Suspense } from "react";
import type { Metadata } from "next";
import { SearchPageClient } from "./_search-client";

export const metadata: Metadata = {
    title: "Rechercher un restaurant — Kbouffe",
    description: "Trouvez le restaurant idéal parmi les meilleurs restaurants camerounais.",
};

export default function SearchPage() {
    return (
        <Suspense fallback={<SearchSkeleton />}>
            <SearchPageClient />
        </Suspense>
    );
}

function SearchSkeleton() {
    return (
        <div className="min-h-screen bg-white dark:bg-surface-950 animate-pulse">
            <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 space-y-6">
                <div className="h-12 rounded-2xl bg-surface-100 dark:bg-surface-800 w-full" />
                <div className="flex gap-2">
                    {Array.from({ length: 5 }).map((_, i) => (
                        <div key={i} className="h-8 w-24 rounded-full bg-surface-100 dark:bg-surface-800" />
                    ))}
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-5 pt-4">
                    {Array.from({ length: 8 }).map((_, i) => (
                        <div key={i}>
                            <div className="h-32 rounded-2xl bg-surface-100 dark:bg-surface-800 mb-3" />
                            <div className="h-4 w-3/4 rounded bg-surface-100 dark:bg-surface-800 mb-2" />
                            <div className="h-3 w-1/2 rounded bg-surface-100 dark:bg-surface-800" />
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
