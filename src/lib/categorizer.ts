import { Category, TransactionType } from "@/types";

interface MerchantRule {
  merchant: string;
  category: Category;
  aliases: string[];
  defaultConfidence: number;
}

const MERCHANT_DATABASE: MerchantRule[] = [
  // Food & Dining
  {
    merchant: "Swiggy",
    category: "Food & Dining",
    aliases: ["swiggy", "bundl technologies", "swiggy instafood"],
    defaultConfidence: 0.98,
  },
  {
    merchant: "Zomato",
    category: "Food & Dining",
    aliases: ["zomato", "zomato limited", "zomato media"],
    defaultConfidence: 0.98,
  },
  {
    merchant: "McDonald's",
    category: "Food & Dining",
    aliases: ["mcdonald", "mcdonalds", "hardcastle", "connaught plaza"],
    defaultConfidence: 0.95,
  },
  {
    merchant: "Starbucks",
    category: "Food & Dining",
    aliases: ["starbucks", "tata starbucks"],
    defaultConfidence: 0.95,
  },
  {
    merchant: "Chai Point",
    category: "Food & Dining",
    aliases: ["chai point", "mountain trail foods"],
    defaultConfidence: 0.95,
  },
  {
    merchant: "Chaayos",
    category: "Food & Dining",
    aliases: ["chaayos", "sunshine teahouse"],
    defaultConfidence: 0.95,
  },
  {
    merchant: "Domino's",
    category: "Food & Dining",
    aliases: ["domino", "dominos", "jubilant foodworks"],
    defaultConfidence: 0.95,
  },
  {
    merchant: "KFC",
    category: "Food & Dining",
    aliases: ["kfc", "devyani international", "sapphire foods"],
    defaultConfidence: 0.95,
  },
  {
    merchant: "Pizza Hut",
    category: "Food & Dining",
    aliases: ["pizza hut"],
    defaultConfidence: 0.95,
  },
  {
    merchant: "Subway",
    category: "Food & Dining",
    aliases: ["subway"],
    defaultConfidence: 0.95,
  },
  {
    merchant: "Burger King",
    category: "Food & Dining",
    aliases: ["burger king", "restaurant brands asia"],
    defaultConfidence: 0.95,
  },
  {
    merchant: "Haldiram's",
    category: "Food & Dining",
    aliases: ["haldiram", "haldirams"],
    defaultConfidence: 0.92,
  },
  {
    merchant: "Behrouz Biryani",
    category: "Food & Dining",
    aliases: ["behrouz", "rebel foods", "faasos", "ovenstory"],
    defaultConfidence: 0.95,
  },
  {
    merchant: "EatClub",
    category: "Food & Dining",
    aliases: ["eatclub", "box8", "mojo pizza"],
    defaultConfidence: 0.92,
  },
  {
    merchant: "Bikanervala",
    category: "Food & Dining",
    aliases: ["bikanervala", "bikano"],
    defaultConfidence: 0.92,
  },

  // Groceries & Quick Commerce
  {
    merchant: "Zepto",
    category: "Groceries",
    aliases: ["zepto", "kiranakart", "zepto delivery"],
    defaultConfidence: 0.98,
  },
  {
    merchant: "Blinkit",
    category: "Groceries",
    aliases: ["blinkit", "grofers", "blink commerce"],
    defaultConfidence: 0.98,
  },
  {
    merchant: "Swiggy Instamart",
    category: "Groceries",
    aliases: ["instamart", "swiggy grocery"],
    defaultConfidence: 0.98,
  },
  {
    merchant: "BigBasket",
    category: "Groceries",
    aliases: ["bigbasket", "innovative retail", "bbdaily"],
    defaultConfidence: 0.96,
  },
  {
    merchant: "DMart",
    category: "Groceries",
    aliases: ["dmart", "avenue supermarts", "dmart ready"],
    defaultConfidence: 0.96,
  },
  {
    merchant: "JioMart",
    category: "Groceries",
    aliases: ["jiomart", "reliance retail grocery"],
    defaultConfidence: 0.94,
  },
  {
    merchant: "Nature's Basket",
    category: "Groceries",
    aliases: ["natures basket", "nature basket"],
    defaultConfidence: 0.94,
  },
  {
    merchant: "Country Delight",
    category: "Groceries",
    aliases: ["country delight"],
    defaultConfidence: 0.94,
  },
  {
    merchant: "MilkBasket",
    category: "Groceries",
    aliases: ["milkbasket"],
    defaultConfidence: 0.94,
  },

  // Shopping & E-Commerce
  {
    merchant: "Amazon",
    category: "Shopping",
    aliases: ["amazon", "amzn", "amazon pay", "amazon seller"],
    defaultConfidence: 0.95,
  },
  {
    merchant: "Flipkart",
    category: "Shopping",
    aliases: ["flipkart", "fkrt", "flipkart internet"],
    defaultConfidence: 0.95,
  },
  {
    merchant: "Myntra",
    category: "Shopping",
    aliases: ["myntra", "myntra designs"],
    defaultConfidence: 0.96,
  },
  {
    merchant: "Ajio",
    category: "Shopping",
    aliases: ["ajio", "reliance ajio"],
    defaultConfidence: 0.96,
  },
  {
    merchant: "Meesho",
    category: "Shopping",
    aliases: ["meesho", "fashnear"],
    defaultConfidence: 0.95,
  },
  {
    merchant: "Nykaa",
    category: "Shopping",
    aliases: ["nykaa", "fsn e-commerce"],
    defaultConfidence: 0.95,
  },
  {
    merchant: "Tata CLiQ",
    category: "Shopping",
    aliases: ["tata cliq", "tatacliq"],
    defaultConfidence: 0.94,
  },
  {
    merchant: "Decathlon",
    category: "Shopping",
    aliases: ["decathlon"],
    defaultConfidence: 0.95,
  },
  {
    merchant: "Croma",
    category: "Shopping",
    aliases: ["croma", "infiniti retail"],
    defaultConfidence: 0.95,
  },
  {
    merchant: "Reliance Digital",
    category: "Shopping",
    aliases: ["reliance digital"],
    defaultConfidence: 0.95,
  },
  {
    merchant: "Zara",
    category: "Shopping",
    aliases: ["zara", "inditex"],
    defaultConfidence: 0.95,
  },
  {
    merchant: "H&M",
    category: "Shopping",
    aliases: ["h&m", "hennes and mauritz", "hm hennez"],
    defaultConfidence: 0.95,
  },
  {
    merchant: "Lenskart",
    category: "Shopping",
    aliases: ["lenskart"],
    defaultConfidence: 0.95,
  },
  {
    merchant: "Uniqlo",
    category: "Shopping",
    aliases: ["uniqlo"],
    defaultConfidence: 0.95,
  },

  // Transport & Travel
  {
    merchant: "Uber",
    category: "Transport",
    aliases: ["uber", "uber india", "rasier operations"],
    defaultConfidence: 0.98,
  },
  {
    merchant: "Ola Cabs",
    category: "Transport",
    aliases: ["ola", "olacabs", "ani technologies"],
    defaultConfidence: 0.98,
  },
  {
    merchant: "Rapido",
    category: "Transport",
    aliases: ["rapido", "roppen transportation"],
    defaultConfidence: 0.98,
  },
  {
    merchant: "BluSmart",
    category: "Transport",
    aliases: ["blusmart", "gensol"],
    defaultConfidence: 0.96,
  },
  {
    merchant: "Metro Transit",
    category: "Transport",
    aliases: ["metro", "namma metro", "dmrc", "delhi metro", "mumbai metro", "bmrcl"],
    defaultConfidence: 0.95,
  },
  {
    merchant: "Fastag Toll",
    category: "Transport",
    aliases: ["fastag", "nhai", "toll plaza", "ihmcl"],
    defaultConfidence: 0.95,
  },
  {
    merchant: "Fuel Station",
    category: "Transport",
    aliases: ["hpcl", "bpcl", "iocl", "indian oil", "bharat petroleum", "hindustan petroleum", "shell petrol", "petrol"],
    defaultConfidence: 0.92,
  },
  {
    merchant: "IRCTC",
    category: "Travel",
    aliases: ["irctc", "indian railways", "railway ticket"],
    defaultConfidence: 0.96,
  },
  {
    merchant: "MakeMyTrip",
    category: "Travel",
    aliases: ["makemytrip", "mmt"],
    defaultConfidence: 0.96,
  },
  {
    merchant: "Cleartrip",
    category: "Travel",
    aliases: ["cleartrip"],
    defaultConfidence: 0.95,
  },
  {
    merchant: "Goibibo",
    category: "Travel",
    aliases: ["goibibo", "ibibo"],
    defaultConfidence: 0.95,
  },
  {
    merchant: "Indigo Airlines",
    category: "Travel",
    aliases: ["indigo", "interglobe aviation"],
    defaultConfidence: 0.96,
  },
  {
    merchant: "Air India",
    category: "Travel",
    aliases: ["air india"],
    defaultConfidence: 0.96,
  },
  {
    merchant: "Airbnb",
    category: "Travel",
    aliases: ["airbnb"],
    defaultConfidence: 0.95,
  },

  // Subscriptions & Entertainment
  {
    merchant: "Netflix",
    category: "Subscriptions",
    aliases: ["netflix", "netflix entertainment"],
    defaultConfidence: 0.98,
  },
  {
    merchant: "Spotify",
    category: "Subscriptions",
    aliases: ["spotify", "spotify india"],
    defaultConfidence: 0.98,
  },
  {
    merchant: "YouTube Premium",
    category: "Subscriptions",
    aliases: ["youtube", "google youtube"],
    defaultConfidence: 0.96,
  },
  {
    merchant: "Amazon Prime",
    category: "Subscriptions",
    aliases: ["prime video", "amazon prime"],
    defaultConfidence: 0.96,
  },
  {
    merchant: "Hotstar",
    category: "Subscriptions",
    aliases: ["hotstar", "disney+ hotstar", "disney star", "novi digital"],
    defaultConfidence: 0.96,
  },
  {
    merchant: "Apple Services",
    category: "Subscriptions",
    aliases: ["apple.com/bill", "itunes", "apple services", "icloud"],
    defaultConfidence: 0.96,
  },
  {
    merchant: "Google One",
    category: "Subscriptions",
    aliases: ["google storage", "google one"],
    defaultConfidence: 0.95,
  },
  {
    merchant: "ChatGPT / OpenAI",
    category: "Subscriptions",
    aliases: ["openai", "chatgpt"],
    defaultConfidence: 0.96,
  },
  {
    merchant: "BookMyShow",
    category: "Entertainment",
    aliases: ["bookmyshow", "bigtree entertainment"],
    defaultConfidence: 0.96,
  },
  {
    merchant: "PVR Cinemas",
    category: "Entertainment",
    aliases: ["pvr", "pvr inox", "inox leisure", "cinepolis"],
    defaultConfidence: 0.96,
  },
  {
    merchant: "SonyLIV",
    category: "Entertainment",
    aliases: ["sonyliv", "culver max"],
    defaultConfidence: 0.94,
  },
  {
    merchant: "Steam Games",
    category: "Entertainment",
    aliases: ["steam", "valvesoftware"],
    defaultConfidence: 0.94,
  },

  // Recharge & Bills
  {
    merchant: "Jio Prepaid/Postpaid",
    category: "Recharge",
    aliases: ["jio recharge", "reliance jio", "jio infocomm", "jio prepaid"],
    defaultConfidence: 0.96,
  },
  {
    merchant: "Airtel Mobile",
    category: "Recharge",
    aliases: ["airtel recharge", "bharti airtel", "airtel payment", "airtel prepaid"],
    defaultConfidence: 0.96,
  },
  {
    merchant: "Vi (Vodafone Idea)",
    category: "Recharge",
    aliases: ["vodafone", "idea cellular", "vodafone idea", "vi prepaid"],
    defaultConfidence: 0.96,
  },
  {
    merchant: "Electricity Board",
    category: "Bills & Utilities",
    aliases: ["bescom", "tata power", "adani electricity", "mseb", "mppkvvcl", "cesc", "tneb", "discom", "power corp"],
    defaultConfidence: 0.95,
  },
  {
    merchant: "Water & Gas Board",
    category: "Bills & Utilities",
    aliases: ["bwssb", "igl", "indraprastha gas", "mahanagar gas", "piped gas", "water supply"],
    defaultConfidence: 0.95,
  },
  {
    merchant: "Broadband & Fiber",
    category: "Bills & Utilities",
    aliases: ["act fibernet", "airtel broadband", "jiofiber", "hathway", "broadband"],
    defaultConfidence: 0.94,
  },

  // Healthcare
  {
    merchant: "Apollo Pharmacy",
    category: "Healthcare",
    aliases: ["apollo", "apollo pharmacy", "apollo 247", "apollo hospital"],
    defaultConfidence: 0.96,
  },
  {
    merchant: "Tata 1mg",
    category: "Healthcare",
    aliases: ["1mg", "tata 1mg"],
    defaultConfidence: 0.96,
  },
  {
    merchant: "Netmeds",
    category: "Healthcare",
    aliases: ["netmeds"],
    defaultConfidence: 0.96,
  },
  {
    merchant: "PharmEasy",
    category: "Healthcare",
    aliases: ["pharmeasy"],
    defaultConfidence: 0.96,
  },
  {
    merchant: "Practo",
    category: "Healthcare",
    aliases: ["practo"],
    defaultConfidence: 0.94,
  },
  {
    merchant: "Dr Lal PathLabs",
    category: "Healthcare",
    aliases: ["dr lal", "lal pathlabs", "thyrocare"],
    defaultConfidence: 0.95,
  },

  // Education
  {
    merchant: "Coursera",
    category: "Education",
    aliases: ["coursera"],
    defaultConfidence: 0.95,
  },
  {
    merchant: "Udemy",
    category: "Education",
    aliases: ["udemy"],
    defaultConfidence: 0.95,
  },
  {
    merchant: "Unacademy",
    category: "Education",
    aliases: ["unacademy"],
    defaultConfidence: 0.95,
  },

  // Salary & Inward Income
  {
    merchant: "Employer Salary",
    category: "Salary/Income",
    aliases: ["salary", "payroll", "inward neft", "stipend", "bonus payment"],
    defaultConfidence: 0.96,
  },
  {
    merchant: "Bank Interest",
    category: "Salary/Income",
    aliases: ["interest credit", "sb interest", "fd interest", "dividend credit"],
    defaultConfidence: 0.96,
  },

  // Cash & Transfers
  {
    merchant: "ATM Cash Withdrawal",
    category: "Cash Withdrawal",
    aliases: ["atm wdl", "cash wdl", "atm withdrawal", "nfs atm"],
    defaultConfidence: 0.98,
  },
];

/**
 * Extracts a human-friendly merchant/entity name from raw statement descriptions
 */
export function extractCleanMerchant(rawDescription: string): string {
  const desc = rawDescription.trim();

  // 1. Direct match with alias
  const lower = desc.toLowerCase();
  for (const rule of MERCHANT_DATABASE) {
    if (rule.aliases.some((alias) => lower.includes(alias))) {
      return rule.merchant;
    }
  }

  // 2. UPI Pattern matches
  // Example: UPI/42918239/Swiggy/ICICI... or UPI-ZEPTO-1234
  const upiMatch = desc.match(/UPI(?:-|\/)(?:DR\/|CR\/)?(?:[A-Z0-9]+\/)?([A-Za-z0-9\s&.]+?)(?:\/|-|\d{8,}|$)/i);
  if (upiMatch && upiMatch[1]) {
    const candidate = upiMatch[1].trim();
    if (candidate.length > 2 && !/^\d+$/.test(candidate)) {
      return formatMerchantTitle(candidate);
    }
  }

  // 3. "Paid to X" or "Payment to X" or "To X"
  const paidToMatch = desc.match(/(?:paid to|payment to|transfer to|to:?)\s+([A-Za-z0-9\s&.']+?)(?:(?:on|ref|upi|\/|\d{6,}|$))/i);
  if (paidToMatch && paidToMatch[1]) {
    const candidate = paidToMatch[1].trim();
    if (candidate.length > 2) {
      return formatMerchantTitle(candidate);
    }
  }

  // 4. "POS / ECOM / VPA / NEFT / IMPS"
  const posMatch = desc.match(/(?:POS|ECOM|VPA|IMPS|NEFT)[\s/]+([A-Za-z0-9\s&.]+?)(?:\s{2,}|\/|\d{6,}|$)/i);
  if (posMatch && posMatch[1]) {
    return formatMerchantTitle(posMatch[1].trim());
  }

  // Fallback: clean up first 3-4 words
  const words = desc.split(/[/\\_-]/)[0].trim();
  return formatMerchantTitle(words.slice(0, 32));
}

function formatMerchantTitle(str: string): string {
  // Remove trailing bank codes like ICICI, HDFC, SBI, OKAXIS
  let clean = str.replace(/\b(okaxis|oksbi|okhdfcbank|okicici|paytm|ybl|ibl)\b/gi, "").trim();
  clean = clean.replace(/[@#*]/g, " ").trim();
  if (!clean) return "UPI Transaction";

  // Capitalize nicely
  return clean
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 4)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(" ");
}

/**
 * Categorizes a transaction based on description, merchant, and transaction type
 */
export function categorizeTransaction(
  description: string,
  merchantName: string,
  type: TransactionType
): { category: Category; confidence: number; merchant: string } {
  const cleanMerchant = merchantName || extractCleanMerchant(description);
  const text = `${description} ${cleanMerchant}`.toLowerCase();

  // If credit and contains salary/payroll/refund
  if (type === "credit") {
    if (/salary|payroll|stipend|wages|employer/i.test(text)) {
      return { category: "Salary/Income", confidence: 0.98, merchant: cleanMerchant };
    }
    if (/interest|dividend|bonus/i.test(text)) {
      return { category: "Salary/Income", confidence: 0.95, merchant: cleanMerchant };
    }
    if (/refund|cashback|reversal/i.test(text)) {
      return { category: "Other", confidence: 0.85, merchant: cleanMerchant };
    }
    // Default credit is Transfer or Income
    return { category: "Salary/Income", confidence: 0.70, merchant: cleanMerchant };
  }

  // Check merchant database
  for (const rule of MERCHANT_DATABASE) {
    if (
      cleanMerchant.toLowerCase() === rule.merchant.toLowerCase() ||
      rule.aliases.some((alias) => text.includes(alias))
    ) {
      return {
        category: rule.category,
        confidence: rule.defaultConfidence,
        merchant: rule.merchant,
      };
    }
  }

  // Keyword-based fallback rules
  if (/tea|coffee|cafe|dhaba|bites|restaurant|kitchen|bakery|biryani|sweets|food|dine|pizza|burger/i.test(text)) {
    return { category: "Food & Dining", confidence: 0.85, merchant: cleanMerchant };
  }
  if (/supermarket|kirana|mart|grocery|fruits|veggies|vegetables|dairy|store/i.test(text)) {
    return { category: "Groceries", confidence: 0.85, merchant: cleanMerchant };
  }
  if (/cab|auto|taxi|petrol|diesel|fuel|metro|toll|fastag|ride|parking/i.test(text)) {
    return { category: "Transport", confidence: 0.85, merchant: cleanMerchant };
  }
  if (/electricity|water|power|gas|broadband|wifi|maintenance/i.test(text)) {
    return { category: "Bills & Utilities", confidence: 0.85, merchant: cleanMerchant };
  }
  if (/recharge|prepaid|dth|mobile plan/i.test(text)) {
    return { category: "Recharge", confidence: 0.85, merchant: cleanMerchant };
  }
  if (/pharmacy|medical|chemist|hospital|clinic|doctor|diagnostics|lab/i.test(text)) {
    return { category: "Healthcare", confidence: 0.88, merchant: cleanMerchant };
  }
  if (/cinema|theatre|movie|gaming|entertainment/i.test(text)) {
    return { category: "Entertainment", confidence: 0.85, merchant: cleanMerchant };
  }
  if (/flight|hotel|resort|railway|train|travel|trip|lodge/i.test(text)) {
    return { category: "Travel", confidence: 0.85, merchant: cleanMerchant };
  }
  if (/course|school|college|tuition|exam|education|academy/i.test(text)) {
    return { category: "Education", confidence: 0.85, merchant: cleanMerchant };
  }
  if (/subscription|membership|monthly pass|annual pass/i.test(text)) {
    return { category: "Subscriptions", confidence: 0.85, merchant: cleanMerchant };
  }
  if (/atm|cash withdrawal|self wdl/i.test(text)) {
    return { category: "Cash Withdrawal", confidence: 0.90, merchant: cleanMerchant };
  }
  if (/transfer to|sent to|p2p|friend|family/i.test(text)) {
    return { category: "Transfers", confidence: 0.75, merchant: cleanMerchant };
  }

  // Default fallback
  return { category: "Other", confidence: 0.45, merchant: cleanMerchant };
}

export const CATEGORY_COLORS: Record<Category, string> = {
  "Food & Dining": "#F59E0B", // Amber
  Groceries: "#10B981", // Emerald
  Shopping: "#EC4899", // Pink
  Transport: "#3B82F6", // Blue
  "Bills & Utilities": "#8B5CF6", // Purple
  Recharge: "#06B6D4", // Cyan
  Entertainment: "#F43F5E", // Rose
  Education: "#6366F1", // Indigo
  Healthcare: "#14B8A6", // Teal
  Travel: "#EAB308", // Yellow
  Subscriptions: "#A855F7", // Purple Accent
  "Salary/Income": "#22C55E", // Green
  Transfers: "#64748B", // Slate
  "Cash Withdrawal": "#78716C", // Stone
  Other: "#94A3B8", // Gray
};
