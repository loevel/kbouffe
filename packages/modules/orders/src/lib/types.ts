/**
 * Orders module — local type re-exports.
 * Keeps the module self-contained while sourcing types from the shared core.
 */
export type {
    Order,
    OrderStatus,
    OrderItemData,
    DeliveryType,
    PaymentMethod,
    PaymentStatus,
} from "@kbouffe/module-core/ui";
