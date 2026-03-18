"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import useSWR from "swr";
import { createClient } from "@kbouffe/module-core/ui";

export interface Message {
    id: string;
    conversationId: string;
    senderId: string;
    content: string;
    type: "text" | "image" | "system_notification";
    attachmentUrl?: string;
    createdAt: string;
    readAt?: string;
}

const fetcher = async (url: string) => {
    const res = await fetch(url);
    if (!res.ok) throw new Error("API error");
    return res.json() as Promise<any>;
};

export function useChat(orderId: string) {
    const supabase = createClient();
    const [messages, setMessages] = useState<Message[]>([]);
    const [isSending, setIsSending] = useState(false);
    const scrollRef = useRef<HTMLDivElement>(null);

    // Fetch initial messages and conversation status
    const { data, isLoading } = useSWR<{
        messages: Message[];
        conversationId: string;
    }>(orderId ? `/api/chat/orders/${orderId}/messages` : null, fetcher);

    useEffect(() => {
        if (data?.messages) {
            setMessages(data.messages);
        }
    }, [data]);

    // Setup Supabase Realtime subscription
    useEffect(() => {
        if (!supabase || !data?.conversationId) return;

        const channel = supabase.channel(`conversation:${data.conversationId}`)
            .on("broadcast", { event: "new_message" }, (payload) => {
                const newMessage = payload.payload as Message;
                setMessages((prev) => {
                    // Avoid duplicates
                    if (prev.some((m) => m.id === newMessage.id)) return prev;
                    return [...prev, newMessage];
                });
            })
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [supabase, data?.conversationId]);

    // Send a message
    const sendMessage = useCallback(async (content: string, type: "text" | "image" = "text", attachmentUrl?: string) => {
        if (!orderId || !content.trim()) return;

        setIsSending(true);
        try {
            const res = await fetch(`/api/chat/orders/${orderId}/messages`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ content, type, attachmentUrl }),
            });

            if (!res.ok) throw new Error("Failed to send message");
            
            // Note: We don't manually add to state because we'll receive it via broadcast
        } catch (error) {
            console.error("Chat error:", error);
        } finally {
            setIsSending(false);
        }
    }, [orderId]);

    // Upload an image
    const uploadImage = useCallback(async (file: File) => {
        const formData = new FormData();
        formData.append("file", file);

        const res = await fetch(`/api/chat/orders/${orderId}/upload`, {
            method: "POST",
            body: formData,
        });

        if (!res.ok) throw new Error("Upload failed");
        const data = await res.json() as { url: string };
        return data.url;
    }, [orderId]);

    // Auto-scroll to bottom
    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages]);

    return {
        messages,
        isLoading,
        isSending,
        sendMessage,
        uploadImage,
        scrollRef
    };
}
