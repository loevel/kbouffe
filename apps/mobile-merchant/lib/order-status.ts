import type { Ionicons } from '@expo/vector-icons';

/**
 * Source de vérité unique pour les statuts de commande.
 *
 * Les libellés et couleurs vivaient auparavant en trois exemplaires divergents
 * (STATUS_CONFIG dans orders, STATUS_META dans index, STATUS_COLORS dans stats) :
 * l'aperçu ignorait `draft`/`scheduled`/`refunded` et les fonds de badge étaient
 * des teintes claires figées, illisibles une fois le thème sombre appliqué.
 * Chaque statut porte donc ici sa teinte pour les deux schémas ; le fond du
 * badge est dérivé de cette teinte par transparence, ce qui fonctionne sur
 * n'importe quelle surface.
 */

export type OrderStatus =
    | 'draft'
    | 'scheduled'
    | 'pending'
    | 'accepted'
    | 'preparing'
    | 'ready'
    | 'out_for_delivery'
    | 'delivering'
    | 'delivered'
    | 'completed'
    | 'cancelled'
    | 'refunded';

export type ColorScheme = 'light' | 'dark';

interface StatusDefinition {
    label: string;
    light: string;
    dark: string;
}

const ORDER_STATUS: Record<OrderStatus, StatusDefinition> = {
    draft:            { label: 'Brouillon',    light: '#475569', dark: '#94a3b8' },
    scheduled:        { label: 'Planifiée',    light: '#7c3aed', dark: '#a78bfa' },
    pending:          { label: 'En attente',   light: '#d97706', dark: '#fbbf24' },
    accepted:         { label: 'Acceptée',     light: '#2563eb', dark: '#60a5fa' },
    preparing:        { label: 'Préparation',  light: '#7c3aed', dark: '#a78bfa' },
    ready:            { label: 'Prête',        light: '#16a34a', dark: '#4ade80' },
    out_for_delivery: { label: 'En livraison', light: '#0891b2', dark: '#22d3ee' },
    delivering:       { label: 'En livraison', light: '#0891b2', dark: '#22d3ee' },
    delivered:        { label: 'Livrée',       light: '#64748b', dark: '#94a3b8' },
    completed:        { label: 'Terminée',     light: '#64748b', dark: '#94a3b8' },
    cancelled:        { label: 'Annulée',      light: '#dc2626', dark: '#f87171' },
    refunded:         { label: 'Remboursée',   light: '#b45309', dark: '#fbbf24' },
};

const UNKNOWN_STATUS: StatusDefinition = { label: 'Statut inconnu', light: '#64748b', dark: '#94a3b8' };

/** Opacité du fond de badge, exprimée en suffixe hexadécimal sur la teinte. */
const BADGE_TINT = '22';

export interface StatusMeta {
    label: string;
    /** Teinte du texte et de l'accent, adaptée au schéma de couleurs actif. */
    color: string;
    /** Fond du badge : la teinte en transparence, lisible sur clair comme sur sombre. */
    background: string;
}

export function getStatusMeta(status: string | null | undefined, scheme: ColorScheme): StatusMeta {
    const definition = (status && ORDER_STATUS[status as OrderStatus]) || UNKNOWN_STATUS;
    const color = scheme === 'dark' ? definition.dark : definition.light;
    return { label: definition.label, color, background: `${color}${BADGE_TINT}` };
}

export function getStatusLabel(status: string | null | undefined): string {
    return ((status && ORDER_STATUS[status as OrderStatus]) || UNKNOWN_STATUS).label;
}

/** Statuts sur lesquels le marchand n'a plus d'action à mener. */
export const TERMINAL_STATUSES = new Set<string>(['delivered', 'completed', 'cancelled', 'refunded']);

/**
 * Les commandes `draft` sont des paniers jamais envoyés : elles n'ont pas
 * d'action suivante et ne doivent pas encombrer la file « En cours ».
 */
export const NOT_ACTIONABLE_STATUSES = new Set<string>(['draft']);

/** Statuts considérés comme en cours de traitement côté restaurant. */
export const ACTIVE_STATUSES: OrderStatus[] = [
    'pending',
    'accepted',
    'preparing',
    'ready',
    'delivering',
];

/**
 * Certains déploiements nomment différemment le même palier de statut.
 * On tente les synonymes dans l'ordre avant d'abandonner une transition.
 */
export const STATUS_FALLBACKS: Record<string, string[]> = {
    out_for_delivery: ['delivering'],
    delivering: ['out_for_delivery'],
    delivered: ['completed'],
    completed: ['delivered'],
};

type DeliveryType = 'delivery' | 'pickup' | 'dine_in';

const DELIVERY_META: Record<DeliveryType, { label: string; icon: keyof typeof Ionicons.glyphMap }> = {
    delivery: { label: 'Livraison', icon: 'bicycle-outline' },
    pickup: { label: 'À emporter', icon: 'walk-outline' },
    dine_in: { label: 'Sur place', icon: 'restaurant-outline' },
};

const UNKNOWN_DELIVERY = { label: 'Commande', icon: 'cube-outline' as keyof typeof Ionicons.glyphMap };

/**
 * Remplace les émojis 🛵/🏃/🍽️ utilisés jusqu'ici : leur rendu variait selon la
 * police système et ils ne pouvaient pas être recolorés depuis le thème.
 */
export function getDeliveryMeta(deliveryType: string | null | undefined) {
    return (deliveryType && DELIVERY_META[deliveryType as DeliveryType]) || UNKNOWN_DELIVERY;
}
