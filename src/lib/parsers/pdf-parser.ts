import { extractText } from "unpdf";
import { Transaction, TransactionType } from "@/types";
import { categorizeTransaction, extractCleanMerchant } from "../categorizer";

export interface ParsePDFResult {
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

  let fullExtractedText = "";
  let pageTexts: string[] = [];
  let totalPages = 0;

  try {
    const uint8 = pdfBuffer instanceof Uint8Array ? pdfBuffer : new Uint8Array(pdfBuffer);
    const result = await extractText(uint8);

    if (Array.isArray(result.text)) {
      pageTexts = result.text;
      fullExtractedText = result.text.join("\n");
    } else if (typeof result.text === "string") {
      pageTexts = [result.text];
      fullExtractedText = result.text;
    }

    totalPages = result.totalPages || pageTexts.length || 1;
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    const lower = message.toLowerCase();
    if (lower.includes("password") || lower.includes("encrypt") || lower.includes("need password")) {
      return {
        transactions: [],
        totalPages: 0,
        errors: [
          "This PDF statement appears to be password-protected. Please remove the password and re-upload.",
        ],
      };
    }
    return {
      transactions: [],
      totalPages: 0,
      errors: [`PDF extraction error: ${message}`],
    };
  }

  // Diagnostics: safe preview redacting sensitive identifiers
  const safePreview = generateSafePreview(fullExtractedText);
  console.log(`[PDF PROCESSING] Statement ID: ${statementId}`);
  console.log(`[PDF PAGES] ${totalPages}`);
  console.log(`[PDF TEXT EXTRACTED] ${fullExtractedText.length} characters`);
  console.log(`[PDF TEXT PREVIEW] ${safePreview}`);

  // Scanned / Image-Based PDF Detection
  const alphanumericCount = fullExtractedText.replace(/[^a-zA-Z0-9]/g, "").length;
  if (alphanumericCount < 40) {
    console.log(`[PDF PROCESSING] Detected scanned/image-based PDF (${alphanumericCount} chars)`);
    return {
      transactions: [],
      totalPages,
      errors: [
        "This PDF appears to be scanned/image-based and cannot be read as text. OCR is required.",
      ],
    };
  }

  // Extract raw transaction candidate blocks
  const candidates = extractTransactionCandidates(pageTexts);
  console.log(`[TRANSACTION CANDIDATES] ${candidates.length}`);

  const parsedTransactions: Transaction[] = [];
  const seenSignatures = new Set<string>();

  for (const candidate of candidates) {
    const parsed = parseCandidateBlock(candidate, userId, statementId);
    if (!parsed) continue;

    // Deduplication signature
    const sig = `${parsed.date}_${parsed.amount}_${parsed.type}_${parsed.merchant.toLowerCase()}`;
    if (seenSignatures.has(sig)) continue;
    seenSignatures.add(sig);

    parsedTransactions.push(parsed);
  }

  console.log(`[TRANSACTIONS PARSED] ${parsedTransactions.length}`);

  // Validation
  const validatedTransactions = parsedTransactions.filter((t) => {
    return (
      t.amount > 0 &&
      t.amount < 50000000 &&
      t.date &&
      /^\d{4}-\d{2}-\d{2}$/.test(t.date) &&
      t.description.length > 0
    );
  });

  console.log(`[TRANSACTIONS VALIDATED] ${validatedTransactions.length}`);

  // Sort descending by date
  validatedTransactions.sort((a, b) => (b.date > a.date ? 1 : -1));

  const dates = validatedTransactions.map((t) => t.date);
  const periodStart = dates.length ? dates[dates.length - 1] : undefined;
  const periodEnd = dates.length ? dates[0] : undefined;

  if (validatedTransactions.length === 0) {
    // Distinguish between bank document with parsing difficulty vs unrelated PDF
    const lower = fullExtractedText.toLowerCase();
    const isFinancial =
      /account|statement|balance|withdrawal|deposit|debit|credit|upi|inr|rs\.?|neft|imps/i.test(
        lower
      );

    if (isFinancial) {
      errors.push(
        "Could not extract structured transactions from this PDF statement. The table format may be unsupported or non-standard."
      );
    } else {
      errors.push(
        "No transactions found in this PDF document. Please ensure you upload an official bank or UPI statement."
      );
    }
  }

  return {
    transactions: validatedTransactions,
    totalPages,
    periodStart,
    periodEnd,
    errors,
  };
}

/**
 * Generates a safe, non-sensitive preview of the extracted text (redacts account/card numbers, UPI IDs, phone numbers)
 */
function generateSafePreview(text: string): string {
  if (!text) return "(empty)";
  const sample = text.slice(0, 300).replace(/\r?\n+/g, " ").trim();
  return sample
    .replace(/\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b/g, "[EMAIL]")
    .replace(/\b\d{10,18}\b/g, "[ACCOUNT/PHONE]")
    .replace(/\b\d{4}[-\s]?\d{4}[-\s]?\d{4}\b/g, "[CARD/ID]")
    .replace(/[a-zA-Z0-9._-]+@(okhdfcbank|okaxis|oksbi|okicici|paytm|ybl|ibl)\b/gi, "[UPI-ID]")
    .slice(0, 150);
}

interface RawCandidate {
  date: string;
  lines: string[];
  pageNumber: number;
}

/**
 * Normalizes text lines and extracts raw transaction candidate blocks
 */
function extractTransactionCandidates(pageTexts: string[]): RawCandidate[] {
  const candidates: RawCandidate[] = [];

  for (let pageIdx = 0; pageIdx < pageTexts.length; pageIdx++) {
    const rawLines = pageTexts[pageIdx].split(/\r?\n/);
    const cleanLines: string[] = [];

    // 1. Text normalization per line
    for (const rawLine of rawLines) {
      const normalized = normalizeLine(rawLine);
      if (normalized.length > 0) {
        cleanLines.push(normalized);
      }
    }

    // 2. Identify transaction candidate blocks using date anchors
    let currentCandidate: RawCandidate | null = null;

    for (let i = 0; i < cleanLines.length; i++) {
      const line = cleanLines[i];

      // Ignore noise/boilerplate headers or footers
      if (isNoiseOrHeader(line)) {
        continue;
      }

      const dateMatch = findDateInLine(line);

      if (dateMatch) {
        // If we already had a candidate, commit it
        if (currentCandidate) {
          candidates.push(currentCandidate);
        }

        currentCandidate = {
          date: dateMatch.normalizedDate,
          lines: [line],
          pageNumber: pageIdx + 1,
        };
      } else if (currentCandidate) {
        // Continuation line for current candidate (e.g. wrapped description, multi-line row)
        // Keep adding if under 6 continuation lines
        if (currentCandidate.lines.length < 6) {
          currentCandidate.lines.push(line);
        } else {
          candidates.push(currentCandidate);
          currentCandidate = null;
        }
      }
    }

    if (currentCandidate) {
      candidates.push(currentCandidate);
    }
  }

  // Pass 2: If Pass 1 found 0 candidates, attempt Block / Receipt / UPI parser (PhonePe/Google Pay cards)
  if (candidates.length === 0) {
    return extractBlockCandidates(pageTexts);
  }

  return candidates;
}

/**
 * Block / Card-based candidate extraction for PhonePe, Google Pay, or receipt-style PDF exports
 */
function extractBlockCandidates(pageTexts: string[]): RawCandidate[] {
  const candidates: RawCandidate[] = [];

  for (let pageIdx = 0; pageIdx < pageTexts.length; pageIdx++) {
    const fullPage = pageTexts[pageIdx];
    // Split by double line breaks or transaction markers
    const blocks = fullPage.split(/\n\s*\n+/);

    for (const block of blocks) {
      const lines = block
        .split(/\r?\n/)
        .map(normalizeLine)
        .filter((l) => l.length > 0 && !isNoiseOrHeader(l));

      if (lines.length === 0) continue;

      // Look for date anywhere in this block
      let foundDate: string | null = null;
      for (const line of lines) {
        const d = findDateInLine(line);
        if (d) {
          foundDate = d.normalizedDate;
          break;
        }
      }

      if (foundDate) {
        candidates.push({
          date: foundDate,
          lines,
          pageNumber: pageIdx + 1,
        });
      }
    }
  }

  return candidates;
}

/**
 * Normalizes unicode spaces, dashes, currency symbols, and excess whitespace
 */
function normalizeLine(line: string): string {
  return line
    .replace(/[\u00A0\u200B\u200E\u200F]/g, " ") // Non-breaking & zero-width spaces
    .replace(/[\u2010\u2011\u2012\u2013\u2014\u2212]/g, "-") // Unicode dashes to standard hyphen
    .replace(/[„“”‘’`«»]/g, " ") // Stray quotation mark glyphs from font mappings
    .replace(/[|]/g, " ") // Table borders
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Checks whether a line is statement metadata, disclaimer, or table header
 */
function isNoiseOrHeader(line: string): boolean {
  const lower = line.toLowerCase();

  // Page numbering: "Page 1 of 2", "Page 1"
  if (/^page\s+\d+(\s+of\s+\d+)?$/i.test(lower)) return true;

  // Metadata headers
  if (
    lower.startsWith("statement period") ||
    lower.startsWith("statement generated") ||
    lower.startsWith("generated on") ||
    lower.startsWith("print date") ||
    lower.startsWith("account open") ||
    lower.startsWith("customer id") ||
    lower.startsWith("branch code") ||
    lower.startsWith("ifsc code") ||
    lower.startsWith("micr code") ||
    lower.startsWith("nomination") ||
    lower.startsWith("opening balance") ||
    lower.startsWith("brought forward") ||
    lower.startsWith("total debit") ||
    lower.startsWith("total credit") ||
    lower.startsWith("closing balance as on") ||
    lower.startsWith("computer generated") ||
    lower.startsWith("this is a computer generated") ||
    lower.startsWith("end of statement")
  ) {
    return true;
  }

  // Table header rows (e.g. "Date Narration Chq/Ref No Value Dt Withdrawal Deposit Closing Balance")
  const hasDateHeader = /\b(date|txn date|tran date|posting date)\b/i.test(lower);
  const hasFinHeader = /\b(narration|particulars|description|withdrawal|deposit|debit|credit|balance)\b/i.test(lower);
  if (hasDateHeader && hasFinHeader && (lower.includes("balance") || lower.includes("chq"))) {
    return true;
  }

  return false;
}

/**
 * Parses a candidate block into a validated Transaction object
 */
function parseCandidateBlock(
  candidate: RawCandidate,
  userId: string,
  statementId: string
): Transaction | null {
  const combinedText = candidate.lines.join(" ");

  // 1. Mask dates in text so their numbers are never mistaken for amounts
  let textForAmounts = combinedText;
  const dateTokens = findAllDateTokens(combinedText);
  for (const token of dateTokens) {
    textForAmounts = textForAmounts.replace(token, " [DATE] ");
  }

  // 2. Mask timestamps (e.g. 14:30:22 or 08:30 PM)
  textForAmounts = textForAmounts.replace(/\b\d{1,2}:\d{2}(?::\d{2})?(?:\s*[AaPp][Mm])?\b/g, " [TIME] ");

  // 3. Mask 10-18 digit IDs / UTRs (e.g. 423456789012, T2409242030123456789012)
  textForAmounts = textForAmounts.replace(/\b[A-Za-z0-9]{16,30}\b/g, " [TXNID] ");
  textForAmounts = textForAmounts.replace(/\b\d{10,18}\b/g, " [REF] ");

  // 4. Extract candidate amounts from the masked text
  const extractedAmounts = extractCandidateAmounts(textForAmounts);
  if (extractedAmounts.length === 0) {
    return null;
  }

  // 5. Resolve transaction amount and transaction type (Debit vs Credit)
  const resolved = resolveAmountAndType(extractedAmounts, combinedText);
  if (!resolved || resolved.amount <= 0) {
    return null;
  }

  // 6. Clean Description & Merchant
  const rawDesc = cleanDescription(combinedText, candidate.date, resolved.rawAmountStr);
  const cleanMerchant = extractCleanMerchant(rawDesc);
  const { category, confidence } = categorizeTransaction(rawDesc, cleanMerchant, resolved.type);

  return {
    id: crypto.randomUUID(),
    user_id: userId,
    statement_id: statementId,
    date: candidate.date,
    description: rawDesc,
    merchant: cleanMerchant,
    amount: resolved.amount,
    type: resolved.type,
    category,
    payment_method: detectPaymentMethod(rawDesc),
    confidence,
    created_at: new Date().toISOString(),
  };
}

interface ExtractedAmount {
  value: number;
  raw: string;
  hasDr: boolean;
  hasCr: boolean;
  isNegative: boolean;
  isPositive: boolean;
  hasCurrencySymbol: boolean;
  index: number;
}

/**
 * Extracts candidate currency amounts from masked text
 */
function extractCandidateAmounts(text: string): ExtractedAmount[] {
  const results: ExtractedAmount[] = [];

  // Match amounts formatted with commas, optional decimals, optional currency symbol, optional Dr/Cr
  // Examples: ₹1,25,000.00 | ₹ 450.00 | 1,250.00 | 450.00 Dr | 1,500.00(Cr) | -450.00 | +1500.00 | 450.00
  const amountRegex = /(?:([+-])\s*)?(?:(?:₹|Rs\.?|INR)\s*)?([0-9]{1,3}(?:,[0-9]{2,3})*(?:\.[0-9]{1,2})|\b[0-9]+(?:\.[0-9]{2}))(?:\s*(?:\(?(Dr|Cr|Debit|Credit)\)?|₹|Rs\.?|INR|\/-))?/gi;

  let match: RegExpExecArray | null;
  while ((match = amountRegex.exec(text)) !== null) {
    const sign = match[1];
    const numStr = match[2];
    const marker = match[3];

    const cleanNum = parseFloat(numStr.replace(/,/g, ""));
    if (isNaN(cleanNum) || cleanNum <= 0 || cleanNum >= 50000000) {
      continue;
    }

    const matchedFull = match[0];
    const hasCurrency = /(₹|Rs\.?|INR)/i.test(matchedFull);
    const hasDr = /dr|debit/i.test(marker || "") || matchedFull.toLowerCase().includes("dr");
    const hasCr = /cr|credit/i.test(marker || "") || matchedFull.toLowerCase().includes("cr");

    results.push({
      value: cleanNum,
      raw: matchedFull.trim(),
      hasDr,
      hasCr,
      isNegative: sign === "-",
      isPositive: sign === "+",
      hasCurrencySymbol: hasCurrency,
      index: match.index,
    });
  }

  // If no decimal amounts found, look for whole rupee numbers preceded by ₹ or Rs
  if (results.length === 0) {
    const wholeRupeeRegex = /(?:₹|Rs\.?|INR)\s*([0-9]{1,3}(?:,[0-9]{2,3})*|\b[0-9]{2,7}\b)(?:\s*(?:\(?(Dr|Cr)\)?|\/-))?/gi;
    let wholeMatch: RegExpExecArray | null;
    while ((wholeMatch = wholeRupeeRegex.exec(text)) !== null) {
      const numStr = wholeMatch[1];
      const marker = wholeMatch[2];
      const cleanNum = parseFloat(numStr.replace(/,/g, ""));
      if (!isNaN(cleanNum) && cleanNum > 0 && cleanNum < 50000000) {
        results.push({
          value: cleanNum,
          raw: wholeMatch[0].trim(),
          hasDr: /dr/i.test(marker || ""),
          hasCr: /cr/i.test(marker || ""),
          isNegative: false,
          isPositive: false,
          hasCurrencySymbol: true,
          index: wholeMatch.index,
        });
      }
    }
  }

  return results;
}

/**
 * Resolves the transaction amount and type from candidate amounts and block context
 */
function resolveAmountAndType(
  amounts: ExtractedAmount[],
  fullBlockText: string
): { amount: number; type: TransactionType; rawAmountStr: string } | null {
  if (amounts.length === 0) return null;

  // 1. If an amount has explicit Dr or Cr tag, prioritize it
  const taggedAmount = amounts.find((a) => a.hasDr || a.hasCr || a.isNegative || a.isPositive);

  let chosen: ExtractedAmount;
  if (taggedAmount) {
    chosen = taggedAmount;
  } else if (amounts.length === 1) {
    chosen = amounts[0];
  } else {
    // In multi-column bank statements (HDFC, SBI, ICICI, Axis):
    // Columns: [Date] [Narration] [Withdrawal/Deposit] [Balance]
    // The LAST amount is almost always the closing running balance.
    // The first amount is the transaction amount.
    chosen = amounts[0];
  }

  // Determine Debit vs Credit
  let type: TransactionType = "debit";
  const lowerBlock = fullBlockText.toLowerCase();

  if (chosen.hasCr || chosen.isPositive) {
    type = "credit";
  } else if (chosen.hasDr || chosen.isNegative) {
    type = "debit";
  } else {
    // Contextual keyword analysis
    // Special rule: "Credit card bill payment" is a DEBIT from the bank account!
    const isCreditCardPayment = /credit\s*card/i.test(lowerBlock) && !/refund/i.test(lowerBlock);

    if (
      !isCreditCardPayment &&
      (
        /\bcredit\b/i.test(lowerBlock) ||
        /\bcr\b/i.test(lowerBlock) ||
        /\breceived\b/i.test(lowerBlock) ||
        /\bdeposit\b/i.test(lowerBlock) ||
        /\bsalary\b/i.test(lowerBlock) ||
        /\binterest\b/i.test(lowerBlock) ||
        /\bdividend\b/i.test(lowerBlock) ||
        /\bcashback\b/i.test(lowerBlock) ||
        /\brefund\b/i.test(lowerBlock)
      )
    ) {
      type = "credit";
    } else {
      type = "debit";
    }
  }

  return {
    amount: chosen.value,
    type,
    rawAmountStr: chosen.raw,
  };
}

/**
 * Cleans the raw description of a transaction
 */
function cleanDescription(fullText: string, dateStr: string, rawAmount: string): string {
  let desc = fullText;

  // Remove date occurrences
  const dateTokens = findAllDateTokens(fullText);
  for (const token of dateTokens) {
    desc = desc.replace(token, " ");
  }

  // Remove the specific raw amount
  if (rawAmount) {
    desc = desc.replace(rawAmount, " ");
  }

  // Remove currency symbols & indicators
  desc = desc.replace(/(?:₹|Rs\.?|INR)/gi, " ");
  desc = desc.replace(/[„“”‘’`«»]/g, " ");
  desc = desc.replace(/\b(dr|cr|debit|credit|bal|balance|chq|ref|utr|txn id)\b/gi, " ");
  desc = desc.replace(/[\/\\|:_\-*#]+/g, " ");
  desc = desc.replace(/\s+/g, " ").trim();

  // If description stripped down to nothing or pure digits, fallback to smart label
  if (desc.length < 3 || /^\d+$/.test(desc)) {
    if (/swiggy/i.test(fullText)) return "Swiggy";
    if (/zomato/i.test(fullText)) return "Zomato";
    if (/zepto/i.test(fullText)) return "Zepto";
    if (/amazon/i.test(fullText)) return "Amazon Pay";
    if (/netflix/i.test(fullText)) return "Netflix";
    if (/salary/i.test(fullText)) return "Salary Credit";
    if (/upi/i.test(fullText)) return "UPI Payment";
    return "Bank Transaction";
  }

  return desc;
}

/**
 * Detects Indian & International date formats in a line
 */
export function findDateInLine(
  line: string
): { rawDate: string; normalizedDate: string; startIndex: number; endIndex: number } | null {
  // 1. DD Mon YYYY / DD-Mon-YYYY (e.g., "15 Aug 2024", "15-Aug-2024", "15 Aug, 2024", "15 Aug 24")
  const dMonMatch = line.match(
    /\b(\d{1,2}[\s./-]+(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*,?[\s./-]+\d{2,4})\b/i
  );
  if (dMonMatch && dMonMatch.index !== undefined) {
    const norm = parseFlexibleDate(dMonMatch[1]);
    if (norm) {
      return {
        rawDate: dMonMatch[1],
        normalizedDate: norm,
        startIndex: dMonMatch.index,
        endIndex: dMonMatch.index + dMonMatch[1].length,
      };
    }
  }

  // 2. Mon DD, YYYY / Mon DD YYYY (e.g., "Sep 24, 2024", "September 24, 2024", "Sep 24 2024")
  const monDMatch = line.match(
    /\b((?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*[\s./-]+\d{1,2},?[\s./-]+\d{2,4})\b/i
  );
  if (monDMatch && monDMatch.index !== undefined) {
    const norm = parseFlexibleDate(monDMatch[1]);
    if (norm) {
      return {
        rawDate: monDMatch[1],
        normalizedDate: norm,
        startIndex: monDMatch.index,
        endIndex: monDMatch.index + monDMatch[1].length,
      };
    }
  }

  // 3. ISO format: YYYY-MM-DD or YYYY/MM/DD
  const isoMatch = line.match(/\b(\d{4}[-/.]\d{1,2}[-/.]\d{1,2})\b/);
  if (isoMatch && isoMatch.index !== undefined) {
    const norm = parseFlexibleDate(isoMatch[1]);
    if (norm) {
      return {
        rawDate: isoMatch[1],
        normalizedDate: norm,
        startIndex: isoMatch.index,
        endIndex: isoMatch.index + isoMatch[1].length,
      };
    }
  }

  // 4. Standard Indian DD/MM/YYYY, DD-MM-YYYY, DD.MM.YYYY, DD/MM/YY
  const dmyMatch = line.match(/\b(\d{1,2}[-/.]\d{1,2}[-/.]\d{2,4})\b/);
  if (dmyMatch && dmyMatch.index !== undefined) {
    const norm = parseFlexibleDate(dmyMatch[1]);
    if (norm) {
      return {
        rawDate: dmyMatch[1],
        normalizedDate: norm,
        startIndex: dmyMatch.index,
        endIndex: dmyMatch.index + dmyMatch[1].length,
      };
    }
  }

  return null;
}

/**
 * Returns all date tokens found in text for masking
 */
function findAllDateTokens(text: string): string[] {
  const tokens: string[] = [];

  const patterns = [
    /\b\d{1,2}[\s./-]+(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*,?[\s./-]+\d{2,4}\b/gi,
    /\b(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*[\s./-]+\d{1,2},?[\s./-]+\d{2,4}\b/gi,
    /\b\d{4}[-/.]\d{1,2}[-/.]\d{1,2}\b/g,
    /\b\d{1,2}[-/.]\d{1,2}[-/.]\d{2,4}\b/g,
  ];

  for (const regex of patterns) {
    const matches = text.match(regex);
    if (matches) {
      tokens.push(...matches);
    }
  }

  return tokens;
}

/**
 * Robust date parser supporting Indian formats and 2-digit years
 */
export function parseFlexibleDate(raw: string | null | undefined): string | null {
  if (!raw) return null;
  const clean = raw.trim().replace(/,/g, " ").replace(/\s+/g, " ");

  // 1. ISO YYYY-MM-DD or YYYY/MM/DD
  const isoMatch = clean.match(/^(\d{4})[-/.](\d{1,2})[-/.](\d{1,2})$/);
  if (isoMatch) {
    const y = isoMatch[1];
    const m = isoMatch[2].padStart(2, "0");
    const d = isoMatch[3].padStart(2, "0");
    if (parseInt(m) >= 1 && parseInt(m) <= 12 && parseInt(d) >= 1 && parseInt(d) <= 31) {
      return `${y}-${m}-${d}`;
    }
  }

  // 2. DD/MM/YYYY or DD-MM-YYYY or DD.MM.YYYY or DD/MM/YY
  const dmyMatch = clean.match(/^(\d{1,2})[-/.](\d{1,2})[-/.](\d{2,4})$/);
  if (dmyMatch) {
    const d = dmyMatch[1].padStart(2, "0");
    const m = dmyMatch[2].padStart(2, "0");
    let y = dmyMatch[3];
    if (y.length === 2) {
      y = parseInt(y) > 70 ? `19${y}` : `20${y}`;
    }
    if (parseInt(m) >= 1 && parseInt(m) <= 12 && parseInt(d) >= 1 && parseInt(d) <= 31) {
      return `${y}-${m}-${d}`;
    }
  }

  const monthMap: Record<string, string> = {
    jan: "01", feb: "02", mar: "03", apr: "04", may: "05", jun: "06",
    jul: "07", aug: "08", sep: "09", oct: "10", nov: "11", dec: "12",
  };

  // 3. DD Mon YYYY e.g. "15 Aug 2024" or "15-Aug-2024" or "15 Aug 24"
  const dMonMatch = clean.match(/^(\d{1,2})[\s./-]+([A-Za-z]{3,9})[\s./-]+(\d{2,4})$/i);
  if (dMonMatch) {
    const d = dMonMatch[1].padStart(2, "0");
    const mKey = dMonMatch[2].toLowerCase().slice(0, 3);
    const m = monthMap[mKey];
    let y = dMonMatch[3];
    if (y.length === 2) {
      y = parseInt(y) > 70 ? `19${y}` : `20${y}`;
    }
    if (m && parseInt(d) >= 1 && parseInt(d) <= 31) {
      return `${y}-${m}-${d}`;
    }
  }

  // 4. Mon DD YYYY e.g. "Sep 24 2024" or "September 24 2024"
  const monDMatch = clean.match(/^([A-Za-z]{3,9})[\s./-]+(\d{1,2})[\s./-]+(\d{2,4})$/i);
  if (monDMatch) {
    const mKey = monDMatch[1].toLowerCase().slice(0, 3);
    const m = monthMap[mKey];
    const d = monDMatch[2].padStart(2, "0");
    let y = monDMatch[3];
    if (y.length === 2) {
      y = parseInt(y) > 70 ? `19${y}` : `20${y}`;
    }
    if (m && parseInt(d) >= 1 && parseInt(d) <= 31) {
      return `${y}-${m}-${d}`;
    }
  }

  // Fallback native Date
  const parsed = new Date(clean);
  if (!isNaN(parsed.getTime()) && parsed.getFullYear() > 2000 && parsed.getFullYear() < 2100) {
    return parsed.toISOString().split("T")[0];
  }

  return null;
}

function detectPaymentMethod(desc: string): string {
  const lower = desc.toLowerCase();
  if (lower.includes("upi") || lower.includes("@") || lower.includes("vpa")) return "UPI";
  if (lower.includes("pos") || lower.includes("card") || lower.includes("visa") || lower.includes("mastercard"))
    return "Card";
  if (lower.includes("neft") || lower.includes("rtgs") || lower.includes("imps") || lower.includes("ach"))
    return "Net Banking";
  if (lower.includes("atm") || lower.includes("cash")) return "Cash / ATM";
  return "UPI";
}
