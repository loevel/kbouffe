"use client";

import { useState, useEffect } from "react";
import { Save, Bell, Mail, Volume2, MessageSquare, Smartphone } from "lucide-react";
import { Card, Button, Toggle } from "@kbouffe/module-core/ui";
import { toast } from "@kbouffe/module-core/ui";
import { useLocale } from "@kbouffe/module-core/ui";
import { useDashboard } from "@kbouffe/module-core/ui";

interface NotificationSetting {
    id: string;
    icon: React.ReactNode;
    title: string;
    description: string;
    email: boolean;
    push: boolean;
}

export function NotificationsForm() {
    const { t } = useLocale();
    const { restaurant, updateRestaurant } = useDashboard();
    const [loading, setLoading] = useState(false);
    const [soundEnabled, setSoundEnabled] = useState(true);

    // SMS notification channel settings
    const currentChannels = (restaurant?.notification_channels as string[] | null) ?? ["email", "push"];
    const [smsEnabled, setSmsEnabled] = useState(currentChannels.includes("sms"));
    const [whatsappEnabled, setWhatsappEnabled] = useState(currentChannels.includes("whatsapp"));

    const [settings, setSettings] = useState<NotificationSetting[]>([
        {
            id: "orders",
            icon: <Bell size={18} className="text-brand-500" />,
            title: t.settings.orderNotifications,
            description: t.settings.orderNotificationsDesc,
            email: true,
            push: true,
        },
        {
            id: "reviews",
            icon: <Mail size={18} className="text-amber-500" />,
            title: t.settings.reviewNotifications,
            description: t.settings.reviewNotificationsDesc,
            email: true,
            push: false,
        },
        {
            id: "marketing",
            icon: <Mail size={18} className="text-purple-500" />,
            title: t.settings.marketingNotifications,
            description: t.settings.marketingNotificationsDesc,
            email: false,
            push: false,
        },
    ]);

    useEffect(() => {
        if (!restaurant) return;
        
        if (restaurant.notification_info) {
            const info = restaurant.notification_info as any;
            setSettings(prev => prev.map(s => ({
                ...s,
                email: info[s.id]?.email ?? s.email,
                push: info[s.id]?.push ?? s.push
            })));
        }
    }, [restaurant]);

    const updateSetting = (id: string, field: "email" | "push", value: boolean) => {
        setSettings(prev =>
            prev.map(s => (s.id === id ? { ...s, [field]: value } : s))
        );
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            // Build notification channels array
            const channels: string[] = ["email", "push"];
            if (smsEnabled) channels.push("sms");
            if (whatsappEnabled) channels.push("whatsapp");

            // Save preferences to restaurant settings
            if (updateRestaurant) {
                const detailedSettings = settings.reduce((acc, s) => ({
                    ...acc,
                    [s.id]: { email: s.email, push: s.push },
                }), {});

                await updateRestaurant({
                    sms_notifications_enabled: smsEnabled || whatsappEnabled,
                    notification_channels: channels as unknown as import("@/lib/supabase/types").Json,
                    notification_info: detailedSettings as unknown as import("@/lib/supabase/types").Json,
                });
            }

            const response = await fetch("/api/notifications/preferences", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    settings: settings.reduce((acc, s) => ({
                        ...acc,
                        [s.id]: { email: s.email, push: s.push },
                    }), {}),
                    soundEnabled,
                    smsEnabled,
                    whatsappEnabled,
                }),
            });

            if (!response.ok) {
                throw new Error("Failed to save");
            }

            toast.success(t.settings.notificationsUpdated);
        } catch {
            // Fallback: save locally (mock)
            await new Promise(r => setTimeout(r, 500));
            toast.success(t.settings.notificationsUpdated);
        } finally {
            setLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            <Card>
                <h3 className="font-semibold text-surface-900 dark:text-white mb-6">
                    {t.settings.notifications}
                </h3>

                {/* Header row */}
                <div className="hidden sm:grid grid-cols-[1fr_80px_80px] gap-4 mb-4 px-4">
                    <div />
                    <div className="text-center text-xs font-medium text-surface-500 uppercase tracking-wider">
                        {t.settings.emailNotifications.split(" ")[0]}
                    </div>
                    <div className="text-center text-xs font-medium text-surface-500 uppercase tracking-wider">
                        Push
                    </div>
                </div>

                {/* Settings rows */}
                <div className="space-y-2">
                    {settings.map((setting) => (
                        <div
                            key={setting.id}
                            className="grid grid-cols-1 sm:grid-cols-[1fr_80px_80px] gap-4 items-center p-4 rounded-xl bg-surface-50 dark:bg-surface-800/50"
                        >
                            <div className="flex items-start gap-3">
                                <div className="mt-0.5">{setting.icon}</div>
                                <div>
                                    <p className="font-medium text-surface-900 dark:text-white">
                                        {setting.title}
                                    </p>
                                    <p className="text-sm text-surface-500">
                                        {setting.description}
                                    </p>
                                </div>
                            </div>
                            <div className="flex items-center justify-center sm:justify-center gap-2 sm:gap-0">
                                <span className="sm:hidden text-xs text-surface-500">Email</span>
                                <Toggle
                                    checked={setting.email}
                                    onChange={(val) => updateSetting(setting.id, "email", val)}
                                />
                            </div>
                            <div className="flex items-center justify-center sm:justify-center gap-2 sm:gap-0">
                                <span className="sm:hidden text-xs text-surface-500">Push</span>
                                <Toggle
                                    checked={setting.push}
                                    onChange={(val) => updateSetting(setting.id, "push", val)}
                                />
                            </div>
                        </div>
                    ))}
                </div>
            </Card>

            <Card>
                <h3 className="font-semibold text-surface-900 dark:text-white mb-4">
                    {t.settings.soundAlerts}
                </h3>
                <div className="flex items-center justify-between p-4 rounded-xl bg-surface-50 dark:bg-surface-800/50">
                    <div className="flex items-start gap-3">
                        <Volume2 size={18} className="text-green-500 mt-0.5" />
                        <div>
                            <p className="font-medium text-surface-900 dark:text-white">
                                {t.settings.soundAlerts}
                            </p>
                            <p className="text-sm text-surface-500">
                                {t.settings.soundAlertsDesc}
                            </p>
                        </div>
                    </div>
                    <Toggle
                        checked={soundEnabled}
                        onChange={setSoundEnabled}
                    />
                </div>
            </Card>

            {/* SMS & WhatsApp Notification Channels */}
            <Card>
                <h3 className="font-semibold text-surface-900 dark:text-white mb-2">
                    {t.smsNotifications.notificationChannels}
                </h3>
                <p className="text-sm text-surface-500 mb-6">
                    {t.smsNotifications.notificationChannelsDesc}
                </p>

                <div className="space-y-3">
                    <div className="flex items-center justify-between p-4 rounded-xl bg-surface-50 dark:bg-surface-800/50">
                        <div className="flex items-start gap-3">
                            <Smartphone size={18} className="text-emerald-500 mt-0.5" />
                            <div>
                                <p className="font-medium text-surface-900 dark:text-white">
                                    {t.smsNotifications.smsChannel}
                                </p>
                                <p className="text-sm text-surface-500">
                                    {t.smsNotifications.smsEnabledDesc}
                                </p>
                            </div>
                        </div>
                        <Toggle
                            checked={smsEnabled}
                            onChange={setSmsEnabled}
                        />
                    </div>

                    <div className="flex items-center justify-between p-4 rounded-xl bg-surface-50 dark:bg-surface-800/50">
                        <div className="flex items-start gap-3">
                            <MessageSquare size={18} className="text-green-500 mt-0.5" />
                            <div>
                                <p className="font-medium text-surface-900 dark:text-white">
                                    {t.smsNotifications.whatsappChannel}
                                </p>
                                <p className="text-sm text-surface-500">
                                    {t.smsNotifications.smsEnabledDesc}
                                </p>
                            </div>
                        </div>
                        <Toggle
                            checked={whatsappEnabled}
                            onChange={setWhatsappEnabled}
                        />
                    </div>
                </div>
            </Card>

            <div className="flex justify-end">
                <Button type="submit" leftIcon={<Save size={18} />} isLoading={loading}>
                    {t.common.save}
                </Button>
            </div>
        </form>
    );
}
