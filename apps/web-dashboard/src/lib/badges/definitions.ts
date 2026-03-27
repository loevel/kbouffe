export interface BadgeDefinition {
    name: string;
    nameFr: string;
    icon: string;
    description: string;
    descriptionFr: string;
    threshold?: number;
    check: "order_count" | "first_5star" | "week_no_cancel";
}

export const BADGE_DEFINITIONS: Record<string, BadgeDefinition> = {
    orders_10: {
        name: "10 Orders",
        nameFr: "10 commandes",
        icon: "medal",
        description: "Reached 10 completed orders",
        descriptionFr: "10 commandes livrees",
        threshold: 10,
        check: "order_count",
    },
    orders_50: {
        name: "50 Orders",
        nameFr: "50 commandes",
        icon: "trophy",
        description: "Reached 50 completed orders",
        descriptionFr: "50 commandes livrees",
        threshold: 50,
        check: "order_count",
    },
    orders_100: {
        name: "100 Orders",
        nameFr: "100 commandes",
        icon: "crown",
        description: "Reached 100 completed orders",
        descriptionFr: "Cap des 100 commandes",
        threshold: 100,
        check: "order_count",
    },
    orders_500: {
        name: "500 Orders",
        nameFr: "500 commandes",
        icon: "diamond",
        description: "Reached 500 completed orders",
        descriptionFr: "500 commandes livrees !",
        threshold: 500,
        check: "order_count",
    },
    orders_1000: {
        name: "1000 Orders",
        nameFr: "1000 commandes",
        icon: "gem",
        description: "Reached 1000 completed orders",
        descriptionFr: "1000 commandes — legende !",
        threshold: 1000,
        check: "order_count",
    },
    first_5star: {
        name: "First 5-Star",
        nameFr: "Premier avis 5 etoiles",
        icon: "star",
        description: "Received first 5-star review",
        descriptionFr: "Premier avis 5 etoiles recu",
        check: "first_5star",
    },
    week_no_cancel: {
        name: "Perfect Week",
        nameFr: "Semaine parfaite",
        icon: "check-circle",
        description: "A full week with zero cancellations",
        descriptionFr: "1 semaine sans aucune annulation",
        check: "week_no_cancel",
    },
};

export const BADGE_ICON_MAP: Record<string, string> = {
    medal: "🏅",
    trophy: "🏆",
    crown: "👑",
    diamond: "💎",
    gem: "💍",
    star: "⭐",
    "check-circle": "✅",
};
