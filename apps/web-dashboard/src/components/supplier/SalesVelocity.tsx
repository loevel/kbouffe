"use client";

import { useSupplierSalesVelocity, formatFCFA } from "./hooks";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

interface SalesVelocityProps {
  supplierId: string;
  period?: "daily" | "weekly" | "monthly";
}

export function SalesVelocity({ supplierId, period = "daily" }: SalesVelocityProps) {
  const { velocity, isLoading } = useSupplierSalesVelocity(supplierId, period);

  if (isLoading) {
    return <div className="h-64 bg-surface-800 rounded-lg animate-pulse" />;
  }

  if (!velocity || velocity.length === 0) {
    return <div className="text-surface-400 text-center py-16">Pas de données</div>;
  }

  return (
    <div className="w-full h-64">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={velocity}>
          <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
          <XAxis dataKey="date" stroke="#94a3b8" style={{ fontSize: "12px" }} />
          <YAxis stroke="#94a3b8" style={{ fontSize: "12px" }} />
          <Tooltip
            contentStyle={{
              backgroundColor: "#1e293b",
              border: "1px solid #334155",
              borderRadius: "8px",
            }}
            formatter={(value) => formatFCFA(value as number)}
          />
          <Line
            type="monotone"
            dataKey="revenue"
            stroke="#f59e0b"
            strokeWidth={2}
            dot={{ fill: "#f59e0b", r: 4 }}
            activeDot={{ r: 6 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
