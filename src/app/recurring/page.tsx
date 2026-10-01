"use client";

import { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/context/auth-context";
import { fetchTransactions } from "@/lib/storage";
import { detectRecurringPayments } from "@/lib/analytics";
import { Transaction } from "@/types";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import {
  Repeat,
  ArrowLeft,
  Calendar,
  ShieldCheck,
  HelpCircle,
  Tv,
  CheckCircle,
  AlertCircle,
} from "lucide-react";

export default function RecurringPage() {
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

  const recurringList = useMemo(() => detectRecurringPayments(transactions), [transactions]);
  const totalMonthlyCommitment = useMemo(
    () => recurringList.reduce((acc, r) => acc + r.estimatedMonthlyCost, 0),
    [recurringList]
  );

  return (
    <div className="min-h-screen flex flex-col bg-[#080B13] text-slate-100">
      <Navbar />

      <main className="flex-1 max-w-5xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        <div>
          <Link
            href="/dashboard"
            className="text-xs font-medium text-slate-400 hover:text-white inline-flex items-center gap-1.5 mb-2 transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Command Center</span>
          </Link>
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400">
              <Repeat className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-white">
                Recurring Payment & Subscription Detector
              </h1>
              <p className="text-xs text-slate-400">
                Identifies recurring digital services, gym memberships, broadband, and repeating UPI mandates.
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
          <div className="space-y-6">
            {/* Top Commitment Stat Card */}
            <div className="glass-panel rounded-2xl p-6 border border-purple-500/25 bg-gradient-to-r from-[#121024] to-[#0A0D16] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <span className="text-xs font-semibold uppercase tracking-wider text-purple-300">
                  Estimated Recurring Outflow
                </span>
                <div className="text-3xl font-extrabold text-white mt-1">
                  ₹{totalMonthlyCommitment.toLocaleString("en-IN")}{" "}
                  <span className="text-sm font-normal text-slate-400">/ month</span>
                </div>
                <p className="text-xs text-slate-400 mt-1">
                  Annualized impact: approx ₹{(totalMonthlyCommitment * 12).toLocaleString("en-IN")}/year
                </p>
              </div>

              <div className="text-xs text-slate-300 bg-slate-900/80 p-3.5 rounded-xl border border-slate-800 max-w-xs">
                💡 <span className="font-semibold text-white">Detective Tip:</span> Review subscriptions every 90 days. Canceling just 1 or 2 unused services can save ₹3,000–₹6,000 annually.
              </div>
            </div>

            {/* Recurring List */}
            <div className="glass-panel rounded-2xl p-5 border border-[#1E2638] space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-white tracking-wide">
                  Detected Recurring Services ({recurringList.length})
                </h3>
                <span className="text-[11px] text-slate-500">
                  Uncertain detections clearly labeled
                </span>
              </div>

              {recurringList.length === 0 ? (
                <div className="p-8 text-center text-slate-400 text-xs">
                  No recurring payments or repeat subscription patterns were identified in this statement.
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {recurringList.map((rec, idx) => (
                    <div
                      key={idx}
                      className="p-4 rounded-xl bg-[#0B101C] border border-slate-800 hover:border-purple-500/30 transition-all space-y-3"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <div className="text-sm font-bold text-white">{rec.merchant}</div>
                          <div className="text-[11px] text-slate-400">{rec.category}</div>
                        </div>

                        <span
                          className={`text-[10px] px-2 py-0.5 rounded font-medium flex items-center gap-1 ${
                            rec.isCertain
                              ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                              : "bg-amber-500/10 text-amber-300 border border-amber-500/20"
                          }`}
                        >
                          {rec.isCertain ? (
                            <>
                              <CheckCircle className="w-3 h-3" />
                              <span>Known Subscription</span>
                            </>
                          ) : (
                            <>
                              <HelpCircle className="w-3 h-3" />
                              <span>Possible Recurring Payment</span>
                            </>
                          )}
                        </span>
                      </div>

                      <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-800/80 text-[11px]">
                        <div>
                          <div className="text-slate-500">Frequency</div>
                          <div className="font-semibold text-slate-200 mt-0.5">{rec.frequency}</div>
                        </div>
                        <div>
                          <div className="text-slate-500">Est. Monthly</div>
                          <div className="font-bold text-emerald-400 font-mono mt-0.5">
                            ₹{rec.estimatedMonthlyCost.toLocaleString("en-IN")}
                          </div>
                        </div>
                        <div>
                          <div className="text-slate-500">Last Charged</div>
                          <div className="font-mono text-slate-300 mt-0.5">{rec.lastTransactionDate}</div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
