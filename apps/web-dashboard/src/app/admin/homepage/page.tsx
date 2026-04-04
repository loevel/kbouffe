"use client";

import { useCallback, useEffect, useState } from "react";
import {
    Plus, Pencil, Trash2, Eye, EyeOff, ChevronUp, ChevronDown,
    Loader2, X, Search, LayoutTemplate, GripVertical, Calendar,
    Copy, ExternalLink, Sparkles,
} from "lucide-react";
import { authFetch } from "@kbouffe/module-core/ui";

// ── Types ─────────────────────────────────────────────────────────────────────
type SectionType = "auto" | "manual" | "seasonal";
type AutoRule = "featured" | "top_rated" | "popular" | "newest" | "sponsored";
type DisplayStyle = "cards" | "circles";

interface Section {
    id: string;
    title: string;
    subtitle: string | null;
    type: SectionType;
    auto_rule: AutoRule | null;
    restaurant_ids: string[] | null;
    display_style: DisplayStyle;
    sort_order: number;
    is_active: boolean;
    starts_at: string | null;
    ends_at: string | null;
}

interface RestaurantOption {
    id: string;
    name: string;
    city: string;
    coverUrl: string | null;
}

const AUTO_RULE_LABELS: Record<AutoRule, string> = {
    featured:  "En vedette (sponsorisés + premium + note)",
    top_rated: "Mieux notés",
    popular:   "Populaires (commandes)",
    newest:    "Nouveaux arrivants",
    sponsored: "Sponsorisés uniquement",
};

const TYPE_COLORS: Record<SectionType, string> = {
    auto:     "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300",
    manual:   "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300",
    seasonal: "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300",
};

const TYPE_LABELS: Record<SectionType, string> = {
    auto: "Auto",
    manual: "Manuel",
    seasonal: "Saisonnier",
};

const TYPE_DESCRIPTIONS: Record<SectionType, string> = {
    auto:     "Les restaurants sont sélectionnés automatiquement selon une règle.",
    manual:   "Vous choisissez exactement quels restaurants apparaissent.",
    seasonal: "Section limitée dans le temps (promotions, événements…).",
};

const EMPTY_FORM = (): Omit<Section, "id"> => ({
    title: "",
    subtitle: "",
    type: "auto",
    auto_rule: "featured",
    restaurant_ids: [],
    display_style: "cards",
    sort_order: 99,
    is_active: true,
    starts_at: null,
    ends_at: null,
});

// ── Restaurant picker ─────────────────────────────────────────────────────────
function RestaurantPicker({
    selected,
    onChange,
}: {
    selected: string[];
    onChange: (ids: string[]) => void;
}) {
    const [query, setQuery] = useState("");
    const [options, setOptions] = useState<RestaurantOption[]>([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (!query.trim()) { setOptions([]); return; }
        setLoading(true);
        const t = setTimeout(async () => {
            try {
                const res = await fetch(`/api/stores?q=${encodeURIComponent(query)}&limit=10`);
                const data = await res.json();
                setOptions((data.restaurants ?? []).map((r: any) => ({
                    id: r.id, name: r.name, city: r.city, coverUrl: r.coverUrl,
                })));
            } catch { /* */ } finally { setLoading(false); }
        }, 350);
        return () => clearTimeout(t);
    }, [query]);

    const toggle = (id: string) =>
        onChange(selected.includes(id) ? selected.filter((s) => s !== id) : [...selected, id]);

    return (
        <div>
            <div className="relative mb-2">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-surface-400 pointer-events-none" />
                <input
                    type="text"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Rechercher un restaurant…"
                    className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-surface-200 dark:border-surface-700 bg-white dark:bg-surface-800 text-surface-900 dark:text-white placeholder:text-surface-400 focus:outline-none focus:ring-2 focus:ring-brand-500/40"
                />
                {loading && <Loader2 size={14} className="absolute right-3 top-1/2 -translate-y-1/2 animate-spin text-surface-400" />}
            </div>

            {options.length > 0 && (
                <div className="border border-surface-200 dark:border-surface-700 rounded-lg overflow-hidden mb-3 max-h-48 overflow-y-auto">
                    {options.map((r) => (
                        <button
                            key={r.id}
                            type="button"
                            onClick={() => toggle(r.id)}
                            className={`w-full flex items-center gap-2.5 px-3 py-2 text-left text-sm transition-colors ${
                                selected.includes(r.id)
                                    ? "bg-brand-50 dark:bg-brand-900/20 text-brand-700 dark:text-brand-300"
                                    : "hover:bg-surface-50 dark:hover:bg-surface-800 text-surface-700 dark:text-surface-300"
                            }`}
                        >
                            <div className="w-8 h-8 rounded-md overflow-hidden shrink-0 bg-surface-100 dark:bg-surface-700">
                                {r.coverUrl && <img src={r.coverUrl} alt="" className="w-full h-full object-cover" />}
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="font-medium truncate">{r.name}</p>
                                <p className="text-xs text-surface-400">{r.city}</p>
                            </div>
                            {selected.includes(r.id) && <span className="text-brand-500 text-xs font-bold">✓</span>}
                        </button>
                    ))}
                </div>
            )}

            {selected.length > 0 ? (
                <p className="text-xs text-surface-500 dark:text-surface-400">
                    {selected.length} restaurant{selected.length > 1 ? "s" : ""} sélectionné{selected.length > 1 ? "s" : ""}
                </p>
            ) : (
                <p className="text-xs text-surface-400 dark:text-surface-500 italic">Aucun restaurant sélectionné — recherchez ci-dessus.</p>
            )}
        </div>
    );
}

// ── Section Form Modal ────────────────────────────────────────────────────────
function SectionModal({
    initial,
    totalSections,
    onSave,
    onClose,
}: {
    initial: Partial<Section> | null;
    totalSections: number;
    onSave: (data: any) => Promise<void>;
    onClose: () => void;
}) {
    const [form, setForm] = useState<Omit<Section, "id">>(() => ({ ...EMPTY_FORM(), ...initial }));
    const [saving, setSaving] = useState(false);
    const [suggesting, setSuggesting] = useState(false);
    const [err, setErr] = useState<string | null>(null);

    const set = (key: string, val: any) => setForm((f) => ({ ...f, [key]: val }));

    const suggestWithAI = async () => {
        setSuggesting(true);
        try {
            const res = await authFetch("/api/admin/ai/suggest-section", {
                method: "POST",
                body: JSON.stringify({
                    type: form.type,
                    auto_rule: form.auto_rule,
                    display_style: form.display_style,
                    hint: form.title || undefined,
                }),
            });
            const data = await res.json();
            if (data.title) set("title", data.title);
            if (data.subtitle) set("subtitle", data.subtitle);
        } catch { /* */ }
        finally { setSuggesting(false); }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setErr(null);
        setSaving(true);
        try { await onSave(form); onClose(); }
        catch (e: any) { setErr(e.message ?? "Erreur inconnue"); }
        finally { setSaving(false); }
    };

    const isEditing = !!initial?.id;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <div className="bg-white dark:bg-surface-900 rounded-2xl shadow-2xl w-full max-w-lg max-h-[92vh] overflow-y-auto border border-surface-200 dark:border-surface-800">
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-surface-100 dark:border-surface-800 sticky top-0 bg-white dark:bg-surface-900 z-10">
                    <h2 className="font-bold text-surface-900 dark:text-white text-lg">
                        {isEditing ? "Modifier la section" : "Nouvelle section"}
                    </h2>
                    <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-surface-100 dark:hover:bg-surface-800 transition-colors">
                        <X size={18} className="text-surface-500" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-5">
                    {/* AI Suggest */}
                    <div className="flex items-center gap-2 p-3 rounded-xl bg-violet-50 dark:bg-violet-900/20 border border-violet-200 dark:border-violet-800">
                        <Sparkles size={15} className="text-violet-500 shrink-0" />
                        <p className="text-xs text-violet-700 dark:text-violet-300 flex-1">
                            Laissez Gemini générer un titre et sous-titre adaptés au type de section.
                        </p>
                        <button
                            type="button"
                            onClick={suggestWithAI}
                            disabled={suggesting}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-violet-500 hover:bg-violet-600 disabled:opacity-60 text-white text-xs font-semibold transition-colors shrink-0"
                        >
                            {suggesting ? <Loader2 size={12} className="animate-spin" /> : <Sparkles size={12} />}
                            {suggesting ? "Génération…" : "Suggérer"}
                        </button>
                    </div>

                    {/* Title */}
                    <div>
                        <label className="text-xs font-semibold text-surface-500 dark:text-surface-400 uppercase tracking-wide mb-1.5 block">
                            Titre *
                        </label>
                        <input
                            type="text"
                            value={form.title}
                            onChange={(e) => set("title", e.target.value)}
                            required
                            placeholder="Ex: En vedette sur KBouffe"
                            className="w-full px-3 py-2.5 rounded-xl border border-surface-200 dark:border-surface-700 bg-white dark:bg-surface-800 text-sm text-surface-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500/40"
                        />
                    </div>

                    {/* Subtitle */}
                    <div>
                        <label className="text-xs font-semibold text-surface-500 dark:text-surface-400 uppercase tracking-wide mb-1.5 block">
                            Sous-titre <span className="text-surface-400 normal-case font-normal">(optionnel)</span>
                        </label>
                        <input
                            type="text"
                            value={form.subtitle ?? ""}
                            onChange={(e) => set("subtitle", e.target.value)}
                            placeholder="Ex: Découvrez nos meilleures adresses"
                            className="w-full px-3 py-2.5 rounded-xl border border-surface-200 dark:border-surface-700 bg-white dark:bg-surface-800 text-sm text-surface-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500/40"
                        />
                    </div>

                    {/* Type */}
                    <div>
                        <label className="text-xs font-semibold text-surface-500 dark:text-surface-400 uppercase tracking-wide mb-1.5 block">
                            Type de section
                        </label>
                        <div className="flex gap-2 mb-2">
                            {(["auto", "manual", "seasonal"] as SectionType[]).map((t) => (
                                <button
                                    key={t}
                                    type="button"
                                    onClick={() => set("type", t)}
                                    className={`flex-1 py-2 rounded-xl border text-sm font-medium transition-colors ${
                                        form.type === t
                                            ? "bg-surface-900 dark:bg-white border-surface-900 dark:border-white text-white dark:text-surface-900"
                                            : "bg-white dark:bg-surface-900 border-surface-200 dark:border-surface-700 text-surface-600 dark:text-surface-400 hover:border-surface-400"
                                    }`}
                                >
                                    {TYPE_LABELS[t]}
                                </button>
                            ))}
                        </div>
                        <p className="text-xs text-surface-400 dark:text-surface-500 italic">
                            {TYPE_DESCRIPTIONS[form.type]}
                        </p>
                    </div>

                    {/* Auto rule — shown for auto & seasonal */}
                    {(form.type === "auto" || form.type === "seasonal") && (
                        <div>
                            <label className="text-xs font-semibold text-surface-500 dark:text-surface-400 uppercase tracking-wide mb-1.5 block">
                                Règle de sélection {form.type === "seasonal" ? <span className="text-surface-400 normal-case font-normal">(optionnel)</span> : "*"}
                            </label>
                            <select
                                value={form.auto_rule ?? ""}
                                onChange={(e) => set("auto_rule", e.target.value || null)}
                                className="w-full px-3 py-2.5 rounded-xl border border-surface-200 dark:border-surface-700 bg-white dark:bg-surface-800 text-sm text-surface-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500/40"
                                required={form.type === "auto"}
                            >
                                {form.type === "seasonal" && <option value="">— Aucune (restaurants manuels ci-dessous) —</option>}
                                {Object.entries(AUTO_RULE_LABELS).map(([val, label]) => (
                                    <option key={val} value={val}>{label}</option>
                                ))}
                            </select>
                        </div>
                    )}

                    {/* Restaurant picker — shown for manual; also for seasonal when no auto_rule */}
                    {(form.type === "manual" || (form.type === "seasonal" && !form.auto_rule)) && (
                        <div>
                            <label className="text-xs font-semibold text-surface-500 dark:text-surface-400 uppercase tracking-wide mb-1.5 block">
                                Restaurants {form.type === "manual" ? "*" : <span className="text-surface-400 normal-case font-normal">(optionnel)</span>}
                            </label>
                            <RestaurantPicker
                                selected={form.restaurant_ids ?? []}
                                onChange={(ids) => set("restaurant_ids", ids)}
                            />
                        </div>
                    )}

                    {/* Seasonal dates */}
                    {form.type === "seasonal" && (
                        <div>
                            <label className="text-xs font-semibold text-surface-500 dark:text-surface-400 uppercase tracking-wide mb-2 block flex items-center gap-1">
                                <Calendar size={12} />
                                Période d'affichage <span className="text-surface-400 normal-case font-normal">(optionnel)</span>
                            </label>
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="text-xs text-surface-400 mb-1 block">Début</label>
                                    <input
                                        type="datetime-local"
                                        value={form.starts_at?.slice(0, 16) ?? ""}
                                        onChange={(e) => set("starts_at", e.target.value ? new Date(e.target.value).toISOString() : null)}
                                        className="w-full px-3 py-2 rounded-xl border border-surface-200 dark:border-surface-700 bg-white dark:bg-surface-800 text-sm text-surface-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500/40"
                                    />
                                </div>
                                <div>
                                    <label className="text-xs text-surface-400 mb-1 block">Fin</label>
                                    <input
                                        type="datetime-local"
                                        value={form.ends_at?.slice(0, 16) ?? ""}
                                        onChange={(e) => set("ends_at", e.target.value ? new Date(e.target.value).toISOString() : null)}
                                        className="w-full px-3 py-2 rounded-xl border border-surface-200 dark:border-surface-700 bg-white dark:bg-surface-800 text-sm text-surface-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500/40"
                                    />
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Display style */}
                    <div>
                        <label className="text-xs font-semibold text-surface-500 dark:text-surface-400 uppercase tracking-wide mb-1.5 block">
                            Style d'affichage
                        </label>
                        <div className="flex gap-2">
                            {(["cards", "circles"] as DisplayStyle[]).map((s) => (
                                <button
                                    key={s}
                                    type="button"
                                    onClick={() => set("display_style", s)}
                                    className={`flex-1 py-2.5 rounded-xl border text-sm font-medium transition-colors ${
                                        form.display_style === s
                                            ? "bg-brand-500 border-brand-500 text-white"
                                            : "bg-white dark:bg-surface-900 border-surface-200 dark:border-surface-700 text-surface-600 dark:text-surface-400 hover:border-surface-400"
                                    }`}
                                >
                                    {s === "cards" ? "🖼️ Cartes horizontales" : "⭕ Cercles"}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Sort order */}
                    <div>
                        <label className="text-xs font-semibold text-surface-500 dark:text-surface-400 uppercase tracking-wide mb-1.5 block">
                            Position dans la page
                        </label>
                        <input
                            type="number"
                            min={1}
                            max={totalSections + 1}
                            value={form.sort_order}
                            onChange={(e) => set("sort_order", parseInt(e.target.value) || 99)}
                            className="w-24 px-3 py-2.5 rounded-xl border border-surface-200 dark:border-surface-700 bg-white dark:bg-surface-800 text-sm text-surface-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500/40"
                        />
                        <p className="text-xs text-surface-400 dark:text-surface-500 mt-1">
                            1 = en haut · {totalSections + (isEditing ? 0 : 1)} = en bas
                        </p>
                    </div>

                    {/* Active toggle */}
                    <div className="flex items-center gap-3 p-3 rounded-xl bg-surface-50 dark:bg-surface-800/60">
                        <button
                            type="button"
                            onClick={() => set("is_active", !form.is_active)}
                            className={`relative w-11 h-6 rounded-full transition-colors ${form.is_active ? "bg-brand-500" : "bg-surface-300 dark:bg-surface-700"}`}
                        >
                            <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${form.is_active ? "translate-x-5" : "translate-x-0"}`} />
                        </button>
                        <div>
                            <p className="text-sm font-medium text-surface-900 dark:text-white">
                                {form.is_active ? "Section active" : "Section désactivée"}
                            </p>
                            <p className="text-xs text-surface-400">
                                {form.is_active ? "Visible sur le store public" : "Masquée — n'apparaît pas sur le store"}
                            </p>
                        </div>
                    </div>

                    {err && (
                        <p className="text-sm text-red-500 bg-red-50 dark:bg-red-900/20 px-3 py-2 rounded-lg">
                            ⚠️ {err}
                        </p>
                    )}

                    <div className="flex gap-3 pt-2">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 py-2.5 rounded-xl border border-surface-200 dark:border-surface-700 text-sm font-medium text-surface-700 dark:text-surface-300 hover:border-surface-400 transition-colors"
                        >
                            Annuler
                        </button>
                        <button
                            type="submit"
                            disabled={saving}
                            className="flex-1 py-2.5 rounded-xl bg-brand-500 hover:bg-brand-600 disabled:opacity-60 text-white text-sm font-bold transition-colors flex items-center justify-center gap-2"
                        >
                            {saving && <Loader2 size={16} className="animate-spin" />}
                            {saving ? "Enregistrement…" : isEditing ? "Mettre à jour" : "Créer la section"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function HomepageSectionsPage() {
    const [sections, setSections] = useState<Section[]>([]);
    const [loading, setLoading] = useState(true);
    const [modal, setModal] = useState<{ open: boolean; initial: Partial<Section> | null }>({ open: false, initial: null });

    const load = useCallback(async () => {
        setLoading(true);
        try {
            const res = await authFetch("/api/admin/homepage-sections");
            const data = await res.json();
            setSections(data.sections ?? []);
        } catch { /* */ }
        finally { setLoading(false); }
    }, []);

    useEffect(() => { load(); }, [load]);

    const toggleActive = async (s: Section) => {
        setSections((prev) => prev.map((x) => x.id === s.id ? { ...x, is_active: !x.is_active } : x));
        const res = await authFetch(`/api/admin/homepage-sections/${s.id}`, {
            method: "PATCH",
            body: JSON.stringify({ is_active: !s.is_active }),
        });
        if (!res.ok) load();
    };

    const deleteSection = async (id: string) => {
        if (!confirm("Supprimer définitivement cette section ?")) return;
        setSections((prev) => prev.filter((s) => s.id !== id));
        const res = await authFetch(`/api/admin/homepage-sections/${id}`, { method: "DELETE" });
        if (!res.ok) load();
    };

    const duplicateSection = async (s: Section) => {
        const { id, ...rest } = s;
        await authFetch("/api/admin/homepage-sections", {
            method: "POST",
            body: JSON.stringify({ ...rest, title: `${s.title} (copie)`, sort_order: 99, is_active: false }),
        });
        await load();
    };

    const moveSection = async (index: number, dir: "up" | "down") => {
        const next = [...sections];
        const target = dir === "up" ? index - 1 : index + 1;
        if (target < 0 || target >= next.length) return;
        [next[index], next[target]] = [next[target], next[index]];
        const reordered = next.map((s, i) => ({ ...s, sort_order: i + 1 }));
        setSections(reordered);
        const res = await authFetch("/api/admin/homepage-sections", {
            method: "PATCH",
            body: JSON.stringify({ updates: reordered.map((s) => ({ id: s.id, sort_order: s.sort_order })) }),
        });
        if (!res.ok) load();
    };

    const handleSave = async (form: any) => {
        let res: Response;
        if (modal.initial?.id) {
            res = await authFetch(`/api/admin/homepage-sections/${modal.initial.id}`, {
                method: "PATCH",
                body: JSON.stringify(form),
            });
        } else {
            res = await authFetch("/api/admin/homepage-sections", {
                method: "POST",
                body: JSON.stringify(form),
            });
        }
        if (!res.ok) {
            const data = await res.json();
            throw new Error(data.error ?? "Erreur lors de l'enregistrement");
        }
        await load();
    };

    const activeCount = sections.filter((s) => s.is_active).length;

    return (
        <div>
            {/* Header */}
            <div className="flex items-start justify-between mb-8">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-brand-500 flex items-center justify-center shrink-0">
                        <LayoutTemplate size={20} className="text-white" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-extrabold text-surface-900 dark:text-white">Page d'accueil store</h1>
                        <p className="text-sm text-surface-500 dark:text-surface-400 mt-0.5">
                            {sections.length} section{sections.length > 1 ? "s" : ""} · {activeCount} active{activeCount > 1 ? "s" : ""}
                        </p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <a
                        href="/"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-surface-200 dark:border-surface-700 text-sm text-surface-600 dark:text-surface-400 hover:border-surface-400 hover:text-surface-900 dark:hover:text-white transition-colors"
                    >
                        <ExternalLink size={14} />
                        Voir le store
                    </a>
                    <button
                        onClick={() => setModal({ open: true, initial: null })}
                        className="flex items-center gap-2 px-4 py-2.5 bg-brand-500 hover:bg-brand-600 text-white rounded-xl font-semibold text-sm transition-colors shadow-sm"
                    >
                        <Plus size={16} />
                        Nouvelle section
                    </button>
                </div>
            </div>

            {/* Legend */}
            <div className="flex items-center gap-3 mb-5 flex-wrap">
                <span className="text-xs text-surface-400 dark:text-surface-500 font-medium">Types :</span>
                {(["auto", "manual", "seasonal"] as SectionType[]).map((t) => (
                    <span key={t} className={`text-[11px] font-bold px-2.5 py-1 rounded-full ${TYPE_COLORS[t]}`}>
                        {TYPE_LABELS[t]}
                    </span>
                ))}
                <span className="text-xs text-surface-400 dark:text-surface-500 ml-2">
                    · Glissez les flèches ↕ pour réordonner
                </span>
            </div>

            {/* List */}
            {loading ? (
                <div className="flex justify-center py-20">
                    <Loader2 size={28} className="animate-spin text-brand-500" />
                </div>
            ) : sections.length === 0 ? (
                <div className="text-center py-20 bg-surface-50 dark:bg-surface-900/40 rounded-2xl border-2 border-dashed border-surface-200 dark:border-surface-800">
                    <LayoutTemplate size={40} className="mx-auto text-surface-300 dark:text-surface-700 mb-3" />
                    <p className="text-surface-600 dark:text-surface-400 font-semibold mb-4">Aucune section configurée</p>
                    <button
                        onClick={() => setModal({ open: true, initial: null })}
                        className="px-5 py-2.5 bg-brand-500 hover:bg-brand-600 text-white rounded-xl font-semibold text-sm transition-colors"
                    >
                        Créer la première section
                    </button>
                </div>
            ) : (
                <div className="space-y-2">
                    {sections.map((s, i) => (
                        <div
                            key={s.id}
                            className={`flex items-center gap-3 p-4 rounded-2xl border transition-all ${
                                s.is_active
                                    ? "bg-white dark:bg-surface-900 border-surface-200 dark:border-surface-800"
                                    : "bg-surface-50 dark:bg-surface-900/40 border-surface-100 dark:border-surface-800/60 opacity-55"
                            }`}
                        >
                            {/* Position number */}
                            <span className="text-xs font-bold text-surface-300 dark:text-surface-700 w-5 text-center shrink-0">
                                {i + 1}
                            </span>

                            {/* Drag handle */}
                            <GripVertical size={16} className="text-surface-300 dark:text-surface-600 shrink-0" />

                            {/* Up/Down */}
                            <div className="flex flex-col gap-0.5 shrink-0">
                                <button
                                    onClick={() => moveSection(i, "up")}
                                    disabled={i === 0}
                                    className="p-1 rounded-lg hover:bg-surface-100 dark:hover:bg-surface-800 disabled:opacity-20 transition-colors"
                                >
                                    <ChevronUp size={13} className="text-surface-500" />
                                </button>
                                <button
                                    onClick={() => moveSection(i, "down")}
                                    disabled={i === sections.length - 1}
                                    className="p-1 rounded-lg hover:bg-surface-100 dark:hover:bg-surface-800 disabled:opacity-20 transition-colors"
                                >
                                    <ChevronDown size={13} className="text-surface-500" />
                                </button>
                            </div>

                            {/* Info */}
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                                    <span className="font-semibold text-surface-900 dark:text-white text-sm truncate">{s.title}</span>
                                    <span className={`shrink-0 text-[10px] font-bold px-2 py-0.5 rounded-full ${TYPE_COLORS[s.type]}`}>
                                        {TYPE_LABELS[s.type]}
                                    </span>
                                    <span className="shrink-0 text-[10px] font-medium text-surface-400 dark:text-surface-500 px-2 py-0.5 rounded-full border border-surface-200 dark:border-surface-700">
                                        {s.display_style === "circles" ? "⭕ Cercles" : "🖼️ Cartes"}
                                    </span>
                                </div>

                                {s.subtitle && (
                                    <p className="text-xs text-surface-500 dark:text-surface-400 truncate">{s.subtitle}</p>
                                )}

                                <div className="flex items-center gap-3 mt-0.5 flex-wrap">
                                    {s.auto_rule && (
                                        <p className="text-xs text-surface-400 dark:text-surface-500">
                                            📐 {AUTO_RULE_LABELS[s.auto_rule]}
                                        </p>
                                    )}
                                    {s.restaurant_ids?.length ? (
                                        <p className="text-xs text-surface-400 dark:text-surface-500">
                                            🏪 {s.restaurant_ids.length} restaurant{s.restaurant_ids.length > 1 ? "s" : ""}
                                        </p>
                                    ) : null}
                                    {s.type === "seasonal" && s.starts_at && s.ends_at && (
                                        <p className="text-xs text-amber-600 dark:text-amber-400 flex items-center gap-1">
                                            <Calendar size={10} />
                                            {new Date(s.starts_at).toLocaleDateString("fr-FR")} → {new Date(s.ends_at).toLocaleDateString("fr-FR")}
                                        </p>
                                    )}
                                    {s.type === "manual" && !s.restaurant_ids?.length && (
                                        <p className="text-xs text-orange-500 dark:text-orange-400">⚠️ Aucun restaurant — à configurer</p>
                                    )}
                                </div>
                            </div>

                            {/* Actions */}
                            <div className="flex items-center gap-1 shrink-0">
                                <button
                                    onClick={() => toggleActive(s)}
                                    className={`p-2 rounded-lg transition-colors ${
                                        s.is_active
                                            ? "hover:bg-surface-100 dark:hover:bg-surface-800 text-surface-500"
                                            : "hover:bg-surface-100 dark:hover:bg-surface-800 text-surface-400"
                                    }`}
                                    title={s.is_active ? "Désactiver" : "Activer"}
                                >
                                    {s.is_active ? <Eye size={15} /> : <EyeOff size={15} />}
                                </button>
                                <button
                                    onClick={() => setModal({ open: true, initial: s })}
                                    className="p-2 rounded-lg hover:bg-surface-100 dark:hover:bg-surface-800 text-surface-500 transition-colors"
                                    title="Modifier"
                                >
                                    <Pencil size={15} />
                                </button>
                                <button
                                    onClick={() => duplicateSection(s)}
                                    className="p-2 rounded-lg hover:bg-surface-100 dark:hover:bg-surface-800 text-surface-400 hover:text-surface-600 transition-colors"
                                    title="Dupliquer"
                                >
                                    <Copy size={15} />
                                </button>
                                <button
                                    onClick={() => deleteSection(s.id)}
                                    className="p-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 text-surface-400 hover:text-red-500 transition-colors"
                                    title="Supprimer"
                                >
                                    <Trash2 size={15} />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {modal.open && (
                <SectionModal
                    initial={modal.initial}
                    totalSections={sections.length}
                    onSave={handleSave}
                    onClose={() => setModal({ open: false, initial: null })}
                />
            )}
        </div>
    );
}
