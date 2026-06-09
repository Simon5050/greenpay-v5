"use client";

import { useState } from "react";
import { useAccount, useWriteContract } from "wagmi";
import { parseUnits } from "viem";
import { ERC20_ABI, GREEN_PAY_ABI } from "@/lib/contracts";   // Make sure GREEN_PAY_ABI has 'send'
import { useToken } from "@/lib/token";
import { useTokenBalance, useTokenAllowance, useTokenContracts } from "@/hooks/useTokenContracts";
import { formatUSDC } from "@/lib/utils";
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
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  const [txStatus, setTxStatus] = useState<TxStatus>("idle");
  const [txHash, setTxHash] = useState<`0x${string}` | undefined>();
  const [errorMsg, setErrorMsg] = useState("");

  const { data: balance } = useTokenBalance();
  const { data: allowance, refetch: refetchAllowance } = useTokenAllowance(greenPayAddress);
  const { writeContractAsync } = useWriteContract();

  const gross = amount ? parseUnits(amount, token.decimals) : 0n;
  const platformFee = (gross * PLATFORM_FEE_BPS) / BPS_DENOM;
  const greenFee = (gross * GREEN_FEE_BPS) / BPS_DENOM;
  const net = gross - platformFee - greenFee;

  const needsApproval = (allowance ?? 0n) < gross;

  async function handleSend(e: React.FormEvent) {
    e.preventDefault();
    if (!isConnected || !recipient.startsWith("0x") || recipient.length !== 42) {
      setErrorMsg("Please enter a valid recipient address");
      return;
    }
    if (gross <= 0n) {
      setErrorMsg("Please enter a valid amount");
      return;
    }

    setErrorMsg("");
    setTxStatus("idle");

    try {
      if (needsApproval) {
        setTxStatus("approving");
        await writeContractAsync({
          address: tokenAddress,
          abi: ERC20_ABI,
          functionName: "approve",
          args: [greenPayAddress, gross],
        });

        // Wait for approval
        for (let i = 0; i < 20; i++) {
          await new Promise(r => setTimeout(r, 2000));
          const res = await refetchAllowance();
          if ((res.data ?? 0n) >= gross) break;
        }
      }

      setTxStatus("pending");
      const hash = await writeContractAsync({
        address: greenPayAddress,
        abi: GREEN_PAY_ABI,
        functionName: "send",
        args: [recipient as `0x${string}`, gross, note || ""],
      });

      setTxHash(hash);
      setTxStatus("success");

      setAmount(""); 
      setRecipient(""); 
      setNote("");
    } catch (err: any) {
      console.error("Send Error:", err);
      setErrorMsg(err?.message || "Transaction failed. Check console.");
      setTxStatus("error");
    }
  }

  return (
    <div className="max-w-xl mx-auto px-4 py-10">
      <div className="flex items-start justify-between mb-8">
        <div>
          <h1 className="font-display font-bold text-2xl md:text-3xl text-white">Send Payment</h1>
          <p className="text-slate-400 mt-1">Transfer {token.symbol} instantly</p>
        </div>
        <TokenSelector />
      </div>

      {/* Balance */}
      <div className="card p-4 flex items-center justify-between mb-6">
        <span className="text-slate-400">Your {token.symbol} Balance</span>
        <span className="font-display font-bold text-white">
          {token.flag} {formatUSDC(balance ?? 0n)} {token.symbol}
        </span>
      </div>

      <form onSubmit={handleSend} className="card p-6 flex flex-col gap-5">
        {/* Your existing Recipient, Amount, Note, Fee UI here */}

        <TxStatusBanner status={txStatus} txHash={txHash} errorMsg={errorMsg} />

        <button
          type="submit"
          disabled={txStatus === "pending" || txStatus === "approving"}
          className="btn-primary w-full py-3.5"
        >
          {txStatus === "approving" ? `Approving ${token.symbol}...` : 
           txStatus === "pending" ? "Sending..." : 
           `Send ${token.symbol}`}
        </button>
      </form>
    </div>
  );
}