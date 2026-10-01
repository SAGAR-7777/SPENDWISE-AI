"use client";

import { useState, useEffect } from "react";
import { ShieldCheck, Lock, Trash2, EyeOff, CheckCircle } from "lucide-react";

interface PrivacyNoticeModalProps {
  isOpen: boolean;
  onAccept: () => void;
}

export function PrivacyNoticeModal({ isOpen, onAccept }: PrivacyNoticeModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-lg bg-[#0F1420] border border-emerald-500/30 rounded-2xl p-6 shadow-2xl shadow-emerald-500/10">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white">Your Financial Privacy is Paramount</h3>
            <p className="text-xs text-slate-400">Please review how SpendWise AI protects your financial data</p>
          </div>
        </div>

        <div className="space-y-3.5 my-5 text-xs text-slate-300">
          <div className="flex items-start gap-2.5 p-3 rounded-xl bg-slate-900/60 border border-slate-800">
            <Lock className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
            <div>
              <span className="font-semibold text-white block">Strict Data Isolation & RLS</span>
              Your statements and transactions are protected by Row Level Security (RLS). No other user or unauthorized party can ever view your records.
            </div>
          </div>

          <div className="flex items-start gap-2.5 p-3 rounded-xl bg-slate-900/60 border border-slate-800">
            <EyeOff className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
            <div>
              <span className="font-semibold text-white block">Zero Raw Statement Exposure</span>
              Uploaded files are parsed in isolated server memory. We do not sell your transactional data or share records with advertisers.
            </div>
          </div>

          <div className="flex items-start gap-2.5 p-3 rounded-xl bg-slate-900/60 border border-slate-800">
            <Trash2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
            <div>
              <span className="font-semibold text-white block">Full Deletion Rights</span>
              You retain 100% control. You can delete uploaded statements and all associated parsed transactions at any time with one click.
            </div>
          </div>
        </div>

        <div className="text-[11px] text-slate-500 mb-6 bg-slate-950/40 p-2.5 rounded-lg border border-slate-800/80">
          ⚠️ <strong>Neutral Analytics Disclaimer:</strong> SpendWise AI provides informational expense pattern detection. We do not provide personalized financial, tax, or investment advice.
        </div>

        <button
          onClick={onAccept}
          className="w-full py-2.5 px-4 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20 transition-all cursor-pointer"
        >
          <CheckCircle className="w-4 h-4" />
          I Understand & Agree to Privacy Terms
        </button>
      </div>
    </div>
  );
}
