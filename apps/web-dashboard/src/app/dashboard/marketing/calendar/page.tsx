"use client";

import { useState } from "react";
import {
    Calendar,
    Loader2,
    Wand2,
    Facebook,
    Instagram,
    MessageCircle,
    Send,
    Copy,
    Clock,
    ChevronLeft,
    ChevronRight,
    Sparkles,
    Tag,
    Eye,
    Utensils,
    Camera,
    Megaphone,
    Heart,
    Lightbulb,
} from "lucide-react";
import { Card, Button, toast } from "@kbouffe/module-core/ui";
import { usePremiumCheck } from "@/hooks/use-premium";
import { PremiumUpgradeCard } from "@/components/dashboard/PremiumUpgradeCard";

const PLATFORM_CONFIG: Record<string, { icon: any; color: string; bg: string }> = {
    facebook: { icon: Facebook, color: "text-blue-500", bg: "bg-blue-50 dark:bg-blue-500/10" },
    instagram: { icon: Instagram, color: "text-pink-500", bg: "bg-pink-50 dark:bg-pink-500/10" },
    tiktok: { icon: MessageCircle, color: "text-surface-900 dark:text-white", bg: "bg-surface-100 dark:bg-surface-800" },
    telegram: { icon: Send, color: "text-sky-500", bg: "bg-sky-50 dark:bg-sky-500/10" },
    whatsapp: { icon: MessageCircle, color: "text-green-500", bg: "bg-green-50 dark:bg-green-500/10" },
};

const TYPE_CONFIG: Record<string, { icon: any; label: string; color: string }> = {
    product_highlight: { icon: Utensils, label: "Produit", color: "text-orange-500" },
    promo: { icon: Tag, label: "Promo", color: "text-red-500" },
    behind_scenes: { icon: Camera, label: "Coulisses", color: "text-purple-500" },
    interactive: { icon: MessageCircle, label: "Interactif", color: "text-blue-500" },
    storytelling: { icon: Heart, label: "Story", color: "text-pink-500" },
    motivation: { icon: Lightbulb, label: "Motivation", color: "text-amber-500" },
};

const DAYS = ["Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi", "Dimanche"];

type CalendarEntry = {
    day: string;
    date: string;
    platform: string;
    type: string;
    contentIdea: string;
    caption: string;
    hashtags: string[];
    bestTime: string;
    productName?: string | null;
};

function ContentCalendarContent() {
    const [loading, setLoading] = useState(false);
    const [calendar, setCalendar] = useState<CalendarEntry[]>([]);
    const [hasGenerated, setHasGenerated] = useState(false);
    const [selectedDay, setSelectedDay] = useState<string | null>(null);
    const [weekOffset, setWeekOffset] = useState(0);

    const getWeekStart = () => {
        const now = new Date();
        const dayOfWeek = now.getDay();
        const diff = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
        const monday = new Date(now);
        monday.setDate(now.getDate() + diff + weekOffset * 7);
        return monday.toISOString().split("T")[0];
    };

    const generateCalendar = async () => {
        setLoading(true);
        try {
            const res = await fetch("/api/ai/content-calendar", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    weekStartDate: getWeekStart(),
                    platforms: ["facebook", "instagram", "tiktok"],
                }),
            });
            const data = await res.json();
            if (data.calendar?.length) {
                setCalendar(data.calendar);
                setHasGenerated(true);
                toast.success(`${data.calendar.length} publications planifiees`);
            } else {
                toast.error(data.error ?? "Aucun contenu genere");
            }
        } catch {
            toast.error("Erreur de connexion");
        } finally {
            setLoading(false);
        }
    };

    const copyCaption = (text: string) => {
        navigator.clipboard?.writeText(text);
        toast.success("Caption copiee");
    };

    const useInPublisher = (entry: CalendarEntry) => {
        // Navigate to social publisher with pre-filled content
        const params = new URLSearchParams({
            content: entry.caption,
            platform: entry.platform,
        });
        window.location.href = `/dashboard/marketing/social?${params}`;
    };

    const weekStart = getWeekStart();
    const weekStartDate = new Date(weekStart);
    const weekEndDate = new Date(weekStartDate);
    weekEndDate.setDate(weekEndDate.getDate() + 6);

    const formatDate = (d: Date) => d.toLocaleDateString("fr-FR", { day: "numeric", month: "short" });

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-surface-900 dark:text-white flex items-center gap-3">
                        <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-pink-400 to-purple-500 flex items-center justify-center shadow-lg shadow-pink-500/25">
                            <Calendar size={20} className="text-white" />
                        </div>
                        Calendrier de Contenu
                    </h1>
                    <p className="text-surface-500 dark:text-surface-400 mt-1">
                        Planifiez vos publications de la semaine avec l'IA
                    </p>
                </div>
            </div>

            {/* Week Navigation */}
            <Card>
                <div className="flex items-center justify-between">
                    <button
                        type="button"
                        onClick={() => setWeekOffset(prev => prev - 1)}
                        className="p-2 rounded-lg hover:bg-surface-100 dark:hover:bg-surface-800 transition-colors"
                    >
                        <ChevronLeft size={20} />
                    </button>
                    <div className="text-center">
                        <p className="font-semibold text-surface-900 dark:text-white">
                            {formatDate(weekStartDate)} — {formatDate(weekEndDate)}
                        </p>
                        <p className="text-xs text-surface-400">
                            {weekOffset === 0 ? "Cette semaine" : weekOffset > 0 ? `Dans ${weekOffset} semaine(s)` : `Il y a ${Math.abs(weekOffset)} semaine(s)`}
                        </p>
                    </div>
                    <button
                        type="button"
                        onClick={() => setWeekOffset(prev => prev + 1)}
                        className="p-2 rounded-lg hover:bg-surface-100 dark:hover:bg-surface-800 transition-colors"
                    >
                        <ChevronRight size={20} />
                    </button>
                </div>

                <div className="mt-4 flex justify-center">
                    <Button
                        onClick={generateCalendar}
                        isLoading={loading}
                        leftIcon={<Wand2 size={16} />}
                    >
                        {hasGenerated ? "Regenerer la semaine" : "Generer le calendrier IA"}
                    </Button>
                </div>
            </Card>

            {!hasGenerated && !loading ? (
                /* Empty state */
                <div className="text-center py-16 space-y-4">
                    <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-pink-400 to-purple-500 flex items-center justify-center mx-auto shadow-xl shadow-pink-500/30">
                        <Calendar size={36} className="text-white" />
                    </div>
                    <h2 className="text-lg font-bold text-surface-900 dark:text-white">
                        Votre semaine de contenu en 1 clic
                    </h2>
                    <p className="text-sm text-surface-500 dark:text-surface-400 max-w-md mx-auto">
                        L'IA analyse votre menu et genere un calendrier de publications optimise
                        pour Facebook, Instagram et TikTok. Chaque post est adapte a la plateforme.
                    </p>
                </div>
            ) : hasGenerated ? (
                /* Calendar Grid */
                <div className="grid grid-cols-1 md:grid-cols-7 gap-3">
                    {DAYS.map((day, dayIdx) => {
                        const dayEntries = calendar.filter(e => e.day === day || new Date(e.date).getDay() === (dayIdx + 1) % 7);
                        const date = new Date(weekStartDate);
                        date.setDate(date.getDate() + dayIdx);
                        const isToday = date.toISOString().split("T")[0] === new Date().toISOString().split("T")[0];

                        return (
                            <div
                                key={day}
                                className={`rounded-2xl border transition-all ${
                                    isToday
                                        ? "border-brand-400 dark:border-brand-500 bg-brand-50/30 dark:bg-brand-500/5"
                                        : "border-surface-200 dark:border-surface-700 bg-white dark:bg-surface-900"
                                } ${selectedDay === day ? "ring-2 ring-purple-500" : ""}`}
                                onClick={() => setSelectedDay(selectedDay === day ? null : day)}
                            >
                                <div className="p-3 border-b border-surface-100 dark:border-surface-800">
                                    <p className={`text-xs font-bold ${isToday ? "text-brand-500" : "text-surface-400"}`}>
                                        {day}
                                    </p>
                                    <p className="text-sm font-semibold text-surface-900 dark:text-white">
                                        {date.getDate()}
                                    </p>
                                </div>
                                <div className="p-2 space-y-2">
                                    {dayEntries.length === 0 ? (
                                        <p className="text-[10px] text-surface-300 dark:text-surface-600 text-center py-4">
                                            Pas de post
                                        </p>
                                    ) : (
                                        dayEntries.map((entry, idx) => {
                                            const pConfig = PLATFORM_CONFIG[entry.platform] ?? PLATFORM_CONFIG.facebook;
                                            const tConfig = TYPE_CONFIG[entry.type] ?? TYPE_CONFIG.product_highlight;
                                            const PIcon = pConfig.icon;
                                            const TIcon = tConfig.icon;
                                            return (
                                                <div
                                                    key={idx}
                                                    className={`p-2 rounded-xl ${pConfig.bg} cursor-pointer hover:scale-[1.02] transition-transform`}
                                                    title={entry.caption}
                                                >
                                                    <div className="flex items-center gap-1.5 mb-1">
                                                        <PIcon size={10} className={pConfig.color} />
                                                        <TIcon size={10} className={tConfig.color} />
                                                        <span className="text-[9px] font-bold text-surface-400">
                                                            {entry.bestTime}
                                                        </span>
                                                    </div>
                                                    <p className="text-[10px] text-surface-700 dark:text-surface-300 line-clamp-2 leading-snug">
                                                        {entry.contentIdea}
                                                    </p>
                                                    {entry.productName && (
                                                        <span className="inline-block mt-1 text-[8px] px-1.5 py-0.5 rounded-full bg-orange-100 dark:bg-orange-500/20 text-orange-600 dark:text-orange-400 font-bold">
                                                            {entry.productName}
                                                        </span>
                                                    )}
                                                </div>
                                            );
                                        })
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            ) : null}

            {/* Detail Panel */}
            {selectedDay && calendar.filter(e => e.day === selectedDay).length > 0 && (
                <div className="space-y-4">
                    <h3 className="text-lg font-bold text-surface-900 dark:text-white">
                        {selectedDay} — Detail des publications
                    </h3>
                    {calendar
                        .filter(e => e.day === selectedDay)
                        .map((entry, idx) => {
                            const pConfig = PLATFORM_CONFIG[entry.platform] ?? PLATFORM_CONFIG.facebook;
                            const tConfig = TYPE_CONFIG[entry.type] ?? TYPE_CONFIG.product_highlight;
                            const PIcon = pConfig.icon;
                            return (
                                <Card key={idx}>
                                    <div className="flex items-start gap-4">
                                        <div className={`w-10 h-10 rounded-xl ${pConfig.bg} flex items-center justify-center flex-shrink-0`}>
                                            <PIcon size={18} className={pConfig.color} />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 mb-1">
                                                <span className="text-sm font-bold text-surface-900 dark:text-white capitalize">{entry.platform}</span>
                                                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${pConfig.bg} ${pConfig.color}`}>
                                                    {tConfig.label}
                                                </span>
                                                <span className="text-xs text-surface-400 flex items-center gap-1 ml-auto">
                                                    <Clock size={10} /> {entry.bestTime}
                                                </span>
                                            </div>
                                            <p className="text-sm font-medium text-surface-700 dark:text-surface-300 mb-2">
                                                {entry.contentIdea}
                                            </p>
                                            <div className="p-3 rounded-xl bg-surface-50 dark:bg-surface-800/50 mb-3">
                                                <p className="text-sm text-surface-600 dark:text-surface-400 whitespace-pre-wrap">
                                                    {entry.caption}
                                                </p>
                                            </div>
                                            {entry.hashtags?.length > 0 && (
                                                <div className="flex flex-wrap gap-1 mb-3">
                                                    {entry.hashtags.map((h, i) => (
                                                        <span key={i} className="text-[10px] px-2 py-0.5 rounded-full bg-blue-50 dark:bg-blue-500/10 text-blue-500 font-medium">
                                                            {h}
                                                        </span>
                                                    ))}
                                                </div>
                                            )}
                                            <div className="flex gap-2">
                                                <button
                                                    type="button"
                                                    onClick={() => copyCaption(entry.caption)}
                                                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-surface-600 dark:text-surface-400 bg-surface-100 dark:bg-surface-800 hover:bg-surface-200 dark:hover:bg-surface-700 rounded-lg transition-colors"
                                                >
                                                    <Copy size={12} /> Copier
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => useInPublisher(entry)}
                                                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-500/10 hover:bg-purple-100 dark:hover:bg-purple-500/20 rounded-lg transition-colors"
                                                >
                                                    <Send size={12} /> Publier
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </Card>
                            );
                        })}
                </div>
            )}
        </div>
    );
}

export default function ContentCalendarPage() {
    const { isPremium, loading } = usePremiumCheck();

    if (loading) {
        return (
            <div className="flex items-center justify-center py-12">
                <Loader2 size={24} className="animate-spin text-surface-400" />
            </div>
        );
    }

    if (!isPremium) {
        return <PremiumUpgradeCard feature="Calendrier de Contenu" />;
    }

    return <ContentCalendarContent />;
}
