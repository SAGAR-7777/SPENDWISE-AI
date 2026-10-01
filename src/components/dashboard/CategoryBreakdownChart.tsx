"use client";

import { useEffect, useState } from "react";
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip } from "recharts";
import { CategorySpending } from "@/types";

interface CategoryBreakdownChartProps {
  categories: CategorySpending[];
}

export function CategoryBreakdownChart({ categories }: CategoryBreakdownChartProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!categories || categories.length === 0) {
    return (
      <div className="glass-panel rounded-2xl p-6 h-80 flex flex-col items-center justify-center text-center text-slate-500">
        <p className="text-xs">No category breakdown available yet.</p>
      </div>
    );
  }

  const chartData: Array<{
    name: string;
    value: number;
    percentage: number;
    color: string;
  }> = categories.slice(0, 6).map((c) => ({
    name: c.category,
    value: c.totalAmount,
    percentage: c.percentage,
    color: c.color,
  }));

  // Group remainder into "Other Categories" if more than 6
  if (categories.length > 6) {
    const otherSum = categories.slice(6).reduce((acc, c) => acc + c.totalAmount, 0);
    const otherPct = categories.slice(6).reduce((acc, c) => acc + c.percentage, 0);
    chartData.push({
      name: "Other Categories",
      value: otherSum,
      percentage: Number(otherPct.toFixed(1)),
      color: "#64748B",
    });
  }

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-[#0B101C] border border-slate-700/80 p-2.5 rounded-xl shadow-xl text-xs">
          <div className="font-semibold text-white flex items-center gap-1.5 mb-1">
            <span
              className="w-2.5 h-2.5 rounded-full inline-block"
              style={{ backgroundColor: data.color }}
            />
            <span>{data.name}</span>
          </div>
          <div className="text-emerald-400 font-bold">
            ₹{data.value.toLocaleString("en-IN")}
          </div>
          <div className="text-slate-400 text-[10px]">
            {data.percentage}% of total outflows
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="glass-panel rounded-2xl p-5 border border-[#1E2638]">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-sm font-bold text-white tracking-wide">Category Distribution</h3>
          <p className="text-[11px] text-slate-400">Where outflows are distributed</p>
        </div>
        <span className="text-[11px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
          {categories.length} Categories
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
        {/* Donut Chart */}
        <div className="md:col-span-6 h-56 relative flex items-center justify-center">
          {mounted ? (
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Tooltip content={<CustomTooltip />} />
                <Pie
                  data={chartData}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={85}
                  paddingAngle={3}
                  dataKey="value"
                  stroke="#090D16"
                  strokeWidth={2}
                >
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="w-32 h-32 rounded-full border-4 border-slate-800 animate-pulse" />
          )}

          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
            <span className="text-[10px] text-slate-400 uppercase tracking-widest font-semibold">
              Top Share
            </span>
            <span className="text-base font-bold text-white">
              {categories[0]?.percentage || 0}%
            </span>
          </div>
        </div>

        {/* Legend List */}
        <div className="md:col-span-6 space-y-2">
          {categories.slice(0, 5).map((cat) => (
            <div
              key={cat.category}
              className="flex items-center justify-between text-xs p-2 rounded-lg bg-slate-900/50 hover:bg-slate-800/50 transition-colors"
            >
              <div className="flex items-center gap-2 truncate">
                <span
                  className="w-2.5 h-2.5 rounded-full shrink-0"
                  style={{ backgroundColor: cat.color }}
                />
                <span className="text-slate-300 font-medium truncate">{cat.category}</span>
              </div>
              <div className="flex items-center gap-2 text-right shrink-0">
                <span className="text-slate-400 text-[11px] font-mono">
                  {cat.percentage}%
                </span>
                <span className="text-white font-semibold">
                  ₹{cat.totalAmount.toLocaleString("en-IN")}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
