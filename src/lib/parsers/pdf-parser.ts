import { extractText } from "unpdf";
import { Transaction, TransactionType } from "@/types";
import { categorizeTransaction, extractCleanMerchant } from "../categorizer";
import { parseIndianDate } from "./csv-parser";

interface ParsePDFResult {
  transactions: Transaction[];
  totalPages: number;
  periodStart?: string;
  periodEnd?: string;
  errors: string[];
}

export async function parseStatementPDF(
  pdfBuffer: Uint8Array | ArrayBuffer,
  userId: string,
  statementId: string
): Promise<ParsePDFResult> {
  const errors: string[] = [];

  let extractedText = "";
  let totalPages = 0;

  try {
    const result = await extractText(pdfBuffer);
    extractedText = Array.isArray(result.text) ? result.text.join("\n") : (result.text as string);
    totalPages = result.totalPages || 1;
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to read PDF";
    if (message.toLowerCase().includes("password") || message.toLowerCase().includes("encrypt")) {
      return {
        transactions: [],
        totalPages: 0,
        errors: [
          "This PDF appears to be password-protected. Please remove the password and re-upload.",
        ],
      };
    }
    return {
      transactions: [],
      totalPages: 0,
      errors: [`PDF extraction error: ${message}`],
    };
  }

  if (!extractedText || extractedText.trim().length === 0) {
    return {
      transactions: [],
      totalPages,
      errors: [
        "No readable text found in this PDF. It may be a scanned image or empty. Please upload an official digital e-statement or CSV.",
      ],
    };
  }

  const lines = extractedText
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l.length > 0);

  const transactions: Transaction[] = [];
  const seenSignatures = new Set<string>();

  // Date regex: e.g. 12/04/2024 or 12-04-2024 or 12 Apr 2024
  const dateRegex = /\b(\d{1,2}[/-]\d{1,2}[/-]\d{2,4}|\d{1,2}\s+(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s+\d{2,4})\b/i;
  // Amount regex: numbers with optional commas and decimals, e.g. 1,450.00 or 250.00
  const amountRegex = /(?:₹|Rs\.?|INR)?\s*(\d{1,3}(?:,\d{2,3})*(?:\.\d{2})|\d+(?:\.\d{2}))/g;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const dateMatch = line.match(dateRegex);

    if (dateMatch) {
      const rawDate = dateMatch[1];
      const normalizedDate = parseIndianDate(rawDate);
      if (!normalizedDate) continue;

      // Check if amount is present on this line or next line
      let lineToSearch = line;
      let extraDesc = "";
      if (i + 1 < lines.length && !lines[i + 1].match(dateRegex)) {
        // Look ahead 1-2 lines for description or amount
        lineToSearch += " " + lines[i + 1];
        extraDesc = lines[i + 1];
        if (i + 2 < lines.length && !lines[i + 2].match(dateRegex)) {
          lineToSearch += " " + lines[i + 2];
        }
      }

      // Find amounts in line
      const amountsFound: number[] = [];
      let match: RegExpExecArray | null;
      while ((match = amountRegex.exec(lineToSearch)) !== null) {
        const val = parseFloat(match[1].replace(/,/g, ""));
        if (!isNaN(val) && val > 0 && val < 50000000) {
          amountsFound.push(val);
        }
      }

      if (amountsFound.length === 0) continue;

      // Determine amount: Usually transaction amount is before balance
      // If 2 amounts, first is transaction amount, second is closing balance
      const amount = amountsFound[0];

      // Determine debit or credit
      let type: TransactionType = "debit";
      const lower = lineToSearch.toLowerCase();

      if (
        lower.includes("cr") ||
        lower.includes("credit") ||
        lower.includes("deposit") ||
        lower.includes("received") ||
        lower.includes("salary") ||
        lower.includes("+")
      ) {
        type = "credit";
      } else {
        type = "debit";
      }

      // Extract description
      let rawDesc = line
        .replace(dateRegex, "")
        .replace(amountRegex, "")
        .replace(/\b(cr|dr|debit|credit|bal|balance)\b/gi, "")
        .replace(/[|]/g, " ")
        .trim();

      if (extraDesc && !rawDesc.toLowerCase().includes(extraDesc.toLowerCase())) {
        rawDesc = `${rawDesc} ${extraDesc}`.trim();
      }

      if (rawDesc.length < 3) {
        rawDesc = "UPI Transaction";
      }

      const cleanMerchant = extractCleanMerchant(rawDesc);
      const sig = `${normalizedDate}_${amount}_${type}_${cleanMerchant.toLowerCase()}`;

      if (seenSignatures.has(sig)) continue;
      seenSignatures.add(sig);

      const { category, confidence } = categorizeTransaction(rawDesc, cleanMerchant, type);

      transactions.push({
        id: crypto.randomUUID(),
        user_id: userId,
        statement_id: statementId,
        date: normalizedDate,
        description: rawDesc,
        merchant: cleanMerchant,
        amount,
        type,
        category,
        payment_method: detectPaymentMethod(rawDesc),
        confidence,
        created_at: new Date().toISOString(),
      });
    }
  }

  // Sort descending
  transactions.sort((a, b) => (b.date > a.date ? 1 : -1));

  const dates = transactions.map((t) => t.date);
  const periodStart = dates.length ? dates[dates.length - 1] : undefined;
  const periodEnd = dates.length ? dates[0] : undefined;

  return {
    transactions,
    totalPages,
    periodStart,
    periodEnd,
    errors,
  };
}

function detectPaymentMethod(desc: string): string {
  const lower = desc.toLowerCase();
  if (lower.includes("upi") || lower.includes("@") || lower.includes("vpa")) return "UPI";
  if (lower.includes("pos") || lower.includes("card") || lower.includes("visa")) return "Card";
  if (lower.includes("neft") || lower.includes("rtgs") || lower.includes("imps")) return "Net Banking";
  if (lower.includes("atm") || lower.includes("cash")) return "Cash / ATM";
  return "UPI";
}
