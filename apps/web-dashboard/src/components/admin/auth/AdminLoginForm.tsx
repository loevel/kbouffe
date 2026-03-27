"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Mail, Lock, Eye, EyeOff, Loader2, ShieldCheck, AlertTriangle, ArrowRight } from "lucide-react";
import { KbouffeLogo } from "@/components/brand/Logo";
import { useState, type FormEvent } from "react";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/client";

export function AdminLoginForm() {
    const router = useRouter();
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [redirecting, setRedirecting] = useState(false);

    const [form, setForm] = useState({ email: "", password: "" });

    function updateField(field: string, value: string) {
        setForm((prev) => ({ ...prev, [field]: value }));
        setError(null);
    }

    async function handleSubmit(e: FormEvent) {
        e.preventDefault();
        setError(null);

        if (!form.email.trim() || !form.password) {
            setError("Veuillez remplir tous les champs.");
            return;
        }

        if (!isSupabaseConfigured()) {
            setError("Le service d'authentification n'est pas configuré.");
            return;
        }

        setLoading(true);

        try {
            const supabase = createClient();
            if (!supabase) {
                setError("Service d'authentification indisponible.");
                return;
            }

            const { data, error: authError } = await supabase.auth.signInWithPassword({
                email: form.email,
                password: form.password,
            });

            if (authError || !data?.user) {
                setError("Identifiants incorrects. Vérifiez votre e-mail et mot de passe.");
                return;
            }

            // Security check: Verify admin role securely from public.users table
            const { data: userProfile, error: profileError } = await supabase
                .from('users')
                .select('role')
                .eq('id', data.user.id)
                .single();

            if (profileError || userProfile?.role !== 'admin') {
                // Sign out immediately — non-admin user tried to access admin login
                await supabase.auth.signOut();
                setError("Accès refusé. Privilèges insuffisants pour cet espace.");
                return;
            }

            setRedirecting(true);
            setTimeout(() => {
                router.push("/admin");
            }, 500);
        } catch (err) {
            console.error("Login error:", err);
            setError("Une erreur inattendue s'est produite. Veuillez réessayer.");
        } finally {
            if (!redirecting) setLoading(false);
        }
    }

    return (
        <div className="relative min-h-screen w-full flex items-center justify-center overflow-hidden bg-slate-950">
            {/* Premium Background Effects */}
            <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-red-600/20 blur-[120px] pointer-events-none mix-blend-screen" />
            <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-blue-600/10 blur-[120px] pointer-events-none mix-blend-screen" />
            <div className="absolute top-[40%] left-[60%] w-[30%] h-[30%] rounded-full bg-purple-600/10 blur-[100px] pointer-events-none mix-blend-screen" />
            
            {/* Grid Pattern */}
            <div className="absolute inset-0 bg-[url('/grid.svg')] bg-center [mask-image:linear-gradient(180deg,white,rgba(255,255,255,0))] opacity-5 pointer-events-none" />

            {/* Glowing inner shadow border for the page */}
            <div className="absolute inset-0 border border-white/5 pointer-events-none" />

            <div className="relative w-full max-w-[420px] px-6 z-10">
                {/* Header */}
                <div className="text-center mb-8 animate-in fade-in slide-in-from-bottom-4 duration-700 ease-out">
                    <Link href="/" className="inline-flex items-center justify-center mb-8 relative group">
                        <div className="absolute inset-0 bg-red-500/20 blur-xl rounded-full scale-150 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                        <KbouffeLogo height={42} className="relative z-10" />
                    </Link>

                    <div className="flex justify-center mb-6">
                        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-slate-900/80 border border-slate-700/50 shadow-inner backdrop-blur-md transition-all hover:bg-slate-800/80">
                            <div className="p-1 rounded-full bg-red-500/20 text-red-400">
                                <ShieldCheck size={14} className="animate-pulse" />
                            </div>
                            <span className="text-[11px] font-bold tracking-widest text-slate-300 uppercase">
                                Système Central
                            </span>
                        </div>
                    </div>

                    <h1 className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-br from-white via-white to-slate-400 mb-2 tracking-tight">
                        Connexion Admin
                    </h1>
                    <p className="text-sm font-medium text-slate-400">
                        Veuillez vous identifier pour accéder au tableau de bord.
                    </p>
                </div>

                {/* Glassmorphism Form Card */}
                <div className="relative rounded-3xl bg-slate-900/40 backdrop-blur-2xl border border-slate-700/50 p-8 shadow-[0_0_40px_-15px_rgba(0,0,0,0.5)] animate-in fade-in slide-in-from-bottom-8 duration-700 delay-150 ease-out">
                    {/* Top edge highlight */}
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 w-2/3 h-[1px] bg-gradient-to-r from-transparent via-red-500/30 to-transparent" />

                    <form className="space-y-6" onSubmit={handleSubmit}>
                        {/* Error message */}
                        {error && (
                            <div className="flex items-start gap-3 p-4 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-200 text-sm animate-in fade-in zoom-in-95 duration-300">
                                <div className="p-1 rounded-full bg-red-500/20 shrink-0">
                                    <AlertTriangle size={14} className="text-red-400" />
                                </div>
                                <p className="leading-snug">{error}</p>
                            </div>
                        )}

                        {/* Redirect message */}
                        {redirecting && (
                            <div className="flex items-center gap-3 p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-200 text-sm animate-in fade-in zoom-in-95 duration-300">
                                <div className="p-1 rounded-full bg-emerald-500/20 shrink-0">
                                    <Loader2 size={14} className="text-emerald-400 animate-spin" />
                                </div>
                                <p className="font-medium">Identifiants valides. Redirection...</p>
                            </div>
                        )}

                        <div className="space-y-5">
                            {/* Email */}
                            <div className="space-y-2 relative group">
                                <label htmlFor="admin-email" className="block text-xs font-semibold uppercase tracking-wider text-slate-400 pl-1 group-focus-within:text-slate-200 transition-colors">
                                    Adresse E-mail
                                </label>
                                <div className="relative">
                                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-red-400 transition-colors z-10">
                                        <Mail size={18} />
                                    </div>
                                    <input
                                        id="admin-email"
                                        type="email"
                                        placeholder="admin@kbouffe.com"
                                        value={form.email}
                                        onChange={(e) => updateField("email", e.target.value)}
                                        required
                                        autoComplete="email"
                                        className="w-full pl-12 pr-4 py-3.5 rounded-2xl border border-slate-700/50 bg-slate-950/50 text-white placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-red-500/50 focus:border-red-500/50 focus:bg-slate-900 transition-all text-sm shadow-inner"
                                    />
                                    {/* Focus highlight */}
                                    <div className="absolute inset-0 -z-10 rounded-2xl opacity-0 scale-105 group-focus-within:opacity-100 group-focus-within:scale-100 bg-gradient-to-b from-red-500/10 to-transparent transition-all duration-300" />
                                </div>
                            </div>

                            {/* Password */}
                            <div className="space-y-2 relative group">
                                <div className="flex items-center justify-between pl-1">
                                    <label htmlFor="admin-password" className="block text-xs font-semibold uppercase tracking-wider text-slate-400 group-focus-within:text-slate-200 transition-colors">
                                        Mot de passe
                                    </label>
                                </div>
                                <div className="relative">
                                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-red-400 transition-colors z-10">
                                        <Lock size={18} />
                                    </div>
                                    <input
                                        id="admin-password"
                                        type={showPassword ? "text" : "password"}
                                        placeholder="••••••••••••"
                                        value={form.password}
                                        onChange={(e) => updateField("password", e.target.value)}
                                        required
                                        autoComplete="current-password"
                                        className="w-full pl-12 pr-12 py-3.5 rounded-2xl border border-slate-700/50 bg-slate-950/50 text-white placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-red-500/50 focus:border-red-500/50 focus:bg-slate-900 transition-all text-sm shadow-inner"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 focus:outline-none focus:text-white transition-colors z-10 p-1 rounded-md"
                                        aria-label={showPassword ? "Masquer" : "Afficher"}
                                    >
                                        {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                    </button>
                                    {/* Focus highlight */}
                                    <div className="absolute inset-0 -z-10 rounded-2xl opacity-0 scale-105 group-focus-within:opacity-100 group-focus-within:scale-100 bg-gradient-to-b from-red-500/10 to-transparent transition-all duration-300" />
                                </div>
                            </div>
                        </div>

                        {/* Submit */}
                        <div className="pt-2">
                            <button
                                type="submit"
                                disabled={loading || redirecting}
                                className="relative group w-full py-3.5 bg-gradient-to-r from-red-600 to-red-500 hover:from-red-500 hover:to-red-400 disabled:from-slate-800 disabled:to-slate-800 disabled:text-slate-500 disabled:cursor-not-allowed text-white rounded-2xl font-bold text-sm tracking-wide transition-all overflow-hidden flex items-center justify-center gap-2 shadow-[0_0_20px_-5px_rgba(220,38,38,0.5)] hover:shadow-[0_0_30px_-5px_rgba(220,38,38,0.6)]"
                            >
                                {/* Shine effect */}
                                {!loading && !redirecting && (
                                    <div className="absolute inset-0 -translate-x-full group-hover:animate-[shimmer_1.5s_infinite] bg-gradient-to-r from-transparent via-white/20 to-transparent skew-x-12" />
                                )}
                                
                                <span className="relative z-10 flex items-center gap-2 text-base">
                                    {loading ? (
                                        <>
                                            <Loader2 size={18} className="animate-spin" />
                                            Vérification de l'accès...
                                        </>
                                    ) : redirecting ? (
                                        <>
                                            <ShieldCheck size={18} />
                                            Accès Autorisé
                                        </>
                                    ) : (
                                        <>
                                            Connexion Sécurisée
                                            <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                                        </>
                                    )}
                                </span>
                            </button>
                        </div>
                    </form>
                </div>

                {/* Footer nav */}
                <div className="text-center mt-8 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-300 ease-out">
                    <p className="text-xs font-medium text-slate-500 flex items-center justify-center gap-1">
                        Pour l'accès marchand ou client, <Link href="/login" className="text-slate-300 hover:text-white underline decoration-slate-600 underline-offset-4 hover:decoration-white transition-all ml-1">retournez ici</Link>.
                    </p>
                </div>
            </div>
            
            {/* Embedded styles for shimmer */}
            <style dangerouslySetInnerHTML={{ __html: `
                @keyframes shimmer {
                    100% { transform: translateX(100%); }
                }
            `}} />
        </div>
    );
}
