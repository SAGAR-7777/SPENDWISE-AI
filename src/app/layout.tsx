import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/providers";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export const metadata: Metadata = {
  title: "SpendWise AI — Personal Expense Detective for UPI & Bank Statements",
  description:
    "AI-powered financial expense detective for Indian users. Upload your PhonePe, Google Pay, Paytm, or bank statements to discover spending patterns, detect recurring payments, and unlock real financial clarity.",
  keywords: [
    "SpendWise AI",
    "UPI expense tracker",
    "PhonePe statement analyzer",
    "Google Pay expense insights",
    "Indian fintech AI",
    "Personal finance India",
    "Recurring payment detector",
  ],
  authors: [{ name: "SpendWise AI Team" }],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${inter.variable} dark h-full antialiased`}>
      <body className="min-h-full flex flex-col bg-[#090D16] text-[#F1F5F9] font-sans selection:bg-emerald-500/20 selection:text-emerald-300">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
