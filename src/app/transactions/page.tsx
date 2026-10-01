"use client";

import { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/auth-context";
import { fetchTransactions, updateTransactionCategory, deleteTransactionById } from "@/lib/storage";
import { Transaction, Category, TransactionType } from "@/types";
import { CATEGORY_COLORS } from "@/lib/categorizer";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import {
  Search,
  Filter,
  ArrowUpDown,
  Download,
  Trash2,
  Edit2,
  Table,
  List,
  Check,
  X,
  ShieldCheck,
  ArrowDownLeft,
  ArrowUpRight,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

const ALL_CATEGORIES: Category[] = [
  "Food & Dining",
  "Groceries",
  "Shopping",
  "Transport",
  "Bills & Utilities",
  "Recharge",
  "Entertainment",
  "Education",
  "Healthcare",
  "Travel",
  "Subscriptions",
  "Salary/Income",
  "Transfers",
  "Cash Withdrawal",
  "Other",
];

export default function TransactionsPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();

  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters & State
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("All");
  const [selectedType, setSelectedType] = useState<string>("All");
  const [sortBy, setSortBy] = useState<"date-desc" | "date-asc" | "amount-desc" | "amount-asc">("date-desc");
  const [viewMode, setViewMode] = useState<"table" | "list">("table");

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 15;

  // Inline Category Edit
  const [editingId, setEditingId] = useState<string | null>(null);
  const [newCategoryVal, setNewCategoryVal] = useState<Category>("Other");

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/login");
      return;
    }

    async function loadData() {
      if (!user) return;
      setLoading(true);
      const list = await fetchTransactions(user.id);
      setTransactions(list);
      setLoading(false);
    }

    if (user) {
      loadData();
    }
  }, [user, authLoading, router]);

  // Filtered & Sorted Transactions
  const filteredTransactions = useMemo(() => {
    return transactions
      .filter((t) => {
        // Search
        const search = searchTerm.toLowerCase();
        const matchesSearch =
          t.merchant.toLowerCase().includes(search) ||
          t.description.toLowerCase().includes(search) ||
          t.category.toLowerCase().includes(search);
        if (!matchesSearch) return false;

        // Category
        if (selectedCategory !== "All" && t.category !== selectedCategory) {
          return false;
        }

        // Type
        if (selectedType !== "All" && t.type !== selectedType) {
          return false;
        }

        return true;
      })
      .sort((a, b) => {
        if (sortBy === "date-desc") return b.date > a.date ? 1 : -1;
        if (sortBy === "date-asc") return a.date > b.date ? 1 : -1;
        if (sortBy === "amount-desc") return b.amount - a.amount;
        if (sortBy === "amount-asc") return a.amount - b.amount;
        return 0;
      });
  }, [transactions, searchTerm, selectedCategory, selectedType, sortBy]);

  // Paginated Slices
  const totalPages = Math.ceil(filteredTransactions.length / pageSize) || 1;
  const paginatedTransactions = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredTransactions.slice(start, start + pageSize);
  }, [filteredTransactions, currentPage, pageSize]);

  const handleUpdateCategory = async (txId: string) => {
    await updateTransactionCategory(txId, newCategoryVal);
    setTransactions((prev) =>
      prev.map((t) => (t.id === txId ? { ...t, category: newCategoryVal, confidence: 1.0 } : t))
    );
    setEditingId(null);
  };

  const handleDelete = async (txId: string) => {
    if (!window.confirm("Delete this transaction?")) return;
    await deleteTransactionById(txId);
    setTransactions((prev) => prev.filter((t) => t.id !== txId));
  };

  const exportFilteredCSV = () => {
    if (!filteredTransactions.length) return;
    const headers = ["Date", "Merchant", "Description", "Category", "Type", "Amount", "Method"];
    const rows = filteredTransactions.map((t) => [
      t.date,
      `"${t.merchant.replace(/"/g, '""')}"`,
      `"${t.description.replace(/"/g, '""')}"`,
      `"${t.category}"`,
      t.type,
      t.amount,
      t.payment_method,
    ]);

    const csvContent = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `SpendWise_Transactions_${new Date().toISOString().split("T")[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#080B13] text-slate-100">
      <Navbar />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-white">
              Transaction Explorer
            </h1>
            <p className="text-xs text-slate-400 mt-1">
              Search, filter, categorize, and inspect all parsed UPI and bank transactions.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={exportFilteredCSV}
              disabled={!filteredTransactions.length}
              className="px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-700/80 text-xs font-semibold flex items-center gap-1.5 transition-colors disabled:opacity-40 cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export CSV ({filteredTransactions.length})</span>
            </button>

            {/* View Mode Toggle */}
            <div className="hidden sm:flex items-center p-1 rounded-xl bg-slate-900 border border-slate-800">
              <button
                onClick={() => setViewMode("table")}
                className={`p-1.5 rounded-lg text-xs transition-colors ${
                  viewMode === "table" ? "bg-emerald-500/20 text-emerald-300" : "text-slate-400 hover:text-white"
                }`}
                title="Table View"
              >
                <Table className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode("list")}
                className={`p-1.5 rounded-lg text-xs transition-colors ${
                  viewMode === "list" ? "bg-emerald-500/20 text-emerald-300" : "text-slate-400 hover:text-white"
                }`}
                title="Feed / List View"
              >
                <List className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Filters Bar */}
        <div className="glass-panel rounded-2xl p-4 border border-[#1E2638] flex flex-col md:flex-row items-center gap-3">
          {/* Search Box */}
          <div className="relative flex-1 w-full">
            <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-2.5" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              placeholder="Search merchants, description, or categories..."
              className="w-full bg-[#0A0D15] border border-slate-800 rounded-xl pl-10 pr-3.5 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition-all"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto">
            {/* Category Filter */}
            <select
              value={selectedCategory}
              onChange={(e) => {
                setSelectedCategory(e.target.value);
                setCurrentPage(1);
              }}
              className="bg-[#0A0D15] border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-300 focus:outline-none focus:border-emerald-500 cursor-pointer"
            >
              <option value="All">All Categories</option>
              {ALL_CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>

            {/* Type Filter */}
            <select
              value={selectedType}
              onChange={(e) => {
                setSelectedType(e.target.value);
                setCurrentPage(1);
              }}
              className="bg-[#0A0D15] border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-300 focus:outline-none focus:border-emerald-500 cursor-pointer"
            >
              <option value="All">All Types</option>
              <option value="debit">Debits (Outflows)</option>
              <option value="credit">Credits (Inward)</option>
            </select>

            {/* Sort Filter */}
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="bg-[#0A0D15] border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-300 focus:outline-none focus:border-emerald-500 cursor-pointer"
            >
              <option value="date-desc">Newest First</option>
              <option value="date-asc">Oldest First</option>
              <option value="amount-desc">Amount: High to Low</option>
              <option value="amount-asc">Amount: Low to High</option>
            </select>
          </div>
        </div>

        {/* Transactions Content */}
        {loading ? (
          <div className="glass-panel rounded-2xl p-12 text-center text-slate-400">
            <span className="w-8 h-8 rounded-full border-2 border-emerald-500 border-t-transparent animate-spin inline-block mb-3" />
            <p className="text-xs">Loading transaction records...</p>
          </div>
        ) : filteredTransactions.length === 0 ? (
          <div className="glass-panel rounded-2xl p-12 text-center text-slate-500">
            <p className="text-xs">No transactions match your search criteria.</p>
          </div>
        ) : viewMode === "table" ? (
          /* Desktop Table View */
          <div className="glass-panel rounded-2xl border border-[#1E2638] overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-300">
                <thead className="bg-[#0C101B] border-b border-[#1E2638] text-[11px] uppercase font-semibold text-slate-400 tracking-wider">
                  <tr>
                    <th className="py-3 px-4">Date</th>
                    <th className="py-3 px-4">Merchant / Entity</th>
                    <th className="py-3 px-4">Category</th>
                    <th className="py-3 px-4">Method</th>
                    <th className="py-3 px-4 text-right">Amount</th>
                    <th className="py-3 px-4 text-center">Confidence</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {paginatedTransactions.map((tx) => {
                    const isDebit = tx.type === "debit";
                    const catColor = CATEGORY_COLORS[tx.category] || "#94A3B8";
                    const isEditing = editingId === tx.id;

                    return (
                      <tr
                        key={tx.id}
                        className="hover:bg-slate-900/40 transition-colors group"
                      >
                        <td className="py-3 px-4 font-mono text-slate-400 whitespace-nowrap">
                          {tx.date}
                        </td>
                        <td className="py-3 px-4">
                          <div className="font-semibold text-white group-hover:text-emerald-300 transition-colors">
                            {tx.merchant}
                          </div>
                          <div className="text-[10px] text-slate-500 truncate max-w-xs font-mono">
                            {tx.description}
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          {isEditing ? (
                            <div className="flex items-center gap-1.5">
                              <select
                                value={newCategoryVal}
                                onChange={(e) => setNewCategoryVal(e.target.value as Category)}
                                className="bg-slate-900 border border-emerald-500 rounded px-2 py-1 text-xs text-white"
                              >
                                {ALL_CATEGORIES.map((c) => (
                                  <option key={c} value={c}>
                                    {c}
                                  </option>
                                ))}
                              </select>
                              <button
                                onClick={() => handleUpdateCategory(tx.id)}
                                className="p-1 rounded bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30"
                              >
                                <Check className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => setEditingId(null)}
                                className="p-1 rounded bg-slate-800 text-slate-400 hover:bg-slate-700"
                              >
                                <X className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={() => {
                                setEditingId(tx.id);
                                setNewCategoryVal(tx.category);
                              }}
                              className="text-[10px] font-medium px-2 py-0.5 rounded flex items-center gap-1.5 hover:ring-1 hover:ring-emerald-400/40 transition-all cursor-pointer"
                              style={{
                                backgroundColor: `${catColor}15`,
                                color: catColor,
                                border: `1px solid ${catColor}35`,
                              }}
                              title="Click to change category"
                            >
                              <span>{tx.category}</span>
                              <Edit2 className="w-2.5 h-2.5 opacity-60" />
                            </button>
                          )}
                        </td>
                        <td className="py-3 px-4 font-mono text-[11px] text-slate-400">
                          {tx.payment_method}
                        </td>
                        <td
                          className={`py-3 px-4 text-right font-bold font-mono ${
                            isDebit ? "text-slate-100" : "text-emerald-400"
                          }`}
                        >
                          {isDebit ? "-" : "+"}₹{tx.amount.toLocaleString("en-IN")}
                        </td>
                        <td className="py-3 px-4 text-center">
                          <span className="inline-flex items-center gap-1 text-[10px] text-slate-400 font-mono">
                            <ShieldCheck className="w-3 h-3 text-emerald-400" />
                            {(tx.confidence * 100).toFixed(0)}%
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right">
                          <button
                            onClick={() => handleDelete(tx.id)}
                            className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                            title="Delete transaction"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          /* Mobile / Feed List View */
          <div className="space-y-2.5">
            {paginatedTransactions.map((tx) => {
              const isDebit = tx.type === "debit";
              const catColor = CATEGORY_COLORS[tx.category] || "#94A3B8";

              return (
                <div
                  key={tx.id}
                  className="glass-panel rounded-2xl p-3.5 border border-[#1E2638] flex items-center justify-between gap-3"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 border ${
                        isDebit
                          ? "bg-rose-500/10 border-rose-500/20 text-rose-400"
                          : "bg-emerald-500/10 border-emerald-500/20 text-emerald-400"
                      }`}
                    >
                      {isDebit ? <ArrowDownLeft className="w-4 h-4" /> : <ArrowUpRight className="w-4 h-4" />}
                    </div>

                    <div className="min-w-0">
                      <div className="text-xs font-semibold text-white truncate">
                        {tx.merchant}
                      </div>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span
                          className="text-[10px] font-medium px-1.5 py-0.2 rounded"
                          style={{
                            backgroundColor: `${catColor}15`,
                            color: catColor,
                            border: `1px solid ${catColor}35`,
                          }}
                        >
                          {tx.category}
                        </span>
                        <span className="text-[11px] text-slate-500">{tx.date}</span>
                      </div>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <div
                      className={`text-xs font-bold font-mono ${
                        isDebit ? "text-slate-100" : "text-emerald-400"
                      }`}
                    >
                      {isDebit ? "-" : "+"}₹{tx.amount.toLocaleString("en-IN")}
                    </div>
                    <button
                      onClick={() => handleDelete(tx.id)}
                      className="text-[10px] text-slate-500 hover:text-rose-400 mt-0.5 inline-block"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Pagination Bar */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between text-xs text-slate-400 pt-2">
            <span>
              Showing {(currentPage - 1) * pageSize + 1} to{" "}
              {Math.min(currentPage * pageSize, filteredTransactions.length)} of{" "}
              {filteredTransactions.length} transactions
            </span>
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="p-1.5 rounded-lg bg-slate-900 border border-slate-800 disabled:opacity-40 hover:text-white"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="px-2 font-mono">
                {currentPage} / {totalPages}
              </span>
              <button
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="p-1.5 rounded-lg bg-slate-900 border border-slate-800 disabled:opacity-40 hover:text-white"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
