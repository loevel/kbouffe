"use client";

import { MapPin, Phone, Mail, X, ShieldCheck, ShieldX, ShieldAlert, Package } from "lucide-react";
import { Button, EmptyState } from "@kbouffe/module-core/ui";
import { useSupplier, useMySupplierProducts } from "../hooks/use-suppliers";
import type { SupplierType, SupplierKycStatus, SupplierProductCategory } from "../lib/types";

// ── Constants ─────────────────────────────────────────────────────────────

const TYPE_LABELS: Record<SupplierType, string> = {
  individual_farmer: "🌱 Agriculteur Individuel",
  cooperative: "🤝 Coopérative",
  wholesaler: "🏪 Grossiste",
};

const TYPE_COLORS: Record<SupplierType, string> = {
  individual_farmer: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
  cooperative: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  wholesaler: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400",
};

const KYC_CONFIG: Record<
  SupplierKycStatus,
  { label: string; color: string; icon: React.ReactNode }
> = {
  approved: {
    label: "Vérifié",
    color: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
    icon: <ShieldCheck size={14} />,
  },
  pending: {
    label: "En attente de vérification",
    color: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
    icon: <ShieldAlert size={14} />,
  },
  rejected: {
    label: "Dossier refusé",
    color: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
    icon: <ShieldX size={14} />,
  },
  suspended: {
    label: "Compte suspendu",
    color: "bg-surface-100 text-surface-500 dark:bg-surface-800 dark:text-surface-400",
    icon: <ShieldX size={14} />,
  },
};

const CATEGORY_EMOJIS: Record<SupplierProductCategory, string> = {
  legumes: "🥦",
  fruits: "🍊",
  cereales: "🌾",
  viande: "🥩",
  poisson: "🐟",
  produits_laitiers: "🥛",
  epices: "🌶️",
  huiles: "🫙",
  condiments: "🧂",
  autres: "📦",
};

const CATEGORY_LABELS: Record<SupplierProductCategory, string> = {
  legumes: "Légumes",
  fruits: "Fruits",
  cereales: "Céréales",
  viande: "Viande",
  poisson: "Poisson",
  produits_laitiers: "Produits laitiers",
  epices: "Épices",
  huiles: "Huiles",
  condiments: "Condiments",
  autres: "Autres",
};

const UNIT_LABELS: Record<string, string> = {
  kg: "kg",
  tonne: "tonne",
  litre: "L",
  caisse: "caisse",
  colis: "colis",
  sac: "sac",
  botte: "botte",
  piece: "pièce",
};

// ── Skeleton ──────────────────────────────────────────────────────────────

function ProfileSkeleton() {
  return (
    <div className="animate-pulse p-6 space-y-6">
      <div className="flex items-start gap-4">
        <div className="w-16 h-16 rounded-xl bg-surface-200 dark:bg-surface-700 shrink-0" />
        <div className="flex-1 space-y-3">
          <div className="h-5 bg-surface-200 dark:bg-surface-700 rounded w-2/3" />
          <div className="h-4 bg-surface-200 dark:bg-surface-700 rounded w-1/3" />
          <div className="h-4 bg-surface-200 dark:bg-surface-700 rounded w-1/2" />
        </div>
      </div>
      <div className="space-y-2">
        <div className="h-4 bg-surface-200 dark:bg-surface-700 rounded w-full" />
        <div className="h-4 bg-surface-200 dark:bg-surface-700 rounded w-4/5" />
      </div>
      <div className="grid grid-cols-2 gap-3">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-28 bg-surface-200 dark:bg-surface-700 rounded-xl" />
        ))}
      </div>
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────────────────

interface SupplierProfileProps {
  supplierId: string;
  onClose?: () => void;
}

export function SupplierProfile({ supplierId, onClose }: SupplierProfileProps) {
  const { supplier, isLoading: supplierLoading } = useSupplier(supplierId);
  const { products, isLoading: productsLoading } =
    useMySupplierProducts(supplierId);

  const isLoading = supplierLoading || productsLoading;

  if (isLoading) {
    return (
      <div className="relative">
        {onClose && (
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-1.5 rounded-lg text-surface-400 hover:text-surface-700 hover:bg-surface-100 dark:hover:bg-surface-800 transition-colors"
          >
            <X size={20} />
          </button>
        )}
        <ProfileSkeleton />
      </div>
    );
  }

  if (!supplier) {
    return (
      <div className="p-6">
        <EmptyState
          title="Fournisseur introuvable"
          description="Ce fournisseur n'existe pas ou a été désactivé."
        />
      </div>
    );
  }

  const kyc = KYC_CONFIG[supplier.kyc_status];

  return (
    <div>
      {/* Header */}
      <div className="p-6 border-b border-surface-100 dark:border-surface-800">
        <div className="flex items-start justify-between gap-4 mb-4">
          <div className="flex items-start gap-4">
            <div className="w-16 h-16 rounded-xl bg-surface-100 dark:bg-surface-800 flex items-center justify-center shrink-0 overflow-hidden">
              {supplier.logo_url ? (
                <img
                  src={supplier.logo_url}
                  alt={supplier.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <span className="text-4xl">
                  {supplier.type === "individual_farmer"
                    ? "🌱"
                    : supplier.type === "cooperative"
                    ? "🤝"
                    : "🏪"}
                </span>
              )}
            </div>
            <div>
              <h2 className="text-xl font-bold text-surface-900 dark:text-white">
                {supplier.name}
              </h2>
              <span
                className={`inline-block text-xs font-medium px-2 py-0.5 rounded-full mt-1 ${TYPE_COLORS[supplier.type]}`}
              >
                {TYPE_LABELS[supplier.type]}
              </span>
              <div className="flex items-center gap-1.5 mt-2">
                <span
                  className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full ${kyc.color}`}
                >
                  {kyc.icon}
                  {kyc.label}
                </span>
                {supplier.minader_cert_url && (
                  <span className="inline-flex items-center gap-1 text-xs bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 px-2 py-0.5 rounded-full font-medium">
                    ✅ Certifié MINADER
                  </span>
                )}
              </div>
            </div>
          </div>
          {onClose && (
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-surface-400 hover:text-surface-700 hover:bg-surface-100 dark:hover:bg-surface-800 transition-colors shrink-0"
            >
              <X size={20} />
            </button>
          )}
        </div>

        {/* Contact info */}
        <div className="flex flex-wrap gap-4 text-sm text-surface-600 dark:text-surface-400 mb-3">
          <div className="flex items-center gap-1.5">
            <MapPin size={14} />
            <span>
              {supplier.locality}, {supplier.region}
            </span>
          </div>
          {supplier.phone && (
            <div className="flex items-center gap-1.5">
              <Phone size={14} />
              <span>{supplier.phone}</span>
            </div>
          )}
          {supplier.email && (
            <div className="flex items-center gap-1.5">
              <Mail size={14} />
              <span>{supplier.email}</span>
            </div>
          )}
        </div>

        {/* Description */}
        {supplier.description && (
          <p className="text-sm text-surface-600 dark:text-surface-400 leading-relaxed">
            {supplier.description}
          </p>
        )}

        {/* Contact CTA */}
        <div className="mt-4">
          <a href={`tel:${supplier.phone}`}>
            <Button leftIcon={<Phone size={16} />}>
              Contacter — {supplier.phone}
            </Button>
          </a>
        </div>
      </div>

      {/* Products */}
      <div className="p-6">
        <h3 className="text-sm font-semibold text-surface-900 dark:text-white mb-4 flex items-center gap-2">
          <Package size={16} />
          Produits disponibles ({products.length})
        </h3>

        {products.length === 0 ? (
          <EmptyState
            icon={<Package size={28} />}
            title="Aucun produit disponible"
            description="Ce fournisseur n'a pas encore publié de produits."
          />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {products.map((product) => (
              <div
                key={product.id}
                className="rounded-xl border border-surface-200 dark:border-surface-700 p-3 bg-surface-50 dark:bg-surface-800/50"
              >
                <div className="flex items-start justify-between gap-2 mb-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xl">
                      {CATEGORY_EMOJIS[product.category]}
                    </span>
                    <div>
                      <p className="font-medium text-surface-900 dark:text-white text-sm">
                        {product.name}
                      </p>
                      <p className="text-xs text-surface-500">
                        {CATEGORY_LABELS[product.category]}
                      </p>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="font-bold text-surface-900 dark:text-white text-sm">
                      {product.price_per_unit.toLocaleString("fr-CM")} FCFA
                    </p>
                    <p className="text-xs text-surface-500">
                      / {UNIT_LABELS[product.unit] ?? product.unit}
                    </p>
                  </div>
                </div>

                {product.description && (
                  <p className="text-xs text-surface-500 mb-2 line-clamp-2">
                    {product.description}
                  </p>
                )}

                <div className="flex flex-wrap gap-1.5 mt-1">
                  {product.available_quantity !== null && (
                    <span className="text-xs bg-surface-100 dark:bg-surface-700 text-surface-600 dark:text-surface-400 px-1.5 py-0.5 rounded">
                      Stock : {product.available_quantity}{" "}
                      {UNIT_LABELS[product.unit] ?? product.unit}
                    </span>
                  )}
                  {product.min_order_quantity > 1 && (
                    <span className="text-xs bg-surface-100 dark:bg-surface-700 text-surface-600 dark:text-surface-400 px-1.5 py-0.5 rounded">
                      Min. {product.min_order_quantity}{" "}
                      {UNIT_LABELS[product.unit] ?? product.unit}
                    </span>
                  )}
                  {product.is_organic && (
                    <span className="text-xs bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 px-1.5 py-0.5 rounded">
                      🌿 Bio
                    </span>
                  )}
                  {product.is_certified_minader && (
                    <span className="text-xs bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 px-1.5 py-0.5 rounded">
                      ✅ MINADER
                    </span>
                  )}
                  {product.allergens.length > 0 && (
                    <span className="text-xs bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 px-1.5 py-0.5 rounded">
                      ⚠️ Allergènes
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
