"use client";
import { useState } from "react";
import { useAccount, useWriteContract } from "wagmi";
import { parseUnits, formatUnits } from "viem";
import { USDC_ABI, GREEN_PAY_ABI } from "@/lib/contracts";
import { useToken } from "@/lib/token";
import { useTokenBalance, useTokenAllowance, useTokenContracts } from "@/hooks/useTokenContracts";
import { formatUSDC, MAX_UINT256 } from "@/lib/utils";
import { PageHeader, TxStatusBanner } from "@/components/ui";
import { TokenSelector } from "@/components/TokenSelector";
import { Send, Leaf, Info } from "lucide-react";
import type { TxStatus } from "@/types";

const PLATFORM_FEE_BPS = 12n;
const GREEN_FEE_BPS    = 13n;
const BPS_DENOM        = 10_000n;

export default function SendPage() {
  const { address, isConnected } = useAccount();
  const { token } = useToken();
  const { tokenAddress, greenPayAddress } = useTokenContracts();

  const [recipient, setRecipient] = useState("");
  const [amount, setAmount]       = useState("");
  const [note, setNote]           = useState("");
  const [txStatus, setTxStatus]   = useState<TxStatus>("idle");
  const [txHash, setTxHash]       = useState<`0x${string}` | undefined>();
  const [errorMsg, setErrorMsg]   = useState("");

  const { data: balance }                           = useTokenBalance();
  const { data: allowance, refetch: refetchAllowance } = useTokenAllowance(greenPayAddress);
  const { writeContractAsync }                      = useWriteContract();

  const gross       = amount ? parseUnits(amount, token.decimals) : 0n;
  const platformFee = (gross * PLATFORM_FEE_BPS) / BPS_DENOM;
  const greenFee    = (gross * GREEN_FEE_BPS)    / BPS_DENOM;
  const net         = gross - platformFee - greenFee;
  const needsApproval = (allowance ?? 0n) < gross;

  async function handleSend(e: React.FormEvent) {
    e.preventDefault();
    if (!isConnected) return;
    setErrorMsg("");

    try {
      if (needsApproval) {
        setTxStatus("approving");
        await writeContractAsync({
          address: tokenAddress, abi: USDC_ABI,
          functionName: "approve", args: [greenPayAddress, gross],
        });
        await new Promise((r) => setTimeout(r, 2000));
        await refetchAllowance();
      }

      setTxStatus("pending");
      const hash = await writeContractAsync({
        address: greenPayAddress, abi: GREEN_PAY_ABI,
        functionName: "send", args: [recipient as `0x${string}`, gross, note],
      });
      setTxHash(hash);
      setTxStatus("success");
      setAmount(""); setRecipient(""); setNote("");
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message.slice(0, 120) : "Unknown error");
      setTxStatus("error");
    }
  }

  const isValid = recipient.startsWith("0x") && recipient.length === 42 && Number(amount) > 0 && isConnected;

  return (
    <div className="max-w-xl mx-auto px-4 py-10">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="font-display font-bold text-2xl md:text-3xl text-white">Send Payment</h1>
          <p className="text-slate-400 mt-1 text-sm">Transfer {token.symbol} instantly to any address</p>
        </div>
        <TokenSelector />
      </div>

      {/* Balance */}
      <div className="card p-4 flex items-center justify-between mb-6">
        <span className="text-slate-400 text-sm">Your {token.symbol} Balance</span>
        <span className="font-display font-bold text-white">
          {token.flag} {formatUSDC(balance ?? 0n)} {token.symbol}
        </span>
      </div>

      <form onSubmit={handleSend} className="card p-6 flex flex-col gap-5">
        <div className="flex flex-col gap-1.5">
          <label className="text-slate-300 text-sm font-medium">Recipient Address</label>
          <input className="input-base font-mono" placeholder="0x..." value={recipient} onChange={(e) => setRecipient(e.target.value)} required />
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-slate-300 text-sm font-medium">Amount ({token.symbol})</label>
          <div className="relative">
            <input
              className="input-base pr-20"
              placeholder="0.00"
              type="number" min="0.01" step="0.01"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              required
            />
            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 text-sm flex items-center gap-1">
              {token.flag} {token.symbol}
            </span>
          </div>
          <div className="flex gap-2 mt-1">
            {["10", "50", "100", "500"].map((v) => (
              <button key={v} type="button" onClick={() => setAmount(v)}
                className="text-xs px-2.5 py-1 rounded-lg bg-slate-800 border border-white/10 text-slate-400 hover:text-white hover:border-white/20 transition-all">
                {v}
              </button>
            ))}
          </div>
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-slate-300 text-sm font-medium">Note <span className="text-slate-500">(optional)</span></label>
          <input className="input-base" placeholder="Lunch, freelance work, etc." maxLength={200} value={note} onChange={(e) => setNote(e.target.value)} />
        </div>

        {/* Fee breakdown */}
        {gross > 0n && (
          <div className="rounded-xl bg-slate-800/50 border border-white/5 p-4 flex flex-col gap-2 text-sm">
            <div className="flex justify-between text-slate-400">
              <span>You send</span>
              <span className="text-white font-medium">{formatUSDC(gross)} {token.symbol}</span>
            </div>
            <div className="flex justify-between text-slate-400">
              <span className="flex items-center gap-1.5"><Leaf className="w-3.5 h-3.5 text-slate-400" /> Platform fee (0.12%)</span>
              <span>{formatUSDC(platformFee)} {token.symbol}</span>
            </div>
            <div className="flex justify-between text-slate-400">
              <span className="flex items-center gap-1.5"><Leaf className="w-3.5 h-3.5 text-forest-400" /> Carbon offset (0.13%)</span>
              <span className="text-forest-400">{formatUSDC(greenFee)} {token.symbol}</span>
            </div>
            <div className="border-t border-white/5 pt-2 flex justify-between text-white font-semibold">
              <span>Recipient gets</span>
              <span>{formatUSDC(net)} {token.symbol}</span>
            </div>
          </div>
        )}

        <TxStatusBanner status={txStatus} txHash={txHash} errorMsg={errorMsg} />

        <button type="submit" disabled={!isValid || txStatus === "pending" || txStatus === "approving"} className="btn-primary w-full py-3.5">
          {txStatus === "approving" ? "Approving…"
            : txStatus === "pending" ? "Sending…"
            : needsApproval && gross > 0n ? <><Send className="w-4 h-4" /> Approve & Send {token.symbol}</>
            : <><Send className="w-4 h-4" /> Send {token.symbol}</>
          }
        </button>

        <p className="flex items-start gap-2 text-xs text-slate-500">
          <Info className="w-3.5 h-3.5 mt-0.5 shrink-0" />
          0.25% total fee on every transaction — 0.12% to platform, 0.13% to carbon offset. Non-optional.
        </p>
      </form>
    </div>
  );
}
