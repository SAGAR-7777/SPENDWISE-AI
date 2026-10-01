"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { isSupabaseConfigured, supabase } from "@/lib/supabase/client";
import { generateSyntheticIndianStatement, saveStatement, saveTransactionsBatch } from "@/lib/storage";

export interface User {
  id: string;
  email: string;
  name: string;
  isDemo?: boolean;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, pass: string) => Promise<{ success: boolean; error?: string }>;
  signUp: (email: string, pass: string, name: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  resetPassword: (email: string) => Promise<{ success: boolean; message?: string; error?: string }>;
  loginAsDemoUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const LOCAL_SESSION_KEY = "spendwise_session_user";
const LOCAL_USERS_VAULT = "spendwise_users_vault";

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function initAuth() {
      if (isSupabaseConfigured && supabase) {
        try {
          const { data } = await supabase.auth.getSession();
          if (data.session?.user) {
            setUser({
              id: data.session.user.id,
              email: data.session.user.email || "",
              name: data.session.user.user_metadata?.name || data.session.user.email?.split("@")[0] || "User",
            });
            setLoading(false);
            return;
          }
        } catch (e) {
          console.error("Supabase auth check error:", e);
        }
      }

      // Check local session
      if (typeof window !== "undefined") {
        const stored = localStorage.getItem(LOCAL_SESSION_KEY);
        if (stored) {
          try {
            setUser(JSON.parse(stored));
          } catch {
            localStorage.removeItem(LOCAL_SESSION_KEY);
          }
        }
      }
      setLoading(false);
    }

    initAuth();
  }, []);

  const login = async (email: string, pass: string) => {
    setLoading(true);
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password: pass,
      });
      if (error) {
        setLoading(false);
        return { success: false, error: error.message };
      }
      if (data.user) {
        const u: User = {
          id: data.user.id,
          email: data.user.email || email,
          name: data.user.user_metadata?.name || email.split("@")[0],
        };
        setUser(u);
        setLoading(false);
        return { success: true };
      }
    }

    // Local Vault Authentication
    const vault = getLocalUsersVault();
    const existing = vault.find((u) => u.email.toLowerCase() === email.toLowerCase());

    if (!existing || existing.password !== pass) {
      setLoading(false);
      return { success: false, error: "Invalid email or password" };
    }

    const u: User = {
      id: existing.id,
      email: existing.email,
      name: existing.name,
    };
    setUser(u);
    localStorage.setItem(LOCAL_SESSION_KEY, JSON.stringify(u));
    setLoading(false);
    return { success: true };
  };

  const signUp = async (email: string, pass: string, name: string) => {
    setLoading(true);
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase.auth.signUp({
        email,
        password: pass,
        options: {
          data: { name },
        },
      });
      if (error) {
        setLoading(false);
        return { success: false, error: error.message };
      }
      if (data.user) {
        const u: User = {
          id: data.user.id,
          email: data.user.email || email,
          name,
        };
        setUser(u);
        setLoading(false);
        return { success: true };
      }
    }

    // Local Vault Sign Up
    const vault = getLocalUsersVault();
    if (vault.some((u) => u.email.toLowerCase() === email.toLowerCase())) {
      setLoading(false);
      return { success: false, error: "An account with this email already exists" };
    }

    const newUser = {
      id: crypto.randomUUID(),
      email,
      password: pass,
      name,
    };
    vault.push(newUser);
    saveLocalUsersVault(vault);

    const u: User = { id: newUser.id, email: newUser.email, name: newUser.name };
    setUser(u);
    localStorage.setItem(LOCAL_SESSION_KEY, JSON.stringify(u));
    setLoading(false);
    return { success: true };
  };

  const logout = async () => {
    if (isSupabaseConfigured && supabase) {
      await supabase.auth.signOut();
    }
    setUser(null);
    if (typeof window !== "undefined") {
      localStorage.removeItem(LOCAL_SESSION_KEY);
    }
  };

  const resetPassword = async (email: string) => {
    if (isSupabaseConfigured && supabase) {
      const { error } = await supabase.auth.resetPasswordForEmail(email);
      if (error) return { success: false, error: error.message };
      return { success: true, message: "Password reset link sent to your email." };
    }

    return {
      success: true,
      message: "If an account exists with this email, instructions have been prepared.",
    };
  };

  const loginAsDemoUser = async () => {
    setLoading(true);
    const demoUser: User = {
      id: "demo-user-sagar",
      email: "demo@spendwise.ai",
      name: "Sagar Verma",
      isDemo: true,
    };

    // Pre-populate realistic synthetic statement data if not already present
    const { statement, transactions } = generateSyntheticIndianStatement(demoUser.id);
    await saveStatement(statement);
    await saveTransactionsBatch(transactions);

    setUser(demoUser);
    if (typeof window !== "undefined") {
      localStorage.setItem(LOCAL_SESSION_KEY, JSON.stringify(demoUser));
    }
    setLoading(false);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        signUp,
        logout,
        resetPassword,
        loginAsDemoUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}

function getLocalUsersVault(): Array<{ id: string; email: string; password: string; name: string }> {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(LOCAL_USERS_VAULT);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveLocalUsersVault(vault: Array<{ id: string; email: string; password: string; name: string }>) {
  if (typeof window === "undefined") return;
  localStorage.setItem(LOCAL_USERS_VAULT, JSON.stringify(vault));
}
