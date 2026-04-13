"use client";

import { useState } from "react";
import {
    Target,
    TrendingUp,
    Award,
    Shield,
    AlertCircle,
    Download,
} from "lucide-react";
import { Badge, Button, useLocale } from "@kbouffe/module-core/ui";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface CompetitorMetrics {
    name: string;
    commission: number;
    features: string[];
    weaknesses: string[];
    strengths: string[];
}

interface BattleCard {
    competitor: string;
    kboffeSituation: string;
    ourAdvantage: string;
    competitorAdvantage: string;
    ourRebuttal: string;
}

const itemVariants = {
    hidden: { opacity: 0, y: 10 },
    visible: { opacity: 1, y: 0 }
};

export default function SalesEngineeringPage() {
    const { t } = useLocale();
    const [expandedCard, setExpandedCard] = useState<string | null>(null);

    const competitors: CompetitorMetrics[] = [
        {
            name: "Jumia Food",
            commission: 20,
            features: ["Massive reach", "Marketing support", "Payment infrastructure"],
            weaknesses: ["Impersonal support", "Complex interface", "High commissions", "Limited local focus"],
            strengths: ["Brand recognition", "Multi-country presence", "High order volume"],
        },
        {
            name: "Uber Eats",
            commission: 30,
            features: ["Global platform", "Rich features", "Driver integration"],
            weaknesses: ["Extremely high cost (30%)", "Global not local", "Strict policies", "Difficult support"],
            strengths: ["Massive user base", "Delivery infrastructure", "Brand trust"],
        },
        {
            name: "Local Platforms",
            commission: 12,
            features: ["Lower commission", "Local focus", "Simple interface"],
            weaknesses: ["Limited features", "Small reach", "Poor infrastructure", "No marketing"],
            strengths: ["Cheaper", "Local presence"],
        },
    ];

    const battleCards: BattleCard[] = [
        {
            competitor: "Jumia Food",
            kboffeSituation: "Restaurant is paying 15-20% commission to Jumia, frustrated with 48+ hour order response",
            ourAdvantage: "5% commission (4x cheaper), dedicated CSM, 24-hour response, menu management tools",
            competitorAdvantage: "Larger user base, more orders per day initially",
            ourRebuttal: "More qualified local customers = higher order value. Customer success team prevents churn. You keep 75% more revenue.",
        },
        {
            competitor: "Uber Eats",
            kboffeSituation: "Restaurant considers Uber Eats for 'better reach' but worried about 30% commission eating profits",
            ourAdvantage: "5% vs 30% (6x cheaper), local focus, better margins, health scoring prevents churn",
            competitorAdvantage: "Higher volume initially due to brand",
            ourRebuttal: "Volume doesn't matter if margins collapse. Our restaurants average +40% revenue growth vs higher volume/lower margins elsewhere.",
        },
        {
            competitor: "Local Competitor",
            kboffeSituation: "Multi-homing: Wants to reduce dependencies, test local platforms",
            ourAdvantage: "Proven unit economics, dedicated team, expansion tools (Boost), API for integration",
            competitorAdvantage: "Slightly lower commission",
            ourRebuttal: "We invest in your growth. Prove value with 90-day pilot: $500K+ GMV or 30% growth = upgrade discussion.",
        },
    ];

    const salesPlaybook = [
        {
            stage: "Discovery",
            duration: "Week 1-2",
            activities: [
                "Understand current platforms (Jumia, local, etc)",
                "Benchmark: Current GMV, commission paid, customer complaints",
                "Identify pain points: Response time, feature gaps, commission burden",
            ],
        },
        {
            stage: "Proof of Value",
            duration: "Week 3-6",
            activities: [
                "30-day pilot on Kbouffe (soft launch, heavy CSM support)",
                "Daily performance tracking (orders, GMV, customer feedback)",
                "Success story: If +20% orders or $50K+ GMV = strong signal",
            ],
        },
        {
            stage: "Pilot Program",
            duration: "Week 7-12",
            activities: [
                "Extended 90-day trial: Full feature access, dedicated CSM",
                "Boost Pack trial: 2 weeks free to test visibility impact",
                "ROI calculator: Show cumulative savings vs Jumia/Uber Eats",
            ],
        },
        {
            stage: "Enterprise Contract",
            duration: "Week 13+",
            activities: [
                "Custom SLA: Response time guarantee, feature roadmap",
                "Revenue sharing option: 3.5% commission if $500K+ GMV/month",
                "Partnership discussion: Integration, API access, white-label potential",
            ],
        },
    ];

    return (
        <div className="space-y-6 p-6">
            {/* Header */}
            <div className="flex justify-between items-start">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">{t.adminPages?.salesEngineering?.title ?? "Sales Engineering"}</h1>
                    <p className="text-gray-600 mt-1">{t.adminPages?.salesEngineering?.subtitle ?? "Competitive positioning and enterprise playbooks"}</p>
                </div>
                <Button variant="outline" className="gap-2">
                    <Download className="w-4 h-4" />
                    {t.adminPages?.salesEngineering?.exportBattleCards ?? "Export Battle Cards"}
                </Button>
            </div>

            {/* Competitive Positioning */}
            <motion.div
                className="bg-white rounded-lg border border-gray-200 p-6"
                initial="hidden"
                animate="visible"
                variants={itemVariants}
            >
                <h2 className="text-lg font-bold text-gray-900 mb-4">{t.adminPages?.salesEngineering?.competitiveMatrix ?? "Competitive Positioning Matrix"}</h2>
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="border-b border-gray-200">
                                <th className="text-left py-3 px-3 font-semibold text-gray-900">{t.adminPages?.salesEngineering?.platform ?? "Platform"}</th>
                                <th className="text-center py-3 px-3 font-semibold text-gray-900">{t.adminPages?.salesEngineering?.commission ?? "Commission"}</th>
                                <th className="text-left py-3 px-3 font-semibold text-gray-900">{t.adminPages?.salesEngineering?.strengths ?? "Strengths"}</th>
                                <th className="text-left py-3 px-3 font-semibold text-gray-900">{t.adminPages?.salesEngineering?.weaknesses ?? "Weaknesses"}</th>
                            </tr>
                        </thead>
                        <tbody>
                            {competitors.map((comp, idx) => (
                                <tr key={idx} className={cn(
                                    "border-b border-gray-100",
                                    comp.name === "Kbouffe" ? "bg-emerald-50" : "hover:bg-gray-50"
                                )}>
                                    <td className="py-3 px-3">
                                        <div className="flex items-center gap-2">
                                            {comp.name === "Kbouffe" && <Award className="w-4 h-4 text-emerald-600" />}
                                            <span className="font-semibold text-gray-900">{comp.name}</span>
                                        </div>
                                    </td>
                                    <td className="text-center py-3 px-3">
                                        <Badge className={cn(
                                            "border",
                                            comp.commission <= 5 ? "bg-emerald-100 text-emerald-800 border-emerald-300" : "bg-red-100 text-red-800 border-red-300"
                                        )}>
                                            {comp.commission}%
                                        </Badge>
                                    </td>
                                    <td className="py-3 px-3 text-gray-600">
                                        <ul className="space-y-1">
                                            {comp.strengths.map((str, i) => (
                                                <li key={i} className="text-xs">✓ {str}</li>
                                            ))}
                                        </ul>
                                    </td>
                                    <td className="py-3 px-3 text-gray-600">
                                        <ul className="space-y-1">
                                            {comp.weaknesses.map((weak, i) => (
                                                <li key={i} className="text-xs">✗ {weak}</li>
                                            ))}
                                        </ul>
                                    </td>
                                </tr>
                            ))}
                            <tr className="border-b border-gray-200 bg-emerald-50 font-semibold">
                                <td className="py-3 px-3 text-emerald-900">Kbouffe</td>
                                <td className="text-center py-3 px-3">
                                    <Badge className="bg-emerald-100 text-emerald-800 border-emerald-300 border">5%</Badge>
                                </td>
                                <td className="py-3 px-3 text-emerald-900">
                                    ✓ Lowest cost (75% cheaper)<br />
                                    ✓ Dedicated CSM<br />
                                    ✓ Local-first approach<br />
                                    ✓ Health scoring
                                </td>
                                <td className="py-3 px-3 text-emerald-900">
                                    ✓ Smaller user base (but growing)<br />
                                    ✓ Newer platform (but trusted)<br />
                                    ✓ Regional focus (but profitable)
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </motion.div>

            {/* Battle Cards */}
            <motion.div
                className="bg-white rounded-lg border border-gray-200 p-6"
                initial="hidden"
                animate="visible"
                variants={itemVariants}
            >
                <h2 className="text-lg font-bold text-gray-900 mb-4">{t.adminPages?.salesEngineering?.battleCards ?? "Battle Cards: When Competitor Objections Arise"}</h2>
                <div className="space-y-3">
                    {battleCards.map((card, idx) => (
                        <motion.div
                            key={idx}
                            className="border border-gray-200 rounded-lg overflow-hidden hover:shadow-md transition-shadow"
                            initial="hidden"
                            animate="visible"
                            variants={itemVariants}
                        >
                            <button
                                onClick={() => setExpandedCard(expandedCard === card.competitor ? null : card.competitor)}
                                className="w-full p-4 text-left hover:bg-gray-50 flex items-center justify-between"
                            >
                                <div className="flex items-center gap-3">
                                    <Shield className="w-5 h-5 text-blue-600" />
                                    <div>
                                        <h3 className="font-semibold text-gray-900">vs {card.competitor}</h3>
                                        <p className="text-sm text-gray-600 mt-1">{card.kboffeSituation}</p>
                                    </div>
                                </div>
                                <TrendingUp className={cn(
                                    "w-5 h-5 text-gray-400 transition-transform",
                                    expandedCard === card.competitor ? "rotate-180" : ""
                                )} />
                            </button>

                            {expandedCard === card.competitor && (
                                <motion.div
                                    className="border-t border-gray-200 bg-gray-50 p-4 space-y-3"
                                    initial={{ opacity: 0, height: 0 }}
                                    animate={{ opacity: 1, height: "auto" }}
                                >
                                    <div>
                                        <h4 className="text-xs font-semibold text-gray-900 uppercase mb-1">{t.adminPages?.salesEngineering?.ourAdvantage ?? "Our Advantage"}</h4>
                                        <p className="text-sm text-gray-700">{card.ourAdvantage}</p>
                                    </div>
                                    <div>
                                        <h4 className="text-xs font-semibold text-gray-900 uppercase mb-1">{t.adminPages?.salesEngineering?.theirAdvantage ?? "Their Advantage"}</h4>
                                        <p className="text-sm text-gray-700">{card.competitorAdvantage}</p>
                                    </div>
                                    <div>
                                        <h4 className="text-xs font-semibold text-emerald-900 uppercase mb-1">{t.adminPages?.salesEngineering?.ourRebuttal ?? "Our Rebuttal"}</h4>
                                        <p className="text-sm text-emerald-700 font-medium">{card.ourRebuttal}</p>
                                    </div>
                                </motion.div>
                            )}
                        </motion.div>
                    ))}
                </div>
            </motion.div>

            {/* Enterprise Sales Playbook */}
            <motion.div
                className="bg-white rounded-lg border border-gray-200 p-6"
                initial="hidden"
                animate="visible"
                variants={itemVariants}
            >
                <h2 className="text-lg font-bold text-gray-900 mb-4">{t.adminPages?.salesEngineering?.enterprisePlaybook ?? "Enterprise Sales Playbook (120-Day Cycle)"}</h2>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    {salesPlaybook.map((phase, idx) => (
                        <div key={idx} className="border border-blue-200 bg-blue-50 rounded-lg p-4">
                            <div className="flex items-center gap-2 mb-3">
                                <Target className="w-5 h-5 text-blue-600" />
                                <div>
                                    <h3 className="font-semibold text-blue-900">{phase.stage}</h3>
                                    <p className="text-xs text-blue-700">{phase.duration}</p>
                                </div>
                            </div>
                            <ul className="space-y-2">
                                {phase.activities.map((activity, i) => (
                                    <li key={i} className="text-xs text-blue-900 flex gap-2">
                                        <span className="font-semibold">•</span>
                                        <span>{activity}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    ))}
                </div>
            </motion.div>

            {/* Key Selling Points */}
            <motion.div
                className="bg-emerald-50 border border-emerald-200 rounded-lg p-6"
                initial="hidden"
                animate="visible"
                variants={itemVariants}
            >
                <h2 className="text-lg font-bold text-emerald-900 mb-4">{t.adminPages?.salesEngineering?.keySellingPoints ?? "Key Selling Points (Always Mention)"}</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-emerald-900">
                    <div className="flex gap-2">
                        <span className="font-bold">1. 75% Cost Savings</span>
                        <span>5% vs 15-30% = Keep ₦375K-₦1.4M per month (on 20 orders/day)</span>
                    </div>
                    <div className="flex gap-2">
                        <span className="font-bold">2. Dedicated Support</span>
                        <span>CSM assigned, health scoring, churn prediction, expansion planning</span>
                    </div>
                    <div className="flex gap-2">
                        <span className="font-bold">3. Proven Growth</span>
                        <span>+40% average order increase for customers, case studies available</span>
                    </div>
                    <div className="flex gap-2">
                        <span className="font-bold">4. Risk-Free Trial</span>
                        <span>90-day pilot with Boost Pack discount, monthly performance tracking</span>
                    </div>
                </div>
            </motion.div>
        </div>
    );
}
