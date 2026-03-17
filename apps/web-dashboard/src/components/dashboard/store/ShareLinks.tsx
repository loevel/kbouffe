"use client";

import { useState } from "react";
import { Copy, Check, MessageCircle, Share2 } from "lucide-react";
import { Card, Button } from "@/components/ui";
import { toast } from "@/components/ui";
import { useDashboard } from "@/contexts/dashboard-context";
import { useLocale } from "@/contexts/locale-context";

export function ShareLinks() {
    const { restaurant } = useDashboard();
    const { t } = useLocale();
    const [copied, setCopied] = useState(false);
    const baseUrl = typeof window !== "undefined" ? window.location.origin : "https://kbouffe.com";
    const storeUrl = `${baseUrl}/r/${restaurant?.slug ?? ""}`;

    const handleCopy = async () => {
        await navigator.clipboard.writeText(storeUrl);
        setCopied(true);
        toast.success(t.store.linkCopied);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <Card>
            <h3 className="font-semibold text-surface-900 dark:text-white mb-4">{t.store.shareTitle}</h3>

            <div className="flex items-center gap-2 p-3 bg-surface-50 dark:bg-surface-800 rounded-xl mb-4">
                <span className="flex-1 text-sm text-surface-600 dark:text-surface-300 truncate">{storeUrl}</span>
                <Button variant="outline" size="sm" leftIcon={copied ? <Check size={14} /> : <Copy size={14} />} onClick={handleCopy}>
                    {copied ? t.store.copiedLink : t.store.copyLink}
                </Button>
            </div>

            <div className="flex gap-2">
                <Button
                    variant="outline"
                    size="sm"
                    leftIcon={<MessageCircle size={16} />}
                    className="flex-1"
                    onClick={() => {
                        window.open(`https://wa.me/?text=${encodeURIComponent(`${t.store.whatsappText}${storeUrl}`)}`, "_blank");
                    }}
                >
                    WhatsApp
                </Button>
                <Button
                    variant="outline"
                    size="sm"
                    leftIcon={<Share2 size={16} />}
                    className="flex-1"
                    onClick={() => {
                        window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(storeUrl)}`, "_blank");
                    }}
                >
                    Facebook
                </Button>
            </div>
        </Card>
    );
}
