// Comprehensive test suite for SpendWise AI PDF & CSV Statement Pipelines
import fs from "fs";

const BASE_URL = "http://localhost:3000";

// Helper to create a single-page or multi-page PDF 1.4 with text streams
export function generateTestPdf(pages) {
  let objIndex = 1;
  const catalogObj = objIndex++;
  const pagesObj = objIndex++;
  const fontObj = objIndex++;

  const pageObjIds = [];
  const contentObjIds = [];

  for (let i = 0; i < pages.length; i++) {
    pageObjIds.push(objIndex++);
    contentObjIds.push(objIndex++);
  }

  let pdf = `%PDF-1.4\n`;
  const offsets = {};

  // Catalog
  offsets[catalogObj] = pdf.length;
  pdf += `${catalogObj} 0 obj\n<< /Type /Catalog /Pages ${pagesObj} 0 R >>\nendobj\n`;

  // Pages
  offsets[pagesObj] = pdf.length;
  pdf += `${pagesObj} 0 obj\n<< /Type /Pages /Kids [${pageObjIds.map((id) => `${id} 0 R`).join(" ")}] /Count ${pages.length} >>\nendobj\n`;

  // Font
  offsets[fontObj] = pdf.length;
  pdf += `${fontObj} 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>\nendobj\n`;

  // Each page and its content
  for (let i = 0; i < pages.length; i++) {
    const pId = pageObjIds[i];
    const cId = contentObjIds[i];
    const lines = pages[i];

    let stream = "BT\n/F1 11 Tf\n50 750 Td\n";
    for (const line of lines) {
      const safeLine = line.replace(/\\/g, "\\\\").replace(/\(/g, "\\(").replace(/\)/g, "\\)");
      stream += `(${safeLine}) Tj\n0 -20 Td\n`;
    }
    stream += "ET\n";

    offsets[pId] = pdf.length;
    pdf += `${pId} 0 obj\n<< /Type /Page /Parent ${pagesObj} 0 R /MediaBox [0 0 612 792] /Contents ${cId} 0 R /Resources << /Font << /F1 ${fontObj} 0 R >> >> >>\nendobj\n`;

    offsets[cId] = pdf.length;
    pdf += `${cId} 0 obj\n<< /Length ${stream.length} >>\nstream\n${stream}endstream\nendobj\n`;
  }

  const startXref = pdf.length;
  pdf += `xref\n0 ${objIndex}\n0000000000 65535 f \n`;
  for (let i = 1; i < objIndex; i++) {
    const off = String(offsets[i]).padStart(10, "0");
    pdf += `${off} 00000 n \n`;
  }
  pdf += `trailer\n<< /Size ${objIndex} /Root ${catalogObj} 0 R >>\nstartxref\n${startXref}\n%%EOF`;

  return Buffer.from(pdf);
}

// Password-protected PDF mock (encrypted dict)
export function generateEncryptedPdf() {
  const content = `%PDF-1.4
1 0 obj << /Type /Catalog /Pages 2 0 R >> endobj
2 0 obj << /Type /Pages /Kids [3 0 R] /Count 1 >> endobj
3 0 obj << /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R >> endobj
4 0 obj << /Length 20 >> stream
encrypted stream data
endstream
endobj
5 0 obj << /Filter /Standard /V 2 /R 3 /O (hash) /U (hash) /P -4 >> endobj
xref
0 6
0000000000 65535 f 
0000000009 00000 n 
0000000058 00000 n 
0000000115 00000 n 
0000000200 00000 n 
0000000280 00000 n 
trailer << /Size 6 /Root 1 0 R /Encrypt 5 0 R >>
startxref
380
%%EOF`;
  return Buffer.from(content);
}

// 1. PhonePe Statement Sample
export function getPhonePeSample() {
  return generateTestPdf([
    [
      "PhonePe Statement - September 2024",
      "Account: Sagar XXXXXX1234",
      "24 Sep 2024 Paid to Swiggy Bangalore Debit ₹ 450.00",
      "UTR: 426812345678 Txn ID: T2409242030123456789012",
      "25 Sep 2024 Paid to Zepto Grocery Debit ₹ 380.50",
      "UTR: 426812345679 Txn ID: T2409252030123456789013",
      "26 Sep 2024 Received from Rahul Sharma Credit ₹ 1,500.00",
      "UTR: 426812345680 Txn ID: T2409262030123456789014",
      "27 Sep 2024 Paid to BESCOM Electricity Debit ₹ 1,450.00",
      "28 Sep 2024 Paid to Chai Point Debit ₹ 120.00",
    ],
  ]);
}

// 2. HDFC Bank Statement Sample (Tabular with separate debit/credit/balance columns & Indian comma formatting)
export function getHdfcSample() {
  return generateTestPdf([
    [
      "HDFC BANK LIMITED - ACCOUNT STATEMENT",
      "Account No: 50100234567890 Branch: KORAMANGALA BANGALORE",
      "Statement Period: 01/10/2024 to 31/10/2024",
      "Date Narration Chq/Ref No Value Dt Withdrawal Deposit Closing Balance",
      "01/10/24 UPI-SWIGGY-swiggy@hdfc-1234567890 000000000000 01/10/24 450.00 45,200.00",
      "02/10/24 UPI-AMAZON PAY-amzn@apl-9876543210 000000000000 02/10/24 1,299.00 43,901.00",
      "03/10/24 SALARY CREDIT-ACME TECH PVT LTD 000000000000 03/10/24 1,25,000.00 1,68,901.00",
      "04/10/24 UPI-ZEPTO-zepto@icici-4567890123 000000000000 04/10/24 350.00 1,68,551.00",
      "05/10/24 ACH D-NETFLIX ENTERTAINMENT 000000000000 05/10/24 649.00 1,67,902.00",
    ],
  ]);
}

// 3. Multi-page Statement Sample
export function getMultiPageSample() {
  return generateTestPdf([
    [
      "STATE BANK OF INDIA - ACCOUNT STATEMENT (PAGE 1)",
      "Account Number: 00000030123456789 Branch: INDIRANAGAR",
      "Txn Date Description Ref No. Debit Credit Balance",
      "10-Oct-2024 TO TRANSFER-UPI/DR/423456789012/SWIGGY 423456789012 450.00 25,400.00",
      "11-Oct-2024 TO TRANSFER-UPI/DR/423456789013/UBER 423456789013 320.00 25,080.00",
      "12-Oct-2024 BY TRANSFER-INWARD NEFT-SALARY 423456789014 85,000.00 1,10,080.00",
      "Page 1 of 2 - Statement generated on 15/10/2024",
    ],
    [
      "STATE BANK OF INDIA - ACCOUNT STATEMENT (PAGE 2)",
      "Txn Date Description Ref No. Debit Credit Balance",
      "13-Oct-2024 TO TRANSFER-UPI/DR/423456789015/ZOMATO 423456789015 650.00 1,09,430.00",
      "14-Oct-2024 TO TRANSFER-UPI/DR/423456789016/AIRTEL 423456789016 719.00 1,08,711.00",
      "Page 2 of 2 - Statement generated on 15/10/2024",
    ],
  ]);
}

// 4. Axis / ICICI Statement Sample (Explicit DR/CR flags and UTR numbers)
export function getAxisIciciSample() {
  return generateTestPdf([
    [
      "AXIS BANK LIMITED - STATEMENT OF TRANSACTIONS",
      "Tran Date Value Date Transaction Details Chq No Amount (INR) DR/CR Balance (INR)",
      "10-09-2024 10-09-2024 UPI/425512345678/Swiggy/swiggy@icici/UPI 000000 450.00 DR 15,200.00",
      "11-09-2024 11-09-2024 SALARY CREDIT TECH CORP 000000 85,000.00 CR 1,00,200.00",
      "12-09-2024 12-09-2024 POS 425512345679 ZEPTO BANGALORE 000000 380.00 DR 99,820.00",
      "13-09-2024 13-09-2024 ACH DR NETFLIX ENTERTAINMENT 000000 649.00 DR 99,171.00",
    ],
  ]);
}

// 4. Scanned / Empty PDF (Zero readable text)
export function getScannedSample() {
  return generateTestPdf([
    [""], // Zero text lines
  ]);
}

// 5. Existing CSV Sample
export function getCsvSample() {
  return `Date,Description,Debit,Credit,Balance
01-10-2024,Swiggy Food Bangalore,450.00,,15200.00
02-10-2024,Zepto Grocery,380.00,,14820.00
03-10-2024,Salary Credit Acme Tech,,85000.00,99820.00
04-10-2024,BESCOM Electricity Bill,1450.00,,98370.00
05-10-2024,Ramesh Tea Stall,30.00,,98340.00`;
}

async function uploadFile(buffer, filename, isCsv = false) {
  const blob = new Blob([buffer], { type: isCsv ? "text/csv" : "application/pdf" });
  const fd = new FormData();
  fd.append("file", blob, filename);
  fd.append("userId", "test-user-flow");
  fd.append("statementId", `test-stmt-${Date.now()}-${Math.floor(Math.random() * 1000)}`);

  const res = await fetch(`${BASE_URL}/api/upload`, {
    method: "POST",
    body: fd,
  });

  const data = await res.json();
  return { status: res.status, data };
}

async function runAllTests() {
  console.log("===============================================================================");
  console.log("             RUNNING COMPREHENSIVE PDF & CSV PIPELINE TESTS                    ");
  console.log("===============================================================================\n");

  const results = [];

  // TEST 1: PhonePe PDF
  console.log("[TEST 1] Testing PhonePe PDF statement...");
  const phonePeBuf = getPhonePeSample();
  const phonePeRes = await uploadFile(phonePeBuf, "PhonePe_Statement_Sep2024.pdf");
  console.log("PhonePe Status:", phonePeRes.status);
  console.log("Transactions count:", phonePeRes.data.transactions?.length);
  if (phonePeRes.data.transactions?.length > 0) {
    console.log("First transaction:", {
      date: phonePeRes.data.transactions[0].date,
      desc: phonePeRes.data.transactions[0].description,
      merchant: phonePeRes.data.transactions[0].merchant,
      amount: phonePeRes.data.transactions[0].amount,
      type: phonePeRes.data.transactions[0].type,
    });
  }
  const phonePePass =
    phonePeRes.status === 200 &&
    phonePeRes.data.transactions?.length === 5 &&
    phonePeRes.data.transactions.some((t) => t.amount === 450) &&
    phonePeRes.data.transactions.some((t) => t.amount === 1500 && t.type === "credit");
  results.push({ name: "PhonePe PDF Statement", pass: phonePePass, details: phonePeRes.data });
  console.log("Test 1 Result:", phonePePass ? "PASS ✓" : "FAIL ✗", "\n");

  // TEST 2: HDFC Bank Statement (Indian comma amounts ₹1,25,000.00, 2-digit years, separate columns)
  console.log("[TEST 2] Testing HDFC Bank statement PDF...");
  const hdfcBuf = getHdfcSample();
  const hdfcRes = await uploadFile(hdfcBuf, "HDFC_Account_Statement.pdf");
  console.log("HDFC Status:", hdfcRes.status);
  console.log("Transactions count:", hdfcRes.data.transactions?.length);
  if (hdfcRes.data.transactions?.length > 0) {
    console.log("Transactions:", hdfcRes.data.transactions.map((t) => ({
      date: t.date,
      merchant: t.merchant,
      amount: t.amount,
      type: t.type,
    })));
  }
  const hdfcSalary = hdfcRes.data.transactions?.find((t) => t.amount === 125000);
  const hdfcPass =
    hdfcRes.status === 200 &&
    hdfcRes.data.transactions?.length === 5 &&
    hdfcSalary !== undefined &&
    hdfcSalary.type === "credit" &&
    hdfcRes.data.transactions.some((t) => t.amount === 450);
  results.push({ name: "HDFC Bank Statement PDF", pass: hdfcPass, details: hdfcRes.data });
  console.log("Test 2 Result:", hdfcPass ? "PASS ✓" : "FAIL ✗", "\n");

  // TEST 3: Multi-Page Statement PDF (SBI Bank 2 pages)
  console.log("[TEST 3] Testing Multi-Page Statement PDF...");
  const multiBuf = getMultiPageSample();
  const multiRes = await uploadFile(multiBuf, "SBI_MultiPage_Statement.pdf");
  console.log("Multi-Page Status:", multiRes.status);
  console.log("Multi-Page Total Pages:", multiRes.data.totalPages);
  console.log("Transactions count:", multiRes.data.transactions?.length);
  const multiPass =
    multiRes.status === 200 &&
    multiRes.data.totalPages === 2 &&
    multiRes.data.transactions?.length === 5 &&
    multiRes.data.transactions.some((t) => t.amount === 85000 && t.type === "credit");
  results.push({ name: "Multi-Page Statement PDF", pass: multiPass, details: multiRes.data });
  console.log("Test 3 Result:", multiPass ? "PASS ✓" : "FAIL ✗", "\n");

  // TEST 4: Axis / ICICI Statement (Explicit DR/CR flags and UTR numbers)
  console.log("[TEST 4] Testing Axis / ICICI Bank Statement PDF...");
  const axisBuf = getAxisIciciSample();
  const axisRes = await uploadFile(axisBuf, "Axis_ICICI_Statement.pdf");
  console.log("Axis/ICICI Status:", axisRes.status);
  console.log("Transactions count:", axisRes.data.transactions?.length);
  const axisSalary = axisRes.data.transactions?.find((t) => t.amount === 85000);
  const axisPass =
    axisRes.status === 200 &&
    axisRes.data.transactions?.length === 4 &&
    axisSalary !== undefined &&
    axisSalary.type === "credit" &&
    axisRes.data.transactions.some((t) => t.amount === 450 && t.type === "debit");
  results.push({ name: "Axis / ICICI Bank Statement PDF", pass: axisPass, details: axisRes.data });
  console.log("Test 4 Result:", axisPass ? "PASS ✓" : "FAIL ✗", "\n");

  // TEST 5: Scanned / Image-Based PDF (Explicit OCR detection message)
  console.log("[TEST 5] Testing Scanned / Image-Based PDF...");
  const scannedBuf = getScannedSample();
  const scannedRes = await uploadFile(scannedBuf, "scanned_doc.pdf");
  console.log("Scanned Status:", scannedRes.status);
  console.log("Error message:", scannedRes.data.error);
  const scannedPass =
    scannedRes.status === 422 &&
    scannedRes.data.error.includes("scanned/image-based and cannot be read as text. OCR is required.");
  results.push({ name: "Scanned / Image-Based PDF Detection", pass: scannedPass, details: scannedRes.data });
  console.log("Test 5 Result:", scannedPass ? "PASS ✓" : "FAIL ✗", "\n");

  // TEST 6: Password-Protected PDF Detection
  console.log("[TEST 6] Testing Password-Protected PDF...");
  const encBuf = generateEncryptedPdf();
  const encRes = await uploadFile(encBuf, "protected_statement.pdf");
  console.log("Password Status:", encRes.status);
  console.log("Error message:", encRes.data.error);
  const encPass =
    encRes.status === 422 &&
    encRes.data.error.toLowerCase().includes("password-protected");
  results.push({ name: "Password-Protected PDF Detection", pass: encPass, details: encRes.data });
  console.log("Test 6 Result:", encPass ? "PASS ✓" : "FAIL ✗", "\n");

  // TEST 7: Existing CSV Statement Pipeline (Ensure CSV pipeline is untouched and healthy)
  console.log("[TEST 7] Testing Existing CSV Statement Flow (Regression check)...");
  const csvContent = getCsvSample();
  const csvRes = await uploadFile(Buffer.from(csvContent), "sample_expenses.csv", true);
  console.log("CSV Status:", csvRes.status);
  console.log("CSV Transactions count:", csvRes.data.transactions?.length);
  const csvPass =
    csvRes.status === 200 &&
    csvRes.data.transactions?.length === 5 &&
    csvRes.data.transactions.some((t) => t.amount === 85000 && t.type === "credit");
  results.push({ name: "CSV Pipeline Regression Test", pass: csvPass, details: csvRes.data });
  console.log("Test 7 Result:", csvPass ? "PASS ✓" : "FAIL ✗", "\n");

  console.log("===============================================================================");
  console.log("                              SUMMARY OF RESULTS                               ");
  console.log("===============================================================================");
  let allPassed = true;
  for (const r of results) {
    console.log(`- ${r.name.padEnd(45)}: ${r.pass ? "PASSED ✓" : "FAILED ✗"}`);
    if (!r.pass) allPassed = false;
  }
  console.log("===============================================================================");
  console.log(`FINAL RESULT: ${allPassed ? "ALL 7 TESTS PASSED SUCCESSFULLY! ✓" : "SOME TESTS FAILED ✗"}`);
}

if (process.argv[1] && process.argv[1].includes("test-pdf-formats.mjs")) {
  runAllTests();
}
