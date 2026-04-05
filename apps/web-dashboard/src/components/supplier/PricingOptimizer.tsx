"use client";

import { useState } from "react";
import { usePriceSuggestions, formatFCFA, formatPercent } from "./hooks";
import { TrendingUp, Check, AlertCircle } from "lucide-react";

interface PricingOptimizerProps {
  supplierId: string;
  onPriceUpdate?: (productId: string, newPrice: number) => void;
}

export function PricingOptimizer({ supplierId, onPriceUpdate }: PricingOptimizerProps) {
  const [targetMargin, setTargetMargin] = useState(30);
  const { suggestions, isLoading } = usePriceSuggestions(supplierId, targetMargin);
  const [applying, setApplying] = useState(false);
  const [appliedIds, setAppliedIds] = useState<Set<string>>(new Set());

  const handleApplyPrice = async (productId: string, newPrice: number) => {
    setApplying(true);
    try {
      const res = await fetch("/api/supplier/apply-price-change", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          supplierId,
          products: [{ productId, newPrice }],
        }),
      });

      if (res.ok) {
        setAppliedIds((prev) => new Set([...prev, productId]));
        onPriceUpdate?.(productId, newPrice);
      }
    } catch (error) {
      console.error("Error applying price:", error);
    } finally {
      setApplying(false);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-2">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="h-16 bg-surface-800 rounded-lg animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3 mb-4">
        <label className="text-sm text-surface-300">Marge cible:</label>
        <input
          type="number"
          min="10"
          max="50"
          value={targetMargin}
          onChange={(e) => setTargetMargin(parseInt(e.target.value))}
          className="w-16 px-2 py-1 bg-surface-800 border border-surface-600 rounded text-sm text-surface-100"
        />
        <span className="text-sm text-surface-500">%</span>
      </div>

      {suggestions.length === 0 ? (
        <div className="text-center py-8 text-surface-400 text-sm">
          Prix déjà optimisés ✓
        </div>
      ) : (
        <div className="space-y-2">
          {suggestions.map((suggestion) => (
            <div
              key={suggestion.productId}
              className="border border-surface-700 rounded-lg p-3 flex items-center justify-between hover:bg-surface-800/50 transition"
            >
              <div className="flex-1">
                <p className="font-medium text-surface-100 text-sm">{suggestion.productName}</p>
                <div className="flex gap-4 mt-1 text-xs">
                  <span className="text-surface-500">
                    Actuel: <span className="font-mono text-blue-400">{formatFCFA(suggestion.currentPrice)}</span>
                  </span>
                  <span className="text-surface-500">
                    Suggéré: <span className="font-mono text-emerald-400">{formatFCFA(suggestion.suggestedPrice)}</span>
                  </span>
                  <span className="text-surface-500">
                    Marge: <span className="font-mono text-orange-400">{suggestion.estimatedMargin}%</span>
                  </span>
                </div>
              </div>

              <button
                onClick={() => handleApplyPrice(suggestion.productId, suggestion.suggestedPrice)}
                disabled={applying || appliedIds.has(suggestion.productId)}
                className={`ml-3 px-3 py-1 rounded text-xs font-medium transition ${
                  appliedIds.has(suggestion.productId)
                    ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/50"
                    : "bg-blue-500/20 text-blue-400 border border-blue-500/50 hover:bg-blue-500/30"
                }`}
              >
                {appliedIds.has(suggestion.productId) ? (
                  <>
                    <Check size={14} className="inline mr-1" />
                    Appliqué
                  </>
                ) : (
                  "Appliquer"
                )}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
