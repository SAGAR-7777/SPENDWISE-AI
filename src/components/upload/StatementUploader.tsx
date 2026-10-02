"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/auth-context";
import { saveStatement, saveTransactionsBatch, updateStatementStatus } from "@/lib/storage";
import {
  calculateFinancialSummary,
  calculateCategorySpending,
  detectPotentiallyReducibleSpending,
  detectRecurringPayments,
} from "@/lib/analytics";
import { Statement } from "@/types";
import {
  UploadCloud,
  FileText,
  CheckCircle,
  AlertCircle,
  Loader2,
  Shield,
  FileSpreadsheet,
} from "lucide-react";
import { PrivacyNoticeModal } from "@/components/privacy/PrivacyNoticeModal";

type ProcessingStage =
  | "idle"
  | "uploading"
  | "reading"
  | "extracting"
  | "cleaning"
  | "categorizing"
  | "calculating"
  | "generating"
  | "complete"
  | "error";

interface StageInfo {
  id: ProcessingStage;
  label: string;
}

const STAGES: StageInfo[] = [
  { id: "uploading", label: "Uploading file to secure session" },
  { id: "reading", label: "Reading statement layout & structure" },
  { id: "extracting", label: "Extracting transaction rows & UPI tags" },
  { id: "cleaning", label: "Cleaning data & normalizing dates/amounts" },
  { id: "categorizing", label: "Categorizing merchants with Indian entity rules" },
  { id: "calculating", label: "Persisting transactions & calculating financial aggregates" },
  { id: "generating", label: "Generating verified AI detective insights" },
  { id: "complete", label: "Complete! Redirecting to command center" },
];

export function StatementUploader() {
  const router = useRouter();
  const { user } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [stage, setStage] = useState<ProcessingStage>("idle");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [parsedCount, setParsedCount] = useState<number>(0);
  const [showPrivacyModal, setShowPrivacyModal] = useState<boolean>(false);
  const [pendingFile, setPendingFile] = useState<File | null>(null);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      checkPrivacyAndProcess(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      checkPrivacyAndProcess(e.target.files[0]);
    }
  };

  const checkPrivacyAndProcess = (file: File) => {
    // Check if user has already accepted privacy notice
    const hasAcceptedPrivacy = localStorage.getItem("spendwise_privacy_accepted");
    if (!hasAcceptedPrivacy) {
      setPendingFile(file);
      setShowPrivacyModal(true);
      return;
    }
    processFile(file);
  };

  const handlePrivacyAccept = () => {
    localStorage.setItem("spendwise_privacy_accepted", "true");
    setShowPrivacyModal(false);
    if (pendingFile) {
      processFile(pendingFile);
      setPendingFile(null);
    }
  };

  const processFile = async (file: File) => {
    // 1. [AUTH] VERIFICATION
    if (!user || !user.id) {
      console.error("[AUTH] Verification failed: No authenticated user present at upload time!");
      setStage("error");
      setErrorMessage("You must be signed in to upload and analyze statements.");
      return;
    }

    const authenticatedUserId = user.id;
    console.log(`[UPLOAD] Starting file ingestion for: "${file.name}" (${(file.size / 1024).toFixed(1)} KB, type: ${file.type || "unknown"})`);
    console.log(`[AUTH] Authenticated user ID verified: ${authenticatedUserId}`);

    setSelectedFile(file);
    setErrorMessage(null);
    setStage("uploading");

    const statementId = crypto.randomUUID();
    const isPDF = file.name.toLowerCase().endsWith(".pdf") || file.type === "application/pdf";

    try {
      // 2. [STATEMENT CREATED]
      const initialStatement: Statement = {
        id: statementId,
        user_id: authenticatedUserId,
        file_name: file.name,
        file_type: isPDF ? "pdf" : "csv",
        uploaded_at: new Date().toISOString(),
        processing_status: "processing",
        created_at: new Date().toISOString(),
      };

      console.log(`[STATEMENT CREATED] Persisting initial statement record: ID=${statementId}, User=${authenticatedUserId}, Status=processing`);
      await saveStatement(initialStatement);

      setStage("reading");

      // 3. [EXTRACTION VIA API]
      const formData = new FormData();
      formData.append("file", file);
      formData.append("userId", authenticatedUserId);
      formData.append("statementId", statementId);

      setStage("extracting");
      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();

      if (!res.ok || data.error) {
        throw new Error(data.error || "Failed to process the statement. Please check file format.");
      }

      const extractedCount = data.transactions?.length || 0;
      console.log(`[EXTRACTION COMPLETE] Statement ID: ${statementId}, Extracted transactions: ${extractedCount}`);

      setStage("cleaning");
      console.log(`[TRANSACTIONS NORMALIZED] Normalized transaction count: ${extractedCount}`);

      setStage("categorizing");

      // 4. [TRANSACTIONS INSERTED]
      setStage("calculating");
      console.log(`[TRANSACTIONS INSERTED] Persisting ${extractedCount} transactions for statement ID: ${statementId}, user ID: ${authenticatedUserId}`);
      const insertedCount = await saveTransactionsBatch(data.transactions);
      setParsedCount(insertedCount);

      // 5. [ANALYTICS COMPLETE]
      const summary = calculateFinancialSummary(data.transactions);
      const categories = calculateCategorySpending(data.transactions);
      const reducible = detectPotentiallyReducibleSpending(data.transactions);
      const recurring = detectRecurringPayments(data.transactions);
      console.log(`[ANALYTICS COMPLETE] Statement ID: ${statementId}, Total income: ₹${summary.totalIncome}, Total expenses: ₹${summary.totalExpenses}, Categories: ${categories.length}`);

      // 6. [AI ANALYSIS COMPLETE]
      setStage("generating");
      try {
        await fetch("/api/ai/insights", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ summary, categories, reducible, recurring }),
        });
        console.log(`[AI ANALYSIS COMPLETE] Background AI insights generated`);
      } catch (aiErr) {
        console.warn("[AI ANALYSIS] AI insights generation note:", aiErr);
      }

      // 7. [PROCESSING COMPLETE]
      await updateStatementStatus(statementId, "completed", {
        period_start: data.periodStart || data.statement?.period_start,
        period_end: data.periodEnd || data.statement?.period_end,
        transaction_count: insertedCount,
        total_spend: summary.totalExpenses,
      });
      console.log(`[PROCESSING COMPLETE] Statement ID: ${statementId}, User ID: ${authenticatedUserId}, Extracted transactions: ${extractedCount}, Inserted transactions: ${insertedCount}, Processing status: completed`);

      // 8. DASHBOARD REDIRECT (Await completely before navigating!)
      setStage("complete");
      router.refresh();
      router.push("/dashboard");
    } catch (err: unknown) {
      console.error("[PIPELINE ERROR] Statement processing failed:", err);
      // Mark statement as failed in database to preserve state
      try {
        await updateStatementStatus(statementId, "failed");
        console.log(`[PROCESSING STATUS UPDATE] Statement ID: ${statementId} marked as failed due to error.`);
      } catch (statusErr) {
        console.error("[PIPELINE ERROR] Could not mark statement as failed:", statusErr);
      }
      setStage("error");
      setErrorMessage(
        err instanceof Error
          ? err.message
          : "An error occurred during statement processing. Please try again."
      );
    }
  };

  const loadSampleStatement = async (type: "phonepe" | "hdfc") => {
    try {
      const res = await fetch(`/api/sample/download?type=${type}`);
      const blob = await res.blob();
      const filename = type === "hdfc" ? "HDFC_Sample_Statement.csv" : "PhonePe_Sample_Statement.csv";
      const sampleFile = new File([blob], filename, { type: "text/csv" });
      checkPrivacyAndProcess(sampleFile);
    } catch {
      setErrorMessage("Could not load sample file.");
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <PrivacyNoticeModal isOpen={showPrivacyModal} onAccept={handlePrivacyAccept} />

      {/* Upload Zone */}
      <div
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        className={`glass-panel border-2 border-dashed rounded-3xl p-8 sm:p-12 text-center transition-all ${
          stage === "idle" || stage === "error"
            ? "border-slate-700/80 hover:border-emerald-500/50 bg-[#0C111E]/70"
            : "border-emerald-500/60 bg-[#0E1526]"
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf,.csv,text/csv,application/pdf"
          onChange={handleFileChange}
          className="hidden"
          id="statement-file-input"
        />

        {stage === "idle" && (
          <div className="space-y-4">
            <div className="w-16 h-16 mx-auto rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 group-hover:scale-105 transition-transform">
              <UploadCloud className="w-8 h-8" />
            </div>

            <div className="space-y-1.5">
              <h3 className="text-lg font-bold text-white">
                Drop your statement here
              </h3>
              <p className="text-xs text-slate-400 max-w-md mx-auto">
                Supports official digital PDF or CSV e-statements from PhonePe, Google Pay, Paytm, HDFC, SBI, ICICI, and major Indian banks.
              </p>
            </div>

            <div className="pt-2">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="px-6 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs shadow-lg shadow-emerald-500/20 transition-all cursor-pointer"
              >
                Browse Files
              </button>
            </div>

            <div className="flex items-center justify-center gap-4 text-[11px] text-slate-500 pt-3">
              <span className="flex items-center gap-1">
                <FileText className="w-3.5 h-3.5 text-slate-400" /> PDF (Digital)
              </span>
              <span>•</span>
              <span className="flex items-center gap-1">
                <FileSpreadsheet className="w-3.5 h-3.5 text-slate-400" /> CSV Statements
              </span>
              <span>•</span>
              <span className="flex items-center gap-1">
                <Shield className="w-3.5 h-3.5 text-emerald-400" /> Max 15MB
              </span>
            </div>
          </div>
        )}

        {/* Processing Stages State */}
        {stage !== "idle" && stage !== "error" && (
          <div className="space-y-6 max-w-md mx-auto py-4">
            <div className="flex items-center justify-center">
              <div className="w-14 h-14 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                {stage === "complete" ? (
                  <CheckCircle className="w-8 h-8 text-emerald-400 animate-bounce" />
                ) : (
                  <Loader2 className="w-8 h-8 animate-spin" />
                )}
              </div>
            </div>

            <div className="space-y-1 text-center">
              <div className="text-sm font-bold text-white">
                {selectedFile?.name || "Processing Statement"}
              </div>
              <div className="text-xs text-emerald-400 font-medium">
                {STAGES.find((s) => s.id === stage)?.label || "Analyzing transactions..."}
              </div>
            </div>

            {/* Stepper */}
            <div className="space-y-2 text-left bg-slate-950/60 p-4 rounded-xl border border-slate-800">
              {STAGES.map((s, idx) => {
                const stageIdx = STAGES.findIndex((st) => st.id === stage);
                const isDone = stageIdx > idx || stage === "complete";
                const isCurrent = s.id === stage;

                return (
                  <div key={s.id} className="flex items-center gap-2.5 text-xs">
                    {isDone ? (
                      <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
                    ) : isCurrent ? (
                      <span className="w-4 h-4 rounded-full border-2 border-emerald-400 border-t-transparent animate-spin shrink-0" />
                    ) : (
                      <span className="w-4 h-4 rounded-full border border-slate-700 shrink-0" />
                    )}
                    <span
                      className={`${
                        isDone
                          ? "text-slate-400"
                          : isCurrent
                          ? "text-white font-semibold"
                          : "text-slate-600"
                      }`}
                    >
                      {s.label}
                    </span>
                  </div>
                );
              })}
            </div>

            {stage === "complete" && (
              <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-xs text-emerald-300">
                Successfully categorized {parsedCount} transactions! Launching command center...
              </div>
            )}
          </div>
        )}

        {/* Error State */}
        {stage === "error" && (
          <div className="space-y-4 max-w-md mx-auto py-2">
            <div className="w-12 h-12 rounded-xl bg-rose-500/15 border border-rose-500/30 flex items-center justify-center text-rose-400 mx-auto">
              <AlertCircle className="w-6 h-6" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-white mb-1">Statement Processing Failed</h4>
              <p className="text-xs text-rose-300 leading-relaxed bg-rose-500/10 p-3 rounded-xl border border-rose-500/20">
                {errorMessage}
              </p>
            </div>
            <button
              onClick={() => setStage("idle")}
              className="px-5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold transition-colors"
            >
              Try Another File
            </button>
          </div>
        )}
      </div>

      {/* Pre-packaged Realistic Indian Sample Statements for immediate testing */}
      <div className="glass-panel rounded-2xl p-5 border border-[#1E2638]">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300">
              Don&apos;t have a statement handy? Test with verified sample statements
            </h4>
            <p className="text-[11px] text-slate-400">
              Instant test statements with realistic PhonePe and HDFC bank UPI transactions.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
          <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800 hover:border-emerald-500/30 transition-colors flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                <FileSpreadsheet className="w-4 h-4" />
              </div>
              <div>
                <div className="text-xs font-semibold text-white">PhonePe UPI Statement</div>
                <div className="text-[10px] text-slate-400">Swiggy, Zepto, Uber, Bills (CSV)</div>
              </div>
            </div>
            <button
              onClick={() => loadSampleStatement("phonepe")}
              disabled={stage !== "idle" && stage !== "error"}
              className="text-xs font-semibold text-emerald-400 hover:text-emerald-300 px-3 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 hover:border-emerald-500/40 transition-colors"
            >
              Analyze →
            </button>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800 hover:border-emerald-500/30 transition-colors flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
                <FileSpreadsheet className="w-4 h-4" />
              </div>
              <div>
                <div className="text-xs font-semibold text-white">HDFC Bank Statement</div>
                <div className="text-[10px] text-slate-400">Salary, Rent, Amazon, SIP (CSV)</div>
              </div>
            </div>
            <button
              onClick={() => loadSampleStatement("hdfc")}
              disabled={stage !== "idle" && stage !== "error"}
              className="text-xs font-semibold text-blue-400 hover:text-blue-300 px-3 py-1.5 rounded-lg bg-blue-500/10 border border-blue-500/20 hover:border-blue-500/40 transition-colors"
            >
              Analyze →
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
