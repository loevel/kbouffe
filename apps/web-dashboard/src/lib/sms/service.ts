/**
 * SMS Notification Service — Sends SMS to customers on order status changes.
 *
 * Reads the restaurant's `sms_notifications_enabled` and `notification_channels`
 * settings to decide whether and how to notify. Currently supports MTN SMS v3.
 *
 * Triggered automatically from the PATCH /api/orders/[id] route.
 */
import { sendSms, normalizeCameroonPhone } from "@/lib/sms/mtn";

// ── Types ─────────────────────────────────────────────────────────────────

export type NotifiableStatus =
  | "accepted"
  | "preparing"
  | "ready"
  | "delivering"
  | "delivered"
  | "cancelled";

export interface NotifyOrderInput {
  /** The new order status */
  status: NotifiableStatus;
  /** Customer phone number */
  customerPhone: string;
  /** Restaurant name (shown in SMS) */
  restaurantName: string;
  /** Short order reference (e.g. first 8 chars of UUID) */
  orderRef: string;
  /** Preparation time in minutes (for accepted status) */
  preparationTime?: number;
  /** Cancellation reason (for cancelled status) */
  cancelReason?: string;
}

export interface RestaurantSmsSettings {
  sms_notifications_enabled: boolean;
  notification_channels: unknown; // JSON from Supabase
}

// ── Message templates ─────────────────────────────────────────────────────

function buildSmsMessage(input: NotifyOrderInput): string {
  const { status, restaurantName, orderRef, preparationTime, cancelReason } =
    input;

  const ref = orderRef.slice(0, 8).toUpperCase();

  switch (status) {
    case "accepted":
      return preparationTime
        ? `[Kbouffe] Votre commande #${ref} chez ${restaurantName} a ete acceptee ! Preparation estimee: ${preparationTime} min.`
        : `[Kbouffe] Votre commande #${ref} chez ${restaurantName} a ete acceptee !`;

    case "preparing":
      return `[Kbouffe] Votre commande #${ref} est en cours de preparation chez ${restaurantName}.`;

    case "ready":
      return `[Kbouffe] Votre commande #${ref} chez ${restaurantName} est prete ! Vous pouvez la recuperer ou attendre le livreur.`;

    case "delivering":
      return `[Kbouffe] Votre commande #${ref} est en cours de livraison. Elle arrive bientot !`;

    case "delivered":
      return `[Kbouffe] Commande #${ref} livree. Merci d'avoir commande chez ${restaurantName} et bon appetit !`;

    case "cancelled":
      return cancelReason
        ? `[Kbouffe] Votre commande #${ref} chez ${restaurantName} a ete annulee. Raison: ${cancelReason}`
        : `[Kbouffe] Votre commande #${ref} chez ${restaurantName} a ete annulee. Contactez le restaurant pour plus d'informations.`;

    default:
      return "";
  }
}

// ── Channel check ─────────────────────────────────────────────────────────

function isSmsChannelEnabled(settings: RestaurantSmsSettings): boolean {
  if (!settings.sms_notifications_enabled) return false;

  // notification_channels is expected to be string[] like ["sms", "whatsapp"]
  const channels = settings.notification_channels;

  if (Array.isArray(channels)) {
    return channels.includes("sms");
  }

  // Fallback: if sms_notifications_enabled is true but no channels configured,
  // default to sending SMS
  return true;
}

// ── Public API ────────────────────────────────────────────────────────────

const NOTIFIABLE_STATUSES = new Set<string>([
  "accepted",
  "preparing",
  "ready",
  "delivering",
  "delivered",
  "cancelled",
]);

/**
 * Send an SMS notification for an order status change.
 * Returns `true` if SMS was sent, `false` if skipped.
 * Never throws — logs errors internally.
 */
export async function notifyOrderStatusChange(
  input: NotifyOrderInput,
  restaurantSettings: RestaurantSmsSettings
): Promise<boolean> {
  try {
    // Check if the status is notifiable
    if (!NOTIFIABLE_STATUSES.has(input.status)) {
      return false;
    }

    // Check restaurant settings
    if (!isSmsChannelEnabled(restaurantSettings)) {
      return false;
    }

    // Validate phone number
    const phone = input.customerPhone?.trim();
    if (!phone) {
      console.warn("[SMS Service] No customer phone, skipping SMS");
      return false;
    }

    // Build message
    const message = buildSmsMessage(input);
    if (!message) {
      return false;
    }

    // Normalize and send
    const normalizedPhone = normalizeCameroonPhone(phone);

    await sendSms({
      recipientMsisdn: normalizedPhone,
      message,
      clientCorrelatorId: `order-${input.orderRef}-${input.status}`,
    });

    console.log(
      `[SMS Service] SMS sent for order #${input.orderRef} → ${input.status} to ${normalizedPhone}`
    );

    return true;
  } catch (error) {
    // Never throw — SMS failure should not block order processing
    console.error("[SMS Service] Failed to send SMS:", {
      orderRef: input.orderRef,
      status: input.status,
      error: error instanceof Error ? error.message : error,
    });
    return false;
  }
}

/**
 * Check if MTN SMS is configured (all env vars present).
 * Used by the settings UI to show whether SMS is available.
 */
export async function isMtnSmsConfigured(): Promise<boolean> {
  try {
    const { getMtnSmsConfig } = await import("@/lib/sms/mtn");
    await getMtnSmsConfig();
    return true;
  } catch {
    return false;
  }
}
