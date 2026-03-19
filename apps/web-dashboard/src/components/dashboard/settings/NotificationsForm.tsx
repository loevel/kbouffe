"use client";

import { useState, useEffect } from "react";
import { Save, Bell, Mail, Volume2, MessageSquare, Smartphone, Clock } from "lucide-react";
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
    const [dailyReportEnabled, setDailyReportEnabled] = useState((restaurant as any)?.dailyReportEnabled ?? true);
    const [waitAlertThreshold, setWaitAlertThreshold] = useState((restaurant as any)?.waitAlertThresholdMinutes?.toString() ?? "15");

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
        
        setDailyReportEnabled((restaurant as any).dailyReportEnabled ?? true);
        setWaitAlertThreshold((restaurant as any).waitAlertThresholdMinutes?.toString() ?? "15");

        if ((restaurant as any).notification_info) {
            const info = (restaurant as any).notification_info;
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

                const payload: any = {
                    sms_notifications_enabled: smsEnabled || whatsappEnabled,
                    notification_channels: channels,
                    notification_info: detailedSettings,
                    dailyReportEnabled: dailyReportEnabled,
                    waitAlertThresholdMinutes: parseInt(waitAlertThreshold) || 15,
                };
                await updateRestaurant(payload);
            }

            toast.success(t.settings.notificationsUpdated);
        } catch {
            toast.error("Erreur de sauvegarde");
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

                {/* Daily Report Toggle */}
                <div className="flex items-center justify-between p-4 rounded-xl bg-brand-50/50 dark:bg-brand-900/10 border border-brand-100 dark:border-brand-900/30 mb-6">
                    <div className="flex items-start gap-3">
                        <Mail size={18} className="text-brand-500 mt-0.5" />
                        <div>
                            <p className="font-bold text-brand-900 dark:text-brand-100">Rapport journalier par email</p>
                            <p className="text-xs text-brand-700 dark:text-brand-300">Recevez un résumé de vos ventes chaque matin à 8h00.</p>
                        </div>
                    </div>
                    <Toggle checked={dailyReportEnabled} onChange={setDailyReportEnabled} />
                </div>

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

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                    <h3 className="font-semibold text-surface-900 dark:text-white mb-4">Alertes Opérationnelles</h3>
                    <div className="space-y-4">
                        <div className="flex items-center justify-between p-4 rounded-xl bg-surface-50 dark:bg-surface-800/50">
                            <div className="flex items-start gap-3">
                                <Volume2 size={18} className="text-green-500 mt-0.5" />
                                <div>
                                    <p className="font-medium text-surface-900 dark:text-white">{t.settings.soundAlerts}</p>
                                    <p className="text-xs text-surface-500">{t.settings.soundAlertsDesc}</p>
                                </div>
                            </div>
                            <Toggle checked={soundEnabled} onChange={setSoundEnabled} />
                        </div>
                        
                        <div className="p-4 rounded-xl bg-surface-50 dark:bg-surface-800/50 space-y-3">
                            <div className="flex items-start gap-3">
                                <Clock size={18} className="text-amber-500 mt-0.5" />
                                <div>
                                    <p className="font-medium text-surface-900 dark:text-white">Seuil d'alerte (Attente)</p>
                                    <p className="text-xs text-surface-500">Alerte visuelle si une commande attend plus de X minutes.</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-2 pt-2">
                                <input 
                                    type="number" 
                                    value={waitAlertThreshold} 
                                    onChange={(e) => setWaitAlertThreshold(e.target.value)}
                                    className="w-20 px-3 py-2 rounded-lg bg-white dark:bg-surface-900 border border-surface-200 dark:border-surface-700 text-sm font-bold"
                                />
                                <span className="text-sm font-medium text-surface-500">minutes</span>
                            </div>
                        </div>
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
            </div>

            <div className="flex justify-end">
                <Button type="submit" leftIcon={<Save size={18} />} isLoading={loading}>
                    {t.common.save}
                </Button>
            </div>
        </form>
    );
}
