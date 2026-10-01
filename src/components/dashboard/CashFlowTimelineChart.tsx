"use client";

import { useEffect, useState } from "react";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts";
import { DailySpending } from "@/types";

interface CashFlowTimelineChartProps {
  dailyData: DailySpending[];
}

export function CashFlowTimelineChart({ dailyData }: CashFlowTimelineChartProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!dailyData || dailyData.length === 0) {
    return (
      <div className="glass-panel rounded-2xl p-6 h-80 flex flex-col items-center justify-center text-center text-slate-500">
        <p className="text-xs">No timeline activity to display.</p>
      </div>
    );
  }

  // Format date labels e.g. "14 Oct"
  const formattedData = dailyData.map((d) => {
    const parts = d.date.split("-");
    const day = parts[2] || "";
    const month = parts[1] || "";
    const shortLabel = `${day}/${month}`;
    return {
      ...d,
      shortLabel,
    };
  });

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-[#0B101C] border border-slate-700/80 p-2.5 rounded-xl shadow-xl text-xs space-y-1">
          <div className="font-semibold text-slate-300">{data.date}</div>
          {data.credit > 0 && (
            <div className="text-emerald-400">
              Income: +₹{data.credit.toLocaleString("en-IN")}
            </div>
          )}
          <div className="text-rose-400">
            Outflow: -₹{data.debit.toLocaleString("en-IN")}
          </div>
          <div className="text-slate-500 text-[10px]">{data.count} transaction(s)</div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="glass-panel rounded-2xl p-5 border border-[#1E2638]">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
        <div>
          <h3 className="text-sm font-bold text-white tracking-wide">Daily Cash Flow Timeline</h3>
          <p className="text-[11px] text-slate-400">Daily breakdown of inflows vs expenditures</p>
        </div>
        <div className="flex items-center gap-4 text-xs">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-sm bg-emerald-500 inline-block" />
            <span className="text-slate-300">Income</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-sm bg-rose-500 inline-block" />
            <span className="text-slate-300">Expenses</span>
          </div>
        </div>
      </div>

      <div className="h-64 w-full">
        {mounted ? (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={formattedData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1E273A" vertical={false} />
              <XAxis
                dataKey="shortLabel"
                stroke="#64748B"
                fontSize={10}
                tickLine={false}
                axisLine={{ stroke: "#1E273A" }}
              />
              <YAxis
                stroke="#64748B"
                fontSize={10}
                tickLine={false}
                axisLine={false}
                tickFormatter={(val) => `₹${val > 999 ? `${(val / 1000).toFixed(0)}k` : val}`}
              />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="credit" fill="#10B981" radius={[3, 3, 0, 0]} maxBarSize={16} />
              <Bar dataKey="debit" fill="#F43F5E" radius={[3, 3, 0, 0]} maxBarSize={16} />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <div className="h-full w-full bg-slate-900/40 rounded-xl animate-pulse" />
        )}
      </div>
    </div>
  );
}
