"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/context/auth-context";
import {
  Sparkles,
  PieChart,
  UploadCloud,
  Layers,
  Repeat,
  Calculator,
  FileText,
  Settings,
  LogOut,
  User as UserIcon,
  HelpCircle,
  Menu,
  X,
  Compass,
} from "lucide-react";
import { useState } from "react";

interface NavbarProps {
  onOpenAskAI?: () => void;
}

export function Navbar({ onOpenAskAI }: NavbarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navLinks = [
    { label: "Dashboard", href: "/dashboard", icon: Layers },
    { label: "Upload", href: "/upload", icon: UploadCloud },
    { label: "Transactions", href: "/transactions", icon: Layers },
    { label: "Analytics", href: "/analytics", icon: PieChart },
    { label: "Where Money Goes", href: "/where-did-my-money-go", icon: Compass },
    { label: "Recurring", href: "/recurring", icon: Repeat },
    { label: "Budget Simulator", href: "/budget", icon: Calculator },
    { label: "Report", href: "/report", icon: FileText },
  ];

  const handleLogout = async () => {
    await logout();
    router.push("/");
  };

  return (
    <header className="sticky top-0 z-40 w-full border-b border-[#1E2638] bg-[#090D16]/90 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Brand */}
          <div className="flex items-center gap-8">
            <Link href={user ? "/dashboard" : "/"} className="flex items-center gap-2.5 group">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-400 to-teal-600 flex items-center justify-center shadow-lg shadow-emerald-500/20 group-hover:scale-105 transition-transform">
                <Sparkles className="w-5 h-5 text-black stroke-[2.5]" />
              </div>
              <div className="flex flex-col">
                <span className="text-lg font-bold tracking-tight text-white flex items-center gap-1.5">
                  SpendWise <span className="text-emerald-400 text-xs px-1.5 py-0.5 rounded font-mono bg-emerald-500/10 border border-emerald-500/30">AI</span>
                </span>
                <span className="text-[10px] text-slate-400 tracking-wider uppercase font-medium -mt-1">
                  Expense Detective
                </span>
              </div>
            </Link>

            {/* Desktop Navigation */}
            {user && (
              <nav className="hidden xl:flex items-center gap-1">
                {navLinks.map((item) => {
                  const isActive = pathname === item.href;
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                        isActive
                          ? "bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 shadow-sm shadow-emerald-500/10"
                          : "text-slate-300 hover:text-white hover:bg-slate-800/60"
                      }`}
                    >
                      {item.label}
                    </Link>
                  );
                })}
              </nav>
            )}
          </div>

          {/* Right Action Area */}
          <div className="flex items-center gap-3">
            {/* Ask AI Button */}
            {user && onOpenAskAI && (
              <button
                onClick={onOpenAskAI}
                className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold bg-gradient-to-r from-emerald-500/20 via-teal-500/20 to-emerald-500/10 border border-emerald-500/40 text-emerald-300 hover:border-emerald-400 hover:bg-emerald-500/25 transition-all shadow-sm"
              >
                <Sparkles className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
                <span className="hidden sm:inline">Ask AI Detective</span>
                <span className="text-[10px] px-1 py-0.2 bg-emerald-400/20 text-emerald-300 rounded font-mono">
                  Groq 70B
                </span>
              </button>
            )}

            {user ? (
              <div className="flex items-center gap-2">
                {user.isDemo && (
                  <span className="hidden md:inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-300 border border-amber-500/30">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-ping" />
                    Demo Mode
                  </span>
                )}

                <Link
                  href="/settings"
                  className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800/60 transition-colors"
                  title="Data & Settings"
                >
                  <Settings className="w-4 h-4" />
                </Link>

                <div className="hidden sm:flex items-center gap-2 pl-2 border-l border-slate-800">
                  <div className="w-7 h-7 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-xs font-semibold text-emerald-400">
                    {user.name.charAt(0).toUpperCase()}
                  </div>
                  <span className="text-xs text-slate-300 max-w-[100px] truncate font-medium">
                    {user.name}
                  </span>
                </div>

                <button
                  onClick={handleLogout}
                  className="p-2 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                  title="Sign Out"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <Link
                  href="/login"
                  className="text-xs font-medium text-slate-300 hover:text-white px-3 py-1.5 rounded-lg hover:bg-slate-800/60 transition-colors"
                >
                  Sign In
                </Link>
                <Link
                  href="/signup"
                  className="text-xs font-semibold px-4 py-2 rounded-lg bg-emerald-500 text-slate-950 hover:bg-emerald-400 transition-all shadow-md shadow-emerald-500/20"
                >
                  Get Started →
                </Link>
              </div>
            )}

            {/* Mobile Hamburger */}
            {user && (
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="xl:hidden p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800/60"
              >
                {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
            )}
          </div>
        </div>

        {/* Mobile Navigation Drawer */}
        {user && mobileMenuOpen && (
          <div className="xl:hidden py-4 border-t border-[#1E2638] bg-[#090D16] space-y-1">
            {navLinks.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium ${
                    isActive
                      ? "bg-emerald-500/15 text-emerald-300 border border-emerald-500/30"
                      : "text-slate-300 hover:bg-slate-800/50"
                  }`}
                >
                  <Icon className="w-4 h-4 text-emerald-400" />
                  {item.label}
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </header>
  );
}
