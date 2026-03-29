"use client";

/**
 * /forgot-password — Demande de réinitialisation de mot de passe
 *
 * Fonctionne pour tous les types de comptes :
 *  - Client, Restaurant, Fournisseur/Agriculteur, Admin
 *
 * Flux :
 *  1. Utilisateur saisit son email
 *  2. Supabase envoie un lien de réinitialisation (token valide 1h)
 *  3. Le lien redirige vers /auth/callback?token_hash=xxx&type=recovery
 *  4. Le callback redirige vers /reset-password
 */

import { useState, type FormEvent } from "react";
import Link from "next/link";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { Mail, ArrowRight, ArrowLeft, CheckCircle2, Loader2, AlertTriangle } from "lucide-react";
import { KbouffeLogo } from "@/components/brand/Logo";
import { useSearchParams } from "next/navigation";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/client";

export default function ForgotPasswordPage() {
    const searchParams  = useSearchParams();
    const [email, setEmail]     = useState("");
    const [loading, setLoading] = useState(false);
    const [sent, setSent]       = useState(false);
    const [error, setError]     = useState<string | null>(
        searchParams.get("error") ?? null
    );

    async function handleSubmit(e: FormEvent) {
        e.preventDefault();
        setError(null);

        const trimmed = email.trim().toLowerCase();
        if (!trimmed || !trimmed.includes("@")) {
            setError("Veuillez saisir une adresse email valide.");
            return;
        }

        if (!isSupabaseConfigured()) {
            setError("Service temporairement indisponible. Réessayez dans quelques minutes.");
            return;
        }

        setLoading(true);
        try {
            const supabase = createClient();
            if (!supabase) {
                setError("Service indisponible.");
                return;
            }

            const redirectTo =
                typeof window !== "undefined"
                    ? `${window.location.origin}/auth/callback?next=/reset-password`
                    : `${process.env.NEXT_PUBLIC_APP_URL ?? ""}/auth/callback?next=/reset-password`;

            const { error: sbError } = await supabase.auth.resetPasswordForEmail(trimmed, {
                redirectTo,
            });

            // On affiche toujours le succès même si l'email n'existe pas
            // (sécurité — empêche l'énumération d'adresses)
            if (sbError && sbError.message.toLowerCase().includes("rate")) {
                setError("Trop de tentatives. Attendez quelques minutes avant de réessayer.");
                return;
            }

            setSent(true);
        } catch {
            setError("Une erreur inattendue s'est produite. Réessayez.");
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="flex min-h-screen">
            {/* Left — decorative image */}
            <div className="hidden lg:block lg:w-1/2 relative">
                <Image
                    src="/images/wizard_step2.png"
                    alt="Réinitialisation mot de passe"
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
                        <h2 className="text-4xl font-bold mb-4">Mot de passe oublié ?</h2>
                        <p className="text-lg text-white/80">
                            Pas d'inquiétude. Saisissez votre email et nous vous enverrons un lien pour créer un nouveau mot de passe.
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
                    {/* Logo */}
                    <div className="text-center mb-8">
                        <Link href="/" className="inline-flex items-center gap-2 mb-6">
                            <KbouffeLogo height={40} />
                        </Link>
                        <div className="flex items-center justify-center gap-2 mb-2">
                            <div className="p-2 rounded-lg bg-brand-500/10 text-brand-500">
                                <Mail size={20} />
                            </div>
                            <h1 className="text-3xl font-bold text-surface-900 dark:text-white">
                                Mot de passe oublié
                            </h1>
                        </div>
                        <p className="text-surface-600 dark:text-surface-400">
                            Fonctionne pour tous les types de comptes
                        </p>
                    </div>

                    <div className="bg-white dark:bg-surface-900 rounded-3xl border border-surface-200 dark:border-surface-800 p-8 shadow-xl">
                        <AnimatePresence mode="wait">
                            {sent ? (
                                /* ── Success state ── */
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
                                            Email envoyé !
                                        </h2>
                                        <p className="text-sm text-surface-600 dark:text-surface-400 leading-relaxed">
                                            Si un compte existe pour{" "}
                                            <span className="font-semibold text-surface-900 dark:text-white">{email}</span>,
                                            vous recevrez un lien de réinitialisation dans quelques minutes.
                                        </p>
                                    </div>

                                    <div className="bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 rounded-2xl p-4 text-left">
                                        <p className="text-xs text-amber-700 dark:text-amber-300 leading-relaxed">
                                            <strong>Vous ne trouvez pas l'email ?</strong>{" "}
                                            Vérifiez vos spams ou dossier courrier indésirable.
                                            Le lien est valide pendant <strong>1 heure</strong>.
                                        </p>
                                    </div>

                                    <button
                                        onClick={() => { setSent(false); setEmail(""); }}
                                        className="w-full py-3 border border-surface-200 dark:border-surface-700 text-surface-700 dark:text-surface-300 rounded-2xl text-sm font-medium hover:bg-surface-50 dark:hover:bg-surface-800 transition-colors"
                                    >
                                        Utiliser une autre adresse
                                    </button>
                                </motion.div>
                            ) : (
                                /* ── Email form ── */
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

                                    <div>
                                        <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-1.5 ml-1">
                                            Adresse email du compte
                                        </label>
                                        <div className="relative group">
                                            <Mail size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-surface-400 group-focus-within:text-brand-500 transition-colors" />
                                            <input
                                                type="email"
                                                autoFocus
                                                value={email}
                                                onChange={e => { setEmail(e.target.value); setError(null); }}
                                                placeholder="votre@email.com"
                                                required
                                                className="w-full pl-12 pr-4 py-3.5 rounded-2xl border border-surface-200 dark:border-surface-700 bg-surface-50 dark:bg-surface-800 text-surface-900 dark:text-white placeholder:text-surface-400 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent transition-all"
                                            />
                                        </div>
                                        <p className="text-xs text-surface-500 mt-2 ml-1">
                                            Fonctionne pour les comptes client, restaurant, fournisseur et admin.
                                        </p>
                                    </div>

                                    <button
                                        type="submit"
                                        disabled={loading}
                                        className="group relative w-full py-4 bg-brand-500 hover:bg-brand-600 disabled:opacity-60 disabled:cursor-not-allowed text-white rounded-2xl font-bold transition-all shadow-lg shadow-brand-500/25 hover:shadow-brand-500/40 flex items-center justify-center gap-3"
                                    >
                                        {loading ? (
                                            <Loader2 size={20} className="animate-spin" />
                                        ) : (
                                            <>
                                                <span>Envoyer le lien</span>
                                                <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                                            </>
                                        )}
                                    </button>
                                </motion.form>
                            )}
                        </AnimatePresence>
                    </div>

                    {/* Back to login */}
                    <div className="mt-6 text-center">
                        <Link
                            href="/login"
                            className="inline-flex items-center gap-2 text-sm text-surface-500 hover:text-brand-500 transition-colors"
                        >
                            <ArrowLeft size={14} />
                            Retour à la connexion
                        </Link>
                    </div>
                </motion.div>
            </div>
        </div>
    );
}
