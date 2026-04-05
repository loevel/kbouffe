"use client";

import { useSupplierCategories, formatPercent } from "./hooks";
import { BarChart3 } from "lucide-react";

interface CategoryPerformanceProps {
  supplierId: string;
}

export function CategoryPerformance({ supplierId }: CategoryPerformanceProps) {
  const { categories, isLoading } = useSupplierCategories(supplierId);

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-12 bg-surface-800 rounded-lg animate-pulse" />
        ))}
      </div>
    );
  }

  if (!categories || categories.length === 0) {
    return <div className="text-surface-400 text-center py-8">Aucune catégorie</div>;
  }

  const maxSales = Math.max(...categories.map((c) => c.salesPercent), 100);

  return (
    <div className="space-y-4">
      {categories.map((cat) => (
        <div key={cat.name} className="space-y-2">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-medium text-surface-200">{cat.name}</p>
            <div className="flex gap-4 text-xs">
              <span className="text-blue-400 font-mono">{formatPercent(cat.salesPercent)}</span>
              <span className="text-orange-400 font-mono">{cat.productCount} produits</span>
            </div>
          </div>
          <div className="w-full h-8 bg-surface-800 rounded-lg overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-blue-500 to-blue-400 transition-all duration-500"
              style={{ width: `${(cat.salesPercent / maxSales) * 100}%` }}
            />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-surface-500">Marge avg:</span>
            <span className="text-xs font-mono text-emerald-400">{formatPercent(cat.avgMargin)}</span>
            <span className="text-xs text-surface-500">Croissance:</span>
            <span className="text-xs font-mono text-orange-400">+{formatPercent(cat.growth)}</span>
          </div>
        </div>
      ))}
    </div>
  );
}
