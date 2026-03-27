"use client";

import { useState, useEffect } from "react";
import { X, AlertTriangle, Info, AlertCircle } from "lucide-react";

interface Announcement {
    id: string;
    message: string;
    type: "info" | "warning" | "urgent";
    color: string | null;
}

interface AnnouncementBannerProps {
    announcements: Announcement[];
    restaurantId: string;
}

const TYPE_CONFIG = {
    info: {
        bg: "bg-blue-50 dark:bg-blue-900/30",
        border: "border-blue-200 dark:border-blue-800",
        text: "text-blue-800 dark:text-blue-200",
        icon: Info,
        dismissable: true,
    },
    warning: {
        bg: "bg-amber-50 dark:bg-amber-900/30",
        border: "border-amber-200 dark:border-amber-800",
        text: "text-amber-800 dark:text-amber-200",
        icon: AlertTriangle,
        dismissable: true,
    },
    urgent: {
        bg: "bg-red-50 dark:bg-red-900/30",
        border: "border-red-200 dark:border-red-800",
        text: "text-red-800 dark:text-red-200",
        icon: AlertCircle,
        dismissable: false,
    },
};

export function AnnouncementBanner({ announcements, restaurantId }: AnnouncementBannerProps) {
    const [dismissed, setDismissed] = useState<Set<string>>(new Set());

    useEffect(() => {
        try {
            const stored = localStorage.getItem(`dismissed-announcements-${restaurantId}`);
            if (stored) {
                setDismissed(new Set(JSON.parse(stored)));
            }
        } catch {}
    }, [restaurantId]);

    const dismiss = (id: string) => {
        const next = new Set(dismissed);
        next.add(id);
        setDismissed(next);
        try {
            localStorage.setItem(`dismissed-announcements-${restaurantId}`, JSON.stringify([...next]));
        } catch {}
    };

    const visible = announcements.filter((a) => !dismissed.has(a.id));

    if (visible.length === 0) return null;

    return (
        <div className="space-y-0">
            {visible.map((announcement) => {
                const config = TYPE_CONFIG[announcement.type] ?? TYPE_CONFIG.info;
                const Icon = config.icon;
                const customBg = announcement.color
                    ? { backgroundColor: announcement.color + "15" }
                    : undefined;
                const customBorder = announcement.color
                    ? { borderColor: announcement.color + "40" }
                    : undefined;
                const customText = announcement.color
                    ? { color: announcement.color }
                    : undefined;

                return (
                    <div
                        key={announcement.id}
                        className={`flex items-center gap-3 px-4 py-3 border-b text-sm ${
                            announcement.color ? "" : `${config.bg} ${config.border} ${config.text}`
                        } ${announcement.type === "urgent" ? "animate-pulse" : ""}`}
                        style={{
                            ...(customBg ?? {}),
                            ...(customBorder ?? {}),
                            ...(customText ?? {}),
                        }}
                    >
                        <Icon size={16} className="shrink-0" />
                        <p className="flex-1 font-medium">{announcement.message}</p>
                        {config.dismissable && (
                            <button
                                onClick={() => dismiss(announcement.id)}
                                className="shrink-0 p-1 rounded-md hover:bg-black/10 dark:hover:bg-white/10 transition-colors"
                                aria-label="Fermer"
                            >
                                <X size={14} />
                            </button>
                        )}
                    </div>
                );
            })}
        </div>
    );
}
