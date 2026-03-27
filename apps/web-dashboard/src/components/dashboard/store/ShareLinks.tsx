"use client";

import { useState } from "react";
import { Copy, Check, MessageCircle, QrCode, Download } from "lucide-react";
import { Card, Button } from "@kbouffe/module-core/ui";
import { toast } from "@kbouffe/module-core/ui";
import { useDashboard } from "@kbouffe/module-core/ui";
import { useLocale } from "@kbouffe/module-core/ui";

export function ShareLinks() {
    const { restaurant } = useDashboard();
    const { t } = useLocale();
    const [copied, setCopied] = useState(false);
    const [showQr, setShowQr] = useState(false);
    const [downloading, setDownloading] = useState(false);

    const baseUrl = typeof window !== "undefined" ? window.location.origin : "https://kbouffe.com";
    const storeUrl = `${baseUrl}/r/${restaurant?.slug ?? ""}`;
    const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(storeUrl)}&format=png&margin=10`;

    const handleCopy = async () => {
        await navigator.clipboard.writeText(storeUrl);
        setCopied(true);
        toast.success(t.store.linkCopied);
        setTimeout(() => setCopied(false), 2000);
    };

    const handleDownloadQr = async () => {
        setDownloading(true);
        try {
            const res = await fetch(qrCodeUrl);
            const blob = await res.blob();
            const url = URL.createObjectURL(blob);
            const link = document.createElement("a");
            link.href = url;
            link.download = `qrcode-${restaurant?.slug ?? "boutique"}.png`;
            link.click();
            URL.revokeObjectURL(url);
        } catch {
            toast.error("Impossible de télécharger le QR code");
        } finally {
            setDownloading(false);
        }
    };

    return (
        <Card className="space-y-6">
            <div>
                <h3 className="font-semibold text-surface-900 dark:text-white mb-4">{t.store.shareTitle}</h3>
                <div className="flex items-center gap-2 p-3 bg-surface-50 dark:bg-surface-800 rounded-xl mb-4">
                    <span className="flex-1 text-sm text-surface-600 dark:text-surface-300 truncate">{storeUrl}</span>
                    <Button variant="outline" size="sm" leftIcon={copied ? <Check size={14} /> : <Copy size={14} />} onClick={handleCopy}>
                        {copied ? t.store.copiedLink : t.store.copyLink}
                    </Button>
                </div>
            </div>

            <div className="flex gap-2">
                <Button
                    variant="outline"
                    size="sm"
                    leftIcon={<MessageCircle size={16} />}
                    className="flex-1 bg-green-50/50 dark:bg-green-900/10 border-green-200 dark:border-green-900/30 text-green-700 dark:text-green-400"
                    onClick={() => {
                        window.open(`https://wa.me/?text=${encodeURIComponent(`${t.store.whatsappText}${storeUrl}`)}`, "_blank");
                    }}
                >
                    WhatsApp
                </Button>
                <Button
                    variant="outline"
                    size="sm"
                    leftIcon={<QrCode size={16} />}
                    className="flex-1"
                    onClick={() => setShowQr(!showQr)}
                >
                    QR Code
                </Button>
            </div>

            {showQr && (
                <div className="pt-4 border-t border-surface-100 dark:border-surface-800 flex flex-col items-center animate-in fade-in slide-in-from-top-2">
                    <div className="p-4 bg-white rounded-2xl shadow-inner mb-3">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                            src={qrCodeUrl}
                            alt="QR Code Restaurant"
                            className="w-40 h-40"
                            loading="lazy"
                        />
                    </div>
                    <p className="text-[10px] text-surface-400 text-center mb-4 uppercase font-bold tracking-widest">Scannez pour commander</p>
                    <Button
                        variant="secondary"
                        size="sm"
                        className="w-full h-11 rounded-xl"
                        leftIcon={<Download size={16} />}
                        onClick={handleDownloadQr}
                        isLoading={downloading}
                    >
                        Télécharger le QR Code
                    </Button>
                </div>
            )}
        </Card>
    );
}
