"use client";

import { useAccount } from "wagmi";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { useToken } from "@/lib/token";
import { useTokenBalance, useTokenGreenFund, useTokenGreenPay, useTokenInvoices } from "@/hooks/useTokenContracts";
import { TokenSelector } from "@/components/TokenSelector";
import { formatUSDC, usdcToKgCO2, kgToTrees, truncateAddress } from "@/lib/utils";
import { StatCard, PageHeader } from "@/components/ui";
import { Wallet, Leaf, Send, FileText, Inbox, TrendingUp, Droplets, ArrowRight, Banknote, Smartphone } from "lucide-react";
import Link from "next/link";

export default function DashboardPage() {
  const { address, isConnected } = useAccount();
  const { token } = useToken();
  const { data: balance } = useTokenBalance();
  const { totalContributions, userContribution } = useTokenGreenFund();
  const { sentIds, receivedIds, requestsToMeIds } = useTokenGreenPay();
  const { issuedIds } = useTokenInvoices();

  if (!isConnected) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-20 flex flex-col items-center gap-6 text-center">
        <div className="w-16 h-16 rounded-2xl bg-forest-600/15 border border-forest-500/20 flex items-center justify-center">
          <Wallet className="w-8 h-8 text-forest-400" />
        </div>
        <h2 className="font-display font-bold text-2xl text-white">Connect your wallet</h2>
        <p className="text-slate-400">Connect to view your GreenPay dashboard.</p>
        <ConnectButton />
      </div>
    );
  }

  // ✅ Strong type assertion to fix the stubborn "never" / "{}" error
  const safeUserContribution = (userContribution as bigint) ?? 0n;
  const kg    = usdcToKgCO2(safeUserContribution);
  const trees = kgToTrees(kg);

  return (
    <div className="max-w-6xl mx-auto px-4 py-10">
      <div className="flex items-start justify-between mb-8">
        <div>
          <h1 className="font-display font-bold text-2xl md:text-3xl text-white">Dashboard</h1>
          <p className="text-slate-400 mt-1 text-sm">{truncateAddress(address!)} · Arc Testnet</p>
        </div>
        <TokenSelector />
      </div>

      {/* Main stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard label={`${token.symbol} Balance`}   value={`${token.flag} ${formatUSDC(balance ?? 0n)}`} icon={<Wallet className="w-4 h-4" />} />
        <StatCard label="My CO₂ Offset"               value={`${kg.toFixed(3)} kg`}   sub={`≈ ${trees.toFixed(2)} trees/yr`} icon={<Leaf className="w-4 h-4" />} accent="green" />
        <StatCard label={`${token.symbol} Sent`}      value={sentIds.length.toString()}    icon={<Send className="w-4 h-4" />} />
        <StatCard label="Invoices Issued"             value={issuedIds.length.toString()} icon={<FileText className="w-4 h-4" />} />
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
        <StatCard label={`${token.symbol} Received`} value={receivedIds.length.toString()}    icon={<Inbox className="w-4 h-4" />} />
        <StatCard label="Pending Requests"            value={requestsToMeIds.length.toString()} icon={<Inbox className="w-4 h-4" />} accent={requestsToMeIds.length > 0 ? "earth" : "default"} />
        <StatCard label="Protocol Offset"            value={`${formatUSDC(totalContributions)}`} sub="all-time" icon={<TrendingUp className="w-4 h-4" />} accent="green" />
        <StatCard label="My Contribution"            value={`${formatUSDC(safeUserContribution)}`}   sub="to GreenFund" icon={<Droplets className="w-4 h-4" />} accent="green" />
      </div>

      {/* Quick actions */}
      <h2 className="font-display font-semibold text-white mb-4">Quick Actions</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {[
          { href: "/send",     icon: <Send className="w-5 h-5" />,       label: `Send ${token.symbol}`,    sub: `Transfer ${token.symbol} instantly`     },
          { href: "/request",  icon: <Inbox className="w-5 h-5" />,      label: "Request Payment",         sub: "Ask someone to pay you"                 },
          { href: "/invoices", icon: <FileText className="w-5 h-5" />,   label: "Create Invoice",          sub: "Issue a detailed invoice"               },
          { href: "/impact",   icon: <Leaf className="w-5 h-5" />,       label: "View Impact",             sub: "See your green footprint"               },
          { href: "/cashout",  icon: <Banknote className="w-5 h-5" />,   label: "Cash Out",                sub: `Convert ${token.symbol} to local currency` },
          { href: "/airtime",  icon: <Smartphone className="w-5 h-5" />, label: "Airtime & Data",          sub: "Top up any Nigerian network"            },
        ].map(({ href, icon, label, sub }) => (
          <Link key={href} href={href}
            className="card p-5 flex items-center gap-4 hover:border-forest-500/20 transition-all duration-200 group">
            <div className="w-10 h-10 rounded-xl bg-forest-600/10 border border-forest-500/20 flex items-center justify-center text-forest-400 shrink-0 group-hover:bg-forest-600/20 transition-colors">
              {icon}
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-display font-semibold text-white text-sm">{label}</div>
              <div className="text-slate-400 text-xs truncate">{sub}</div>
            </div>
            <ArrowRight className="w-4 h-4 text-slate-600 group-hover:text-forest-400 transition-colors shrink-0" />
          </Link>
        ))}
      </div>
    </div>
  );
}