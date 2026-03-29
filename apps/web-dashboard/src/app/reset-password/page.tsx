"use client";

/**
 * /reset-password — Saisie du nouveau mot de passe
 *
 * Accessible uniquement après avoir cliqué le lien de l'email de
 * réinitialisation (session "recovery" active gérée par Supabase).
 *
 * Flux :
 *  1. Supabase a établi une session temporaire via /auth/callback
 *  2. L'utilisateur saisit son nouveau mot de passe (+ confirmation)
 *  3. Appel à supabase.auth.updateUser({ password })
 *  4. Succès → déconnexion + redirection vers /login avec message
 */

import { useState, useEffect, type FormEvent } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
    Lock, Eye, EyeOff, Loader2, CheckCircle2,
    AlertTriangle, ArrowRight, ShieldCheck,
} from "lucide-react";
import { KbouffeLogo } from "@/components/brand/Logo";
import { createClient } from "@/lib/supabase/client";

// ── Password strength helper ──────────────────────────────────────────────────

function getStrength(pw: string): { score: number; label: string; color: string } {
    let score = 0;
    if (pw.length >= 8)  score++;
    if (pw.length >= 12) score++;
    if (/[A-Z]/.test(pw)) score++;
    if (/[0-9]/.test(pw)) score++;
    if (/[^A-Za-z0-9]/.test(pw)) score++;

    if (score <= 1) return { score, label: "Très faible",  color: "bg-red-500" };
    if (score === 2) return { score, label: "Faible",       color: "bg-orange-500" };
    if (score === 3) return { score, label: "Moyen",        color: "bg-amber-400" };
    if (score === 4) return { score, label: "Fort",         color: "bg-green-500" };
    return               { score, label: "Très fort",  color: "bg-emerald-500" };
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function ResetPasswordPage() {
    const router = useRouter();
    const [password,  setPassword]  = useState("");
    const [confirm,   setConfirm]   = useState("");
    const [showPw,    setShowPw]    = useState(false);
    const [showConf,  setShowConf]  = useState(false);
    const [loading,   setLoading]   = useState(false);
    const [success,   setSuccess]   = useState(false);
    const [error,     setError]     = useState<string | null>(null);
    const [hasSession, setHasSession] = useState<boolean | null>(null);

    // Vérification de session recovery au montage
    useEffect(() => {
        const supabase = createClient();
        if (!supabase) { setHasSession(false); return; }
        supabase.auth.getSession().then(({ data }) => {
            setHasSession(!!data.session);
        });
    }, []);

    const strength = getStrength(password);
    const mismatch = confirm.length > 0 && confirm !== password;

    async function handleSubmit(e: FormEvent) {
        e.preventDefault();
        setError(null);

        if (password.length < 8) {
            setError("Le mot de passe doit contenir au moins 8 caractères.");
            return;
        }
        if (password !== confirm) {
            setError("Les deux mots de passe ne correspondent pas.");
            return;
        }

        const supabase = createClient();
        if (!supabase) { setError("Service indisponible."); return; }

        setLoading(true);
        try {
            const { error: updateError } = await supabase.auth.updateUser({ password });
            if (updateError) {
                if (updateError.message.includes("same")) {
                    setError("Le nouveau mot de passe doit être différent de l'ancien.");
                } else {
                    setError(updateError.message ?? "Erreur lors de la mise à jour.");
                }
                return;
            }
            setSuccess(true);
            // Déconnexion propre + redirect
            await supabase.auth.signOut();
            setTimeout(() => {
                router.push("/login?reset=1");
            }, 2500);
        } catch {
            setError("Une erreur inattendue s'est produite. Réessayez.");
        } finally {
            setLoading(false);
        }
    }

    // ── Loading session check ──
    if (hasSession === null) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-surface-50 dark:bg-surface-950">
                <Loader2 size={28} className="animate-spin text-brand-400" />
            </div>
        );
    }

    // ── No valid recovery session ──
    if (!hasSession) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-surface-50 dark:bg-surface-950 p-6">
                <div className="max-w-sm w-full text-center space-y-5">
                    <div className="w-14 h-14 rounded-full bg-amber-500/10 border border-amber-500/20 flex items-center justify-center mx-auto">
                        <AlertTriangle size={24} className="text-amber-400" />
                    </div>
                    <h1 className="text-xl font-bold text-white">Lien expiré ou invalide</h1>
                    <p className="text-sm text-surface-400 leading-relaxed">
                        Ce lien de réinitialisation est invalide ou a déjà été utilisé. Veuillez faire une nouvelle demande.
                    </p>
                    <Link
                        href="/forgot-password"
                        className="inline-flex items-center gap-2 px-5 py-3 bg-brand-500 hover:bg-brand-600 text-white text-sm font-semibold rounded-2xl transition-colors"
                    >
                        Nouvelle demande <ArrowRight size={15} />
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="flex min-h-screen">
            {/* Left — image */}
            <div className="hidden lg:block lg:w-1/2 relative">
                <Image
                    src="/images/wizard_step2.png"
                    alt="Nouveau mot de passe"
                    fill
                    className="object-cover"
                    priority
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                <div className="absolute bottom-12 left-12 right-12">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-white"
                    >
                        <h2 className="text-4xl font-bold mb-4">Nouveau mot de passe</h2>
                        <p className="text-lg text-white/80">
                            Choisissez un mot de passe fort (min. 8 caractères) pour sécuriser votre compte.
                        </p>
                    </motion.div>
                </div>
            </div>

            {/* Right — form */}
            <div className="w-full lg:w-1/2 flex items-center justify-center p-6 bg-surface-50 dark:bg-surface-950">
                <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="w-full max-w-md"
                >
                    <div className="text-center mb-8">
                        <Link href="/" className="inline-flex items-center gap-2 mb-6">
                            <KbouffeLogo height={40} />
                        </Link>
                        <div className="flex items-center justify-center gap-2 mb-2">
                            <div className="p-2 rounded-lg bg-brand-500/10 text-brand-500">
                                <ShieldCheck size={20} />
                            </div>
                            <h1 className="text-3xl font-bold text-surface-900 dark:text-white">
                                Nouveau mot de passe
                            </h1>
                        </div>
                        <p className="text-surface-600 dark:text-surface-400">
                            Choisissez un mot de passe sécurisé
                        </p>
                    </div>

                    <div className="bg-white dark:bg-surface-900 rounded-3xl border border-surface-200 dark:border-surface-800 p-8 shadow-xl">
                        <AnimatePresence mode="wait">
                            {success ? (
                                /* ── Success ── */
                                <motion.div
                                    key="success"
                                    initial={{ opacity: 0, scale: 0.95 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    className="text-center space-y-5"
                                >
                                    <div className="w-16 h-16 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mx-auto">
                                        <CheckCircle2 size={32} className="text-emerald-400" />
                                    </div>
                                    <div>
                                        <h2 className="text-xl font-bold text-surface-900 dark:text-white mb-2">
                                            Mot de passe mis à jour !
                                        </h2>
                                        <p className="text-sm text-surface-600 dark:text-surface-400">
                                            Votre mot de passe a été changé avec succès.
                                            Vous allez être redirigé vers la connexion…
                                        </p>
                                    </div>
                                    <div className="flex items-center justify-center gap-2 text-sm text-brand-400">
                                        <Loader2 size={15} className="animate-spin" />
                                        Redirection en cours…
                                    </div>
                                </motion.div>
                            ) : (
                                /* ── Form ── */
                                <motion.form
                                    key="form"
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    className="space-y-5"
                                    onSubmit={handleSubmit}
                                >
                                    <AnimatePresence>
                                        {error && (
                                            <motion.div
                                                initial={{ opacity: 0, scale: 0.95 }}
                                                animate={{ opacity: 1, scale: 1 }}
                                                exit={{ opacity: 0 }}
                                                className="flex items-center gap-2 p-3 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 text-sm"
                                            >
                                                <AlertTriangle size={15} className="shrink-0" />
                                                {error}
                                            </motion.div>
                                        )}
                                    </AnimatePresence>

                                    {/* New password */}
                                    <div className="space-y-1.5">
                                        <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 ml-1">
                                            Nouveau mot de passe
                                        </label>
                                        <div className="relative group">
                                            <Lock size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-surface-400 group-focus-within:text-brand-500 transition-colors" />
                                            <input
                                                type={showPw ? "text" : "password"}
                                                autoFocus
                                                value={password}
                                                onChange={e => { setPassword(e.target.value); setError(null); }}
                                                placeholder="Minimum 8 caractères"
                                                required
                                                minLength={8}
                                                className="w-full pl-12 pr-12 py-3.5 rounded-2xl border border-surface-200 dark:border-surface-700 bg-surface-50 dark:bg-surface-800 text-surface-900 dark:text-white placeholder:text-surface-400 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent transition-all"
                                            />
                                            <button
                                                type="button"
                                                onClick={() => setShowPw(v => !v)}
                                                className="absolute right-4 top-1/2 -translate-y-1/2 text-surface-400 hover:text-surface-600 dark:hover:text-surface-300 transition-colors"
                                            >
                                                {showPw ? <EyeOff size={18} /> : <Eye size={18} />}
                                            </button>
                                        </div>

                                        {/* Strength bar */}
                                        {password.length > 0 && (
                                            <div className="space-y-1 mt-2">
                                                <div className="flex gap-1">
                                                    {[1, 2, 3, 4, 5].map(i => (
                                                        <div
                                                            key={i}
                                                            className={`flex-1 h-1 rounded-full transition-colors ${
                                                                i <= strength.score ? strength.color : "bg-surface-200 dark:bg-surface-700"
                                                            }`}
                                                        />
                                                    ))}
                                                </div>
                                                <p className={`text-xs ${
                                                    strength.score <= 2 ? "text-red-400" :
                                                    strength.score === 3 ? "text-amber-400" : "text-green-400"
                                                }`}>
                                                    {strength.label}
                                                    {strength.score < 3 && " — Ajoutez des majuscules, chiffres ou symboles"}
                                                </p>
                                            </div>
                                        )}
                                    </div>

                                    {/* Confirm password */}
                                    <div className="space-y-1.5">
                                        <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 ml-1">
                                            Confirmer le mot de passe
                                        </label>
                                        <div className="relative group">
                                            <Lock size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-surface-400 group-focus-within:text-brand-500 transition-colors" />
                                            <input
                                                type={showConf ? "text" : "password"}
                                                value={confirm}
                                                onChange={e => { setConfirm(e.target.value); setError(null); }}
                                                placeholder="Répétez le mot de passe"
                                                required
                                                className={`w-full pl-12 pr-12 py-3.5 rounded-2xl border transition-all bg-surface-50 dark:bg-surface-800 text-surface-900 dark:text-white placeholder:text-surface-400 focus:outline-none focus:ring-2 focus:border-transparent ${
                                                    mismatch
                                                        ? "border-red-400 focus:ring-red-400"
                                                        : "border-surface-200 dark:border-surface-700 focus:ring-brand-500"
                                                }`}
                                            />
                                            <button
                                                type="button"
                                                onClick={() => setShowConf(v => !v)}
                                                className="absolute right-4 top-1/2 -translate-y-1/2 text-surface-400 hover:text-surface-600 dark:hover:text-surface-300 transition-colors"
                                            >
                                                {showConf ? <EyeOff size={18} /> : <Eye size={18} />}
                                            </button>
                                        </div>
                                        {mismatch && (
                                            <p className="text-xs text-red-400 ml-1">Les mots de passe ne correspondent pas.</p>
                                        )}
                                        {confirm.length > 0 && !mismatch && (
                                            <p className="text-xs text-emerald-400 ml-1 flex items-center gap-1">
                                                <CheckCircle2 size={11} /> Les mots de passe correspondent.
                                            </p>
                                        )}
                                    </div>

                                    <button
                                        type="submit"
                                        disabled={loading || mismatch || password.length < 8}
                                        className="group relative w-full py-4 bg-brand-500 hover:bg-brand-600 disabled:opacity-60 disabled:cursor-not-allowed text-white rounded-2xl font-bold transition-all shadow-lg shadow-brand-500/25 hover:shadow-brand-500/40 flex items-center justify-center gap-3"
                                    >
                                        {loading ? (
                                            <Loader2 size={20} className="animate-spin" />
                                        ) : (
                                            <>
                                                <span>Mettre à jour</span>
                                                <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                                            </>
                                        )}
                                    </button>
                                </motion.form>
                            )}
                        </AnimatePresence>
                    </div>
                </motion.div>
            </div>
        </div>
    );
}
