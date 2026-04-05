"use client";

import { useSupplier } from "../SupplierContext";
import { MarginDashboard } from "@/components/supplier/MarginDashboard";
import { PricingRules } from "@/components/supplier/PricingRules";
import { CrossSellRecommendations } from "@/components/supplier/CrossSellRecommendations";
import { MarketIntelligence } from "@/components/supplier/MarketIntelligence";
import { TrendingUp, Zap, ShoppingCart, BarChart2, Lightbulb } from "lucide-react";

export default function SupplierProfitabilityPage() {
  const { supplierId } = useSupplier();

  if (!supplierId) {
    return <div className="text-center py-16 text-surface-400">Fournisseur non identifié</div>;
  }

  return (
    <div className="space-y-8">
      {/* ── Header ──────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-surface-100 flex items-center gap-2">
            <TrendingUp size={32} className="text-emerald-400" />
            Profitabilité & Croissance
          </h1>
          <p className="text-surface-400 text-sm mt-1">Optimisez votre stratégie tarifaire et identifiez les opportunités</p>
        </div>
      </div>

      {/* ── Info Banner ─────────────────────────────────────────────────── */}
      <div className="bg-gradient-to-r from-emerald-500/10 to-blue-500/10 border border-emerald-500/25 rounded-lg p-4 flex gap-3">
        <Lightbulb size={20} className="text-emerald-400 shrink-0 mt-0.5" />
        <div className="text-sm">
          <p className="font-medium text-emerald-300 mb-1">💡 Phase 3 — Intelligence d'Affaires</p>
          <p className="text-surface-300 text-xs">
            Analysez la profitabilité par client, découvrez les combinaisons gagnantes, comparez vos prix au marché.
          </p>
        </div>
      </div>

      {/* ── Margin Heatmap ──────────────────────────────────────────────── */}
      <section>
        <h2 className="text-lg font-semibold text-surface-200 mb-4 flex items-center gap-2">
          <BarChart2 size={20} className="text-orange-400" />
          Heatmap Rentabilité (Client × Produit)
        </h2>
        <div className="border border-surface-700 rounded-lg p-4">
          <MarginDashboard supplierId={supplierId} />
        </div>
      </section>

      {/* ── Two Column: Pricing Rules & Cross-sell ──────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* ── Pricing Rules ────────────────────────────────────────────── */}
        <section>
          <h2 className="text-lg font-semibold text-surface-200 mb-4 flex items-center gap-2">
            <Zap size={20} className="text-amber-400" />
            Règles de Tarification
          </h2>
          <div className="border border-surface-700 rounded-lg p-4">
            <PricingRules supplierId={supplierId} />
          </div>
        </section>

        {/* ── Cross-sell ──────────────────────────────────────────────── */}
        <section>
          <h2 className="text-lg font-semibold text-surface-200 mb-4 flex items-center gap-2">
            <ShoppingCart size={20} className="text-purple-400" />
            Opportunités Bundle
          </h2>
          <div className="border border-surface-700 rounded-lg p-4">
            <CrossSellRecommendations supplierId={supplierId} />
          </div>
        </section>
      </div>

      {/* ── Market Intelligence ─────────────────────────────────────────── */}
      <section>
        <h2 className="text-lg font-semibold text-surface-200 mb-4 flex items-center gap-2">
          <TrendingUp size={20} className="text-blue-400" />
          Intelligence Marché
        </h2>
        <div className="border border-surface-700 rounded-lg p-4">
          <MarketIntelligence supplierId={supplierId} />
        </div>
      </section>

      {/* ── Recommendations ─────────────────────────────────────────────── */}
      <div className="space-y-3">
        <h2 className="text-lg font-semibold text-surface-200 flex items-center gap-2">
          <Lightbulb size={20} className="text-yellow-400" />
          Recommandations Actions
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div className="bg-emerald-500/10 border border-emerald-500/25 rounded-lg p-3">
            <p className="font-medium text-emerald-300 text-sm mb-1">✅ Augmentez les marges</p>
            <p className="text-xs text-surface-300">
              Vos produits premium vendent bien. Testez +5% de prix sur les ventes &gt; 50/mois.
            </p>
          </div>
          <div className="bg-blue-500/10 border border-blue-500/25 rounded-lg p-3">
            <p className="font-medium text-blue-300 text-sm mb-1">📦 Créez des bundles</p>
            <p className="text-xs text-surface-300">
              3 combinaisons (C, S, N) se vendent régulièrement ensemble. Proposez-les en bundle.
            </p>
          </div>
          <div className="bg-orange-500/10 border border-orange-500/25 rounded-lg p-3">
            <p className="font-medium text-orange-300 text-sm mb-1">🔄 Optimisez les prix</p>
            <p className="text-xs text-surface-300">
              Votre positionnement est compétitif. Maintenez les marges cibles avec les règles auto.
            </p>
          </div>
          <div className="bg-purple-500/10 border border-purple-500/25 rounded-lg p-3">
            <p className="font-medium text-purple-300 text-sm mb-1">📊 Analysez mensuellement</p>
            <p className="text-xs text-surface-300">
              Le marché change. Vérifiez les prix concurrents et ajustez vos stratégies.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
