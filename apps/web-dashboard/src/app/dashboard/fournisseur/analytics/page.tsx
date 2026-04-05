"use client";

import { useState } from "react";
import { useSupplier } from "../SupplierContext";
import { SupplierOverview } from "@/components/supplier/SupplierOverview";
import { ProductAnalytics } from "@/components/supplier/ProductAnalytics";
import { BuyerSegments } from "@/components/supplier/BuyerSegments";
import { CategoryPerformance } from "@/components/supplier/CategoryPerformance";
import { SalesVelocity } from "@/components/supplier/SalesVelocity";
import { BarChart3, TrendingUp, Users, Package } from "lucide-react";

export default function SupplierAnalyticsPage() {
  const { supplierId } = useSupplier();
  const [period, setPeriod] = useState<"daily" | "weekly" | "monthly">("daily");

  if (!supplierId) {
    return <div className="text-center py-16 text-surface-400">Fournisseur non identifié</div>;
  }

  return (
    <div className="space-y-8">
      {/* ── Header ──────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-surface-100 flex items-center gap-2">
            <BarChart3 size={32} className="text-blue-400" />
            Analytics Fournisseur
          </h1>
          <p className="text-surface-400 text-sm mt-1">Derniers 30 jours</p>
        </div>
      </div>

      {/* ── KPI Cards ───────────────────────────────────────────────────── */}
      <section>
        <h2 className="text-lg font-semibold text-surface-200 mb-4">Aperçu KPIs</h2>
        <SupplierOverview supplierId={supplierId} />
      </section>

      {/* ── Sales Velocity ──────────────────────────────────────────────── */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-surface-200 flex items-center gap-2">
            <TrendingUp size={20} className="text-orange-400" />
            Tendance des Ventes
          </h2>
          <div className="flex gap-2">
            {(["daily", "weekly", "monthly"] as const).map((p) => (
              <button
                key={p}
                onClick={() => setPeriod(p)}
                className={`px-3 py-1 rounded text-xs font-medium transition ${
                  period === p
                    ? "bg-blue-500/20 text-blue-400 border border-blue-500/50"
                    : "bg-surface-800 text-surface-400 border border-surface-700 hover:border-surface-600"
                }`}
              >
                {p === "daily" ? "Jour" : p === "weekly" ? "Semaine" : "Mois"}
              </button>
            ))}
          </div>
        </div>
        <div className="border border-surface-700 rounded-lg p-4">
          <SalesVelocity supplierId={supplierId} period={period} />
        </div>
      </section>

      {/* ── Product Analytics ───────────────────────────────────────────── */}
      <section>
        <h2 className="text-lg font-semibold text-surface-200 mb-4 flex items-center gap-2">
          <Package size={20} className="text-emerald-400" />
          Performance Produits
        </h2>
        <div className="border border-surface-700 rounded-lg p-4">
          <ProductAnalytics supplierId={supplierId} />
        </div>
      </section>

      {/* ── Two Column Layout: Category & Buyers ────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* ── Category Performance ────────────────────────────────────── */}
        <section>
          <h2 className="text-lg font-semibold text-surface-200 mb-4 flex items-center gap-2">
            <BarChart3 size={20} className="text-blue-400" />
            Catégories
          </h2>
          <div className="border border-surface-700 rounded-lg p-4">
            <CategoryPerformance supplierId={supplierId} />
          </div>
        </section>

        {/* ── Buyer Segments ──────────────────────────────────────────── */}
        <section>
          <h2 className="text-lg font-semibold text-surface-200 mb-4 flex items-center gap-2">
            <Users size={20} className="text-purple-400" />
            Segments Clients
          </h2>
          <div className="border border-surface-700 rounded-lg p-4">
            <BuyerSegments supplierId={supplierId} />
          </div>
        </section>
      </div>
    </div>
  );
}
