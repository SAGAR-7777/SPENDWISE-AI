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

  if (!csvContent || csvContent.trim().length === 0) {
    return {
      transactions: [],
      totalRows: 0,
      errors: ["The uploaded CSV file is empty."],
    };
  }

  // 1. Locate the true transaction table header row
  // Many Indian bank statements (SBI, HDFC, ICICI, etc.) have 2-15 metadata rows at top
  const rawLines = csvContent.split(/\r?\n/).filter((l) => l.trim().length > 0);
  let headerIndex = 0;

  for (let i = 0; i < Math.min(rawLines.length, 35); i++) {
    const lineLower = rawLines[i].toLowerCase();
    const hasDate = /date|txn.?date|transaction.?date|value.?date|posting/i.test(lineLower);
    const hasFin = /amount|debit|withdrawal|deposit|credit|particulars|narration|description|balance|paid/i.test(lineLower);

    if (hasDate && hasFin) {
      headerIndex = i;
      break;
    }
  }

  const effectiveCSV = rawLines.slice(headerIndex).join("\n");

  const parsed = Papa.parse(effectiveCSV, {
    header: true,
    skipEmptyLines: "greedy",
    transformHeader: (h, index) => {
      const clean = h.trim().toLowerCase().replace(/[\r\n\t]+/g, " ").replace(/["']/g, "");
      return clean.length > 0 ? clean : `column_${index}`;
    },
  });

  if (!parsed.data || parsed.data.length === 0) {
    return {
      transactions: [],
      totalRows: 0,
      errors: ["Could not extract structured rows from this CSV file."],
    };
  }

  const rows = parsed.data as Record<string, string>[];
  const transactions: Transaction[] = [];
  const seenSignatures = new Set<string>();

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    const keys = Object.keys(row);

    // 1. Find date field
    const dateKey = keys.find((k) =>
      /^(date|txn.?date|transaction.?date|value.?date|posting.?date)$/i.test(k)
    ) || keys.find((k) => /date/i.test(k));

    const rawDate = dateKey ? row[dateKey] : null;
    const normalizedDate = parseIndianDate(rawDate);

    if (!normalizedDate) {
      // Row might be a summary/subtotal line or trailing disclaimer
      continue;
    }

    // 2. Find description / narration
    const descKey = keys.find((k) =>
      /narration|particulars|description|details|remarks|transaction.?details|notes|paid.?to|payee/i.test(k)
    );
    const rawDesc = descKey ? row[descKey]?.trim() : "Transaction";
    if (!rawDesc || /^(total|closing balance|opening balance|summary|brought forward)/i.test(rawDesc)) {
      continue;
    }

    // 3. Find merchant if separate column exists
    const merchantKey = keys.find((k) =>
      /merchant|payee|beneficiary|receiver|store|entity/i.test(k)
    );
    const rawMerchant = merchantKey ? row[merchantKey]?.trim() : "";
    const cleanMerchant = rawMerchant ? rawMerchant : extractCleanMerchant(rawDesc);

    // 4. Determine Amount & Debit/Credit Type
    const debitKey = keys.find((k) =>
      /withdrawal|debit|dr|spent|debit.?amount|withdrawal.?amount|dr.?amount/i.test(k)
    );
    const creditKey = keys.find((k) =>
      /deposit|credit|cr|received|credit.?amount|deposit.?amount|cr.?amount/i.test(k)
    );
    const amountKey = keys.find((k) =>
      /^(amount|txn.?amount|transaction.?amount|inr|net.?amount)$/i.test(k)
    ) || keys.find((k) => /amount/i.test(k) && !/balance/i.test(k));
    const typeKey = keys.find((k) =>
      /type|txn.?type|dr.?cr|cr.?dr|nature/i.test(k)
    );

    let amount = 0;
    let type: TransactionType = "debit";

    const debitVal = debitKey ? row[debitKey] : null;
    const creditVal = creditKey ? row[creditKey] : null;

    if (debitVal && cleanNumber(debitVal) > 0) {
      amount = cleanNumber(debitVal);
      type = "debit";
    } else if (creditVal && cleanNumber(creditVal) > 0) {
      amount = cleanNumber(creditVal);
      type = "credit";
    } else if (amountKey && row[amountKey]) {
      const rawAmtStr = String(row[amountKey]);
      amount = Math.abs(cleanNumber(rawAmtStr));
      const rawType = typeKey ? String(row[typeKey]).toLowerCase() : "";
      const lowerAmt = rawAmtStr.toLowerCase();

      if (
        /credit|cr|deposit|received|\+/i.test(rawType) ||
        /cr/i.test(lowerAmt) ||
        lowerAmt.startsWith("+")
      ) {
        type = "credit";
      } else if (
        /debit|dr|spent|-/i.test(rawType) ||
        /dr/i.test(lowerAmt) ||
        lowerAmt.startsWith("-") ||
        rawAmtStr.includes("(")
      ) {
        type = "debit";
      } else {
        // Fallback check on description
        if (/salary|refund|interest|credit|reversal/i.test(rawDesc)) {
          type = "credit";
        } else {
          type = "debit";
        }
      }
    }

    if (amount <= 0 || isNaN(amount)) {
      continue;
    }

    // Deduplication signature
    const sig = `${normalizedDate}_${amount}_${type}_${cleanMerchant.toLowerCase()}`;
    if (seenSignatures.has(sig)) {
      continue;
    }
    seenSignatures.add(sig);

    // Categorize with confidence score
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

  // Sort descending
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
  let clean = String(str).replace(/[₹\s,]|Rs\.?/gi, "").trim();
  if (/^\((.*)\)$/.test(clean)) {
    clean = "-" + clean.replace(/[()]/g, "");
  }
  clean = clean.replace(/(cr|dr)$/i, "").trim();
  const num = parseFloat(clean);
  return isNaN(num) ? 0 : num;
}

export function parseIndianDate(dateStr: string | null | undefined): string | null {
  if (!dateStr) return null;
  const trimmed = String(dateStr).trim();

  // Standard YYYY-MM-DD
  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
    return trimmed;
  }

  // DD/MM/YYYY or DD-MM-YYYY or DD.MM.YYYY
  const dmyMatch = trimmed.match(/^(\d{1,2})[./-](\d{1,2})[./-](\d{2,4})/);
  if (dmyMatch) {
    const day = dmyMatch[1].padStart(2, "0");
    const month = dmyMatch[2].padStart(2, "0");
    let year = dmyMatch[3];
    if (year.length === 2) year = `20${year}`;
    if (parseInt(month) <= 12 && parseInt(day) <= 31) {
      return `${year}-${month}-${day}`;
    }
  }

  // DD Mon YYYY e.g. "14 Oct 2024" or "14-Oct-2024" or "14-OCT-24"
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

  const textMonthMatch = trimmed.match(/^(\d{1,2})[\s./-]+([A-Za-z]{3})[\s./-]+(\d{2,4})/);
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
