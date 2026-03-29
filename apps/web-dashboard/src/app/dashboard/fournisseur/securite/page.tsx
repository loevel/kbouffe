"use client";

import { motion } from "framer-motion";
import { Shield, Lock } from "lucide-react";
import { TwoFactorSection } from "@/components/shared/TwoFactorSection";
import { useState } from "react";

const itemVariants = {
    hidden: { opacity: 0, y: 12 },
    visible: { opacity: 1, y: 0 },
};

export default function FournisseurSecuritePage() {
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [pwdLoading, setPwdLoading] = useState(false);
    const [pwdMsg, setPwdMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

    const handlePasswordChange = async (e: React.FormEvent) => {
        e.preventDefault();
        setPwdMsg(null);

        if (newPassword !== confirmPassword) {
            setPwdMsg({ type: "error", text: "Les mots de passe ne correspondent pas." });
            return;
        }
        if (newPassword.length < 6) {
            setPwdMsg({ type: "error", text: "Le mot de passe doit contenir au moins 6 caractères." });
            return;
        }

        setPwdLoading(true);
        try {
            const res = await fetch("/api/auth/password", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ password: newPassword }),
            });
            const data = await res.json().catch(() => ({}));
            if (!res.ok) throw new Error(data.error || "Erreur lors du changement de mot de passe");
            setPwdMsg({ type: "success", text: "Mot de passe mis à jour avec succès." });
            setNewPassword("");
            setConfirmPassword("");
        } catch (err: any) {
            setPwdMsg({ type: "error", text: err.message });
        } finally {
            setPwdLoading(false);
        }
    };

    return (
        <motion.div
            initial="hidden"
            animate="visible"
            variants={{ visible: { transition: { staggerChildren: 0.08 } } }}
            className="space-y-6"
        >
            {/* Header */}
            <motion.div variants={itemVariants}>
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-emerald-500/15 border border-emerald-500/20 flex items-center justify-center">
                        <Shield size={20} className="text-emerald-400" />
                    </div>
                    <div>
                        <h1 className="text-xl font-bold text-white">Sécurité du compte</h1>
                        <p className="text-sm text-surface-400">Protégez votre accès fournisseur KBouffe</p>
                    </div>
                </div>
            </motion.div>

            {/* Mot de passe */}
            <motion.div variants={itemVariants} className="rounded-2xl bg-surface-900 border border-white/8 p-6 space-y-4">
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-xl bg-surface-800 flex items-center justify-center">
                        <Lock size={16} className="text-surface-400" />
                    </div>
                    <div>
                        <p className="font-semibold text-white">Mot de passe</p>
                        <p className="text-xs text-surface-500">Choisissez un mot de passe fort et unique.</p>
                    </div>
                </div>

                <form onSubmit={handlePasswordChange} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                            <label className="text-xs font-bold text-surface-500 uppercase tracking-wider">
                                Nouveau mot de passe
                            </label>
                            <input
                                type="password"
                                value={newPassword}
                                onChange={(e) => setNewPassword(e.target.value)}
                                className="w-full px-4 py-2.5 rounded-xl bg-surface-800 border border-white/10 text-white placeholder:text-surface-600 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500/40 outline-none transition-all text-sm"
                                placeholder="••••••••"
                                required
                            />
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-xs font-bold text-surface-500 uppercase tracking-wider">
                                Confirmer le mot de passe
                            </label>
                            <input
                                type="password"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                className="w-full px-4 py-2.5 rounded-xl bg-surface-800 border border-white/10 text-white placeholder:text-surface-600 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500/40 outline-none transition-all text-sm"
                                placeholder="••••••••"
                                required
                            />
                        </div>
                    </div>

                    {pwdMsg && (
                        <div className={`p-3 rounded-xl text-sm font-medium ${
                            pwdMsg.type === "success"
                                ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                                : "bg-red-500/10 text-red-400 border border-red-500/20"
                        }`}>
                            {pwdMsg.text}
                        </div>
                    )}

                    <div className="flex justify-end">
                        <button
                            type="submit"
                            disabled={pwdLoading}
                            className="px-5 py-2.5 bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 text-white text-sm font-bold rounded-xl transition-all flex items-center gap-2"
                        >
                            {pwdLoading ? (
                                <>
                                    <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                    Mise à jour…
                                </>
                            ) : (
                                "Changer le mot de passe"
                            )}
                        </button>
                    </div>
                </form>
            </motion.div>

            {/* Double authentification */}
            <motion.div variants={itemVariants} className="rounded-2xl bg-surface-900 border border-white/8 p-6">
                <TwoFactorSection />
            </motion.div>
        </motion.div>
    );
}
