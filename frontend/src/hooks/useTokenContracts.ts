"use client";
import { useToken } from "@/lib/token";
import {
  useAccount,
  useReadContract,
  useWriteContract,
  useWaitForTransactionReceipt,
} from "wagmi";
import { USDC_ABI, GREEN_PAY_ABI, INVOICE_MANAGER_ABI, GREEN_FUND_ABI } from "@/lib/contracts";
import { MAX_UINT256 } from "@/lib/utils";
import { useState } from "react";
import type { TxStatus, LineItem } from "@/types";

// ── Core contract address hook ────────────────────────────────────────────────
export function useTokenContracts() {
  const { token } = useToken();
  return {
    tokenAddress:    token.address,
    greenPayAddress: token.greenPayAddress,
    invoiceAddress:  token.invoiceAddress,
    greenFundAddress:token.greenFundAddress,
    symbol:          token.symbol,
    decimals:        token.decimals,
    flag:            token.flag,
  };
}

// ── Token balance ─────────────────────────────────────────────────────────────
export function useTokenBalance() {
  const { address } = useAccount();
  const { tokenAddress } = useTokenContracts();

  return useReadContract({
    address: tokenAddress,
    abi:     USDC_ABI,
    functionName: "balanceOf",
    args:    [address!],
    query:   { enabled: !!address },
  });
}

// ── Token allowance ───────────────────────────────────────────────────────────
export function useTokenAllowance(spender: `0x${string}`) {
  const { address } = useAccount();
  const { tokenAddress } = useTokenContracts();

  return useReadContract({
    address: tokenAddress,
    abi:     USDC_ABI,
    functionName: "allowance",
    args:    [address!, spender],
    query:   { enabled: !!address },
  });
}

// ── Approve token ─────────────────────────────────────────────────────────────
export function useTokenApprove() {
  const { tokenAddress } = useTokenContracts();
  const { writeContractAsync } = useWriteContract();

  async function approve(spender: `0x${string}`, amount?: bigint) {
    return writeContractAsync({
      address:      tokenAddress,
      abi:          USDC_ABI,
      functionName: "approve",
      args:         [spender, amount ?? MAX_UINT256],
    });
  }

  return { approve };
}

// ── GreenPay actions ──────────────────────────────────────────────────────────
export function useTokenGreenPay() {
  const { greenPayAddress, greenFundAddress } = useTokenContracts();
  const { address } = useAccount();
  const [txStatus, setTxStatus] = useState<TxStatus>("idle");
  const { writeContractAsync } = useWriteContract();

  const { data: sentIds,        refetch: refetchSent }         = useReadContract({ address: greenPayAddress, abi: GREEN_PAY_ABI, functionName: "getSentPayments",    args: [address!], query: { enabled: !!address } });
  const { data: receivedIds,    refetch: refetchReceived }     = useReadContract({ address: greenPayAddress, abi: GREEN_PAY_ABI, functionName: "getReceivedPayments", args: [address!], query: { enabled: !!address } });
  const { data: myRequestIds,   refetch: refetchMyRequests }   = useReadContract({ address: greenPayAddress, abi: GREEN_PAY_ABI, functionName: "getMyRequests",       args: [address!], query: { enabled: !!address } });
  const { data: requestsToMeIds,refetch: refetchRequestsToMe } = useReadContract({ address: greenPayAddress, abi: GREEN_PAY_ABI, functionName: "getRequestsToMe",     args: [address!], query: { enabled: !!address } });

  async function sendPayment(recipient: `0x${string}`, amount: bigint, note: string) {
    setTxStatus("pending");
    try {
      const hash = await writeContractAsync({ address: greenPayAddress, abi: GREEN_PAY_ABI, functionName: "send", args: [recipient, amount, note] });
      setTxStatus("success"); refetchSent(); return hash;
    } catch (e) { setTxStatus("error"); throw e; }
  }

  async function requestPayment(payer: `0x${string}`, amount: bigint, note: string) {
    setTxStatus("pending");
    try {
      const hash = await writeContractAsync({ address: greenPayAddress, abi: GREEN_PAY_ABI, functionName: "requestPayment", args: [payer, amount, note] });
      setTxStatus("success"); refetchMyRequests(); return hash;
    } catch (e) { setTxStatus("error"); throw e; }
  }

  async function fulfillRequest(requestId: bigint) {
    setTxStatus("pending");
    try {
      const hash = await writeContractAsync({ address: greenPayAddress, abi: GREEN_PAY_ABI, functionName: "fulfillRequest", args: [requestId] });
      setTxStatus("success"); refetchRequestsToMe(); refetchReceived(); return hash;
    } catch (e) { setTxStatus("error"); throw e; }
  }

  async function cancelRequest(requestId: bigint) {
    setTxStatus("pending");
    try {
      const hash = await writeContractAsync({ address: greenPayAddress, abi: GREEN_PAY_ABI, functionName: "cancelRequest", args: [requestId] });
      setTxStatus("success"); refetchMyRequests(); return hash;
    } catch (e) { setTxStatus("error"); throw e; }
  }

  return {
    greenPayAddress,
    sentIds:          sentIds          ?? [],
    receivedIds:      receivedIds      ?? [],
    myRequestIds:     myRequestIds     ?? [],
    requestsToMeIds:  requestsToMeIds  ?? [],
    txStatus, setTxStatus,
    sendPayment, requestPayment, fulfillRequest, cancelRequest,
  };
}

// ── Per-payment reader ────────────────────────────────────────────────────────
export function useTokenPayment(id: bigint) {
  const { greenPayAddress } = useTokenContracts();
  return useReadContract({ address: greenPayAddress, abi: GREEN_PAY_ABI, functionName: "payments", args: [id] });
}

// ── Per-request reader ────────────────────────────────────────────────────────
export function useTokenRequest(id: bigint) {
  const { greenPayAddress } = useTokenContracts();
  return useReadContract({ address: greenPayAddress, abi: GREEN_PAY_ABI, functionName: "requests", args: [id] });
}

// ── InvoiceManager actions ────────────────────────────────────────────────────
export function useTokenInvoices() {
  const { invoiceAddress } = useTokenContracts();
  const { address } = useAccount();
  const [txStatus, setTxStatus] = useState<TxStatus>("idle");
  const { writeContractAsync } = useWriteContract();

  const { data: issuedIds,   refetch: refetchIssued }   = useReadContract({ address: invoiceAddress, abi: INVOICE_MANAGER_ABI, functionName: "getIssuedInvoices",   args: [address!], query: { enabled: !!address } });
  const { data: receivedIds, refetch: refetchReceived } = useReadContract({ address: invoiceAddress, abi: INVOICE_MANAGER_ABI, functionName: "getReceivedInvoices", args: [address!], query: { enabled: !!address } });

  async function createInvoice(client: `0x${string}`, items: LineItem[], title: string, description: string, dueDate: bigint) {
    setTxStatus("pending");
    try {
      const hash = await writeContractAsync({ address: invoiceAddress, abi: INVOICE_MANAGER_ABI, functionName: "createInvoice", args: [client, items, title, description, dueDate] });
      setTxStatus("success"); refetchIssued(); return hash;
    } catch (e) { setTxStatus("error"); throw e; }
  }

  async function payInvoice(invoiceId: bigint) {
    setTxStatus("pending");
    try {
      const hash = await writeContractAsync({ address: invoiceAddress, abi: INVOICE_MANAGER_ABI, functionName: "payInvoice", args: [invoiceId] });
      setTxStatus("success"); refetchReceived(); return hash;
    } catch (e) { setTxStatus("error"); throw e; }
  }

  async function cancelInvoice(invoiceId: bigint) {
    setTxStatus("pending");
    try {
      const hash = await writeContractAsync({ address: invoiceAddress, abi: INVOICE_MANAGER_ABI, functionName: "cancelInvoice", args: [invoiceId] });
      setTxStatus("success"); refetchIssued(); return hash;
    } catch (e) { setTxStatus("error"); throw e; }
  }

  return {
    invoiceAddress,
    issuedIds:   issuedIds   ?? [],
    receivedIds: receivedIds ?? [],
    txStatus, setTxStatus,
    createInvoice, payInvoice, cancelInvoice,
  };
}

// ── Per-invoice reader ────────────────────────────────────────────────────────
export function useTokenInvoice(id: bigint) {
  const { invoiceAddress } = useTokenContracts();
  return useReadContract({ address: invoiceAddress, abi: INVOICE_MANAGER_ABI, functionName: "invoices", args: [id] });
}

// ── GreenFund reader ──────────────────────────────────────────────────────────
export function useTokenGreenFund() {
  const { address } = useAccount();
  const { greenFundAddress } = useTokenContracts();

  const { data: totalContributions } = useReadContract({ address: greenFundAddress, abi: GREEN_FUND_ABI, functionName: "totalContributions" });
  const { data: userContribution }   = useReadContract({ address: greenFundAddress, abi: GREEN_FUND_ABI, functionName: "contributionOf", args: [address!], query: { enabled: !!address } });
  const { data: fundBalance }        = useReadContract({ address: greenFundAddress, abi: GREEN_FUND_ABI, functionName: "balance" });

  return {
    totalContributions: totalContributions ?? 0n,
    userContribution:   userContribution   ?? 0n,
    fundBalance:        fundBalance        ?? 0n,
  };
}
