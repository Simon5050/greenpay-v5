"use client";
import { cn } from "@/lib/utils";
import { Loader2, CheckCircle2, XCircle, ExternalLink } from "lucide-react";
import type { TxStatus } from "@/types";

// ── TxStatusBanner ────────────────────────────────────────────────────────────
interface TxStatusBannerProps {
  status: TxStatus;
  txHash?: `0x${string}`;
  errorMsg?: string;
}

export function TxStatusBanner({ status, txHash, errorMsg }: TxStatusBannerProps) {
  if (status === "idle") return null;

  const explorerBase =
    process.env.NEXT_PUBLIC_EXPLORER_URL ?? "https://explorer.arctest.network";

  const map = {
    approving: {
      icon: <Loader2 className="w-4 h-4 animate-spin" />,
      text: "Approving USDC…",
      cls: "border-earth-500/30 bg-earth-500/10 text-earth-400",
    },
    pending: {
      icon: <Loader2 className="w-4 h-4 animate-spin" />,
      text: "Transaction pending…",
      cls: "border-earth-500/30 bg-earth-500/10 text-earth-400",
    },
    success: {
      icon: <CheckCircle2 className="w-4 h-4" />,
      text: "Transaction confirmed!",
      cls: "border-forest-500/30 bg-forest-500/10 text-forest-400",
    },
    error: {
      icon: <XCircle className="w-4 h-4" />,
      text: errorMsg ?? "Transaction failed.",
      cls: "border-red-500/30 bg-red-500/10 text-red-400",
    },
  };

  const config = map[status];

  return (
    <div className={cn("flex items-center gap-2 px-4 py-3 rounded-xl border text-sm", config.cls)}>
      {config.icon}
      <span>{config.text}</span>
      {txHash && status === "success" && (
        <a
          href={`${explorerBase}/tx/${txHash}`}
          target="_blank"
          rel="noopener noreferrer"
          className="ml-auto flex items-center gap-1 underline underline-offset-2"
        >
          View <ExternalLink className="w-3 h-3" />
        </a>
      )}
    </div>
  );
}

// ── GreenFeeBadge ────────────────────────────────────────────────────────────
interface GreenFeeBadgeProps {
  fee: string;
  className?: string;
}
export function GreenFeeBadge({ fee, className }: GreenFeeBadgeProps) {
  return (
    <div className={cn("badge-green", className)}>
      🌱 {fee} USDC → Carbon Offset
    </div>
  );
}

// ── Skeleton ──────────────────────────────────────────────────────────────────
export function Skeleton({ className }: { className?: string }) {
  return <div className={cn("shimmer rounded-lg", className)} />;
}

// ── PageHeader ────────────────────────────────────────────────────────────────
interface PageHeaderProps {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
}
export function PageHeader({ title, subtitle, action }: PageHeaderProps) {
  return (
    <div className="flex items-start justify-between mb-8">
      <div>
        <h1 className="font-display font-bold text-2xl md:text-3xl text-white">{title}</h1>
        {subtitle && <p className="text-slate-400 mt-1 text-sm">{subtitle}</p>}
      </div>
      {action && <div>{action}</div>}
    </div>
  );
}

// ── EmptyState ────────────────────────────────────────────────────────────────
interface EmptyStateProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  action?: React.ReactNode;
}
export function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="card p-12 flex flex-col items-center text-center gap-4">
      <div className="w-14 h-14 rounded-2xl bg-slate-800 flex items-center justify-center text-slate-400">
        {icon}
      </div>
      <div>
        <h3 className="font-display font-semibold text-white">{title}</h3>
        <p className="text-slate-400 text-sm mt-1">{description}</p>
      </div>
      {action}
    </div>
  );
}

// ── StatCard ──────────────────────────────────────────────────────────────────
interface StatCardProps {
  label: string;
  value: string;
  sub?: string;
  icon?: React.ReactNode;
  accent?: "green" | "earth" | "default";
}
export function StatCard({ label, value, sub, icon, accent = "default" }: StatCardProps) {
  const accentColor = {
    green: "text-forest-400",
    earth: "text-earth-400",
    default: "text-white",
  }[accent];

  return (
    <div className="stat-card">
      <div className="flex items-center justify-between">
        <span className="text-slate-400 text-xs font-medium uppercase tracking-wider">{label}</span>
        {icon && <span className="text-slate-500">{icon}</span>}
      </div>
      <span className={cn("font-display font-bold text-2xl mt-1", accentColor)}>{value}</span>
      {sub && <span className="text-slate-500 text-xs">{sub}</span>}
    </div>
  );
}

// ── AddressDisplay ────────────────────────────────────────────────────────────
import { truncateAddress } from "@/lib/utils";
import { useState } from "react";
import { Copy, Check } from "lucide-react";

export function AddressDisplay({ address }: { address: string }) {
  const [copied, setCopied] = useState(false);
  const copy = () => {
    navigator.clipboard.writeText(address);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };
  return (
    <button
      onClick={copy}
      className="flex items-center gap-1.5 font-mono text-xs text-slate-400 hover:text-white transition-colors group"
    >
      {truncateAddress(address)}
      {copied
        ? <Check className="w-3 h-3 text-forest-400" />
        : <Copy className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
      }
    </button>
  );
}
