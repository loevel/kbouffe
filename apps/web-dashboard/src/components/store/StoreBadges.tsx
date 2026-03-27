"use client";

interface StoreBadge {
    type: string;
    name: string;
    earnedAt: string;
    icon: string;
}

const ICON_MAP: Record<string, string> = {
    medal: "🏅",
    trophy: "🏆",
    crown: "👑",
    diamond: "💎",
    gem: "💍",
    star: "⭐",
    "check-circle": "✅",
};

export function StoreBadges({ badges }: { badges: StoreBadge[] }) {
    if (!badges || badges.length === 0) return null;

    return (
        <div className="flex flex-wrap gap-1.5">
            {badges.map((badge) => (
                <span
                    key={badge.type}
                    className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-50 dark:bg-amber-500/10 text-xs font-medium text-amber-700 dark:text-amber-300"
                    title={`Obtenu le ${new Date(badge.earnedAt).toLocaleDateString("fr-FR")}`}
                >
                    <span>{ICON_MAP[badge.icon] ?? "🏅"}</span>
                    {badge.name}
                </span>
            ))}
        </div>
    );
}
