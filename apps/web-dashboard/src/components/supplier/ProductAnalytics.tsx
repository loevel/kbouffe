"use client";

import { useSupplierProducts, formatFCFA } from "./hooks";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";

interface ProductAnalyticsProps {
  supplierId: string;
}

export function ProductAnalytics({ supplierId }: ProductAnalyticsProps) {
  const { products, isLoading } = useSupplierProducts(supplierId);

  if (isLoading) {
    return (
      <div className="space-y-2">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="h-12 bg-surface-800 rounded-lg animate-pulse" />
        ))}
      </div>
    );
  }

  if (!products || products.length === 0) {
    return <div className="text-surface-400 text-center py-8">Aucun produit</div>;
  }

  return (
    <div className="border border-surface-700 rounded-lg overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-surface-800/50 border-b border-surface-700">
            <tr>
              <th className="px-4 py-3 text-left text-surface-400">Produit</th>
              <th className="px-4 py-3 text-right text-surface-400">CA</th>
              <th className="px-4 py-3 text-right text-surface-400">Unités</th>
              <th className="px-4 py-3 text-right text-surface-400">Marge</th>
              <th className="px-4 py-3 text-right text-surface-400">ROI</th>
              <th className="px-4 py-3 text-center text-surface-400">Trend</th>
            </tr>
          </thead>
          <tbody>
            {products.map((product) => {
              const TrendIcon =
                product.trend === "up" ? TrendingUp : product.trend === "down" ? TrendingDown : Minus;
              const trendColor =
                product.trend === "up" ? "text-emerald-400" : product.trend === "down" ? "text-red-400" : "text-surface-500";

              return (
                <tr key={product.id} className="border-b border-surface-700/50 hover:bg-surface-800/30 transition">
                  <td className="px-4 py-3">
                    <div>
                      <p className="font-medium text-surface-100">{product.name}</p>
                      <p className="text-xs text-surface-500">{product.category}</p>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-right font-mono text-surface-200">{formatFCFA(product.revenue)}</td>
                  <td className="px-4 py-3 text-right font-mono text-surface-200">{product.unitsSold}</td>
                  <td className="px-4 py-3 text-right font-mono text-emerald-400">{product.avgMargin}%</td>
                  <td className="px-4 py-3 text-right font-mono text-blue-400">{product.roi.toFixed(1)}%</td>
                  <td className="px-4 py-3 text-center">
                    <TrendIcon size={16} className={`mx-auto ${trendColor}`} />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
