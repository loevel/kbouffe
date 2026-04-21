"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import {
    Plus,
    GripVertical,
    Eye,
    EyeOff,
    Trash2,
    Pencil,
    ChevronDown,
    ChevronUp,
    Save,
    Loader2,
    ExternalLink,
    LayoutTemplate,
    ImageIcon,
    Star,
    Clock,
    Users,
    Megaphone,
    Type,
    ArrowRight,
    ChefHat,
    X,
    Check,
} from "lucide-react";
import { Button, Card } from "@kbouffe/module-core/ui";
import { useDashboard, authFetch } from "@kbouffe/module-core/ui";

// ── Types ──────────────────────────────────────────────────────────────

interface ShowcaseSection {
    id: string;
    restaurant_id: string;
    section_type: string;
    title: string | null;
    subtitle: string | null;
    content: Record<string, any>;
    display_order: number;
    is_visible: boolean;
    settings: Record<string, any>;
    created_at: string;
    updated_at: string;
}

interface DashboardTeamMember {
    id: string;
    userId: string;
    role: string;
    status: string;
    name: string;
    imageUrl: string | null;
}

const SECTION_TYPE_META: Record<string, { label: string; icon: any; description: string; editable: boolean }> = {
    hero: { label: "Bannière principale", icon: LayoutTemplate, description: "Logo, nom et couverture du restaurant (données automatiques)", editable: false },
    about: { label: "À propos", icon: Type, description: "Présentez votre restaurant (texte + image optionnelle)", editable: true },
    menu_highlights: { label: "Plats vedettes", icon: Star, description: "Mettez en avant vos meilleurs plats", editable: true },
    full_menu: { label: "Menu complet", icon: ChefHat, description: "Affiche tout votre menu avec catégories (données automatiques)", editable: false },
    gallery: { label: "Galerie photos", icon: ImageIcon, description: "Les photos de votre restaurant (depuis Paramètres > Galerie)", editable: false },
    reviews: { label: "Avis clients", icon: Star, description: "Affiche les avis de vos clients (données automatiques)", editable: false },
    hours_location: { label: "Horaires & Contact", icon: Clock, description: "Horaires d'ouverture, adresse et contact (données automatiques)", editable: false },
    team: { label: "Notre équipe", icon: Users, description: "Présentez les membres de votre équipe", editable: true },
    specials: { label: "Offres spéciales", icon: Megaphone, description: "Promotions, menus du jour, offres limitées", editable: true },
    custom: { label: "Section libre", icon: Type, description: "Texte, image, galerie, boutons, mini-tableau", editable: true },
    cta: { label: "Appel à l'action", icon: ArrowRight, description: "Bouton \"Commander maintenant\"", editable: true },
};

const ADDABLE_TYPES = ["about", "menu_highlights", "team", "specials", "custom", "cta"];

// ── Main Component ─────────────────────────────────────────────────────

export default function ShowcaseEditorPage() {
    const { restaurant } = useDashboard();
    const [sections, setSections] = useState<ShowcaseSection[]>([]);
    const [restaurantId, setRestaurantId] = useState<string>("");
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState<string | null>(null);
    const [editingSection, setEditingSection] = useState<string | null>(null);
    const [showAddMenu, setShowAddMenu] = useState(false);
    const [products, setProducts] = useState<Array<{ id: string; name: string; image_url: string | null; price: number }>>([]);
    const [teamMembers, setTeamMembers] = useState<DashboardTeamMember[]>([]);

    // Fetch showcase sections
    useEffect(() => {
        if (!restaurant?.id) {
            setLoading(false);
            return;
        }

        fetch(`/api/dashboard/showcase?restaurantId=${restaurant.id}`)
            .then(r => r.json())
            .then((data: any) => {
                setSections(data.sections ?? []);
                setRestaurantId(data.restaurantId ?? "");
                setTeamMembers(Array.isArray(data.teamMembers) ? data.teamMembers : []);
            })
            .catch(() => {})
            .finally(() => setLoading(false));
    }, [restaurant?.id]);

    // Fetch products for menu_highlights picker
    useEffect(() => {
        if (!restaurant?.id) return;
        authFetch(`/api/products`)
            .then(r => r.json())
            .then((data: any) => setProducts(Array.isArray(data) ? data : data.products ?? []))
            .catch(() => {});
    }, [restaurant?.id]);

    const slug = restaurant?.slug;

    // ── Save section ────────────────────────────────────────────────
    const saveSection = useCallback(async (sectionId: string, updates: Partial<ShowcaseSection>) => {
        if (!restaurantId) return;
        setSaving(sectionId);
        try {
            const res = await fetch(`/api/showcase/${restaurantId}/${sectionId}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(updates),
            });
            if (res.ok) {
                const updated = await res.json();
                setSections(prev => prev.map(s => s.id === sectionId ? updated : s));
            }
        } catch {}
        setSaving(null);
    }, [restaurantId]);

    // ── Toggle visibility ───────────────────────────────────────────
    const toggleVisibility = useCallback(async (section: ShowcaseSection) => {
        await saveSection(section.id, { is_visible: !section.is_visible });
    }, [saveSection]);

    // ── Move section up/down ────────────────────────────────────────
    const moveSection = useCallback(async (index: number, direction: "up" | "down") => {
        const newSections = [...sections];
        const targetIndex = direction === "up" ? index - 1 : index + 1;
        if (targetIndex < 0 || targetIndex >= newSections.length) return;

        // Swap
        [newSections[index], newSections[targetIndex]] = [newSections[targetIndex], newSections[index]];
        const reordered = newSections.map((s, i) => ({ ...s, display_order: i }));
        setSections(reordered);

        // Persist
        await fetch(`/api/showcase/${restaurantId}/reorder`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ order: reordered.map(s => ({ id: s.id, display_order: s.display_order })) }),
        });
    }, [sections, restaurantId]);

    // ── Delete section ──────────────────────────────────────────────
    const deleteSection = useCallback(async (sectionId: string) => {
        if (!restaurantId) return;
        const res = await fetch(`/api/showcase/${restaurantId}/${sectionId}`, { method: "DELETE" });
        if (res.ok) {
            setSections(prev => prev.filter(s => s.id !== sectionId));
        }
    }, [restaurantId]);

    // ── Add section ─────────────────────────────────────────────────
    const addSection = useCallback(async (sectionType: string) => {
        if (!restaurantId) return;
        const meta = SECTION_TYPE_META[sectionType];
        const res = await fetch(`/api/showcase/${restaurantId}`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                section_type: sectionType,
                title: meta?.label ?? "Nouvelle section",
                content: sectionType === "cta"
                    ? { text: "Envie de goûter ?", buttonLabel: "Commander" }
                    : sectionType === "about"
                        ? { text: "" }
                        : sectionType === "team"
                            ? { text: "", memberOverrides: {} }
                            : sectionType === "specials"
                                ? { items: [] }
                                : { text: "" },
            }),
        });
        if (res.ok) {
            const newSection = await res.json();
            setSections(prev => [...prev, newSection]);
        }
        setShowAddMenu(false);
    }, [restaurantId]);

    if (loading) {
        return (
            <div className="flex items-center justify-center py-32">
                <Loader2 size={24} className="animate-spin text-brand-500" />
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-extrabold text-surface-900 dark:text-white">Page vitrine</h1>
                    <p className="text-sm text-surface-500 dark:text-surface-400 mt-1">
                        Personnalisez la page de présentation de votre restaurant
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    {slug && (
                        <Link
                            href={`/r/${slug}/vitrine`}
                            target="_blank"
                            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-surface-200 dark:border-surface-700 text-surface-700 dark:text-surface-300 text-sm font-medium hover:bg-surface-50 dark:hover:bg-surface-800 transition-colors"
                        >
                            <ExternalLink size={14} />
                            Aperçu
                        </Link>
                    )}
                </div>
            </div>

            {/* Vitrine URL */}
            {slug && (
                <div className="bg-brand-50 dark:bg-brand-500/10 border border-brand-200 dark:border-brand-500/20 rounded-xl p-4 flex flex-col sm:flex-row items-start sm:items-center gap-3">
                    <div className="flex-1 min-w-0">
                        <p className="text-xs font-bold text-brand-700 dark:text-brand-400 uppercase tracking-wider mb-1">URL de votre vitrine</p>
                        <p className="text-sm font-mono text-brand-600 dark:text-brand-300 truncate">
                            {typeof window !== "undefined" ? window.location.origin : ""}/r/{slug}/vitrine
                        </p>
                    </div>
                    <button
                        onClick={() => {
                            navigator.clipboard.writeText(`${window.location.origin}/r/${slug}/vitrine`);
                        }}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-brand-600 dark:text-brand-400 bg-white dark:bg-surface-900 border border-brand-200 dark:border-brand-500/30 rounded-lg hover:bg-brand-50 dark:hover:bg-brand-500/10 transition-colors"
                    >
                        Copier le lien
                    </button>
                </div>
            )}

            {/* Sections list */}
            <div className="space-y-3">
                {sections.map((section, index) => {
                    const meta = SECTION_TYPE_META[section.section_type] ?? {
                        label: section.section_type,
                        icon: Type,
                        description: "",
                        editable: true,
                    };
                    const Icon = meta.icon;
                    const isEditing = editingSection === section.id;

                    return (
                        <div
                            key={section.id}
                            className={`bg-white dark:bg-surface-900 rounded-xl border ${
                                section.is_visible
                                    ? "border-surface-200 dark:border-surface-800"
                                    : "border-dashed border-surface-300 dark:border-surface-700 opacity-60"
                            } overflow-hidden transition-all`}
                        >
                            {/* Section header */}
                            <div className="flex items-center gap-3 p-4">
                                <div className="text-surface-400 dark:text-surface-600 cursor-grab">
                                    <GripVertical size={18} />
                                </div>
                                <div className="p-2 rounded-lg bg-surface-50 dark:bg-surface-800">
                                    <Icon size={16} className="text-surface-600 dark:text-surface-400" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-bold text-surface-900 dark:text-white">
                                        {section.title || meta.label}
                                    </p>
                                    <p className="text-[11px] text-surface-400">{meta.description}</p>
                                </div>
                                <div className="flex items-center gap-1.5">
                                    {/* Move up/down */}
                                    <button
                                        onClick={() => moveSection(index, "up")}
                                        disabled={index === 0}
                                        className="p-1.5 text-surface-400 hover:text-surface-600 disabled:opacity-30 transition-colors"
                                        title="Monter"
                                    >
                                        <ChevronUp size={16} />
                                    </button>
                                    <button
                                        onClick={() => moveSection(index, "down")}
                                        disabled={index === sections.length - 1}
                                        className="p-1.5 text-surface-400 hover:text-surface-600 disabled:opacity-30 transition-colors"
                                        title="Descendre"
                                    >
                                        <ChevronDown size={16} />
                                    </button>

                                    {/* Toggle visibility */}
                                    <button
                                        onClick={() => toggleVisibility(section)}
                                        className={`p-1.5 transition-colors ${section.is_visible ? "text-green-500 hover:text-green-600" : "text-surface-400 hover:text-surface-600"}`}
                                        title={section.is_visible ? "Masquer" : "Afficher"}
                                    >
                                        {section.is_visible ? <Eye size={16} /> : <EyeOff size={16} />}
                                    </button>

                                    {/* Edit */}
                                    {meta.editable && (
                                        <button
                                            onClick={() => setEditingSection(isEditing ? null : section.id)}
                                            className={`p-1.5 transition-colors ${isEditing ? "text-brand-500" : "text-surface-400 hover:text-surface-600"}`}
                                            title="Modifier"
                                        >
                                            <Pencil size={16} />
                                        </button>
                                    )}

                                    {/* Delete (only user-added sections) */}
                                    {ADDABLE_TYPES.includes(section.section_type) && (
                                        <button
                                            onClick={() => {
                                                if (confirm("Supprimer cette section ?")) deleteSection(section.id);
                                            }}
                                            className="p-1.5 text-surface-400 hover:text-red-500 transition-colors"
                                            title="Supprimer"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    )}

                                    {saving === section.id && (
                                        <Loader2 size={14} className="animate-spin text-brand-500 ml-1" />
                                    )}
                                </div>
                            </div>

                            {/* Inline editor */}
                            {isEditing && (
                                <SectionEditor
                                    section={section}
                                    products={products}
                                    teamMembers={teamMembers}
                                    onSave={(updates) => {
                                        saveSection(section.id, updates);
                                        setEditingSection(null);
                                    }}
                                    onCancel={() => setEditingSection(null)}
                                />
                            )}
                        </div>
                    );
                })}
            </div>

            {/* Add section */}
            <div className="relative">
                <button
                    onClick={() => setShowAddMenu(!showAddMenu)}
                    className="w-full flex items-center justify-center gap-2 py-3 rounded-xl border-2 border-dashed border-surface-300 dark:border-surface-700 text-surface-500 hover:text-brand-500 hover:border-brand-500 transition-colors text-sm font-medium"
                >
                    <Plus size={16} />
                    Ajouter une section
                </button>

                {showAddMenu && (
                    <div className="absolute left-0 right-0 top-full mt-2 bg-white dark:bg-surface-900 border border-surface-200 dark:border-surface-800 rounded-xl shadow-xl z-20 overflow-hidden">
                        {ADDABLE_TYPES.map(type => {
                            const meta = SECTION_TYPE_META[type];
                            const Icon = meta.icon;
                            return (
                                <button
                                    key={type}
                                    onClick={() => addSection(type)}
                                    className="w-full flex items-center gap-3 p-3 hover:bg-surface-50 dark:hover:bg-surface-800 transition-colors text-left"
                                >
                                    <div className="p-2 rounded-lg bg-surface-50 dark:bg-surface-800">
                                        <Icon size={14} className="text-surface-500" />
                                    </div>
                                    <div>
                                        <p className="text-sm font-medium text-surface-900 dark:text-white">{meta.label}</p>
                                        <p className="text-[11px] text-surface-400">{meta.description}</p>
                                    </div>
                                </button>
                            );
                        })}
                        <div className="border-t border-surface-100 dark:border-surface-800 p-2">
                            <button
                                onClick={() => setShowAddMenu(false)}
                                className="w-full text-center text-xs text-surface-400 py-1 hover:text-surface-600 transition-colors"
                            >
                                Annuler
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* Tips */}
            <div className="bg-surface-50 dark:bg-surface-900 border border-surface-200 dark:border-surface-800 rounded-xl p-5">
                <h3 className="text-sm font-bold text-surface-900 dark:text-white mb-2">Conseils</h3>
                <ul className="text-xs text-surface-500 dark:text-surface-400 space-y-1.5">
                    <li>• Les sections <strong>Bannière</strong>, <strong>Menu</strong>, <strong>Galerie</strong>, <strong>Avis</strong> et <strong>Horaires</strong> se remplissent automatiquement avec vos données existantes.</li>
                    <li>• Ajoutez une section <strong>À propos</strong> pour raconter l&apos;histoire de votre restaurant.</li>
                    <li>• Utilisez <strong>Plats vedettes</strong> pour mettre en avant vos spécialités.</li>
                    <li>• Réorganisez les sections en utilisant les flèches haut/bas.</li>
                    <li>• Masquez une section avec l&apos;icône œil sans la supprimer.</li>
                    <li>• Dans <strong>Section libre</strong>, vous pouvez ajouter une galerie, des boutons et un mini-tableau.</li>
                </ul>
            </div>
        </div>
    );
}

// ── Section Editor Component ───────────────────────────────────────────

function SectionEditor({
    section,
    products,
    teamMembers,
    onSave,
    onCancel,
}: {
    section: ShowcaseSection;
    products: Array<{ id: string; name: string; image_url: string | null; price: number }>;
    teamMembers: DashboardTeamMember[];
    onSave: (updates: Partial<ShowcaseSection>) => void;
    onCancel: () => void;
}) {
    const [title, setTitle] = useState(section.title ?? "");
    const [subtitle, setSubtitle] = useState(section.subtitle ?? "");
    const [content, setContent] = useState(section.content ?? {});

    const handleSave = () => {
        onSave({ title: title || null, subtitle: subtitle || null, content });
    };

    return (
        <div className="border-t border-surface-100 dark:border-surface-800 p-4 bg-surface-50/50 dark:bg-surface-800/30 space-y-4">
            {/* Title & Subtitle (common to all) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                    <label className="text-xs font-medium text-surface-500 mb-1 block">Titre</label>
                    <input
                        value={title}
                        onChange={e => setTitle(e.target.value)}
                        className="w-full h-9 px-3 rounded-lg border border-surface-200 dark:border-surface-700 bg-white dark:bg-surface-900 text-sm text-surface-900 dark:text-white focus:ring-2 ring-brand-500/20 outline-none"
                        placeholder="Titre de la section"
                    />
                </div>
                <div>
                    <label className="text-xs font-medium text-surface-500 mb-1 block">Sous-titre</label>
                    <input
                        value={subtitle}
                        onChange={e => setSubtitle(e.target.value)}
                        className="w-full h-9 px-3 rounded-lg border border-surface-200 dark:border-surface-700 bg-white dark:bg-surface-900 text-sm text-surface-900 dark:text-white focus:ring-2 ring-brand-500/20 outline-none"
                        placeholder="Sous-titre optionnel"
                    />
                </div>
            </div>

            {/* Section-specific editors */}
            {section.section_type === "about" && (
                <AboutEditor content={content} onChange={setContent} />
            )}
            {section.section_type === "menu_highlights" && (
                <MenuHighlightsEditor content={content} products={products} onChange={setContent} />
            )}
            {section.section_type === "team" && (
                <TeamEditor content={content} teamMembers={teamMembers} onChange={setContent} />
            )}
            {section.section_type === "specials" && (
                <SpecialsEditor content={content} onChange={setContent} />
            )}
            {section.section_type === "custom" && (
                <CustomEditor content={content} onChange={setContent} />
            )}
            {section.section_type === "cta" && (
                <CtaEditor content={content} onChange={setContent} />
            )}

            {/* Actions */}
            <div className="flex items-center gap-2 pt-2">
                <button
                    onClick={handleSave}
                    className="inline-flex items-center gap-1.5 px-4 py-2 bg-brand-500 hover:bg-brand-600 text-white rounded-lg text-sm font-bold transition-colors"
                >
                    <Save size={14} /> Enregistrer
                </button>
                <button
                    onClick={onCancel}
                    className="inline-flex items-center gap-1.5 px-4 py-2 border border-surface-200 dark:border-surface-700 text-surface-600 dark:text-surface-400 rounded-lg text-sm font-medium hover:bg-surface-50 dark:hover:bg-surface-800 transition-colors"
                >
                    Annuler
                </button>
            </div>
        </div>
    );
}

// ── About Editor ───────────────────────────────────────────────────────

function AboutEditor({ content, onChange }: { content: Record<string, any>; onChange: (c: Record<string, any>) => void }) {
    return (
        <div className="space-y-3">
            <div>
                <label className="text-xs font-medium text-surface-500 mb-1 block">Texte de présentation</label>
                <textarea
                    value={content.text ?? ""}
                    onChange={e => onChange({ ...content, text: e.target.value })}
                    rows={5}
                    className="w-full px-3 py-2 rounded-lg border border-surface-200 dark:border-surface-700 bg-white dark:bg-surface-900 text-sm text-surface-900 dark:text-white focus:ring-2 ring-brand-500/20 outline-none resize-none"
                    placeholder="Racontez l'histoire de votre restaurant..."
                />
            </div>
            <div>
                <label className="text-xs font-medium text-surface-500 mb-1 block">Image (URL optionnelle)</label>
                <input
                    value={content.imageUrl ?? ""}
                    onChange={e => onChange({ ...content, imageUrl: e.target.value })}
                    className="w-full h-9 px-3 rounded-lg border border-surface-200 dark:border-surface-700 bg-white dark:bg-surface-900 text-sm text-surface-900 dark:text-white focus:ring-2 ring-brand-500/20 outline-none"
                    placeholder="https://..."
                />
            </div>
        </div>
    );
}

// ── Menu Highlights Editor ─────────────────────────────────────────────

function MenuHighlightsEditor({
    content,
    products,
    onChange,
}: {
    content: Record<string, any>;
    products: Array<{ id: string; name: string; image_url: string | null; price: number }>;
    onChange: (c: Record<string, any>) => void;
}) {
    const selectedIds: string[] = content.productIds ?? [];

    const toggleProduct = (productId: string) => {
        const newIds = selectedIds.includes(productId)
            ? selectedIds.filter(id => id !== productId)
            : [...selectedIds, productId];
        onChange({ ...content, productIds: newIds });
    };

    return (
        <div>
            <label className="text-xs font-medium text-surface-500 mb-2 block">
                Sélectionnez les plats à mettre en vedette ({selectedIds.length} sélectionnés)
            </label>
            <p className="text-[11px] text-surface-400 mb-3">
                Si aucun plat n&apos;est sélectionné, les premiers produits disponibles seront affichés automatiquement.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-64 overflow-y-auto">
                {products.map(product => {
                    const isSelected = selectedIds.includes(product.id);
                    return (
                        <button
                            key={product.id}
                            onClick={() => toggleProduct(product.id)}
                            className={`flex items-center gap-3 p-2.5 rounded-lg border text-left transition-all ${
                                isSelected
                                    ? "border-brand-500 bg-brand-50 dark:bg-brand-500/10"
                                    : "border-surface-200 dark:border-surface-700 hover:border-surface-300"
                            }`}
                        >
                            <div className="w-10 h-10 rounded-lg bg-surface-100 dark:bg-surface-800 shrink-0 overflow-hidden">
                                {product.image_url ? (
                                    <img src={product.image_url} alt="" className="w-full h-full object-cover" />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center">
                                        <ChefHat size={14} className="text-surface-300" />
                                    </div>
                                )}
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-xs font-bold text-surface-900 dark:text-white truncate">{product.name}</p>
                            </div>
                            {isSelected && <Check size={14} className="text-brand-500 shrink-0" />}
                        </button>
                    );
                })}
            </div>
        </div>
    );
}

// ── Team Editor ────────────────────────────────────────────────────────

function TeamEditor({
    content,
    teamMembers,
    onChange,
}: {
    content: Record<string, any>;
    teamMembers: DashboardTeamMember[];
    onChange: (c: Record<string, any>) => void;
}) {
    const memberOverrides = content.memberOverrides && typeof content.memberOverrides === "object"
        ? content.memberOverrides
        : {};

    const updateMemberOverride = (userId: string, field: string, value: string | boolean | number) => {
        onChange({
            ...content,
            memberOverrides: {
                ...memberOverrides,
                [userId]: {
                    ...(memberOverrides[userId] ?? {}),
                    [field]: value,
                },
            },
        });
    };

    return (
        <div className="space-y-3">
            <div>
                <label className="text-xs font-medium text-surface-500 mb-1 block">Description de l&apos;équipe (optionnel)</label>
                <textarea
                    value={content.text ?? ""}
                    onChange={e => onChange({ ...content, text: e.target.value })}
                    rows={2}
                    className="w-full px-3 py-2 rounded-lg border border-surface-200 dark:border-surface-700 bg-white dark:bg-surface-900 text-sm text-surface-900 dark:text-white focus:ring-2 ring-brand-500/20 outline-none resize-none"
                    placeholder="Quelques mots sur votre équipe..."
                />
            </div>

            <p className="text-[11px] text-surface-400">
                Les membres sont chargés automatiquement depuis votre équipe restaurant. Vous pouvez personnaliser l&apos;affichage ci-dessous.
            </p>

            {teamMembers.map((member, index) => {
                const override = memberOverrides[member.userId] ?? {};
                return (
                    <div key={member.userId} className="p-3 bg-white dark:bg-surface-900 border border-surface-200 dark:border-surface-700 rounded-lg space-y-2">
                        <div className="flex items-center justify-between gap-3">
                            <div className="min-w-0">
                                <p className="text-xs font-bold text-surface-900 dark:text-white truncate">{member.name}</p>
                                <p className="text-[11px] text-surface-400 truncate">{member.role}</p>
                            </div>
                            <label className="inline-flex items-center gap-1.5 text-xs text-surface-500">
                                <input
                                    type="checkbox"
                                    checked={Boolean(override.hidden)}
                                    onChange={e => updateMemberOverride(member.userId, "hidden", e.target.checked)}
                                />
                                Masquer
                            </label>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                            <input
                                value={override.displayName ?? ""}
                                onChange={e => updateMemberOverride(member.userId, "displayName", e.target.value)}
                                className="h-8 px-2 rounded border border-surface-200 dark:border-surface-700 bg-surface-50 dark:bg-surface-800 text-xs"
                                placeholder="Nom affiché (optionnel)"
                            />
                            <input
                                value={override.displayRole ?? ""}
                                onChange={e => updateMemberOverride(member.userId, "displayRole", e.target.value)}
                                className="h-8 px-2 rounded border border-surface-200 dark:border-surface-700 bg-surface-50 dark:bg-surface-800 text-xs"
                                placeholder="Poste affiché (optionnel)"
                            />
                            <input
                                value={override.imageUrl ?? ""}
                                onChange={e => updateMemberOverride(member.userId, "imageUrl", e.target.value)}
                                className="h-8 px-2 rounded border border-surface-200 dark:border-surface-700 bg-surface-50 dark:bg-surface-800 text-xs"
                                placeholder="Photo personnalisée (URL)"
                            />
                            <input
                                type="number"
                                value={override.sortOrder ?? index}
                                onChange={e => updateMemberOverride(member.userId, "sortOrder", e.target.value ? Number(e.target.value) : index)}
                                className="h-8 px-2 rounded border border-surface-200 dark:border-surface-700 bg-surface-50 dark:bg-surface-800 text-xs"
                                placeholder="Ordre"
                            />
                            <textarea
                                value={override.bio ?? ""}
                                onChange={e => updateMemberOverride(member.userId, "bio", e.target.value)}
                                rows={2}
                                className="px-2 py-1.5 rounded border border-surface-200 dark:border-surface-700 bg-surface-50 dark:bg-surface-800 text-xs col-span-1 sm:col-span-2"
                                placeholder="Bio (optionnel)"
                            />
                        </div>
                    </div>
                );
            })}

            {teamMembers.length === 0 && (
                <p className="text-xs text-surface-500">
                    Aucun membre actif trouvé pour ce restaurant. Invitez des membres dans l&apos;espace équipe pour les afficher ici.
                </p>
            )}
        </div>
    );
}

// ── Specials Editor ────────────────────────────────────────────────────

function SpecialsEditor({ content, onChange }: { content: Record<string, any>; onChange: (c: Record<string, any>) => void }) {
    const items: Array<{ title: string; description?: string; imageUrl?: string; price?: number; badge?: string }> = content.items ?? [];

    const updateItem = (index: number, field: string, value: any) => {
        const updated = [...items];
        updated[index] = { ...updated[index], [field]: value };
        onChange({ ...content, items: updated });
    };

    const addItem = () => {
        onChange({ ...content, items: [...items, { title: "" }] });
    };

    const removeItem = (index: number) => {
        onChange({ ...content, items: items.filter((_, i) => i !== index) });
    };

    return (
        <div className="space-y-3">
            {items.map((item, index) => (
                <div key={index} className="p-3 bg-white dark:bg-surface-900 border border-surface-200 dark:border-surface-700 rounded-lg space-y-2">
                    <div className="flex items-start gap-2">
                        <div className="flex-1 grid grid-cols-2 gap-2">
                            <input
                                value={item.title}
                                onChange={e => updateItem(index, "title", e.target.value)}
                                className="h-8 px-2 rounded border border-surface-200 dark:border-surface-700 bg-surface-50 dark:bg-surface-800 text-xs"
                                placeholder="Titre (ex: Menu du jour)"
                            />
                            <input
                                value={item.badge ?? ""}
                                onChange={e => updateItem(index, "badge", e.target.value)}
                                className="h-8 px-2 rounded border border-surface-200 dark:border-surface-700 bg-surface-50 dark:bg-surface-800 text-xs"
                                placeholder="Badge (ex: -20%, Nouveau)"
                            />
                            <input
                                value={item.description ?? ""}
                                onChange={e => updateItem(index, "description", e.target.value)}
                                className="h-8 px-2 rounded border border-surface-200 dark:border-surface-700 bg-surface-50 dark:bg-surface-800 text-xs col-span-2"
                                placeholder="Description"
                            />
                            <input
                                value={item.imageUrl ?? ""}
                                onChange={e => updateItem(index, "imageUrl", e.target.value)}
                                className="h-8 px-2 rounded border border-surface-200 dark:border-surface-700 bg-surface-50 dark:bg-surface-800 text-xs"
                                placeholder="Image (URL)"
                            />
                            <input
                                type="number"
                                value={item.price ?? ""}
                                onChange={e => updateItem(index, "price", e.target.value ? Number(e.target.value) : undefined)}
                                className="h-8 px-2 rounded border border-surface-200 dark:border-surface-700 bg-surface-50 dark:bg-surface-800 text-xs"
                                placeholder="Prix (FCFA)"
                            />
                        </div>
                        <button onClick={() => removeItem(index)} className="p-1 text-surface-400 hover:text-red-500">
                            <X size={14} />
                        </button>
                    </div>
                </div>
            ))}

            <button
                onClick={addItem}
                className="flex items-center gap-1.5 text-xs text-brand-500 font-medium hover:text-brand-600"
            >
                <Plus size={14} /> Ajouter une offre
            </button>
        </div>
    );
}

// ── Custom Editor ──────────────────────────────────────────────────────

function CustomEditor({ content, onChange }: { content: Record<string, any>; onChange: (c: Record<string, any>) => void }) {
    const buttons: Array<{ label: string; url: string }> = Array.isArray(content.buttons) ? content.buttons : [];

    const updateButton = (index: number, field: "label" | "url", value: string) => {
        const updated = [...buttons];
        updated[index] = { ...updated[index], [field]: value };
        onChange({ ...content, buttons: updated });
    };

    const addButton = () => {
        onChange({ ...content, buttons: [...buttons, { label: "", url: "" }] });
    };

    const removeButton = (index: number) => {
        onChange({ ...content, buttons: buttons.filter((_, i) => i !== index) });
    };

    return (
        <div className="space-y-3">
            <div>
                <label className="text-xs font-medium text-surface-500 mb-1 block">Contenu</label>
                <textarea
                    value={content.text ?? ""}
                    onChange={e => onChange({ ...content, text: e.target.value })}
                    rows={4}
                    className="w-full px-3 py-2 rounded-lg border border-surface-200 dark:border-surface-700 bg-white dark:bg-surface-900 text-sm text-surface-900 dark:text-white focus:ring-2 ring-brand-500/20 outline-none resize-none"
                    placeholder="Votre texte ici..."
                />
            </div>
            <div>
                <label className="text-xs font-medium text-surface-500 mb-1 block">Image (URL optionnelle)</label>
                <input
                    value={content.imageUrl ?? ""}
                    onChange={e => onChange({ ...content, imageUrl: e.target.value })}
                    className="w-full h-9 px-3 rounded-lg border border-surface-200 dark:border-surface-700 bg-white dark:bg-surface-900 text-sm text-surface-900 dark:text-white focus:ring-2 ring-brand-500/20 outline-none"
                    placeholder="https://..."
                />
            </div>

            <div>
                <label className="text-xs font-medium text-surface-500 mb-1 block">Galerie photos (1 URL par ligne)</label>
                <textarea
                    value={Array.isArray(content.galleryImages) ? content.galleryImages.join("\n") : ""}
                    onChange={e => onChange({
                        ...content,
                        galleryImages: e.target.value
                            .split("\n")
                            .map(line => line.trim())
                            .filter(Boolean),
                    })}
                    rows={4}
                    className="w-full px-3 py-2 rounded-lg border border-surface-200 dark:border-surface-700 bg-white dark:bg-surface-900 text-sm text-surface-900 dark:text-white focus:ring-2 ring-brand-500/20 outline-none resize-none"
                    placeholder={"https://...\nhttps://..."}
                />
            </div>

            <div className="space-y-2">
                <label className="text-xs font-medium text-surface-500 block">Boutons d&apos;action</label>
                {buttons.map((button, index) => (
                    <div key={index} className="grid grid-cols-1 sm:grid-cols-[1fr_1.5fr_auto] gap-2 items-center">
                        <input
                            value={button.label ?? ""}
                            onChange={e => updateButton(index, "label", e.target.value)}
                            className="h-9 px-3 rounded-lg border border-surface-200 dark:border-surface-700 bg-white dark:bg-surface-900 text-sm text-surface-900 dark:text-white"
                            placeholder="Texte du bouton"
                        />
                        <input
                            value={button.url ?? ""}
                            onChange={e => updateButton(index, "url", e.target.value)}
                            className="h-9 px-3 rounded-lg border border-surface-200 dark:border-surface-700 bg-white dark:bg-surface-900 text-sm text-surface-900 dark:text-white"
                            placeholder="https://..."
                        />
                        <button
                            onClick={() => removeButton(index)}
                            className="p-2 text-surface-400 hover:text-red-500"
                            title="Supprimer"
                        >
                            <X size={14} />
                        </button>
                    </div>
                ))}
                <button
                    onClick={addButton}
                    className="inline-flex items-center gap-1.5 text-xs text-brand-500 font-medium hover:text-brand-600"
                >
                    <Plus size={14} /> Ajouter un bouton
                </button>
            </div>

            <div className="space-y-2">
                <label className="text-xs font-medium text-surface-500 block">Mini-tableau</label>
                <input
                    value={Array.isArray(content.table?.headers) ? content.table.headers.join(";") : ""}
                    onChange={e => onChange({
                        ...content,
                        table: {
                            ...(content.table ?? {}),
                            headers: e.target.value
                                .split(";")
                                .map((h: string) => h.trim())
                                .filter(Boolean),
                        },
                    })}
                    className="w-full h-9 px-3 rounded-lg border border-surface-200 dark:border-surface-700 bg-white dark:bg-surface-900 text-sm text-surface-900 dark:text-white"
                    placeholder="Colonnes (ex: Service;Délai;Prix)"
                />
                <textarea
                    value={Array.isArray(content.table?.rows)
                        ? content.table.rows.map((row: string[]) => row.join(";")).join("\n")
                        : ""}
                    onChange={e => onChange({
                        ...content,
                        table: {
                            ...(content.table ?? {}),
                            rows: e.target.value
                                .split("\n")
                                .map(line => line.split(";").map(cell => cell.trim()).filter(Boolean))
                                .filter(row => row.length > 0),
                        },
                    })}
                    rows={4}
                    className="w-full px-3 py-2 rounded-lg border border-surface-200 dark:border-surface-700 bg-white dark:bg-surface-900 text-sm text-surface-900 dark:text-white focus:ring-2 ring-brand-500/20 outline-none resize-none"
                    placeholder={"Ligne 1 (ex: Livraison;30 min;1500 FCFA)\nLigne 2 (...)"}
                />
            </div>
        </div>
    );
}

// ── CTA Editor ─────────────────────────────────────────────────────────

function CtaEditor({ content, onChange }: { content: Record<string, any>; onChange: (c: Record<string, any>) => void }) {
    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
                <label className="text-xs font-medium text-surface-500 mb-1 block">Texte d&apos;accroche</label>
                <input
                    value={content.text ?? ""}
                    onChange={e => onChange({ ...content, text: e.target.value })}
                    className="w-full h-9 px-3 rounded-lg border border-surface-200 dark:border-surface-700 bg-white dark:bg-surface-900 text-sm text-surface-900 dark:text-white focus:ring-2 ring-brand-500/20 outline-none"
                    placeholder="Envie de goûter ?"
                />
            </div>
            <div>
                <label className="text-xs font-medium text-surface-500 mb-1 block">Texte du bouton</label>
                <input
                    value={content.buttonLabel ?? ""}
                    onChange={e => onChange({ ...content, buttonLabel: e.target.value })}
                    className="w-full h-9 px-3 rounded-lg border border-surface-200 dark:border-surface-700 bg-white dark:bg-surface-900 text-sm text-surface-900 dark:text-white focus:ring-2 ring-brand-500/20 outline-none"
                    placeholder="Commander maintenant"
                />
            </div>
        </div>
    );
}
