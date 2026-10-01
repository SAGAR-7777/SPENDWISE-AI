"use client";

import { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/auth-context";
import { fetchTransactions } from "@/lib/storage";
import {
  calculateFinancialSummary,
  calculateCategorySpending,
  calculateDailySpending,
  calculateTopMerchants,
} from "@/lib/analytics";
import { Transaction } from "@/types";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { CategoryBreakdownChart } from "@/components/dashboard/CategoryBreakdownChart";
import { CashFlowTimelineChart } from "@/components/dashboard/CashFlowTimelineChart";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Cell,
} from "recharts";
import { PieChart, TrendingUp, Store, Activity, ArrowLeft } from "lucide-react";
import Link from "next/link";

export default function AnalyticsPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/login");
      return;
    }

    async function loadData() {
      if (!user) return;
      setLoading(true);
      const list = await fetchTransactions(user.id);
      setTransactions(list);
      setLoading(false);
    }

    if (user) {
      loadData();
    }
  }, [user, authLoading, router]);

  const summary = useMemo(() => calculateFinancialSummary(transactions), [transactions]);
  const categories = useMemo(() => calculateCategorySpending(transactions), [transactions]);
  const dailyData = useMemo(() => calculateDailySpending(transactions), [transactions]);
  const topMerchants = useMemo(() => calculateTopMerchants(transactions, 8), [transactions]);

  // Top Merchants data for horizontal bar chart
  const merchantChartData = useMemo(() => {
    return topMerchants.map((m) => ({
      name: m.merchant.length > 16 ? `${m.merchant.slice(0, 16)}...` : m.merchant,
      fullName: m.merchant,
      amount: m.totalAmount,
      count: m.count,
      category: m.category,
    }));
  }, [topMerchants]);

  const CustomMerchantTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-[#0B101C] border border-slate-700/80 p-2.5 rounded-xl shadow-xl text-xs space-y-1">
          <div className="font-semibold text-white">{data.fullName}</div>
          <div className="text-emerald-400 font-bold">₹{data.amount.toLocaleString("en-IN")}</div>
          <div className="text-slate-400 text-[10px]">
            {data.count} transaction(s) • {data.category}
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#080B13] text-slate-100">
      <Navbar />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        <div>
          <Link
            href="/dashboard"
            className="text-xs font-medium text-slate-400 hover:text-white inline-flex items-center gap-1.5 mb-2 transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Command Center</span>
          </Link>
          <h1 className="text-2xl font-bold tracking-tight text-white">
            Visual Financial Analytics
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Deep-dive charts and spending distributions across categories and top merchants.
          </p>
        </div>

        {transactions.length === 0 ? (
          <div className="glass-panel rounded-3xl p-12 text-center text-slate-500 max-w-lg mx-auto">
            <p className="text-xs mb-3">No statements uploaded to analyze yet.</p>
            <Link
              href="/upload"
              className="px-4 py-2 rounded-xl bg-emerald-500 text-slate-950 font-bold text-xs inline-block"
            >
              Upload Statement →
            </Link>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Top Row: Category Donut + Timeline */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              <div className="lg:col-span-6">
                <CategoryBreakdownChart categories={categories} />
              </div>
              <div className="lg:col-span-6">
                <CashFlowTimelineChart dailyData={dailyData} />
              </div>
            </div>

            {/* Middle Row: Top Merchants Horizontal Bar Chart */}
            <div className="glass-panel rounded-2xl p-5 border border-[#1E2638]">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-sm font-bold text-white tracking-wide">
                    Top Outflow Destinations (Merchants)
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    Highest aggregate expenditures by merchant/entity
                  </p>
                </div>
                <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                  <Store className="w-4 h-4" />
                </div>
              </div>

              <div className="h-72 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={merchantChartData}
                    layout="vertical"
                    margin={{ top: 5, right: 30, left: 30, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#1E273A" horizontal={false} />
                    <XAxis
                      type="number"
                      stroke="#64748B"
                      fontSize={10}
                      tickFormatter={(val) => `₹${val > 999 ? `${(val / 1000).toFixed(0)}k` : val}`}
                    />
                    <YAxis
                      dataKey="name"
                      type="category"
                      stroke="#94A3B8"
                      fontSize={11}
                      width={90}
                    />
                    <Tooltip content={<CustomMerchantTooltip />} />
                    <Bar dataKey="amount" fill="#10B981" radius={[0, 4, 4, 0]} maxBarSize={18}>
                      {merchantChartData.map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={index === 0 ? "#10B981" : index < 3 ? "#14B8A6" : "#3B82F6"}
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Bottom Row: Spending Frequency & Average Transaction Size Table */}
            <div className="glass-panel rounded-2xl p-5 border border-[#1E2638]">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-sm font-bold text-white tracking-wide">
                    Category Frequency & Ticket Sizes
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    Breakdown of volume vs average ticket size across every category
                  </p>
                </div>
                <div className="w-8 h-8 rounded-lg bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400">
                  <Activity className="w-4 h-4" />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                {categories.map((c) => {
                  const avgTicket = c.count > 0 ? Math.round(c.totalAmount / c.count) : 0;
                  return (
                    <div
                      key={c.category}
                      className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800 space-y-1.5"
                    >
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-semibold text-white truncate">{c.category}</span>
                        <span className="text-[10px] font-mono text-slate-400">{c.count} txns</span>
                      </div>
                      <div className="flex items-baseline justify-between">
                        <span className="text-base font-bold text-emerald-400 font-mono">
                          ₹{c.totalAmount.toLocaleString("en-IN")}
                        </span>
                        <span className="text-[10px] text-slate-400">
                          Avg: ₹{avgTicket.toLocaleString("en-IN")}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
