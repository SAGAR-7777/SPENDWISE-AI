import { Statement, Transaction, Budget, Category } from "@/types";
import { isSupabaseConfigured, supabase } from "./supabase/client";

const LOCAL_STATEMENTS_KEY = "spendwise_statements";
const LOCAL_TRANSACTIONS_KEY = "spendwise_transactions";
const LOCAL_BUDGET_KEY = "spendwise_budgets";

export function isUUID(str: string): boolean {
  if (!str || typeof str !== "string") return false;
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str);
}

/**
 * Strips client-only properties and prepares a statement record matching
 * public.statements columns strictly to avoid PostgREST PGRST204 errors.
 */
export function cleanStatementForDb(statement: Statement) {
  return {
    id: statement.id,
    file_name: statement.file_name,
    file_type: statement.file_type,
    uploaded_at: statement.uploaded_at || new Date().toISOString(),
    processing_status: statement.processing_status || "completed",
    period_start: statement.period_start && statement.period_start.trim().length > 0 ? statement.period_start : null,
    period_end: statement.period_end && statement.period_end.trim().length > 0 ? statement.period_end : null,
    created_at: statement.created_at || new Date().toISOString(),
  };
}

/**
 * Strips client-only properties and prepares a transaction record matching
 * public.transactions columns strictly.
 */
export function cleanTransactionForDb(tx: Transaction) {
  return {
    id: isUUID(tx.id) ? tx.id : crypto.randomUUID(),
    user_id: tx.user_id,
    statement_id: tx.statement_id,
    date: tx.date,
    description: tx.description || "Transaction",
    merchant: tx.merchant || "Merchant",
    amount: Math.max(0, Math.round(Number(tx.amount) * 100) / 100),
    type: tx.type === "credit" ? "credit" : "debit",
    category: tx.category || "Other",
    payment_method: tx.payment_method || "UPI",
    confidence: Math.min(1.0, Math.max(0, Number(tx.confidence) || 0.90)),
    created_at: tx.created_at || new Date().toISOString(),
  };
}

export async function fetchStatements(userId: string): Promise<Statement[]> {
  if (!userId) return [];

  if (isSupabaseConfigured && supabase && isUUID(userId)) {
    console.log(`[DASHBOARD FETCH] Querying Supabase statements for user: ${userId}`);
    const { data, error } = await supabase
      .from("statements")
      .select("*")
      .eq("user_id", userId)
      .order("uploaded_at", { ascending: false });

    if (error) {
      console.error("[DATABASE ERROR] Failed to fetch statements from Supabase:", error);
      throw new Error(`Database query failed for statements: ${error.message} (${error.code || "UNKNOWN"})`);
    }

    console.log(`[DASHBOARD FETCH] Supabase returned ${data?.length || 0} statement(s) for user: ${userId}`);
    return (data || []) as Statement[];
  }

  // Local storage fallback for local/demo accounts
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(LOCAL_STATEMENTS_KEY);
    const all: Statement[] = raw ? JSON.parse(raw) : [];
    const filtered = all.filter((s) => s.user_id === userId);
    console.log(`[DASHBOARD FETCH] Local storage returned ${filtered.length} statement(s) for user: ${userId}`);
    return filtered;
  } catch (e) {
    console.error("Local statements fetch error:", e);
    return [];
  }
}

export async function saveStatement(statement: Statement): Promise<Statement> {
  if (!statement.id || !statement.user_id) {
    throw new Error("Cannot save statement: Missing required id or user_id.");
  }

  if (isSupabaseConfigured && supabase && isUUID(statement.user_id)) {
    const dbRecord = cleanStatementForDb(statement);
    console.log(`[DATABASE PERSISTENCE] Upserting statement record: ${dbRecord.id} for user: ${statement.user_id}`);

    const { data, error } = await supabase
      .from("statements")
      .upsert(dbRecord, { onConflict: "id" })
      .select();

    if (error) {
      console.error("[DATABASE ERROR] Failed to insert/upsert statement:", error);
      throw new Error(`Database error saving statement: ${error.message} (${error.code || "UNKNOWN"})`);
    }

    if (!data || !data[0] || !data[0].id) {
      const err = new Error("Database returned no record after statement insertion.");
      console.error("[DATABASE ERROR]", err);
      throw err;
    }

    console.log(`[STATEMENT CREATED] Confirmed statement record persisted in database. Statement ID: ${data[0].id}, User ID: ${statement.user_id}`);
    return { ...statement, id: data[0].id };
  }

  // Local storage fallback for demo or offline mode
  if (typeof window === "undefined") return statement;
  try {
    const raw = localStorage.getItem(LOCAL_STATEMENTS_KEY);
    const all: Statement[] = raw ? JSON.parse(raw) : [];
    const filtered = all.filter((s) => s.id !== statement.id);
    filtered.unshift(statement);
    localStorage.setItem(LOCAL_STATEMENTS_KEY, JSON.stringify(filtered));
    console.log(`[STATEMENT CREATED] Saved statement ${statement.id} to local storage.`);
    return statement;
  } catch (e) {
    console.error("Local statement save error:", e);
    throw e;
  }
}

export async function updateStatementStatus(
  statementId: string,
  status: "uploading" | "processing" | "completed" | "failed",
  extra?: { period_start?: string; period_end?: string; transaction_count?: number; total_spend?: number }
): Promise<void> {
  if (isSupabaseConfigured && supabase && isUUID(statementId)) {
    const updatePayload: Record<string, unknown> = {
      processing_status: status,
    };
    if (extra?.period_start && extra.period_start.trim().length > 0) {
      updatePayload.period_start = extra.period_start;
    }
    if (extra?.period_end && extra.period_end.trim().length > 0) {
      updatePayload.period_end = extra.period_end;
    }

    console.log(`[PROCESSING STATUS UPDATE] Updating statement ${statementId} status to: ${status}`);
    const { error } = await supabase
      .from("statements")
      .update(updatePayload)
      .eq("id", statementId);

    if (error) {
      console.error("[DATABASE ERROR] Failed to update statement processing status:", error);
      throw new Error(`Database error updating statement status: ${error.message}`);
    }
  }

  // Always sync local storage copy
  if (typeof window === "undefined") return;
  try {
    const raw = localStorage.getItem(LOCAL_STATEMENTS_KEY);
    const all: Statement[] = raw ? JSON.parse(raw) : [];
    const updated = all.map((s) => {
      if (s.id === statementId) {
        return {
          ...s,
          processing_status: status,
          ...(extra?.period_start ? { period_start: extra.period_start } : {}),
          ...(extra?.period_end ? { period_end: extra.period_end } : {}),
          ...(extra?.transaction_count !== undefined ? { transaction_count: extra.transaction_count } : {}),
          ...(extra?.total_spend !== undefined ? { total_spend: extra.total_spend } : {}),
        };
      }
      return s;
    });
    localStorage.setItem(LOCAL_STATEMENTS_KEY, JSON.stringify(updated));
  } catch (e) {
    console.error("Local status update error:", e);
  }
}

export async function deleteStatementCascade(statementId: string, userId: string): Promise<void> {
  if (isSupabaseConfigured && supabase && isUUID(userId) && isUUID(statementId)) {
    const { error } = await supabase.from("statements").delete().eq("id", statementId).eq("user_id", userId);
    if (error) {
      console.error("[DATABASE ERROR] Failed to cascade delete statement:", error);
      throw new Error(`Database error deleting statement: ${error.message}`);
    }
    return;
  }

  if (typeof window === "undefined") return;
  try {
    const rawSt = localStorage.getItem(LOCAL_STATEMENTS_KEY);
    const statements: Statement[] = rawSt ? JSON.parse(rawSt) : [];
    const remainingStatements = statements.filter((s) => s.id !== statementId);
    localStorage.setItem(LOCAL_STATEMENTS_KEY, JSON.stringify(remainingStatements));

    // Cascade delete transactions
    const rawTx = localStorage.getItem(LOCAL_TRANSACTIONS_KEY);
    const transactions: Transaction[] = rawTx ? JSON.parse(rawTx) : [];
    const remainingTx = transactions.filter((t) => t.statement_id !== statementId);
    localStorage.setItem(LOCAL_TRANSACTIONS_KEY, JSON.stringify(remainingTx));
  } catch (e) {
    console.error("Local statement delete cascade error:", e);
  }
}

export async function fetchTransactions(userId: string): Promise<Transaction[]> {
  if (!userId) return [];

  if (isSupabaseConfigured && supabase && isUUID(userId)) {
    console.log(`[DASHBOARD FETCH] Querying Supabase transactions for user: ${userId}`);
    const { data, error } = await supabase
      .from("transactions")
      .select("*")
      .eq("user_id", userId)
      .order("date", { ascending: false });

    if (error) {
      console.error("[DATABASE ERROR] Failed to fetch transactions from Supabase:", error);
      throw new Error(`Database query failed for transactions: ${error.message} (${error.code || "UNKNOWN"})`);
    }

    console.log(`[DASHBOARD FETCH] Supabase returned ${data?.length || 0} transaction(s) for user: ${userId}`);
    return (data || []) as Transaction[];
  }

  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(LOCAL_TRANSACTIONS_KEY);
    const all: Transaction[] = raw ? JSON.parse(raw) : [];
    const filtered = all
      .filter((t) => t.user_id === userId)
      .sort((a, b) => (b.date > a.date ? 1 : -1));
    console.log(`[DASHBOARD FETCH] Local storage returned ${filtered.length} transaction(s) for user: ${userId}`);
    return filtered;
  } catch (e) {
    console.error("Local transactions fetch error:", e);
    return [];
  }
}

export async function saveTransactionsBatch(transactions: Transaction[]): Promise<number> {
  if (!transactions.length) return 0;

  const userId = transactions[0].user_id;
  const statementId = transactions[0].statement_id;

  // Validate integrity
  for (const t of transactions) {
    if (!t.user_id || !t.statement_id) {
      const err = new Error("Database integrity failure: Transaction missing user_id or statement_id.");
      console.error("[DATABASE ERROR]", err);
      throw err;
    }
  }

  if (isSupabaseConfigured && supabase && isUUID(userId)) {
    const cleanTransactions = transactions.map(cleanTransactionForDb);
    const batchSize = 100;
    let totalInserted = 0;

    console.log(`[DATABASE PERSISTENCE] Inserting ${cleanTransactions.length} transactions in batches of ${batchSize} for statement: ${statementId}`);

    for (let i = 0; i < cleanTransactions.length; i += batchSize) {
      const batch = cleanTransactions.slice(i, i + batchSize);
      const { data, error } = await supabase
        .from("transactions")
        .insert(batch)
        .select("id");

      if (error) {
        console.error("[DATABASE ERROR] Failed to insert transactions into Supabase:", error);
        throw new Error(`Database error saving transactions: ${error.message} (${error.code || "UNKNOWN"})`);
      }

      totalInserted += (data?.length || batch.length);
    }

    console.log(`[TRANSACTIONS INSERTED] Statement ID: ${statementId}, User ID: ${userId}, Successfully inserted transactions: ${totalInserted}`);
    return totalInserted;
  }

  // Local storage fallback for demo or offline mode
  if (typeof window === "undefined") return 0;
  try {
    const raw = localStorage.getItem(LOCAL_TRANSACTIONS_KEY);
    const all: Transaction[] = raw ? JSON.parse(raw) : [];
    const existingIds = new Set(transactions.map((t) => t.id));
    const kept = all.filter((t) => !existingIds.has(t.id));
    const merged = [...transactions, ...kept];
    localStorage.setItem(LOCAL_TRANSACTIONS_KEY, JSON.stringify(merged));
    console.log(`[TRANSACTIONS INSERTED] (Local) Statement ID: ${statementId}, Saved: ${transactions.length} transactions`);
    return transactions.length;
  } catch (e) {
    console.error("Local transactions save error:", e);
    throw e;
  }
}

export async function updateTransactionCategory(
  transactionId: string,
  newCategory: Category
): Promise<void> {
  if (isSupabaseConfigured && supabase && isUUID(transactionId)) {
    const { error } = await supabase
      .from("transactions")
      .update({ category: newCategory })
      .eq("id", transactionId);
    if (error) {
      console.error("[DATABASE ERROR] Failed to update transaction category:", error);
      throw new Error(`Database error updating category: ${error.message}`);
    }
    return;
  }

  if (typeof window === "undefined") return;
  try {
    const raw = localStorage.getItem(LOCAL_TRANSACTIONS_KEY);
    const all: Transaction[] = raw ? JSON.parse(raw) : [];
    const updated = all.map((t) =>
      t.id === transactionId ? { ...t, category: newCategory, confidence: 1.0 } : t
    );
    localStorage.setItem(LOCAL_TRANSACTIONS_KEY, JSON.stringify(updated));
  } catch (e) {
    console.error("Local category update error:", e);
  }
}

export async function deleteTransactionById(transactionId: string): Promise<void> {
  if (isSupabaseConfigured && supabase && isUUID(transactionId)) {
    const { error } = await supabase.from("transactions").delete().eq("id", transactionId);
    if (error) {
      console.error("[DATABASE ERROR] Failed to delete transaction:", error);
      throw new Error(`Database error deleting transaction: ${error.message}`);
    }
    return;
  }

  if (typeof window === "undefined") return;
  try {
    const raw = localStorage.getItem(LOCAL_TRANSACTIONS_KEY);
    const all: Transaction[] = raw ? JSON.parse(raw) : [];
    const remaining = all.filter((t) => t.id !== transactionId);
    localStorage.setItem(LOCAL_TRANSACTIONS_KEY, JSON.stringify(remaining));
  } catch (e) {
    console.error("Local transaction delete error:", e);
  }
}

export async function fetchBudget(userId: string): Promise<Budget | null> {
  if (isSupabaseConfigured && supabase && isUUID(userId)) {
    const { data, error } = await supabase
      .from("budgets")
      .select("*")
      .eq("user_id", userId)
      .maybeSingle();
    if (!error && data) return data as Budget;
  }

  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(`${LOCAL_BUDGET_KEY}_${userId}`);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export async function saveBudget(budget: Budget): Promise<void> {
  if (isSupabaseConfigured && supabase && isUUID(budget.user_id)) {
    await supabase.from("budgets").upsert(budget, { onConflict: "user_id" });
    return;
  }

  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(`${LOCAL_BUDGET_KEY}_${budget.user_id}`, JSON.stringify(budget));
  } catch (e) {
    console.error("Local budget save error:", e);
  }
}

export async function clearAllUserData(userId: string): Promise<void> {
  if (isSupabaseConfigured && supabase && isUUID(userId)) {
    await supabase.from("statements").delete().eq("user_id", userId);
    await supabase.from("budgets").delete().eq("user_id", userId);
    return;
  }

  if (typeof window === "undefined") return;
  try {
    const rawSt = localStorage.getItem(LOCAL_STATEMENTS_KEY);
    const statements: Statement[] = rawSt ? JSON.parse(rawSt) : [];
    localStorage.setItem(
      LOCAL_STATEMENTS_KEY,
      JSON.stringify(statements.filter((s) => s.user_id !== userId))
    );

    const rawTx = localStorage.getItem(LOCAL_TRANSACTIONS_KEY);
    const transactions: Transaction[] = rawTx ? JSON.parse(rawTx) : [];
    localStorage.setItem(
      LOCAL_TRANSACTIONS_KEY,
      JSON.stringify(transactions.filter((t) => t.user_id !== userId))
    );

    localStorage.removeItem(`${LOCAL_BUDGET_KEY}_${userId}`);
  } catch (e) {
    console.error("Error clearing user data:", e);
  }
}

/**
 * Generates synthetic, realistic Indian UPI and banking transactions for Demo Mode
 */
export function generateSyntheticIndianStatement(userId: string): {
  statement: Statement;
  transactions: Transaction[];
} {
  const statementId = "demo-stmt-001";
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");

  const statement: Statement = {
    id: statementId,
    user_id: userId,
    file_name: "PhonePe_UPI_Statement_Oct2024.csv",
    file_type: "csv",
    uploaded_at: new Date().toISOString(),
    processing_status: "completed",
    period_start: `${year}-${month}-01`,
    period_end: `${year}-${month}-28`,
    created_at: new Date().toISOString(),
    transaction_count: 32,
    total_spend: 34850,
  };

  const rawTxList = [
    // Salary
    { d: "01", desc: "SALARY CREDIT - TECH LOGIC CORP", m: "Employer Salary", amt: 65000, type: "credit", cat: "Salary/Income", p: "Net Banking" },
    // Rent / Transfer
    { d: "02", desc: "UPI/House Rent to Sunita Verma/HDFC", m: "House Rent", amt: 14000, type: "debit", cat: "Transfers", p: "UPI" },
    // Electricity & Utilities
    { d: "03", desc: "BESCOM BILL PAYMENT BBPS BANGALORE", m: "Electricity Board", amt: 1450, type: "debit", cat: "Bills & Utilities", p: "UPI" },
    { d: "03", desc: "ACT FIBERNET MONTHLY FIBER 150MBPS", m: "Broadband & Fiber", amt: 943, type: "debit", cat: "Bills & Utilities", p: "UPI" },
    // Groceries & Quick commerce
    { d: "04", desc: "UPI-ZEPTO-DELIVERY*BANGALORE", m: "Zepto", amt: 489, type: "debit", cat: "Groceries", p: "UPI" },
    { d: "05", desc: "BLINKIT INSTANT GROCERY 12MINS", m: "Blinkit", amt: 735, type: "debit", cat: "Groceries", p: "UPI" },
    { d: "06", desc: "BIGBASKET INNOVATIVE RETAIL BB", m: "BigBasket", amt: 2150, type: "debit", cat: "Groceries", p: "UPI" },
    { d: "11", desc: "BLINKIT MILK AND VEGETABLES", m: "Blinkit", amt: 320, type: "debit", cat: "Groceries", p: "UPI" },
    { d: "16", desc: "ZEPTO LATE NIGHT ESSENTIALS", m: "Zepto", amt: 412, type: "debit", cat: "Groceries", p: "UPI" },
    { d: "22", desc: "ZEPTO DAILY BREAD AND EGGS", m: "Zepto", amt: 260, type: "debit", cat: "Groceries", p: "UPI" },
    // Food & Dining / Delivery
    { d: "04", desc: "SWIGGY BANGALORE ORDER #982142", m: "Swiggy", amt: 340, type: "debit", cat: "Food & Dining", p: "UPI" },
    { d: "06", desc: "ZOMATO LUNCH ORDER - BIRYANI ZONE", m: "Zomato", amt: 495, type: "debit", cat: "Food & Dining", p: "UPI" },
    { d: "08", desc: "SWIGGY GOURMET DINNER", m: "Swiggy", amt: 620, type: "debit", cat: "Food & Dining", p: "UPI" },
    { d: "10", desc: "CHAAYOS KORAMANGALA SNACKS", m: "Chaayos", amt: 220, type: "debit", cat: "Food & Dining", p: "UPI" },
    { d: "12", desc: "STARBUCKS COFFEE INDIA", m: "Starbucks", amt: 410, type: "debit", cat: "Food & Dining", p: "UPI" },
    { d: "14", desc: "MCDONALD'S DRIVE THRU", m: "McDonald's", amt: 520, type: "debit", cat: "Food & Dining", p: "UPI" },
    { d: "18", desc: "SWIGGY PIZZA NIGHT", m: "Swiggy", amt: 780, type: "debit", cat: "Food & Dining", p: "UPI" },
    { d: "20", desc: "ZOMATO DINNER - MEGHANA FOODS", m: "Zomato", amt: 610, type: "debit", cat: "Food & Dining", p: "UPI" },
    { d: "24", desc: "DOMINO'S PIZZA JUBILANT", m: "Domino's", amt: 499, type: "debit", cat: "Food & Dining", p: "UPI" },
    { d: "26", desc: "SWIGGY EVENING SNACK", m: "Swiggy", amt: 280, type: "debit", cat: "Food & Dining", p: "UPI" },
    // Frequent Small Purchases (Chai / Quick UPI)
    { d: "05", desc: "UPI/Ramesh Tea Stall Corner", m: "Ramesh Tea Stall", amt: 30, type: "debit", cat: "Food & Dining", p: "UPI" },
    { d: "07", desc: "UPI/Ramesh Tea Stall Corner", m: "Ramesh Tea Stall", amt: 40, type: "debit", cat: "Food & Dining", p: "UPI" },
    { d: "09", desc: "UPI/Ramesh Tea Stall Corner", m: "Ramesh Tea Stall", amt: 30, type: "debit", cat: "Food & Dining", p: "UPI" },
    { d: "13", desc: "UPI/Ramesh Tea Stall Corner", m: "Ramesh Tea Stall", amt: 50, type: "debit", cat: "Food & Dining", p: "UPI" },
    { d: "17", desc: "UPI/Ramesh Tea Stall Corner", m: "Ramesh Tea Stall", amt: 30, type: "debit", cat: "Food & Dining", p: "UPI" },
    { d: "21", desc: "UPI/Ramesh Tea Stall Corner", m: "Ramesh Tea Stall", amt: 40, type: "debit", cat: "Food & Dining", p: "UPI" },
    // Cabs & Transport
    { d: "03", desc: "UBER INDIA RIDE TO OFFICE", m: "Uber", amt: 310, type: "debit", cat: "Transport", p: "UPI" },
    { d: "07", desc: "OLA CABS PRIME SEDAN", m: "Ola Cabs", amt: 450, type: "debit", cat: "Transport", p: "UPI" },
    { d: "11", desc: "UBER RIDE RETURN HOME", m: "Uber", amt: 290, type: "debit", cat: "Transport", p: "UPI" },
    { d: "15", desc: "RAPIDO BIKE TAXI METRO STATION", m: "Rapido", amt: 75, type: "debit", cat: "Transport", p: "UPI" },
    { d: "19", desc: "NAMMA METRO SMART CARD RECHARGE", m: "Metro Transit", amt: 500, type: "debit", cat: "Transport", p: "UPI" },
    { d: "23", desc: "UBER AIRPORT DROP", m: "Uber", amt: 980, type: "debit", cat: "Transport", p: "UPI" },
    // Shopping
    { d: "09", desc: "AMAZON SELLER SERVICES ELECTRONICS", m: "Amazon", amt: 2499, type: "debit", cat: "Shopping", p: "Card" },
    { d: "15", desc: "MYNTRA DESIGNS CASUAL WEAR", m: "Myntra", amt: 1840, type: "debit", cat: "Shopping", p: "UPI" },
    { d: "25", desc: "DECATHLON RUNNING GEAR", m: "Decathlon", amt: 1299, type: "debit", cat: "Shopping", p: "UPI" },
    // Recurring Subscriptions
    { d: "08", desc: "NETFLIX ENTERTAINMENT STANDARD HD", m: "Netflix", amt: 499, type: "debit", cat: "Subscriptions", p: "Card" },
    { d: "12", desc: "SPOTIFY PREMIUM INDIVIDUAL MONTHLY", m: "Spotify", amt: 119, type: "debit", cat: "Subscriptions", p: "UPI" },
    { d: "14", desc: "YOUTUBE PREMIUM FAMILY GOOGLE", m: "YouTube Premium", amt: 189, type: "debit", cat: "Subscriptions", p: "Card" },
    { d: "18", desc: "APPLE.COM/BILL ICLOUD 50GB", m: "Apple Services", amt: 75, type: "debit", cat: "Subscriptions", p: "Card" },
    // Recharge & Healthcare
    { d: "05", desc: "JIO 3-MONTH PREPAID UNLIMITED 5G", m: "Jio Prepaid/Postpaid", amt: 749, type: "debit", cat: "Recharge", p: "UPI" },
    { d: "10", desc: "APOLLO PHARMACY WELLNESS MEDICINES", m: "Apollo Pharmacy", amt: 640, type: "debit", cat: "Healthcare", p: "UPI" },
  ];

  const transactions: Transaction[] = rawTxList.map((tx, idx) => ({
    id: `demo-tx-${idx + 1}`,
    user_id: userId,
    statement_id: statementId,
    date: `${year}-${month}-${tx.d}`,
    description: tx.desc,
    merchant: tx.m,
    amount: tx.amt,
    type: tx.type as "debit" | "credit",
    category: tx.cat as Category,
    payment_method: tx.p,
    confidence: 0.98,
    created_at: new Date().toISOString(),
  }));

  return { statement, transactions };
}
