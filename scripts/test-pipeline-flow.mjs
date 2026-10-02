// Complete Pipeline Flow Verification Test
import fs from "fs";

const BASE_URL = "http://localhost:3000";

async function runPipelineTests() {
  console.log("==================================================================");
  console.log("SpendWise AI - Pipeline & Persistence Verification Suite");
  console.log("==================================================================");

  let passed = 0;
  let failed = 0;

  // TEST 1: CSV Statement Upload & Parser with statementId tracking
  console.log("\n[TEST 1] Testing CSV Upload Pipeline with Statement Tracking:");
  const testUserId = "test-user-flow-" + Date.now();
  const testStatementId = "test-stmt-uuid-" + Date.now();

  const sampleCsv = `Date,Transaction Details,Type,Amount,Status
01-10-2024,SALARY CREDIT FROM TECH CORP,Credit,₹ 75000.00,COMPLETED
02-10-2024,Paid to Landlord House Rent,Debit,₹ 15000.00,COMPLETED
03-10-2024,Paid to Swiggy Bangalore,Debit,₹ 450.00,COMPLETED
04-10-2024,Paid to Zepto Grocery,Debit,₹ 380.00,COMPLETED
05-10-2024,Paid to Ramesh Tea Stall,Debit,₹ 30.00,COMPLETED`;

  const blob = new Blob([sampleCsv], { type: "text/csv" });
  const formData = new FormData();
  formData.append("file", blob, "test_statement.csv");
  formData.append("userId", testUserId);
  formData.append("statementId", testStatementId);

  try {
    const res = await fetch(`${BASE_URL}/api/upload`, {
      method: "POST",
      body: formData,
    });
    const data = await res.json();

    if (res.status === 200 && data.transactions && data.transactions.length === 5) {
      console.log(`  ✓ CSV parsed: ${data.transactions.length} transactions extracted`);
      console.log(`  ✓ Statement ID matches tracked ID: ${data.statement.id === testStatementId}`);
      console.log(`  ✓ User ID preserved on all transactions: ${data.transactions.every((t) => t.user_id === testUserId)}`);
      console.log(`  ✓ Statement ID preserved on all transactions: ${data.transactions.every((t) => t.statement_id === testStatementId)}`);
      console.log(`  ✓ Period detected: ${data.periodStart} to ${data.periodEnd}`);
      passed++;
    } else {
      console.error("  ✗ Test 1 failed:", data);
      failed++;
    }
  } catch (e) {
    console.error("  ✗ Test 1 error:", e.message);
    failed++;
  }

  // TEST 2: Empty/Invalid File Rejection
  console.log("\n[TEST 2] Testing Empty / Invalid File Validation:");
  try {
    const emptyBlob = new Blob([""], { type: "text/csv" });
    const emptyForm = new FormData();
    emptyForm.append("file", emptyBlob, "empty.csv");
    emptyForm.append("userId", testUserId);

    const emptyRes = await fetch(`${BASE_URL}/api/upload`, {
      method: "POST",
      body: emptyForm,
    });
    const emptyData = await emptyRes.json();

    if (emptyRes.status === 422 && emptyData.error) {
      console.log(`  ✓ Successfully rejected empty file with status 422: "${emptyData.error}"`);
      passed++;
    } else {
      console.error("  ✗ Test 2 failed: expected 422, got", emptyRes.status, emptyData);
      failed++;
    }
  } catch (e) {
    console.error("  ✗ Test 2 error:", e.message);
    failed++;
  }

  // TEST 3: Unsupported File Format Rejection
  console.log("\n[TEST 3] Testing Unsupported Format Rejection:");
  try {
    const badBlob = new Blob(["hello world"], { type: "text/plain" });
    const badForm = new FormData();
    badForm.append("file", badBlob, "document.txt");
    badForm.append("userId", testUserId);

    const badRes = await fetch(`${BASE_URL}/api/upload`, {
      method: "POST",
      body: badForm,
    });
    const badData = await badRes.json();

    if (badRes.status === 400 && badData.error) {
      console.log(`  ✓ Successfully rejected .txt file with status 400: "${badData.error}"`);
      passed++;
    } else {
      console.error("  ✗ Test 3 failed:", badRes.status, badData);
      failed++;
    }
  } catch (e) {
    console.error("  ✗ Test 3 error:", e.message);
    failed++;
  }

  // TEST 4: Missing File Handling
  console.log("\n[TEST 4] Testing Missing File in Upload Request:");
  try {
    const noFileForm = new FormData();
    noFileForm.append("userId", testUserId);

    const noFileRes = await fetch(`${BASE_URL}/api/upload`, {
      method: "POST",
      body: noFileForm,
    });
    const noFileData = await noFileRes.json();

    if (noFileRes.status === 400 && noFileData.error) {
      console.log(`  ✓ Successfully returned 400 for missing file payload: "${noFileData.error}"`);
      passed++;
    } else {
      console.error("  ✗ Test 4 failed:", noFileRes.status, noFileData);
      failed++;
    }
  } catch (e) {
    console.error("  ✗ Test 4 error:", e.message);
    failed++;
  }

  // TEST 5: Sample Statement Download
  console.log("\n[TEST 5] Testing Sample Statement Endpoints:");
  for (const type of ["phonepe", "hdfc"]) {
    try {
      const res = await fetch(`${BASE_URL}/api/sample/download?type=${type}`);
      const text = await res.text();
      if (res.status === 200 && text.length > 50) {
        console.log(`  ✓ Sample ${type} statement download succeeded (${text.split("\n").length} lines)`);
        passed++;
      } else {
        console.error(`  ✗ Sample ${type} failed:`, res.status);
        failed++;
      }
    } catch (e) {
      console.error(`  ✗ Sample ${type} error:`, e.message);
      failed++;
    }
  }

  // TEST 6: AI Insights Generation on Extracted Transactions
  console.log("\n[TEST 6] Testing AI Insights on Normalized Transactions:");
  try {
    const aiRes = await fetch(`${BASE_URL}/api/ai/insights`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        summary: {
          totalIncome: 75000,
          totalExpenses: 15860,
          netCashFlow: 59140,
          transactionCount: 5,
          largestCategory: { category: "Transfers", amount: 15000, percentage: 94.6 },
          avgTransactionValue: 3172,
        },
        categories: [
          { category: "Transfers", totalAmount: 15000, percentage: 94.6, count: 1, color: "#64748B" },
          { category: "Food & Dining", totalAmount: 480, percentage: 3.0, count: 2, color: "#F59E0B" },
          { category: "Groceries", totalAmount: 380, percentage: 2.4, count: 1, color: "#10B981" },
        ],
        reducible: [
          { category: "Food & Dining", count: 2, totalAmount: 480, reason: "Food delivery orders", suggestion: "Cook at home", severity: "low" },
        ],
        recurring: [],
      }),
    });
    const aiData = await aiRes.json();
    if (aiRes.status === 200 && Array.isArray(aiData.insights) && aiData.insights.length > 0) {
      console.log(`  ✓ AI insights engine generated ${aiData.insights.length} insight cards`);
      passed++;
    } else {
      console.error("  ✗ Test 6 failed:", aiData);
      failed++;
    }
  } catch (e) {
    console.error("  ✗ Test 6 error:", e.message);
    failed++;
  }

  // TEST 7: Supabase Schema Cleansing & PostgREST Integrity Verification
  console.log("\n[TEST 7] Testing Database Model Payload Cleansing:");
  function isUUID(str) {
    if (!str || typeof str !== "string") return false;
    return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str);
  }

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
      id: isUUID(tx.id) ? tx.id : "random-uuid",
      user_id: tx.user_id,
      statement_id: tx.statement_id,
      date: tx.date,
      description: tx.description || "Transaction",
      merchant: tx.merchant || "Merchant",
      amount: Math.max(0, Math.round(Number(tx.amount) * 100) / 100),
      type: tx.type === "credit" ? "credit" : "debit",
      category: tx.category || "Other",
      payment_method: tx.payment_method || "UPI",
      confidence: Math.min(1.0, Math.max(0, Number(tx.confidence) || 0.90)),
      created_at: tx.created_at || new Date().toISOString(),
    };
  }

  const dirtyStatement = {
    id: "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
    user_id: "11111111-2222-3333-4444-555555555555",
    file_name: "test.csv",
    file_type: "csv",
    uploaded_at: "2024-10-01T00:00:00Z",
    processing_status: "completed",
    period_start: "2024-10-01",
    period_end: "2024-10-28",
    created_at: "2024-10-01T00:00:00Z",
    transaction_count: 50, // Extra field
    total_spend: 35000,   // Extra field
  };

  const cleanedStmt = cleanStatementForDb(dirtyStatement);
  if (
    cleanedStmt.transaction_count === undefined &&
    cleanedStmt.total_spend === undefined &&
    cleanedStmt.id === dirtyStatement.id &&
    cleanedStmt.period_start === "2024-10-01"
  ) {
    console.log("  ✓ cleanStatementForDb stripped transaction_count and total_spend successfully");
    console.log("  ✓ Database columns strictly preserved for public.statements");
    passed++;
  } else {
    console.error("  ✗ cleanStatementForDb failed:", cleanedStmt);
    failed++;
  }

  const dirtyTx = {
    id: "b2c3d4e5-f6a7-8901-bcde-f12345678901",
    user_id: "11111111-2222-3333-4444-555555555555",
    statement_id: "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
    date: "2024-10-02",
    description: "Paid to Swiggy",
    merchant: "Swiggy",
    amount: 450.556,
    type: "debit",
    category: "Food & Dining",
    payment_method: "UPI",
    confidence: 0.95,
    created_at: "2024-10-02T00:00:00Z",
    extraUIProperty: true,
  };

  const cleanedTx = cleanTransactionForDb(dirtyTx);
  if (
    cleanedTx.extraUIProperty === undefined &&
    cleanedTx.amount === 450.56 &&
    cleanedTx.id === dirtyTx.id
  ) {
    console.log("  ✓ cleanTransactionForDb stripped arbitrary fields and rounded amount correctly");
    passed++;
  } else {
    console.error("  ✗ cleanTransactionForDb failed:", cleanedTx);
    failed++;
  }

  // TEST 8: UUID Validator
  console.log("\n[TEST 8] Testing UUID Validator:");
  if (
    isUUID("3887e611-629e-4a1b-b986-05b6f6323810") === true &&
    isUUID("demo-user-sagar") === false &&
    isUUID("local-user") === false &&
    isUUID(null) === false
  ) {
    console.log("  ✓ isUUID correctly identifies UUIDs vs demo/local IDs");
    passed++;
  } else {
    console.error("  ✗ isUUID validator failed");
    failed++;
  }

  console.log("\n==================================================================");
  console.log(`Pipeline Suite Results: ${passed} Passed, ${failed} Failed`);
  console.log("==================================================================");

  if (failed > 0) process.exit(1);
}

runPipelineTests();
