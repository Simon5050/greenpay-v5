"use client";

import { useState } from "react";
import { useAccount, useWriteContract } from "wagmi";
import { formatUSDC, formatTimestamp } from "@/lib/utils";
import { REQUEST_STATUS, cn } from "@/lib/utils";
import { CONTRACTS, USDC_ABI, GREEN_PAY_ABI } from "@/lib/contracts";
import {
  useTokenGreenPay,
  useTokenRequest,
  useTokenContracts,
  useTokenAllowance,
  type RequestData,          // ← Import the type
} from "@/hooks/useTokenContracts";
import { useToken } from "@/lib/token";
import { TokenSelector } from "@/components/TokenSelector";
import { PageHeader, TxStatusBanner, EmptyState, AddressDisplay } from "@/components/ui";
import { FileText, CheckCircle, Loader2 } from "lucide-react";
import type { TxStatus } from "@/types";

// ── Request Row ──────────────────────────────────────────────────────────────
function RequestRow({ id, userAddress }: { id: bigint; userAddress?: `0x${string}` }) {
  const [localStatus, setLocalStatus] = useState<TxStatus>("idle");
  const [txHash, setTxHash] = useState<`0x${string}` | undefined>();

  const { writeContractAsync } = useWriteContract();
  const { greenPayAddress } = useTokenContracts();
  const { data: req } = useTokenRequest(id);
  const { data: allowance, refetch: refetchAllowance } = useTokenAllowance(greenPayAddress);

  // ✅ Strongest guard for 'never' type
  if (!req || typeof req !== "object" || !Array.isArray(req) || req.length < 6) {
    return (
      <div className="card p-4 animate-pulse h-20">
        <div className="h-4 bg-slate-800 rounded w-3/4 mb-2" />
        <div className="h-3 bg-slate-800 rounded w-1/2" />
      </div>
    );
  }

  const [, requester, recipient, amount, note, requestStatus, createdAt] = req as RequestData;

  const statusInfo = REQUEST_STATUS[requestStatus as keyof typeof REQUEST_STATUS];
  const canFulfill = requestStatus === 1 && recipient.toLowerCase() === userAddress?.toLowerCase();

  const handleFulfill = async () => {
    setLocalStatus("approving");
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

      setLocalStatus("pending");
      const hash = await writeContractAsync({
        address: greenPayAddress,
        abi: GREEN_PAY_ABI,
        functionName: "fulfillRequest",
        args: [id],
      });
      setTxHash(hash);
      setLocalStatus("success");
    } catch (err) {
      console.error(err);
      setLocalStatus("error");
    }
  };

  return (
    <div className="card p-4 flex flex-col gap-3 hover:border-white/10 transition-all">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <span className="font-mono text-slate-500 text-xs">#{id.toString()}</span>
            <span className="font-display font-semibold text-white">Payment Request</span>
            <span className={cn("text-xs px-2 py-0.5 rounded-full", statusInfo.bg, statusInfo.color)}>
              {statusInfo.label}
            </span>
          </div>

          {note && <p className="text-slate-400 text-sm mb-2">{note}</p>}

          <div className="text-xs text-slate-500">
            From: <AddressDisplay address={requester} />
            <span className="mx-2">•</span>
            Requested: {formatTimestamp(createdAt)}
          </div>
        </div>

        <div className="text-right shrink-0">
          <div className="font-display font-bold text-white">${formatUSDC(amount)}</div>
        </div>
      </div>

      {localStatus !== "idle" && <TxStatusBanner status={localStatus} txHash={txHash} />}

      {canFulfill && (
        <button
          onClick={handleFulfill}
          disabled={localStatus === "pending" || localStatus === "approving"}
          className="btn-primary w-full py-2.5"
        >
          {localStatus === "approving" ? (
            <><Loader2 className="w-4 h-4 animate-spin" /> Approving...</>
          ) : localStatus === "pending" ? (
            <><Loader2 className="w-4 h-4 animate-spin" /> Fulfilling...</>
          ) : (
            <><CheckCircle className="w-4 h-4" /> Fulfill Request</>
          )}
        </button>
      )}
    </div>
  );
}

// ── Main Request Page ────────────────────────────────────────────────────────
export default function RequestPage() {
  const { address, isConnected } = useAccount();
  const { token } = useToken();
  const { myRequestIds, requestsToMeIds } = useTokenGreenPay();

  const [activeTab, setActiveTab] = useState<"sent" | "received">("received");

  const ids = activeTab === "sent"
    ? [...(myRequestIds as bigint[])].reverse()
    : [...(requestsToMeIds as bigint[])].reverse();

  return (
    <div className="max-w-2xl mx-auto px-4 py-10">
      <PageHeader
        title="Payment Requests"
        subtitle={`Manage ${token.symbol} payment requests`}
        action={<TokenSelector />}
      />

      <div className="flex gap-1 p-1 bg-slate-900/60 rounded-xl border border-white/5 mb-6">
        {(["sent", "received"] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={cn(
              "flex-1 py-2 rounded-lg text-sm font-medium capitalize transition-all",
              activeTab === tab ? "bg-forest-600/20 text-forest-400" : "text-slate-400 hover:text-white"
            )}
          >
            {tab === "sent" ? `Sent (${myRequestIds.length})` : `To Me (${requestsToMeIds.length})`}
          </button>
        ))}
      </div>

      {ids.length === 0 ? (
        <EmptyState
          icon={<FileText className="w-6 h-6" />}
          title={`No ${activeTab} requests`}
          description={
            activeTab === "sent"
              ? "Requests you sent will appear here."
              : "Requests sent to you will appear here."
          }
        />
      ) : (
        <div className="flex flex-col gap-3">
          {ids.map((id) => (
            <RequestRow key={id.toString()} id={id} userAddress={address} />
          ))}
        </div>
      )}
    </div>
  );
}