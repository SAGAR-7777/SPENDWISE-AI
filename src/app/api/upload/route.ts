import { NextRequest, NextResponse } from "next/server";
import { parseStatementCSV } from "@/lib/parsers/csv-parser";
import { parseStatementPDF } from "@/lib/parsers/pdf-parser";
import { Statement } from "@/types";

export const maxDuration = 60; // 60 seconds max

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const userId = (formData.get("userId") as string) || "anonymous-user";

    if (!file) {
      return NextResponse.json({ error: "No file was uploaded." }, { status: 400 });
    }

    // Size limit: 15MB
    const MAX_SIZE = 15 * 1024 * 1024;
    if (file.size > MAX_SIZE) {
      return NextResponse.json(
        { error: "File exceeds 15MB size limit. Please upload a smaller statement." },
        { status: 400 }
      );
    }

    const fileName = file.name.toLowerCase();
    const isPDF = fileName.endsWith(".pdf") || file.type === "application/pdf";
    const isCSV = fileName.endsWith(".csv") || file.type === "text/csv" || file.type === "application/vnd.ms-excel";

    if (!isPDF && !isCSV) {
      return NextResponse.json(
        { error: "Unsupported file format. Please upload a PDF or CSV statement." },
        { status: 400 }
      );
    }

    const statementId = (formData.get("statementId") as string) || crypto.randomUUID();
    console.log(`[UPLOAD] File received: "${file.name}" (${(file.size / 1024).toFixed(1)} KB), User ID: ${userId}, Statement ID: ${statementId}`);

    if (isCSV) {
      const text = await file.text();
      const parsed = parseStatementCSV(text, userId, statementId);

      if (parsed.transactions.length === 0) {
        return NextResponse.json(
          {
            error:
              parsed.errors.length > 0
                ? parsed.errors[0]
                : "No valid transactions could be parsed from this CSV. Check the file column headers.",
          },
          { status: 422 }
        );
      }

      console.log(`[EXTRACTION COMPLETE] Extracted ${parsed.transactions.length} rows from CSV`);
      console.log(`[TRANSACTIONS NORMALIZED] Normalized ${parsed.transactions.length} transactions for statement ${statementId}`);

      const statement: Statement = {
        id: statementId,
        user_id: userId,
        file_name: file.name,
        file_type: "csv",
        uploaded_at: new Date().toISOString(),
        processing_status: "completed",
        period_start: parsed.periodStart,
        period_end: parsed.periodEnd,
        created_at: new Date().toISOString(),
        transaction_count: parsed.transactions.length,
        total_spend: parsed.transactions
          .filter((t) => t.type === "debit")
          .reduce((acc, t) => acc + t.amount, 0),
      };

      return NextResponse.json({
        statement,
        transactions: parsed.transactions,
        periodStart: parsed.periodStart,
        periodEnd: parsed.periodEnd,
        errors: parsed.errors,
      });
    }

    // PDF processing
    const arrayBuffer = await file.arrayBuffer();
    const parsed = await parseStatementPDF(arrayBuffer, userId, statementId);

    if (parsed.transactions.length === 0) {
      return NextResponse.json(
        {
          error:
            parsed.errors.length > 0
              ? parsed.errors[0]
              : "No transactions found in this PDF statement. If it is password protected, remove the password and try again.",
        },
        { status: 422 }
      );
    }

    console.log(`[EXTRACTION COMPLETE] Extracted ${parsed.transactions.length} rows from PDF`);
    console.log(`[TRANSACTIONS NORMALIZED] Normalized ${parsed.transactions.length} transactions for statement ${statementId}`);

    const statement: Statement = {
      id: statementId,
      user_id: userId,
      file_name: file.name,
      file_type: "pdf",
      uploaded_at: new Date().toISOString(),
      processing_status: "completed",
      period_start: parsed.periodStart,
      period_end: parsed.periodEnd,
      created_at: new Date().toISOString(),
      transaction_count: parsed.transactions.length,
      total_spend: parsed.transactions
        .filter((t) => t.type === "debit")
        .reduce((acc, t) => acc + t.amount, 0),
    };

    return NextResponse.json({
      statement,
      transactions: parsed.transactions,
      periodStart: parsed.periodStart,
      periodEnd: parsed.periodEnd,
      totalPages: parsed.totalPages,
      errors: parsed.errors,
    });
  } catch (err: unknown) {
    console.error("[PIPELINE ERROR] Statement upload processing error:", err);
    return NextResponse.json(
      { error: "An unexpected error occurred while processing the statement. Please try again." },
      { status: 500 }
    );
  }
}
