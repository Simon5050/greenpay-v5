// src/lib/contracts.ts
// Arc Testnet + Shared contracts for USDC & EURC

export const CONTRACTS = {
  // Shared core contracts (used by both USDC and EURC)
  GreenPay:        process.env.NEXT_PUBLIC_GREEN_PAY_ADDRESS        as `0x${string}`,
  InvoiceManager:  process.env.NEXT_PUBLIC_INVOICE_MANAGER_ADDRESS  as `0x${string}`,
  GreenFund:       process.env.NEXT_PUBLIC_GREEN_FUND_ADDRESS       as `0x${string}`,
  Treasury:        process.env.NEXT_PUBLIC_TREASURY_ADDRESS         as `0x${string}`,

  // Tokens
  USDC: process.env.NEXT_PUBLIC_USDC_ADDRESS as `0x${string}`,
  EURC: "0x89B50855Aa3bE2F677cD6303Cec089B5F319D72a" as `0x${string}`, // ← Arc Testnet EURC
} as const;

// ── Standard ERC-20 ABI (works for both USDC and EURC) ─────────────────────
export const ERC20_ABI = [
  {
    inputs: [{ name: "owner", type: "address" }, { name: "spender", type: "address" }],
    name: "allowance",
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ name: "spender", type: "address" }, { name: "amount", type: "uint256" }],
    name: "approve",
    outputs: [{ name: "", type: "bool" }],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [{ name: "account", type: "address" }],
    name: "balanceOf",
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "decimals",
    outputs: [{ name: "", type: "uint8" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "symbol",
    outputs: [{ name: "", type: "string" }],
    stateMutability: "view",
    type: "function",
  },
] as const;

// You can keep USDC_ABI for backward compatibility or just use ERC20_ABI
export const USDC_ABI = ERC20_ABI;

// GreenPay + InvoiceManager ABIs (unchanged)
export const GREEN_PAY_ABI = [ /* your existing GreenPay ABI */ ];
export const INVOICE_MANAGER_ABI = [ /* your existing InvoiceManager ABI */ ];
export const GREEN_FUND_ABI = [ /* your existing GreenFund ABI */ ];