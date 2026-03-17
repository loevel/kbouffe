"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Mail, Lock, User, Phone, Eye, EyeOff, Store, Loader2 } from "lucide-react";
import { KbouffeLogo } from "@/components/brand/Logo";
import { useState, type FormEvent } from "react";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/client";
import { useLocale } from "@/contexts/locale-context";
import { Turnstile } from "@/components/ui/Turnstile";
import { RoleSelector, type UserRole } from "./RoleSelector";

interface FormData {
    firstName: string;
    lastName: string;
    restaurantName: string;
    phone: string;
    email: string;
    password: string;
}

function getRedirectPath(role: UserRole): string {
    switch (role) {
        case "merchant":
            return "/onboarding";
        case "client":
        default:
            return "/stores";
    }
}

interface RegisterFormProps {
    defaultRole?: UserRole;
}

export function RegisterForm({ defaultRole }: RegisterFormProps = {}) {
    const router = useRouter();
    const { t } = useLocale();
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [turnstileToken, setTurnstileToken] = useState<string | null>(null);
    const [selectedRole, setSelectedRole] = useState<UserRole>(defaultRole || "client");

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

    async function handleSubmit(e: FormEvent) {
        e.preventDefault();
        setError(null);

        // Validation basique
        if (!form.firstName.trim() || !form.lastName.trim()) {
            setError(t.auth.fullNameRequired);
            return;
        }
        if (selectedRole === "merchant" && !form.restaurantName.trim()) {
            setError(t.auth.restaurantRequired);
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

            // Build user metadata based on role
            const metadata: Record<string, string> = {
                full_name: `${form.firstName} ${form.lastName}`,
                phone: form.phone,
                role: selectedRole,
            };

            if (selectedRole === "merchant") {
                metadata.restaurant_name = form.restaurantName;
            }

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

            router.push(getRedirectPath(selectedRole));
        } catch {
            setError(t.auth.unexpectedError);
        } finally {
            setLoading(false);
        }
    }

    // Get the appropriate title and subtitle based on role
    const getTitle = () => {
        switch (selectedRole) {
            case "merchant":
                return t.auth.merchantRegisterTitle;
            default:
                return t.auth.clientRegisterTitle;
        }
    };

    const getSubtitle = () => {
        switch (selectedRole) {
            case "merchant":
                return t.auth.merchantRegisterSubtitle;
            default:
                return t.auth.clientRegisterSubtitle;
        }
    };

    return (
        <div className="w-full max-w-md">
            <div className="text-center mb-8">
                <Link href="/" className="inline-flex items-center gap-2 mb-6">
                    <KbouffeLogo height={40} />
                </Link>
                <h1 className="text-3xl font-bold text-surface-900 dark:text-white mb-2">{getTitle()}</h1>
                <p className="text-surface-600 dark:text-surface-400">{getSubtitle()}</p>
            </div>

            <div className="bg-white dark:bg-surface-900 rounded-2xl border border-surface-200 dark:border-surface-800 p-8 shadow-sm">
                <form className="space-y-5" onSubmit={handleSubmit}>
                    {error && (
                        <div className="p-3 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 text-sm">
                            {error}
                        </div>
                    )}

                    {/* Role Selector - Only show if no default role is forced */}
                    {!defaultRole && (
                        <RoleSelector
                            selectedRole={selectedRole}
                            onRoleChange={setSelectedRole}
                            className="mb-6"
                        />
                    )}

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
                                    className="w-full pl-11 pr-4 py-3 rounded-xl border border-surface-200 dark:border-surface-700 bg-surface-50 dark:bg-surface-800 text-surface-900 dark:text-white placeholder:text-surface-400 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent transition-all"
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
                                className="w-full px-4 py-3 rounded-xl border border-surface-200 dark:border-surface-700 bg-surface-50 dark:bg-surface-800 text-surface-900 dark:text-white placeholder:text-surface-400 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent transition-all"
                            />
                        </div>
                    </div>

                    {/* Restaurant Name - Only for merchants */}
                    {selectedRole === "merchant" && (
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
                                    className="w-full pl-11 pr-4 py-3 rounded-xl border border-surface-200 dark:border-surface-700 bg-surface-50 dark:bg-surface-800 text-surface-900 dark:text-white placeholder:text-surface-400 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent transition-all"
                                />
                            </div>
                        </div>
                    )}

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
                                className="w-full pl-11 pr-4 py-3 rounded-xl border border-surface-200 dark:border-surface-700 bg-surface-50 dark:bg-surface-800 text-surface-900 dark:text-white placeholder:text-surface-400 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent transition-all"
                            />
                        </div>
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
                                minLength={6}
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

                    {process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY && (
                        <Turnstile
                            siteKey={process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY}
                            onVerify={setTurnstileToken}
                            theme="auto"
                            className="flex justify-center"
                        />
                    )}

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full py-3 bg-brand-500 hover:bg-brand-600 disabled:opacity-60 disabled:cursor-not-allowed text-white rounded-xl font-semibold transition-all shadow-md shadow-brand-500/20 hover:shadow-brand-500/40 flex items-center justify-center gap-2"
                    >
                        {loading && <Loader2 size={18} className="animate-spin" />}
                        {loading ? t.auth.registering : t.auth.registerBtn}
                    </button>

                    <p className="text-xs text-center text-surface-500 dark:text-surface-400">
                        {t.auth.termsAgree}
                        <Link href="/terms" className="text-brand-500 hover:underline">{t.auth.termsLink}</Link>
                        {t.auth.andText}
                        <Link href="/privacy" className="text-brand-500 hover:underline">{t.auth.privacyLink}</Link>.
                    </p>
                </form>
            </div>

            <p className="text-center mt-6 text-surface-600 dark:text-surface-400">
                {t.auth.hasAccount}{" "}
                <Link href="/login" className="text-brand-500 hover:text-brand-600 font-semibold transition-colors">
                    {t.auth.loginLink}
                </Link>
            </p>

            {/* Cross Navigation */}
            {defaultRole === "client" && (
                <p className="text-center mt-2 text-sm text-surface-500 dark:text-surface-400">
                    Vous êtes restaurateur ?{" "}
                    <Link href="/register/restaurant" className="font-medium text-surface-700 dark:text-surface-300 hover:text-brand-500 transition-colors">
                        Créer une boutique
                    </Link>
                </p>
            )}
            {defaultRole === "merchant" && (
                <p className="text-center mt-2 text-sm text-surface-500 dark:text-surface-400">
                    Vous êtes client ?{" "}
                    <Link href="/register" className="font-medium text-surface-700 dark:text-surface-300 hover:text-brand-500 transition-colors">
                        Créer un compte
                    </Link>
                </p>
            )}
        </div>
    );
}
