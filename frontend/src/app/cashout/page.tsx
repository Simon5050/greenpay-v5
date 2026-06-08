"use client";
import { useAccount } from "wagmi";
import { useUSDC } from "@/hooks/useUSDC";
import { formatUSDC } from "@/lib/utils";
import { PageHeader } from "@/components/ui";
import { Banknote, ArrowRight, ExternalLink, Info } from "lucide-react";

// Country → provider routing
const PROVIDERS = [
  {
    id: "yellowcard",
    name: "Yellow Card",
    logo: "🟡",
    tag: "Best for Nigeria",
    tagColor: "bg-forest-500/10 text-forest-400",
    desc: "USDC → NGN directly to your Nigerian bank account. Low fees, fast settlement.",
    currencies: ["NGN"],
    countries: ["NG"],
    url: (address: string) =>
      `https://yellowcard.io/sell?address=${address}&currency=USDC`,
  },
  {
    id: "chimoney",
    name: "Chimoney",
    logo: "🌍",
    tag: "Best for Africa",
    tagColor: "bg-earth-500/10 text-earth-400",
    desc: "Multi-currency payouts across Africa. Supports NGN, KES, GHS, ZAR and more.",
    currencies: ["NGN", "KES", "GHS", "ZAR"],
    countries: ["NG", "KE", "GH", "ZA"],
    url: (address: string) =>
      `https://chimoney.io/redeem?wallet=${address}`,
  },
  {
    id: "transak",
    name: "Transak",
    logo: "🌐",
    tag: "162+ countries",
    tagColor: "bg-slate-500/10 text-slate-400",
    desc: "Global off-ramp covering 162+ countries. Supports EUR, GBP, USD and local currencies.",
    currencies: ["EUR", "GBP", "USD", "NGN", "+more"],
    countries: ["*"],
    url: (address: string) =>
      `https://global.transak.com/?walletAddress=${address}&cryptoCurrencyCode=USDC&defaultCryptoCurrency=USDC`,
  },
  {
    id: "moonpay",
    name: "MoonPay",
    logo: "🌙",
    tag: "US & Europe",
    tagColor: "bg-blue-500/10 text-blue-400",
    desc: "Trusted off-ramp for US and European users. Supports USD, EUR, GBP.",
    currencies: ["USD", "EUR", "GBP"],
    countries: ["US", "GB", "EU"],
    url: (address: string) =>
      `https://www.moonpay.com/sell?walletAddress=${address}&currencyCode=usdc`,
  },
];

export default function CashOutPage() {
  const { address, isConnected } = useAccount();
  const { balance } = useUSDC();

  function openProvider(url: string) {
    window.open(url, "_blank", "noopener,noreferrer");
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-10">
      <PageHeader
        title="Cash Out USDC"
        subtitle="Convert your USDC to local currency via a regulated provider"
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

      {/* Disclaimer */}
      <div className="rounded-xl bg-earth-950/40 border border-earth-500/20 p-4 mb-6 flex gap-3">
        <Info className="w-4 h-4 text-earth-400 shrink-0 mt-0.5" />
        <p className="text-slate-400 text-sm leading-relaxed">
          GreenPay does not perform currency conversion. You will be redirected
          to a licensed, regulated third-party provider. Your wallet address is
          pre-filled — all KYC, exchange rates, and bank payouts are handled
          entirely by the chosen provider.
        </p>
      </div>

      {/* Provider cards */}
      <div className="flex flex-col gap-4">
        {PROVIDERS.map((provider) => (
          <div
            key={provider.id}
            className="card p-5 flex items-start gap-4 hover:border-white/10
              transition-all duration-200 group"
          >
            {/* Logo */}
            <div className="w-12 h-12 rounded-2xl bg-slate-800 border border-white/5
              flex items-center justify-center text-2xl shrink-0">
              {provider.logo}
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1 flex-wrap">
                <span className="font-display font-semibold text-white">
                  {provider.name}
                </span>
                <span className={`text-xs px-2 py-0.5 rounded-full ${provider.tagColor}`}>
                  {provider.tag}
                </span>
              </div>
              <p className="text-slate-400 text-sm mb-2 leading-relaxed">
                {provider.desc}
              </p>
              <div className="flex gap-1.5 flex-wrap">
                {provider.currencies.map((c) => (
                  <span
                    key={c}
                    className="text-xs px-2 py-0.5 rounded bg-slate-800 text-slate-400 border border-white/5"
                  >
                    {c}
                  </span>
                ))}
              </div>
            </div>

            {/* CTA */}
            <button
              onClick={() =>
                openProvider(provider.url(address ?? "your-wallet-address"))
              }
              className="btn-ghost py-2 px-4 text-sm shrink-0 flex items-center gap-1.5
                group-hover:border-white/20"
            >
              Cash Out
              <ExternalLink className="w-3.5 h-3.5" />
            </button>
          </div>
        ))}
      </div>

      {/* Footer note */}
      <p className="text-slate-600 text-xs text-center mt-6 leading-relaxed">
        GreenPay earns an affiliate commission when you use these providers.
        This does not affect the exchange rate or fees you pay.
      </p>
    </div>
  );
}
