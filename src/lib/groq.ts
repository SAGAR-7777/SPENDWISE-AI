import Groq from "groq-sdk";
import { FinancialSummary, CategorySpending, PotentiallyReducibleSpending, RecurringPayment, AIInsightCard, Transaction } from "@/types";

let groqClient: Groq | null = null;

const GROQ_MODELS = [
  "openai/gpt-oss-120b",
  "openai/gpt-oss-20b",
  "qwen/qwen3.8-27b",
  "llama-3.3-70b-versatile",
];

function getGroqClient(): Groq | null {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey || apiKey.includes("your_groq_api_key")) {
    return null;
  }
  if (!groqClient) {
    groqClient = new Groq({ apiKey });
  }
  return groqClient;
}

export async function generateAIInsights(
  summary: FinancialSummary,
  categories: CategorySpending[],
  reducible: PotentiallyReducibleSpending[],
  recurring: RecurringPayment[]
): Promise<AIInsightCard[]> {
  const client = getGroqClient();
  const fallbackInsights = generateDeterministicInsights(summary, categories, reducible, recurring);

  if (!client) {
    return fallbackInsights;
  }

  const prompt = `
You are SpendWise AI, an expert, thoughtful personal finance detective specialized in Indian UPI and banking habits.
Review the following verified, mathematically calculated financial summary:

- Total Income: ₹${summary.totalIncome.toLocaleString("en-IN")}
- Total Expenses: ₹${summary.totalExpenses.toLocaleString("en-IN")}
- Net Cash Flow: ₹${summary.netCashFlow.toLocaleString("en-IN")}
- Transaction Count: ${summary.transactionCount}
- Top Category: ${summary.largestCategory ? `${summary.largestCategory.category} (₹${summary.largestCategory.amount.toLocaleString("en-IN")}, ${summary.largestCategory.percentage.toFixed(1)}%)` : "N/A"}
- Category Breakdown:
${categories.slice(0, 5).map((c) => `  * ${c.category}: ₹${c.totalAmount.toLocaleString("en-IN")} (${c.percentage}%)`).join("\n")}
- Potential Reducible Patterns Detected:
${reducible.map((r) => `  * ${r.category}: ₹${r.totalAmount.toLocaleString("en-IN")} across ${r.count} transactions (${r.reason})`).join("\n")}
- Recurring Subscriptions:
${recurring.map((s) => `  * ${s.merchant}: approx ₹${s.approximateAmount.toLocaleString("en-IN")}/mo (${s.frequency})`).join("\n")}

STRICT GUIDELINES:
1. NEVER hallucinate numbers or invent transactions not listed above.
2. Use respectful, neutral, non-judgmental language. Never call spending "wasteful".
3. Use terms like: "Potentially reducible", "High spending", "Spending pattern", "Recurring payment".
4. Generate 3 to 4 distinct insight cards in valid JSON format.

Return ONLY a JSON array with this schema:
[
  {
    "id": "insight-1",
    "title": "Short title (max 5 words)",
    "highlight": "Punchy 1-sentence data callout with exact ₹ figure",
    "description": "Clear explanation of the pattern and a neutral observation.",
    "actionText": "Action phrase (e.g., 'Review food delivery spending →')",
    "actionUrl": "/where-did-my-money-go",
    "category": "Category Name or null",
    "tag": "Insight" | "Alert" | "Opportunity" | "Pattern"
  }
]
`;

  for (const model of GROQ_MODELS) {
    try {
      const completion = await client.chat.completions.create({
        messages: [
          {
            role: "system",
            content: "You are SpendWise AI. Output only valid JSON arrays. Do not include markdown codeblocks or extra text.",
          },
          { role: "user", content: prompt },
        ],
        model,
        temperature: 0.2,
        max_tokens: 1024,
      });

      const responseContent = completion.choices[0]?.message?.content || "";
      const cleanJson = responseContent.replace(/```json/g, "").replace(/```/g, "").trim();
      const parsed = JSON.parse(cleanJson) as AIInsightCard[];
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    } catch (err) {
      console.warn(`Groq model ${model} failed, trying next...`);
    }
  }

  return fallbackInsights;
}

export async function askSpendWiseAI(
  userQuery: string,
  summary: FinancialSummary,
  categories: CategorySpending[],
  topMerchants: { merchant: string; totalAmount: number; count: number; category: string }[],
  reducible: PotentiallyReducibleSpending[],
  recurring: RecurringPayment[],
  recentTransactions: Transaction[]
): Promise<string> {
  const client = getGroqClient();

  if (!client) {
    return `SpendWise AI is operating in local mode. Based on your statement, your total spending is ₹${summary.totalExpenses.toLocaleString("en-IN")} with top category ${summary.largestCategory?.category || "Unknown"} at ₹${summary.largestCategory?.amount.toLocaleString("en-IN")}. Configure GROQ_API_KEY to enable full conversational analysis.`;
  }

  const contextData = {
    period: `${summary.periodStart || "Unknown"} to ${summary.periodEnd || "Unknown"}`,
    totalIncome: `₹${summary.totalIncome.toLocaleString("en-IN")}`,
    totalExpenses: `₹${summary.totalExpenses.toLocaleString("en-IN")}`,
    netCashFlow: `₹${summary.netCashFlow.toLocaleString("en-IN")}`,
    largestCategory: summary.largestCategory,
    categories: categories.slice(0, 7).map((c) => ({
      category: c.category,
      amount: `₹${c.totalAmount.toLocaleString("en-IN")}`,
      percentage: `${c.percentage}%`,
      transactions: c.count,
    })),
    topMerchants: topMerchants.slice(0, 8).map((m) => ({
      merchant: m.merchant,
      amount: `₹${m.totalAmount.toLocaleString("en-IN")}`,
      count: m.count,
      category: m.category,
    })),
    potentiallyReducible: reducible.map((r) => ({
      category: r.category,
      amount: `₹${r.totalAmount.toLocaleString("en-IN")}`,
      count: r.count,
      reason: r.reason,
      suggestion: r.suggestion,
    })),
    recurringPayments: recurring.map((s) => ({
      merchant: s.merchant,
      approxMonthly: `₹${s.approximateAmount.toLocaleString("en-IN")}`,
      lastDate: s.lastTransactionDate,
    })),
    sampleRecentTransactions: recentTransactions.slice(0, 10).map((t) => ({
      date: t.date,
      merchant: t.merchant,
      amount: `₹${t.amount.toLocaleString("en-IN")}`,
      type: t.type,
      category: t.category,
    })),
  };

  const systemMessage = `
You are SpendWise AI, an intelligent, trustworthy, and empathetic personal expense detective built for Indian users.
You analyze UPI, bank, and payment-app transaction data.

CRITICAL RULES:
1. ONLY reference numbers and facts from the provided verified context data.
2. NEVER invent transactions, merchants, or calculations.
3. NEVER provide personalized investment or stock advice.
4. Maintain a supportive, non-judgmental tone. Never describe user spending as "wasteful", "reckless", or "stupid".
5. Use terms such as: "Potentially reducible", "High spending", "Spending pattern", "Recurring payment", "Frequent transaction".
6. Format your responses with clean, readable Markdown (bullet points, bold highlights, concise paragraphs).
7. If data is insufficient to answer the question, explicitly say: "There isn't enough transaction data to determine this yet."
`;

  for (const model of GROQ_MODELS) {
    try {
      const completion = await client.chat.completions.create({
        messages: [
          { role: "system", content: systemMessage },
          {
            role: "user",
            content: `Context Data:\n${JSON.stringify(contextData, null, 2)}\n\nUser Question:\n"${userQuery}"`,
          },
        ],
        model,
        temperature: 0.3,
        max_tokens: 800,
      });

      const ans = completion.choices[0]?.message?.content;
      if (ans) return ans;
    } catch (err) {
      console.warn(`Groq chat model ${model} failed, trying next...`);
    }
  }

  return `Based on your analyzed statement data:\n\n• **Total Expenses**: ₹${summary.totalExpenses.toLocaleString("en-IN")}\n• **Total Income**: ₹${summary.totalIncome.toLocaleString("en-IN")}\n• **Top Category**: ${summary.largestCategory?.category || "Unknown"} (₹${summary.largestCategory?.amount.toLocaleString("en-IN")})\n• **Recurring Commitments**: ${recurring.length} services totaling approx ₹${recurring.reduce((a, b) => a + b.estimatedMonthlyCost, 0).toLocaleString("en-IN")}/mo.`;
}

function generateDeterministicInsights(
  summary: FinancialSummary,
  categories: CategorySpending[],
  reducible: PotentiallyReducibleSpending[],
  recurring: RecurringPayment[]
): AIInsightCard[] {
  const cards: AIInsightCard[] = [];

  if (summary.largestCategory) {
    cards.push({
      id: "insight-primary-category",
      title: "Primary Outflow Driver",
      highlight: `You spent ₹${summary.largestCategory.amount.toLocaleString("en-IN")} on ${summary.largestCategory.category} (${summary.largestCategory.percentage.toFixed(0)}% of total)`,
      description: `${summary.largestCategory.category} represents the single largest allocation of your expenditures in this period. Reviewing high-frequency transactions here provides the highest leverage.`,
      actionText: `Review ${summary.largestCategory.category} →`,
      actionUrl: "/where-did-my-money-go",
      category: summary.largestCategory.category,
      tag: "Pattern",
    });
  }

  if (reducible.length > 0) {
    const topReducible = reducible[0];
    cards.push({
      id: "insight-reducible-target",
      title: "Potentially Reducible Spending",
      highlight: `₹${topReducible.totalAmount.toLocaleString("en-IN")} spent across ${topReducible.count} transactions in ${topReducible.category}`,
      description: topReducible.suggestion,
      actionText: "Simulate savings scenario →",
      actionUrl: "/budget",
      category: topReducible.category,
      tag: "Opportunity",
    });
  }

  if (recurring.length > 0) {
    const totalRecurring = recurring.reduce((acc, r) => acc + r.estimatedMonthlyCost, 0);
    cards.push({
      id: "insight-recurring-summary",
      title: "Recurring Subscriptions Detected",
      highlight: `₹${totalRecurring.toLocaleString("en-IN")}/month committed across ${recurring.length} recurring services`,
      description: `Identified commitments including ${recurring.slice(0, 3).map((r) => r.merchant).join(", ")}. Verifying unused memberships can yield immediate monthly savings.`,
      actionText: "Manage recurring payments →",
      actionUrl: "/recurring",
      category: "Subscriptions",
      tag: "Alert",
    });
  }

  if (summary.totalIncome > 0) {
    const savings = summary.netCashFlow;
    const savingsRate = ((savings / summary.totalIncome) * 100).toFixed(0);
    cards.push({
      id: "insight-cashflow-health",
      title: "Net Cash Flow Ratio",
      highlight: `Retained ₹${savings.toLocaleString("en-IN")} (${savingsRate}% savings rate)`,
      description:
        savings >= 0
          ? `Positive net cash flow maintained. You have retained ${savingsRate}% of incoming funds after meeting all obligations.`
          : `Expenses exceeded recorded income by ₹${Math.abs(savings).toLocaleString("en-IN")}. Check if some income streams or external transfers are not in this statement.`,
      actionText: "View monthly report →",
      actionUrl: "/report",
      tag: "Insight",
    });
  }

  return cards;
}
