"use client";
import { useState } from "react";
import { useAccount, useWriteContract } from "wagmi";
import { parseUSDC, formatUSDC, formatTimestamp } from "@/lib/utils";
import { REQUEST_STATUS, cn } from "@/lib/utils";
import { CONTRACTS, USDC_ABI, GREEN_PAY_ABI } from "@/lib/contracts";
import { useTokenRequest, useTokenContracts, useTokenAllowance } from "@/hooks/useTokenContracts";
import { useToken } from "@/lib/token";
import { TokenSelector } from "@/components/TokenSelector";
import { PageHeader, TxStatusBanner, EmptyState, AddressDisplay } from "@/components/ui";
import { Clock, CheckCircle, XCircle, Plus } from "lucide-react";
import type { TxStatus } from "@/types";

// ── Request Row ─────────────────────────────────────────────────────────────
function RequestRow({ 
  id, 
  type 
}: { 
  id: bigint; 
  type: "incoming" | "outgoing"; 
}) {
  const [txStatus, setTxStatus] = useState<TxStatus>("idle");
  const [txHash, setTxHash] = useState<`0x${string}` | undefined>();

  const { writeContractAsync } = useWriteContract();
  const { greenPayAddress } = useTokenContracts();
  const { data: req } = useTokenRequest(id);                    // ← singular hook
  const { data: allowance, refetch: refetchAllowance } = useTokenAllowance(greenPayAddress);

  if (!req) {
    return (
      <div className="card p-4 animate-pulse h-20">
        <div className="h-4 bg-slate-800 rounded w-3/4 mb-2" />
        <div className="h-3 bg-slate-800 rounded w-1/2" />
      </div>
    );
  }

  const [, requester, , amount, note, requestStatus, createdAt] = req;
  const statusInfo = REQUEST_STATUS[requestStatus as keyof typeof REQUEST_STATUS];

  const handleFulfil = async () => {
    setTxStatus("approving");
    try {
      if ((allowance ?? 0n) < amount) {
        await writeContractAsync({
          address: CONTRACTS.USDC,
          abi: USDC_ABI,
          functionName: "approve",
          args: [greenPayAddress, amount],
        });

        for (let i = 0; i < 30; i++) {
          await new Promise((r) => setTimeout(r, 1500));
          const result = await refetchAllowance();
          if ((result.data ?? 0n) >= amount) break;
        }
      }

      setTxStatus("pending");
      const hash = await writeContractAsync({
        address: CONTRACTS.GreenPay,
        abi: GREEN_PAY_ABI,
        functionName: "fulfillRequest",
        args: [id],
      });
      setTxHash(hash);
      setTxStatus("success");
    } catch (err) {
      console.error(err);
      setTxStatus("error");
    }
  };

  const handleCancel = async () => {
    setTxStatus("pending");
    try {
      const hash = await writeContractAsync({
        address: CONTRACTS.GreenPay,
        abi: GREEN_PAY_ABI,
        functionName: "cancelRequest",
        args: [id],
      });
      setTxHash(hash);
      setTxStatus("success");
    } catch {
      setTxStatus("error");
    }
  };

  return (
    <div className="card p-4 flex flex-col gap-3">
      <div className="flex items-start justify-between gap-3">
        <div className="flex flex-col gap-1 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-display font-semibold text-white">
              ${formatUSDC(amount)} USDC
            </span>
            <span className={cn("text-xs px-2 py-0.5 rounded-full", statusInfo.bg, statusInfo.color)}>
              {statusInfo.label}
            </span>
          </div>
          {note && <p className="text-slate-400 text-sm mt-1">{note}</p>}
          <div className="text-xs text-slate-500 flex gap-4 flex-wrap">
            <span>From: <AddressDisplay address={requester} /></span>
            <span className="flex items-center gap-1">
              <Clock className="w-3 h-3" /> {formatTimestamp(createdAt)}
            </span>
          </div>
        </div>
      </div>

      {txStatus !== "idle" && <TxStatusBanner status={txStatus} txHash={txHash} />}

      {requestStatus === 0 && (
        <div className="flex gap-2">
          {type === "incoming" && (
            <button
              onClick={handleFulfil}
              disabled={txStatus === "pending" || txStatus === "approving"}
              className="btn-primary flex-1 py-2 text-sm"
            >
              <CheckCircle className="w-4 h-4" />
              {txStatus === "approving" ? "Approving…" : "Pay Now"}
            </button>
          )}
          {type === "outgoing" && (
            <button
              onClick={handleCancel}
              disabled={txStatus === "pending"}
              className="btn-ghost flex-1 py-2 text-sm border-red-500/20 text-red-400 hover:border-red-500/40"
            >
              <XCircle className="w-4 h-4" /> Cancel Request
            </button>
          )}
        </div>
      )}
    </div>
  );
}

// ── Main Page ───────────────────────────────────────────────────────────────
export default function RequestPage() {
  const { address, isConnected } = useAccount();
  const [activeTab, setActiveTab] = useState<"incoming" | "outgoing">("incoming");
  const { token } = useToken();

  // TODO: Replace with real plural hook when you create useTokenRequests
  const incomingIds: bigint[] = [];
  const outgoingIds: bigint[] = [];

  const ids = activeTab === "incoming" ? [...incomingIds].reverse() : [...outgoingIds].reverse();

  return (
    <div className="max-w-3xl mx-auto px-4 py-10">
      <PageHeader
        title="Requests"
        subtitle={`Send and receive ${token.symbol} payment requests`}
        action={
          <div className="flex items-center gap-3">
            <TokenSelector />
            {isConnected && (
              <button className="btn-primary py-2.5 text-sm">
                <Plus className="w-4 h-4" /> New Request
              </button>
            )}
          </div>
        }
      />

      <div className="flex gap-1 p-1 bg-slate-900/60 rounded-xl border border-white/5 mb-6">
        {(["incoming", "outgoing"] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={cn(
              "flex-1 py-2 rounded-lg text-sm font-medium capitalize transition-all",
              activeTab === tab ? "bg-forest-600/20 text-forest-400" : "text-slate-400 hover:text-white"
            )}
          >
            {tab === "incoming"
              ? `Incoming (${incomingIds.length})`
              : `Outgoing (${outgoingIds.length})`}
          </button>
        ))}
      </div>

      {ids.length === 0 ? (
        <EmptyState
          icon={<Clock className="w-6 h-6" />}
          title={`No ${activeTab} requests`}
          description={
            activeTab === "incoming"
              ? "Payment requests sent to you will appear here."
              : "You haven't sent any requests yet."
          }
        />
      ) : (
        <div className="flex flex-col gap-3">
          {ids.map((id) => (
            <RequestRow key={id.toString()} id={id} type={activeTab} />
          ))}
        </div>
      )}
    </div>
  );
}