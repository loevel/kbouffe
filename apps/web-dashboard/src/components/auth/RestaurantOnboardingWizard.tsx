"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence, type Variants } from "framer-motion";
import { Mail, Lock, User, Phone, Eye, EyeOff, Store, Loader2, ArrowRight, ArrowLeft, CheckCircle2 } from "lucide-react";
import { KbouffeLogo } from "@/components/brand/Logo";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/client";
import { useLocale, Turnstile } from "@kbouffe/module-core/ui";

interface FormData {
    firstName: string;
    lastName: string;
    restaurantName: string;
    phone: string;
    email: string;
    password: string;
}

const WIZARD_IMAGES = [
    "/images/wizard_step1.png",
    "/images/wizard_step2.png",
    "/images/wizard_step3.png"
];

export function RestaurantOnboardingWizard() {
    const router = useRouter();
    const { t } = useLocale();

    const [currentStep, setCurrentStep] = useState(0);
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [turnstileToken, setTurnstileToken] = useState<string | null>(null);

    const [form, setForm] = useState<FormData>({
        firstName: "",
        lastName: "",
        restaurantName: "",
        phone: "",
        email: "",
        password: "",
    });

    function updateField(field: keyof FormData, value: string) {
        setForm((prev) => ({ ...prev, [field]: value }));
        setError(null);
    }

    function handleNext() {
        setError(null);
        if (currentStep === 0) {
            if (!form.firstName.trim() || !form.lastName.trim() || !form.phone.trim()) {
                setError("Veuillez remplir vos informations personnelles.");
                return;
            }
        } else if (currentStep === 1) {
            if (!form.restaurantName.trim()) {
                setError(t.auth.restaurantRequired);
                return;
            }
        }
        setCurrentStep((prev) => prev + 1);
    }

    function handlePrev() {
        setError(null);
        setCurrentStep((prev) => prev - 1);
    }

    async function handleSubmit(e: FormEvent) {
        e.preventDefault();
        setError(null);

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
                role: "merchant",
                restaurant_name: form.restaurantName,
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

            router.push("/onboarding");
        } catch {
            setError(t.auth.unexpectedError);
        } finally {
            setLoading(false);
        }
    }

    // Animation variants
    const formVariants: Variants = {
        hidden: { opacity: 0, x: 20 },
        visible: { opacity: 1, x: 0, transition: { duration: 0.4, ease: "easeOut" } },
        exit: { opacity: 0, x: -20, transition: { duration: 0.3, ease: "easeIn" } }
    };

    return (
        <div className="flex w-full max-w-6xl mx-auto rounded-3xl overflow-hidden shadow-2xl bg-white dark:bg-surface-900 border border-surface-200 dark:border-surface-800 min-h-[600px]">
            {/* Left Column: Visual Context (Hidden on mobile) */}
            <div className="hidden md:block relative w-1/2 bg-surface-900 border-r border-surface-200 dark:border-surface-800">
                <AnimatePresence mode="popLayout">
                    <motion.div
                        key={currentStep}
                        initial={{ opacity: 0, scale: 1.05 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.8, ease: "easeInOut" }}
                        className="absolute inset-0"
                    >
                        <Image
                            src={WIZARD_IMAGES[currentStep]}
                            alt={`Onboarding step ${currentStep + 1}`}
                            fill
                            className="object-cover"
                            priority
                        />
                        {/* Gradient Overlay for better text legibility if needed */}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                    </motion.div>
                </AnimatePresence>

                <div className="absolute bottom-12 left-12 right-12 z-10 text-white">
                    <div className="flex items-center gap-3 mb-4">
                        <KbouffeLogo height={32} />
                    </div>
                    <motion.div
                        key={`text-${currentStep}`}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                    >
                        {currentStep === 0 && (
                            <>
                                <h2 className="text-3xl font-bold mb-2">Commençons ensemble</h2>
                                <p className="text-white/80">Rejoignez Kbouffe et donnez une nouvelle dimension à votre établissement avec nos outils conçus pour vous.</p>
                            </>
                        )}
                        {currentStep === 1 && (
                            <>
                                <h2 className="text-3xl font-bold mb-2">Votre vitrine digitale</h2>
                                <p className="text-white/80">Configurez votre espace. Nous avons juste besoin du nom de votre restaurant pour initialiser votre environnement.</p>
                            </>
                        )}
                        {currentStep === 2 && (
                            <>
                                <h2 className="text-3xl font-bold mb-2">Sécurité et validation</h2>
                                <p className="text-white/80">Dernière étape ! Protégez votre compte et validez votre inscription pour accéder à votre tableau de bord.</p>
                            </>
                        )}
                    </motion.div>

                    {/* Step Indicators */}
                    <div className="flex gap-2 mt-8">
                        {[0, 1, 2].map((step) => (
                            <div
                                key={step}
                                className={`h-1.5 rounded-full transition-all duration-300 ${currentStep === step ? "w-8 bg-brand-500" : "w-2 bg-white/40"}`}
                            />
                        ))}
                    </div>
                </div>
            </div>

            {/* Right Column: Form Wizard */}
            <div className="w-full md:w-1/2 p-8 lg:p-12 flex flex-col justify-center relative bg-surface-50 dark:bg-surface-900">
                <div className="md:hidden flex justify-center mb-8">
                    <KbouffeLogo height={40} />
                </div>

                <div className="flex-1 w-full max-w-sm mx-auto flex flex-col justify-center">
                    
                    {error && (
                        <div className="mb-6 p-3 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 text-sm">
                            {error}
                        </div>
                    )}

                    <form onSubmit={currentStep === 2 ? handleSubmit : (e) => { e.preventDefault(); handleNext(); }}>
                        <AnimatePresence mode="wait">
                            {currentStep === 0 && (
                                <motion.div
                                    key="step1"
                                    variants={formVariants}
                                    initial="hidden"
                                    animate="visible"
                                    exit="exit"
                                    className="space-y-5"
                                >
                                    <div className="mb-6">
                                        <h3 className="text-2xl font-bold text-surface-900 dark:text-white mb-1">Informations du gérant</h3>
                                        <p className="text-surface-500 dark:text-surface-400 text-sm">Qui est la personne responsable du compte ?</p>
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
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
                                                    className="w-full pl-11 pr-4 py-3 rounded-xl border border-surface-200 dark:border-surface-700 bg-white dark:bg-surface-800 text-surface-900 dark:text-white focus:ring-2 focus:ring-brand-500 transition-all font-medium"
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
                                                className="w-full px-4 py-3 rounded-xl border border-surface-200 dark:border-surface-700 bg-white dark:bg-surface-800 text-surface-900 dark:text-white focus:ring-2 focus:ring-brand-500 transition-all font-medium"
                                            />
                                        </div>
                                    </div>
                                    <div>
                                        <label htmlFor="phone" className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-2">
                                            {t.auth.phone}
                                        </label>
                                        <div className="relative">
                                            <Phone size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-surface-400" />
                                            <input
                                                id="phone"
                                                type="tel"
                                                placeholder="+237 6XX XXX XXX"
                                                value={form.phone}
                                                onChange={(e) => updateField("phone", e.target.value)}
                                                required
                                                className="w-full pl-11 pr-4 py-3 rounded-xl border border-surface-200 dark:border-surface-700 bg-white dark:bg-surface-800 text-surface-900 dark:text-white focus:ring-2 focus:ring-brand-500 transition-all font-medium"
                                            />
                                        </div>
                                    </div>
                                </motion.div>
                            )}

                            {currentStep === 1 && (
                                <motion.div
                                    key="step2"
                                    variants={formVariants}
                                    initial="hidden"
                                    animate="visible"
                                    exit="exit"
                                    className="space-y-5"
                                >
                                    <div className="mb-6">
                                        <h3 className="text-2xl font-bold text-surface-900 dark:text-white mb-1">Détails de l'établissement</h3>
                                        <p className="text-surface-500 dark:text-surface-400 text-sm">Comment vos clients vous connaissent-ils ?</p>
                                    </div>
                                    <div>
                                        <label htmlFor="restaurantName" className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-2">
                                            {t.auth.restaurantName}
                                        </label>
                                        <div className="relative">
                                            <Store size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-surface-400" />
                                            <input
                                                id="restaurantName"
                                                type="text"
                                                placeholder="Chez Mama Ngono"
                                                value={form.restaurantName}
                                                onChange={(e) => updateField("restaurantName", e.target.value)}
                                                required
                                                className="w-full pl-11 pr-4 py-3 rounded-xl border border-surface-200 dark:border-surface-700 bg-white dark:bg-surface-800 text-surface-900 dark:text-white focus:ring-2 focus:ring-brand-500 transition-all font-medium"
                                            />
                                        </div>
                                    </div>
                                </motion.div>
                            )}

                            {currentStep === 2 && (
                                <motion.div
                                    key="step3"
                                    variants={formVariants}
                                    initial="hidden"
                                    animate="visible"
                                    exit="exit"
                                    className="space-y-5"
                                >
                                    <div className="mb-6">
                                        <h3 className="text-2xl font-bold text-surface-900 dark:text-white mb-1">Sécurité de l'accès</h3>
                                        <p className="text-surface-500 dark:text-surface-400 text-sm">Configurez vos identifiants de connexion.</p>
                                    </div>

                                    <div>
                                        <label htmlFor="email" className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-2">
                                            {t.auth.email}
                                        </label>
                                        <div className="relative">
                                            <Mail size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-surface-400" />
                                            <input
                                                id="email"
                                                type="email"
                                                placeholder="contact@restaurant.com"
                                                value={form.email}
                                                onChange={(e) => updateField("email", e.target.value)}
                                                required
                                                className="w-full pl-11 pr-4 py-3 rounded-xl border border-surface-200 dark:border-surface-700 bg-white dark:bg-surface-800 text-surface-900 dark:text-white focus:ring-2 focus:ring-brand-500 transition-all font-medium"
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
                                                minLength={6}
                                                className="w-full pl-11 pr-12 py-3 rounded-xl border border-surface-200 dark:border-surface-700 bg-white dark:bg-surface-800 text-surface-900 dark:text-white focus:ring-2 focus:ring-brand-500 transition-all font-medium"
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

                                    {process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY && (
                                        <div className="pt-2">
                                            <Turnstile
                                                siteKey={process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY}
                                                onVerify={setTurnstileToken}
                                                theme="auto"
                                                className="flex justify-center"
                                            />
                                        </div>
                                    )}

                                </motion.div>
                            )}
                        </AnimatePresence>

                        {/* Navigation Buttons */}
                        <div className="mt-8 flex items-center justify-between gap-4">
                            {currentStep > 0 && (
                                <button
                                    type="button"
                                    onClick={handlePrev}
                                    className="px-6 py-3 rounded-xl border border-surface-200 dark:border-surface-700 bg-white dark:bg-surface-800 text-surface-700 dark:text-surface-300 font-semibold hover:bg-surface-100 dark:hover:bg-surface-700 transition-all flex items-center gap-2"
                                >
                                    <ArrowLeft size={18} />
                                    Retour
                                </button>
                            )}

                            {currentStep < 2 ? (
                                <button
                                    type="submit"
                                    className="ml-auto px-8 py-3 bg-brand-500 hover:bg-brand-600 text-white rounded-xl font-semibold transition-all shadow-md shadow-brand-500/20 hover:shadow-brand-500/40 flex items-center gap-2"
                                >
                                    Continuer
                                    <ArrowRight size={18} />
                                </button>
                            ) : (
                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="ml-auto flex-1 md:flex-none w-full md:w-auto px-8 py-3 bg-brand-500 hover:bg-brand-600 disabled:opacity-60 disabled:cursor-not-allowed text-white rounded-xl font-semibold transition-all shadow-md shadow-brand-500/20 hover:shadow-brand-500/40 flex items-center justify-center gap-2"
                                >
                                    {loading ? (
                                        <Loader2 size={18} className="animate-spin" />
                                    ) : (
                                        <CheckCircle2 size={18} />
                                    )}
                                    {loading ? "Création..." : "Terminer mon inscription"}
                                </button>
                            )}
                        </div>
                        
                        {currentStep === 2 && (
                            <p className="text-xs text-center text-surface-500 dark:text-surface-400 mt-6">
                                {t.auth.termsAgree}
                                <Link href="/terms" className="text-brand-500 hover:underline">{t.auth.termsLink}</Link>
                                {t.auth.andText}
                                <Link href="/privacy" className="text-brand-500 hover:underline">{t.auth.privacyLink}</Link>.
                            </p>
                        )}
                    </form>

                    <div className="mt-8 pt-6 border-t border-surface-200 dark:border-surface-800 flex flex-col items-center gap-2">
                        <p className="text-sm text-surface-600 dark:text-surface-400">
                            {t.auth.hasAccount}{" "}
                            <Link href="/login" className="text-brand-500 hover:text-brand-600 font-semibold transition-colors">
                                {t.auth.loginLink}
                            </Link>
                        </p>
                        <p className="text-sm text-surface-500 dark:text-surface-500">
                            Vous êtes client ?{" "}
                            <Link href="/register/client" className="font-medium text-surface-700 dark:text-surface-300 hover:text-brand-500 transition-colors">
                                Créer un compte
                            </Link>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
