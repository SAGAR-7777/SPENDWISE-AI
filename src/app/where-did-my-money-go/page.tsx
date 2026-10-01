"use client";

import { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/context/auth-context";
import { fetchTransactions } from "@/lib/storage";
import {
  calculateFinancialSummary,
  calculateCategorySpending,
  calculateTopMerchants,
  detectFrequentSmallPurchases,
  detectSpendingOutliers,
  detectPotentiallyReducibleSpending,
  detectRecurringPayments,
} from "@/lib/analytics";
import { Transaction } from "@/types";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import {
  Compass,
  ArrowLeft,
  Coffee,
  AlertTriangle,
  Lightbulb,
  ShoppingBag,
  TrendingUp,
  ShieldCheck,
  ArrowRight,
  Flame,
} from "lucide-react";

export default function WhereDidMyMoneyGoPage() {
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
  const topMerchants = useMemo(() => calculateTopMerchants(transactions, 10), [transactions]);
  const smallPurchases = useMemo(() => detectFrequentSmallPurchases(transactions), [transactions]);
  const outliers = useMemo(() => detectSpendingOutliers(transactions), [transactions]);
  const reducible = useMemo(() => detectPotentiallyReducibleSpending(transactions), [transactions]);
  const recurring = useMemo(() => detectRecurringPayments(transactions), [transactions]);

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
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
              <Compass className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-white">
                Where Did My Money Go?
              </h1>
              <p className="text-xs text-slate-400">
                Detailed detective breakdown of outflows, frequent small leaks, and high-spending categories.
              </p>
            </div>
          </div>
        </div>

        {transactions.length === 0 ? (
          <div className="glass-panel rounded-3xl p-12 text-center text-slate-500 max-w-lg mx-auto">
            <p className="text-xs mb-3">No statements uploaded yet.</p>
            <Link
              href="/upload"
              className="px-4 py-2 rounded-xl bg-emerald-500 text-slate-950 font-bold text-xs inline-block"
            >
              Upload Statement →
            </Link>
          </div>
        ) : (
          <div className="space-y-7">
            {/* Top Stat Banner */}
            <div className="glass-panel rounded-2xl p-6 border border-emerald-500/25 bg-gradient-to-r from-[#0F1626] to-[#0A0D16]">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                <div>
                  <div className="text-xs uppercase tracking-wider text-slate-400">Total Expenditures</div>
                  <div className="text-3xl font-extrabold text-white mt-1">
                    ₹{summary.totalExpenses.toLocaleString("en-IN")}
                  </div>
                  <div className="text-[11px] text-slate-400 mt-1">
                    Across {summary.transactionCount} transactions analyzed
                  </div>
                </div>

                <div>
                  <div className="text-xs uppercase tracking-wider text-slate-400">Single Largest Category</div>
                  <div className="text-2xl font-bold text-emerald-400 mt-1">
                    {summary.largestCategory?.category || "None"}
                  </div>
                  <div className="text-[11px] text-slate-400 mt-1">
                    ₹{summary.largestCategory?.amount.toLocaleString("en-IN")} ({summary.largestCategory?.percentage.toFixed(0)}% of all spending)
                  </div>
                </div>

                <div>
                  <div className="text-xs uppercase tracking-wider text-slate-400">Average Transaction Ticket</div>
                  <div className="text-2xl font-bold text-white mt-1">
                    ₹{summary.avgTransactionValue.toLocaleString("en-IN")}
                  </div>
                  <div className="text-[11px] text-slate-400 mt-1">
                    Per debit transaction
                  </div>
                </div>
              </div>
            </div>

            {/* Section 1: Potentially Reducible Spending Patterns (Neutral Phrasing) */}
            <div className="glass-panel rounded-2xl p-5 border border-[#1E2638] space-y-4">
              <div className="flex items-center gap-2">
                <Lightbulb className="w-4 h-4 text-amber-400" />
                <h3 className="text-sm font-bold text-white tracking-wide">
                  Potentially Reducible Spending Patterns
                </h3>
              </div>
              <p className="text-xs text-slate-400">
                These patterns represent high-frequency discretionary spending or repetitive orders that you may wish to review when optimizing savings.
              </p>

              {reducible.length === 0 ? (
                <div className="p-4 rounded-xl bg-slate-900/40 text-xs text-slate-400">
                  No disproportionate discretionary spending clusters detected.
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {reducible.map((item, idx) => (
                    <div
                      key={idx}
                      className="p-4 rounded-xl bg-[#0B101C] border border-slate-800 space-y-2 hover:border-amber-500/40 transition-colors"
                    >
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-bold text-white">{item.category}</span>
                        <span className="font-mono text-amber-400 font-bold">
                          ₹{item.totalAmount.toLocaleString("en-IN")} ({item.count} orders)
                        </span>
                      </div>
                      <p className="text-xs text-slate-300 leading-relaxed">{item.reason}</p>
                      <div className="text-[11px] text-emerald-400/90 bg-emerald-500/10 p-2.5 rounded-lg border border-emerald-500/20">
                        💡 {item.suggestion}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Section 2: Frequent Small Purchases (Chai/Coffee/Quick UPIs) */}
            <div className="glass-panel rounded-2xl p-5 border border-[#1E2638] space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Coffee className="w-4 h-4 text-emerald-400" />
                  <div>
                    <h3 className="text-sm font-bold text-white tracking-wide">
                      Frequent Micro-Purchases (&lt; ₹250)
                    </h3>
                    <p className="text-[11px] text-slate-400">
                      Small repetitive UPI transactions (chai, snacks, quick deliveries) that quietly accumulate.
                    </p>
                  </div>
                </div>
              </div>

              {smallPurchases.length === 0 ? (
                <div className="p-4 rounded-xl bg-slate-900/40 text-xs text-slate-400">
                  No high-frequency micro purchases found under ₹250.
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {smallPurchases.map((sp, idx) => (
                    <div
                      key={idx}
                      className="p-3.5 rounded-xl bg-slate-900/50 border border-slate-800 space-y-1"
                    >
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-semibold text-white truncate">{sp.merchant}</span>
                        <span className="text-[10px] text-slate-400 font-mono">{sp.count} txns</span>
                      </div>
                      <div className="flex items-baseline justify-between pt-1">
                        <span className="text-base font-bold text-amber-400 font-mono">
                          ₹{sp.totalAmount.toLocaleString("en-IN")}
                        </span>
                        <span className="text-[10px] text-slate-400">
                          Avg: ₹{sp.avgAmount}/txn
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Section 3: Spending Outliers (Unusually Large Transactions) */}
            {outliers.length > 0 && (
              <div className="glass-panel rounded-2xl p-5 border border-[#1E2638] space-y-4">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-rose-400" />
                  <h3 className="text-sm font-bold text-white tracking-wide">
                    Unusual High-Value Outliers
                  </h3>
                </div>
                <p className="text-[11px] text-slate-400">
                  Transactions significantly larger than your baseline average spend.
                </p>

                <div className="space-y-2">
                  {outliers.map((out, idx) => (
                    <div
                      key={idx}
                      className="p-3 rounded-xl bg-slate-900/50 border border-slate-800 flex items-center justify-between text-xs"
                    >
                      <div>
                        <div className="font-semibold text-white">{out.transaction.merchant}</div>
                        <div className="text-[10px] text-slate-400">{out.reason}</div>
                      </div>
                      <div className="text-right">
                        <div className="font-mono font-bold text-rose-400 text-sm">
                          ₹{out.transaction.amount.toLocaleString("en-IN")}
                        </div>
                        <div className="text-[10px] text-slate-500">{out.transaction.date}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Section 4: Comprehensive Category Breakdown */}
            <div className="glass-panel rounded-2xl p-5 border border-[#1E2638] space-y-4">
              <h3 className="text-sm font-bold text-white tracking-wide">
                Comprehensive Category Distribution
              </h3>

              <div className="space-y-2">
                {categories.map((c) => (
                  <div
                    key={c.category}
                    className="p-3 rounded-xl bg-slate-900/40 border border-slate-800/80 flex items-center justify-between gap-4"
                  >
                    <div className="flex items-center gap-3">
                      <span
                        className="w-3 h-3 rounded-full shrink-0"
                        style={{ backgroundColor: c.color }}
                      />
                      <span className="text-xs font-semibold text-white">{c.category}</span>
                      <span className="text-[10px] text-slate-500 font-mono">
                        ({c.count} transactions)
                      </span>
                    </div>

                    <div className="flex items-center gap-3">
                      <span className="text-xs font-mono text-slate-400">{c.percentage}%</span>
                      <span className="text-xs font-bold text-white font-mono min-w-[70px] text-right">
                        ₹{c.totalAmount.toLocaleString("en-IN")}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
