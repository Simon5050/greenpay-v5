"use client";
import { useState } from "react";
import { useAccount, useReadContract, useWriteContract } from "wagmi";
import { parseUSDC, formatUSDC, formatTimestamp } from "@/lib/utils";
import { REQUEST_STATUS, cn } from "@/lib/utils";
import { CONTRACTS, USDC_ABI, GREEN_PAY_ABI } from "@/lib/contracts";
import { useTokenRequest, useTokenContracts } from "@/hooks/useTokenContracts";
import { useTokenAllowance } from "@/hooks/useTokenContracts";
import { useToken } from "@/lib/token";
import { TokenSelector } from "@/components/TokenSelector";
import { TxStatusBanner, AddressDisplay } from "@/components/ui";
import { Inbox, CheckCircle, XCircle, Loader2, Clock } from "lucide-react";
import type { TxStatus } from "@/types";

// ── New Request Form ──────────────────────────────────────────────────────────
function NewRequestForm() {
  const { address, isConnected } = useAccount();
  const [payer, setPayer] = useState("");
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  const [txStatus, setTxStatus] = useState<TxStatus>("idle");
  const [txHash, setTxHash] = useState<`0x${string}` | undefined>();
  const [errorMsg, setErrorMsg] = useState("");

  const { writeContractAsync } = useWriteContract();

  async function handleRequest(e: React.FormEvent) {
    e.preventDefault();
    if (!isConnected) return;
    setErrorMsg("");
    setTxStatus("pending");
    try {
      const hash = await writeContractAsync({
        address: CONTRACTS.GreenPay,
        abi: GREEN_PAY_ABI,
        functionName: "requestPayment",
        args: [payer as `0x${string}`, parseUSDC(amount), note],
      });
      setTxHash(hash);
      setTxStatus("success");
      setAmount(""); setPayer(""); setNote("");
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message.slice(0, 120) : "Error");
      setTxStatus("error");
    }
  }

  const isValid = payer.startsWith("0x") && payer.length === 42 && Number(amount) > 0 && isConnected;

  return (
    <form onSubmit={handleRequest} className="card p-6 flex flex-col gap-5">
      <div className="flex flex-col gap-1.5">
        <label className="text-slate-300 text-sm font-medium">Request From (Address)</label>
        <input
          className="input-base font-mono"
          placeholder="0x..."
          value={payer}
          onChange={(e) => setPayer(e.target.value)}
          required
        />
      </div>
      <div className="flex flex-col gap-1.5">
        <label className="text-slate-300 text-sm font-medium">Amount (USDC)</label>
        <div className="relative">
          <input
            className="input-base pr-16"
            placeholder="0.00"
            type="number"
            min="0.01"
            step="0.01"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            required
          />
          <span className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 text-sm">USDC</span>
        </div>
      </div>
      <div className="flex flex-col gap-1.5">
        <label className="text-slate-300 text-sm font-medium">Reason</label>
        <input
          className="input-base"
          placeholder="e.g. Design work for Q2"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          maxLength={200}
        />
      </div>

      <TxStatusBanner status={txStatus} txHash={txHash} errorMsg={errorMsg} />

      <button type="submit" disabled={!isValid || txStatus === "pending"} className="btn-primary">
        {txStatus === "pending"
          ? <><Loader2 className="w-4 h-4 animate-spin" /> Sending…</>
          : <><Inbox className="w-4 h-4" /> Send Request</>
        }
      </button>
    </form>
  );
}

// ── Single request row ────────────────────────────────────────────────────────
function RequestRow({ id, type }: { id: bigint; type: "incoming" | "outgoing" }) {
  const [txStatus, setTxStatus] = useState<TxStatus>("idle");
  const [txHash, setTxHash] = useState<`0x${string}` | undefined>();
  const { writeContractAsync } = useWriteContract();

  const { token } = useToken();
  const { greenPayAddress, tokenAddress } = useTokenContracts();
  const { data: req } = useTokenRequest(id);
  const { data: allowance, refetch: refetchAllowance } = useTokenAllowance(greenPayAddress);

  if (!req) return (
    <div className="card p-4 animate-pulse h-20">
      <div className="h-4 bg-slate-800 rounded w-3/4 mb-2" />
      <div className="h-3 bg-slate-800 rounded w-1/2" />
    </div>
  );

  const [, requester, , amount, note, requestStatus, createdAt] = req;
  const statusInfo = REQUEST_STATUS[requestStatus as 0 | 1 | 2];

  async function handleFulfil() {
    setTxStatus("approving");
    try {
      if ((allowance ?? 0n) < amount) {
        await writeContractAsync({
          address: CONTRACTS.USDC,
          abi: USDC_ABI,
          functionName: "approve",
          args: [greenPayAddress, amount],
        });
        await new Promise((r) => setTimeout(r, 2000));
        await refetchAllowance();
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
    } catch {
      setTxStatus("error");
    }
  }

  async function handleCancel() {
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
  }

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
          {note && <p className="text-slate-400 text-sm">{note}</p>}
          <div className="text-slate-500 text-xs flex gap-3 flex-wrap">
            <span className="flex items-center gap-1">From: <AddressDisplay address={requester} /></span>
            <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {formatTimestamp(createdAt)}</span>
          </div>
        </div>
      </div>

      {txStatus !== "idle" && <TxStatusBanner status={txStatus} txHash={txHash} />}

      {/* Fixed: requestStatus instead of status */}
      {requestStatus === 0 && (
        <div className="flex gap-2">
          {type === "incoming" && (
            <button
              onClick={handleFulfil}
              disabled={txStatus === "pending" || txStatus === "approving"}
              className="btn-primary flex-1 py-2 text-sm"
            >
              <CheckCircle className="w-4 h-4" />
              {txStatus === "approving" ? "Approving…" : "Pay Request"}
            </button>
          )}
          {type === "outgoing" && (
            <button
              onClick={handleCancel}
              disabled={txStatus === "pending"}
              className="btn-ghost flex-1 py-2 text-sm border-red-500/20 text-red-400 hover:border-red-500/40"
            >
              <XCircle className="w-4 h-4" /> Cancel
            </button>
          )}
        </div>
      )}
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function RequestPage() {
  const { address } = useAccount();
  const [activeTab, setActiveTab] = useState<"create" | "incoming" | "outgoing">("create");

  // Get token for display
  const { token } = useToken();

  const { data: myRequestIds } = useReadContract({
    address: CONTRACTS.GreenPay,
    abi: GREEN_PAY_ABI,
    functionName: "getMyRequests",
    args: [address!],
    query: { enabled: !!address },
  });

  const { data: incomingIds } = useReadContract({
    address: CONTRACTS.GreenPay,
    abi: GREEN_PAY_ABI,
    functionName: "getRequestsToMe",
    args: [address!],
    query: { enabled: !!address },
  });

  const pendingIncoming = incomingIds?.length ?? 0;

  return (
    <div className="max-w-2xl mx-auto px-4 py-10">
      <div className="flex items-start justify-between mb-8">
        <div>
          <h1 className="font-display font-bold text-2xl md:text-3xl text-white">
            Request Payment
          </h1>
          <p className="text-slate-400 mt-1 text-sm">
            Ask someone to send you {token?.symbol || "USDC"}
          </p>
        </div>
        <TokenSelector />
      </div>

      <div className="flex gap-1 p-1 bg-slate-900/60 rounded-xl border border-white/5 mb-6">
        {(["create", "incoming", "outgoing"] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={cn(
              "flex-1 py-2 rounded-lg text-sm font-medium transition-all relative",
              activeTab === tab ? "bg-forest-600/20 text-forest-400" : "text-slate-400 hover:text-white"
            )}
          >
            {tab === "create"
              ? "New Request"
              : tab === "incoming"
              ? <>Incoming {pendingIncoming > 0 && <span className="ml-1 px-1.5 py-0.5 text-xs rounded-full bg-earth-500/20 text-earth-400">{pendingIncoming}</span>}</>
              : `Outgoing${myRequestIds?.length ? ` (${myRequestIds.length})` : ""}`}
          </button>
        ))}
      </div>

      {activeTab === "create" && <NewRequestForm />}

      {activeTab === "incoming" && (
        <div className="flex flex-col gap-3">
          {(incomingIds?.length ?? 0) === 0 ? (
            <div className="card p-10 text-center text-slate-400">
              <Inbox className="w-8 h-8 mx-auto mb-3 opacity-30" />
              No incoming requests.
            </div>
          ) : (
            [...(incomingIds ?? [])].reverse().map((id) => (
              <RequestRow key={id.toString()} id={id} type="incoming" />
            ))
          )}
        </div>
      )}

      {activeTab === "outgoing" && (
        <div className="flex flex-col gap-3">
          {(myRequestIds?.length ?? 0) === 0 ? (
            <div className="card p-10 text-center text-slate-400">
              <Inbox className="w-8 h-8 mx-auto mb-3 opacity-30" />
              No outgoing requests.
            </div>
          ) : (
            [...(myRequestIds ?? [])].reverse().map((id) => (
              <RequestRow key={id.toString()} id={id} type="outgoing" />
            ))
          )}
        </div>
      )}
    </div>
  );
}