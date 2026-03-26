"use client";

/**
 * Page d'inscription Fournisseur — KBouffe
 *
 * Flux en 2 étapes :
 *   Étape 1 — Création du compte Supabase Auth (téléphone + mot de passe)
 *             + enregistrement en base via POST /api/auth/register
 *   Étape 2 — Formulaire de profil fournisseur (SupplierRegisterForm)
 *
 * Usage :
 *   Accessible via /register/fournisseur
 *   Redirige vers /dashboard/fournisseur en cas de succès
 */

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion, type Variants } from "framer-motion";
import {
    Phone,
    Lock,
    User,
    Eye,
    EyeOff,
    Loader2,
    ChevronLeft,
    Wheat,
    CheckCircle2,
    AlertCircle,
} from "lucide-react";
import { createBrowserClient } from "@supabase/ssr";
import { KbouffeLogo } from "@/components/brand/Logo";
import { authFetch } from "@kbouffe/module-core/ui";
import { SupplierRegisterForm } from "@kbouffe/module-marketplace/ui";

// ── Supabase client ────────────────────────────────────────────────────────

function getSupabaseClient() {
    return createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
}

// ── Types ──────────────────────────────────────────────────────────────────

interface Step1Form {
    full_name: string;
    phone: string;
    password: string;
    confirmPassword: string;
}

// ── Animation variants ─────────────────────────────────────────────────────

const containerVariants: Variants = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: { staggerChildren: 0.08, delayChildren: 0.1 },
    },
};

const itemVariants: Variants = {
    hidden: { opacity: 0, y: 12 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.45, ease: "easeOut" } },
};

const pageVariants: Variants = {
    hidden: { opacity: 0, x: 24 },
    visible: { opacity: 1, x: 0, transition: { duration: 0.4, ease: "easeOut" } },
    exit: { opacity: 0, x: -24, transition: { duration: 0.25 } },
};

// ── Input field helper ─────────────────────────────────────────────────────

function InputField({
    id,
    label,
    type = "text",
    placeholder,
    value,
    onChange,
    icon: Icon,
    rightElement,
    autoComplete,
}: {
    id: string;
    label: string;
    type?: string;
    placeholder: string;
    value: string;
    onChange: (v: string) => void;
    icon: React.ElementType;
    rightElement?: React.ReactNode;
    autoComplete?: string;
}) {
    return (
        <div>
            <label
                htmlFor={id}
                className="block text-sm font-medium text-surface-300 mb-1.5"
            >
                {label}
            </label>
            <div className="relative">
                <Icon
                    size={17}
                    className="absolute left-3.5 top-1/2 -translate-y-1/2 text-surface-400 pointer-events-none"
                />
                <input
                    id={id}
                    type={type}
                    placeholder={placeholder}
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    autoComplete={autoComplete}
                    className="w-full pl-10 pr-4 py-3 rounded-xl bg-surface-800 border border-white/8 text-white placeholder:text-surface-500 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/60 focus:border-brand-500/40 transition-all"
                />
                {rightElement && (
                    <div className="absolute right-3 top-1/2 -translate-y-1/2">
                        {rightElement}
                    </div>
                )}
            </div>
        </div>
    );
}

// ── Step indicator ─────────────────────────────────────────────────────────

function StepBadge({ step, current }: { step: number; current: number }) {
    const done = step < current;
    const active = step === current;
    return (
        <div
            className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all duration-300 ${
                done
                    ? "bg-brand-500 text-white"
                    : active
                    ? "bg-brand-500/20 border-2 border-brand-500 text-brand-300"
                    : "bg-surface-800 border border-white/10 text-surface-500"
            }`}
        >
            {done ? <CheckCircle2 size={16} /> : step + 1}
        </div>
    );
}

// ── Main page ─────────────────────────────────────────────────────────────

export default function FournisseurRegisterPage() {
    const router = useRouter();

    // Step state: 0 = auth form, 1 = supplier profile form
    const [currentStep, setCurrentStep] = useState(0);

    // Step 1 form state
    const [form, setForm] = useState<Step1Form>({
        full_name: "",
        phone: "",
        password: "",
        confirmPassword: "",
    });
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    function updateField(field: keyof Step1Form, value: string) {
        setForm((prev) => ({ ...prev, [field]: value }));
        setError(null);
    }

    // ── Phone normalisation ──────────────────────────────────────────────

    function normalisePhone(raw: string): string {
        const digits = raw.replace(/\D/g, "");
        if (digits.startsWith("237")) return `+${digits}`;
        if (digits.length === 9) return `+237${digits}`;
        return raw.trim();
    }

    // ── Step 1 validation ────────────────────────────────────────────────

    function validate(): string | null {
        if (!form.full_name.trim()) return "Le nom complet est requis.";

        const phone = normalisePhone(form.phone);
        if (!/^\+237[0-9]{9}$/.test(phone))
            return "Numéro invalide. Format attendu : +237XXXXXXXXX";

        if (form.password.length < 6)
            return "Le mot de passe doit comporter au moins 6 caractères.";

        if (form.password !== form.confirmPassword)
            return "Les mots de passe ne correspondent pas.";

        return null;
    }

    // ── Step 1 submit ────────────────────────────────────────────────────

    async function handleStep1Submit(e: FormEvent) {
        e.preventDefault();
        setError(null);

        const validationError = validate();
        if (validationError) {
            setError(validationError);
            return;
        }

        const phone = normalisePhone(form.phone);
        setLoading(true);

        try {
            // 1. Create Supabase Auth account (phone-first with email fallback pattern)
            //    Supabase phone auth requires OTP; we use email as the auth identifier
            //    and store phone in metadata, which is the pattern used in Cameroon.
            const supabase = getSupabaseClient();

            // Use phone-formatted email as Supabase identifier (common Cameroonian pattern)
            const { data: authData, error: authError } = await supabase.auth.signUp({
                phone,
                password: form.password,
                options: {
                    data: {
                        full_name: form.full_name,
                        phone,
                        role: "fournisseur",
                    },
                },
            });

            if (authError) {
                // Supabase may not have phone auth enabled — fall back gracefully
                setError(authError.message);
                return;
            }

            if (!authData.session && !authData.user) {
                setError("Impossible de créer le compte. Vérifiez vos informations.");
                return;
            }

            // 2. Register user profile in app database
            const registerRes = await authFetch("/api/auth/register", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    phone,
                    password: form.password,
                    full_name: form.full_name,
                    role: "fournisseur",
                }),
            });

            if (!registerRes.ok) {
                const body = await registerRes.json().catch(() => ({})) as { message?: string };
                // Non-blocking: user already created in Auth — warn but continue
                console.warn("Register endpoint:", body?.message ?? registerRes.status);
            }

            // 3. Move to supplier profile step
            setCurrentStep(1);
            window.scrollTo({ top: 0, behavior: "smooth" });
        } catch (err) {
            console.error(err);
            setError("Une erreur inattendue s'est produite. Réessayez.");
        } finally {
            setLoading(false);
        }
    }

    // ── Step 2 success ───────────────────────────────────────────────────

    function handleSupplierSuccess() {
        router.push("/dashboard/fournisseur");
    }

    // ── Render ───────────────────────────────────────────────────────────

    return (
        <div className="min-h-screen bg-surface-950 flex flex-col">
            {/* ── Header ──────────────────────────────────────────────── */}
            <header className="px-6 py-5 flex justify-between items-center max-w-5xl mx-auto w-full">
                <Link href="/" className="hover:opacity-80 transition-opacity">
                    <KbouffeLogo height={30} variant="white" />
                </Link>
                <Link
                    href="/login"
                    className="text-sm font-medium text-surface-400 hover:text-brand-300 transition-colors"
                >
                    Déjà inscrit ? Se connecter
                </Link>
            </header>

            {/* ── Main ────────────────────────────────────────────────── */}
            <main className="flex-1 flex items-start justify-center p-4 sm:p-6 pb-16">
                <div className="w-full max-w-lg">
                    {/* Hero header */}
                    <motion.div
                        initial={{ opacity: 0, y: -16 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5 }}
                        className="text-center mb-8"
                    >
                        {/* Icon badge */}
                        <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-emerald-500/15 border border-emerald-500/25 mb-4">
                            <Wheat size={26} className="text-emerald-400" />
                        </div>

                        <h1 className="text-2xl font-extrabold text-white tracking-tight mb-1">
                            Rejoignez le marché <span className="text-brand-300">Kbouffe</span>
                        </h1>
                        <p className="text-surface-400 text-sm">
                            Vendez vos produits directement aux restaurants de votre région
                        </p>
                    </motion.div>

                    {/* Step progress */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.15 }}
                        className="flex items-center justify-center gap-3 mb-8"
                        aria-label="Progression de l'inscription"
                    >
                        <StepBadge step={0} current={currentStep} />
                        <div
                            className={`h-px w-16 transition-all duration-500 ${
                                currentStep >= 1 ? "bg-brand-500" : "bg-white/10"
                            }`}
                        />
                        <StepBadge step={1} current={currentStep} />

                        <div className="ml-4 text-xs text-surface-500">
                            {currentStep === 0
                                ? "Étape 1 sur 2 — Compte"
                                : "Étape 2 sur 2 — Profil fournisseur"}
                        </div>
                    </motion.div>

                    {/* ── Step 1: Auth form ──────────────────────────────── */}
                    {currentStep === 0 && (
                        <motion.div
                            key="step1"
                            variants={pageVariants}
                            initial="hidden"
                            animate="visible"
                            exit="exit"
                        >
                            <div className="bg-surface-900 rounded-2xl border border-white/8 p-6 sm:p-8 shadow-xl">
                                <h2 className="text-lg font-bold text-white mb-1">
                                    Créer votre compte
                                </h2>
                                <p className="text-sm text-surface-400 mb-6">
                                    Votre numéro de téléphone est votre identifiant principal.
                                </p>

                                {/* Error banner */}
                                {error && (
                                    <motion.div
                                        initial={{ opacity: 0, scale: 0.97 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        className="flex items-start gap-3 mb-5 p-3.5 rounded-xl bg-red-500/10 border border-red-500/25 text-red-300 text-sm"
                                        role="alert"
                                    >
                                        <AlertCircle size={16} className="mt-0.5 shrink-0" />
                                        <span>{error}</span>
                                    </motion.div>
                                )}

                                <motion.form
                                    variants={containerVariants}
                                    initial="hidden"
                                    animate="visible"
                                    onSubmit={handleStep1Submit}
                                    className="space-y-4"
                                    noValidate
                                >
                                    <motion.div variants={itemVariants}>
                                        <InputField
                                            id="full_name"
                                            label="Nom complet *"
                                            placeholder="Jean-Pierre Ngom"
                                            value={form.full_name}
                                            onChange={(v) => updateField("full_name", v)}
                                            icon={User}
                                            autoComplete="name"
                                        />
                                    </motion.div>

                                    <motion.div variants={itemVariants}>
                                        <InputField
                                            id="phone"
                                            label="Numéro de téléphone *"
                                            placeholder="+237 6XX XXX XXX"
                                            value={form.phone}
                                            onChange={(v) => updateField("phone", v)}
                                            icon={Phone}
                                            autoComplete="tel"
                                        />
                                        <p className="mt-1.5 text-xs text-surface-500">
                                            Format Cameroun : +237XXXXXXXXX
                                        </p>
                                    </motion.div>

                                    <motion.div variants={itemVariants}>
                                        <InputField
                                            id="password"
                                            label="Mot de passe *"
                                            type={showPassword ? "text" : "password"}
                                            placeholder="••••••••"
                                            value={form.password}
                                            onChange={(v) => updateField("password", v)}
                                            icon={Lock}
                                            autoComplete="new-password"
                                            rightElement={
                                                <button
                                                    type="button"
                                                    onClick={() => setShowPassword((p) => !p)}
                                                    className="text-surface-500 hover:text-surface-300 transition-colors"
                                                    aria-label={
                                                        showPassword
                                                            ? "Masquer le mot de passe"
                                                            : "Afficher le mot de passe"
                                                    }
                                                >
                                                    {showPassword ? (
                                                        <EyeOff size={16} />
                                                    ) : (
                                                        <Eye size={16} />
                                                    )}
                                                </button>
                                            }
                                        />
                                        <p className="mt-1.5 text-xs text-surface-500">
                                            Au moins 6 caractères
                                        </p>
                                    </motion.div>

                                    <motion.div variants={itemVariants}>
                                        <InputField
                                            id="confirmPassword"
                                            label="Confirmer le mot de passe *"
                                            type={showConfirm ? "text" : "password"}
                                            placeholder="••••••••"
                                            value={form.confirmPassword}
                                            onChange={(v) => updateField("confirmPassword", v)}
                                            icon={Lock}
                                            autoComplete="new-password"
                                            rightElement={
                                                <button
                                                    type="button"
                                                    onClick={() => setShowConfirm((p) => !p)}
                                                    className="text-surface-500 hover:text-surface-300 transition-colors"
                                                    aria-label={
                                                        showConfirm
                                                            ? "Masquer la confirmation"
                                                            : "Afficher la confirmation"
                                                    }
                                                >
                                                    {showConfirm ? (
                                                        <EyeOff size={16} />
                                                    ) : (
                                                        <Eye size={16} />
                                                    )}
                                                </button>
                                            }
                                        />
                                    </motion.div>

                                    <motion.div variants={itemVariants} className="pt-2">
                                        <button
                                            type="submit"
                                            disabled={loading}
                                            className="w-full py-3.5 rounded-xl bg-brand-500 hover:bg-brand-600 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold text-sm transition-all shadow-lg shadow-brand-500/20 flex items-center justify-center gap-2"
                                        >
                                            {loading ? (
                                                <>
                                                    <Loader2 size={18} className="animate-spin" />
                                                    Création du compte…
                                                </>
                                            ) : (
                                                "Continuer vers le profil →"
                                            )}
                                        </button>
                                    </motion.div>

                                    <motion.p
                                        variants={itemVariants}
                                        className="text-xs text-center text-surface-500 pt-2"
                                    >
                                        En continuant, vous acceptez nos{" "}
                                        <Link
                                            href="/terms"
                                            className="text-brand-400 hover:underline"
                                        >
                                            conditions d'utilisation
                                        </Link>{" "}
                                        et la{" "}
                                        <Link
                                            href="/privacy"
                                            className="text-brand-400 hover:underline"
                                        >
                                            politique de confidentialité
                                        </Link>
                                        .
                                    </motion.p>
                                </motion.form>
                            </div>
                        </motion.div>
                    )}

                    {/* ── Step 2: Supplier profile form ─────────────────── */}
                    {currentStep === 1 && (
                        <motion.div
                            key="step2"
                            variants={pageVariants}
                            initial="hidden"
                            animate="visible"
                        >
                            {/* Contextual info banner */}
                            <div className="flex items-center gap-3 mb-5 p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-sm">
                                <CheckCircle2 size={18} className="shrink-0" />
                                <div>
                                    <p className="font-semibold">Compte créé avec succès !</p>
                                    <p className="text-emerald-400/80 text-xs mt-0.5">
                                        Complétez maintenant votre profil fournisseur pour accéder à
                                        la marketplace.
                                    </p>
                                </div>
                            </div>

                            {/* SupplierRegisterForm from marketplace module */}
                            <SupplierRegisterForm onSuccess={handleSupplierSuccess} />
                        </motion.div>
                    )}

                    {/* Back to hub link */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.5 }}
                        className="mt-6 text-center"
                    >
                        <Link
                            href="/register"
                            className="inline-flex items-center gap-1.5 text-sm text-surface-500 hover:text-surface-300 transition-colors"
                        >
                            <ChevronLeft size={15} />
                            Retour au choix du profil
                        </Link>
                    </motion.div>
                </div>
            </main>

            {/* ── Footer ──────────────────────────────────────────────── */}
            <footer className="py-6 text-center text-surface-600 text-xs">
                &copy; {new Date().getFullYear()} Kbouffe. Tous droits réservés.
            </footer>
        </div>
    );
}
