import { NextRequest, NextResponse } from "next/server";
import { askSpendWiseAI } from "@/lib/groq";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { query, summary, categories, topMerchants, reducible, recurring, recentTransactions } = body;

    if (!query) {
      return NextResponse.json({ error: "Query is required" }, { status: 400 });
    }

    const answer = await askSpendWiseAI(
      query,
      summary || {
        totalIncome: 0,
        totalExpenses: 0,
        netCashFlow: 0,
        transactionCount: 0,
        largestCategory: null,
        avgTransactionValue: 0,
      },
      categories || [],
      topMerchants || [],
      reducible || [],
      recurring || [],
      recentTransactions || []
    );

    return NextResponse.json({ answer });
  } catch (err: unknown) {
    console.error("Ask SpendWise AI API error:", err);
    return NextResponse.json(
      { error: "SpendWise AI assistant could not answer at this moment." },
      { status: 500 }
    );
  }
}
