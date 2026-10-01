import { ShieldCheck, Lock, Heart, FileCheck } from "lucide-react";

export function Footer() {
  return (
    <footer className="w-full border-t border-[#1E2638] bg-[#070A11] py-8 text-xs text-slate-400">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
          <div className="space-y-2">
            <div className="text-slate-200 font-semibold text-sm flex items-center gap-1.5">
              <span>SpendWise AI</span>
            </div>
            <p className="text-slate-400 text-xs leading-relaxed">
              AI-powered personal expense detective for Indian UPI, payment apps, and bank statements.
            </p>
          </div>

          <div className="space-y-2">
            <div className="text-slate-200 font-semibold text-xs uppercase tracking-wider">
              Privacy First Architecture
            </div>
            <ul className="space-y-1.5 text-slate-400">
              <li className="flex items-center gap-1.5">
                <Lock className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span>Zero public exposure of statements</span>
              </li>
              <li className="flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span>Supabase Row Level Security</span>
              </li>
              <li className="flex items-center gap-1.5">
                <FileCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span>One-click full data deletion</span>
              </li>
            </ul>
          </div>

          <div className="space-y-2">
            <div className="text-slate-200 font-semibold text-xs uppercase tracking-wider">
              Supported Sources
            </div>
            <p className="text-slate-400 text-xs leading-relaxed">
              PhonePe, Google Pay, Paytm, HDFC, SBI, ICICI, Axis Bank, and all major Indian UPI and banking e-statements (PDF & CSV).
            </p>
          </div>

          <div className="space-y-2">
            <div className="text-slate-200 font-semibold text-xs uppercase tracking-wider">
              Regulatory Notice
            </div>
            <p className="text-slate-500 text-[11px] leading-relaxed">
              SpendWise AI provides algorithmic transaction categorization and pattern discovery. It does not provide personalized investment, legal, or tax advice. Financial figures are calculated directly from user-uploaded records.
            </p>
          </div>
        </div>

        <div className="pt-6 border-t border-[#161C2C] flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px] text-slate-500">
          <p>© {new Date().getFullYear()} SpendWise AI. Built for India with privacy and precision.</p>
          <div className="flex items-center gap-4">
            <span>Powered by Groq Llama 3.3 & Supabase</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
