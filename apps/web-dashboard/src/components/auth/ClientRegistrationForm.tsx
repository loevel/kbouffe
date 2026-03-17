"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { motion, type Variants } from "framer-motion";
import { Mail, Lock, User, Phone, Eye, EyeOff, Loader2, Store } from "lucide-react";
import { KbouffeLogo } from "@/components/brand/Logo";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/client";
import { useLocale } from "@/contexts/locale-context";
import { Turnstile } from "@/components/ui/Turnstile";

interface FormData {
    firstName: string;
    lastName: string;
    phone: string;
    email: string;
    password: string;
}

export function ClientRegistrationForm() {
    const router = useRouter();
    const { t } = useLocale();

    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [turnstileToken, setTurnstileToken] = useState<string | null>(null);

    const [form, setForm] = useState<FormData>({
        firstName: "",
        lastName: "",
        phone: "",
        email: "",
        password: "",
    });

    function updateField(field: keyof FormData, value: string) {
        setForm((prev) => ({ ...prev, [field]: value }));
        setError(null);
    }

    async function handleSubmit(e: FormEvent) {
        e.preventDefault();
        setError(null);

        if (!form.firstName.trim() || !form.lastName.trim()) {
            setError(t.auth.fullNameRequired);
            return;
        }

        if (!form.email.trim()) {
            setError(t.auth.emailRequired);
            return;
        }

        if (form.password.length < 6) {
            setError(t.auth.passwordMinLength);
            return;
        }

        if (!turnstileToken && process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY) {
            setError(t.auth.captchaRequired ?? "Veuillez compléter la vérification");
            return;
        }

        if (!isSupabaseConfigured()) {
            setError(t.auth.registerServiceNotConfigured);
            return;
        }

        setLoading(true);

        try {
            const supabase = createClient();
            if (!supabase) {
                setError(t.auth.serviceUnavailable);
                return;
            }

            const metadata: Record<string, string> = {
                full_name: `${form.firstName} ${form.lastName}`,
                phone: form.phone,
                role: "client",
            };

            const { error: authError } = await supabase.auth.signUp({
                email: form.email,
                password: form.password,
                options: {
                    data: metadata,
                },
            });

            if (authError) {
                setError(authError.message);
                return;
            }

            // Redirects to /stores for clients
            router.push("/stores");
        } catch {
            setError(t.auth.unexpectedError);
        } finally {
            setLoading(false);
        }
    }

    // Animation Variants
    const containerVariants: Variants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: { staggerChildren: 0.1, delayChildren: 0.2 }
        }
    };

    const itemVariants: Variants = {
        hidden: { opacity: 0, y: 15 },
        visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" } }
    };

    return (
        <div className="flex w-full max-w-6xl mx-auto rounded-3xl overflow-hidden shadow-2xl bg-white dark:bg-surface-900 border border-surface-200 dark:border-surface-800 min-h-[700px]">
            {/* Left Column: Premium Cinematic Image */}
            <div className="hidden lg:block relative w-1/2 bg-surface-900 border-r border-surface-200 dark:border-surface-800 overflow-hidden">
                <Image
                    src="/images/client_registration_hero.png"
                    alt="Premium Kbouffe Experience"
                    fill
                    className="object-cover scale-105 hover:scale-100 transition-transform duration-1000 ease-out"
                    priority
                />
                {/* Subtle Gradient Overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/20" />
                
                <div className="absolute top-8 left-8">
                    <KbouffeLogo height={32} />
                </div>

                <div className="absolute bottom-12 left-10 p-4">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.6, duration: 0.8 }}
                    >
                        <h2 className="text-4xl font-bold text-white mb-2 leading-tight">
                            L'excellence culinaire, <br />
                            livrée chez vous.
                        </h2>
                        <p className="text-white/80 text-lg font-medium pr-10">
                            Rejoignez la communauté Kbouffe et accédez aux meilleurs restaurants de la ville.
                        </p>
                    </motion.div>
                </div>
            </div>

            {/* Right Column: Registration Form */}
            <div className="w-full lg:w-1/2 p-8 sm:p-12 xl:p-16 flex flex-col justify-center relative bg-surface-50 dark:bg-surface-900 overflow-y-auto">
                <div className="lg:hidden flex justify-center mb-8">
                    <KbouffeLogo height={48} />
                </div>

                <div className="w-full max-w-md mx-auto">
                    <motion.div
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6 }}
                        className="mb-8"
                    >
                        <h1 className="text-3xl font-bold text-surface-900 dark:text-white mb-2">
                            Créer un compte
                        </h1>
                        <p className="text-surface-600 dark:text-surface-400">
                            Vos prochaines commandes n'attendent que vous.
                        </p>
                    </motion.div>

                    {error && (
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="mb-6 p-4 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 text-sm font-medium"
                        >
                            {error}
                        </motion.div>
                    )}

                    <motion.form 
                        variants={containerVariants}
                        initial="hidden"
                        animate="visible"
                        className="space-y-5" 
                        onSubmit={handleSubmit}
                    >
                        <motion.div variants={itemVariants} className="grid grid-cols-2 gap-4">
                            <div>
                                <label htmlFor="firstName" className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-2">
                                    {t.auth.firstName}
                                </label>
                                <div className="relative">
                                    <User size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-surface-400" />
                                    <input
                                        id="firstName"
                                        type="text"
                                        placeholder="Jean"
                                        value={form.firstName}
                                        onChange={(e) => updateField("firstName", e.target.value)}
                                        required
                                        className="w-full pl-11 pr-4 py-3 rounded-xl border border-surface-200 dark:border-surface-700 bg-white dark:bg-surface-800 text-surface-900 dark:text-white placeholder:text-surface-400 focus:outline-none focus:ring-2 focus:ring-brand-500 transition-all font-medium shadow-sm hover:border-surface-300 dark:hover:border-surface-600"
                                    />
                                </div>
                            </div>
                            <div>
                                <label htmlFor="lastName" className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-2">
                                    {t.auth.lastName}
                                </label>
                                <input
                                    id="lastName"
                                    type="text"
                                    placeholder="Dupont"
                                    value={form.lastName}
                                    onChange={(e) => updateField("lastName", e.target.value)}
                                    required
                                    className="w-full px-4 py-3 rounded-xl border border-surface-200 dark:border-surface-700 bg-white dark:bg-surface-800 text-surface-900 dark:text-white placeholder:text-surface-400 focus:outline-none focus:ring-2 focus:ring-brand-500 transition-all font-medium shadow-sm hover:border-surface-300 dark:hover:border-surface-600"
                                />
                            </div>
                        </motion.div>

                        <motion.div variants={itemVariants}>
                            <label htmlFor="phone" className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-2">
                                {t.auth.phone} (Optionnel)
                            </label>
                            <div className="relative">
                                <Phone size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-surface-400" />
                                <input
                                    id="phone"
                                    type="tel"
                                    placeholder="+237 6XX XXX XXX"
                                    value={form.phone}
                                    onChange={(e) => updateField("phone", e.target.value)}
                                    className="w-full pl-11 pr-4 py-3 rounded-xl border border-surface-200 dark:border-surface-700 bg-white dark:bg-surface-800 text-surface-900 dark:text-white placeholder:text-surface-400 focus:outline-none focus:ring-2 focus:ring-brand-500 transition-all font-medium shadow-sm hover:border-surface-300 dark:hover:border-surface-600"
                                />
                            </div>
                        </motion.div>

                        <motion.div variants={itemVariants}>
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
                                    className="w-full pl-11 pr-4 py-3 rounded-xl border border-surface-200 dark:border-surface-700 bg-white dark:bg-surface-800 text-surface-900 dark:text-white placeholder:text-surface-400 focus:outline-none focus:ring-2 focus:ring-brand-500 transition-all font-medium shadow-sm hover:border-surface-300 dark:hover:border-surface-600"
                                />
                            </div>
                        </motion.div>

                        <motion.div variants={itemVariants}>
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
                                    minLength={6}
                                    className="w-full pl-11 pr-12 py-3 rounded-xl border border-surface-200 dark:border-surface-700 bg-white dark:bg-surface-800 text-surface-900 dark:text-white placeholder:text-surface-400 focus:outline-none focus:ring-2 focus:ring-brand-500 transition-all font-medium shadow-sm hover:border-surface-300 dark:hover:border-surface-600"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-surface-400 hover:text-surface-600 dark:hover:text-surface-300 transition-colors"
                                >
                                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                </button>
                            </div>
                        </motion.div>

                        {/* Turnstile / Captcha */}
                        {process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY && (
                            <motion.div variants={itemVariants} className="pt-2">
                                <Turnstile
                                    siteKey={process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY}
                                    onVerify={setTurnstileToken}
                                    theme="auto"
                                    className="flex justify-center"
                                />
                            </motion.div>
                        )}

                        <motion.div variants={itemVariants} className="pt-4">
                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full py-4 bg-brand-500 hover:bg-brand-600 disabled:bg-surface-300 dark:disabled:bg-surface-800 disabled:text-surface-500 dark:disabled:text-surface-600 disabled:cursor-not-allowed text-white rounded-xl font-bold text-lg transition-all shadow-lg shadow-brand-500/25 hover:shadow-brand-500/40 flex items-center justify-center gap-2"
                            >
                                {loading ? (
                                    <>
                                        <Loader2 size={20} className="animate-spin" />
                                        Création en cours...
                                    </>
                                ) : (
                                    "Créer mon compte"
                                )}
                            </button>
                        </motion.div>

                        <motion.p variants={itemVariants} className="text-xs text-center text-surface-500 dark:text-surface-400 pt-4">
                            {t.auth.termsAgree}{" "}
                            <Link href="/terms" className="text-brand-500 hover:underline font-medium">{t.auth.termsLink}</Link>
                            {" "}{t.auth.andText}{" "}
                            <Link href="/privacy" className="text-brand-500 hover:underline font-medium">{t.auth.privacyLink}</Link>.
                        </motion.p>
                    </motion.form>

                    {/* Bottom Links */}
                    <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.8, duration: 0.5 }}
                        className="mt-8 pt-6 border-t border-surface-200 dark:border-surface-800 flex flex-col items-center gap-3"
                    >
                        <p className="text-surface-600 dark:text-surface-400">
                            {t.auth.hasAccount}{" "}
                            <Link href="/login" className="text-brand-500 hover:text-brand-600 font-bold transition-colors">
                                {t.auth.loginLink}
                            </Link>
                        </p>
                        <div className="flex items-center gap-2">
                            <Store size={16} className="text-surface-500" />
                            <p className="text-sm text-surface-500 dark:text-surface-500">
                                Vous êtes restaurateur ?{" "}
                                <Link href="/register/restaurant" className="font-semibold text-surface-800 dark:text-surface-200 hover:text-brand-500 transition-colors">
                                    Créer une boutique
                                </Link>
                            </p>
                        </div>
                    </motion.div>
                </div>
            </div>
        </div>
    );
}
