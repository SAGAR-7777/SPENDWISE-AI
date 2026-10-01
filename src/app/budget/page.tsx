"use client";

import { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/context/auth-context";
import { fetchTransactions, fetchBudget, saveBudget } from "@/lib/storage";
import { calculateFinancialSummary, calculateCategorySpending, simulateBudgetScenario } from "@/lib/analytics";
import { Transaction, Budget, Category } from "@/types";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import {
  Calculator,
  ArrowLeft,
  Target,
  Sparkles,
  TrendingUp,
  Sliders,
  CheckCircle,
  AlertCircle,
  Save,
} from "lucide-react";

export default function BudgetSimulatorPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);

  // Budget Inputs
  const [monthlyIncome, setMonthlyIncome] = useState<number>(65000);
  const [savingsTarget, setSavingsTarget] = useState<number>(15000);
  const [isSaved, setIsSaved] = useState(false);

  // Simulation Sliders / Reductions
  const [foodReduction, setFoodReduction] = useState<number>(1000);
  const [shoppingReduction, setShoppingReduction] = useState<number>(1500);
  const [transportReduction, setTransportReduction] = useState<number>(500);
  const [subscriptionReduction, setSubscriptionReduction] = useState<number>(300);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/login");
      return;
    }

    async function loadData() {
      if (!user) return;
      setLoading(true);
      const txs = await fetchTransactions(user.id);
      setTransactions(txs);

      const existingBudget = await fetchBudget(user.id);
      if (existingBudget) {
        if (existingBudget.monthly_income > 0) setMonthlyIncome(existingBudget.monthly_income);
        if (existingBudget.savings_target > 0) setSavingsTarget(existingBudget.savings_target);
      } else {
        // Derive income from transactions if available
        const incomeTotal = txs.filter((t) => t.type === "credit").reduce((a, b) => a + b.amount, 0);
        if (incomeTotal > 0) {
          setMonthlyIncome(Math.round(incomeTotal));
        }
      }
      setLoading(false);
    }

    if (user) {
      loadData();
    }
  }, [user, authLoading, router]);

  const summary = useMemo(() => calculateFinancialSummary(transactions), [transactions]);
  const categories = useMemo(() => calculateCategorySpending(transactions), [transactions]);

  // Current Actual Expenses
  const currentExpenses = summary.totalExpenses || 34850;

  // Run Real Scenario Simulation
  const simulation = useMemo(() => {
    const reductions: { category: Category; reductionAmount: number }[] = [
      { category: "Food & Dining" as Category, reductionAmount: foodReduction },
      { category: "Shopping" as Category, reductionAmount: shoppingReduction },
      { category: "Transport" as Category, reductionAmount: transportReduction },
      { category: "Subscriptions" as Category, reductionAmount: subscriptionReduction },
    ].filter((r) => r.reductionAmount > 0);

    return simulateBudgetScenario(currentExpenses, monthlyIncome, savingsTarget, reductions);
  }, [
    currentExpenses,
    monthlyIncome,
    savingsTarget,
    foodReduction,
    shoppingReduction,
    transportReduction,
    subscriptionReduction,
  ]);

  const handleSaveBudget = async () => {
    if (!user) return;
    const b: Budget = {
      id: crypto.randomUUID(),
      user_id: user.id,
      monthly_income: monthlyIncome,
      savings_target: savingsTarget,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    await saveBudget(b);
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 2500);
  };

  const remainingSpendingAllowance = Math.max(0, monthlyIncome - savingsTarget - currentExpenses);

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
            <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
              <Calculator className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-white">
                Budget & Savings Scenario Simulator
              </h1>
              <p className="text-xs text-slate-400">
                Model real-world scenarios to see how small tweaks unlock your target savings rate.
              </p>
            </div>
          </div>
        </div>

        {/* Top Configuration & Baseline */}
        <div className="glass-panel rounded-2xl p-6 border border-[#1E2638] space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-sm font-bold text-white tracking-wide">
                Your Monthly Baseline Targets
              </h3>
              <p className="text-[11px] text-slate-400">
                Adjust your monthly income and desired savings goal
              </p>
            </div>

            <button
              onClick={handleSaveBudget}
              className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 shadow-md shadow-emerald-500/20 transition-all self-start sm:self-auto cursor-pointer"
            >
              <Save className="w-3.5 h-3.5" />
              <span>{isSaved ? "Saved Successfully!" : "Save Baseline"}</span>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">
                Monthly Net Income (₹)
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-2.5 text-xs text-slate-500 font-mono">₹</span>
                <input
                  type="number"
                  value={monthlyIncome}
                  onChange={(e) => setMonthlyIncome(Math.max(0, parseInt(e.target.value) || 0))}
                  className="w-full bg-[#0A0D15] border border-slate-800 rounded-xl pl-8 pr-3.5 py-2 text-xs font-mono font-bold text-white focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">
                Target Monthly Savings (₹)
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-2.5 text-xs text-slate-500 font-mono">₹</span>
                <input
                  type="number"
                  value={savingsTarget}
                  onChange={(e) => setSavingsTarget(Math.max(0, parseInt(e.target.value) || 0))}
                  className="w-full bg-[#0A0D15] border border-slate-800 rounded-xl pl-8 pr-3.5 py-2 text-xs font-mono font-bold text-emerald-400 focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>
          </div>

          {/* Metrics Trio */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-3 border-t border-slate-800/80 text-xs">
            <div className="p-3 rounded-xl bg-slate-900/50 border border-slate-800">
              <span className="text-slate-400 block text-[10px] uppercase">Current Statement Spend</span>
              <span className="text-lg font-bold text-white font-mono mt-1 block">
                ₹{currentExpenses.toLocaleString("en-IN")}
              </span>
            </div>

            <div className="p-3 rounded-xl bg-slate-900/50 border border-slate-800">
              <span className="text-slate-400 block text-[10px] uppercase">Current Baseline Savings</span>
              <span className="text-lg font-bold text-teal-400 font-mono mt-1 block">
                ₹{simulation.currentSavings.toLocaleString("en-IN")} ({simulation.currentSavingsRate}%)
              </span>
            </div>

            <div className="p-3 rounded-xl bg-slate-900/50 border border-slate-800">
              <span className="text-slate-400 block text-[10px] uppercase">Remaining Spending Allowance</span>
              <span className="text-lg font-bold text-amber-400 font-mono mt-1 block">
                ₹{remainingSpendingAllowance.toLocaleString("en-IN")}
              </span>
            </div>
          </div>
        </div>

        {/* Interactive Scenario Simulator */}
        <div className="glass-panel rounded-2xl p-6 border border-emerald-500/25 space-y-6 bg-gradient-to-b from-[#0D1322] to-[#0A0D16]">
          <div className="flex items-center gap-2">
            <Sliders className="w-5 h-5 text-emerald-400" />
            <div>
              <h3 className="text-sm font-bold text-white tracking-wide">
                Scenario Simulator: &ldquo;What if I tweak discretionary spending?&rdquo;
              </h3>
              <p className="text-[11px] text-slate-400">
                Move the sliders to model proposed monthly cutbacks across key categories.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {/* Slider 1: Food & Dining */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-slate-200">Reduce Food Delivery / Dining by:</span>
                <span className="font-mono font-bold text-emerald-400">₹{foodReduction.toLocaleString("en-IN")}</span>
              </div>
              <input
                type="range"
                min="0"
                max="5000"
                step="250"
                value={foodReduction}
                onChange={(e) => setFoodReduction(parseInt(e.target.value))}
                className="w-full accent-emerald-500 cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-slate-500 font-mono">
                <span>₹0</span>
                <span>₹2,500</span>
                <span>₹5,000</span>
              </div>
            </div>

            {/* Slider 2: Shopping */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-slate-200">Reduce Discretionary Shopping by:</span>
                <span className="font-mono font-bold text-emerald-400">₹{shoppingReduction.toLocaleString("en-IN")}</span>
              </div>
              <input
                type="range"
                min="0"
                max="6000"
                step="250"
                value={shoppingReduction}
                onChange={(e) => setShoppingReduction(parseInt(e.target.value))}
                className="w-full accent-emerald-500 cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-slate-500 font-mono">
                <span>₹0</span>
                <span>₹3,000</span>
                <span>₹6,000</span>
              </div>
            </div>

            {/* Slider 3: Cabs / Transport */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-slate-200">Reduce Ride-hailing / Cabs by:</span>
                <span className="font-mono font-bold text-emerald-400">₹{transportReduction.toLocaleString("en-IN")}</span>
              </div>
              <input
                type="range"
                min="0"
                max="3000"
                step="100"
                value={transportReduction}
                onChange={(e) => setTransportReduction(parseInt(e.target.value))}
                className="w-full accent-emerald-500 cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-slate-500 font-mono">
                <span>₹0</span>
                <span>₹1,500</span>
                <span>₹3,000</span>
              </div>
            </div>

            {/* Slider 4: Subscriptions */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-slate-200">Trim Streaming / Subscriptions by:</span>
                <span className="font-mono font-bold text-emerald-400">₹{subscriptionReduction.toLocaleString("en-IN")}</span>
              </div>
              <input
                type="range"
                min="0"
                max="2000"
                step="100"
                value={subscriptionReduction}
                onChange={(e) => setSubscriptionReduction(parseInt(e.target.value))}
                className="w-full accent-emerald-500 cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-slate-500 font-mono">
                <span>₹0</span>
                <span>₹1,000</span>
                <span>₹2,000</span>
              </div>
            </div>
          </div>

          {/* Simulation Outcome Card */}
          <div className="p-5 rounded-2xl bg-[#090D17] border border-emerald-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs uppercase font-bold tracking-wider text-slate-400">
                  Projected Monthly Outcome
                </span>
                {simulation.targetAchieved ? (
                  <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center gap-1 font-semibold">
                    <CheckCircle className="w-3 h-3" />
                    Target Achieved!
                  </span>
                ) : (
                  <span className="text-[10px] px-2 py-0.5 rounded bg-amber-500/10 text-amber-300 border border-amber-500/20 flex items-center gap-1 font-semibold">
                    <AlertCircle className="w-3 h-3" />
                    Gap: ₹{simulation.savingsGap.toLocaleString("en-IN")}
                  </span>
                )}
              </div>

              <div className="text-3xl font-extrabold text-white mt-1">
                ₹{simulation.newProjectedSavings.toLocaleString("en-IN")}{" "}
                <span className="text-xs font-normal text-emerald-400">
                  ({simulation.newSavingsRate}% of income)
                </span>
              </div>

              <p className="text-xs text-slate-400 mt-1">
                Your new projected monthly expenses would be{" "}
                <span className="text-slate-200 font-semibold font-mono">
                  ₹{simulation.newTotalSpending.toLocaleString("en-IN")}
                </span>
                , freeing up an additional{" "}
                <span className="text-emerald-400 font-bold font-mono">
                  +₹
                  {(
                    foodReduction +
                    shoppingReduction +
                    transportReduction +
                    subscriptionReduction
                  ).toLocaleString("en-IN")}
                </span>{" "}
                monthly.
              </p>
            </div>

            <div className="text-right sm:border-l sm:border-slate-800 sm:pl-6 shrink-0">
              <div className="text-xs text-slate-500">Annual Wealth Compounding</div>
              <div className="text-xl font-bold text-emerald-400 font-mono mt-0.5">
                +₹
                {(
                  (foodReduction +
                    shoppingReduction +
                    transportReduction +
                    subscriptionReduction) *
                  12
                ).toLocaleString("en-IN")}
              </div>
              <div className="text-[10px] text-slate-400 mt-0.5">Extra preserved yearly</div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
