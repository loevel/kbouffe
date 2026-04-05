"use client";

import { useState } from "react";
import { useSupplier } from "../SupplierContext";
import { DemandForecastCard } from "@/components/supplier/DemandForecast";
import { PricingOptimizer } from "@/components/supplier/PricingOptimizer";
import { MarginAlerts } from "@/components/supplier/MarginAlerts";
import { COGSTracker } from "@/components/supplier/COGSTracker";
import { Zap, Package, TrendingUp, AlertTriangle, BarChart3 } from "lucide-react";

export default function SupplierAutomationPage() {
  const { supplierId } = useSupplier();
  const [targetMargin, setTargetMargin] = useState(30);

  if (!supplierId) {
    return <div className="text-center py-16 text-surface-400">Fournisseur non identifié</div>;
  }

  return (
    <div className="space-y-8">
      {/* ── Header ──────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-surface-100 flex items-center gap-2">
            <Zap size={32} className="text-amber-400" />
            Automatisation & Prédictions
          </h1>
          <p className="text-surface-400 text-sm mt-1">Optimisez automatiquement votre activité</p>
        </div>
      </div>

      {/* ── Settings ────────────────────────────────────────────────────── */}
      <div className="bg-surface-800/50 border border-surface-700 rounded-lg p-4">
        <div className="flex items-center gap-4">
          <label className="text-sm font-medium text-surface-300">Marge cible globale:</label>
          <div className="flex items-center gap-2">
            <input
              type="range"
              min="10"
              max="50"
              value={targetMargin}
              onChange={(e) => setTargetMargin(parseInt(e.target.value))}
              className="w-32"
            />
            <input
              type="number"
              min="10"
              max="50"
              value={targetMargin}
              onChange={(e) => setTargetMargin(parseInt(e.target.value))}
              className="w-16 px-2 py-1 bg-surface-800 border border-surface-600 rounded text-sm"
            />
            <span className="text-sm text-surface-500">%</span>
          </div>
          <button className="ml-auto px-4 py-2 bg-amber-500/20 text-amber-400 border border-amber-500/50 rounded-lg text-sm font-medium hover:bg-amber-500/30 transition">
            💾 Enregistrer
          </button>
        </div>
      </div>

      {/* ── Critical Alerts ─────────────────────────────────────────────── */}
      <section>
        <h2 className="text-lg font-semibold text-surface-200 mb-4 flex items-center gap-2">
          <AlertTriangle size={20} className="text-red-400" />
          Alertes Marges (Critique)
        </h2>
        <div className="border border-surface-700 rounded-lg p-4">
          <MarginAlerts supplierId={supplierId} targetMargin={targetMargin} />
        </div>
      </section>

      {/* ── Demand Forecast ─────────────────────────────────────────────── */}
      <section>
        <h2 className="text-lg font-semibold text-surface-200 mb-4 flex items-center gap-2">
          <Package size={20} className="text-blue-400" />
          Prévisions Demande (Restock)
        </h2>
        <div className="border border-surface-700 rounded-lg p-4">
          <DemandForecastCard supplierId={supplierId} />
        </div>
      </section>

      {/* ── Pricing Optimizer ───────────────────────────────────────────── */}
      <section>
        <h2 className="text-lg font-semibold text-surface-200 mb-4 flex items-center gap-2">
          <TrendingUp size={20} className="text-emerald-400" />
          Optimisateur de Prix
        </h2>
        <div className="border border-surface-700 rounded-lg p-4">
          <PricingOptimizer supplierId={supplierId} />
        </div>
      </section>

      {/* ── COGS Analysis ───────────────────────────────────────────────── */}
      <section>
        <h2 className="text-lg font-semibold text-surface-200 mb-4 flex items-center gap-2">
          <BarChart3 size={20} className="text-orange-400" />
          Analyse Coûts & Marges
        </h2>
        <div className="border border-surface-700 rounded-lg p-4">
          <COGSTracker supplierId={supplierId} />
        </div>
      </section>

      {/* ── Info Box ────────────────────────────────────────────────────── */}
      <div className="bg-blue-500/10 border border-blue-500/25 rounded-lg p-4 text-sm text-blue-300">
        <p className="font-medium mb-2">💡 Comment ça marche?</p>
        <ul className="list-disc list-inside space-y-1 text-xs">
          <li>Les prévisions analysent 30 jours d'historique pour estimer la demande future</li>
          <li>L'optimisateur de prix suggère des prix basés sur votre marge cible</li>
          <li>Les alertes marges vous préviennent si la profitabilité baisse</li>
          <li>L'analyse COGS montre le coût réel et la rentabilité par produit</li>
        </ul>
      </div>
    </div>
  );
}
