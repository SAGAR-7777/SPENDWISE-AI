import Papa from "papaparse";
import { Transaction, TransactionType } from "@/types";
import { categorizeTransaction, extractCleanMerchant } from "../categorizer";

interface ParseCSVResult {
  transactions: Transaction[];
  totalRows: number;
  periodStart?: string;
  periodEnd?: string;
  errors: string[];
}

export function parseStatementCSV(
  csvContent: string,
  userId: string,
  statementId: string
): ParseCSVResult {
  const errors: string[] = [];
  const parsed = Papa.parse(csvContent, {
    header: true,
    skipEmptyLines: "greedy",
    transformHeader: (h) => h.trim().toLowerCase().replace(/[\r\n]+/g, " "),
  });

  if (!parsed.data || parsed.data.length === 0) {
    return {
      transactions: [],
      totalRows: 0,
      errors: ["The uploaded CSV file is empty or could not be read."],
    };
  }

  const rows = parsed.data as Record<string, string>[];
  const transactions: Transaction[] = [];
  const seenSignatures = new Set<string>();

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];

    // Find date field
    const dateKey = Object.keys(row).find((k) =>
      /date|txn.?date|transaction.?date|value.?date|posting.?date/i.test(k)
    );
    const rawDate = dateKey ? row[dateKey] : null;
    const normalizedDate = parseIndianDate(rawDate);

    if (!normalizedDate) {
      // Row might be a header or subtotal row
      continue;
    }

    // Find description / narration
    const descKey = Object.keys(row).find((k) =>
      /description|details|particulars|narration|remarks|notes|paid.?to|payee/i.test(k)
    );
    const rawDesc = descKey ? row[descKey]?.trim() : "Transaction";
    if (!rawDesc) continue;

    // Find merchant if separate column exists
    const merchantKey = Object.keys(row).find((k) =>
      /merchant|payee|beneficiary|receiver|store/i.test(k)
    );
    const rawMerchant = merchantKey ? row[merchantKey]?.trim() : "";
    const cleanMerchant = rawMerchant ? rawMerchant : extractCleanMerchant(rawDesc);

    // Determine Amount and Type
    const debitKey = Object.keys(row).find((k) =>
      /^(debit|dr|withdrawal|debit.?amount|spent)/i.test(k)
    );
    const creditKey = Object.keys(row).find((k) =>
      /^(credit|cr|deposit|credit.?amount|received)/i.test(k)
    );
    const amountKey = Object.keys(row).find((k) =>
      /^(amount|txn.?amount|transaction.?amount)/i.test(k)
    );
    const typeKey = Object.keys(row).find((k) =>
      /^(type|txn.?type|dr.?cr|cr.?dr|nature)/i.test(k)
    );

    let amount = 0;
    let type: TransactionType = "debit";

    if (debitKey && cleanNumber(row[debitKey]) > 0) {
      amount = cleanNumber(row[debitKey]);
      type = "debit";
    } else if (creditKey && cleanNumber(row[creditKey]) > 0) {
      amount = cleanNumber(row[creditKey]);
      type = "credit";
    } else if (amountKey) {
      amount = Math.abs(cleanNumber(row[amountKey]));
      const rawVal = row[amountKey] || "";
      const rawType = typeKey ? row[typeKey] : "";

      if (/credit|cr|deposit|received|\+/i.test(rawType) || /credit|cr|\+/i.test(rawVal)) {
        type = "credit";
      } else if (/debit|dr|spent|-/i.test(rawType) || /debit|dr|-/i.test(rawVal)) {
        type = "debit";
      } else {
        // If negative amount, debit
        type = rawVal.includes("-") ? "debit" : "debit";
      }
    }

    if (amount <= 0) {
      continue;
    }

    // Deduplication key
    const sig = `${normalizedDate}_${amount}_${type}_${cleanMerchant.toLowerCase()}`;
    if (seenSignatures.has(sig)) {
      continue;
    }
    seenSignatures.add(sig);

    // Categorize
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

  // Sort by date descending
  transactions.sort((a, b) => (b.date > a.date ? 1 : -1));

  const dates = transactions.map((t) => t.date);
  const periodStart = dates.length ? dates[dates.length - 1] : undefined;
  const periodEnd = dates.length ? dates[0] : undefined;

  return {
    transactions,
    totalRows: rows.length,
    periodStart,
    periodEnd,
    errors,
  };
}

function cleanNumber(str: string | null | undefined): number {
  if (!str) return 0;
  // Remove ₹, Rs, Rs., commas, whitespace, trailing Cr/Dr
  const clean = str.replace(/[₹\s,]|Rs\.?/gi, "").replace(/(cr|dr)$/i, "");
  const num = parseFloat(clean);
  return isNaN(num) ? 0 : num;
}

export function parseIndianDate(dateStr: string | null | undefined): string | null {
  if (!dateStr) return null;
  const trimmed = dateStr.trim();

  // Try standard YYYY-MM-DD
  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
    return trimmed;
  }

  // DD/MM/YYYY or DD-MM-YYYY
  const dmyMatch = trimmed.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{2,4})/);
  if (dmyMatch) {
    const day = dmyMatch[1].padStart(2, "0");
    const month = dmyMatch[2].padStart(2, "0");
    let year = dmyMatch[3];
    if (year.length === 2) year = `20${year}`;
    // Verify valid month
    if (parseInt(month) <= 12 && parseInt(day) <= 31) {
      return `${year}-${month}-${day}`;
    }
  }

  // DD Mon YYYY e.g. "14 Oct 2024" or "14-Oct-2024"
  const monthNames: Record<string, string> = {
    jan: "01",
    feb: "02",
    mar: "03",
    apr: "04",
    may: "05",
    jun: "06",
    jul: "07",
    aug: "08",
    sep: "09",
    oct: "10",
    nov: "11",
    dec: "12",
  };

  const textMonthMatch = trimmed.match(/^(\d{1,2})[\s-]+([A-Za-z]{3})[\s-]+(\d{2,4})/);
  if (textMonthMatch) {
    const day = textMonthMatch[1].padStart(2, "0");
    const mStr = textMonthMatch[2].toLowerCase();
    const month = monthNames[mStr];
    let year = textMonthMatch[3];
    if (year.length === 2) year = `20${year}`;
    if (month) {
      return `${year}-${month}-${day}`;
    }
  }

  // Native Date fallback
  const d = new Date(trimmed);
  if (!isNaN(d.getTime())) {
    return d.toISOString().split("T")[0];
  }

  return null;
}

function detectPaymentMethod(desc: string): string {
  const lower = desc.toLowerCase();
  if (lower.includes("upi") || lower.includes("vpa") || lower.includes("@")) return "UPI";
  if (lower.includes("pos") || lower.includes("card") || lower.includes("visa") || lower.includes("mastercard")) return "Card";
  if (lower.includes("neft") || lower.includes("rtgs") || lower.includes("imps")) return "Net Banking";
  if (lower.includes("atm") || lower.includes("cash")) return "Cash / ATM";
  if (lower.includes("wallet") || lower.includes("paytm wallet")) return "Wallet";
  return "UPI";
}
