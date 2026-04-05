"use client";

import { useSupplierMetrics, formatFCFA, formatPercent } from "./hooks";
import { TrendingUp, ShoppingCart, Users, TrendingDown } from "lucide-react";

interface SupplierOverviewProps {
  supplierId: string;
}

export function SupplierOverview({ supplierId }: SupplierOverviewProps) {
  const { metrics, isLoading } = useSupplierMetrics(supplierId);

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-32 bg-surface-800 rounded-lg animate-pulse" />
        ))}
      </div>
    );
  }

  if (!metrics) {
    return <div className="text-surface-400 text-center py-8">Aucune donnée disponible</div>;
  }

  const kpis = [
    {
      label: "CA Total",
      value: formatFCFA(metrics.totalSales),
      icon: TrendingUp,
      color: "emerald",
      trend: "+12%",
    },
    {
      label: "Commandes",
      value: metrics.totalOrders.toString(),
      icon: ShoppingCart,
      color: "blue",
      trend: "+8%",
    },
    {
      label: "Panier Moyen",
      value: formatFCFA(metrics.avgOrderValue),
      icon: TrendingUp,
      color: "orange",
      trend: "+3%",
    },
    {
      label: "Clients Uniques",
      value: metrics.totalCustomers.toString(),
      icon: Users,
      color: "purple",
      trend: "+15%",
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
      {kpis.map((kpi) => {
        const Icon = kpi.icon;
        const colorClasses = {
          emerald: "border-emerald-500/25 bg-emerald-500/5",
          blue: "border-blue-500/25 bg-blue-500/5",
          orange: "border-orange-500/25 bg-orange-500/5",
          purple: "border-purple-500/25 bg-purple-500/5",
        };

        return (
          <div
            key={kpi.label}
            className={`border rounded-lg p-6 backdrop-blur-sm ${colorClasses[kpi.color as keyof typeof colorClasses]}`}
          >
            <div className="flex items-start justify-between mb-4">
              <span className="text-sm text-surface-400">{kpi.label}</span>
              <Icon size={20} className={`text-${kpi.color}-400`} />
            </div>
            <div className="text-2xl font-bold text-surface-100 mb-2">{kpi.value}</div>
            <div className="flex items-center gap-1">
              <span className="text-xs text-emerald-400 font-medium">{kpi.trend}</span>
              <span className="text-xs text-surface-500">vs mois dernier</span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
