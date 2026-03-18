"use client";

import { useState, useRef } from "react";
import { Send, Image as ImageIcon, Loader2, User, UserCheck } from "lucide-react";
import { Card, Button, Input, Badge } from "@kbouffe/module-core/ui";
import { useChat, type Message } from "../hooks/use-chat";
import { formatDateTime } from "@kbouffe/module-core/ui";
import { useLocale } from "@kbouffe/module-core/ui";
import { useDashboard } from "@kbouffe/module-core/ui";

interface OrderChatProps {
    orderId: string;
    customerName: string;
}

export function OrderChat({ orderId, customerName }: OrderChatProps) {
    const { t } = useLocale();
    const { user } = useDashboard();
    const { messages, isLoading, isSending, sendMessage, uploadImage, scrollRef } = useChat(orderId);
    const [input, setInput] = useState("");
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleSend = async () => {
        if (!input.trim() || isSending) return;
        const text = input;
        setInput("");
        await sendMessage(text);
    };

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        try {
            const url = await uploadImage(file);
            await sendMessage("Image", "image", url);
        } catch (error) {
            console.error("Upload error:", error);
        }
    };

    return (
        <Card className="flex flex-col h-[500px] overflow-hidden" padding="none">
            <div className="px-4 py-3 border-b border-surface-100 dark:border-surface-800 flex items-center justify-between bg-surface-50/50 dark:bg-surface-800/50">
                <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-brand-100 dark:bg-brand-900/30 flex items-center justify-center text-brand-600 dark:text-brand-400">
                        <User size={16} />
                    </div>
                    <div>
                        <p className="text-sm font-semibold text-surface-900 dark:text-white">{customerName}</p>
                        <p className="text-[10px] text-surface-500 uppercase tracking-wider font-medium">Chat Support</p>
                    </div>
                </div>
                {messages.length > 0 && (
                    <Badge variant="success" className="h-5 px-1.5 text-[10px]">Direct</Badge>
                )}
            </div>

            <div 
                ref={scrollRef}
                className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin scrollbar-thumb-surface-200 dark:scrollbar-thumb-surface-700"
            >
                {isLoading ? (
                    <div className="flex items-center justify-center h-full">
                        <Loader2 className="animate-spin text-brand-500" />
                    </div>
                ) : messages.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-center p-6">
                        <div className="w-12 h-12 rounded-2xl bg-surface-100 dark:bg-surface-800 flex items-center justify-center text-surface-400 mb-3">
                            <UserCheck size={24} />
                        </div>
                        <p className="text-sm text-surface-500">Commencez la discussion avec le client.</p>
                    </div>
                ) : (
                    messages.map((message) => {
                        const isMe = message.senderId === user?.id; 
                        return (
                            <div key={message.id} className={`flex ${isMe ? "justify-end" : "justify-start"}`}>
                                <div className={`max-w-[80%] rounded-2xl px-4 py-2 ${
                                    isMe 
                                        ? "bg-brand-600 text-white rounded-tr-none" 
                                        : "bg-surface-100 dark:bg-surface-800 text-surface-900 dark:text-surface-100 rounded-tl-none"
                                }`}>
                                    {message.type === "image" ? (
                                        <div className="space-y-1">
                                            <img src={message.attachmentUrl} alt="Chat attachment" className="rounded-lg max-w-full h-auto" />
                                            <p className="text-xs opacity-70 italic">Image</p>
                                        </div>
                                    ) : (
                                        <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                                    )}
                                    <p className={`text-[10px] mt-1 ${isMe ? "text-brand-100 text-right" : "text-surface-500"}`}>
                                        {formatDateTime(message.createdAt)}
                                    </p>
                                </div>
                            </div>
                        );
                    })
                )}
            </div>

            <div className="p-4 border-t border-surface-100 dark:border-surface-800 bg-surface-50/30 dark:bg-surface-800/30">
                <div className="flex items-center gap-2">
                    <Button 
                        variant="ghost" 
                        size="sm"
                        className="shrink-0 h-10 w-10 p-0 rounded-full text-surface-400 hover:text-brand-500"
                        onClick={() => fileInputRef.current?.click()}
                    >
                        <ImageIcon size={20} />
                    </Button>
                    <input 
                        type="file" 
                        ref={fileInputRef} 
                        className="hidden" 
                        accept="image/*" 
                        onChange={handleFileChange} 
                    />
                    <Input 
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        placeholder="Votre message..."
                        className="bg-white dark:bg-surface-900 border-surface-200 dark:border-surface-700 h-10"
                        onKeyDown={(e) => e.key === "Enter" && handleSend()}
                    />
                    <Button 
                        size="sm"
                        className="shrink-0 h-10 w-10 p-0 rounded-full"
                        onClick={handleSend}
                        disabled={!input.trim() || isSending}
                    >
                        {isSending ? <Loader2 className="animate-spin" size={18} /> : <Send size={18} />}
                    </Button>
                </div>
            </div>
        </Card>
    );
}
