"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/auth-context";
import {
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Lock,
  Layers,
  Repeat,
  Compass,
  FileSpreadsheet,
  PieChart,
  CheckCircle,
  EyeOff,
  Zap,
} from "lucide-react";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";

export default function LandingPage() {
  const router = useRouter();
  const { user, loginAsDemoUser } = useAuth();

  const handleExploreDemo = async () => {
    await loginAsDemoUser();
    router.push("/dashboard");
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#080B13] text-slate-100 selection:bg-emerald-500/20 selection:text-emerald-300">
      <Navbar />

      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative pt-16 pb-20 md:pt-24 md:pb-28 overflow-hidden">
          {/* Subtle background glow */}
          <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[350px] bg-emerald-500/10 blur-[130px] rounded-full pointer-events-none" />

          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
            {/* Top pill */}
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#121929] border border-emerald-500/30 text-emerald-300 text-xs font-medium mb-8 shadow-sm">
              <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
              <span>AI-Powered Personal Expense Detective for India</span>
              <span className="w-1 h-1 rounded-full bg-emerald-400" />
              <span className="font-mono text-[10px] text-slate-400">Groq 70B</span>
            </div>

            {/* Headline */}
            <h1 className="text-4xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight text-white max-w-4xl mx-auto leading-[1.08]">
              Know Where Your <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-teal-300 to-emerald-200">Money Goes.</span>
            </h1>

            {/* Supporting text */}
            <p className="mt-6 text-base sm:text-lg text-slate-300 max-w-2xl mx-auto leading-relaxed">
              Turn your UPI and bank statements into clear spending insights with AI. Extract transactions, uncover hidden recurring charges, and discover where your funds actually disappear.
            </p>

            {/* CTAs */}
            <div className="mt-9 flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                href={user ? "/upload" : "/signup"}
                className="w-full sm:w-auto px-7 py-3.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-sm flex items-center justify-center gap-2 shadow-xl shadow-emerald-500/25 transition-all transform hover:-translate-y-0.5 cursor-pointer"
              >
                <span>Analyze My Spending</span>
                <ArrowRight className="w-4 h-4" />
              </Link>

              <button
                type="button"
                onClick={handleExploreDemo}
                className="w-full sm:w-auto px-7 py-3.5 rounded-xl bg-slate-900/90 hover:bg-slate-800 text-slate-200 hover:text-white border border-slate-700/80 font-semibold text-sm flex items-center justify-center gap-2 transition-all cursor-pointer shadow-sm"
              >
                <span>Explore Demo</span>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/15 text-emerald-300 font-mono">
                  Live Preview
                </span>
              </button>
            </div>

            {/* Quick Proof Badges */}
            <div className="mt-10 flex flex-wrap items-center justify-center gap-6 text-xs text-slate-400">
              <div className="flex items-center gap-1.5">
                <CheckCircle className="w-4 h-4 text-emerald-400" />
                <span>PhonePe, GPay & Paytm</span>
              </div>
              <div className="flex items-center gap-1.5">
                <CheckCircle className="w-4 h-4 text-emerald-400" />
                <span>HDFC, SBI, ICICI & Bank PDFs</span>
              </div>
              <div className="flex items-center gap-1.5">
                <CheckCircle className="w-4 h-4 text-emerald-400" />
                <span>Zero Public Exposure (RLS)</span>
              </div>
            </div>

            {/* Hero Dashboard Realistic Animated Preview */}
            <div className="mt-14 relative max-w-5xl mx-auto rounded-3xl p-1 bg-gradient-to-b from-slate-700/50 via-slate-800/20 to-transparent shadow-2xl">
              <div className="rounded-[22px] bg-[#0A0E18] border border-[#1C2436] p-4 sm:p-7 text-left overflow-hidden">
                {/* Preview Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-5 border-b border-slate-800/80 gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
                      <span className="text-xs font-mono text-emerald-400 uppercase tracking-wider font-semibold">
                        Synthetic Preview Mode • Live Demo Data
                      </span>
                    </div>
                    <div className="text-lg font-bold text-white mt-1">
                      Good morning, Sagar
                    </div>
                  </div>
                  <div className="text-xs font-mono text-slate-400 bg-slate-900 px-3 py-1.5 rounded-lg border border-slate-800 self-start sm:self-auto">
                    Statement: PhonePe_Oct2024.csv (32 txns)
                  </div>
                </div>

                {/* Preview Cards */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 my-5">
                  <div className="bg-[#101625] p-3.5 rounded-xl border border-slate-800">
                    <div className="text-[10px] uppercase tracking-wider text-slate-400">Total Income</div>
                    <div className="text-lg font-bold text-white mt-1">₹65,000</div>
                    <div className="text-[10px] text-emerald-400 font-medium mt-1">+ Salary credit</div>
                  </div>
                  <div className="bg-[#101625] p-3.5 rounded-xl border border-slate-800">
                    <div className="text-[10px] uppercase tracking-wider text-slate-400">Total Outflows</div>
                    <div className="text-lg font-bold text-white mt-1">₹34,850</div>
                    <div className="text-[10px] text-rose-400 font-medium mt-1">31 debits analyzed</div>
                  </div>
                  <div className="bg-[#101625] p-3.5 rounded-xl border border-slate-800">
                    <div className="text-[10px] uppercase tracking-wider text-slate-400">Net Retained</div>
                    <div className="text-lg font-bold text-emerald-400 mt-1">+₹30,150</div>
                    <div className="text-[10px] text-slate-400 font-medium mt-1">46.3% savings rate</div>
                  </div>
                  <div className="bg-[#101625] p-3.5 rounded-xl border border-slate-800">
                    <div className="text-[10px] uppercase tracking-wider text-slate-400">Top Outflow</div>
                    <div className="text-lg font-bold text-white mt-1">Transfers</div>
                    <div className="text-[10px] text-purple-400 font-medium mt-1">₹14,000 (House Rent)</div>
                  </div>
                </div>

                {/* Preview AI Section */}
                <div className="bg-[#0D1424] border border-emerald-500/30 rounded-2xl p-4 mb-5 glow-card">
                  <div className="flex items-center gap-2 mb-1.5">
                    <Sparkles className="w-4 h-4 text-emerald-400" />
                    <span className="text-xs font-bold text-white">✦ AI Financial Detective Observation</span>
                  </div>
                  <div className="text-xs font-semibold text-emerald-300 mb-1">
                    &ldquo;You spent ₹4,329 on Food & Dining and ₹4,366 on Quick Groceries across 16 orders this month.&rdquo;
                  </div>
                  <p className="text-[11px] text-slate-400 leading-relaxed">
                    Identified 6 food delivery orders (Swiggy/Zomato) and 6 quick-commerce deliveries (Zepto/Blinkit). Batching deliveries could preserve an estimated ₹2,200 monthly.
                  </p>
                </div>

                {/* Preview Recent Txn Feed */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-[#101625] p-4 rounded-xl border border-slate-800">
                    <div className="text-xs font-bold text-slate-300 mb-3">Live Categorization Stream</div>
                    <div className="space-y-2 text-xs">
                      <div className="flex items-center justify-between p-2 rounded-lg bg-slate-900/60">
                        <div className="flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full bg-amber-400" />
                          <span className="text-slate-200">Swiggy Gourmet Dinner</span>
                        </div>
                        <span className="font-mono text-slate-200 font-bold">-₹620</span>
                      </div>
                      <div className="flex items-center justify-between p-2 rounded-lg bg-slate-900/60">
                        <div className="flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full bg-emerald-400" />
                          <span className="text-slate-200">Zepto Quick Delivery</span>
                        </div>
                        <span className="font-mono text-slate-200 font-bold">-₹489</span>
                      </div>
                      <div className="flex items-center justify-between p-2 rounded-lg bg-slate-900/60">
                        <div className="flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full bg-purple-400" />
                          <span className="text-slate-200">Netflix Standard HD</span>
                        </div>
                        <span className="font-mono text-slate-200 font-bold">-₹499</span>
                      </div>
                    </div>
                  </div>

                  <div className="bg-[#101625] p-4 rounded-xl border border-slate-800">
                    <div className="text-xs font-bold text-slate-300 mb-3">Recurring Subscriptions Detected</div>
                    <div className="space-y-2 text-xs">
                      <div className="flex items-center justify-between p-2 rounded-lg bg-slate-900/60">
                        <div>
                          <div className="text-white font-medium">Netflix + Spotify + YouTube</div>
                          <div className="text-[10px] text-slate-400">Monthly recurring streaming</div>
                        </div>
                        <span className="text-emerald-400 font-mono font-bold">₹807/mo</span>
                      </div>
                      <div className="flex items-center justify-between p-2 rounded-lg bg-slate-900/60">
                        <div>
                          <div className="text-white font-medium">ACT Fibernet Broadband</div>
                          <div className="text-[10px] text-slate-400">Monthly utility commitment</div>
                        </div>
                        <span className="text-emerald-400 font-mono font-bold">₹943/mo</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Feature Highlights Grid */}
        <section className="py-20 border-t border-[#1C2436] bg-[#0A0D17]">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-3xl mx-auto mb-16">
              <h2 className="text-xs font-bold uppercase tracking-widest text-emerald-400">
                Architected for Indian Financial Realities
              </h2>
              <p className="text-3xl font-extrabold text-white mt-2">
                Not just another chat wrapper. Structured data meets AI deduction.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="glass-panel p-6 rounded-2xl border border-slate-800 hover:border-emerald-500/30 transition-all">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 mb-4">
                  <Compass className="w-5 h-5" />
                </div>
                <h3 className="text-base font-bold text-white mb-2">&ldquo;Where Did My Money Go?&rdquo;</h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Reveals frequent ₹20–₹150 chai/coffee purchases that quietly add up to thousands, pinpointing small repetitive leaks without passing moral judgments.
                </p>
              </div>

              <div className="glass-panel p-6 rounded-2xl border border-slate-800 hover:border-emerald-500/30 transition-all">
                <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400 mb-4">
                  <Repeat className="w-5 h-5" />
                </div>
                <h3 className="text-base font-bold text-white mb-2">Recurring Payment Detective</h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Automatically flags Netflix, Spotify, gym, cloud storage, SIPs, and telecom recharges with estimated monthly cost projections.
                </p>
              </div>

              <div className="glass-panel p-6 rounded-2xl border border-slate-800 hover:border-emerald-500/30 transition-all">
                <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400 mb-4">
                  <Sparkles className="w-5 h-5" />
                </div>
                <h3 className="text-base font-bold text-white mb-2">Groq Llama 3.3 Zero-Math AI</h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Financial arithmetic is strictly computed in deterministic application code. The LLM explains patterns without hallucinating numbers.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Privacy First Commitment */}
        <section className="py-16 border-t border-[#1C2436] bg-[#070A12]">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400 mx-auto mb-4">
              <Lock className="w-6 h-6" />
            </div>
            <h2 className="text-2xl font-bold text-white">Your Financial Privacy is Non-Negotiable</h2>
            <p className="text-xs text-slate-400 mt-2 max-w-xl mx-auto leading-relaxed">
              We enforce Supabase Row Level Security so no one else can ever access your data. Raw statement files are parsed in memory, and you can delete your data at any time.
            </p>
            <div className="mt-8 flex justify-center">
              <button
                onClick={handleExploreDemo}
                className="px-6 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-semibold text-xs border border-slate-700 transition-colors"
              >
                Experience Live Demo First →
              </button>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
