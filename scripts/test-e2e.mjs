// E2E Verification Script for SpendWise AI
import fs from "fs";

const BASE_URL = "http://localhost:3000";

async function runTests() {
  console.log("==================================================");
  console.log("SpendWise AI - Automated E2E Verification Testing");
  console.log("==================================================");

  let passed = 0;
  let failed = 0;

  // 1. Test Static & Dynamic Pages
  const pages = [
    "/",
    "/dashboard",
    "/upload",
    "/transactions",
    "/analytics",
    "/where-did-my-money-go",
    "/recurring",
    "/budget",
    "/report",
    "/settings",
    "/login",
    "/signup",
    "/reset-password",
  ];

  console.log("\n1. Verifying Application Routes:");
  for (const page of pages) {
    try {
      const res = await fetch(`${BASE_URL}${page}`);
      if (res.status === 200) {
        console.log(`  ✓ [200 OK] ${page}`);
        passed++;
      } else {
        console.error(`  ✗ [${res.status}] ${page}`);
        failed++;
      }
    } catch (e) {
      console.error(`  ✗ Failed to fetch ${page}:`, e.message);
      failed++;
    }
  }

  // 2. Test Sample Statement Download Route
  console.log("\n2. Verifying Sample Statement Download API:");
  try {
    const res = await fetch(`${BASE_URL}/api/sample/download?type=phonepe`);
    const text = await res.text();
    if (res.status === 200 && text.includes("Date,Transaction Details,Type,Amount")) {
      console.log(`  ✓ Sample PhonePe CSV Download API returned valid CSV (${text.split("\n").length} rows)`);
      passed++;
    } else {
      console.error(`  ✗ Unexpected download response: ${res.status}`);
      failed++;
    }
  } catch (e) {
    console.error(`  ✗ Download API error:`, e.message);
    failed++;
  }

  // 3. Test Statement Ingestion & Parser API
  console.log("\n3. Verifying Statement Ingestion & Categorization Engine:");
  let uploadedTransactions = [];
  let summaryPayload = {};
  try {
    const sampleCsv = `Date,Transaction Details,Type,Amount,Status
01-10-2024,SALARY CREDIT FROM ACME SYSTEMS,Credit,₹ 68000.00,COMPLETED
02-10-2024,Paid to House Rent Landlord,Debit,₹ 14000.00,COMPLETED
03-10-2024,Paid to BESCOM Electricity,Debit,₹ 1350.00,COMPLETED
04-10-2024,Paid to Zepto Quick Commerce,Debit,₹ 460.00,COMPLETED
05-10-2024,Paid to Swiggy Bangalore,Debit,₹ 380.00,COMPLETED
06-10-2024,Paid to Uber India Systems,Debit,₹ 290.00,COMPLETED
08-10-2024,Paid to Netflix Subscription,Debit,₹ 499.00,COMPLETED
09-10-2024,Paid to Ramesh Tea Stall,Debit,₹ 30.00,COMPLETED
11-10-2024,Paid to Ramesh Tea Stall,Debit,₹ 40.00,COMPLETED
12-10-2024,Paid to Blinkit Grocery,Debit,₹ 820.00,COMPLETED
14-10-2024,Paid to Spotify India,Debit,₹ 119.00,COMPLETED
15-10-2024,Paid to Zomato Food Delivery,Debit,₹ 580.00,COMPLETED
17-10-2024,Paid to Amazon Seller Services,Debit,₹ 3200.00,COMPLETED
19-10-2024,Paid to ACT Broadband Internet,Debit,₹ 943.00,COMPLETED
20-10-2024,Paid to Ola Cabs Prime,Debit,₹ 410.00,COMPLETED
22-10-2024,Paid to Ramesh Tea Stall,Debit,₹ 50.00,COMPLETED
24-10-2024,Paid to Apollo Pharmacy,Debit,₹ 760.00,COMPLETED
25-10-2024,Paid to Decathlon Sports,Debit,₹ 1850.00,COMPLETED
27-10-2024,Paid to YouTube Premium Family,Debit,₹ 189.00,COMPLETED
28-10-2024,Paid to BigBasket Supermarket,Debit,₹ 2150.00,COMPLETED`;

    const blob = new Blob([sampleCsv], { type: "text/csv" });
    const formData = new FormData();
    formData.append("file", blob, "test_phonepe_statement.csv");
    formData.append("userId", "test-user-e2e");

    const uploadRes = await fetch(`${BASE_URL}/api/upload`, {
      method: "POST",
      body: formData,
    });

    const uploadData = await uploadRes.json();
    if (uploadRes.status === 200 && uploadData.transactions?.length > 0) {
      console.log(`  ✓ Ingestion Success: Parsed ${uploadData.transactions.length} normalized transactions`);
      console.log(`  ✓ Sample Categorizations:`);
      uploadData.transactions.slice(0, 5).forEach((t) => {
        console.log(`    - ${t.merchant}: ₹${t.amount} [Category: ${t.category}, Conf: ${(t.confidence * 100).toFixed(0)}%]`);
      });
      uploadedTransactions = uploadData.transactions;
      passed++;
    } else {
      console.error(`  ✗ Ingestion failed:`, uploadData);
      failed++;
    }
  } catch (e) {
    console.error(`  ✗ Upload test failed:`, e.message);
    failed++;
  }

  // 4. Test Server-side Groq AI Insights API
  console.log("\n4. Verifying Server-side Groq AI Insights Engine:");
  try {
    const summary = {
      totalIncome: 68000,
      totalExpenses: 27120,
      netCashFlow: 40880,
      transactionCount: 20,
      largestCategory: { category: "Transfers", amount: 14000, percentage: 51.6 },
      avgTransactionValue: 1427,
    };
    const categories = [
      { category: "Transfers", totalAmount: 14000, percentage: 51.6, count: 1, color: "#64748B" },
      { category: "Shopping", totalAmount: 5050, percentage: 18.6, count: 2, color: "#EC4899" },
      { category: "Groceries", totalAmount: 3430, percentage: 12.6, count: 3, color: "#10B981" },
      { category: "Bills & Utilities", totalAmount: 2293, percentage: 8.5, count: 2, color: "#8B5CF6" },
      { category: "Food & Dining", totalAmount: 1080, percentage: 4.0, count: 5, color: "#F59E0B" },
    ];
    const reducible = [
      {
        category: "Food & Dining",
        count: 5,
        totalAmount: 1080,
        reason: "5 food delivery orders totaling ₹1,080",
        suggestion: "Batching deliveries can preserve ₹500 monthly",
        severity: "medium",
      },
    ];
    const recurring = [
      {
        merchant: "Netflix",
        category: "Subscriptions",
        frequency: "Monthly",
        approximateAmount: 499,
        lastTransactionDate: "2024-10-08",
        transactionCount: 1,
        estimatedMonthlyCost: 499,
        confidence: 0.95,
        isCertain: true,
      },
    ];

    const aiRes = await fetch(`${BASE_URL}/api/ai/insights`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ summary, categories, reducible, recurring }),
    });

    const aiData = await aiRes.json();
    if (aiRes.status === 200 && Array.isArray(aiData.insights) && aiData.insights.length > 0) {
      console.log(`  ✓ Groq AI returned ${aiData.insights.length} verified insight cards:`);
      aiData.insights.forEach((card) => {
        console.log(`    - [${card.tag}] ${card.title}: "${card.highlight}"`);
      });
      passed++;
    } else {
      console.error(`  ✗ AI insights returned unexpected data:`, aiData);
      failed++;
    }
  } catch (e) {
    console.error(`  ✗ AI insights test failed:`, e.message);
    failed++;
  }

  // 5. Test Interactive Ask SpendWise AI Detective API
  console.log("\n5. Verifying Ask SpendWise AI (Natural Language Detective):");
  try {
    const askRes = await fetch(`${BASE_URL}/api/ai/ask`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        query: "Where did most of my money go and what are my recurring subscriptions?",
        summary: {
          totalIncome: 68000,
          totalExpenses: 27120,
          netCashFlow: 40880,
          transactionCount: 20,
          largestCategory: { category: "Transfers", amount: 14000, percentage: 51.6 },
          avgTransactionValue: 1427,
        },
        categories: [
          { category: "Transfers", totalAmount: 14000, percentage: 51.6, count: 1, color: "#64748B" },
          { category: "Shopping", totalAmount: 5050, percentage: 18.6, count: 2, color: "#EC4899" },
        ],
        topMerchants: [
          { merchant: "House Rent Landlord", totalAmount: 14000, count: 1, category: "Transfers" },
          { merchant: "Amazon", totalAmount: 3200, count: 1, category: "Shopping" },
        ],
        reducible: [],
        recurring: [
          { merchant: "Netflix", category: "Subscriptions", approximateAmount: 499, frequency: "Monthly" },
          { merchant: "Spotify", category: "Subscriptions", approximateAmount: 119, frequency: "Monthly" },
        ],
        recentTransactions: [],
      }),
    });

    const askData = await askRes.json();
    if (askRes.status === 200 && askData.answer) {
      console.log(`  ✓ Groq LLM Assistant responded successfully:`);
      console.log(`    Preview: "${askData.answer.slice(0, 160)}..."`);
      passed++;
    } else {
      console.error(`  ✗ Ask AI failed:`, askData);
      failed++;
    }
  } catch (e) {
    console.error(`  ✗ Ask AI test failed:`, e.message);
    failed++;
  }

  console.log("\n==================================================");
  console.log(`E2E Verification Complete: ${passed} Passed, ${failed} Failed`);
  console.log("==================================================");

  if (failed > 0) {
    process.exit(1);
  }
}

runTests();
