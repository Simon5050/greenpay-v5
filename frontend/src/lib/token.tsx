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
    address:          (process.env.NEXT_PUBLIC_USDC_ADDRESS          ?? "0x3600000000000000000000000000000000000000") as `0x${string}`,
    greenPayAddress:  (process.env.NEXT_PUBLIC_GREEN_PAY_ADDRESS      ?? "0x") as `0x${string}`,
    invoiceAddress:   (process.env.NEXT_PUBLIC_INVOICE_MANAGER_ADDRESS ?? "0x") as `0x${string}`,
    greenFundAddress: (process.env.NEXT_PUBLIC_GREEN_FUND_ADDRESS      ?? "0x") as `0x${string}`,
    decimals:         6,
    color:            "text-blue-400",
    bg:               "bg-blue-400/10",
    border:           "border-blue-400/30",
    flag:             "🇺🇸",
  },
  EURC: {
    symbol:           "EURC",
    name:             "Euro Coin",
    address:          (process.env.NEXT_PUBLIC_EURC_ADDRESS                    ?? "0x89B50855Aa3bE2F677cD6303Cec089B5F319D72a") as `0x${string}`,
    greenPayAddress:  (process.env.NEXT_PUBLIC_EURC_GREEN_PAY_ADDRESS          ?? "0x") as `0x${string}`,
    invoiceAddress:   (process.env.NEXT_PUBLIC_EURC_INVOICE_MANAGER_ADDRESS    ?? "0x") as `0x${string}`,
    greenFundAddress: (process.env.NEXT_PUBLIC_EURC_GREEN_FUND_ADDRESS         ?? "0x") as `0x${string}`,
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

const TokenContext = createContext<TokenContextValue>({
  token:     TOKENS.USDC,
  symbol:    "USDC",
  setSymbol: () => {},
  isUSDC:    true,
  isEURC:    false,
});

export function TokenProvider({ children }: { children: ReactNode }) {
  const [symbol, setSymbol] = useState<TokenSymbol>("USDC");
  const token = TOKENS[symbol];

  return (
    <TokenContext.Provider value={{
      token,
      symbol,
      setSymbol,
      isUSDC: symbol === "USDC",
      isEURC: symbol === "EURC",
    }}>
      {children}
    </TokenContext.Provider>
  );
}

export function useToken() {
  return useContext(TokenContext);
}
