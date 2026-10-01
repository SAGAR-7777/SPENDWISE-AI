"use client";

import { FinancialSummary } from "@/types";
import { TrendingUp, TrendingDown, Wallet, Hash, PieChart, ArrowUpRight, ArrowDownRight } from "lucide-react";

interface SummaryCardsProps {
  summary: FinancialSummary;
}

export function SummaryCards({ summary }: SummaryCardsProps) {
  const isPositiveCashFlow = summary.netCashFlow >= 0;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
      {/* 1. Total Income */}
      <div className="glass-panel glass-panel-hover rounded-2xl p-4 relative overflow-hidden group">
        <div className="flex items-center justify-between text-slate-400 mb-2">
          <span className="text-xs font-medium uppercase tracking-wider">Total Income</span>
          <div className="w-7 h-7 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 group-hover:scale-110 transition-transform">
            <TrendingUp className="w-3.5 h-3.5" />
          </div>
        </div>
        <div className="text-2xl font-bold tracking-tight text-white">
          ₹{summary.totalIncome.toLocaleString("en-IN")}
        </div>
        <div className="flex items-center gap-1.5 mt-2 text-[11px] text-emerald-400 font-medium">
          <ArrowUpRight className="w-3 h-3" />
          <span>Recorded inward credits</span>
        </div>
      </div>

      {/* 2. Total Expenses */}
      <div className="glass-panel glass-panel-hover rounded-2xl p-4 relative overflow-hidden group">
        <div className="flex items-center justify-between text-slate-400 mb-2">
          <span className="text-xs font-medium uppercase tracking-wider">Total Outflows</span>
          <div className="w-7 h-7 rounded-lg bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400 group-hover:scale-110 transition-transform">
            <TrendingDown className="w-3.5 h-3.5" />
          </div>
        </div>
        <div className="text-2xl font-bold tracking-tight text-white">
          ₹{summary.totalExpenses.toLocaleString("en-IN")}
        </div>
        <div className="flex items-center gap-1.5 mt-2 text-[11px] text-rose-400 font-medium">
          <ArrowDownRight className="w-3 h-3" />
          <span>Total debits analyzed</span>
        </div>
      </div>

      {/* 3. Net Cash Flow */}
      <div className="glass-panel glass-panel-hover rounded-2xl p-4 relative overflow-hidden group">
        <div className="flex items-center justify-between text-slate-400 mb-2">
          <span className="text-xs font-medium uppercase tracking-wider">Net Cash Flow</span>
          <div className={`w-7 h-7 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform ${
            isPositiveCashFlow
              ? "bg-teal-500/10 border border-teal-500/20 text-teal-400"
              : "bg-amber-500/10 border border-amber-500/20 text-amber-400"
          }`}>
            <Wallet className="w-3.5 h-3.5" />
          </div>
        </div>
        <div className={`text-2xl font-bold tracking-tight ${isPositiveCashFlow ? "text-emerald-400" : "text-amber-400"}`}>
          {summary.netCashFlow >= 0 ? "+" : ""}₹{summary.netCashFlow.toLocaleString("en-IN")}
        </div>
        <div className="flex items-center gap-1 mt-2 text-[11px] text-slate-400 font-medium">
          <span>{isPositiveCashFlow ? "Retained savings" : "Net outflow deficit"}</span>
        </div>
      </div>

      {/* 4. Transactions */}
      <div className="glass-panel glass-panel-hover rounded-2xl p-4 relative overflow-hidden group">
        <div className="flex items-center justify-between text-slate-400 mb-2">
          <span className="text-xs font-medium uppercase tracking-wider">Activity Volume</span>
          <div className="w-7 h-7 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400 group-hover:scale-110 transition-transform">
            <Hash className="w-3.5 h-3.5" />
          </div>
        </div>
        <div className="text-2xl font-bold tracking-tight text-white">
          {summary.transactionCount}
        </div>
        <div className="flex items-center gap-1 mt-2 text-[11px] text-slate-400 font-medium">
          <span>Avg: ₹{summary.avgTransactionValue.toLocaleString("en-IN")} / txn</span>
        </div>
      </div>

      {/* 5. Largest Category */}
      <div className="glass-panel glass-panel-hover rounded-2xl p-4 relative overflow-hidden group">
        <div className="flex items-center justify-between text-slate-400 mb-2">
          <span className="text-xs font-medium uppercase tracking-wider">Top Spend Category</span>
          <div className="w-7 h-7 rounded-lg bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400 group-hover:scale-110 transition-transform">
            <PieChart className="w-3.5 h-3.5" />
          </div>
        </div>
        <div className="text-xl font-bold tracking-tight text-white truncate">
          {summary.largestCategory ? summary.largestCategory.category : "N/A"}
        </div>
        <div className="flex items-center gap-1.5 mt-2 text-[11px] text-purple-400 font-medium truncate">
          {summary.largestCategory ? (
            <span>
              ₹{summary.largestCategory.amount.toLocaleString("en-IN")} ({summary.largestCategory.percentage.toFixed(0)}%)
            </span>
          ) : (
            <span>No expenses recorded</span>
          )}
        </div>
      </div>
    </div>
  );
}
