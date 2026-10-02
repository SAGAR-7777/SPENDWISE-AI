"use client";

import { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/context/auth-context";
import { fetchTransactions, fetchStatements } from "@/lib/storage";
import {
  calculateFinancialSummary,
  calculateCategorySpending,
  calculateDailySpending,
  calculateTopMerchants,
  detectPotentiallyReducibleSpending,
  detectRecurringPayments,
} from "@/lib/analytics";
import { AIInsightCard, Statement, Transaction } from "@/types";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { SummaryCards } from "@/components/dashboard/SummaryCards";
import { AIInsightSection } from "@/components/dashboard/AIInsightSection";
import { CategoryBreakdownChart } from "@/components/dashboard/CategoryBreakdownChart";
import { CashFlowTimelineChart } from "@/components/dashboard/CashFlowTimelineChart";
import { RecentTransactionsFeed } from "@/components/dashboard/RecentTransactionsFeed";
import { AskSpendWiseModal } from "@/components/ai/AskSpendWiseModal";
import {
  UploadCloud,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Compass,
  Repeat,
  Calculator,
  FileText,
  AlertCircle,
  PlusCircle,
  Loader2,
} from "lucide-react";

export default function DashboardPage() {
  const router = useRouter();
  const { user, loading: authLoading, loginAsDemoUser } = useAuth();

  const [statements, setStatements] = useState<Statement[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [insights, setInsights] = useState<AIInsightCard[]>([]);
  const [loadingData, setLoadingData] = useState(true);
  const [loadingAI, setLoadingAI] = useState(false);
  const [isAskAIOpen, setIsAskAIOpen] = useState(false);
  const [dbError, setDbError] = useState<string | null>(null);

  const loadData = async () => {
    if (!user) return;
    setLoadingData(true);
    setDbError(null);
    try {
      console.log(`[DASHBOARD FETCH] Querying database for user: ${user.id}`);
      const stmts = await fetchStatements(user.id);
      const txs = await fetchTransactions(user.id);
      console.log(`[DASHBOARD FETCH] Found ${stmts.length} statement(s) and ${txs.length} transaction(s) in database.`);
      setStatements(stmts);
      setTransactions(txs);
    } catch (err: unknown) {
      console.error("[DASHBOARD FETCH ERROR] Database query failed:", err);
      setDbError(err instanceof Error ? err.message : "Failed to retrieve statement data from database.");
    } finally {
      setLoadingData(false);
    }
  };

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/login");
      return;
    }

    if (user) {
      loadData();
    }
  }, [user, authLoading, router]);

  // Derived financial analytics (Computed deterministically)
  const summary = useMemo(() => calculateFinancialSummary(transactions), [transactions]);
  const categories = useMemo(() => calculateCategorySpending(transactions), [transactions]);
  const dailyData = useMemo(() => calculateDailySpending(transactions), [transactions]);
  const topMerchants = useMemo(() => calculateTopMerchants(transactions, 10), [transactions]);
  const reducible = useMemo(() => detectPotentiallyReducibleSpending(transactions), [transactions]);
  const recurring = useMemo(() => detectRecurringPayments(transactions), [transactions]);

  // Fetch AI insights when transactions change
  useEffect(() => {
    async function fetchInsights() {
      if (transactions.length === 0) {
        setInsights([]);
        return;
      }
      setLoadingAI(true);
      try {
        const res = await fetch("/api/ai/insights", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            summary,
            categories,
            reducible,
            recurring,
          }),
        });
        const data = await res.json();
        if (data.insights && Array.isArray(data.insights)) {
          setInsights(data.insights);
        }
      } catch (err) {
        console.error("AI insights generation error:", err);
      } finally {
        setLoadingAI(false);
      }
    }

    if (transactions.length > 0) {
      fetchInsights();
    }
  }, [transactions.length, summary, categories, reducible, recurring]);

  const greetingTime = useMemo(() => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 17) return "Good afternoon";
    return "Good evening";
  }, []);

  if (authLoading || (loadingData && !transactions.length && !dbError)) {
    return (
      <div className="min-h-screen bg-[#080B13] flex items-center justify-center text-slate-400">
        <div className="flex flex-col items-center gap-3">
          <span className="w-8 h-8 rounded-full border-2 border-emerald-500 border-t-transparent animate-spin" />
          <span className="text-xs font-medium">Securing financial command center...</span>
        </div>
      </div>
    );
  }

  const isProcessing = statements.some(
    (s) => s.processing_status === "processing" || s.processing_status === "uploading"
  );

  return (
    <div className="min-h-screen flex flex-col bg-[#080B13] text-slate-100">
      <Navbar onOpenAskAI={() => setIsAskAIOpen(true)} />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-7">
        {/* Header Section */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold tracking-tight text-white">
                {greetingTime}, {user?.name || "Explorer"}
              </h1>
              {user?.isDemo && (
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-300 border border-amber-500/30">
                  Demo
                </span>
              )}
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Here&apos;s your financial snapshot.{" "}
              {summary.periodStart && summary.periodEnd && (
                <span className="text-slate-300 font-mono">
                  Covering {summary.periodStart} to {summary.periodEnd}
                </span>
              )}
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsAskAIOpen(true)}
              disabled={!transactions.length}
              className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-emerald-500/15 via-teal-500/15 to-emerald-500/10 border border-emerald-500/30 hover:border-emerald-400 text-emerald-300 text-xs font-semibold flex items-center gap-2 shadow-sm transition-all disabled:opacity-40 cursor-pointer"
            >
              <Sparkles className="w-4 h-4 text-emerald-400 animate-pulse" />
              <span>Ask SpendWise AI</span>
            </button>

            <Link
              href="/upload"
              className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold flex items-center gap-1.5 shadow-md shadow-emerald-500/20 transition-all cursor-pointer"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Upload Statement</span>
            </Link>
          </div>
        </div>

        {/* Database Error Banner */}
        {dbError ? (
          <div className="glass-panel rounded-3xl p-8 max-w-xl mx-auto my-12 border border-rose-500/30 text-center">
            <div className="w-12 h-12 rounded-2xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400 mx-auto mb-4">
              <AlertCircle className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-white mb-2">Database Query Error</h3>
            <p className="text-xs text-rose-300 mb-6 leading-relaxed max-w-md mx-auto">{dbError}</p>
            <div className="flex items-center justify-center gap-3">
              <button
                onClick={loadData}
                className="px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs flex items-center gap-2 shadow-lg shadow-emerald-500/20 transition-all cursor-pointer"
              >
                <span>Retry Database Connection</span>
              </button>
              <Link
                href="/upload"
                className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs transition-colors"
              >
                Re-upload Statement
              </Link>
            </div>
          </div>
        ) : isProcessing && transactions.length === 0 ? (
          /* Processing State */
          <div className="glass-panel rounded-3xl p-10 sm:p-14 text-center max-w-2xl mx-auto my-12 border border-emerald-500/30">
            <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 mx-auto mb-5">
              <Loader2 className="w-7 h-7 animate-spin" />
            </div>
            <h2 className="text-xl font-bold text-white mb-2">Statement Analysis In Progress</h2>
            <p className="text-xs text-slate-400 max-w-md mx-auto mb-7 leading-relaxed">
              Your statement is being processed. Normalization, categorization, and aggregate calculations are underway.
            </p>
            <button
              onClick={loadData}
              className="px-5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs cursor-pointer"
            >
              Refresh Status
            </button>
          </div>
        ) : statements.length === 0 && transactions.length === 0 ? (
          /* Empty State: Only when database confirms zero statements exist */
          <div className="glass-panel rounded-3xl p-10 sm:p-14 text-center max-w-2xl mx-auto my-12 border border-slate-800">
            <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 mx-auto mb-5">
              <UploadCloud className="w-8 h-8" />
            </div>
            <h2 className="text-xl font-bold text-white mb-2">No statement analyzed yet</h2>
            <p className="text-xs text-slate-400 max-w-md mx-auto mb-7 leading-relaxed">
              Upload your first UPI, payment-app, or bank statement and we&apos;ll show you where your money is going with real AI deductions.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <Link
                href="/upload"
                className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20 transition-all"
              >
                <span>Analyze Statement →</span>
              </Link>
              <button
                onClick={async () => {
                  await loginAsDemoUser();
                  const demoUserStmts = await fetchStatements("demo-user-sagar");
                  const demoUserTxs = await fetchTransactions("demo-user-sagar");
                  setStatements(demoUserStmts);
                  setTransactions(demoUserTxs);
                }}
                className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-700 font-semibold text-xs transition-colors cursor-pointer"
              >
                Load Sample PhonePe Data
              </button>
            </div>
          </div>
        ) : (
          <>
            {/* 1. KPI Summary Cards */}
            <SummaryCards summary={summary} />

            {/* 2. Visual AI Financial Insight Cards */}
            <AIInsightSection
              insights={insights}
              isLoading={loadingAI}
              onOpenAskAI={() => setIsAskAIOpen(true)}
            />

            {/* 3. Charts Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              <div className="lg:col-span-6">
                <CategoryBreakdownChart categories={categories} />
              </div>
              <div className="lg:col-span-6">
                <CashFlowTimelineChart dailyData={dailyData} />
              </div>
            </div>

            {/* 4. Quick Action Tiles & Feature Deep-Dives */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <Link
                href="/where-did-my-money-go"
                className="p-4 rounded-2xl glass-panel glass-panel-hover border border-slate-800 flex items-center justify-between group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 group-hover:scale-105 transition-transform">
                    <Compass className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-white group-hover:text-emerald-300 transition-colors">
                      Where Did My Money Go?
                    </h4>
                    <p className="text-[10px] text-slate-400">Discover frequent small chai/UPI leaks</p>
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-slate-500 group-hover:text-emerald-400 group-hover:translate-x-1 transition-all" />
              </Link>

              <Link
                href="/recurring"
                className="p-4 rounded-2xl glass-panel glass-panel-hover border border-slate-800 flex items-center justify-between group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400 group-hover:scale-105 transition-transform">
                    <Repeat className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-white group-hover:text-emerald-300 transition-colors">
                      Recurring Subscriptions
                    </h4>
                    <p className="text-[10px] text-slate-400">
                      {recurring.length} recurring services detected
                    </p>
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-slate-500 group-hover:text-emerald-400 group-hover:translate-x-1 transition-all" />
              </Link>

              <Link
                href="/budget"
                className="p-4 rounded-2xl glass-panel glass-panel-hover border border-slate-800 flex items-center justify-between group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 group-hover:scale-105 transition-transform">
                    <Calculator className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-white group-hover:text-emerald-300 transition-colors">
                      Budget & Savings Simulator
                    </h4>
                    <p className="text-[10px] text-slate-400">Simulate &ldquo;What if I reduce food by ₹1,000?&rdquo;</p>
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-slate-500 group-hover:text-emerald-400 group-hover:translate-x-1 transition-all" />
              </Link>
            </div>

            {/* 5. Recent Transaction Feed */}
            <RecentTransactionsFeed transactions={transactions} limit={8} />
          </>
        )}
      </main>

      <Footer />

      {/* Interactive AI Drawer / Modal */}
      <AskSpendWiseModal
        isOpen={isAskAIOpen}
        onClose={() => setIsAskAIOpen(false)}
        summary={summary}
        categories={categories}
        topMerchants={topMerchants}
        reducible={reducible}
        recurring={recurring}
        recentTransactions={transactions}
      />
    </div>
  );
}
