"use client";

import { useMarketIntelligence, formatFCFA, formatPercent } from "./hooks";
import { TrendingUp, TrendingDown, BarChart3 } from "lucide-react";

interface MarketIntelligenceProps {
  supplierId: string;
}

export function MarketIntelligence({ supplierId }: MarketIntelligenceProps) {
  const { intelligence, isLoading } = useMarketIntelligence(supplierId);

  if (isLoading) {
    return (
      <div className="space-y-2">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="h-24 bg-surface-800 rounded-lg animate-pulse" />
        ))}
      </div>
    );
  }

  if (intelligence.length === 0) {
    return <div className="text-center py-8 text-surface-400 text-sm">Pas de données marché</div>;
  }

  return (
    <div className="space-y-4">
      {intelligence.map((intel) => {
        const priceDiff = intel.yourAvgPrice - intel.marketAvgPrice;
        const positionColor =
          intel.pricePosition === "premium"
            ? "text-red-400"
            : intel.pricePosition === "budget"
              ? "text-blue-400"
              : "text-emerald-400";

        const positionLabel =
          intel.pricePosition === "premium" ? "Premium" : intel.pricePosition === "budget" ? "Budget" : "Compétitif";

        return (
          <div key={intel.categoryName} className="border border-surface-700 rounded-lg p-4">
            <div className="flex items-start justify-between mb-3">
              <div>
                <p className="font-medium text-surface-100 flex items-center gap-2">
                  <BarChart3 size={18} className="text-blue-400" />
                  {intel.categoryName}
                </p>
              </div>
              <span className={`px-2 py-1 rounded text-xs font-medium ${positionColor}`}>
                {positionLabel}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3 mb-3">
              <div>
                <p className="text-xs text-surface-500 mb-1">Votre prix moyen</p>
                <p className="font-mono font-bold text-blue-400">{formatFCFA(intel.yourAvgPrice)}</p>
              </div>
              <div>
                <p className="text-xs text-surface-500 mb-1">Prix marché</p>
                <p className="font-mono font-bold text-surface-300">{formatFCFA(intel.marketAvgPrice)}</p>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2 mb-3 text-xs">
              <div className="bg-surface-800/50 rounded p-2">
                <p className="text-surface-500 mb-1">Écart prix</p>
                <p className={`font-mono font-bold ${priceDiff > 0 ? "text-red-400" : "text-emerald-400"}`}>
                  {priceDiff > 0 ? "+" : ""}{formatFCFA(priceDiff)}
                </p>
              </div>
              <div className="bg-surface-800/50 rounded p-2">
                <p className="text-surface-500 mb-1">Volume gap</p>
                <p className="font-mono font-bold text-orange-400">+{intel.volumeGap} unités</p>
              </div>
              <div className="bg-surface-800/50 rounded p-2">
                <p className="text-surface-500 mb-1">Croissance</p>
                <p className="font-mono font-bold text-emerald-400">+{formatPercent(intel.growthTrend)}</p>
              </div>
            </div>

            <div className="bg-blue-500/10 border border-blue-500/25 rounded p-2">
              <p className="text-xs text-blue-300">💡 {intel.recommendation}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
