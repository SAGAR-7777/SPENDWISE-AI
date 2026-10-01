"use client";

import Link from "next/link";
import { Sparkles, ArrowRight, ShieldAlert, Zap, TrendingUp, Lightbulb } from "lucide-react";
import { AIInsightCard } from "@/types";

interface AIInsightSectionProps {
  insights: AIInsightCard[];
  isLoading?: boolean;
  onOpenAskAI?: () => void;
}

export function AIInsightSection({ insights, isLoading, onOpenAskAI }: AIInsightSectionProps) {
  if (isLoading) {
    return (
      <div className="glass-panel rounded-2xl p-6 border-emerald-500/20 relative overflow-hidden">
        <div className="flex items-center gap-2 mb-4">
          <Sparkles className="w-5 h-5 text-emerald-400 animate-spin" />
          <h3 className="text-sm font-bold text-white tracking-wide">
            ✦ AI Financial Detective Insights
          </h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-28 rounded-xl bg-slate-900/50 animate-pulse border border-slate-800" />
          ))}
        </div>
      </div>
    );
  }

  if (!insights || insights.length === 0) {
    return (
      <div className="glass-panel rounded-2xl p-6 border border-slate-800 relative">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-emerald-400 text-sm">✦</span>
            <h3 className="text-sm font-bold text-white tracking-wide">AI Financial Insight</h3>
          </div>
        </div>
        <p className="text-xs text-slate-400 mt-2">
          There isn&apos;t enough transaction data to determine this yet. Upload a statement to unlock verified AI insights.
        </p>
      </div>
    );
  }

  return (
    <div className="glass-panel rounded-2xl p-5 border border-emerald-500/25 relative overflow-hidden bg-gradient-to-b from-[#0F1626] to-[#0A0E18] glow-card">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-300">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              ✦ AI Financial Insights
              <span className="text-[10px] font-mono font-normal px-1.5 py-0.5 rounded bg-emerald-400/10 text-emerald-300 border border-emerald-500/30">
                Verified Facts
              </span>
            </h3>
            <p className="text-[11px] text-slate-400">
              Computed from actual statement debits and patterns. Zero hallucinated numbers.
            </p>
          </div>
        </div>

        {onOpenAskAI && (
          <button
            onClick={onOpenAskAI}
            className="text-xs font-semibold text-emerald-400 hover:text-emerald-300 flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 hover:border-emerald-500/40 transition-colors self-start sm:self-auto cursor-pointer"
          >
            <span>Ask Follow-up</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {insights.slice(0, 3).map((item) => {
          const isAlert = item.tag === "Alert";
          const isOpportunity = item.tag === "Opportunity";

          return (
            <div
              key={item.id}
              className="bg-[#0B101C]/80 border border-[#1E273A] hover:border-emerald-500/40 rounded-xl p-4 flex flex-col justify-between transition-all group"
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-2">
                  <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400">
                    {item.title}
                  </span>
                  <span
                    className={`text-[10px] px-2 py-0.5 rounded font-medium ${
                      isAlert
                        ? "bg-rose-500/10 text-rose-400 border border-rose-500/20"
                        : isOpportunity
                        ? "bg-amber-500/10 text-amber-300 border border-amber-500/20"
                        : "bg-emerald-500/10 text-emerald-300 border border-emerald-500/20"
                    }`}
                  >
                    {item.tag}
                  </span>
                </div>

                <div className="text-xs font-semibold text-white mb-1.5 leading-snug group-hover:text-emerald-300 transition-colors">
                  &ldquo;{item.highlight}&rdquo;
                </div>

                <p className="text-[11px] text-slate-400 leading-relaxed mb-3">
                  {item.description}
                </p>
              </div>

              {item.actionText && (
                <Link
                  href={item.actionUrl || "/where-did-my-money-go"}
                  className="text-[11px] font-semibold text-emerald-400 group-hover:text-emerald-300 flex items-center gap-1 mt-auto pt-2 border-t border-slate-800/80 transition-colors"
                >
                  <span>{item.actionText}</span>
                  <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
                </Link>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
