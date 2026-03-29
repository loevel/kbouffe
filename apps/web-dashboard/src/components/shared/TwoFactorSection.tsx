"use client";

import { useEffect, useState } from "react";
import { Shield, CheckCircle, QrCode } from "lucide-react";
import { Button, Input, Toggle, toast, useLocale } from "@kbouffe/module-core/ui";

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

const INITIAL: TwoFactorState = {
    enabled: false,
    factorId: null,
    enrolling: false,
    qrCode: null,
    secret: null,
    pendingFactorId: null,
    verifyCode: "",
    verifyLoading: false,
};

export function TwoFactorSection() {
    const { t } = useLocale();
    const [mfa, setMfa] = useState<TwoFactorState>(INITIAL);

    useEffect(() => {
        let mounted = true;
        fetch("/api/security/2fa", { cache: "no-store" })
            .then(r => r.ok ? r.json() : null)
            .then(data => {
                if (mounted && data) {
                    setMfa(prev => ({ ...prev, enabled: !!data.enabled, factorId: data.factorId ?? null }));
                }
            })
            .catch(() => {});
        return () => { mounted = false; };
    }, []);

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

    return (
        <div className="p-4 rounded-xl border border-surface-200 dark:border-surface-700">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-purple-100 dark:bg-purple-900/30">
                        <Shield size={20} className="text-purple-600 dark:text-purple-400" />
                    </div>
                    <div>
                        <div className="flex items-center gap-2">
                            <p className="font-bold text-surface-900 dark:text-white">{t.settings.twoFactor}</p>
                            {mfa.enabled && (
                                <span className="flex items-center gap-1 text-xs font-medium text-green-600 dark:text-green-400">
                                    <CheckCircle size={13} /> Activée
                                </span>
                            )}
                        </div>
                        <p className="text-xs text-surface-500">{t.settings.twoFactorDesc}</p>
                    </div>
                </div>
                <Toggle checked={mfa.enabled || mfa.enrolling} onChange={handle2FAToggle} />
            </div>

            {mfa.enrolling && mfa.qrCode && (
                <div className="mt-5 pt-5 border-t border-surface-200 dark:border-surface-700 space-y-4 animate-in fade-in slide-in-from-top-2 duration-300">
                    <div className="flex items-center gap-2">
                        <QrCode size={16} className="text-purple-600" />
                        <p className="text-sm font-bold text-surface-900 dark:text-white">{t.settings.twoFactorSetupTitle}</p>
                    </div>
                    <p className="text-xs text-surface-500">{t.settings.twoFactorSetupDesc}</p>
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
                                <Button
                                    onClick={handle2FAVerify}
                                    isLoading={mfa.verifyLoading}
                                    disabled={mfa.verifyCode.length !== 6}
                                >
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
        </div>
    );
}
