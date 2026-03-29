"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Mail, Lock, Eye, EyeOff, Loader2, Shield, Smartphone, ChevronLeft } from "lucide-react";
import { KbouffeLogo } from "@/components/brand/Logo";
import { useState, type FormEvent } from "react";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/client";
import { useLocale } from "@kbouffe/module-core/ui";

type UserRole = "merchant" | "client" | "livreur" | "admin";

function getRedirectPath(role: UserRole | undefined): string {
    switch (role) {
        case "merchant":
            return "/dashboard";
        case "admin":
            return "/admin";
        case "livreur":
            return "/deliveries";
        case "client":
        default:
            return "/stores";
    }
}

export function LoginForm() {
    const router = useRouter();
    const { t } = useLocale();
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [redirectMessage, setRedirectMessage] = useState<string | null>(null);

    const [mfaStep, setMfaStep] = useState(false);
    const [mfaFactorId, setMfaFactorId] = useState<string | null>(null);
    const [mfaCode, setMfaCode] = useState("");
    const [mfaLoading, setMfaLoading] = useState(false);
    const [mfaError, setMfaError] = useState<string | null>(null);
    const [pendingRedirect, setPendingRedirect] = useState<string | null>(null);

    const [form, setForm] = useState({
        email: "",
        password: "",
    });

    function updateField(field: string, value: string) {
        setForm((prev) => ({ ...prev, [field]: value }));
        setError(null);
    }

    async function handleSubmit(e: FormEvent) {
        e.preventDefault();
        setError(null);

        if (!form.email.trim()) {
            setError(t.auth.emailRequired);
            return;
        }
        if (!form.password) {
            setError(t.auth.passwordRequired);
            return;
        }

        if (!isSupabaseConfigured()) {
            setError(t.auth.serviceNotConfigured);
            return;
        }

        setLoading(true);

        try {
            const supabase = createClient();
            if (!supabase) {
                setError(t.auth.serviceUnavailable);
                return;
            }

            const { data, error: authError } = await supabase.auth.signInWithPassword({
                email: form.email,
                password: form.password,
            });

            if (authError) {
                setError(t.auth.invalidCredentials);
                return;
            }

            // Get user role from metadata
            const userRole = data?.user?.user_metadata?.role as UserRole | undefined;
            const redirectPath = getRedirectPath(userRole);

            // Show redirect message based on role
            if (userRole === "merchant" || userRole === "admin") {
                setRedirectMessage(t.auth.redirectingDashboard);
            } else if (userRole === "livreur") {
                setRedirectMessage(t.auth.redirectingDeliveries);
            } else {
                setRedirectMessage(t.auth.redirectingStores);
            }

            // Check if MFA (TOTP) is required before redirecting
            const { data: aal } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
            if (aal?.nextLevel === "aal2" && aal?.currentLevel !== "aal2") {
                const { data: factors } = await supabase.auth.mfa.listFactors();
                const totpFactor = factors?.totp?.[0];
                if (totpFactor) {
                    setMfaFactorId(totpFactor.id);
                    setPendingRedirect(redirectPath);
                    setRedirectMessage(null);
                    setMfaStep(true);
                    return;
                }
            }

            // Small delay to show the message, then redirect
            setTimeout(() => {
                router.push(redirectPath);
            }, 500);
        } catch {
            setError(t.auth.unexpectedError);
        } finally {
            setLoading(false);
        }
    }

    async function handleMfaVerify(e: FormEvent) {
        e.preventDefault();
        if (!mfaFactorId || mfaCode.length !== 6) return;
        setMfaLoading(true);
        setMfaError(null);
        try {
            const supabase = createClient()!;
            const { error: verifyError } = await supabase.auth.mfa.challengeAndVerify({
                factorId: mfaFactorId,
                code: mfaCode,
            });
            if (verifyError) throw verifyError;
            router.push(pendingRedirect!);
        } catch {
            setMfaError("Code invalide ou expiré. Vérifiez votre application et réessayez.");
            setMfaCode("");
        } finally {
            setMfaLoading(false);
        }
    }

    return (
        <div className="w-full max-w-md">
            <div className="text-center mb-8">
                <Link href="/" className="inline-flex items-center gap-2 mb-6">
                    <KbouffeLogo height={40} />
                </Link>
                <h1 className="text-3xl font-bold text-surface-900 dark:text-white mb-2">{t.auth.loginTitle}</h1>
                <p className="text-surface-600 dark:text-surface-400">{t.auth.loginSubtitle}</p>
            </div>

            <div className="bg-white dark:bg-surface-900 rounded-2xl border border-surface-200 dark:border-surface-800 p-8 shadow-sm">
                {mfaStep ? (
                    <form className="space-y-5" onSubmit={handleMfaVerify}>
                        <div className="text-center space-y-3">
                            <div className="w-14 h-14 rounded-2xl bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center mx-auto">
                                <Smartphone size={28} className="text-purple-600 dark:text-purple-400" />
                            </div>
                            <div>
                                <p className="font-bold text-surface-900 dark:text-white text-lg">Double authentification</p>
                                <p className="text-sm text-surface-500 mt-1">
                                    Ouvrez votre application authenticator et entrez le code à 6 chiffres.
                                </p>
                            </div>
                        </div>

                        {mfaError && (
                            <div className="p-3 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 text-sm">
                                {mfaError}
                            </div>
                        )}

                        <div>
                            <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-2">
                                Code à 6 chiffres
                            </label>
                            <input
                                type="text"
                                inputMode="numeric"
                                maxLength={6}
                                value={mfaCode}
                                onChange={(e) => setMfaCode(e.target.value.replace(/\D/g, ""))}
                                placeholder="000000"
                                autoComplete="one-time-code"
                                autoFocus
                                className="w-full px-4 py-3 rounded-xl border border-surface-200 dark:border-surface-700 bg-surface-50 dark:bg-surface-800 text-surface-900 dark:text-white text-center text-2xl font-mono tracking-[0.5em] placeholder:text-surface-300 placeholder:tracking-normal focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent transition-all"
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={mfaLoading || mfaCode.length !== 6}
                            className="w-full py-3 bg-brand-500 hover:bg-brand-600 disabled:opacity-60 disabled:cursor-not-allowed text-white rounded-xl font-semibold transition-all shadow-md shadow-brand-500/20 flex items-center justify-center gap-2"
                        >
                            {mfaLoading ? <Loader2 size={18} className="animate-spin" /> : <Shield size={18} />}
                            {mfaLoading ? "Vérification…" : "Vérifier et se connecter"}
                        </button>

                        <button
                            type="button"
                            onClick={() => { setMfaStep(false); setMfaCode(""); setMfaError(null); }}
                            className="w-full flex items-center justify-center gap-1.5 text-sm text-surface-500 hover:text-surface-700 dark:hover:text-surface-300 transition-colors"
                        >
                            <ChevronLeft size={16} /> Retour à la connexion
                        </button>
                    </form>
                ) : (
                <form className="space-y-5" onSubmit={handleSubmit}>
                    {error && (
                        <div className="p-3 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 text-sm">
                            {error}
                        </div>
                    )}

                    {redirectMessage && (
                        <div className="p-3 rounded-xl bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 text-green-700 dark:text-green-400 text-sm flex items-center gap-2">
                            <Loader2 size={16} className="animate-spin" />
                            {redirectMessage}
                        </div>
                    )}

                    <div>
                        <label htmlFor="email" className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-2">
                            {t.auth.email}
                        </label>
                        <div className="relative">
                            <Mail size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-surface-400" />
                            <input
                                id="email"
                                type="email"
                                placeholder="votre@email.com"
                                value={form.email}
                                onChange={(e) => updateField("email", e.target.value)}
                                required
                                className="w-full pl-11 pr-4 py-3 rounded-xl border border-surface-200 dark:border-surface-700 bg-surface-50 dark:bg-surface-800 text-surface-900 dark:text-white placeholder:text-surface-400 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent transition-all"
                            />
                        </div>
                    </div>

                    <div>
                        <label htmlFor="password" className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-2">
                            {t.auth.password}
                        </label>
                        <div className="relative">
                            <Lock size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-surface-400" />
                            <input
                                id="password"
                                type={showPassword ? "text" : "password"}
                                placeholder="••••••••"
                                value={form.password}
                                onChange={(e) => updateField("password", e.target.value)}
                                required
                                className="w-full pl-11 pr-12 py-3 rounded-xl border border-surface-200 dark:border-surface-700 bg-surface-50 dark:bg-surface-800 text-surface-900 dark:text-white placeholder:text-surface-400 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent transition-all"
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-surface-400 hover:text-surface-600 dark:hover:text-surface-300 transition-colors"
                            >
                                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                            </button>
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full py-3 bg-brand-500 hover:bg-brand-600 disabled:opacity-60 disabled:cursor-not-allowed text-white rounded-xl font-semibold transition-all shadow-md shadow-brand-500/20 hover:shadow-brand-500/40 flex items-center justify-center gap-2"
                    >
                        {loading && <Loader2 size={18} className="animate-spin" />}
                        {loading ? t.auth.loggingIn : t.auth.loginBtn}
                    </button>
                </form>
                )}
            </div>

            <p className="text-center mt-6 text-surface-600 dark:text-surface-400">
                {t.auth.noAccount}{" "}
                <Link href="/register" className="text-brand-500 hover:text-brand-600 font-semibold transition-colors">
                    {t.auth.createStore}
                </Link>
            </p>
        </div>
    );
}
