"use client";
import {
  useAccount,
  useReadContract,
  useWriteContract,
} from "wagmi";
import { CONTRACTS, GREEN_PAY_ABI } from "@/lib/contracts";
import { useState } from "react";
import type { TxStatus } from "@/types";

export function useGreenPay() {
  const { address } = useAccount();
  const [txStatus, setTxStatus] = useState<TxStatus>("idle");

  const { writeContractAsync } = useWriteContract();

  // ── List queries ─────────────────────────────────────────────────────────
  const { data: sentIds, refetch: refetchSent } = useReadContract({
    address: CONTRACTS.GreenPay,
    abi: GREEN_PAY_ABI,
    functionName: "getSentPayments",
    args: [address!],
    query: { enabled: !!address },
  });

  const { data: receivedIds, refetch: refetchReceived } = useReadContract({
    address: CONTRACTS.GreenPay,
    abi: GREEN_PAY_ABI,
    functionName: "getReceivedPayments",
    args: [address!],
    query: { enabled: !!address },
  });

  const { data: myRequestIds, refetch: refetchMyRequests } = useReadContract({
    address: CONTRACTS.GreenPay,
    abi: GREEN_PAY_ABI,
    functionName: "getMyRequests",
    args: [address!],
    query: { enabled: !!address },
  });

  const { data: requestsToMeIds, refetch: refetchRequestsToMe } = useReadContract({
    address: CONTRACTS.GreenPay,
    abi: GREEN_PAY_ABI,
    functionName: "getRequestsToMe",
    args: [address!],
    query: { enabled: !!address },
  });

  // ── Write actions ─────────────────────────────────────────────────────────
  async function sendPayment(
    recipient: `0x${string}`,
    amount: bigint,
    note: string
  ): Promise<`0x${string}`> {
    setTxStatus("pending");
    try {
      const hash = await writeContractAsync({
        address: CONTRACTS.GreenPay,
        abi: GREEN_PAY_ABI,
        functionName: "send",
        args: [recipient, amount, note],
      });
      setTxStatus("success");
      refetchSent();
      return hash;
    } catch (e) {
      setTxStatus("error");
      throw e;
    }
  }

  async function requestPayment(
    payer: `0x${string}`,
    amount: bigint,
    note: string
  ): Promise<`0x${string}`> {
    setTxStatus("pending");
    try {
      const hash = await writeContractAsync({
        address: CONTRACTS.GreenPay,
        abi: GREEN_PAY_ABI,
        functionName: "requestPayment",
        args: [payer, amount, note],
      });
      setTxStatus("success");
      refetchMyRequests();
      return hash;
    } catch (e) {
      setTxStatus("error");
      throw e;
    }
  }

  async function fulfillRequest(requestId: bigint): Promise<`0x${string}`> {
    setTxStatus("pending");
    try {
      const hash = await writeContractAsync({
        address: CONTRACTS.GreenPay,
        abi: GREEN_PAY_ABI,
        functionName: "fulfillRequest",
        args: [requestId],
      });
      setTxStatus("success");
      refetchRequestsToMe();
      refetchReceived();
      return hash;
    } catch (e) {
      setTxStatus("error");
      throw e;
    }
  }

  async function cancelRequest(requestId: bigint): Promise<`0x${string}`> {
    setTxStatus("pending");
    try {
      const hash = await writeContractAsync({
        address: CONTRACTS.GreenPay,
        abi: GREEN_PAY_ABI,
        functionName: "cancelRequest",
        args: [requestId],
      });
      setTxStatus("success");
      refetchMyRequests();
      return hash;
    } catch (e) {
      setTxStatus("error");
      throw e;
    }
  }

  return {
    sentIds: sentIds ?? [],
    receivedIds: receivedIds ?? [],
    myRequestIds: myRequestIds ?? [],
    requestsToMeIds: requestsToMeIds ?? [],
    txStatus,
    setTxStatus,
    sendPayment,
    requestPayment,
    fulfillRequest,
    cancelRequest,
    refetchSent,
    refetchReceived,
    refetchMyRequests,
    refetchRequestsToMe,
  };
}

// ── Standalone per-item hooks (used directly in components, not inside other hooks) ──

export function usePayment(id: bigint) {
  return useReadContract({
    address: CONTRACTS.GreenPay,
    abi: GREEN_PAY_ABI,
    functionName: "payments",
    args: [id],
  });
}

export function useRequest(id: bigint) {
  return useReadContract({
    address: CONTRACTS.GreenPay,
    abi: GREEN_PAY_ABI,
    functionName: "requests",
    args: [id],
  });
}

export function usePreviewSplit(gross: bigint) {
  return useReadContract({
    address: CONTRACTS.GreenPay,
    abi: GREEN_PAY_ABI,
    functionName: "previewSplit",
    args: [gross],
    query: { enabled: gross > 0n },
  });
}
