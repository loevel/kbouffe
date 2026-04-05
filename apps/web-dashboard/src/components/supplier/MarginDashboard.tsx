"use client";

import { useMarginHeatmap, formatFCFA, formatPercent } from "./hooks";

interface MarginDashboardProps {
  supplierId: string;
}

export function MarginDashboard({ supplierId }: MarginDashboardProps) {
  const { heatmap, isLoading } = useMarginHeatmap(supplierId);

  if (isLoading) {
    return (
      <div className="space-y-2">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="h-16 bg-surface-800 rounded-lg animate-pulse" />
        ))}
      </div>
    );
  }

  if (heatmap.length === 0) {
    return <div className="text-center py-8 text-surface-400 text-sm">Aucune donnée</div>;
  }

  // Group by buyer
  const byBuyer = new Map<string, typeof heatmap>();
  heatmap.forEach((cell) => {
    if (!byBuyer.has(cell.buyerId)) {
      byBuyer.set(cell.buyerId, []);
    }
    byBuyer.get(cell.buyerId)!.push(cell);
  });

  return (
    <div className="space-y-6">
      {Array.from(byBuyer.entries())
        .slice(0, 5)
        .map(([buyerId, cells]) => {
          const buyerName = cells[0]?.buyerName;
          const totalRevenue = cells.reduce((sum, c) => sum + c.revenue, 0);
          const totalProfit = cells.reduce((sum, c) => sum + c.profit, 0);
          const avgMargin = cells.length > 0 ? Math.round(cells.reduce((sum, c) => sum + c.margin, 0) / cells.length) : 0;

          return (
            <div key={buyerId} className="border border-surface-700 rounded-lg overflow-hidden">
              <div className="bg-surface-800/50 p-3 border-b border-surface-700">
                <p className="font-medium text-surface-100">{buyerName}</p>
                <p className="text-xs text-surface-500">
                  CA: {formatFCFA(totalRevenue)} | Profit: {formatFCFA(totalProfit)} | Marge avg: {formatPercent(avgMargin)}
                </p>
              </div>

              <table className="w-full text-xs">
                <thead className="bg-surface-900">
                  <tr>
                    <th className="px-3 py-2 text-left text-surface-400">Produit</th>
                    <th className="px-3 py-2 text-right text-surface-400">CA</th>
                    <th className="px-3 py-2 text-right text-surface-400">Profit</th>
                    <th className="px-3 py-2 text-right text-surface-400">Marge</th>
                  </tr>
                </thead>
                <tbody>
                  {cells
                    .sort((a, b) => b.profit - a.profit)
                    .slice(0, 3)
                    .map((cell) => (
                      <tr key={cell.productId} className="border-t border-surface-700/50 hover:bg-surface-800/30">
                        <td className="px-3 py-2 text-surface-200 truncate">{cell.productName}</td>
                        <td className="px-3 py-2 text-right font-mono text-blue-400">{formatFCFA(cell.revenue)}</td>
                        <td className="px-3 py-2 text-right font-mono text-emerald-400">{formatFCFA(cell.profit)}</td>
                        <td className="px-3 py-2 text-right">
                          <span
                            className={`font-mono font-bold ${
                              cell.margin >= 30
                                ? "text-emerald-400"
                                : cell.margin >= 20
                                  ? "text-orange-400"
                                  : "text-red-400"
                            }`}
                          >
                            {formatPercent(cell.margin)}
                          </span>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          );
        })}
    </div>
  );
}
