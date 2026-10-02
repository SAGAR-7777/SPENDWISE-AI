// Test PDF Statement Upload to /api/upload
import fs from "fs";

const BASE_URL = "http://localhost:3000";

async function testPdfUpload() {
  console.log("Creating valid test PDF statement...");

  // Generate a valid PDF stream
  const lines = [
    "01-10-2024 Paid to Swiggy Bangalore Debit Rs 450.00",
    "02-10-2024 Paid to Zepto Grocery Debit Rs 380.00",
    "03-10-2024 Salary Credit Acme Tech Credit Rs 65000.00",
    "04-10-2024 Paid to BESCOM Electricity Debit Rs 1450.00",
    "05-10-2024 Paid to Ramesh Tea Stall Debit Rs 30.00",
  ];

  let streamContent = "BT\n/F1 12 Tf\n50 720 Td\n";
  lines.forEach((l) => {
    streamContent += `(${l}) Tj\n0 -25 Td\n`;
  });
  streamContent += "ET";

  const streamLen = streamContent.length;

  const body = `%PDF-1.4
1 0 obj
<< /Type /Catalog /Pages 2 0 R >>
endobj
2 0 obj
<< /Type /Pages /Kids [3 0 R] /Count 1 >>
endobj
3 0 obj
<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >>
endobj
4 0 obj
<< /Length ${streamLen} >>
stream
${streamContent}
endstream
endobj
5 0 obj
<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>
endobj
xref
0 6
0000000000 65535 f 
0000000009 00000 n 
0000000058 00000 n 
0000000115 00000 n 
0000000224 00000 n 
0000000450 00000 n 
trailer
<< /Size 6 /Root 1 0 R >>
startxref
550
%%EOF`;

  const pdfBuffer = Buffer.from(body);
  const blob = new Blob([pdfBuffer], { type: "application/pdf" });

  const formData = new FormData();
  formData.append("file", blob, "test_bank_statement.pdf");
  formData.append("userId", "test-user-pdf");
  formData.append("statementId", "test-stmt-pdf-001");

  console.log("Uploading PDF to /api/upload...");
  const res = await fetch(`${BASE_URL}/api/upload`, {
    method: "POST",
    body: formData,
  });

  const data = await res.json();
  console.log("PDF Upload Response status:", res.status);
  console.log("Extracted transactions count:", data.transactions?.length);
  if (data.transactions?.length > 0) {
    console.log("Sample extracted transaction:", data.transactions[0]);
    console.log("✓ PDF STATEMENT EXTRACTION VERIFIED SUCCESSFULLY!");
  } else {
    console.error("PDF upload result:", data);
  }
}

testPdfUpload();
