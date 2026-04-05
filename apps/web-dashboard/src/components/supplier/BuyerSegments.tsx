"use client";

import { useSupplierBuyers, formatFCFA, getChurnRiskColor, getChurnRiskBg, formatPercent } from "./hooks";
import { AlertTriangle, TrendingDown, User } from "lucide-react";

interface BuyerSegmentsProps {
  supplierId: string;
}

export function BuyerSegments({ supplierId }: BuyerSegmentsProps) {
  const { buyers, isLoading } = useSupplierBuyers(supplierId);

  if (isLoading) {
    return (
      <div className="space-y-2">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="h-16 bg-surface-800 rounded-lg animate-pulse" />
        ))}
      </div>
    );
  }

  if (!buyers || buyers.length === 0) {
    return <div className="text-surface-400 text-center py-8">Aucun client</div>;
  }

  return (
    <div className="space-y-3">
      {buyers.slice(0, 10).map((buyer) => (
        <div
          key={buyer.id}
          className={`border rounded-lg p-4 backdrop-blur-sm ${getChurnRiskBg(buyer.churnRisk)}`}
        >
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-center gap-3 flex-1">
              <div className="w-10 h-10 rounded-full bg-surface-700 flex items-center justify-center">
                <User size={18} className="text-surface-400" />
              </div>
              <div className="flex-1">
                <p className="font-medium text-surface-100">{buyer.name}</p>
                <p className="text-xs text-surface-500">{buyer.totalOrders} commandes</p>
              </div>
            </div>
            {buyer.churnRisk === "high" && (
              <AlertTriangle size={18} className="text-red-400 shrink-0" />
            )}
          </div>

          <div className="grid grid-cols-3 gap-3 text-sm">
            <div>
              <p className="text-xs text-surface-500 mb-1">CA Cumulé</p>
              <p className="font-mono font-bold text-emerald-400">{formatFCFA(buyer.ltv)}</p>
            </div>
            <div>
              <p className="text-xs text-surface-500 mb-1">Fidélité</p>
              <p className="font-mono font-bold text-blue-400">{formatPercent(buyer.repeatRate)}</p>
            </div>
            <div>
              <p className="text-xs text-surface-500 mb-1">Risque Churn</p>
              <p className={`font-mono font-bold ${getChurnRiskColor(buyer.churnRisk)}`}>
                {buyer.churnRisk === "low" ? "Bas" : buyer.churnRisk === "medium" ? "Moyen" : "Haut"}
              </p>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
