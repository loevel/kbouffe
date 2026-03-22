"use client";

import { useState, useCallback } from "react";
import { Plus, Trash2, Edit3, X, Check, ImagePlus } from "lucide-react";
import { Modal, ModalFooter, Button, Input, Select, toast } from "@kbouffe/module-core/ui";
import { useLocale } from "@kbouffe/module-core/ui";
import { createClient } from "@/lib/supabase/client";

interface TableZone {
    id: string;
    name: string;
    type: string;
    description: string | null;
    sort_order: number;
    is_active: boolean;
    image_url: string | null;
    image_urls: string[] | null;
    color: string | null;
    capacity: number;
    min_party_size: number;
    amenities: string[];
    pricing_note: string | null;
}

interface ZoneManagerProps {
    isOpen: boolean;
    onClose: () => void;
    zones: TableZone[];
    onUpdated: () => void;
}

const ZONE_TYPES = [
    { value: "indoor", labelKey: "zoneIndoor" },
    { value: "outdoor", labelKey: "zoneOutdoor" },
    { value: "terrace", labelKey: "zoneTerrace" },
    { value: "vip", labelKey: "zoneVip" },
    { value: "air_conditioned", labelKey: "zoneAirCon" },
] as const;

const AMENITY_OPTIONS = [
    { value: "wifi", labelKey: "amenityWifi", icon: "📶" },
    { value: "ac", labelKey: "amenityAc", icon: "❄️" },
    { value: "view", labelKey: "amenityView", icon: "🌅" },
    { value: "private", labelKey: "amenityPrivate", icon: "🔒" },
    { value: "music", labelKey: "amenityMusic", icon: "🎵" },
    { value: "tv", labelKey: "amenityTv", icon: "📺" },
    { value: "outdoor", labelKey: "amenityOutdoor", icon: "🌿" },
    { value: "parking", labelKey: "amenityParking", icon: "🅿️" },
] as const;

const ZONE_COLORS = [
    "#6366f1", "#8b5cf6", "#ec4899", "#ef4444", "#f97316",
    "#eab308", "#22c55e", "#14b8a6", "#06b6d4", "#3b82f6",
    "#64748b", "#78716c",
];

export function ZoneManager({ isOpen, onClose, zones, onUpdated }: ZoneManagerProps) {
    const { t } = useLocale();
    const [name, setName] = useState("");
    const [type, setType] = useState("indoor");
    const [imageUrls, setImageUrls] = useState<string[]>([]);
    const [color, setColor] = useState("#6366f1");
    const [capacity, setCapacity] = useState("0");
    const [minPartySize, setMinPartySize] = useState("1");
    const [amenities, setAmenities] = useState<string[]>([]);
    const [pricingNote, setPricingNote] = useState("");
    const [loading, setLoading] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);

    const authFetch = useCallback(async (url: string, options: RequestInit = {}) => {
        const supabase = createClient();
        const headers: Record<string, string> = { ...(options.headers as any) };
        if (supabase) {
            const { data: { session } } = await supabase.auth.getSession();
            if (session?.access_token) {
                headers["Authorization"] = `Bearer ${session.access_token}`;
            }
        }
        return fetch(url, { ...options, headers });
    }, []);

    const resetForm = () => {
        setName("");
        setType("indoor");
        setImageUrls([]);
        setColor("#6366f1");
        setCapacity("0");
        setMinPartySize("1");
        setAmenities([]);
        setPricingNote("");
        setEditingId(null);
    };

    const fillForEdit = (zone: TableZone) => {
        setEditingId(zone.id);
        setName(zone.name);
        setType(zone.type ?? "indoor");
        setImageUrls(zone.image_urls?.filter(Boolean) ?? (zone.image_url ? [zone.image_url] : []));
        setColor(zone.color ?? "#6366f1");
        setCapacity(String(zone.capacity ?? 0));
        setMinPartySize(String(zone.min_party_size ?? 1));
        setAmenities(zone.amenities ?? []);
        setPricingNote(zone.pricing_note ?? "");
    };

    const toggleAmenity = (value: string) => {
        setAmenities((prev) =>
            prev.includes(value) ? prev.filter((a) => a !== value) : [...prev, value]
        );
    };

    const handleSubmit = async () => {
        if (!name.trim()) {
            toast.error(t.tables.zoneNameRequired);
            return;
        }
        setLoading(true);
        try {
            const cleanUrls = imageUrls.map((u) => u.trim()).filter(Boolean);
            const payload = {
                name: name.trim(),
                type,
                description: null,
                image_url: cleanUrls[0] ?? null,
                image_urls: cleanUrls,
                color,
                capacity: parseInt(capacity, 10) || 0,
                min_party_size: parseInt(minPartySize, 10) || 1,
                amenities,
                pricing_note: pricingNote.trim() || null,
            };

            const url = editingId ? `/api/zones/${editingId}` : "/api/zones";
            const method = editingId ? "PATCH" : "POST";

            const res = await authFetch(url, {
                method,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });
            const data = await res.json();
            if (!res.ok) {
                toast.error(data.error ?? t.common.error);
                return;
            }
            toast.success(editingId ? t.reservations.reservationUpdated : t.tables.zoneCreated);
            resetForm();
            onUpdated();
        } catch {
            toast.error(t.common.error);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (zoneId: string) => {
        const res = await authFetch(`/api/zones/${zoneId}`, { method: "DELETE" });
        if (!res.ok) {
            const data = await res.json();
            toast.error(data.error ?? t.common.error);
            return;
        }
        toast.success(t.tables.zoneDeleted);
        if (editingId === zoneId) resetForm();
        onUpdated();
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={t.tables.manageZones} description={t.tables.manageZonesDesc}>
            {/* Existing zones — compact scrollable list */}
            <div className="space-y-2 mb-4 max-h-48 overflow-y-auto pr-1">
                {zones.length === 0 ? (
                    <p className="text-sm text-surface-400 text-center py-3">{t.tables.noZones}</p>
                ) : (
                    zones.map((zone) => (
                        <div
                            key={zone.id}
                            className={`rounded-lg border transition-all ${
                                editingId === zone.id
                                    ? "border-brand-500 bg-brand-50/30 dark:bg-brand-900/10"
                                    : "border-surface-200 dark:border-surface-700 bg-surface-50 dark:bg-surface-800"
                            }`}
                        >
                            <div className="flex items-center gap-2.5 p-2.5">
                                <div
                                    className="w-8 h-8 rounded-md shrink-0 flex items-center justify-center overflow-hidden"
                                    style={{ backgroundColor: zone.color ?? "#6366f1" }}
                                >
                                    {(zone.image_urls?.[0] || zone.image_url) ? (
                                        <img src={zone.image_urls?.[0] ?? zone.image_url!} alt={zone.name} className="w-full h-full object-cover" />
                                    ) : (
                                        <span className="text-white text-[10px] font-bold">
                                            {zone.name.slice(0, 2).toUpperCase()}
                                        </span>
                                    )}
                                </div>

                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-semibold text-surface-900 dark:text-white truncate leading-tight">{zone.name}</p>
                                    <div className="flex items-center gap-1.5 text-[11px] text-surface-500 leading-tight">
                                        <span>{t.tables[`zone${zone.type?.charAt(0).toUpperCase()}${zone.type?.slice(1)}` as keyof typeof t.tables] ?? zone.type}</span>
                                        {zone.capacity > 0 && <span>· {zone.capacity}p</span>}
                                        {(zone.image_urls?.filter(Boolean).length ?? 0) > 1 && (
                                            <span>· {zone.image_urls!.filter(Boolean).length} photos</span>
                                        )}
                                        {zone.amenities?.length > 0 && <span>· {zone.amenities.length} équip.</span>}
                                    </div>
                                </div>

                                <div className="flex items-center gap-0.5 shrink-0">
                                    <button
                                        onClick={() => editingId === zone.id ? resetForm() : fillForEdit(zone)}
                                        className="p-1.5 text-surface-400 hover:text-brand-500 hover:bg-brand-50 dark:hover:bg-brand-900/20 rounded-md transition-colors"
                                    >
                                        {editingId === zone.id ? <X size={13} /> : <Edit3 size={13} />}
                                    </button>
                                    <button
                                        onClick={() => handleDelete(zone.id)}
                                        className="p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-md transition-colors"
                                    >
                                        <Trash2 size={13} />
                                    </button>
                                </div>
                            </div>

                            {zone.amenities?.length > 0 && (
                                <div className="px-2.5 pb-2 flex flex-wrap gap-1">
                                    {zone.amenities.map((a) => {
                                        const opt = AMENITY_OPTIONS.find((o) => o.value === a);
                                        return (
                                            <span key={a} className="text-[10px] px-1.5 py-0.5 bg-surface-100 dark:bg-surface-700 rounded-full text-surface-600 dark:text-surface-300">
                                                {opt?.icon} {opt ? t.tables[opt.labelKey as keyof typeof t.tables] : a}
                                            </span>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    ))
                )}
            </div>

            {/* Add/Edit zone form */}
            <div className="border-t border-surface-200 dark:border-surface-700 pt-4 space-y-3">
                <h4 className="text-sm font-bold text-surface-700 dark:text-surface-300">
                    {editingId ? t.tables.editZone : t.tables.addZone}
                </h4>

                {/* Row 1: Name + Type */}
                <div className="grid grid-cols-2 gap-2.5">
                    <Input
                        placeholder={t.tables.zoneNamePlaceholder}
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                    />
                    <Select
                        value={type}
                        onChange={(e) => setType(e.target.value)}
                        options={ZONE_TYPES.map((zt) => ({
                            value: zt.value,
                            label: t.tables[zt.labelKey as keyof typeof t.tables] ?? zt.value,
                        }))}
                    />
                </div>

                {/* Row 2: Images (up to 5) */}
                <div>
                    <div className="flex items-center justify-between mb-1.5">
                        <p className="text-xs font-medium text-surface-600 dark:text-surface-400">
                            Photos ({imageUrls.filter(Boolean).length}/5)
                        </p>
                        {imageUrls.length < 5 && (
                            <button
                                type="button"
                                onClick={() => setImageUrls((prev) => [...prev, ""])}
                                className="text-xs text-brand-500 hover:text-brand-600 flex items-center gap-1 font-medium transition-colors"
                            >
                                <ImagePlus size={12} /> Ajouter
                            </button>
                        )}
                    </div>
                    {imageUrls.length === 0 ? (
                        <button
                            type="button"
                            onClick={() => setImageUrls([""])}
                            className="w-full border-2 border-dashed border-surface-200 dark:border-surface-700 rounded-xl py-2.5 text-xs text-surface-400 hover:border-brand-300 hover:text-brand-500 transition-colors flex items-center justify-center gap-1.5"
                        >
                            <ImagePlus size={13} /> Ajouter une photo (optionnel)
                        </button>
                    ) : (
                        <div className="space-y-2">
                            {imageUrls.map((url, idx) => (
                                <div key={idx} className="flex items-center gap-2">
                                    <Input
                                        placeholder={`URL photo ${idx + 1}`}
                                        value={url}
                                        onChange={(e) => {
                                            const updated = [...imageUrls];
                                            updated[idx] = e.target.value;
                                            setImageUrls(updated);
                                        }}
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setImageUrls((prev) => prev.filter((_, i) => i !== idx))}
                                        className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors shrink-0"
                                    >
                                        <X size={13} />
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Row 3: Color + Capacity + Min party (3-col) */}
                <div className="grid grid-cols-[1fr_auto_auto] gap-2.5 items-end">
                    <div>
                        <p className="text-xs font-medium text-surface-600 dark:text-surface-400 mb-1.5">{t.tables.zoneColor}</p>
                        <div className="flex flex-wrap gap-2 py-1">
                            {ZONE_COLORS.map((c) => (
                                <button
                                    key={c}
                                    type="button"
                                    onClick={() => setColor(c)}
                                    className="w-7 h-7 rounded-lg transition-transform hover:scale-110 focus:outline-none"
                                    style={{
                                        backgroundColor: c,
                                        boxShadow: color === c ? `0 0 0 2px white, 0 0 0 4px ${c}` : undefined,
                                        transform: color === c ? "scale(1.15)" : undefined,
                                    }}
                                />
                            ))}
                        </div>
                    </div>
                    <Input
                        label={t.tables.zoneCapacity}
                        type="number"
                        min={0}
                        value={capacity}
                        onChange={(e) => setCapacity(e.target.value)}
                        className="w-24"
                    />
                    <Input
                        label={t.tables.zoneMinParty}
                        type="number"
                        min={1}
                        value={minPartySize}
                        onChange={(e) => setMinPartySize(e.target.value)}
                        className="w-24"
                    />
                </div>

                {/* Row 4: Amenities */}
                <div>
                    <p className="text-xs font-medium text-surface-600 dark:text-surface-400 mb-1.5">{t.tables.zoneAmenities}</p>
                    <div className="grid grid-cols-4 gap-1.5">
                        {AMENITY_OPTIONS.map((opt) => (
                            <button
                                key={opt.value}
                                onClick={() => toggleAmenity(opt.value)}
                                className={`text-xs px-2 py-1.5 rounded-lg border transition-all font-medium text-center ${
                                    amenities.includes(opt.value)
                                        ? "bg-brand-500 text-white border-brand-500"
                                        : "bg-surface-50 dark:bg-surface-800 text-surface-600 dark:text-surface-300 border-surface-200 dark:border-surface-700 hover:border-brand-300"
                                }`}
                            >
                                <span className="block">{opt.icon}</span>
                                <span className="block truncate text-[10px]">{t.tables[opt.labelKey as keyof typeof t.tables] ?? opt.value}</span>
                            </button>
                        ))}
                    </div>
                </div>

                {/* Row 5: Pricing note */}
                <Input
                    label={t.tables.zonePricingNote}
                    placeholder="Ex: Supplément VIP 2000 FCFA"
                    value={pricingNote}
                    onChange={(e) => setPricingNote(e.target.value)}
                />
            </div>

            <ModalFooter>
                <Button variant="outline" onClick={() => { resetForm(); onClose(); }}>{t.common.close}</Button>
                <Button leftIcon={editingId ? <Check size={16} /> : <Plus size={16} />} onClick={handleSubmit} isLoading={loading}>
                    {editingId ? t.common.save : t.tables.addZone}
                </Button>
            </ModalFooter>
        </Modal>
    );
}
