export type ConversationType = 'order_support' | 'delivery_tracking';
export type ParticipantRole = 'client' | 'restaurant' | 'driver';
export type MessageType = 'text' | 'image' | 'system';

export interface ChatMessage {
    id: string;
    conversationId: string;
    senderId: string;
    content: string | null;
    type: MessageType;
    attachmentUrl?: string | null;
    createdAt: Date;
    readAt?: Date | null;
}
