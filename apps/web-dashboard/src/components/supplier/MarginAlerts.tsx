"use client";

import { useMarginAlerts, formatPercent } from "./hooks";
import { AlertTriangle, AlertCircle, AlertOctagon } from "lucide-react";

interface MarginAlertsProps {
  supplierId: string;
  targetMargin?: number;
}

export function MarginAlerts({ supplierId, targetMargin = 30 }: MarginAlertsProps) {
  const { alerts, isLoading } = useMarginAlerts(supplierId, targetMargin);

  if (isLoading) {
    return (
      <div className="space-y-2">
        {[...Array(2)].map((_, i) => (
          <div key={i} className="h-16 bg-surface-800 rounded-lg animate-pulse" />
        ))}
      </div>
    );
  }

  if (alerts.length === 0) {
    return (
      <div className="text-center py-8 text-surface-400 text-sm">
        Toutes les marges sont saines ✓
      </div>
    );
  }

  const severityConfig = {
    critical: {
      bg: "bg-red-500/10 border-red-500/50",
      icon: <AlertOctagon size={18} className="text-red-400" />,
      text: "text-red-400",
    },
    warning: {
      bg: "bg-amber-500/10 border-amber-500/50",
      icon: <AlertTriangle size={18} className="text-amber-400" />,
      text: "text-amber-400",
    },
    info: {
      bg: "bg-blue-500/10 border-blue-500/50",
      icon: <AlertCircle size={18} className="text-blue-400" />,
      text: "text-blue-400",
    },
  };

  return (
    <div className="space-y-3">
      {alerts.map((alert) => {
        const config = severityConfig[alert.severity];
        return (
          <div key={alert.productId} className={`border rounded-lg p-4 ${config.bg}`}>
            <div className="flex items-start gap-3 mb-2">
              {config.icon}
              <div className="flex-1">
                <p className="font-medium text-surface-100">{alert.productName}</p>
                <p className="text-xs text-surface-400 mt-1">{alert.recommendation}</p>
              </div>
            </div>

            <div className="flex gap-4 text-xs">
              <div>
                <p className="text-surface-500 mb-1">Marge actuelle</p>
                <p className={`font-mono font-bold ${config.text}`}>
                  {formatPercent(alert.currentMargin)}
                </p>
              </div>
              <div>
                <p className="text-surface-500 mb-1">Cible</p>
                <p className="font-mono font-bold text-emerald-400">
                  {formatPercent(alert.targetMargin)}
                </p>
              </div>
              <div>
                <p className="text-surface-500 mb-1">Écart</p>
                <p className="font-mono font-bold text-orange-400">
                  {formatPercent(alert.targetMargin - alert.currentMargin)}
                </p>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
