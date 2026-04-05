"use client";

import { useCOGSAnalysis, formatFCFA, formatPercent } from "./hooks";
import { TrendingUp, TrendingDown } from "lucide-react";

interface COGSTrackerProps {
  supplierId: string;
}

export function COGSTracker({ supplierId }: COGSTrackerProps) {
  const { analysis, isLoading } = useCOGSAnalysis(supplierId);

  if (isLoading) {
    return (
      <div className="space-y-2">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-12 bg-surface-800 rounded-lg animate-pulse" />
        ))}
      </div>
    );
  }

  if (analysis.length === 0) {
    return <div className="text-center py-8 text-surface-400 text-sm">Aucune donnée</div>;
  }

  const totalRevenue = analysis.reduce((sum, a) => sum + a.totalRevenue, 0);
  const totalCost = analysis.reduce((sum, a) => sum + a.totalCost, 0);
  const totalProfit = analysis.reduce((sum, a) => sum + a.totalProfit, 0);
  const avgMargin = analysis.length > 0 ? Math.round(analysis.reduce((sum, a) => sum + a.marginPercent, 0) / analysis.length) : 0;

  return (
    <div className="space-y-4">
      {/* ── Summary Stats ────────────────────────────────────── */}
      <div className="grid grid-cols-4 gap-2 text-xs mb-4">
        <div className="bg-surface-800 rounded-lg p-2">
          <p className="text-surface-500 mb-1">Revenu</p>
          <p className="font-mono font-bold text-blue-400">{formatFCFA(totalRevenue)}</p>
        </div>
        <div className="bg-surface-800 rounded-lg p-2">
          <p className="text-surface-500 mb-1">Coûts</p>
          <p className="font-mono font-bold text-red-400">{formatFCFA(totalCost)}</p>
        </div>
        <div className="bg-surface-800 rounded-lg p-2">
          <p className="text-surface-500 mb-1">Profit</p>
          <p className="font-mono font-bold text-emerald-400">{formatFCFA(totalProfit)}</p>
        </div>
        <div className="bg-surface-800 rounded-lg p-2">
          <p className="text-surface-500 mb-1">Marge avg</p>
          <p className="font-mono font-bold text-orange-400">{formatPercent(avgMargin)}</p>
        </div>
      </div>

      {/* ── Product Breakdown ─────────────────────────────────── */}
      <div className="border border-surface-700 rounded-lg overflow-hidden">
        <table className="w-full text-xs">
          <thead className="bg-surface-800/50 border-b border-surface-700">
            <tr>
              <th className="px-3 py-2 text-left text-surface-400">Produit</th>
              <th className="px-3 py-2 text-right text-surface-400">Coût U.</th>
              <th className="px-3 py-2 text-right text-surface-400">Prix U.</th>
              <th className="px-3 py-2 text-right text-surface-400">Vendues</th>
              <th className="px-3 py-2 text-right text-surface-400">Profit</th>
              <th className="px-3 py-2 text-right text-surface-400">Marge</th>
            </tr>
          </thead>
          <tbody>
            {analysis.slice(0, 10).map((item) => (
              <tr key={item.productId} className="border-b border-surface-700/50 hover:bg-surface-800/30 transition">
                <td className="px-3 py-2 text-surface-200 truncate">{item.productName}</td>
                <td className="px-3 py-2 text-right font-mono text-surface-400">
                  {formatFCFA(item.costPerUnit)}
                </td>
                <td className="px-3 py-2 text-right font-mono text-blue-400">
                  {formatFCFA(item.sellingPrice)}
                </td>
                <td className="px-3 py-2 text-right font-mono text-surface-400">
                  {item.unitsSoldLast30d}
                </td>
                <td className="px-3 py-2 text-right font-mono text-emerald-400">
                  {formatFCFA(item.totalProfit)}
                </td>
                <td className="px-3 py-2 text-right">
                  <span className={`font-mono font-bold ${
                    item.marginPercent >= 30 ? "text-emerald-400" : item.marginPercent >= 20 ? "text-orange-400" : "text-red-400"
                  }`}>
                    {formatPercent(item.marginPercent)}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
