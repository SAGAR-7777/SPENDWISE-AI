export type TransactionType = "debit" | "credit";

export type Category =
  | "Food & Dining"
  | "Groceries"
  | "Shopping"
  | "Transport"
  | "Bills & Utilities"
  | "Recharge"
  | "Entertainment"
  | "Education"
  | "Healthcare"
  | "Travel"
  | "Subscriptions"
  | "Salary/Income"
  | "Transfers"
  | "Cash Withdrawal"
  | "Other";

export interface Statement {
  id: string;
  user_id: string;
  file_name: string;
  file_type: "pdf" | "csv";
  uploaded_at: string;
  processing_status: "uploading" | "processing" | "completed" | "failed";
  period_start?: string;
  period_end?: string;
  created_at: string;
  transaction_count?: number;
  total_spend?: number;
}

export interface Transaction {
  id: string;
  user_id: string;
  statement_id: string;
  date: string; // YYYY-MM-DD
  description: string;
  merchant: string;
  amount: number;
  type: TransactionType;
  category: Category;
  payment_method: string;
  confidence: number; // 0.0 to 1.0
  created_at: string;
}

export interface Budget {
  id: string;
  user_id: string;
  monthly_income: number;
  savings_target: number;
  created_at: string;
  updated_at: string;
}

export interface UserPreferences {
  id: string;
  user_id: string;
  currency: string;
  theme: "dark" | "light";
  created_at: string;
  updated_at: string;
}

export interface FinancialSummary {
  totalIncome: number;
  totalExpenses: number;
  netCashFlow: number;
  transactionCount: number;
  largestCategory: {
    category: Category;
    amount: number;
    percentage: number;
  } | null;
  avgTransactionValue: number;
  periodStart?: string;
  periodEnd?: string;
}

export interface CategorySpending {
  category: Category;
  totalAmount: number;
  percentage: number;
  count: number;
  color: string;
}

export interface MerchantSpending {
  merchant: string;
  totalAmount: number;
  count: number;
  category: Category;
  avgAmount: number;
}

export interface DailySpending {
  date: string;
  debit: number;
  credit: number;
  count: number;
}

export interface RecurringPayment {
  merchant: string;
  category: Category;
  frequency: "Monthly" | "Weekly" | "Quarterly" | "Possible Recurring";
  approximateAmount: number;
  lastTransactionDate: string;
  transactionCount: number;
  estimatedMonthlyCost: number;
  confidence: number;
  isCertain: boolean;
}

export interface PotentiallyReducibleSpending {
  category: Category;
  merchant?: string;
  count: number;
  totalAmount: number;
  reason: string;
  suggestion: string;
  severity: "high" | "medium" | "low";
}

export interface FrequentSmallPurchase {
  merchant: string;
  category: Category;
  count: number;
  totalAmount: number;
  avgAmount: number;
}

export interface SpendingOutlier {
  transaction: Transaction;
  reason: string;
  multiplier: number;
}

export interface AIInsightCard {
  id: string;
  title: string;
  highlight: string;
  description: string;
  actionText?: string;
  actionUrl?: string;
  category?: Category;
  tag: "Insight" | "Alert" | "Opportunity" | "Pattern";
}

export interface SimulationResult {
  currentMonthlyIncome: number;
  currentSpending: number;
  currentSavings: number;
  currentSavingsRate: number;
  targetSavings: number;
  simulatedReductions: {
    category: Category;
    reductionAmount: number;
  }[];
  newTotalSpending: number;
  newProjectedSavings: number;
  newSavingsRate: number;
  targetAchieved: boolean;
  savingsGap: number;
}
