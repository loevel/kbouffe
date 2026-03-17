import type { Env } from "../types";

export interface SmsMessage {
    to: string;
    content: string;
    referenceId?: string;
}

/**
 * Enqueues an SMS to be sent asynchronously by the Cloudflare Queue consumer.
 */
export async function enqueueSms(env: Env, message: SmsMessage) {
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

/**
 * Consumer handler for Cloudflare Queues.
 * This is executed automatically when messages are in the queue.
 */
export async function processSmsQueue(batch: MessageBatch<SmsMessage>, env: Env) {
    // You can replace this with Twilio, MTN SMS API, InfoBip, etc.
    const SMS_API_URL = env.MTN_BASE_URL ? `${env.MTN_BASE_URL}/sms/v1/messages` : null;

    for (const msg of batch.messages) {
        try {
            const payload = msg.body;
            console.log(`[SMS Queue] Sending to ${payload.to}: ${payload.content}`);

            // Mock Implementation (or real HTTP call to provider)
            // if (SMS_API_URL) {
            //     const res = await fetch(SMS_API_URL, {
            //         method: "POST",
            //         headers: {
            //             "Content-Type": "application/json",
            //             "Authorization": `Bearer ${env.MTN_COLLECTION_API_KEY}`,
            //         },
            //         body: JSON.stringify({
            //             to: payload.to,
            //             message: payload.content,
            //         }),
            //     });
            //     if (!res.ok) throw new Error(`SMS Provider error: ${res.status}`);
            // }

            // Mark message as processed so it's removed from the queue
            msg.ack();
        } catch (error) {
            console.error(`[SMS Queue] Failed to process message ${msg.id}:`, error);
            // Optionally: msg.retry()
        }
    }
}
