"use client";

import { useState } from "react";
import { Sparkles, X, Send, Bot, User as UserIcon, CornerDownLeft, Loader2, ArrowRight } from "lucide-react";
import { FinancialSummary, CategorySpending, PotentiallyReducibleSpending, RecurringPayment, Transaction } from "@/types";

interface AskSpendWiseModalProps {
  isOpen: boolean;
  onClose: () => void;
  summary: FinancialSummary;
  categories: CategorySpending[];
  topMerchants: { merchant: string; totalAmount: number; count: number; category: string }[];
  reducible: PotentiallyReducibleSpending[];
  recurring: RecurringPayment[];
  recentTransactions: Transaction[];
}

interface ChatMessage {
  id: string;
  sender: "user" | "ai";
  text: string;
  timestamp: string;
}

export function AskSpendWiseModal({
  isOpen,
  onClose,
  summary,
  categories,
  topMerchants,
  reducible,
  recurring,
  recentTransactions,
}: AskSpendWiseModalProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "initial-ai",
      sender: "ai",
      text: `Hello! I'm your SpendWise AI Detective powered by Groq Llama 3.3. I have analyzed your transactions totaling ₹${summary.totalExpenses.toLocaleString("en-IN")}. How can I assist you with your spending patterns today?`,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    },
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const suggestedPrompts = [
    "Where did most of my money go?",
    "Find possible recurring payments.",
    "Which categories should I review?",
    "How can I reduce spending by ₹3,000?",
    "Show my biggest transactions.",
    "What are my frequent small purchases?",
  ];

  if (!isOpen) return null;

  const handleSend = async (queryText?: string) => {
    const textToSend = (queryText || input).trim();
    if (!textToSend || isLoading) return;

    const userMsg: ChatMessage = {
      id: crypto.randomUUID(),
      sender: "user",
      text: textToSend,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setIsLoading(true);

    try {
      const res = await fetch("/api/ai/ask", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          query: textToSend,
          summary,
          categories,
          topMerchants,
          reducible,
          recurring,
          recentTransactions,
        }),
      });

      const data = await res.json();
      const aiResponse = data.answer || "I could not analyze that request right now. Please try again.";

      setMessages((prev) => [
        ...prev,
        {
          id: crypto.randomUUID(),
          sender: "ai",
          text: aiResponse,
          timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        },
      ]);
    } catch (e) {
      console.error(e);
      setMessages((prev) => [
        ...prev,
        {
          id: crypto.randomUUID(),
          sender: "ai",
          text: "I encountered a network issue communicating with the AI service. Please verify your connection.",
          timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-2xl h-[85vh] max-h-[720px] bg-[#0C101A] border border-emerald-500/30 rounded-2xl flex flex-col shadow-2xl shadow-emerald-500/10 overflow-hidden">
        {/* Header */}
        <div className="p-4 border-b border-[#1E2638] flex items-center justify-between bg-[#0F1422]">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center text-slate-950 font-bold shadow-md shadow-emerald-500/20">
              <Sparkles className="w-5 h-5 stroke-[2.5]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-white">Ask SpendWise AI</h3>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                  Groq Llama 3.3
                </span>
              </div>
              <p className="text-[11px] text-slate-400">Grounded in your real verified statement transactions</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Suggested Prompts Banner */}
        <div className="p-3 bg-[#0A0D15] border-b border-[#1A2133] overflow-x-auto flex items-center gap-2 no-scrollbar">
          <span className="text-[10px] uppercase tracking-wider text-slate-500 font-semibold shrink-0 pl-1">
            Suggested:
          </span>
          {suggestedPrompts.map((p, i) => (
            <button
              key={i}
              onClick={() => handleSend(p)}
              disabled={isLoading}
              className="text-[11px] px-2.5 py-1 rounded-full bg-slate-900 border border-slate-800 hover:border-emerald-500/40 text-slate-300 hover:text-emerald-300 whitespace-nowrap transition-colors shrink-0 flex items-center gap-1"
            >
              <span>{p}</span>
              <ArrowRight className="w-2.5 h-2.5 opacity-60" />
            </button>
          ))}
        </div>

        {/* Message Thread */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex gap-3 ${msg.sender === "user" ? "justify-end" : "justify-start"}`}
            >
              {msg.sender === "ai" && (
                <div className="w-7 h-7 rounded-lg bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0 mt-0.5">
                  <Bot className="w-4 h-4" />
                </div>
              )}
              <div
                className={`max-w-[85%] rounded-2xl px-4 py-3 text-xs leading-relaxed ${
                  msg.sender === "user"
                    ? "bg-emerald-500 text-slate-950 font-medium rounded-br-none shadow-md shadow-emerald-500/10"
                    : "bg-[#131926] border border-[#232B3D] text-slate-200 rounded-bl-none"
                }`}
              >
                <div className="whitespace-pre-line">{msg.text}</div>
                <div
                  className={`text-[9px] mt-1.5 text-right ${
                    msg.sender === "user" ? "text-slate-900/70" : "text-slate-500"
                  }`}
                >
                  {msg.timestamp}
                </div>
              </div>
              {msg.sender === "user" && (
                <div className="w-7 h-7 rounded-lg bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-300 shrink-0 mt-0.5">
                  <UserIcon className="w-4 h-4" />
                </div>
              )}
            </div>
          ))}

          {isLoading && (
            <div className="flex items-center gap-3 text-xs text-slate-400">
              <div className="w-7 h-7 rounded-lg bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                <Loader2 className="w-4 h-4 animate-spin" />
              </div>
              <div className="p-3 rounded-xl bg-[#131926] border border-[#232B3D] flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                <span>SpendWise Detective is reviewing calculated metrics...</span>
              </div>
            </div>
          )}
        </div>

        {/* Input Bar */}
        <div className="p-3 border-t border-[#1E2638] bg-[#0E131E]">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSend();
            }}
            className="flex items-center gap-2"
          >
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask anything about your spending, food orders, subscriptions..."
              disabled={isLoading}
              className="flex-1 bg-slate-950/70 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all"
            />
            <button
              type="submit"
              disabled={!input.trim() || isLoading}
              className="px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 disabled:opacity-40 disabled:cursor-not-allowed text-slate-950 font-bold text-xs flex items-center gap-1.5 shadow-md shadow-emerald-500/20 transition-all cursor-pointer"
            >
              <span>Ask</span>
              <Send className="w-3.5 h-3.5" />
            </button>
          </form>
          <div className="flex items-center justify-between text-[10px] text-slate-500 mt-2 px-1">
            <span>SpendWise AI calculates numbers in code to ensure mathematical precision.</span>
            <span>Esc to exit</span>
          </div>
        </div>
      </div>
    </div>
  );
}
