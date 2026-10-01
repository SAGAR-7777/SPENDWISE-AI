import { NextRequest, NextResponse } from "next/server";
import { generateAIInsights } from "@/lib/groq";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { summary, categories, reducible, recurring } = body;

    if (!summary || !categories) {
      return NextResponse.json({ error: "Missing summary or categories in request" }, { status: 400 });
    }

    const insights = await generateAIInsights(summary, categories, reducible || [], recurring || []);
    return NextResponse.json({ insights });
  } catch (err: unknown) {
    console.error("AI Insights API error:", err);
    return NextResponse.json({ error: "Failed to generate AI insights." }, { status: 500 });
  }
}
