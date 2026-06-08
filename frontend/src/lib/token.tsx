"use client";

import { createContext, useContext, useState, ReactNode } from "react";

// ── Token definitions ─────────────────────────────────────────────────────────
export type TokenSymbol = "USDC" | "EURC";

export interface TokenConfig {
  symbol:          TokenSymbol;
  name:            string;
  address:         `0x${string}`;
  greenPayAddress: `0x${string}`;
  invoiceAddress:  `0x${string}`;
  greenFundAddress:`0x${string}`;
  decimals:        number;
  color:           string;
  bg:              string;
  border:          string;
  flag:            string;
}

export const TOKENS: Record<TokenSymbol, TokenConfig> = {
  USDC: {
    symbol:           "USDC",
    name:             "USD Coin",
    address:          (process.env.NEXT_PUBLIC_USDC_ADDRESS as `0x${string}`) ?? "0x3600000000000000000000000000000000000000",
    greenPayAddress:  (process.env.NEXT_PUBLIC_GREEN_PAY_ADDRESS as `0x${string}`) ?? "0x0000000000000000000000000000000000000000",
    invoiceAddress:   (process.env.NEXT_PUBLIC_INVOICE_MANAGER_ADDRESS as `0x${string}`) ?? "0x0000000000000000000000000000000000000000",
    greenFundAddress: (process.env.NEXT_PUBLIC_GREEN_FUND_ADDRESS as `0x${string}`) ?? "0x0000000000000000000000000000000000000000",
    decimals:         6,
    color:            "text-blue-400",
    bg:               "bg-blue-400/10",
    border:           "border-blue-400/30",
    flag:             "🇺🇸",
  },
  EURC: {
    symbol:           "EURC",
    name:             "Euro Coin",
    address:          (process.env.NEXT_PUBLIC_EURC_ADDRESS as `0x${string}`) ?? "0x89B50855Aa3bE2F677cD6303Cec089B5F319D72a",
    greenPayAddress:  (process.env.NEXT_PUBLIC_GREEN_PAY_ADDRESS as `0x${string}`) ?? "0x0000000000000000000000000000000000000000",
    invoiceAddress:   (process.env.NEXT_PUBLIC_INVOICE_MANAGER_ADDRESS as `0x${string}`) ?? "0x0000000000000000000000000000000000000000",
    greenFundAddress: (process.env.NEXT_PUBLIC_GREEN_FUND_ADDRESS as `0x${string}`) ?? "0x0000000000000000000000000000000000000000",
    decimals:         6,
    color:            "text-yellow-400",
    bg:               "bg-yellow-400/10",
    border:           "border-yellow-400/30",
    flag:             "🇪🇺",
  },
};

// ── Context ───────────────────────────────────────────────────────────────────
interface TokenContextValue {
  token:     TokenConfig;
  symbol:    TokenSymbol;
  setSymbol: (s: TokenSymbol) => void;
  isUSDC:    boolean;
  isEURC:    boolean;
}

const TokenContext = createContext<TokenContextValue | null>(null);

export function TokenProvider({ children }: { children: ReactNode }) {
  const [symbol, setSymbol] = useState<TokenSymbol>("USDC");
  const token = TOKENS[symbol];

  return (
    <TokenContext.Provider
      value={{
        token,
        symbol,
        setSymbol,
        isUSDC: symbol === "USDC",
        isEURC: symbol === "EURC",
      }}
    >
      {children}
    </TokenContext.Provider>
  );
}

export function useToken() {
  const context = useContext(TokenContext);
  if (!context) {
    throw new Error("useToken must be used within a TokenProvider");
  }
  return context;
}