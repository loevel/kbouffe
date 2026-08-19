"use client";

import { useState } from "react";
import { usePriceSuggestions, formatFCFA, formatPercent } from "./hooks";
import { TrendingUp, Check, AlertCircle, Info } from "lucide-react";

interface PricingOptimizerProps {
  supplierId: string;
  onPriceUpdate?: (productId: string, newPrice: number) => void;
}

export function PricingOptimizer({ supplierId, onPriceUpdate }: PricingOptimizerProps) {
  const [targetMargin, setTargetMargin] = useState(30);
  const { suggestions, isLoading } = usePriceSuggestions(supplierId, targetMargin);
  const [applying, setApplying] = useState(false);
  const [appliedIds, setAppliedIds] = useState<Set<string>>(new Set());
  const [applyError, setApplyError] = useState<string | null>(null);

  const handleApplyPrice = async (
    productId: string,
    productName: string,
    currentPrice: number,
    newPrice: number
  ) => {
    // Ce bouton change un prix de vente réel à partir d'une marge calculée sur
    // un coût estimé. Une confirmation explicite évite qu'un clic curieux ne
    // rogne durablement la marge du fournisseur.
    const confirmed = window.confirm(
      `Appliquer ${formatFCFA(newPrice)} à « ${productName} » ? Le prix actuel est ${formatFCFA(currentPrice)}.\n\n` +
        `Cette suggestion repose sur un coût de revient estimé, pas sur vos coûts réels. Vérifiez qu'elle vous convient : le changement est immédiat pour les restaurants.`
    );
    if (!confirmed) return;

    setApplying(true);
    setApplyError(null);
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
      } else {
        // Sans ce message, un échec serveur laissait le bouton inchangé : le
        // fournisseur repartait convaincu que son prix avait été modifié.
        setApplyError(`Le prix de « ${productName} » n'a pas pu être modifié. Réessayez.`);
      }
    } catch (error) {
      console.error("Error applying price:", error);
      setApplyError(`Le prix de « ${productName} » n'a pas pu être modifié. Vérifiez votre connexion.`);
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
          onChange={(e) => {
            // Champ vidé → parseInt renvoie NaN, qui se propage dans toutes les
            // suggestions et affiche « NaN FCFA ».
            const parsed = parseInt(e.target.value, 10);
            setTargetMargin(Number.isNaN(parsed) ? 0 : Math.min(50, Math.max(0, parsed)));
          }}
          className="w-16 px-2 py-1 bg-surface-800 border border-surface-600 rounded text-sm text-surface-100"
        />
        <span className="text-sm text-surface-500">%</span>
      </div>

      <div className="flex items-start gap-2 rounded-lg border border-amber-500/25 bg-amber-500/10 px-3 py-2 text-xs text-amber-300">
        <Info size={14} className="shrink-0 mt-0.5" />
        <p>
          Suggestions indicatives : faute de coût de revient saisi, il est approché
          à 60&nbsp;% du prix de vente. Recoupez avec vos coûts réels avant
          d&apos;appliquer un prix.
        </p>
      </div>

      {applyError && (
        <div className="flex items-start gap-2 rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs text-red-300">
          <AlertCircle size={14} className="shrink-0 mt-0.5" />
          <p>{applyError}</p>
        </div>
      )}

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
                onClick={() =>
                  handleApplyPrice(
                    suggestion.productId,
                    suggestion.productName,
                    suggestion.currentPrice,
                    suggestion.suggestedPrice
                  )
                }
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
