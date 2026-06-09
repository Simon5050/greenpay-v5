"use client";
import { useState } from "react";
import { useAccount, useWriteContract } from "wagmi";
import { parseUSDC, formatUSDC, formatDate } from "@/lib/utils";
import { INVOICE_STATUS, cn } from "@/lib/utils";
import { CONTRACTS, USDC_ABI, INVOICE_MANAGER_ABI } from "@/lib/contracts";
import { useTokenInvoices, useTokenInvoice, useTokenContracts, useTokenAllowance } from "@/hooks/useTokenContracts";
import { useToken } from "@/lib/token";
import { TokenSelector } from "@/components/TokenSelector";
import { PageHeader, TxStatusBanner, EmptyState, AddressDisplay } from "@/components/ui";
import { FileText, Plus, Trash2, CheckCircle, Loader2, X, Leaf } from "lucide-react";
import type { LineItem, TxStatus } from "@/types";

// ── Create invoice modal ───────────────────────────────────────────────────────
function CreateModal({ onClose }: { onClose: () => void }) {
  const { createInvoice, txStatus } = useInvoices();
  const [client, setClient] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [items, setItems] = useState([{ description: "", quantity: "1", unitPrice: "" }]);
  const [txHash, setTxHash] = useState<`0x${string}` | undefined>();
  const [errorMsg, setErrorMsg] = useState("");
  const [localStatus, setLocalStatus] = useState<TxStatus>("idle");

  const total       = items.reduce((acc, item) => acc + (parseFloat(item.quantity) || 0) * (parseFloat(item.unitPrice) || 0), 0);
  const platformFee = total * 0.0012;
  const greenFee    = total * 0.0013;
  const net         = total - platformFee - greenFee;

  function addItem() { setItems([...items, { description: "", quantity: "1", unitPrice: "" }]); }
  function removeItem(i: number) { setItems(items.filter((_, idx) => idx !== i)); }
  function updateItem(i: number, key: string, value: string) {
    const u = [...items]; u[i] = { ...u[i], [key]: value }; setItems(u);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErrorMsg(""); setLocalStatus("pending");
    try {
      const contractItems: LineItem[] = items.map((item) => ({
        description: item.description,
        quantity: BigInt(Math.round(parseFloat(item.quantity) * 100)),
        unitPrice: parseUSDC(item.unitPrice),
      }));
      const dueDateTs = dueDate ? BigInt(Math.floor(new Date(dueDate).getTime() / 1000)) : 0n;
      const hash = await createInvoice(
        (client || "0x0000000000000000000000000000000000000000") as `0x${string}`,
        contractItems, title, description, dueDateTs
      );
      setTxHash(hash); setLocalStatus("success");
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message.slice(0, 120) : "Error");
      setLocalStatus("error");
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="card w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6 flex flex-col gap-5">
        <div className="flex items-center justify-between">
          <h2 className="font-display font-bold text-xl text-white">New Invoice</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors"><X className="w-5 h-5" /></button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5 sm:col-span-2">
              <label className="text-slate-300 text-sm font-medium">Invoice Title</label>
              <input className="input-base" placeholder="Web design — May 2025" value={title} onChange={(e) => setTitle(e.target.value)} required />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-slate-300 text-sm font-medium">Bill To <span className="text-slate-500">(optional)</span></label>
              <input className="input-base font-mono text-sm" placeholder="0x... or leave blank" value={client} onChange={(e) => setClient(e.target.value)} />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-slate-300 text-sm font-medium">Due Date <span className="text-slate-500">(optional)</span></label>
              <input className="input-base" type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
            </div>
          </div>

          {/* Line items */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <label className="text-slate-300 text-sm font-medium">Line Items</label>
              <button type="button" onClick={addItem} className="text-xs text-forest-400 hover:text-forest-300 flex items-center gap-1">
                <Plus className="w-3.5 h-3.5" /> Add Item
              </button>
            </div>
            <div className="flex flex-col gap-2">
              {items.map((item, i) => (
                <div key={i} className="grid grid-cols-12 gap-2 items-center">
                  <input className="input-base col-span-5 text-sm py-2" placeholder="Description" value={item.description} onChange={(e) => updateItem(i, "description", e.target.value)} required />
                  <input className="input-base col-span-2 text-sm py-2" placeholder="Qty" type="number" min="0.01" step="0.01" value={item.quantity} onChange={(e) => updateItem(i, "quantity", e.target.value)} required />
                  <div className="relative col-span-4">
                    <input className="input-base text-sm py-2 pr-14" placeholder="Price" type="number" min="0.01" step="0.01" value={item.unitPrice} onChange={(e) => updateItem(i, "unitPrice", e.target.value)} required />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 text-xs">USDC</span>
                  </div>
                  {items.length > 1 && (
                    <button type="button" onClick={() => removeItem(i)} className="col-span-1 text-slate-500 hover:text-red-400 transition-colors">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Total preview */}
          {total > 0 && (
            <div className="rounded-xl bg-slate-800/50 border border-white/5 p-4 flex flex-col gap-2 text-sm">
              <div className="flex justify-between text-slate-400">
                <span>Subtotal</span><span className="text-white">${total.toFixed(2)} USDC</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span className="flex items-center gap-1.5"><Leaf className="w-3.5 h-3.5 text-slate-400" /> Platform fee (0.12%)</span>
                <span>${platformFee.toFixed(4)} USDC</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span className="flex items-center gap-1.5"><Leaf className="w-3.5 h-3.5 text-forest-400" /> Carbon offset (0.13%)</span>
                <span className="text-forest-400">${greenFee.toFixed(4)} USDC</span>
              </div>
              <div className="border-t border-white/5 pt-2 flex justify-between text-white font-semibold">
                <span>You receive</span><span>${net.toFixed(2)} USDC</span>
              </div>
            </div>
          )}

          <div className="flex flex-col gap-1.5">
            <label className="text-slate-300 text-sm font-medium">Notes <span className="text-slate-500">(optional)</span></label>
            <textarea className="input-base resize-none" placeholder="Payment terms, bank details, etc." rows={3} maxLength={500} value={description} onChange={(e) => setDescription(e.target.value)} />
          </div>

          <TxStatusBanner status={localStatus} txHash={txHash} errorMsg={errorMsg} />

          <div className="flex gap-3">
            <button type="button" onClick={onClose} className="btn-ghost flex-1">Cancel</button>
            <button type="submit" disabled={localStatus === "pending" || total === 0} className="btn-primary flex-1">
              {localStatus === "pending" ? <><Loader2 className="w-4 h-4 animate-spin" /> Creating…</> : <><FileText className="w-4 h-4" /> Create Invoice</>}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Invoice row ────────────────────────────────────────────────────────────────
function InvoiceRow({ id, userAddress }: { id: bigint; userAddress?: `0x${string}` }) {
  const [localStatus, setLocalStatus] = useState<TxStatus>("idle");
  const [txHash, setTxHash] = useState<`0x${string}` | undefined>();
  const { writeContractAsync } = useWriteContract();

  const { token } = useToken();
  const { invoiceAddress, tokenAddress } = useTokenContracts();
  const { data: inv } = useTokenInvoice(id);
  const { data: allowance, refetch: refetchAllowance } = useTokenAllowance(invoiceAddress);

  if (!inv) return (
    <div className="card p-4 animate-pulse h-20">
      <div className="h-4 bg-slate-800 rounded w-3/4 mb-2" /><div className="h-3 bg-slate-800 rounded w-1/2" />
    </div>
  );

  const [invId, issuer, client, totalAmount, platformFee, greenFee, , invTitle, , dueDate, status, createdAt] = inv;
  const statusInfo = INVOICE_STATUS[status as keyof typeof INVOICE_STATUS];
  const isIssuer = issuer.toLowerCase() === userAddress?.toLowerCase();
  const ZERO_ADDR = "0x0000000000000000000000000000000000000000";
  const isOpen = client.toLowerCase() === ZERO_ADDR.toLowerCase();
  const canPay = status === 1 && !isIssuer && (isOpen || client.toLowerCase() === userAddress?.toLowerCase());
  const canCancel = status === 1 && isIssuer;

  async function handlePay() {
    setLocalStatus("approving");
    try {
      if ((allowance ?? 0n) < totalAmount) {
        await writeContractAsync({ address: CONTRACTS.USDC, abi: USDC_ABI, functionName: "approve", args: [CONTRACTS.InvoiceManager, totalAmount] });
        // Poll until allowance confirmed on-chain (works for USDC + EURC)
        let confirmed = false;
        for (let i = 0; i < 30; i++) {
          await new Promise((r) => setTimeout(r, 1500));
          const result = await refetchAllowance();
          if ((result.data ?? 0n) >= amount) { confirmed = true; break; }
        }
        if (!confirmed) { setTxStatus("error"); return; }
      }
      setLocalStatus("pending");
      const hash = await writeContractAsync({ address: invoiceAddress, abi: INVOICE_MANAGER_ABI, functionName: "payInvoice", args: [id] });
      setTxHash(hash); setLocalStatus("success");
    } catch { setLocalStatus("error"); }
  }

  async function handleCancel() {
    setLocalStatus("pending");
    try {
      const hash = await writeContractAsync({ address: invoiceAddress, abi: INVOICE_MANAGER_ABI, functionName: "cancelInvoice", args: [id] });
      setTxHash(hash); setLocalStatus("success");
    } catch { setLocalStatus("error"); }
  }

  return (
    <div className="card p-4 flex flex-col gap-3 hover:border-white/10 transition-all">
      <div className="flex items-start justify-between gap-3">
        <div className="flex flex-col gap-1 flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-mono text-slate-500 text-xs shrink-0">#{invId.toString()}</span>
            <span className="font-display font-semibold text-white truncate">{invTitle}</span>
            <span className={cn("text-xs px-2 py-0.5 rounded-full shrink-0", statusInfo.bg, statusInfo.color)}>{statusInfo.label}</span>
            {isOpen && <span className="text-xs px-2 py-0.5 rounded-full bg-slate-700 text-slate-300 shrink-0">Open</span>}
          </div>
          <div className="flex gap-4 text-xs text-slate-500 flex-wrap">
            {isIssuer
              ? <span>To: {isOpen ? "Anyone" : <AddressDisplay address={client} />}</span>
              : <span>From: <AddressDisplay address={issuer} /></span>
            }
            {dueDate > 0n && <span>Due: {formatDate(dueDate)}</span>}
            <span>Issued: {formatDate(createdAt)}</span>
          </div>
        </div>
        <div className="text-right shrink-0">
          <div className="font-display font-bold text-white">${formatUSDC(totalAmount)}</div>
          <div className="text-xs text-forest-400 flex items-center gap-1 justify-end">
            <Leaf className="w-3 h-3" /> ${formatUSDC(greenFee, 4)}
          </div>
        </div>
      </div>

      {localStatus !== "idle" && <TxStatusBanner status={localStatus} txHash={txHash} />}

      {(canPay || canCancel) && (
        <div className="flex gap-2">
          {canPay && (
            <button onClick={handlePay} disabled={localStatus === "pending" || localStatus === "approving"} className="btn-primary flex-1 py-2 text-sm">
              <CheckCircle className="w-4 h-4" />
              {localStatus === "approving" ? "Approving…" : localStatus === "pending" ? "Paying…" : "Pay Invoice"}
            </button>
          )}
          {canCancel && (
            <button onClick={handleCancel} disabled={localStatus === "pending"} className="btn-ghost py-2 px-4 text-sm border-red-500/20 text-red-400 hover:border-red-500/40">
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>
      )}
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────
export default function InvoicesPage() {
  const { address, isConnected } = useAccount();
  const [showCreate, setShowCreate] = useState(false);
  const [activeTab, setActiveTab] = useState<"issued" | "received">("issued");
  const { token } = useToken();
  const { issuedIds, receivedIds } = useTokenInvoices();

  const ids = activeTab === "issued" ? [...issuedIds].reverse() : [...receivedIds].reverse();

  return (
    <div className="max-w-3xl mx-auto px-4 py-10">
      <PageHeader
        title="Invoices"
        subtitle={`Create, track and settle ${token.symbol} invoices on-chain`}
        action={<div className="flex items-center gap-3"><TokenSelector />{isConnected && (
          <button onClick={() => setShowCreate(true)} className="btn-primary py-2.5 text-sm">
            <Plus className="w-4 h-4" /> New Invoice
          </button>
        )}
      />

      {showCreate && <CreateModal onClose={() => setShowCreate(false)} />}

      <div className="flex gap-1 p-1 bg-slate-900/60 rounded-xl border border-white/5 mb-6">
        {(["issued", "received"] as const).map((tab) => (
          <button key={tab} onClick={() => setActiveTab(tab)}
            className={cn("flex-1 py-2 rounded-lg text-sm font-medium capitalize transition-all",
              activeTab === tab ? "bg-forest-600/20 text-forest-400" : "text-slate-400 hover:text-white"
            )}>
            {tab === "issued" ? `Issued (${issuedIds.length})` : `Received (${receivedIds.length})`}
          </button>
        ))}
      </div>

      {ids.length === 0 ? (
        <EmptyState
          icon={<FileText className="w-6 h-6" />}
          title={`No ${activeTab} invoices`}
          description={activeTab === "issued" ? "Create your first invoice to get started." : "Invoices sent to you will appear here."}
          action={activeTab === "issued" && isConnected ? (
            <button onClick={() => setShowCreate(true)} className="btn-primary py-2 text-sm">
              <Plus className="w-4 h-4" /> Create Invoice
            </button>
          ) : undefined}
        />
      ) : (
        <div className="flex flex-col gap-3">
          {ids.map((id) => <InvoiceRow key={id.toString()} id={id} userAddress={address} />)}
        </div>
      )}
    </div>
  );
}
