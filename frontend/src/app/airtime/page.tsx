"use client";
import { useState } from "react";
import { useAccount } from "wagmi";
import { useUSDC } from "@/hooks/useUSDC";
import { formatUSDC } from "@/lib/utils";
import { PageHeader, TxStatusBanner } from "@/components/ui";
import { Smartphone, Wifi, Info, ExternalLink } from "lucide-react";
import { cn } from "@/lib/utils";

const NETWORKS = [
  { id: "mtn",     name: "MTN",     color: "text-yellow-400",  bg: "bg-yellow-400/10", border: "border-yellow-400/20" },
  { id: "glo",     name: "Glo",     color: "text-green-400",   bg: "bg-green-400/10",  border: "border-green-400/20" },
  { id: "airtel",  name: "Airtel",  color: "text-red-400",     bg: "bg-red-400/10",    border: "border-red-400/20"   },
  { id: "9mobile", name: "9mobile", color: "text-forest-400",  bg: "bg-forest-400/10", border: "border-forest-400/20"},
];

const AIRTIME_AMOUNTS = ["100", "200", "500", "1000", "2000", "5000"];

const DATA_BUNDLES = [
  { id: "1",  name: "1GB",   validity: "1 day",   price: "300"  },
  { id: "2",  name: "2GB",   validity: "2 days",  price: "500"  },
  { id: "3",  name: "5GB",   validity: "7 days",  price: "1000" },
  { id: "4",  name: "10GB",  validity: "30 days", price: "2000" },
  { id: "5",  name: "20GB",  validity: "30 days", price: "3500" },
  { id: "6",  name: "50GB",  validity: "30 days", price: "7000" },
];

// NGN/USDC indicative rate (in production, fetch from Yellow Card API)
const NGN_PER_USDC = 1580;

function ngnToUsdc(ngn: number): string {
  return (ngn / NGN_PER_USDC).toFixed(4);
}

export default function AirtimePage() {
  const { address, isConnected } = useAccount();
  const { balance } = useUSDC();

  const [tab, setTab]             = useState<"airtime" | "data">("airtime");
  const [network, setNetwork]     = useState("");
  const [phone, setPhone]         = useState("");
  const [amount, setAmount]       = useState("");
  const [bundle, setBundle]       = useState("");
  const [submitted, setSubmitted] = useState(false);

  // In Phase 3 this will call the Reloadly API via a backend route.
  // For now it routes to Reloadly's website with pre-filled params.
  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const baseUrl = "https://reloadly.com/topup";
    const params = new URLSearchParams({
      phone,
      network,
      ...(tab === "airtime" ? { amount } : { bundle }),
      country: "NG",
    });
    window.open(`${baseUrl}?${params.toString()}`, "_blank", "noopener,noreferrer");
    setSubmitted(true);
  }

  const selectedAmount = tab === "airtime" ? amount : bundle;
  const ngnAmount = tab === "airtime"
    ? parseFloat(amount || "0")
    : parseFloat(DATA_BUNDLES.find(b => b.id === bundle)?.price || "0");
  const usdcCost = ngnToUsdc(ngnAmount);
  const isValid = network && phone.length >= 10 && selectedAmount && isConnected;

  return (
    <div className="max-w-xl mx-auto px-4 py-10">
      <PageHeader
        title="Airtime & Data"
        subtitle="Top up any Nigerian network instantly with USDC"
      />

      {/* Balance */}
      {isConnected && (
        <div className="card p-4 flex items-center justify-between mb-6">
          <span className="text-slate-400 text-sm">Available Balance</span>
          <span className="font-display font-bold text-white">
            ${formatUSDC(balance)} USDC
          </span>
        </div>
      )}

      {/* Phase notice */}
      <div className="rounded-xl bg-earth-950/40 border border-earth-500/20 p-4 mb-6 flex gap-3">
        <Info className="w-4 h-4 text-earth-400 shrink-0 mt-0.5" />
        <p className="text-slate-400 text-sm leading-relaxed">
          Direct in-app top-up is coming in <strong className="text-white">Phase 3</strong> via
          the Reloadly API. For now you will be redirected to Reloadly's platform
          to complete your purchase. Your phone number and network are pre-filled.
        </p>
      </div>

      {/* Tab */}
      <div className="flex gap-1 p-1 bg-slate-900/60 rounded-xl border border-white/5 mb-6">
        {(["airtime", "data"] as const).map((t) => (
          <button
            key={t}
            onClick={() => { setTab(t); setAmount(""); setBundle(""); }}
            className={cn(
              "flex-1 py-2 rounded-lg text-sm font-medium capitalize transition-all flex items-center justify-center gap-2",
              tab === t ? "bg-forest-600/20 text-forest-400" : "text-slate-400 hover:text-white"
            )}
          >
            {t === "airtime"
              ? <><Smartphone className="w-3.5 h-3.5" /> Airtime</>
              : <><Wifi className="w-3.5 h-3.5" /> Data Bundles</>
            }
          </button>
        ))}
      </div>

      <form onSubmit={handleSubmit} className="card p-6 flex flex-col gap-5">
        {/* Network selector */}
        <div className="flex flex-col gap-2">
          <label className="text-slate-300 text-sm font-medium">Network</label>
          <div className="grid grid-cols-4 gap-2">
            {NETWORKS.map((n) => (
              <button
                key={n.id}
                type="button"
                onClick={() => setNetwork(n.id)}
                className={cn(
                  "py-2.5 rounded-xl text-sm font-display font-semibold border transition-all",
                  network === n.id
                    ? `${n.bg} ${n.color} ${n.border}`
                    : "bg-slate-800/60 border-white/10 text-slate-400 hover:text-white hover:border-white/20"
                )}
              >
                {n.name}
              </button>
            ))}
          </div>
        </div>

        {/* Phone number */}
        <div className="flex flex-col gap-1.5">
          <label className="text-slate-300 text-sm font-medium">Phone Number</label>
          <input
            className="input-base"
            placeholder="08012345678"
            type="tel"
            maxLength={11}
            value={phone}
            onChange={(e) => setPhone(e.target.value.replace(/\D/g, ""))}
            required
          />
        </div>

        {/* Airtime amounts */}
        {tab === "airtime" && (
          <div className="flex flex-col gap-2">
            <label className="text-slate-300 text-sm font-medium">Amount (NGN)</label>
            <div className="grid grid-cols-3 gap-2">
              {AIRTIME_AMOUNTS.map((a) => (
                <button
                  key={a}
                  type="button"
                  onClick={() => setAmount(a)}
                  className={cn(
                    "py-2.5 rounded-xl text-sm border transition-all",
                    amount === a
                      ? "bg-forest-600/20 border-forest-500/40 text-forest-400 font-semibold"
                      : "bg-slate-800/60 border-white/10 text-slate-400 hover:text-white hover:border-white/20"
                  )}
                >
                  ₦{Number(a).toLocaleString()}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Data bundles */}
        {tab === "data" && (
          <div className="flex flex-col gap-2">
            <label className="text-slate-300 text-sm font-medium">Select Bundle</label>
            <div className="grid grid-cols-2 gap-2">
              {DATA_BUNDLES.map((b) => (
                <button
                  key={b.id}
                  type="button"
                  onClick={() => setBundle(b.id)}
                  className={cn(
                    "py-3 px-3 rounded-xl text-left border transition-all",
                    bundle === b.id
                      ? "bg-forest-600/20 border-forest-500/40"
                      : "bg-slate-800/60 border-white/10 hover:border-white/20"
                  )}
                >
                  <div className={cn(
                    "font-display font-bold text-base",
                    bundle === b.id ? "text-forest-400" : "text-white"
                  )}>
                    {b.name}
                  </div>
                  <div className="text-slate-500 text-xs">{b.validity}</div>
                  <div className="text-slate-400 text-xs mt-1">₦{Number(b.price).toLocaleString()}</div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* USDC cost preview */}
        {ngnAmount > 0 && (
          <div className="rounded-xl bg-slate-800/50 border border-white/5 p-4 flex flex-col gap-2 text-sm">
            <div className="flex justify-between text-slate-400">
              <span>NGN Amount</span>
              <span className="text-white">₦{ngnAmount.toLocaleString()}</span>
            </div>
            <div className="flex justify-between text-slate-400">
              <span>Rate (indicative)</span>
              <span>₦{NGN_PER_USDC.toLocaleString()} / USDC</span>
            </div>
            <div className="border-t border-white/5 pt-2 flex justify-between text-white font-semibold">
              <span>Approx. USDC Cost</span>
              <span>~${usdcCost} USDC</span>
            </div>
            <p className="text-slate-600 text-xs">
              Final rate determined by Reloadly at time of purchase.
            </p>
          </div>
        )}

        {submitted && (
          <div className="rounded-xl bg-forest-500/10 border border-forest-500/20 p-3 text-forest-400 text-sm flex items-center gap-2">
            <ExternalLink className="w-4 h-4 shrink-0" />
            Redirected to Reloadly. Complete your purchase there.
          </div>
        )}

        <button
          type="submit"
          disabled={!isValid}
          className="btn-primary w-full py-3.5"
        >
          <Smartphone className="w-4 h-4" />
          {tab === "airtime" ? "Buy Airtime" : "Buy Data Bundle"}
          <ExternalLink className="w-3.5 h-3.5" />
        </button>

        <p className="text-slate-600 text-xs text-center">
          Powered by Reloadly · Direct API integration coming in Phase 3
        </p>
      </form>
    </div>
  );
}
