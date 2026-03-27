import type { CoreEnv } from "../types";

export interface SmsMessage {
    to: string;
    content: string;
    referenceId?: string;
}

/**
 * Enqueues an SMS to be sent asynchronously by the Cloudflare Queue consumer.
 */
export async function enqueueSms(env: CoreEnv, message: SmsMessage) {
    if (!env.SMS_QUEUE) {
        console.warn("[SMS Queue] SMS_QUEUE binding not configured. Dropping message:", message);
        return false;
    }

    try {
        await env.SMS_QUEUE.send(message);
        return true;
    } catch (error) {
        console.error("[SMS Queue] Failed to enqueue SMS:", error);
        return false;
    }
}
