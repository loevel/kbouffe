"use client";

import { useEffect, useState } from "react";
import { Save, Shield, Smartphone, Monitor, AlertTriangle, Trash2, CheckCircle } from "lucide-react";
import { Card, Button, Input, Toggle } from "@kbouffe/module-core/ui";
import { toast } from "@kbouffe/module-core/ui";
import { useLocale } from "@kbouffe/module-core/ui";
import { useDashboard } from "@kbouffe/module-core/ui";

function getPasswordStrength(password: string): { level: 0 | 1 | 2 | 3 } {
    if (!password) return { level: 0 };
    let score = 0;
    if (password.length >= 8) score++;
    if (password.length >= 12) score++;
    if (/[A-Z]/.test(password) && /[0-9!@#$%^&*]/.test(password)) score++;
    return { level: score as 0 | 1 | 2 | 3 };
}

interface TwoFactorState {
    enabled: boolean;
    factorId: string | null;
    enrolling: boolean;
    qrCode: string | null;
    secret: string | null;
    pendingFactorId: string | null;
    verifyCode: string;
    verifyLoading: boolean;
}

export function SecurityForm() {
    const { t } = useLocale();
    const { signOut } = useDashboard();
    const [loading, setLoading] = useState(false);
    const [passwordLoading, setPasswordLoading] = useState(false);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

    const [passwordForm, setPasswordForm] = useState({ current: "", new: "", confirm: "" });

    const [mfa, setMfa] = useState<TwoFactorState>({
        enabled: false,
        factorId: null,
        enrolling: false,
        qrCode: null,
        secret: null,
        pendingFactorId: null,
        verifyCode: "",
        verifyLoading: false,
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

        async function load() {
            try {
                const [sessRes, mfaRes] = await Promise.all([
                    fetch("/api/security/sessions", { cache: "no-store" }),
                    fetch("/api/security/2fa", { cache: "no-store" }),
                ]);

                if (!mounted) return;

                if (sessRes.ok) {
                    const data = await sessRes.json();
                    type ApiSession = {
                        id: string;
                        device: string;
                        location: string;
                        lastActive: string;
                        current: boolean;
                    };
                    setSessions(
                        (Array.isArray(data.sessions) ? (data.sessions as ApiSession[]) : []).map((s) => ({
                            ...s,
                            icon: s.current ? Monitor : Smartphone,
                        }))
                    );
                }

                if (mfaRes.ok) {
                    const data = await mfaRes.json();
                    setMfa(prev => ({ ...prev, enabled: !!data.enabled, factorId: data.factorId ?? null }));
                }
            } catch {
                if (!mounted) return;
            }
        }

        load();
        return () => { mounted = false; };
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
            const res = await fetch("/api/security/password", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ currentPassword: passwordForm.current, newPassword: passwordForm.new }),
            });
            const data = await res.json().catch(() => ({}));
            if (!res.ok) throw new Error(data.error || "Erreur lors du changement de mot de passe");
            toast.success(t.settings.passwordChanged);
            setPasswordForm({ current: "", new: "", confirm: "" });
        } catch (error) {
            toast.error(error instanceof Error ? error.message : "Erreur lors du changement de mot de passe");
        } finally {
            setPasswordLoading(false);
        }
    };

    const handle2FAToggle = async (checked: boolean) => {
        if (checked) {
            try {
                const res = await fetch("/api/security/2fa/enroll", { method: "POST" });
                const data = await res.json().catch(() => ({}));
                if (!res.ok) throw new Error(data.error || "Erreur lors de l'activation");
                setMfa(prev => ({
                    ...prev,
                    enrolling: true,
                    qrCode: data.qrCode,
                    secret: data.secret,
                    pendingFactorId: data.factorId,
                    verifyCode: "",
                }));
            } catch (error) {
                toast.error(error instanceof Error ? error.message : "Erreur activation 2FA");
            }
        } else {
            if (!mfa.factorId) return;
            try {
                const res = await fetch("/api/security/2fa", {
                    method: "DELETE",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ factorId: mfa.factorId }),
                });
                const data = await res.json().catch(() => ({}));
                if (!res.ok) throw new Error(data.error || "Erreur désactivation 2FA");
                setMfa(prev => ({ ...prev, enabled: false, factorId: null, enrolling: false }));
                toast.success(t.settings.twoFactorDisabled);
            } catch (error) {
                toast.error(error instanceof Error ? error.message : "Erreur désactivation 2FA");
            }
        }
    };

    const handle2FAVerify = async () => {
        if (!mfa.verifyCode || !mfa.pendingFactorId) return;
        setMfa(prev => ({ ...prev, verifyLoading: true }));
        try {
            const res = await fetch("/api/security/2fa/verify", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ factorId: mfa.pendingFactorId, code: mfa.verifyCode }),
            });
            const data = await res.json().catch(() => ({}));
            if (!res.ok) throw new Error(data.error || t.settings.twoFactorInvalidCode);
            setMfa(prev => ({
                ...prev,
                enabled: true,
                factorId: prev.pendingFactorId,
                enrolling: false,
                qrCode: null,
                secret: null,
                pendingFactorId: null,
                verifyCode: "",
                verifyLoading: false,
            }));
            toast.success(t.settings.twoFactorEnabled);
        } catch (error) {
            toast.error(error instanceof Error ? error.message : t.settings.twoFactorInvalidCode);
            setMfa(prev => ({ ...prev, verifyLoading: false }));
        }
    };

    const handleLogoutAll = async () => {
        setLoading(true);
        try {
            const res = await fetch("/api/security/sessions", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ action: "revoke_all" }),
            });
            const data = await res.json().catch(() => ({}));
            if (!res.ok) throw new Error(data.error || "Erreur de déconnexion globale");
            await signOut();
        } catch (error) {
            toast.error(error instanceof Error ? error.message : "Erreur de déconnexion globale");
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteAccount = async () => {
        try {
            const res = await fetch("/api/account", { method: "DELETE" });
            const data = await res.json().catch(() => ({}));
            if (!res.ok) throw new Error(data.error || "Suppression du compte impossible");
            setShowDeleteConfirm(false);
            toast.success("Compte supprimé");
            await signOut();
        } catch (error) {
            toast.error(error instanceof Error ? error.message : "Suppression du compte impossible");
        }
    };

    const strength = getPasswordStrength(passwordForm.new);
    const strengthColors = ["bg-surface-200", "bg-red-500", "bg-yellow-500", "bg-green-500"];
    const strengthLabels = ["", t.settings.passwordStrengthWeak, t.settings.passwordStrengthMedium, t.settings.passwordStrengthStrong];

    return (
        <div className="space-y-6">
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
                        <div>
                            <Input
                                label={t.settings.newPassword}
                                type="password"
                                value={passwordForm.new}
                                onChange={(e) => setPasswordForm(prev => ({ ...prev, new: e.target.value }))}
                                required
                            />
                            {passwordForm.new.length > 0 && (
                                <div className="mt-2 space-y-1">
                                    <div className="flex gap-1">
                                        {[1, 2, 3].map((i) => (
                                            <div
                                                key={i}
                                                className={`h-1.5 flex-1 rounded-full transition-colors ${
                                                    strength.level >= i ? strengthColors[strength.level] : "bg-surface-200 dark:bg-surface-700"
                                                }`}
                                            />
                                        ))}
                                    </div>
                                    <p className={`text-xs font-medium ${
                                        strength.level === 1 ? "text-red-500" :
                                        strength.level === 2 ? "text-yellow-500" :
                                        strength.level === 3 ? "text-green-500" : ""
                                    }`}>
                                        {strengthLabels[strength.level]}
                                    </p>
                                </div>
                            )}
                        </div>
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

            <Card>
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
                            <Shield size={20} className="text-purple-600" />
                        </div>
                        <div>
                            <div className="flex items-center gap-2">
                                <p className="font-medium text-surface-900 dark:text-white">
                                    {t.settings.twoFactor}
                                </p>
                                {mfa.enabled && (
                                    <span className="flex items-center gap-1 text-xs font-medium text-green-600 dark:text-green-400">
                                        <CheckCircle size={13} /> Activée
                                    </span>
                                )}
                            </div>
                            <p className="text-sm text-surface-500">
                                {t.settings.twoFactorDesc}
                            </p>
                        </div>
                    </div>
                    <Toggle checked={mfa.enabled || mfa.enrolling} onChange={handle2FAToggle} />
                </div>

                {mfa.enrolling && mfa.qrCode && (
                    <div className="mt-5 pt-5 border-t border-surface-200 dark:border-surface-700 space-y-4">
                        <p className="text-sm font-medium text-surface-900 dark:text-white">
                            {t.settings.twoFactorSetupTitle}
                        </p>
                        <p className="text-sm text-surface-500">{t.settings.twoFactorSetupDesc}</p>
                        <div className="flex flex-col sm:flex-row gap-6 items-start">
                            <img
                                src={mfa.qrCode}
                                alt="QR Code 2FA"
                                className="w-40 h-40 rounded-xl border border-surface-200 dark:border-surface-700"
                            />
                            <div className="flex-1 space-y-3">
                                {mfa.secret && (
                                    <div>
                                        <p className="text-xs text-surface-500 mb-1">{t.settings.twoFactorSecretLabel}</p>
                                        <code className="block px-3 py-2 text-sm font-mono bg-surface-100 dark:bg-surface-800 rounded-lg break-all">
                                            {mfa.secret}
                                        </code>
                                    </div>
                                )}
                                <Input
                                    label={t.settings.twoFactorVerifyCode}
                                    type="text"
                                    inputMode="numeric"
                                    maxLength={6}
                                    value={mfa.verifyCode}
                                    onChange={(e) => setMfa(prev => ({ ...prev, verifyCode: e.target.value.replace(/\D/g, "") }))}
                                    placeholder="000000"
                                    autoComplete="one-time-code"
                                />
                                <div className="flex gap-2">
                                    <Button onClick={handle2FAVerify} isLoading={mfa.verifyLoading} disabled={mfa.verifyCode.length !== 6}>
                                        {t.settings.twoFactorVerify}
                                    </Button>
                                    <Button
                                        variant="outline"
                                        onClick={() => setMfa(prev => ({ ...prev, enrolling: false, qrCode: null, secret: null, pendingFactorId: null }))}
                                    >
                                        {t.common.cancel}
                                    </Button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </Card>

            <Card>
                <div className="flex items-center justify-between mb-4">
                    <h3 className="font-semibold text-surface-900 dark:text-white">
                        {t.settings.sessions}
                    </h3>
                    <Button variant="outline" size="sm" onClick={handleLogoutAll} isLoading={loading}>
                        {t.settings.logoutAll}
                    </Button>
                </div>

                <div className="space-y-3">
                    {sessions.map((session) => {
                        const Icon = session.icon;
                        return (
                            <div key={session.id} className="flex items-center justify-between p-3 rounded-xl bg-surface-50 dark:bg-surface-800/50">
                                <div className="flex items-center gap-3">
                                    <Icon size={20} className="text-surface-500" />
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <p className="font-medium text-surface-900 dark:text-white">{session.device}</p>
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

            <Card className="border-red-200 dark:border-red-900">
                <div className="flex items-center gap-2 mb-4">
                    <AlertTriangle size={18} className="text-red-500" />
                    <h3 className="font-semibold text-red-600 dark:text-red-400">{t.settings.dangerZone}</h3>
                </div>

                <div className="flex items-center justify-between p-4 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
                    <div>
                        <p className="font-medium text-surface-900 dark:text-white">{t.settings.deleteAccount}</p>
                        <p className="text-sm text-surface-500">{t.settings.deleteAccountDesc}</p>
                    </div>
                    {showDeleteConfirm ? (
                        <div className="flex items-center gap-2">
                            <Button variant="outline" size="sm" onClick={() => setShowDeleteConfirm(false)}>
                                {t.common.cancel}
                            </Button>
                            <Button variant="danger" size="sm" onClick={handleDeleteAccount} leftIcon={<Trash2 size={16} />}>
                                {t.common.confirm}
                            </Button>
                        </div>
                    ) : (
                        <Button variant="danger" size="sm" onClick={() => setShowDeleteConfirm(true)}>
                            {t.settings.deleteAccount}
                        </Button>
                    )}
                </div>
            </Card>
        </div>
    );
}
