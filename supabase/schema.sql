-- ==========================================================
-- SpendWise AI - Production PostgreSQL Database Schema
-- Supabase Migration with Row Level Security (RLS)
-- ==========================================================

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Statements Table
CREATE TABLE IF NOT EXISTS public.statements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    file_name TEXT NOT NULL,
    file_type TEXT NOT NULL,
    uploaded_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    processing_status TEXT NOT NULL DEFAULT 'completed' CHECK (processing_status IN ('uploading', 'processing', 'completed', 'failed')),
    period_start DATE,
    period_end DATE,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- 2. Transactions Table
CREATE TABLE IF NOT EXISTS public.transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    statement_id UUID REFERENCES public.statements(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    description TEXT NOT NULL,
    merchant TEXT NOT NULL,
    amount NUMERIC(12, 2) NOT NULL CHECK (amount >= 0),
    type TEXT NOT NULL CHECK (type IN ('debit', 'credit')),
    category TEXT NOT NULL,
    payment_method TEXT DEFAULT 'UPI',
    confidence NUMERIC(3, 2) DEFAULT 0.90 CHECK (confidence >= 0 AND confidence <= 1.0),
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- 3. Budgets Table
CREATE TABLE IF NOT EXISTS public.budgets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
    monthly_income NUMERIC(12, 2) NOT NULL DEFAULT 0 CHECK (monthly_income >= 0),
    savings_target NUMERIC(12, 2) NOT NULL DEFAULT 0 CHECK (savings_target >= 0),
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- 4. User Preferences Table
CREATE TABLE IF NOT EXISTS public.user_preferences (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
    currency TEXT NOT NULL DEFAULT 'INR',
    theme TEXT NOT NULL DEFAULT 'dark' CHECK (theme IN ('dark', 'light')),
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Indexes for lightning fast queries
CREATE INDEX IF NOT EXISTS idx_statements_user ON public.statements(user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_user ON public.transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_statement ON public.transactions(statement_id);
CREATE INDEX IF NOT EXISTS idx_transactions_date ON public.transactions(date);
CREATE INDEX IF NOT EXISTS idx_transactions_category ON public.transactions(category);
CREATE INDEX IF NOT EXISTS idx_transactions_merchant ON public.transactions(merchant);

-- ==========================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- Strict Isolation: Users can ONLY see, edit, and delete their own data
-- ==========================================================

ALTER TABLE public.statements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.budgets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_preferences ENABLE ROW LEVEL SECURITY;

-- Statements RLS
CREATE POLICY "Users can view their own statements" 
    ON public.statements FOR SELECT 
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own statements" 
    ON public.statements FOR INSERT 
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own statements" 
    ON public.statements FOR UPDATE 
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own statements" 
    ON public.statements FOR DELETE 
    USING (auth.uid() = user_id);

-- Transactions RLS
CREATE POLICY "Users can view their own transactions" 
    ON public.transactions FOR SELECT 
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own transactions" 
    ON public.transactions FOR INSERT 
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own transactions" 
    ON public.transactions FOR UPDATE 
    USING (auth.uid() = user_id);

-- Deleting a transaction is restricted to user's own data
CREATE POLICY "Users can delete their own transactions" 
    ON public.transactions FOR DELETE 
    USING (auth.uid() = user_id);

-- Budgets RLS
CREATE POLICY "Users can manage their own budget" 
    ON public.budgets FOR ALL 
    USING (auth.uid() = user_id);

-- User Preferences RLS
CREATE POLICY "Users can manage their own preferences" 
    ON public.user_preferences FOR ALL 
    USING (auth.uid() = user_id);
