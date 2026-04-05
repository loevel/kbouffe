"use client";

import { useState, useEffect } from "react";
import { Lock, LogOut, Smartphone, Globe, Clock } from "lucide-react";
import { Card, Badge, Button, formatDateTime } from "@kbouffe/module-core/ui";
import { useLocale } from "@kbouffe/module-core/ui";

interface LoginSession {
    id: string;
    device: string;
    ip_address: string;
    user_agent: string;
    login_at: string;
    last_activity: string;
    is_current: boolean;
}

export default function SecurityPage() {
    const { t } = useLocale();
    const [sessions, setSessions] = useState<LoginSession[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchSessions = async () => {
            try {
                const res = await fetch("/api/security/sessions");
                if (res.ok) {
                    const data = await res.json();
                    setSessions(data.sessions || []);
                }
            } catch (error) {
                console.error("Error fetching sessions:", error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchSessions();
    }, []);

    const handleLogoutSession = async (sessionId: string) => {
        try {
            const res = await fetch(`/api/security/sessions/${sessionId}`, {
                method: "DELETE",
            });
            if (res.ok) {
                setSessions((prev) => prev.filter((s) => s.id !== sessionId));
            }
        } catch (error) {
            console.error("Error logging out session:", error);
        }
    };

    return (
        <>
            <div className="mb-6">
                <h1 className="text-2xl font-bold text-surface-900 dark:text-white">Sécurité</h1>
                <p className="text-surface-500 dark:text-surface-400 mt-1">
                    Gérez vos sessions et activités de connexion
                </p>
            </div>

            {/* Activité de connexion */}
            <Card className="mb-6">
                <div className="p-6 border-b border-surface-100 dark:border-surface-800">
                    <div className="flex items-center gap-3 mb-6">
                        <Clock className="text-brand-500" size={24} />
                        <h2 className="text-lg font-semibold text-surface-900 dark:text-white">
                            Historique de connexion
                        </h2>
                    </div>

                    {isLoading ? (
                        <div className="space-y-3">
                            {[...Array(3)].map((_, i) => (
                                <div key={i} className="h-16 bg-surface-100 dark:bg-surface-800 rounded-lg animate-pulse" />
                            ))}
                        </div>
                    ) : sessions.length === 0 ? (
                        <div className="text-center py-8">
                            <p className="text-surface-500 dark:text-surface-400">Aucune session active</p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {sessions.map((session) => (
                                <div
                                    key={session.id}
                                    className="flex items-start justify-between p-4 border border-surface-100 dark:border-surface-800 rounded-lg hover:bg-surface-50 dark:hover:bg-surface-800/30 transition"
                                >
                                    <div className="flex items-start gap-3 flex-1">
                                        {session.device.includes("Mobile") ? (
                                            <Smartphone className="text-surface-400 mt-1" size={18} />
                                        ) : (
                                            <Globe className="text-surface-400 mt-1" size={18} />
                                        )}
                                        <div>
                                            <p className="font-medium text-surface-900 dark:text-white flex items-center gap-2">
                                                {session.device}
                                                {session.is_current && (
                                                    <Badge className="bg-brand-100 dark:bg-brand-900/30 text-brand-700 dark:text-brand-300 text-xs">
                                                        Cet appareil
                                                    </Badge>
                                                )}
                                            </p>
                                            <p className="text-sm text-surface-500 dark:text-surface-400 mt-1">
                                                {session.ip_address}
                                            </p>
                                            <p className="text-xs text-surface-400 dark:text-surface-500 mt-1">
                                                Connecté: {formatDateTime(session.login_at)}
                                            </p>
                                            <p className="text-xs text-surface-400 dark:text-surface-500">
                                                Dernière activité: {formatDateTime(session.last_activity)}
                                            </p>
                                        </div>
                                    </div>
                                    {!session.is_current && (
                                        <button
                                            onClick={() => handleLogoutSession(session.id)}
                                            className="ml-2 px-3 py-1.5 text-xs font-medium text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 hover:bg-red-100 dark:hover:bg-red-900/40 rounded-lg transition-colors"
                                        >
                                            <LogOut size={14} className="inline mr-1" />
                                            Déconnecter
                                        </button>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* 2FA — placeholder */}
                <div className="p-6">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <Lock className="text-brand-500" size={24} />
                            <div>
                                <h3 className="font-semibold text-surface-900 dark:text-white">Authentification à deux facteurs</h3>
                                <p className="text-sm text-surface-500 dark:text-surface-400">Non activée</p>
                            </div>
                        </div>
                        <Button className="bg-brand-500 hover:bg-brand-600 text-white">Activer 2FA</Button>
                    </div>
                </div>
            </Card>
        </>
    );
}
