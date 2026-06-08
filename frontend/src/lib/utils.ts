import { formatUnits, parseUnits } from "viem";
import { clsx, type ClassValue } from "clsx";

// ── Tailwind class merger ─────────────────────────────────────────────────────
export function cn(...inputs: ClassValue[]) {
  return clsx(inputs);
}

// ── USDC formatting (6 decimals) ─────────────────────────────────────────────
export const USDC_DECIMALS = 6;

export function formatUSDC(raw: bigint, decimals = 2): string {
  return Number(formatUnits(raw, USDC_DECIMALS)).toLocaleString("en-US", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}

export function parseUSDC(value: string): bigint {
  return parseUnits(value, USDC_DECIMALS);
}

// ── Address truncation ────────────────────────────────────────────────────────
export function truncateAddress(address: string, chars = 4): string {
  return `${address.slice(0, chars + 2)}…${address.slice(-chars)}`;
}

// ── Date formatting ───────────────────────────────────────────────────────────
export function formatTimestamp(ts: bigint | number): string {
  const date = new Date(Number(ts) * 1000);
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function formatDate(ts: bigint | number): string {
  const date = new Date(Number(ts) * 1000);
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

// ── Invoice status labels ─────────────────────────────────────────────────────
export const INVOICE_STATUS = {
  0: { label: "Draft",     color: "text-slate-400",   bg: "bg-slate-400/10"  },
  1: { label: "Issued",    color: "text-earth-400",   bg: "bg-earth-400/10"  },
  2: { label: "Paid",      color: "text-forest-400",  bg: "bg-forest-400/10" },
  3: { label: "Cancelled", color: "text-red-400",     bg: "bg-red-400/10"    },
  4: { label: "Disputed",  color: "text-yellow-400",  bg: "bg-yellow-400/10" },
  5: { label: "Resolved",  color: "text-blue-400",    bg: "bg-blue-400/10"   },
} as const;

export const REQUEST_STATUS = {
  0: { label: "Pending",   color: "text-earth-400",  bg: "bg-earth-400/10"  },
  1: { label: "Fulfilled", color: "text-forest-400", bg: "bg-forest-400/10" },
  2: { label: "Cancelled", color: "text-red-400",    bg: "bg-red-400/10"    },
} as const;

// ── Carbon impact helpers ─────────────────────────────────────────────────────
// 1 USDC of offset ≈ 0.01 kg CO₂ (illustrative estimate)
export function usdcToKgCO2(rawUsdc: bigint): number {
  return Number(formatUnits(rawUsdc, USDC_DECIMALS)) * 0.01;
}

// Trees equivalent: 1 tree absorbs ~21 kg CO₂/year
export function kgToTrees(kg: number): number {
  return kg / 21;
}

// ── Big number max approval ───────────────────────────────────────────────────
export const MAX_UINT256 =
  115792089237316195423570985008687907853269984665640564039457584007913129639935n;
