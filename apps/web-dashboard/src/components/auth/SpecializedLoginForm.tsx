"use client";

import Link from "next/link";
import { Mail, Lock, Eye, EyeOff, Loader2, ArrowRight, User } from "lucide-react";
import { KbouffeLogo } from "@/components/brand/Logo";
import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/client";
import { useLocale } from "@/contexts/locale-context";
import { motion } from "framer-motion";
import Image from "next/image";

type UserType = "client" | "restaurant";

interface SpecializedLoginFormProps {
    type: UserType;
}

export function SpecializedLoginForm({ type }: SpecializedLoginFormProps) {
    const router = useRouter();
    const { t } = useLocale();
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [redirectMessage, setRedirectMessage] = useState<string | null>(null);

    const [form, setForm] = useState({
        email: "",
        password: "",
    });

    const isClient = type === "client";
    const bgImage = isClient ? "/images/client_registration_hero.png" : "/images/wizard_step2.png";
    const themeColor = isClient ? "brand" : "surface"; // Can adjust based on design system

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

            const userRole = data?.user?.user_metadata?.role;
            
            // Basic validation: if they are logging in on the restaurant page, they should probably have a merchant role
            // However, we'll keep the redirect logic flexible for now
            
            let redirectPath = "/stores";
            if (userRole === "merchant" || userRole === "admin") {
                redirectPath = "/dashboard";
                setRedirectMessage(t.auth.redirectingDashboard);
            } else if (userRole === "livreur") {
                redirectPath = "/deliveries";
                setRedirectMessage(t.auth.redirectingDeliveries);
            } else {
                setRedirectMessage(t.auth.redirectingStores);
            }

            setTimeout(() => {
                router.push(redirectPath);
            }, 500);
        } catch {
            setError(t.auth.unexpectedError);
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="flex min-h-screen">
            {/* Left Side - Image for Desktop */}
            <div className="hidden lg:block lg:w-1/2 relative">
                <Image
                    src={bgImage}
                    alt="Login Background"
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
                        <h2 className="text-4xl font-bold mb-4">
                            {isClient ? "Bienvenue sur Kbouffe" : "Gérez votre restaurant"}
                        </h2>
                        <p className="text-lg text-white/80">
                            {isClient 
                                ? "La révolution culinaire au Cameroun dans votre poche." 
                                : "Digitalisez votre établissement et boostez votre chiffre d'affaires."}
                        </p>
                    </motion.div>
                </div>
            </div>

            {/* Right Side - Form */}
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
                             <div className={`p-2 rounded-lg bg-brand-500/10 text-brand-500`}>
                                {isClient ? <User size={20} /> : <Mail size={20} />}
                            </div>
                            <h1 className="text-3xl font-bold text-surface-900 dark:text-white">
                                {isClient ? "Espace Client" : "Espace Restaurant"}
                            </h1>
                        </div>
                        <p className="text-surface-600 dark:text-surface-400">
                            {t.auth.loginSubtitle}
                        </p>
                    </div>

                    <div className="bg-white dark:bg-surface-900 rounded-3xl border border-surface-200 dark:border-surface-800 p-8 shadow-xl">
                        <form className="space-y-6" onSubmit={handleSubmit}>
                            {error && (
                                <motion.div 
                                    initial={{ opacity: 0, scale: 0.95 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    className="p-3 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 text-sm"
                                >
                                    {error}
                                </motion.div>
                            )}

                            {redirectMessage && (
                                <div className="p-3 rounded-xl bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 text-green-700 dark:text-green-400 text-sm flex items-center gap-2">
                                    <Loader2 size={16} className="animate-spin" />
                                    {redirectMessage}
                                </div>
                            )}

                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-1.5 ml-1">
                                        Email
                                    </label>
                                    <div className="relative group">
                                        <Mail size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-surface-400 group-focus-within:text-brand-500 transition-colors" />
                                        <input
                                            type="email"
                                            placeholder="votre@email.com"
                                            value={form.email}
                                            onChange={(e) => updateField("email", e.target.value)}
                                            required
                                            className="w-full pl-12 pr-4 py-3.5 rounded-2xl border border-surface-200 dark:border-surface-700 bg-surface-50 dark:bg-surface-800 text-surface-900 dark:text-white placeholder:text-surface-400 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent transition-all"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-1.5 ml-1">
                                        Mot de passe
                                    </label>
                                    <div className="relative group">
                                        <Lock size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-surface-400 group-focus-within:text-brand-500 transition-colors" />
                                        <input
                                            type={showPassword ? "text" : "password"}
                                            placeholder="••••••••"
                                            value={form.password}
                                            onChange={(e) => updateField("password", e.target.value)}
                                            required
                                            className="w-full pl-12 pr-12 py-3.5 rounded-2xl border border-surface-200 dark:border-surface-700 bg-surface-50 dark:bg-surface-800 text-surface-900 dark:text-white placeholder:text-surface-400 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent transition-all"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowPassword(!showPassword)}
                                            className="absolute right-4 top-1/2 -translate-y-1/2 text-surface-400 hover:text-surface-600 dark:hover:text-surface-300 transition-colors"
                                        >
                                            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                        </button>
                                    </div>
                                    <div className="flex justify-end mt-2">
                                        <Link href="/forgot-password" title="Mot de passe oublié ?" className="text-xs text-brand-500 hover:text-brand-600 font-medium">
                                            Mot de passe oublié ?
                                        </Link>
                                    </div>
                                </div>
                            </div>

                            <button
                                type="submit"
                                disabled={loading}
                                className="group relative w-full py-4 bg-brand-500 hover:bg-brand-600 disabled:opacity-60 disabled:cursor-not-allowed text-white rounded-2xl font-bold transition-all shadow-lg shadow-brand-500/25 hover:shadow-brand-500/40 flex items-center justify-center gap-3 overflow-hidden"
                            >
                                {loading ? (
                                    <Loader2 size={20} className="animate-spin" />
                                ) : (
                                    <>
                                        <span>Se connecter</span>
                                        <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                                    </>
                                )}
                            </button>
                        </form>
                    </div>

                    <div className="mt-8 text-center space-y-4">
                        <p className="text-surface-600 dark:text-surface-400 text-sm">
                            Pas encore de compte ?{" "}
                            <Link 
                                href={isClient ? "/register/client" : "/register/restaurant"} 
                                className="text-brand-500 hover:text-brand-600 font-bold"
                            >
                                S'inscrire gratuitement
                            </Link>
                        </p>
                        
                        <div className="pt-4 border-t border-surface-200 dark:border-surface-800">
                            <Link 
                                href={isClient ? "/login/restaurant" : "/login/client"}
                                className="text-xs text-surface-500 dark:text-surface-500 hover:text-brand-500 transition-colors inline-flex items-center gap-2"
                            >
                                Passer à l'espace {isClient ? "Restaurant" : "Client"}
                                <ArrowRight size={12} />
                            </Link>
                        </div>
                    </div>
                </motion.div>
            </div>
        </div>
    );
}
