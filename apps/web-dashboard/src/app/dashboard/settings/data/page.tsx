"use client";

import { useState, useEffect } from "react";
import { SettingsNav } from "@/components/dashboard/settings/SettingsNav";
import {
    Download,
    Loader2,
    FileJson,
    ShieldCheck,
    Package,
    ShoppingBag,
    Star,
    Users,
    CheckCircle2,
    AlertTriangle,
    Info,
} from "lucide-react";

type Stats = {
    products: number;
    orders: number;
    reviews: number;
    team: number;
};

export default function DataExportPage() {
    const [stats, setStats] = useState<Stats | null>(null);
    const [loadingStats, setLoadingStats] = useState(true);
    const [downloading, setDownloading] = useState(false);
    const [done, setDone] = useState(false);

    useEffect(() => {
        // Fetch quick stats from existing API endpoints
        Promise.all([
            fetch("/api/analytics/stats").then(r => r.ok ? r.json() : null).catch(() => null),
        ]).then(([analytics]) => {
            setStats({
                products: analytics?.totalProducts ?? 0,
                orders: analytics?.totalOrders ?? 0,
                reviews: 0,
                team: 0,
            });
            setLoadingStats(false);
        });
    }, []);

    const handleDownload = async () => {
        setDownloading(true);
        setDone(false);
        try {
            const res = await fetch("/api/export/restaurant");
            if (!res.ok) throw new Error("Erreur serveur");

            // Get filename from Content-Disposition header
            const disposition = res.headers.get("Content-Disposition") ?? "";
            const match = disposition.match(/filename="([^"]+)"/);
            const filename = match?.[1] ?? "kbouffe-export.json";

            // Trigger browser download
            const blob = await res.blob();
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = filename;
            a.click();
            URL.revokeObjectURL(url);
            setDone(true);
            setTimeout(() => setDone(false), 5000);
        } catch {
            alert("Erreur lors du téléchargement. Veuillez réessayer.");
        } finally {
            setDownloading(false);
        }
    };

    const STAT_ITEMS = [
        { icon: Package, label: "Produits au menu", value: stats?.products ?? 0, color: "text-brand-500", bg: "bg-brand-50 dark:bg-brand-500/10" },
        { icon: ShoppingBag, label: "Commandes totales", value: stats?.orders ?? 0, color: "text-blue-500", bg: "bg-blue-50 dark:bg-blue-500/10" },
        { icon: Star, label: "Avis clients", value: stats?.reviews ?? 0, color: "text-amber-500", bg: "bg-amber-50 dark:bg-amber-500/10" },
        { icon: Users, label: "Membres d'équipe", value: stats?.team ?? 0, color: "text-violet-500", bg: "bg-violet-50 dark:bg-violet-500/10" },
    ];

    return (
        <>
            <div className="mb-6">
                <h1 className="text-2xl font-bold text-surface-900 dark:text-white">Paramètres</h1>
                <p className="text-surface-500 dark:text-surface-400 mt-1">Gérez les informations de votre restaurant</p>
            </div>
            <SettingsNav />

            <div className="max-w-2xl space-y-6">
                {/* Header */}
                <div>
                    <h2 className="text-xl font-bold text-surface-900 dark:text-white flex items-center gap-2">
                        <Download size={20} className="text-brand-500" />
                        Données & Confidentialité
                    </h2>
                    <p className="text-surface-500 dark:text-surface-400 mt-1 text-sm">
                        Téléchargez une copie complète de toutes vos données hébergées sur kBouffe.
                    </p>
                </div>

                {/* RGPD notice */}
                <div className="flex items-start gap-3 p-4 rounded-xl bg-blue-50 dark:bg-blue-500/10 border border-blue-200 dark:border-blue-500/20">
                    <ShieldCheck size={18} className="text-blue-500 flex-shrink-0 mt-0.5" />
                    <div className="text-sm text-blue-700 dark:text-blue-300">
                        <strong>Droit d&apos;accès aux données (Loi n°2010/012 Art.48)</strong><br />
                        Vous avez le droit d&apos;obtenir une copie de vos données dans un format lisible par machine. Cet export est généré à la demande et contient uniquement vos propres données.
                    </div>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {STAT_ITEMS.map(({ icon: Icon, label, value, color, bg }) => (
                        <div key={label} className="p-4 rounded-xl border border-surface-200 dark:border-surface-700 bg-white dark:bg-surface-900">
                            <div className={`w-9 h-9 rounded-lg ${bg} flex items-center justify-center mb-2`}>
                                <Icon size={16} className={color} />
                            </div>
                            <p className="text-xl font-bold text-surface-900 dark:text-white">
                                {loadingStats ? "…" : value.toLocaleString("fr-FR")}
                            </p>
                            <p className="text-xs text-surface-400 mt-0.5">{label}</p>
                        </div>
                    ))}
                </div>

                {/* What's included */}
                <div className="p-5 rounded-xl border border-surface-200 dark:border-surface-700 bg-white dark:bg-surface-900">
                    <h3 className="text-sm font-semibold text-surface-900 dark:text-white mb-3 flex items-center gap-2">
                        <Info size={14} className="text-surface-400" />
                        Contenu de l'export
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-2 gap-x-4">
                        {[
                            "Informations du restaurant",
                            "Tous vos produits & menu",
                            "Catégories de menu",
                            "Historique des commandes",
                            "Détails des articles commandés",
                            "Avis et évaluations reçus",
                            "Membres de l'équipe",
                        ].map(item => (
                            <div key={item} className="flex items-center gap-2 text-sm text-surface-600 dark:text-surface-400">
                                <CheckCircle2 size={13} className="text-green-500 flex-shrink-0" />
                                {item}
                            </div>
                        ))}
                    </div>
                    <div className="mt-3 pt-3 border-t border-surface-100 dark:border-surface-800">
                        <div className="flex items-center gap-2 text-xs text-surface-400">
                            <AlertTriangle size={12} className="text-amber-500" />
                            Données exclues : mots de passe, tokens de paiement, clés API.
                        </div>
                    </div>
                </div>

                {/* Format info */}
                <div className="flex items-start gap-3 p-4 rounded-xl bg-surface-50 dark:bg-surface-800/50 border border-surface-200 dark:border-surface-700">
                    <FileJson size={18} className="text-surface-500 flex-shrink-0 mt-0.5" />
                    <div className="text-sm text-surface-600 dark:text-surface-400">
                        <strong className="text-surface-900 dark:text-white">Format JSON</strong> — Lisible par tout logiciel (Excel, Google Sheets via import, ou développeur). Le fichier est nommé automatiquement avec la date du jour.
                    </div>
                </div>

                {/* Download button */}
                <button
                    type="button"
                    onClick={handleDownload}
                    disabled={downloading}
                    className="w-full flex items-center justify-center gap-3 px-6 py-4 rounded-xl bg-brand-500 hover:bg-brand-600 text-white font-semibold text-sm transition-colors disabled:opacity-60 shadow-lg shadow-brand-500/25"
                >
                    {downloading ? (
                        <>
                            <Loader2 size={18} className="animate-spin" />
                            Génération en cours…
                        </>
                    ) : done ? (
                        <>
                            <CheckCircle2 size={18} />
                            Téléchargement réussi !
                        </>
                    ) : (
                        <>
                            <Download size={18} />
                            Télécharger mes données
                        </>
                    )}
                </button>

                <p className="text-xs text-surface-400 text-center">
                    Cette action est enregistrée dans vos logs de sécurité.
                    Le traitement peut prendre quelques secondes selon le volume de données.
                </p>
            </div>
        </>
    );
}
