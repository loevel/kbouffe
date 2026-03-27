"use client";

import { useState } from "react";
import { Leaf, Search, MapPin, Package } from "lucide-react";
import { Card, Button, Input, EmptyState, useLocale } from "@kbouffe/module-core/ui";
import { useSuppliers } from "../hooks/use-suppliers";
import { SupplierProfile } from "./SupplierProfile";
import type {
  SupplierType,
  SupplierProductCategory,
  CameroonRegion,
} from "../lib/types";
import { CAMEROON_REGIONS } from "../lib/types";

// ── Constants ─────────────────────────────────────────────────────────────

const CATEGORIES: { value: SupplierProductCategory | ""; label: string }[] = [
  { value: "", label: "Toutes les catégories" },
  { value: "legumes", label: "🥦 Légumes" },
  { value: "fruits", label: "🍊 Fruits" },
  { value: "cereales", label: "🌾 Céréales" },
  { value: "viande", label: "🥩 Viande" },
  { value: "poisson", label: "🐟 Poisson" },
  { value: "produits_laitiers", label: "🥛 Produits laitiers" },
  { value: "epices", label: "🌶️ Épices" },
  { value: "huiles", label: "🫙 Huiles" },
  { value: "condiments", label: "🧂 Condiments" },
  { value: "autres", label: "📦 Autres" },
];

const SUPPLIER_TYPES: { value: SupplierType | ""; label: string }[] = [
  { value: "", label: "Tous les types" },
  { value: "individual_farmer", label: "🌱 Agriculteur" },
  { value: "cooperative", label: "🤝 Coopérative" },
  { value: "wholesaler", label: "🏪 Grossiste" },
];

const TYPE_LABELS: Record<SupplierType, string> = {
  individual_farmer: "🌱 Agriculteur",
  cooperative: "🤝 Coopérative",
  wholesaler: "🏪 Grossiste",
};

const TYPE_COLORS: Record<SupplierType, string> = {
  individual_farmer: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
  cooperative: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  wholesaler: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400",
};

// ── Skeleton ──────────────────────────────────────────────────────────────

function SupplierCardSkeleton() {
  return (
    <div className="rounded-xl border border-surface-200 dark:border-surface-800 p-4 animate-pulse">
      <div className="flex items-start gap-3 mb-3">
        <div className="w-12 h-12 rounded-lg bg-surface-200 dark:bg-surface-700 shrink-0" />
        <div className="flex-1 space-y-2">
          <div className="h-4 bg-surface-200 dark:bg-surface-700 rounded w-3/4" />
          <div className="h-3 bg-surface-200 dark:bg-surface-700 rounded w-1/2" />
        </div>
      </div>
      <div className="space-y-2">
        <div className="h-3 bg-surface-200 dark:bg-surface-700 rounded w-full" />
        <div className="h-3 bg-surface-200 dark:bg-surface-700 rounded w-2/3" />
      </div>
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────────────────

export function SupplierDirectory() {
  const { t } = useLocale();
  const [search, setSearch] = useState("");
  const [region, setRegion] = useState<CameroonRegion | "">("");
  const [category, setCategory] = useState<SupplierProductCategory | "">("");
  const [type, setType] = useState<SupplierType | "">("");
  const [selectedSupplierId, setSelectedSupplierId] = useState<string | null>(null);

  const { suppliers, isLoading } = useSuppliers({
    region: region || undefined,
    category: category || undefined,
    type: type || undefined,
  });

  const filtered = search.trim()
    ? suppliers.filter(
        (s) =>
          s.name.toLowerCase().includes(search.toLowerCase()) ||
          s.locality.toLowerCase().includes(search.toLowerCase())
      )
    : suppliers;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-xl font-semibold text-surface-900 dark:text-white">
          Centrale d'Achat — Fournisseurs Agricoles
        </h2>
        <p className="text-sm text-surface-500 mt-1">
          Approvisionnez-vous directement auprès de producteurs locaux certifiés
        </p>
      </div>

      {/* Filter bar */}
      <Card padding="none">
        <div className="p-4 flex flex-wrap items-center gap-3">
          <div className="flex-1 min-w-[200px]">
            <Input
              placeholder="Rechercher un fournisseur ou localité..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              leftIcon={<Search size={16} />}
            />
          </div>
          <select
            className="h-10 px-3 rounded-lg border border-surface-200 dark:border-surface-700 bg-white dark:bg-surface-800 text-sm text-surface-900 dark:text-white"
            value={region}
            onChange={(e) => setRegion(e.target.value as CameroonRegion | "")}
          >
            <option value="">Toutes les régions</option>
            {CAMEROON_REGIONS.map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </select>
          <select
            className="h-10 px-3 rounded-lg border border-surface-200 dark:border-surface-700 bg-white dark:bg-surface-800 text-sm text-surface-900 dark:text-white"
            value={category}
            onChange={(e) =>
              setCategory(e.target.value as SupplierProductCategory | "")
            }
          >
            {CATEGORIES.map((c) => (
              <option key={c.value} value={c.value}>
                {c.label}
              </option>
            ))}
          </select>
          <select
            className="h-10 px-3 rounded-lg border border-surface-200 dark:border-surface-700 bg-white dark:bg-surface-800 text-sm text-surface-900 dark:text-white"
            value={type}
            onChange={(e) => setType(e.target.value as SupplierType | "")}
          >
            {SUPPLIER_TYPES.map((t) => (
              <option key={t.value} value={t.value}>
                {t.label}
              </option>
            ))}
          </select>
        </div>
      </Card>

      {/* Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <SupplierCardSkeleton key={i} />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={<Leaf size={32} />}
          title="Aucun fournisseur trouvé"
          description="Modifiez vos filtres ou revenez plus tard pour découvrir de nouveaux fournisseurs."
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((supplier) => (
            <button
              key={supplier.id}
              className="text-left rounded-xl border border-surface-200 dark:border-surface-800 p-4 hover:border-primary-400 dark:hover:border-primary-500 hover:shadow-md transition-all bg-white dark:bg-surface-900 group"
              onClick={() => setSelectedSupplierId(supplier.id)}
            >
              {/* Top row: logo + name */}
              <div className="flex items-start gap-3 mb-3">
                <div className="w-12 h-12 rounded-lg bg-surface-100 dark:bg-surface-800 flex items-center justify-center shrink-0 overflow-hidden">
                  {supplier.logo_url ? (
                    <img
                      src={supplier.logo_url}
                      alt={supplier.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span className="text-2xl">
                      {supplier.type === "individual_farmer"
                        ? "🌱"
                        : supplier.type === "cooperative"
                        ? "🤝"
                        : "🏪"}
                    </span>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-surface-900 dark:text-white truncate group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">
                    {supplier.name}
                  </p>
                  <span
                    className={`inline-block text-xs font-medium px-2 py-0.5 rounded-full mt-1 ${TYPE_COLORS[supplier.type]}`}
                  >
                    {TYPE_LABELS[supplier.type]}
                  </span>
                </div>
              </div>

              {/* Location */}
              <div className="flex items-center gap-1.5 text-xs text-surface-500 mb-2">
                <MapPin size={12} />
                <span>
                  {supplier.locality}, {supplier.region}
                </span>
              </div>

              {/* Product count */}
              <div className="flex items-center gap-1.5 text-xs text-surface-500 mb-3">
                <Package size={12} />
                <span>
                  {supplier.product_count ?? 0} produit
                  {(supplier.product_count ?? 0) !== 1 ? "s" : ""} disponible
                  {(supplier.product_count ?? 0) !== 1 ? "s" : ""}
                </span>
              </div>

              {/* Badges */}
              <div className="flex flex-wrap gap-1.5">
                {supplier.minader_cert_url && (
                  <span className="inline-flex items-center gap-1 text-xs bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 px-2 py-0.5 rounded-full font-medium">
                    ✅ Certifié MINADER
                  </span>
                )}
                {supplier.kyc_status === "approved" && (
                  <span className="inline-flex items-center gap-1 text-xs bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 px-2 py-0.5 rounded-full font-medium">
                    ✓ Vérifié
                  </span>
                )}
                {supplier.is_featured && (
                  <span className="inline-flex items-center gap-1 text-xs bg-primary-100 text-primary-700 dark:bg-primary-900/30 dark:text-primary-400 px-2 py-0.5 rounded-full font-medium">
                    ⭐ En vedette
                  </span>
                )}
              </div>
            </button>
          ))}
        </div>
      )}

      {/* Results count */}
      {!isLoading && filtered.length > 0 && (
        <p className="text-sm text-surface-500 text-center">
          {filtered.length} fournisseur{filtered.length !== 1 ? "s" : ""} affiché
          {filtered.length !== 1 ? "s" : ""}
        </p>
      )}

      {/* Profile Modal */}
      {selectedSupplierId && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          onClick={(e) => {
            if (e.target === e.currentTarget) setSelectedSupplierId(null);
          }}
        >
          <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl bg-white dark:bg-surface-900 shadow-2xl">
            <SupplierProfile
              supplierId={selectedSupplierId}
              onClose={() => setSelectedSupplierId(null)}
            />
          </div>
        </div>
      )}
    </div>
  );
}
