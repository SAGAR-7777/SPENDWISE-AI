import {
  Category,
  CategorySpending,
  DailySpending,
  FinancialSummary,
  FrequentSmallPurchase,
  MerchantSpending,
  PotentiallyReducibleSpending,
  RecurringPayment,
  SimulationResult,
  SpendingOutlier,
  Transaction,
} from "@/types";
import { CATEGORY_COLORS } from "./categorizer";

export function calculateFinancialSummary(transactions: Transaction[]): FinancialSummary {
  if (!transactions.length) {
    return {
      totalIncome: 0,
      totalExpenses: 0,
      netCashFlow: 0,
      transactionCount: 0,
      largestCategory: null,
      avgTransactionValue: 0,
    };
  }

  let totalIncome = 0;
  let totalExpenses = 0;
  const categoryTotals: Record<string, number> = {};
  let minDate = transactions[0].date;
  let maxDate = transactions[0].date;

  for (const t of transactions) {
    if (t.type === "credit") {
      totalIncome += t.amount;
    } else {
      totalExpenses += t.amount;
      categoryTotals[t.category] = (categoryTotals[t.category] || 0) + t.amount;
    }

    if (t.date < minDate) minDate = t.date;
    if (t.date > maxDate) maxDate = t.date;
  }

  // Find largest category
  let largestCat: { category: Category; amount: number; percentage: number } | null = null;
  let maxCatAmount = 0;

  for (const [cat, amt] of Object.entries(categoryTotals)) {
    if (amt > maxCatAmount) {
      maxCatAmount = amt;
      largestCat = {
        category: cat as Category,
        amount: amt,
        percentage: totalExpenses > 0 ? (amt / totalExpenses) * 100 : 0,
      };
    }
  }

  const debitCount = transactions.filter((t) => t.type === "debit").length;
  const avgTransactionValue = debitCount > 0 ? totalExpenses / debitCount : 0;

  return {
    totalIncome: Math.round(totalIncome),
    totalExpenses: Math.round(totalExpenses),
    netCashFlow: Math.round(totalIncome - totalExpenses),
    transactionCount: transactions.length,
    largestCategory: largestCat,
    avgTransactionValue: Math.round(avgTransactionValue),
    periodStart: minDate,
    periodEnd: maxDate,
  };
}

export function calculateCategorySpending(transactions: Transaction[]): CategorySpending[] {
  const debits = transactions.filter((t) => t.type === "debit");
  const totalSpend = debits.reduce((acc, t) => acc + t.amount, 0);

  const map = new Map<Category, { total: number; count: number }>();

  for (const t of debits) {
    const existing = map.get(t.category) || { total: 0, count: 0 };
    map.set(t.category, {
      total: existing.total + t.amount,
      count: existing.count + 1,
    });
  }

  const result: CategorySpending[] = [];

  map.forEach((value, cat) => {
    result.push({
      category: cat,
      totalAmount: Math.round(value.total),
      count: value.count,
      percentage: totalSpend > 0 ? Number(((value.total / totalSpend) * 100).toFixed(1)) : 0,
      color: CATEGORY_COLORS[cat] || "#94A3B8",
    });
  });

  return result.sort((a, b) => b.totalAmount - a.totalAmount);
}

export function calculateDailySpending(transactions: Transaction[]): DailySpending[] {
  const dailyMap = new Map<string, { debit: number; credit: number; count: number }>();

  for (const t of transactions) {
    const existing = dailyMap.get(t.date) || { debit: 0, credit: 0, count: 0 };
    if (t.type === "debit") {
      existing.debit += t.amount;
    } else {
      existing.credit += t.amount;
    }
    existing.count += 1;
    dailyMap.set(t.date, existing);
  }

  const dates = Array.from(dailyMap.keys()).sort();
  return dates.map((date) => {
    const val = dailyMap.get(date)!;
    return {
      date,
      debit: Math.round(val.debit),
      credit: Math.round(val.credit),
      count: val.count,
    };
  });
}

export function calculateTopMerchants(transactions: Transaction[], limit = 10): MerchantSpending[] {
  const debits = transactions.filter((t) => t.type === "debit");
  const map = new Map<string, { total: number; count: number; category: Category }>();

  for (const t of debits) {
    const merchant = t.merchant || "Unknown";
    const existing = map.get(merchant) || { total: 0, count: 0, category: t.category };
    existing.total += t.amount;
    existing.count += 1;
    map.set(merchant, existing);
  }

  const list: MerchantSpending[] = [];
  map.forEach((val, merchant) => {
    list.push({
      merchant,
      totalAmount: Math.round(val.total),
      count: val.count,
      category: val.category,
      avgAmount: Math.round(val.total / val.count),
    });
  });

  return list.sort((a, b) => b.totalAmount - a.totalAmount).slice(0, limit);
}

export function detectFrequentSmallPurchases(transactions: Transaction[]): FrequentSmallPurchase[] {
  // Purchases under ₹250 with at least 3 occurrences
  const debits = transactions.filter((t) => t.type === "debit" && t.amount <= 250);
  const map = new Map<string, { total: number; count: number; category: Category }>();

  for (const t of debits) {
    const m = t.merchant;
    const existing = map.get(m) || { total: 0, count: 0, category: t.category };
    existing.total += t.amount;
    existing.count += 1;
    map.set(m, existing);
  }

  const results: FrequentSmallPurchase[] = [];
  map.forEach((val, merchant) => {
    if (val.count >= 3) {
      results.push({
        merchant,
        category: val.category,
        count: val.count,
        totalAmount: Math.round(val.total),
        avgAmount: Math.round(val.total / val.count),
      });
    }
  });

  return results.sort((a, b) => b.totalAmount - a.totalAmount);
}

export function detectSpendingOutliers(transactions: Transaction[]): SpendingOutlier[] {
  const debits = transactions.filter((t) => t.type === "debit");
  if (debits.length < 5) return [];

  const amounts = debits.map((t) => t.amount);
  const mean = amounts.reduce((a, b) => a + b, 0) / amounts.length;
  const variance = amounts.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / amounts.length;
  const stdDev = Math.sqrt(variance);

  const threshold = mean + 2.0 * stdDev;

  const outliers: SpendingOutlier[] = [];
  for (const t of debits) {
    if (t.amount > threshold && t.amount > 1500) {
      const multiplier = Number((t.amount / (mean || 1)).toFixed(1));
      outliers.push({
        transaction: t,
        reason: `${multiplier}x larger than your average spend of ₹${Math.round(mean).toLocaleString("en-IN")}`,
        multiplier,
      });
    }
  }

  return outliers.sort((a, b) => b.transaction.amount - a.transaction.amount).slice(0, 5);
}

export function detectRecurringPayments(transactions: Transaction[]): RecurringPayment[] {
  const debits = transactions.filter((t) => t.type === "debit");
  const merchantGroups = new Map<string, Transaction[]>();

  for (const t of debits) {
    const list = merchantGroups.get(t.merchant) || [];
    list.push(t);
    merchantGroups.set(t.merchant, list);
  }

  const results: RecurringPayment[] = [];

  // Known subscription providers
  const knownSubs = [
    "netflix",
    "spotify",
    "youtube",
    "amazon prime",
    "hotstar",
    "apple",
    "google one",
    "chatgpt",
    "gym",
    "broadband",
    "act fibernet",
    "jiofiber",
  ];

  merchantGroups.forEach((txList, merchant) => {
    const lower = merchant.toLowerCase();
    const isKnown = knownSubs.some((k) => lower.includes(k));

    // Sort by date descending
    txList.sort((a, b) => (b.date > a.date ? 1 : -1));
    const lastDate = txList[0].date;
    const count = txList.length;
    const avgAmount = Math.round(txList.reduce((acc, t) => acc + t.amount, 0) / count);

    if (isKnown) {
      results.push({
        merchant,
        category: txList[0].category,
        frequency: "Monthly",
        approximateAmount: avgAmount,
        lastTransactionDate: lastDate,
        transactionCount: count,
        estimatedMonthlyCost: avgAmount,
        confidence: 0.95,
        isCertain: true,
      });
    } else if (count >= 2) {
      // Check if amounts are consistent (+/- 15%)
      const minAmt = Math.min(...txList.map((t) => t.amount));
      const maxAmt = Math.max(...txList.map((t) => t.amount));
      const diffRatio = (maxAmt - minAmt) / (avgAmount || 1);

      if (diffRatio <= 0.15 && avgAmount >= 199) {
        results.push({
          merchant,
          category: txList[0].category,
          frequency: "Monthly",
          approximateAmount: avgAmount,
          lastTransactionDate: lastDate,
          transactionCount: count,
          estimatedMonthlyCost: avgAmount,
          confidence: 0.82,
          isCertain: false,
        });
      }
    }
  });

  return results.sort((a, b) => b.estimatedMonthlyCost - a.estimatedMonthlyCost);
}

export function detectPotentiallyReducibleSpending(
  transactions: Transaction[]
): PotentiallyReducibleSpending[] {
  const debits = transactions.filter((t) => t.type === "debit");
  const totalSpend = debits.reduce((acc, t) => acc + t.amount, 0);
  if (!totalSpend) return [];

  const findings: PotentiallyReducibleSpending[] = [];

  // 1. Food Delivery & Dining frequency check
  const foodTx = debits.filter((t) => t.category === "Food & Dining");
  const foodTotal = foodTx.reduce((acc, t) => acc + t.amount, 0);
  if (foodTx.length >= 6) {
    findings.push({
      category: "Food & Dining",
      count: foodTx.length,
      totalAmount: Math.round(foodTotal),
      reason: `You recorded ${foodTx.length} food & dining orders totaling ₹${foodTotal.toLocaleString("en-IN")}.`,
      suggestion:
        "Preparing meals at home 2-3 times more per week could free up an estimated ₹2,000–₹4,000 monthly.",
      severity: foodTotal > 5000 ? "high" : "medium",
    });
  }

  // 2. Quick Commerce & Grocery Deliveries
  const quickCommerce = debits.filter((t) =>
    ["Zepto", "Blinkit", "Swiggy Instamart"].includes(t.merchant)
  );
  if (quickCommerce.length >= 6) {
    const qcTotal = quickCommerce.reduce((acc, t) => acc + t.amount, 0);
    findings.push({
      category: "Groceries",
      count: quickCommerce.length,
      totalAmount: Math.round(qcTotal),
      reason: `High frequency of instant deliveries (${quickCommerce.length} orders totaling ₹${qcTotal.toLocaleString("en-IN")}). Delivery & handling fees accumulate over time.`,
      suggestion: "Batching orders into 1-2 weekly planned deliveries could save ₹500–₹1,200 in delivery and impulse spend.",
      severity: "medium",
    });
  }

  // 3. Cab & Ride-Hailing
  const cabs = debits.filter((t) => ["Uber", "Ola Cabs", "Rapido"].includes(t.merchant));
  if (cabs.length >= 8) {
    const cabTotal = cabs.reduce((acc, t) => acc + t.amount, 0);
    findings.push({
      category: "Transport",
      count: cabs.length,
      totalAmount: Math.round(cabTotal),
      reason: `Frequent ride-hailing (${cabs.length} rides totaling ₹${cabTotal.toLocaleString("en-IN")}).`,
      suggestion: "Combining metro, carpooling, or public transit for routine commute routes may reduce transport costs.",
      severity: cabTotal > 4000 ? "high" : "low",
    });
  }

  // 4. Discretionary Shopping Percentage
  const shopping = debits.filter((t) => t.category === "Shopping");
  const shoppingTotal = shopping.reduce((acc, t) => acc + t.amount, 0);
  const shoppingPct = (shoppingTotal / totalSpend) * 100;
  if (shoppingPct > 28 && shoppingTotal > 5000) {
    findings.push({
      category: "Shopping",
      count: shopping.length,
      totalAmount: Math.round(shoppingTotal),
      reason: `Shopping accounts for ${shoppingPct.toFixed(0)}% of your total expenditures (₹${shoppingTotal.toLocaleString("en-IN")}).`,
      suggestion: "Implementing a 48-hour cooling-off rule before non-essential purchases helps identify true priorities.",
      severity: "high",
    });
  }

  // 5. Multiple Entertainment Subscriptions
  const subscriptions = detectRecurringPayments(transactions).filter(
    (r) => r.category === "Subscriptions" || r.category === "Entertainment"
  );
  if (subscriptions.length >= 3) {
    const subTotal = subscriptions.reduce((acc, s) => acc + s.estimatedMonthlyCost, 0);
    findings.push({
      category: "Subscriptions",
      count: subscriptions.length,
      totalAmount: Math.round(subTotal),
      reason: `You have ${subscriptions.length} active digital subscriptions totaling approx ₹${subTotal.toLocaleString("en-IN")}/month.`,
      suggestion: "Review whether all streaming and subscription platforms are actively used or could be rotated monthly.",
      severity: "medium",
    });
  }

  return findings;
}

export function simulateBudgetScenario(
  currentExpenses: number,
  monthlyIncome: number,
  targetSavings: number,
  reductions: { category: Category; reductionAmount: number }[]
): SimulationResult {
  const currentSavings = Math.max(0, monthlyIncome - currentExpenses);
  const currentSavingsRate = monthlyIncome > 0 ? (currentSavings / monthlyIncome) * 100 : 0;

  const totalReduction = reductions.reduce((acc, r) => acc + r.reductionAmount, 0);
  const newTotalSpending = Math.max(0, currentExpenses - totalReduction);
  const newProjectedSavings = Math.max(0, monthlyIncome - newTotalSpending);
  const newSavingsRate = monthlyIncome > 0 ? (newProjectedSavings / monthlyIncome) * 100 : 0;

  const targetAchieved = newProjectedSavings >= targetSavings;
  const savingsGap = Math.max(0, targetSavings - newProjectedSavings);

  return {
    currentMonthlyIncome: monthlyIncome,
    currentSpending: currentExpenses,
    currentSavings,
    currentSavingsRate: Number(currentSavingsRate.toFixed(1)),
    targetSavings,
    simulatedReductions: reductions,
    newTotalSpending,
    newProjectedSavings,
    newSavingsRate: Number(newSavingsRate.toFixed(1)),
    targetAchieved,
    savingsGap,
  };
}
