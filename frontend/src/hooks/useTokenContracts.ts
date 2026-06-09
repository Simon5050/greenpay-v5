"use client";

import { useToken } from "@/lib/token";
import {
  useAccount,
  useReadContract,
  useWriteContract,
} from "wagmi";
import { USDC_ABI, GREEN_PAY_ABI, INVOICE_MANAGER_ABI, GREEN_FUND_ABI } from "@/lib/contracts";
import { MAX_UINT256 } from "@/lib/utils";
import { useState } from "react";
import type { TxStatus, LineItem } from "@/types";

// ── Shared Types ─────────────────────────────────────────────────────────────
export type PaymentData = [
  bigint,
  `0x${string}`,
  `0x${string}`,
  bigint,
  bigint,
  bigint,
  bigint,
  string,
  bigint
];

export type InvoiceData = [
  bigint,           // invoiceId
  `0x${string}`,    // issuer
  `0x${string}`,    // client
  bigint,           // totalAmount
  bigint,           // platformFee
  bigint,           // greenFee
  bigint,           // reserved / tax
  string,           // title
  bigint,           // reserved
  bigint,           // dueDate
  number | bigint,  // status
  bigint            // createdAt
];

export type RequestData = [
  bigint,           // requestId
  `0x${string}`,    // requester
  `0x${string}`,    // recipient
  bigint,           // amount
  string,           // note
  number | bigint,  // status
  bigint            // createdAt
];

// ── Core ─────────────────────────────────────────────────────────────────────
export function useTokenContracts() {
  const { token } = useToken();
  return {
    tokenAddress:     token.address,
    greenPayAddress:  token.greenPayAddress,
    invoiceAddress:   token.invoiceAddress,
    greenFundAddress: token.greenFundAddress,
    symbol:           token.symbol,
    decimals:         token.decimals,
    flag:             token.flag,
  };
}

// ── Token ────────────────────────────────────────────────────────────────────
export function useTokenBalance() {
  const { address } = useAccount();
  const { tokenAddress } = useTokenContracts();

  return useReadContract({
    address: tokenAddress,
    abi: USDC_ABI,
    functionName: "balanceOf",
    args: [address!],
    query: { enabled: !!address },
  });
}

export function useTokenAllowance(spender: `0x${string}`) {
  const { address } = useAccount();
  const { tokenAddress } = useTokenContracts();

  return useReadContract({
    address: tokenAddress,
    abi: USDC_ABI,
    functionName: "allowance",
    args: [address!, spender],
    query: { enabled: !!address },
  });
}

export function useTokenApprove() {
  const { tokenAddress } = useTokenContracts();
  const { writeContractAsync } = useWriteContract();

  async function approve(spender: `0x${string}`, amount?: bigint) {
    return writeContractAsync({
      address: tokenAddress,
      abi: USDC_ABI,
      functionName: "approve",
      args: [spender, amount ?? MAX_UINT256],
    });
  }

  return { approve };
}

// ── GreenPay ─────────────────────────────────────────────────────────────────
export function useTokenGreenPay() {
  const { greenPayAddress } = useTokenContracts();
  const { address } = useAccount();
  const [txStatus, setTxStatus] = useState<TxStatus>("idle");
  const { writeContractAsync } = useWriteContract();

  const { data: sentIds }         = useReadContract({ address: greenPayAddress, abi: GREEN_PAY_ABI, functionName: "getSentPayments",    args: [address!], query: { enabled: !!address } });
  const { data: receivedIds }     = useReadContract({ address: greenPayAddress, abi: GREEN_PAY_ABI, functionName: "getReceivedPayments", args: [address!], query: { enabled: !!address } });
  const { data: myRequestIds }    = useReadContract({ address: greenPayAddress, abi: GREEN_PAY_ABI, functionName: "getMyRequests",       args: [address!], query: { enabled: !!address } });
  const { data: requestsToMeIds } = useReadContract({ address: greenPayAddress, abi: GREEN_PAY_ABI, functionName: "getRequestsToMe",     args: [address!], query: { enabled: !!address } });

  return {
    greenPayAddress,
    sentIds:         sentIds         ?? [],
    receivedIds:     receivedIds     ?? [],
    myRequestIds:    myRequestIds    ?? [],
    requestsToMeIds: requestsToMeIds ?? [],
    txStatus,
    setTxStatus,
  };
}

export function useTokenPayment(id: bigint) {
  const { greenPayAddress } = useTokenContracts();
  return useReadContract({
    address: greenPayAddress,
    abi: GREEN_PAY_ABI,
    functionName: "payments",
    args: [id],
    query: { enabled: id !== 0n },
  }) as { data: PaymentData | undefined };
}

export function useTokenRequest(id: bigint) {
  const { greenPayAddress } = useTokenContracts();
  return useReadContract({
    address: greenPayAddress,
    abi: GREEN_PAY_ABI,
    functionName: "requests",
    args: [id],
    query: { enabled: id !== 0n },
  }) as { data: RequestData | undefined };
}

// ── Invoices ─────────────────────────────────────────────────────────────────
export function useTokenInvoices() {
  const { invoiceAddress } = useTokenContracts();
  const { address } = useAccount();
  const [txStatus, setTxStatus] = useState<TxStatus>("idle");
  const { writeContractAsync } = useWriteContract();

  const { data: issuedIds }   = useReadContract({ address: invoiceAddress, abi: INVOICE_MANAGER_ABI, functionName: "getIssuedInvoices",   args: [address!], query: { enabled: !!address } });
  const { data: receivedIds } = useReadContract({ address: invoiceAddress, abi: INVOICE_MANAGER_ABI, functionName: "getReceivedInvoices", args: [address!], query: { enabled: !!address } });

  return {
    invoiceAddress,
    issuedIds:   issuedIds   ?? [],
    receivedIds: receivedIds ?? [],
    txStatus,
    setTxStatus,
  };
}

export function useTokenInvoice(id: bigint) {
  const { invoiceAddress } = useTokenContracts();
  return useReadContract({
    address: invoiceAddress,
    abi: INVOICE_MANAGER_ABI,
    functionName: "invoices",
    args: [id],
    query: { enabled: id !== 0n },
  }) as { data: InvoiceData | undefined };
}

// ── GreenFund ────────────────────────────────────────────────────────────────
export function useTokenGreenFund() {
  const { address } = useAccount();
  const { greenFundAddress } = useTokenContracts();

  const { data: totalContributions } = useReadContract({
    address: greenFundAddress,
    abi: GREEN_FUND_ABI,
    functionName: "totalContributions",
  });

  const { data: userContribution } = useReadContract({
    address: greenFundAddress,
    abi: GREEN_FUND_ABI,
    functionName: "contributionOf",
    args: [address!],
    query: { enabled: !!address },
  });

  const { data: fundBalance } = useReadContract({
    address: greenFundAddress,
    abi: GREEN_FUND_ABI,
    functionName: "balance",
  });

  return {
    totalContributions: totalContributions ?? 0n,
    userContribution:   userContribution   ?? 0n,
    fundBalance:        fundBalance        ?? 0n,
  };
}