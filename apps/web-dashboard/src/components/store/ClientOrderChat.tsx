"use client";

import { useState, useEffect, useRef } from "react";
import { Send, MessageCircle, Loader2, ChevronDown, ChevronUp, Store } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useChat, type Message } from "@kbouffe/module-orders/ui";

interface ClientOrderChatProps {
  orderId: string;
  restaurantName: string;
}

export function ClientOrderChat({ orderId, restaurantName }: ClientOrderChatProps) {
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState("");
  const [unreadCount, setUnreadCount] = useState(0);
  const prevMessagesLen = useRef(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const { messages, isLoading, isSending, sendMessage, scrollRef } = useChat(orderId, currentUserId ?? undefined);

  // Fetch current user ID from Supabase session
  useEffect(() => {
    async function fetchUser() {
      try {
        const supabase = createClient();
        if (!supabase) return;
        const { data: { session } } = await supabase.auth.getSession();
        setCurrentUserId(session?.user?.id ?? null);
      } catch {
        // not authenticated — chat stays read-only or hidden
      }
    }
    fetchUser();
  }, []);

  // Track unread messages when panel is closed
  useEffect(() => {
    if (!isOpen && messages.length > prevMessagesLen.current) {
      const newMsgs = messages.slice(prevMessagesLen.current);
      const fromRestaurant = newMsgs.filter((m) => m.senderId !== currentUserId);
      if (fromRestaurant.length > 0) {
        setUnreadCount((n) => n + fromRestaurant.length);
      }
    }
    prevMessagesLen.current = messages.length;
  }, [messages, isOpen, currentUserId]);

  const handleOpen = () => {
    setIsOpen(true);
    setUnreadCount(0);
    setTimeout(() => inputRef.current?.focus(), 100);
  };

  const handleSend = async () => {
    if (!input.trim() || isSending) return;
    const text = input;
    setInput("");
    try {
      await sendMessage(text);
    } catch (err) {
      console.error("Failed to send:", err);
    }
  };

  // Don't render if user is not authenticated
  if (!currentUserId) return null;

  return (
    <section className="bg-white dark:bg-surface-900 rounded-2xl border border-surface-200 dark:border-surface-800 overflow-hidden">
      {/* Toggle header */}
      <button
        type="button"
        onClick={isOpen ? () => setIsOpen(false) : handleOpen}
        className="w-full flex items-center justify-between px-5 py-4 hover:bg-surface-50 dark:hover:bg-surface-800/50 transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-brand-100 dark:bg-brand-900/30 flex items-center justify-center">
            <MessageCircle size={16} className="text-brand-600 dark:text-brand-400" />
          </div>
          <div className="text-left">
            <p className="font-bold text-surface-900 dark:text-white text-sm">
              Contacter le restaurant
            </p>
            <p className="text-xs text-surface-500 dark:text-surface-400">{restaurantName}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {unreadCount > 0 && !isOpen && (
            <span className="min-w-5 h-5 px-1.5 bg-brand-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
              {unreadCount}
            </span>
          )}
          {isOpen ? (
            <ChevronUp size={18} className="text-surface-400" />
          ) : (
            <ChevronDown size={18} className="text-surface-400" />
          )}
        </div>
      </button>

      {/* Collapsible chat body */}
      {isOpen && (
        <>
          {/* Messages list */}
          <div
            ref={scrollRef}
            className="h-64 overflow-y-auto px-4 py-3 space-y-3 border-t border-surface-100 dark:border-surface-800"
          >
            {isLoading ? (
              <div className="flex items-center justify-center h-full">
                <Loader2 size={20} className="animate-spin text-brand-500" />
              </div>
            ) : messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full gap-2 text-center">
                <Store size={28} className="text-surface-300 dark:text-surface-600" />
                <p className="text-sm text-surface-500 dark:text-surface-400">
                  Posez une question au restaurant.
                </p>
                <p className="text-xs text-surface-400 dark:text-surface-500">
                  Le restaurant vous répondra ici.
                </p>
              </div>
            ) : (
              messages.map((message: Message) => {
                const isMe = message.senderId === currentUserId;
                return (
                  <div key={message.id} className={`flex ${isMe ? "justify-end" : "justify-start"}`}>
                    {/* Restaurant avatar */}
                    {!isMe && (
                      <div className="w-6 h-6 rounded-full bg-surface-200 dark:bg-surface-700 flex items-center justify-center shrink-0 mr-2 mt-1">
                        <Store size={12} className="text-surface-500" />
                      </div>
                    )}
                    <div
                      className={`max-w-[78%] rounded-2xl px-3.5 py-2 text-sm ${
                        isMe
                          ? "bg-brand-500 text-white rounded-tr-none"
                          : "bg-surface-100 dark:bg-surface-800 text-surface-900 dark:text-surface-100 rounded-tl-none"
                      }`}
                    >
                      {message.type === "image" && message.attachmentUrl ? (
                        <img
                          src={message.attachmentUrl}
                          alt="Photo"
                          className="rounded-lg max-w-full h-auto mb-1"
                        />
                      ) : (
                        <p className="whitespace-pre-wrap leading-snug">{message.content}</p>
                      )}
                      <p
                        className={`text-[10px] mt-1 ${
                          isMe ? "text-brand-100 text-right" : "text-surface-400"
                        }`}
                      >
                        {new Date(message.createdAt).toLocaleTimeString("fr-FR", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </p>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Input bar */}
          <div className="flex items-center gap-2 px-4 py-3 border-t border-surface-100 dark:border-surface-800 bg-surface-50/50 dark:bg-surface-800/30">
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSend()}
              placeholder="Votre message…"
              className="flex-1 h-10 px-3.5 rounded-xl bg-white dark:bg-surface-900 border border-surface-200 dark:border-surface-700 text-sm text-surface-900 dark:text-white placeholder-surface-400 focus:outline-none focus:ring-2 focus:ring-brand-500/40 focus:border-brand-500 transition-all"
              disabled={isSending}
            />
            <button
              type="button"
              onClick={handleSend}
              disabled={!input.trim() || isSending}
              className="w-10 h-10 rounded-xl bg-brand-500 hover:bg-brand-600 disabled:bg-brand-300 dark:disabled:bg-brand-800 text-white flex items-center justify-center transition-colors shrink-0"
            >
              {isSending ? (
                <Loader2 size={16} className="animate-spin" />
              ) : (
                <Send size={16} />
              )}
            </button>
          </div>
        </>
      )}
    </section>
  );
}
