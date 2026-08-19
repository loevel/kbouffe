/**
 * Tarification commande client — source unique de vérité.
 *
 * Les frais étaient dupliqués dans trois endroits (page panier, page checkout,
 * CartDrawer de la vitrine) avec des valeurs divergentes : un même panier était
 * facturé 250 FCFA de plus selon le point d'entrée utilisé. Tout passe
 * désormais par ce module, y compris l'API de création de commande.
 */

export type DeliveryType = "delivery" | "pickup" | "dine_in";

/** Frais de livraison par mode de récupération (FCFA). */
export const DELIVERY_FEES: Record<DeliveryType, number> = {
    delivery: 1000,
    pickup: 0,
    dine_in: 0,
};

/** Frais de service Kbouffe appliqués à toute commande (FCFA). */
export const SERVICE_FEE = 250;

export const DELIVERY_LABELS: Record<DeliveryType, string> = {
    delivery: "Livraison",
    pickup: "À emporter",
    dine_in: "Sur place",
};

export const DELIVERY_DESCRIPTIONS: Record<DeliveryType, string> = {
    delivery: "Livraison à domicile",
    pickup: "Récupérer au restaurant",
    dine_in: "Manger dans le restaurant",
};

export function isDeliveryType(value: unknown): value is DeliveryType {
    return value === "delivery" || value === "pickup" || value === "dine_in";
}

export function getDeliveryFee(deliveryType: DeliveryType): number {
    return DELIVERY_FEES[deliveryType] ?? 0;
}

export interface OrderTotalsInput {
    subtotal: number;
    deliveryType: DeliveryType;
    /** Remise code promo déjà validée (FCFA). */
    discount?: number;
    /** Montant couvert par une carte cadeau (FCFA). */
    giftCardAmount?: number;
}

export interface OrderTotals {
    subtotal: number;
    deliveryFee: number;
    serviceFee: number;
    discount: number;
    giftCardAmount: number;
    /** Montant dû par le client, jamais négatif. */
    total: number;
}

/**
 * Calcule les totaux d'une commande. La remise et la carte cadeau ne peuvent
 * jamais faire passer le total sous zéro.
 */
export function computeOrderTotals({
    subtotal,
    deliveryType,
    discount = 0,
    giftCardAmount = 0,
}: OrderTotalsInput): OrderTotals {
    const deliveryFee = getDeliveryFee(deliveryType);
    const gross = subtotal + deliveryFee + SERVICE_FEE;
    const safeDiscount = Math.max(0, Math.min(discount, gross));
    const afterDiscount = gross - safeDiscount;
    const safeGiftCard = Math.max(0, Math.min(giftCardAmount, afterDiscount));

    return {
        subtotal,
        deliveryFee,
        serviceFee: SERVICE_FEE,
        discount: safeDiscount,
        giftCardAmount: safeGiftCard,
        total: afterDiscount - safeGiftCard,
    };
}
