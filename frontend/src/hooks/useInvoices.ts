"use client";
import { useAccount, useReadContract, useWriteContract } from "wagmi";
import { CONTRACTS, INVOICE_MANAGER_ABI } from "@/lib/contracts";
import { useState } from "react";
import type { LineItem, TxStatus } from "@/types";

export function useInvoices() {
  const { address } = useAccount();
  const [txStatus, setTxStatus] = useState<TxStatus>("idle");
  const { writeContractAsync } = useWriteContract();

  const { data: issuedIds, refetch: refetchIssued } = useReadContract({
    address: CONTRACTS.InvoiceManager,
    abi: INVOICE_MANAGER_ABI,
    functionName: "getIssuedInvoices",
    args: [address!],
    query: { enabled: !!address },
  });

  const { data: receivedIds, refetch: refetchReceived } = useReadContract({
    address: CONTRACTS.InvoiceManager,
    abi: INVOICE_MANAGER_ABI,
    functionName: "getReceivedInvoices",
    args: [address!],
    query: { enabled: !!address },
  });

  async function createInvoice(
    client: `0x${string}`,
    items: LineItem[],
    title: string,
    description: string,
    dueDate: bigint
  ): Promise<`0x${string}`> {
    setTxStatus("pending");
    try {
      const hash = await writeContractAsync({
        address: CONTRACTS.InvoiceManager,
        abi: INVOICE_MANAGER_ABI,
        functionName: "createInvoice",
        args: [client, items, title, description, dueDate],
      });
      setTxStatus("success");
      refetchIssued();
      return hash;
    } catch (e) {
      setTxStatus("error");
      throw e;
    }
  }

  async function payInvoice(invoiceId: bigint): Promise<`0x${string}`> {
    setTxStatus("pending");
    try {
      const hash = await writeContractAsync({
        address: CONTRACTS.InvoiceManager,
        abi: INVOICE_MANAGER_ABI,
        functionName: "payInvoice",
        args: [invoiceId],
      });
      setTxStatus("success");
      refetchReceived();
      return hash;
    } catch (e) {
      setTxStatus("error");
      throw e;
    }
  }

  async function cancelInvoice(invoiceId: bigint): Promise<`0x${string}`> {
    setTxStatus("pending");
    try {
      const hash = await writeContractAsync({
        address: CONTRACTS.InvoiceManager,
        abi: INVOICE_MANAGER_ABI,
        functionName: "cancelInvoice",
        args: [invoiceId],
      });
      setTxStatus("success");
      refetchIssued();
      return hash;
    } catch (e) {
      setTxStatus("error");
      throw e;
    }
  }

  return {
    issuedIds: issuedIds ?? [],
    receivedIds: receivedIds ?? [],
    txStatus,
    setTxStatus,
    createInvoice,
    payInvoice,
    cancelInvoice,
    refetchIssued,
    refetchReceived,
  };
}

// ── Standalone per-item hooks (called directly from components) ───────────────

export function useInvoice(id: bigint) {
  return useReadContract({
    address: CONTRACTS.InvoiceManager,
    abi: INVOICE_MANAGER_ABI,
    functionName: "invoices",
    args: [id],
  });
}

export function useInvoiceLineItems(id: bigint) {
  return useReadContract({
    address: CONTRACTS.InvoiceManager,
    abi: INVOICE_MANAGER_ABI,
    functionName: "getLineItems",
    args: [id],
  });
}

export function useInvoicePreviewFee(amount: bigint) {
  return useReadContract({
    address: CONTRACTS.InvoiceManager,
    abi: INVOICE_MANAGER_ABI,
    functionName: "previewFee",
    args: [amount],
    query: { enabled: amount > 0n },
  });
}
