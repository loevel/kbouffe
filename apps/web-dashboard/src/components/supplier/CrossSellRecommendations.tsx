"use client";

import { useCrossSellRecommendations, formatPercent } from "./hooks";
import { ShoppingCart, TrendingUp } from "lucide-react";

interface CrossSellRecommendationsProps {
  supplierId: string;
}

export function CrossSellRecommendations({ supplierId }: CrossSellRecommendationsProps) {
  const { recommendations, isLoading } = useCrossSellRecommendations(supplierId);

  if (isLoading) {
    return (
      <div className="space-y-2">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="h-16 bg-surface-800 rounded-lg animate-pulse" />
        ))}
      </div>
    );
  }

  if (recommendations.length === 0) {
    return <div className="text-center py-8 text-surface-400 text-sm">Pas encore de recommandations</div>;
  }

  return (
    <div className="space-y-3">
      {recommendations.map((rec, idx) => (
        <div
          key={idx}
          className="border border-surface-700 rounded-lg p-4 hover:bg-surface-800/30 transition"
        >
          <div className="flex items-center gap-3 mb-3">
            <ShoppingCart size={18} className="text-orange-400" />
            <div className="flex-1">
              <p className="font-medium text-surface-100">{rec.primaryProductName}</p>
              <p className="text-xs text-surface-500">Vendu avec</p>
            </div>
          </div>

          <div className="bg-surface-800/50 rounded p-2 mb-3 ml-6">
            <p className="font-medium text-emerald-400 text-sm">{rec.bundleProductName}</p>
          </div>

          <div className="grid grid-cols-4 gap-3 text-xs ml-6">
            <div>
              <p className="text-surface-500 mb-1">Co-ventes</p>
              <p className="font-mono font-bold text-blue-400">{rec.coSellFrequency}x</p>
            </div>
            <div>
              <p className="text-surface-500 mb-1">Taux</p>
              <p className="font-mono font-bold text-orange-400">{formatPercent(rec.coSellRate)}</p>
            </div>
            <div>
              <p className="text-surface-500 mb-1">Segment</p>
              <p className="font-mono font-bold text-purple-400">{rec.recommendedBuyerSegment}</p>
            </div>
            <div>
              <p className="text-surface-500 mb-1">Marge bundle</p>
              <p className="font-mono font-bold text-emerald-400">{rec.bundleMargin}%</p>
            </div>
          </div>

          <button className="mt-3 w-full px-3 py-2 bg-emerald-500/20 text-emerald-400 border border-emerald-500/50 rounded text-xs font-medium hover:bg-emerald-500/30 transition">
            💡 Créer une promotion bundle
          </button>
        </div>
      ))}
    </div>
  );
}
