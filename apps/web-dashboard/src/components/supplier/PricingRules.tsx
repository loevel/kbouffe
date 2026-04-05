"use client";

import { useState } from "react";
import { usePricingRules, formatFCFA } from "./hooks";
import { Lock, Zap } from "lucide-react";

interface PricingRulesProps {
  supplierId: string;
}

export function PricingRules({ supplierId }: PricingRulesProps) {
  const { rules, isLoading } = usePricingRules(supplierId);
  const [autoApplyIds, setAutoApplyIds] = useState<Set<string>>(new Set());

  const handleToggleAutoApply = (ruleId: string) => {
    setAutoApplyIds((prev) => {
      const next = new Set(prev);
      if (next.has(ruleId)) {
        next.delete(ruleId);
      } else {
        next.add(ruleId);
      }
      return next;
    });
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

  if (rules.length === 0) {
    return <div className="text-center py-8 text-surface-400 text-sm">Pas de règles à appliquer</div>;
  }

  return (
    <div className="space-y-3">
      {rules.map((rule) => (
        <div key={rule.id} className="border border-surface-700 rounded-lg p-4 hover:bg-surface-800/30 transition">
          <div className="flex items-start justify-between mb-3">
            <div className="flex-1">
              <p className="font-medium text-surface-100">{rule.productName}</p>
              <p className="text-xs text-surface-500">Coût: {formatFCFA(rule.costPerUnit)}</p>
            </div>
            <button
              onClick={() => handleToggleAutoApply(rule.id)}
              className={`px-3 py-1 rounded-full text-xs font-medium transition flex items-center gap-1 ${
                autoApplyIds.has(rule.id)
                  ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/50"
                  : "bg-surface-700 text-surface-400 border border-surface-600 hover:bg-surface-600"
              }`}
            >
              <Zap size={14} />
              {autoApplyIds.has(rule.id) ? "Auto ON" : "Auto OFF"}
            </button>
          </div>

          <div className="grid grid-cols-5 gap-2 text-xs mb-3">
            <div>
              <p className="text-surface-500 mb-1">Marge cible</p>
              <p className="font-mono font-bold text-orange-400">{rule.targetMarginPercent}%</p>
            </div>
            <div>
              <p className="text-surface-500 mb-1">Prix min</p>
              <p className="font-mono font-bold text-blue-400">{formatFCFA(rule.minPrice)}</p>
            </div>
            <div>
              <p className="text-surface-500 mb-1">Calculé</p>
              <p className="font-mono font-bold text-emerald-400">{formatFCFA(rule.calculatedPrice)}</p>
            </div>
            <div>
              <p className="text-surface-500 mb-1">Prix max</p>
              <p className="font-mono font-bold text-red-400">{formatFCFA(rule.maxPrice)}</p>
            </div>
            <div>
              <p className="text-surface-500 mb-1">Delta</p>
              <p
                className={`font-mono font-bold ${
                  rule.calculatedPrice > (rule.minPrice * 1.2)
                    ? "text-emerald-400"
                    : "text-orange-400"
                }`}
              >
                +{formatFCFA(Math.max(0, rule.calculatedPrice - rule.minPrice))}
              </p>
            </div>
          </div>

          <p className="text-xs text-surface-400">
            Si coût change, prix sera recalculé automatiquement pour maintenir {rule.targetMarginPercent}% marge
          </p>
        </div>
      ))}
    </div>
  );
}
