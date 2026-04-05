"use client";

import { useState, useCallback } from "react";
import {
    Brain,
    Loader2,
    TrendingUp,
    TrendingDown,
    Target,
    ShoppingCart,
    DollarSign,
    Utensils,
    Megaphone,
    Settings,
    Tag,
    ArrowRight,
    MessageCircle,
    Send,
    Lightbulb,
    BarChart3,
    RefreshCw,
    Sparkles,
} from "lucide-react";
import { Card, Button, toast, authFetch } from "@kbouffe/module-core/ui";
import { usePremiumCheck } from "@/hooks/use-premium";
import { PremiumUpgradeCard } from "@/components/dashboard/PremiumUpgradeCard";

const PRIORITY_CONFIG = {
    high: { label: "Urgent", color: "bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-400", dot: "bg-red-500" },
    medium: { label: "Important", color: "bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400", dot: "bg-amber-500" },
    low: { label: "Suggestion", color: "bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-400", dot: "bg-blue-500" },
};

const CATEGORY_ICONS: Record<string, any> = {
    revenue: DollarSign,
    menu: Utensils,
    marketing: Megaphone,
    operations: Settings,
    pricing: Tag,
};

type Insight = {
    title: string;
    description: string;
    action: string;
    priority: "high" | "medium" | "low";
    category: string;
};

type Stats = {
    totalProducts: number;
    activeProducts: number;
    totalOrders: number;
    completedOrders: number;
    cancelledOrders: number;
    cancelRate: number;
    totalRevenue: number;
    avgOrderValue: number;
    avgPrice: number;
    recentOrders: number;
    thisWeekRevenue: number;
    prevWeekRevenue: number;
    revenueGrowth: number;
    peakHour: string | null;
    bestSellers: { name: string; qty: number; revenue: number }[];
    productsWithoutImages: number;
    ordersByDay: Record<string, number>;
};

function AIAdvisorContent() {
    const [loading, setLoading] = useState(false);
    const [summary, setSummary] = useState("");
    const [insights, setInsights] = useState<Insight[]>([]);
    const [stats, setStats] = useState<Stats | null>(null);
    const [question, setQuestion] = useState("");
    const [hasAnalyzed, setHasAnalyzed] = useState(false);

    const analyze = useCallback(async (q?: string) => {
        setLoading(true);
        try {
            const res = await authFetch("/api/ai/analytics", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ question: q ?? question }),
            });
            const data = await res.json();
            if (data.error) {
                toast.error(data.error);
                return;
            }
            setSummary(data.summary ?? "");
            setInsights(data.insights ?? []);
            setStats(data.stats ?? null);
            setHasAnalyzed(true);
            if (q) setQuestion("");
        } catch {
            toast.error("Erreur de connexion");
        } finally {
            setLoading(false);
        }
    }, [question]);

    const quickQuestions = [
        "Comment augmenter mon chiffre d'affaires ?",
        "Quels plats devrais-je mettre en promotion ?",
        "Comment attirer plus de clients ?",
        "Mon menu est-il bien structure ?",
        "Quel est le bon prix pour mes plats ?",
    ];

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-surface-900 dark:text-white flex items-center gap-3">
                        <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center shadow-lg shadow-purple-500/25">
                            <Brain size={20} className="text-white" />
                        </div>
                        Conseiller IA
                    </h1>
                    <p className="text-surface-500 dark:text-surface-400 mt-1">
                        Votre assistant business personnel propulse par l'intelligence artificielle
                    </p>
                </div>
                {hasAnalyzed && (
                    <Button variant="outline" onClick={() => analyze()} leftIcon={<RefreshCw size={16} />}>
                        Re-analyser
                    </Button>
                )}
            </div>

            {!hasAnalyzed ? (
                /* Initial state — Ask to analyze */
                <div className="max-w-2xl mx-auto text-center space-y-8 py-12">
                    <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center mx-auto shadow-xl shadow-purple-500/30">
                        <Brain size={36} className="text-white" />
                    </div>
                    <div>
                        <h2 className="text-xl font-bold text-surface-900 dark:text-white mb-2">
                            Analysez votre restaurant avec l'IA
                        </h2>
                        <p className="text-surface-500 dark:text-surface-400">
                            L'IA analyse votre menu, vos commandes et vos donnees pour vous donner des conseils personnalises et actionnables.
                        </p>
                    </div>

                    <Button
                        onClick={() => analyze()}
                        isLoading={loading}
                        leftIcon={<Sparkles size={18} />}
                        className="px-8 py-3 text-lg"
                    >
                        Lancer l'analyse
                    </Button>

                    <div className="text-left">
                        <p className="text-sm font-medium text-surface-500 dark:text-surface-400 mb-3">
                            Ou posez une question specifique :
                        </p>
                        <div className="flex flex-wrap gap-2">
                            {quickQuestions.map((q, idx) => (
                                <button
                                    key={idx}
                                    type="button"
                                    onClick={() => { setQuestion(q); analyze(q); }}
                                    disabled={loading}
                                    className="px-3 py-2 text-sm rounded-xl border border-surface-200 dark:border-surface-700 text-surface-600 dark:text-surface-400 hover:bg-surface-100 dark:hover:bg-surface-800 transition-colors disabled:opacity-50"
                                >
                                    {q}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            ) : (
                /* Results */
                <>
                    {/* Stats Row */}
                    {stats && (
                        <>
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                                <StatCard icon={Utensils} label="Produits actifs" value={stats.activeProducts} sub={`/${stats.totalProducts} total`} />
                                <StatCard icon={ShoppingCart} label="Commandes" value={stats.totalOrders} sub={`${stats.recentOrders} cette semaine`} />
                                <StatCard icon={DollarSign} label="CA total" value={`${(stats.totalRevenue / 1000).toFixed(0)}k`} sub="FCFA" />
                                <StatCard icon={BarChart3} label="Panier moyen" value={`${stats.avgOrderValue}`} sub="FCFA" />
                            </div>

                            {/* Trend & Details Row */}
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                {/* Revenue Trend */}
                                <Card>
                                    <div className="flex items-center gap-2 mb-2">
                                        {stats.revenueGrowth >= 0 ? (
                                            <TrendingUp size={16} className="text-green-500" />
                                        ) : (
                                            <TrendingDown size={16} className="text-red-500" />
                                        )}
                                        <span className="text-sm font-semibold text-surface-900 dark:text-white">Tendance</span>
                                    </div>
                                    <p className={`text-2xl font-bold ${stats.revenueGrowth >= 0 ? "text-green-500" : "text-red-500"}`}>
                                        {stats.revenueGrowth > 0 ? "+" : ""}{stats.revenueGrowth}%
                                    </p>
                                    <p className="text-xs text-surface-400 mt-1">
                                        {stats.thisWeekRevenue.toLocaleString()} vs {stats.prevWeekRevenue.toLocaleString()} FCFA
                                    </p>
                                </Card>

                                {/* Peak Hour */}
                                <Card>
                                    <div className="flex items-center gap-2 mb-2">
                                        <Target size={16} className="text-amber-500" />
                                        <span className="text-sm font-semibold text-surface-900 dark:text-white">Heure de pointe</span>
                                    </div>
                                    <p className="text-2xl font-bold text-surface-900 dark:text-white">
                                        {stats.peakHour ?? "N/A"}
                                    </p>
                                    <p className="text-xs text-surface-400 mt-1">
                                        Taux annulation: {stats.cancelRate}%
                                    </p>
                                </Card>

                                {/* Best Sellers */}
                                <Card>
                                    <div className="flex items-center gap-2 mb-2">
                                        <Sparkles size={16} className="text-purple-500" />
                                        <span className="text-sm font-semibold text-surface-900 dark:text-white">Top ventes</span>
                                    </div>
                                    {stats.bestSellers?.length > 0 ? (
                                        <div className="space-y-1.5">
                                            {stats.bestSellers.slice(0, 3).map((b, i) => (
                                                <div key={i} className="flex items-center justify-between">
                                                    <span className="text-xs text-surface-600 dark:text-surface-400 truncate flex-1">
                                                        {i + 1}. {b.name}
                                                    </span>
                                                    <span className="text-[10px] font-bold text-surface-400 ml-2">{b.qty}x</span>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <p className="text-xs text-surface-400">Pas assez de donnees</p>
                                    )}
                                </Card>
                            </div>
                        </>
                    )}

                    {/* AI Summary */}
                    {summary && (
                        <Card>
                            <div className="flex items-start gap-3">
                                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center flex-shrink-0">
                                    <Lightbulb size={18} className="text-white" />
                                </div>
                                <div>
                                    <h3 className="font-semibold text-surface-900 dark:text-white mb-1">Resume IA</h3>
                                    <p className="text-sm text-surface-600 dark:text-surface-400 leading-relaxed">{summary}</p>
                                </div>
                            </div>
                        </Card>
                    )}

                    {/* Insights */}
                    <div className="space-y-4">
                        <h3 className="text-lg font-bold text-surface-900 dark:text-white">
                            Recommandations ({insights.length})
                        </h3>
                        {insights.map((insight, idx) => {
                            const priorityConf = PRIORITY_CONFIG[insight.priority] ?? PRIORITY_CONFIG.medium;
                            const CategoryIcon = CATEGORY_ICONS[insight.category] ?? Target;
                            return (
                                <Card key={idx}>
                                    <div className="flex items-start gap-4">
                                        <div className="w-10 h-10 rounded-xl bg-surface-100 dark:bg-surface-800 flex items-center justify-center flex-shrink-0">
                                            <CategoryIcon size={18} className="text-surface-600 dark:text-surface-400" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 mb-1">
                                                <h4 className="font-semibold text-surface-900 dark:text-white">{insight.title}</h4>
                                                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${priorityConf.color}`}>
                                                    {priorityConf.label}
                                                </span>
                                            </div>
                                            <p className="text-sm text-surface-600 dark:text-surface-400 mb-3">{insight.description}</p>
                                            <div className="flex items-center gap-2 p-3 rounded-xl bg-brand-50 dark:bg-brand-500/10">
                                                <ArrowRight size={14} className="text-brand-500 flex-shrink-0" />
                                                <span className="text-sm font-medium text-brand-700 dark:text-brand-300">{insight.action}</span>
                                            </div>
                                        </div>
                                    </div>
                                </Card>
                            );
                        })}
                    </div>

                    {/* Ask another question */}
                    <Card>
                        <h3 className="font-semibold text-surface-900 dark:text-white mb-3 flex items-center gap-2">
                            <MessageCircle size={16} />
                            Posez une question
                        </h3>
                        <div className="flex gap-2">
                            <input
                                type="text"
                                value={question}
                                onChange={(e) => setQuestion(e.target.value)}
                                onKeyDown={(e) => { if (e.key === "Enter" && question.trim()) analyze(); }}
                                placeholder="Ex: Comment augmenter mes ventes le week-end ?"
                                className="flex-1 rounded-xl border border-surface-200 dark:border-surface-700 bg-white dark:bg-surface-800 px-4 py-3 text-sm text-surface-900 dark:text-white placeholder:text-surface-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
                            />
                            <Button
                                onClick={() => analyze()}
                                isLoading={loading}
                                leftIcon={<Send size={16} />}
                                disabled={!question.trim() && !loading}
                            >
                                Demander
                            </Button>
                        </div>
                        <div className="flex flex-wrap gap-2 mt-3">
                            {quickQuestions.slice(0, 3).map((q, idx) => (
                                <button
                                    key={idx}
                                    type="button"
                                    onClick={() => { setQuestion(q); analyze(q); }}
                                    disabled={loading}
                                    className="px-3 py-1.5 text-xs rounded-lg border border-surface-200 dark:border-surface-700 text-surface-500 hover:bg-surface-100 dark:hover:bg-surface-800 transition-colors disabled:opacity-50"
                                >
                                    {q}
                                </button>
                            ))}
                        </div>
                    </Card>
                </>
            )}
        </div>
    );
}

export default function AIAdvisorPage() {
    const { isPremium, loading } = usePremiumCheck();

    if (loading) {
        return (
            <div className="flex items-center justify-center py-12">
                <Loader2 size={24} className="animate-spin text-surface-400" />
            </div>
        );
    }

    if (!isPremium) {
        return <PremiumUpgradeCard feature="Conseiller IA" />;
    }

    return <AIAdvisorContent />;
}

// Small stat card component
function StatCard({ icon: Icon, label, value, sub }: { icon: any; label: string; value: string | number; sub: string }) {
    return (
        <Card>
            <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-surface-100 dark:bg-surface-800 flex items-center justify-center">
                    <Icon size={18} className="text-surface-500" />
                </div>
                <div>
                    <p className="text-xs text-surface-400">{label}</p>
                    <p className="text-lg font-bold text-surface-900 dark:text-white">{value}</p>
                    <p className="text-[10px] text-surface-400">{sub}</p>
                </div>
            </div>
        </Card>
    );
}

