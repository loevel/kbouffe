"use client";

import { useDemandForecast, formatFCFA } from "./hooks";
import { AlertTriangle, TrendingDown, Package } from "lucide-react";

interface DemandForecastProps {
  supplierId: string;
}

export function DemandForecastCard({ supplierId }: DemandForecastProps) {
  const { forecast, isLoading } = useDemandForecast(supplierId);

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {[...Array(2)].map((_, i) => (
          <div key={i} className="h-24 bg-surface-800 rounded-lg animate-pulse" />
        ))}
      </div>
    );
  }

  const urgent = forecast.filter((f) => f.reorderUrgency !== "low");

  if (urgent.length === 0) {
    return <div className="text-center py-8 text-surface-400 text-sm">Stocks à jour ✓</div>;
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
      {urgent.slice(0, 4).map((item) => {
        const urgencyColors = {
          high: "border-red-500/50 bg-red-500/10",
          medium: "border-amber-500/50 bg-amber-500/10",
          low: "border-emerald-500/50 bg-emerald-500/10",
        };

        return (
          <div
            key={item.productId}
            className={`border rounded-lg p-4 ${urgencyColors[item.reorderUrgency]}`}
          >
            <div className="flex items-start justify-between mb-3">
              <div>
                <p className="font-medium text-surface-100">{item.productName}</p>
                <p className="text-xs text-surface-500">Stock actuel: {item.currentStock}</p>
              </div>
              {item.reorderUrgency === "high" && (
                <AlertTriangle size={18} className="text-red-400 shrink-0" />
              )}
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs">
              <div>
                <p className="text-surface-500 mb-1">Prévu 30j</p>
                <p className="font-mono font-bold text-blue-400">{item.forecast30d} unités</p>
              </div>
              <div>
                <p className="text-surface-500 mb-1">À commander</p>
                <p className="font-mono font-bold text-orange-400">{item.suggestedReorderQty}</p>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
