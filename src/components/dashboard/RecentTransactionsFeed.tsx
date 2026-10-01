"use client";

import Link from "next/link";
import { Transaction } from "@/types";
import { CATEGORY_COLORS } from "@/lib/categorizer";
import { ArrowUpRight, ArrowDownLeft, ArrowRight, ShieldCheck } from "lucide-react";

interface RecentTransactionsFeedProps {
  transactions: Transaction[];
  limit?: number;
}

export function RecentTransactionsFeed({ transactions, limit = 8 }: RecentTransactionsFeedProps) {
  const displayTx = transactions.slice(0, limit);

  if (!transactions.length) {
    return (
      <div className="glass-panel rounded-2xl p-6 text-center text-slate-500">
        <p className="text-xs">No transactions available.</p>
      </div>
    );
  }

  return (
    <div className="glass-panel rounded-2xl p-5 border border-[#1E2638]">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-sm font-bold text-white tracking-wide">Recent Activity</h3>
          <p className="text-[11px] text-slate-400">Latest analyzed UPI & bank debits/credits</p>
        </div>
        <Link
          href="/transactions"
          className="text-xs font-semibold text-emerald-400 hover:text-emerald-300 flex items-center gap-1 transition-colors"
        >
          <span>View All ({transactions.length})</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      <div className="divide-y divide-slate-800/60">
        {displayTx.map((tx) => {
          const isDebit = tx.type === "debit";
          const catColor = CATEGORY_COLORS[tx.category] || "#94A3B8";

          return (
            <div
              key={tx.id}
              className="py-3 flex items-center justify-between gap-3 hover:bg-slate-900/40 -mx-2 px-2 rounded-xl transition-colors group"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div
                  className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 border ${
                    isDebit
                      ? "bg-rose-500/10 border-rose-500/20 text-rose-400"
                      : "bg-emerald-500/10 border-emerald-500/20 text-emerald-400"
                  }`}
                >
                  {isDebit ? <ArrowDownLeft className="w-4 h-4" /> : <ArrowUpRight className="w-4 h-4" />}
                </div>

                <div className="min-w-0">
                  <div className="text-xs font-semibold text-white truncate group-hover:text-emerald-300 transition-colors">
                    {tx.merchant || tx.description}
                  </div>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span
                      className="text-[10px] font-medium px-1.5 py-0.2 rounded"
                      style={{
                        backgroundColor: `${catColor}15`,
                        color: catColor,
                        border: `1px solid ${catColor}35`,
                      }}
                    >
                      {tx.category}
                    </span>
                    <span className="text-[11px] text-slate-500">{tx.date}</span>
                    <span className="text-[10px] text-slate-500 font-mono hidden sm:inline">
                      {tx.payment_method}
                    </span>
                  </div>
                </div>
              </div>

              <div className="text-right shrink-0">
                <div
                  className={`text-xs font-bold font-mono ${
                    isDebit ? "text-slate-100" : "text-emerald-400"
                  }`}
                >
                  {isDebit ? "-" : "+"}₹{tx.amount.toLocaleString("en-IN")}
                </div>
                {tx.confidence && (
                  <div className="flex items-center justify-end gap-1 text-[10px] text-slate-500 mt-0.5">
                    <ShieldCheck className="w-3 h-3 text-emerald-400/80" />
                    <span>{(tx.confidence * 100).toFixed(0)}%</span>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
