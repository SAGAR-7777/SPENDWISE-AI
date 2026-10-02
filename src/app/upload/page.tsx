"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/auth-context";
import { fetchStatements, deleteStatementCascade } from "@/lib/storage";
import { Statement } from "@/types";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { StatementUploader } from "@/components/upload/StatementUploader";
import { FileText, Trash2, ArrowLeft, Shield, Calendar, Layers } from "lucide-react";
import Link from "next/link";

export default function UploadPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [statements, setStatements] = useState<Statement[]>([]);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/login");
      return;
    }

    async function loadStatements() {
      if (!user) return;
      try {
        const list = await fetchStatements(user.id);
        setStatements(list);
      } catch (err) {
        console.error("[UPLOAD PAGE] Failed to load statements:", err);
      }
    }

    if (user) {
      loadStatements();
    }
  }, [user, authLoading, router]);

  const handleDelete = async (id: string, name: string) => {
    if (!user) return;
    const confirmed = window.confirm(
      `Are you sure you want to delete "${name}"? This will also delete all parsed transactions associated with this statement.`
    );
    if (!confirmed) return;

    setDeletingId(id);
    await deleteStatementCascade(id, user.id);
    setStatements((prev) => prev.filter((s) => s.id !== id));
    setDeletingId(null);
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#080B13] text-slate-100">
      <Navbar />

      <main className="flex-1 max-w-5xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <Link
              href="/dashboard"
              className="text-xs font-medium text-slate-400 hover:text-white inline-flex items-center gap-1.5 mb-2 transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to Command Center</span>
            </Link>
            <h1 className="text-2xl font-bold tracking-tight text-white">
              Statement Ingestion Engine
            </h1>
            <p className="text-xs text-slate-400 mt-1">
              Upload your UPI, payment app, or bank e-statements in PDF or CSV format.
            </p>
          </div>

          <div className="flex items-center gap-2 text-xs text-emerald-400 bg-emerald-500/10 px-3 py-1.5 rounded-xl border border-emerald-500/20 self-start sm:self-auto">
            <Shield className="w-4 h-4" />
            <span>End-to-End Privacy Guaranteed</span>
          </div>
        </div>

        {/* Uploader Engine */}
        <StatementUploader />

        {/* Previously Uploaded Statements */}
        {statements.length > 0 && (
          <div className="glass-panel rounded-2xl p-6 border border-[#1E2638] space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-white tracking-wide">
                  Your Uploaded Statements
                </h3>
                <p className="text-[11px] text-slate-400">
                  Manage previously ingested statements. Deleting a statement deletes its associated transactions.
                </p>
              </div>
              <span className="text-xs font-mono text-slate-400">
                {statements.length} file(s)
              </span>
            </div>

            <div className="divide-y divide-slate-800/80">
              {statements.map((stmt) => (
                <div
                  key={stmt.id}
                  className="py-3.5 flex items-center justify-between gap-4 hover:bg-slate-900/30 px-2 rounded-xl transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-300 shrink-0">
                      <FileText className="w-4 h-4 text-emerald-400" />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-white">{stmt.file_name}</div>
                      <div className="flex items-center gap-3 text-[11px] text-slate-400 mt-0.5">
                        <span className="uppercase font-mono text-[10px] text-emerald-400 bg-emerald-500/10 px-1.5 py-0.2 rounded border border-emerald-500/20">
                          {stmt.file_type}
                        </span>
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3 text-slate-500" />
                          {new Date(stmt.uploaded_at).toLocaleDateString("en-IN", {
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                          })}
                        </span>
                        {stmt.transaction_count && (
                          <span className="flex items-center gap-1 text-slate-300">
                            <Layers className="w-3 h-3 text-slate-500" />
                            {stmt.transaction_count} transactions
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => handleDelete(stmt.id, stmt.file_name)}
                    disabled={deletingId === stmt.id}
                    className="p-2 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition-colors cursor-pointer"
                    title="Delete Statement & Associated Transactions"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
