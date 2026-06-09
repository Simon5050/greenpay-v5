"use client";

import { useAccount } from "wagmi";
import { useToken } from "@/lib/token";
import { 
  useTokenBalance, 
  useTokenGreenFund, 
  useTokenGreenPay, 
  useTokenInvoices 
} from "@/hooks/useTokenContracts";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { TokenSelector } from "@/components/TokenSelector";
import { formatUSDC, usdcToKgCO2, kgToTrees } from "@/lib/utils";
import { StatCard, PageHeader } from "@/components/ui";
import { Wallet, Send, FileText, Leaf } from "lucide-react";

export default function DashboardPage() {
  const { address, isConnected } = useAccount();
  const { token } = useToken();

  const { data: balance } = useTokenBalance();
  const { userContribution } = useTokenGreenFund();
  const { sentIds = [] } = useTokenGreenPay();
  const { issuedIds: invoiceIssuedIds = [] } = useTokenInvoices();

  const safeBalance = typeof balance === "bigint" ? balance : 0n;
  const safeUserContribution = typeof userContribution === "bigint" ? userContribution : 0n;

  const kg = usdcToKgCO2(safeUserContribution);
  const trees = kgToTrees(kg);

  if (!isConnected || !address) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-12 text-center">
        <PageHeader title="Dashboard" subtitle="Overview of your activity" />
        <div className="card p-12 mt-8">
          <ConnectButton />
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-10">
      <PageHeader 
        title="Dashboard" 
        subtitle={`${token.symbol} Overview`} 
        action={<TokenSelector />} 
      />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mt-8">
        <StatCard 
          label={`${token.symbol} Balance`} 
          value={`${token.flag} ${formatUSDC(safeBalance)}`} 
          icon={<Wallet className="w-4 h-4" />} 
        />
        
        <StatCard 
          label="My CO₂ Offset" 
          value={`${kg.toFixed(3)} kg`} 
          sub={`≈ ${trees.toFixed(2)} trees/yr`} 
          icon={<Leaf className="w-4 h-4" />} 
          accent="green" 
        />

        <StatCard 
          label={`${token.symbol} Sent`} 
          value={String(sentIds.length)} 
          icon={<Send className="w-4 h-4" />} 
        />

        <StatCard 
          label="Invoices Issued" 
          value={String(invoiceIssuedIds.length)} 
          icon={<FileText className="w-4 h-4" />} 
        />
      </div>
    </div>
  );
}