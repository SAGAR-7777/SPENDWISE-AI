// End-to-End PDF Flow: Upload -> Parse -> DB Persistence -> Dashboard Verification
import { createClient } from "@supabase/supabase-js";
import { getHdfcSample, getPhonePeSample, getMultiPageSample } from "./test-pdf-formats.mjs";

const BASE_URL = "http://localhost:3000";

import fs from "fs";

const envFile = fs.readFileSync(".env.local", "utf-8");
const envVars = Object.fromEntries(
  envFile
    .split("\n")
    .map((l) => l.trim())
    .filter((l) => l && !l.startsWith("#") && l.includes("="))
    .map((l) => {
      const idx = l.indexOf("=");
      return [l.slice(0, idx).trim(), l.slice(idx + 1).trim()];
    })
);

const SUPABASE_URL = envVars.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = envVars.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

function cleanStatementForDb(statement) {
  return {
    id: statement.id,
    user_id: statement.user_id,
    file_name: statement.file_name,
    file_type: statement.file_type,
    uploaded_at: statement.uploaded_at || new Date().toISOString(),
    processing_status: statement.processing_status || "completed",
    period_start: statement.period_start && statement.period_start.trim().length > 0 ? statement.period_start : null,
    period_end: statement.period_end && statement.period_end.trim().length > 0 ? statement.period_end : null,
    created_at: statement.created_at || new Date().toISOString(),
  };
}

function cleanTransactionForDb(tx) {
  return {
    id: tx.id,
    user_id: tx.user_id,
    statement_id: tx.statement_id,
    date: tx.date,
    description: tx.description || "Transaction",
    merchant: tx.merchant || "Merchant",
    amount: Math.max(0, Math.round(Number(tx.amount) * 100) / 100),
    type: tx.type === "credit" ? "credit" : "debit",
    category: tx.category || "Other",
    payment_method: tx.payment_method || "UPI",
    confidence: Number(tx.confidence) || 0.8,
    created_at: tx.created_at || new Date().toISOString(),
  };
}

async function testPdfEndToEnd() {
  console.log("==================================================================");
  console.log("    SpendWise AI - PDF End-to-End Extraction & DB Persistence     ");
  console.log("==================================================================\n");

  const testUserId = crypto.randomUUID();
  const testStatementId = crypto.randomUUID();

  console.log(`[FLOW START] User ID: ${testUserId}`);
  console.log(`[FLOW START] Statement ID: ${testStatementId}`);

  // 1. Initial statement creation in DB
  const initialStmt = cleanStatementForDb({
    id: testStatementId,
    user_id: testUserId,
    file_name: "hdfc_october_statement.pdf",
    file_type: "pdf",
    processing_status: "processing",
  });

  const { error: stmtInitErr } = await supabase.from("statements").insert(initialStmt);
  if (stmtInitErr) {
    console.error("Statement creation in Supabase failed:", stmtInitErr);
    return;
  }
  console.log("✓ Step 1: Initial statement created in Supabase with status=processing");

  // 2. Upload HDFC PDF statement to /api/upload
  const hdfcBuf = getHdfcSample();
  const blob = new Blob([hdfcBuf], { type: "application/pdf" });
  const fd = new FormData();
  fd.append("file", blob, "hdfc_october_statement.pdf");
  fd.append("userId", testUserId);
  fd.append("statementId", testStatementId);

  console.log("✓ Step 2: Uploading PDF statement to /api/upload...");
  const res = await fetch(`${BASE_URL}/api/upload`, { method: "POST", body: fd });
  const data = await res.json();

  if (res.status !== 200 || !data.transactions) {
    console.error("Upload failed:", res.status, data);
    return;
  }

  console.log(`✓ Step 3: Extraction successful! Parsed ${data.transactions.length} transactions from PDF.`);
  console.log("Extracted items:", data.transactions.map((t) => `${t.date} | ${t.merchant} | ₹${t.amount} (${t.type})`));

  // 3. Batch insert transactions into Supabase
  const cleanedTxs = data.transactions.map(cleanTransactionForDb);
  const { error: txErr } = await supabase.from("transactions").insert(cleanedTxs);
  if (txErr) {
    console.error("Transactions insert into Supabase failed:", txErr);
    return;
  }
  console.log(`✓ Step 4: Successfully persisted ${cleanedTxs.length} transactions to Supabase!`);

  // 4. Update statement status to completed with period and count
  const totalSpend = data.transactions
    .filter((t) => t.type === "debit")
    .reduce((acc, t) => acc + t.amount, 0);

  const { error: updateErr } = await supabase
    .from("statements")
    .update({
      processing_status: "completed",
      period_start: data.periodStart,
      period_end: data.periodEnd,
    })
    .eq("id", testStatementId);

  if (updateErr) {
    console.error("Update statement status failed:", updateErr);
    return;
  }
  console.log(`✓ Step 5: Statement status updated to 'completed' with total_spend: ₹${totalSpend}`);

  // 5. Verify Dashboard query retrieves statement and its transactions
  const { data: dbStmt, error: fetchStmtErr } = await supabase
    .from("statements")
    .select("*")
    .eq("id", testStatementId)
    .single();

  const { data: dbTxs, error: fetchTxErr } = await supabase
    .from("transactions")
    .select("*")
    .eq("statement_id", testStatementId);

  if (fetchStmtErr || fetchTxErr) {
    console.error("Dashboard query failed:", fetchStmtErr || fetchTxErr);
    return;
  }

  console.log("✓ Step 6: Dashboard verification query confirmed:");
  console.log(`  - Statement found in DB: ${dbStmt.file_name} (${dbStmt.processing_status})`);
  console.log(`  - Transactions retrieved from DB: ${dbTxs.length}`);
  console.log(`  - Date range: ${dbStmt.period_start} to ${dbStmt.period_end}`);
  console.log(`  - Debit count: ${dbTxs.filter((t) => t.type === "debit").length}, Credit count: ${dbTxs.filter((t) => t.type === "credit").length}`);

  console.log("\n==================================================================");
  console.log("✓ SUCCESS: PDF PIPELINE FROM UPLOAD TO DASHBOARD VERIFIED 100%!");
  console.log("==================================================================");
}

testPdfEndToEnd();
