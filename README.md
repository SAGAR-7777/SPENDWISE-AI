# SpendWise AI — Personal Expense Detective for Indian Users

**SpendWise AI** is a production-grade personal financial expense detective tailored specifically for Indian users. It extracts transactions from **PhonePe, Google Pay, Paytm, and bank statements (PDF & CSV)**, categorizes Indian merchants, detects recurring subscriptions, flags frequent micro-purchases, and generates verified AI insights without mathematical hallucinations.

---

## ✦ Key Features

- **Multi-Format Statement Ingestion**:
  - Full support for digital **PDF** statements (`unpdf`) and **CSV** statements (`papaparse`).
  - Handles Indian number systems (e.g. `1,45,200.00` or `₹ 2,450.50`), debit/credit nuances, and Indian date formats (`DD/MM/YYYY`, `DD-MM-YYYY`, `DD Mon YYYY`).
  - Real-time 8-stage progress tracker: *Uploading → Reading → Extracting → Cleaning → Categorizing → Calculating → Generating AI → Complete*.

- **Indian Entity Categorization Engine**:
  - Over 250+ Indian merchants & UPI entities pre-indexed (Swiggy, Zomato, Zepto, Blinkit, BigBasket, DMart, Uber, Ola, Rapido, Amazon, Flipkart, Myntra, Jio, Airtel, BESCOM, Apollo Pharmacy, Netflix, Spotify, etc.).
  - Extracts clean human-readable names from complex UPI narration strings (`UPI/4281928312/Swiggy/...` → `Swiggy`).
  - Assigns confidence scores and allows users to manually re-assign categories with instant recalculation.

- **"Where Did My Money Go?" Detective Page**:
  - **Frequent Micro-Purchases Detector**: Tracks repetitive ₹20–₹150 chai/coffee/quick snack spending that quietly accumulates.
  - **Outlier Detection**: Statistically flags unusually large transactions exceeding normal deviations.
  - **Potentially Reducible Spending**: Unbiased, non-judgmental identification of discretionary clusters with actionable suggestions.

- **Recurring Subscriptions & Mandates**:
  - Detects recurring monthly commitments (Netflix, Spotify, YouTube Premium, broadband, gym, mobile recharges).
  - Explicitly labels certain vs. possible recurring payments to avoid false certainty.

- **Budget & Savings Scenario Simulator**:
  - Interactive "What-If" modeling sliders (e.g. *"What if I reduce food delivery by ₹1,000?"*).
  - Calculates projected new savings, savings rate, and annual compounding impact in real time.

- **Ask SpendWise AI (Groq Llama / GPT-OSS)**:
  - Interactive AI financial analyst powered by Groq's high-speed inference engine.
  - **Zero-Math-Hallucination Architecture**: Numerical totals and aggregates are pre-computed deterministically in application code and passed to the model, ensuring 100% mathematical integrity.

- **Executive Monthly Report**:
  - Consolidated report ready for printing or exporting to PDF with executive AI takeaways.

- **Privacy-First Architecture & Supabase RLS**:
  - Supabase PostgreSQL schema with Row Level Security (RLS) guaranteeing strict tenant data isolation.
  - Statements and parsed transactions can be wiped completely by the user at any time (cascade deletion).
  - Resilient local storage provider for 1-click evaluation and demo testing.

---

## 🛠 Tech Stack

- **Framework**: [Next.js](https://nextjs.org/) (App Router, Turbopack)
- **Frontend**: React 19, TypeScript, Tailwind CSS
- **Database & Auth**: [Supabase](https://supabase.com/) PostgreSQL + Supabase Auth (with Row Level Security)
- **AI Inference**: [Groq API](https://groq.com/) (`openai/gpt-oss-120b`, `llama-3.3-70b-versatile`)
- **Parsers**: `unpdf` (zero-canvas edge/node PDF text extractor), `papaparse` (CSV engine)
- **Charts**: [Recharts](https://recharts.org/) (Donut, Bar, Cash Flow Timelines)
- **Icons**: [Lucide React](https://lucide.dev/)

---

## ⚙️ Environment Variables

Create a `.env.local` file in the root directory:

```env
# Groq API Key (Used server-side for AI insights and chat)
GROQ_API_KEY=your_groq_api_key_here

# Supabase Credentials (Optional for local/demo mode; required for cloud database)
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

> **Security Note:** Secrets like `GROQ_API_KEY` are strictly server-side and never exposed to client browsers.

---

## 🚀 How to Run Locally

### 1. Install Dependencies
```bash
npm install
```

### 2. Run the Development Server
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### 3. Run E2E Verification Tests
To run the automated test suite verifying all routes, statement parsing, categorization, and Groq AI inference:
```bash
node scripts/test-e2e.mjs
```

---

## 🗄 Database Setup (Supabase)

If connecting to your Supabase project:
1. Open your Supabase Dashboard and go to the **SQL Editor**.
2. Run the migration script located at `supabase/schema.sql`.
3. This creates all 4 tables (`statements`, `transactions`, `budgets`, `user_preferences`) and applies Row Level Security policies.
4. Copy your project URL and anon key into `.env.local`.

---

## ☁️ How to Deploy

### Deploy to Vercel
1. Push your repository to GitHub.
2. Import the project into [Vercel](https://vercel.com/).
3. Add the environment variables:
   - `GROQ_API_KEY`
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
4. Deploy!

---

## ⚠️ Limitations & Unsupported Statement Formats

- **Scanned / Image PDFs**: Statements that are photocopied or image-only without an embedded text layer require OCR before ingestion. SpendWise AI will clearly notify the user if a PDF lacks a digital text stream.
- **Password-Protected PDFs**: PDFs with encryption or opening passwords must have their password removed prior to upload.
- **Passbook Photographs**: Camera photos of physical bank passbooks are currently not supported in V1.

---

## 🔮 Recommended V2 Features

1. **Email / SMS Statement Ingestion**: Automated email forwarding (e.g. `statement@my.spendwise.ai`) or SMS webhook parser for instant real-time UPI transaction logging.
2. **Account Aggregator (RBI AA) Integration**: Direct live account syncing via Setu / OneMoney / Finvu.
3. **Multi-Currency Support**: Automatic FX conversion for international travel transactions (USD, EUR, AED to INR).
4. **Shared / Family Budgets**: Secure multi-user household expense pooling with permissioned visibility.
5. **Smart Receipt OCR**: Receipt snapshot parser using multimodal vision for line-item retail split.
