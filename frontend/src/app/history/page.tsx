"use client";

import { useAccount, useReadContract } from "wagmi";
import { GREEN_PAY_ABI } from "@/lib/contracts";
import { useTokenPayment, useTokenContracts, type PaymentData } from "@/hooks/useTokenContracts";
import { useToken } from "@/lib/token";
import { TokenSelector } from "@/components/TokenSelector";
import { formatUSDC, formatTimestamp } from "@/lib/utils";
import { PageHeader, EmptyState, AddressDisplay } from "@/components/ui";
import { History, ArrowUpRight, ArrowDownLeft, Leaf } from "lucide-react";
import { cn } from "@/lib/utils";
import { useState } from "react";

type Tab = "all" | "sent" | "received";

function PaymentRow({ id, userAddress }: { id: bigint; userAddress?: `0x${string}` }) {
  const { data: payment } = useTokenPayment(id);

  // Safe guard - now works because of the improved hook
  if (!payment || !Array.isArray(payment) || payment.length !== 9) {
    return (
      <div className="card p-4 animate-pulse h-24">
        <div className="h-4 bg-slate-800 rounded w-3/4 mb-2" />
        <div className="h-3 bg-slate-800 rounded w-1/2" />
      </div>
    );
  }

  const [pid, sender, recipient, grossAmount, netAmount, platformFee, greenFee, note, timestamp] =
    payment as PaymentData;

  const isSent = sender.toLowerCase() === userAddress?.toLowerCase();

  return (
    <div className="card p-4 flex items-start gap-4 hover:border-white/10 transition-all">
      <div
        className={cn(
          "w-10 h-10 rounded-xl flex items-center justify-center shrink-0",
          isSent ? "bg-red-500/10 text-red-400" : "bg-forest-500/10 text-forest-400"
        )}
      >
        {isSent ? <ArrowUpRight className="w-5 h-5" /> : <ArrowDownLeft className="w-5 h-5" />}
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-0.5 flex-wrap">
          <span className="font-display font-semibold text-white text-sm">
            {isSent ? "Sent to" : "Received from"}
          </span>
          <AddressDisplay address={isSent ? recipient : sender} />
          <span className="text-slate-600 text-xs font-mono">#{pid.toString()}</span>
        </div>

        {note && <p className="text-slate-400 text-xs truncate mb-1">{note}</p>}

        <div className="flex items-center gap-3 text-xs text-slate-500">
          <span>{formatTimestamp(timestamp)}</span>
          <span className="flex items-center gap-1 text-forest-500">
            <Leaf className="w-3 h-3" />
            🌱 ${formatUSDC(greenFee, 4)} offset
          </span>
        </div>
      </div>

      <div className="text-right shrink-0">
        <div
          className={cn(
            "font-display font-bold text-sm",
            isSent ? "text-red-400" : "text-forest-400"
          )}
        >
          {isSent ? "-" : "+"}${formatUSDC(isSent ? grossAmount : netAmount)}
        </div>
        <div className="text-slate-500 text-xs">USDC</div>
      </div>
    </div>
  );
}

export default function HistoryPage() {
  const { address, isConnected } = useAccount();
  const [tab, setTab] = useState<Tab>("all");

  const { token } = useToken();
  const { greenPayAddress } = useTokenContracts();

  const { data: sentIds = [] } = useReadContract({
    address: greenPayAddress,
    abi: GREEN_PAY_ABI,
    functionName: "getSentPayments",
    args: [address!],
    query: { enabled: !!address },
  });

  const { data: receivedIds = [] } = useReadContract({
    address: greenPayAddress,
    abi: GREEN_PAY_ABI,
    functionName: "getReceivedPayments",
    args: [address!],
    query: { enabled: !!address },
  });

  const allIds =
    tab === "sent"
      ? [...(sentIds as bigint[])].reverse()
      : tab === "received"
      ? [...(receivedIds as bigint[])].reverse()
      : [...new Set([...sentIds, ...receivedIds])].sort((a, b) => Number(b) - Number(a));

  return (
    <div className="max-w-2xl mx-auto px-4 py-10">
      <PageHeader
        title="Transaction History"
        subtitle={`${token.symbol} payment activity`}
        action={<TokenSelector />}
      />

      <div className="flex gap-1 p-1 bg-slate-900/60 rounded-xl border border-white/5 mb-6">
        {(["all", "sent", "received"] as Tab[]).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={cn(
              "flex-1 py-2 rounded-lg text-sm font-medium capitalize transition-all",
              tab === t
                ? "bg-forest-600/20 text-forest-400"
                : "text-slate-400 hover:text-white"
            )}
          >
            {t === "all"
              ? `All (${sentIds.length + receivedIds.length})`
              : t === "sent"
              ? `Sent (${sentIds.length})`
              : `Received (${receivedIds.length})`}
          </button>
        ))}
      </div>

      {!isConnected ? (
        <div className="card p-10 text-center text-slate-400">
          Connect your wallet to view history.
        </div>
      ) : allIds.length === 0 ? (
        <EmptyState
          icon={<History className="w-6 h-6" />}
          title="No transactions yet"
          description="Your payment history will appear here once you send or receive tokens."
        />
      ) : (
        <div className="flex flex-col gap-3">
          {allIds.map((id) => (
            <PaymentRow key={id.toString()} id={id} userAddress={address} />
          ))}
        </div>
      )}
    </div>
  );
}