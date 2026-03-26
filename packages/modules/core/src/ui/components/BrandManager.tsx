"use client";

import { useState, useEffect, useCallback } from "react";
import { Button, Card, Badge, Modal, Spinner, EmptyState } from "@kbouffe/module-core/ui";
import { authFetch } from "@kbouffe/module-core/ui";

const CUISINE_TYPES = [
    { value: "africain",        label: "Africain" },
    { value: "camerounais",     label: "Camerounais" },
    { value: "grillades",       label: "Grillades" },
    { value: "fast_food",       label: "Fast Food" },
    { value: "international",   label: "International" },
    { value: "pâtisserie",      label: "Pâtisserie" },
] as const;

interface Brand {
    id: string;
    brand_name: string;
    cuisine_type: string;
    description?: string | null;
    licence_sanitaire?: string | null;
    status: "active" | "inactive";
    logo_url?: string | null;
}

interface BrandManagerProps {
    restaurantId: string;
}

export function BrandManager({ restaurantId }: BrandManagerProps) {
    const [brands, setBrands] = useState<Brand[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [showAddForm, setShowAddForm] = useState(false);
    const [deleteTarget, setDeleteTarget] = useState<Brand | null>(null);
    const [deleting, setDeleting] = useState(false);

    const fetchBrands = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const res = await authFetch(`/api/restaurant/brands`);
            if (!res.ok) throw new Error("Erreur lors du chargement des marques.");
            const data = await res.json() as { brands: Brand[] };
            setBrands(data.brands ?? []);
        } catch (err) {
            setError(err instanceof Error ? err.message : "Erreur inconnue.");
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { fetchBrands(); }, [fetchBrands]);

    const handleDeactivate = async () => {
        if (!deleteTarget) return;
        setDeleting(true);
        try {
            await authFetch(`/api/restaurant/brands/${deleteTarget.id}`, { method: "DELETE" });
            setDeleteTarget(null);
            fetchBrands();
        } catch {
            // silently refetch
        } finally {
            setDeleting(false);
        }
    };

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-surface-900 dark:text-white">Gestion des marques</h2>
                <Button size="sm" onClick={() => setShowAddForm(true)}>
                    + Ajouter une marque
                </Button>
            </div>

            {loading && <div className="flex justify-center py-10"><Spinner /></div>}

            {error && !loading && (
                <div className="rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 p-4 text-sm text-red-700 dark:text-red-400">
                    {error}
                </div>
            )}

            {!loading && brands.length === 0 && (
                <EmptyState
                    title="Aucune marque"
                    description="Ajoutez votre première marque pour commencer à opérer en dark kitchen."
                />
            )}

            {!loading && brands.length > 0 && (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {brands.map((brand) => (
                        <Card key={brand.id} className="p-4 space-y-3">
                            <div className="flex items-start justify-between gap-2">
                                <div className="flex items-center gap-3">
                                    {brand.logo_url ? (
                                        <img src={brand.logo_url} alt={brand.brand_name} className="w-10 h-10 rounded-xl object-cover" />
                                    ) : (
                                        <div className="w-10 h-10 rounded-xl bg-surface-100 dark:bg-surface-700 flex items-center justify-center text-lg">
                                            🍽️
                                        </div>
                                    )}
                                    <div>
                                        <p className="font-semibold text-surface-900 dark:text-white text-sm">{brand.brand_name}</p>
                                        <p className="text-xs text-surface-500">{brand.cuisine_type}</p>
                                    </div>
                                </div>
                                <Badge variant={brand.status === "active" ? "success" : "default"}>
                                    {brand.status === "active" ? "Actif" : "Inactif"}
                                </Badge>
                            </div>
                            {brand.description && (
                                <p className="text-xs text-surface-500 dark:text-surface-400 line-clamp-2">{brand.description}</p>
                            )}
                            <Button
                                variant="danger"
                                size="sm"
                                className="w-full"
                                onClick={() => setDeleteTarget(brand)}
                            >
                                Désactiver la marque
                            </Button>
                        </Card>
                    ))}
                </div>
            )}

            {showAddForm && (
                <AddBrandModal
                    restaurantId={restaurantId}
                    onClose={() => setShowAddForm(false)}
                    onSuccess={() => { setShowAddForm(false); fetchBrands(); }}
                />
            )}

            {deleteTarget && (
                <Modal isOpen onClose={() => setDeleteTarget(null)} title="Désactiver la marque">
                    <div className="space-y-4 p-2">
                        <p className="text-sm text-surface-700 dark:text-surface-300">
                            Êtes-vous sûr de vouloir désactiver la marque <strong>{deleteTarget.brand_name}</strong> ?
                            Cette action peut être annulée en contactant le support.
                        </p>
                        <div className="flex gap-3">
                            <Button variant="outline" className="flex-1" onClick={() => setDeleteTarget(null)} disabled={deleting}>
                                Annuler
                            </Button>
                            <Button variant="danger" className="flex-1" onClick={handleDeactivate} isLoading={deleting}>
                                Désactiver
                            </Button>
                        </div>
                    </div>
                </Modal>
            )}
        </div>
    );
}

interface AddBrandModalProps {
    restaurantId: string;
    onClose: () => void;
    onSuccess: () => void;
}

function AddBrandModal({ onClose, onSuccess }: AddBrandModalProps) {
    const [brandName, setBrandName] = useState("");
    const [cuisineType, setCuisineType] = useState(CUISINE_TYPES[0].value);
    const [description, setDescription] = useState("");
    const [licenceSanitaire, setLicenceSanitaire] = useState("");
    const [legalDeclared, setLegalDeclared] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!legalDeclared) return;
        setSubmitting(true);
        setError(null);
        try {
            const res = await authFetch("/api/restaurant/brands", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    brand_name: brandName,
                    cuisine_type: cuisineType,
                    description: description || undefined,
                    licence_sanitaire: licenceSanitaire || undefined,
                }),
            });
            if (!res.ok) {
                const data = await res.json() as { error?: string };
                throw new Error(data.error ?? "Erreur lors de la création.");
            }
            onSuccess();
        } catch (err) {
            setError(err instanceof Error ? err.message : "Erreur inconnue.");
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <Modal isOpen onClose={onClose} title="Ajouter une marque">
            <form onSubmit={handleSubmit} className="space-y-4 p-2">
                <div className="space-y-1.5">
                    <label className="block text-sm font-medium text-surface-700 dark:text-surface-300">
                        Nom de la marque <span className="text-red-500">*</span>
                    </label>
                    <input
                        value={brandName}
                        onChange={(e) => setBrandName(e.target.value)}
                        placeholder="Ex: BurgerXpress"
                        required
                        className="w-full rounded-xl border border-surface-200 dark:border-surface-700 bg-white dark:bg-surface-900 text-surface-900 dark:text-white px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                    />
                </div>

                <div className="space-y-1.5">
                    <label className="block text-sm font-medium text-surface-700 dark:text-surface-300">
                        Type de cuisine <span className="text-red-500">*</span>
                    </label>
                    <select
                        value={cuisineType}
                        onChange={(e) => setCuisineType(e.target.value)}
                        className="w-full rounded-xl border border-surface-200 dark:border-surface-700 bg-white dark:bg-surface-900 text-surface-900 dark:text-white px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                    >
                        {CUISINE_TYPES.map((c) => (
                            <option key={c.value} value={c.value}>{c.label}</option>
                        ))}
                    </select>
                </div>

                <div className="space-y-1.5">
                    <label className="block text-sm font-medium text-surface-700 dark:text-surface-300">
                        Description <span className="text-surface-400 font-normal">(optionnelle)</span>
                    </label>
                    <textarea
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        rows={2}
                        className="w-full rounded-xl border border-surface-200 dark:border-surface-700 bg-white dark:bg-surface-900 text-surface-900 dark:text-white px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 resize-none"
                    />
                </div>

                <div className="space-y-1.5">
                    <label className="block text-sm font-medium text-surface-700 dark:text-surface-300">
                        Licence Sanitaire <span className="text-surface-400 font-normal">(optionnelle)</span>
                    </label>
                    <input
                        value={licenceSanitaire}
                        onChange={(e) => setLicenceSanitaire(e.target.value)}
                        placeholder="Numéro MINSANTE"
                        className="w-full rounded-xl border border-surface-200 dark:border-surface-700 bg-white dark:bg-surface-900 text-surface-900 dark:text-white px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                    />
                </div>

                {/* Legal declaration checkbox */}
                <div className="rounded-xl border border-orange-200 dark:border-orange-700 bg-orange-50 dark:bg-orange-900/20 p-4">
                    <label className="flex items-start gap-3 cursor-pointer">
                        <input
                            type="checkbox"
                            checked={legalDeclared}
                            onChange={(e) => setLegalDeclared(e.target.checked)}
                            className="mt-0.5 h-4 w-4 rounded border-surface-300 text-brand-500 focus:ring-brand-500 shrink-0"
                        />
                        <span className="text-xs text-surface-700 dark:text-surface-300 leading-relaxed">
                            Je certifie posséder toutes les licences et autorisations légales (Registre du Commerce, NIF, Licence Sanitaire) pour opérer la marque{" "}
                            <strong>{brandName || "[nom de la marque]"}</strong> depuis cet établissement. Je reconnais que KBouffe est un fournisseur de logiciel et n'assume aucune responsabilité relative à mes obligations légales.{" "}
                            <span className="font-semibold">(Déclaration liante)</span>
                        </span>
                    </label>
                </div>

                {error && (
                    <div className="rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 p-3 text-sm text-red-700 dark:text-red-400">
                        {error}
                    </div>
                )}

                <div className="flex gap-3">
                    <Button type="button" variant="outline" className="flex-1" onClick={onClose} disabled={submitting}>
                        Annuler
                    </Button>
                    <Button type="submit" className="flex-1" isLoading={submitting} disabled={!legalDeclared || !brandName}>
                        Créer la marque
                    </Button>
                </div>
            </form>
        </Modal>
    );
}
