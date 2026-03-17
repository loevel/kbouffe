"use client";

import { useEffect, useState } from "react";
import { Save, Shield, Smartphone, Monitor, AlertTriangle, Trash2 } from "lucide-react";
import { Card, Button, Input, Toggle } from "@kbouffe/module-core/ui";
import { toast } from "@kbouffe/module-core/ui";
import { useLocale } from "@kbouffe/module-core/ui";
import { useDashboard } from "@kbouffe/module-core/ui";

export function SecurityForm() {
    const { t } = useLocale();
    const { signOut } = useDashboard();
    const [loading, setLoading] = useState(false);
    const [passwordLoading, setPasswordLoading] = useState(false);
    const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

    const [passwordForm, setPasswordForm] = useState({
        current: "",
        new: "",
        confirm: "",
    });

    const [sessions, setSessions] = useState<Array<{
        id: string;
        device: string;
        icon: typeof Monitor;
        location: string;
        lastActive: string;
        current: boolean;
    }>>([]);

    useEffect(() => {
        let mounted = true;

        async function loadSessions() {
            try {
                const response = await fetch("/api/security/sessions", { cache: "no-store" });
                const data = await response.json();
                if (!response.ok || !mounted) return;

                const normalized = (Array.isArray(data.sessions) ? data.sessions : []).map((session: {
                    id: string;
                    device: string;
                    location: string;
                    lastActive: string;
                    current: boolean;
                }) => ({
                    ...session,
                    icon: session.current ? Monitor : Smartphone,
                }));

                setSessions(normalized);
            } catch {
                if (!mounted) return;
                setSessions([]);
            }
        }

        loadSessions();
        return () => {
            mounted = false;
        };
    }, []);

    const handlePasswordChange = async (e: React.FormEvent) => {
        e.preventDefault();

        if (passwordForm.new !== passwordForm.confirm) {
            toast.error(t.settings.passwordMismatch);
            return;
        }

        if (passwordForm.new.length < 6) {
            toast.error("Le mot de passe doit contenir au moins 6 caractères");
            return;
        }

        setPasswordLoading(true);

        try {
            const response = await fetch("/api/security/password", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    currentPassword: passwordForm.current,
                    newPassword: passwordForm.new,
                }),
            });

            const data = await response.json().catch(() => ({}));
            if (!response.ok) {
                throw new Error(data.error || "Erreur lors du changement de mot de passe");
            }

            toast.success(t.settings.passwordChanged);
            setPasswordForm({ current: "", new: "", confirm: "" });
        } catch (error) {
            toast.error(error instanceof Error ? error.message : "Erreur lors du changement de mot de passe");
        } finally {
            setPasswordLoading(false);
        }
    };

    const handleLogoutAll = async () => {
        setLoading(true);
        try {
            const response = await fetch("/api/security/sessions", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ action: "revoke_all" }),
            });

            const data = await response.json().catch(() => ({}));
            if (!response.ok) {
                throw new Error(data.error || "Erreur de déconnexion globale");
            }

            await signOut();
        } catch (error) {
            toast.error(error instanceof Error ? error.message : "Erreur de déconnexion globale");
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteAccount = async () => {
        try {
            const response = await fetch("/api/account", { method: "DELETE" });
            const data = await response.json().catch(() => ({}));

            if (!response.ok) {
                throw new Error(data.error || "Suppression du compte impossible");
            }

            setShowDeleteConfirm(false);
            toast.success("Compte supprimé");
            await signOut();
        } catch (error) {
            toast.error(error instanceof Error ? error.message : "Suppression du compte impossible");
        }
    };

    return (
        <div className="space-y-6">
            {/* Change Password */}
            <Card>
                <h3 className="font-semibold text-surface-900 dark:text-white mb-4">
                    {t.settings.changePassword}
                </h3>
                <form onSubmit={handlePasswordChange} className="space-y-4">
                    <Input
                        label={t.settings.currentPassword}
                        type="password"
                        value={passwordForm.current}
                        onChange={(e) => setPasswordForm(prev => ({ ...prev, current: e.target.value }))}
                        required
                    />
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Input
                            label={t.settings.newPassword}
                            type="password"
                            value={passwordForm.new}
                            onChange={(e) => setPasswordForm(prev => ({ ...prev, new: e.target.value }))}
                            required
                        />
                        <Input
                            label={t.settings.confirmPassword}
                            type="password"
                            value={passwordForm.confirm}
                            onChange={(e) => setPasswordForm(prev => ({ ...prev, confirm: e.target.value }))}
                            required
                        />
                    </div>
                    <div className="flex justify-end">
                        <Button type="submit" leftIcon={<Save size={18} />} isLoading={passwordLoading}>
                            {t.settings.changePassword}
                        </Button>
                    </div>
                </form>
            </Card>

            {/* Two-Factor Authentication */}
            <Card>
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
                            <Shield size={20} className="text-purple-600" />
                        </div>
                        <div>
                            <p className="font-medium text-surface-900 dark:text-white">
                                {t.settings.twoFactor}
                            </p>
                            <p className="text-sm text-surface-500">
                                {t.settings.twoFactorDesc}
                            </p>
                        </div>
                    </div>
                    <Toggle
                        checked={twoFactorEnabled}
                        onChange={setTwoFactorEnabled}
                    />
                </div>
            </Card>

            {/* Active Sessions */}
            <Card>
                <div className="flex items-center justify-between mb-4">
                    <h3 className="font-semibold text-surface-900 dark:text-white">
                        {t.settings.sessions}
                    </h3>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={handleLogoutAll}
                        isLoading={loading}
                    >
                        {t.settings.logoutAll}
                    </Button>
                </div>

                <div className="space-y-3">
                    {sessions.map((session) => {
                        const Icon = session.icon;
                        return (
                            <div
                                key={session.id}
                                className="flex items-center justify-between p-3 rounded-xl bg-surface-50 dark:bg-surface-800/50"
                            >
                                <div className="flex items-center gap-3">
                                    <Icon size={20} className="text-surface-500" />
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <p className="font-medium text-surface-900 dark:text-white">
                                                {session.device}
                                            </p>
                                            {session.current && (
                                                <span className="px-2 py-0.5 text-xs font-medium bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded-full">
                                                    {t.settings.currentSession}
                                                </span>
                                            )}
                                        </div>
                                        <p className="text-sm text-surface-500">
                                            {session.location} · {session.lastActive}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </Card>

            {/* Danger Zone */}
            <Card className="border-red-200 dark:border-red-900">
                <div className="flex items-center gap-2 mb-4">
                    <AlertTriangle size={18} className="text-red-500" />
                    <h3 className="font-semibold text-red-600 dark:text-red-400">
                        {t.settings.dangerZone}
                    </h3>
                </div>

                <div className="flex items-center justify-between p-4 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
                    <div>
                        <p className="font-medium text-surface-900 dark:text-white">
                            {t.settings.deleteAccount}
                        </p>
                        <p className="text-sm text-surface-500">
                            {t.settings.deleteAccountDesc}
                        </p>
                    </div>
                    {showDeleteConfirm ? (
                        <div className="flex items-center gap-2">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setShowDeleteConfirm(false)}
                            >
                                {t.common.cancel}
                            </Button>
                            <Button
                                variant="danger"
                                size="sm"
                                onClick={handleDeleteAccount}
                                leftIcon={<Trash2 size={16} />}
                            >
                                {t.common.confirm}
                            </Button>
                        </div>
                    ) : (
                        <Button
                            variant="danger"
                            size="sm"
                            onClick={() => setShowDeleteConfirm(true)}
                        >
                            {t.settings.deleteAccount}
                        </Button>
                    )}
                </div>
            </Card>
        </div>
    );
}
