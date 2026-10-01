"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/context/auth-context";
import { fetchStatements, fetchTransactions, clearAllUserData, deleteStatementCascade } from "@/lib/storage";
import { isSupabaseConfigured } from "@/lib/supabase/client";
import { Statement, Transaction } from "@/types";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import {
  Settings,
  Trash2,
  Download,
  ShieldCheck,
  Database,
  Lock,
  ArrowLeft,
  LogOut,
  Moon,
  AlertTriangle,
  FileText,
  User as UserIcon,
} from "lucide-react";

export default function SettingsPage() {
  const router = useRouter();
  const { user, logout, loading: authLoading } = useAuth();
  const [statements, setStatements] = useState<Statement[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/login");
      return;
    }

    async function loadData() {
      if (!user) return;
      setLoading(true);
      const stmts = await fetchStatements(user.id);
      const txs = await fetchTransactions(user.id);
      setStatements(stmts);
      setTransactions(txs);
      setLoading(false);
    }

    if (user) {
      loadData();
    }
  }, [user, authLoading, router]);

  const handleClearAll = async () => {
    if (!user) return;
    const confirmed = window.confirm(
      "WARNING: This will permanently delete ALL your uploaded statements and parsed transactions. This action cannot be reversed. Proceed?"
    );
    if (!confirmed) return;

    await clearAllUserData(user.id);
    setStatements([]);
    setTransactions([]);
    setStatusMessage("All your data has been completely erased.");
    setTimeout(() => setStatusMessage(null), 3500);
  };

  const handleDeleteStatement = async (id: string, name: string) => {
    if (!user) return;
    const confirmed = window.confirm(
      `Delete statement "${name}"? All associated transactions will also be permanently deleted.`
    );
    if (!confirmed) return;

    await deleteStatementCascade(id, user.id);
    setStatements((prev) => prev.filter((s) => s.id !== id));
    setTransactions((prev) => prev.filter((t) => t.statement_id !== id));
    setStatusMessage(`Deleted statement "${name}" and its parsed transactions.`);
    setTimeout(() => setStatusMessage(null), 3000);
  };

  const handleExportJSON = () => {
    const payload = {
      exportDate: new Date().toISOString(),
      user: { id: user?.id, email: user?.email, name: user?.name },
      statements,
      transactions,
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `SpendWise_Export_${user?.name || "data"}.json`;
    link.click();
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#080B13] text-slate-100">
      <Navbar />

      <main className="flex-1 max-w-4xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        <div>
          <Link
            href="/dashboard"
            className="text-xs font-medium text-slate-400 hover:text-white inline-flex items-center gap-1.5 mb-2 transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Command Center</span>
          </Link>
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-300">
              <Settings className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-white">
                Data Management & Preferences
              </h1>
              <p className="text-xs text-slate-400">
                Manage your statement data, privacy controls, export records, and account settings.
              </p>
            </div>
          </div>
        </div>

        {statusMessage && (
          <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs">
            {statusMessage}
          </div>
        )}

        {/* 1. Account & Security Card */}
        <div className="glass-panel rounded-2xl p-6 border border-[#1E2638] space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <UserIcon className="w-4 h-4 text-emerald-400" />
              <h3 className="text-sm font-bold text-white tracking-wide">Account Profile</h3>
            </div>
            {user?.isDemo && (
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-300 border border-amber-500/30">
                Demo Account
              </span>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div className="p-3 rounded-xl bg-slate-900/50 border border-slate-800">
              <span className="text-slate-400 block text-[10px] uppercase">Name</span>
              <span className="text-white font-medium mt-0.5 block">{user?.name}</span>
            </div>
            <div className="p-3 rounded-xl bg-slate-900/50 border border-slate-800">
              <span className="text-slate-400 block text-[10px] uppercase">Email</span>
              <span className="text-white font-medium mt-0.5 block">{user?.email}</span>
            </div>
          </div>

          <div className="pt-2 flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs text-slate-400">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>
                Backend Database:{" "}
                <strong className="text-white">
                  {isSupabaseConfigured ? "Supabase PostgreSQL (Connected)" : "Local Secure Storage (Active)"}
                </strong>
              </span>
            </div>

            <button
              onClick={async () => {
                await logout();
                router.push("/");
              }}
              className="px-3.5 py-1.5 rounded-xl bg-slate-800 hover:bg-rose-500/20 text-slate-300 hover:text-rose-400 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Sign Out</span>
            </button>
          </div>
        </div>

        {/* 2. Statements & Cascade Delete */}
        <div className="glass-panel rounded-2xl p-6 border border-[#1E2638] space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FileText className="w-4 h-4 text-emerald-400" />
              <h3 className="text-sm font-bold text-white tracking-wide">
                Ingested Statements ({statements.length})
              </h3>
            </div>
          </div>
          <p className="text-xs text-slate-400">
            Deleting a statement will cascade delete all transactions associated with that upload.
          </p>

          {statements.length === 0 ? (
            <div className="p-4 rounded-xl bg-slate-900/40 text-xs text-slate-500 text-center">
              No statements currently stored in your account.
            </div>
          ) : (
            <div className="divide-y divide-slate-800/80">
              {statements.map((s) => (
                <div
                  key={s.id}
                  className="py-3 flex items-center justify-between gap-4 text-xs"
                >
                  <div>
                    <div className="font-semibold text-white">{s.file_name}</div>
                    <div className="text-[10px] text-slate-400 mt-0.5">
                      Uploaded {new Date(s.uploaded_at).toLocaleDateString("en-IN")} •{" "}
                      {s.transaction_count} txns
                    </div>
                  </div>

                  <button
                    onClick={() => handleDeleteStatement(s.id, s.file_name)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors cursor-pointer"
                    title="Delete Statement & Cascade Transactions"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* 3. Data Export & Permanent Erasure */}
        <div className="glass-panel rounded-2xl p-6 border border-[#1E2638] space-y-4">
          <div className="flex items-center gap-2">
            <Database className="w-4 h-4 text-emerald-400" />
            <h3 className="text-sm font-bold text-white tracking-wide">
              Data Portability & Full Erasure Rights
            </h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
            <div className="p-4 rounded-xl bg-slate-900/50 border border-slate-800 space-y-3">
              <div>
                <h4 className="text-xs font-bold text-white">Export Full JSON Archive</h4>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Download a complete structured JSON copy of all your statements and parsed transactions.
                </p>
              </div>
              <button
                onClick={handleExportJSON}
                disabled={!transactions.length}
                className="w-full py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-semibold text-xs flex items-center justify-center gap-2 transition-colors disabled:opacity-40"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Download Archive ({transactions.length} txns)</span>
              </button>
            </div>

            <div className="p-4 rounded-xl bg-rose-500/5 border border-rose-500/20 space-y-3">
              <div>
                <h4 className="text-xs font-bold text-rose-300">Wipe All Financial Data</h4>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Irreversibly delete all statements, transactions, budgets, and AI insights from the system.
                </p>
              </div>
              <button
                onClick={handleClearAll}
                disabled={!transactions.length && !statements.length}
                className="w-full py-2 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/30 font-semibold text-xs flex items-center justify-center gap-2 transition-colors disabled:opacity-40 cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Erase All Financial Records</span>
              </button>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
