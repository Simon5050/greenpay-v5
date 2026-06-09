import Link from "next/link";
import { Leaf, Zap, Shield, TrendingUp, ArrowRight, Banknote, Smartphone } from "lucide-react";

export default function HomePage() {
  return (
    <div className="max-w-6xl mx-auto px-4 py-20">
      {/* Hero */}
      <div className="text-center mb-24 animate-fade-up">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-forest-600/15 border border-forest-500/20 text-forest-400 text-sm font-medium mb-6">
          <Leaf className="w-3.5 h-3.5" />
          Built on Arc Testnet · 0.25% total fee · 0.13% to carbon offset
        </div>

        <h1 className="font-display font-extrabold text-3xl md:text-5xl text-white leading-[1.1] mb-6">
          Payments that
          <br />
          <span className="text-forest-400">heal the planet</span>
        </h1>

        <p className="text-slate-400 text-base md:text-lg max-w-2xl mx-auto mb-10 leading-relaxed">
          Send USDC, create invoices, request payments, buy airtime and data —
          every transaction automatically routes 0.13% to a verified carbon offset pool.
        </p>

        {/* Primary CTA */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-6">
          <Link href="/dashboard" className="btn-primary px-8 py-3.5 text-base">
            Launch App <ArrowRight className="w-4 h-4" />
          </Link>
          <Link
            href="https://github.com/yourrepo/greenpay"
            target="_blank"
            className="btn-ghost px-8 py-3.5 text-base"
          >
            View on GitHub
          </Link>
        </div>

        {/* Quick action buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link
            href="/cashout"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl
              bg-earth-600/15 border border-earth-500/30 text-earth-400
              hover:bg-earth-600/25 hover:border-earth-500/50
              font-display font-medium text-sm transition-all duration-200"
          >
            <Banknote className="w-4 h-4" />
            Cash Out USDC
          </Link>
          <Link
            href="/airtime"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl
              bg-forest-600/15 border border-forest-500/30 text-forest-400
              hover:bg-forest-600/25 hover:border-forest-500/50
              font-display font-medium text-sm transition-all duration-200"
          >
            <Smartphone className="w-4 h-4" />
            Buy Airtime & Data
          </Link>
        </div>
      </div>

      {/* Feature grid */}
      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {[
          {
            icon: <Zap className="w-5 h-5" />,
            title: "Instant P2P",
            desc: "Send USDC to any address in one click. Share payment requests via link.",
          },
          {
            icon: <Shield className="w-5 h-5" />,
            title: "On-chain Invoices",
            desc: "Create, track, and settle invoices immutably on-chain with line-item detail.",
          },
          {
            icon: <Smartphone className="w-5 h-5" />,
            title: "Airtime & Data",
            desc: "Buy airtime and data bundles for any Nigerian network directly with USDC.",
          },
          {
            icon: <Leaf className="w-5 h-5" />,
            title: "Auto Carbon Offset",
            desc: "Every transaction routes 0.13% to GreenFund — a verifiable on-chain carbon pool.",
          },
        ].map(({ icon, title, desc }) => (
          <div
            key={title}
            className="card p-6 hover:border-forest-500/20 transition-all duration-300 group"
          >
            <div className="w-10 h-10 rounded-xl bg-forest-600/15 border border-forest-500/20 flex items-center justify-center text-forest-400 mb-4 group-hover:bg-forest-600/25 transition-colors">
              {icon}
            </div>
            <h3 className="font-display font-semibold text-white mb-2">{title}</h3>
            <p className="text-slate-400 text-sm leading-relaxed">{desc}</p>
          </div>
        ))}
      </div>

      {/* Cash out + airtime banner */}
      <div className="grid sm:grid-cols-2 gap-4 mb-8">
        {/* Cash Out */}
        <Link
          href="/cashout"
          className="card p-6 flex items-center gap-4 hover:border-earth-500/30
            transition-all duration-200 group cursor-pointer"
        >
          <div className="w-12 h-12 rounded-2xl bg-earth-600/15 border border-earth-500/20
            flex items-center justify-center text-earth-400 shrink-0
            group-hover:bg-earth-600/25 transition-colors">
            <Banknote className="w-6 h-6" />
          </div>
          <div className="flex-1">
            <div className="font-display font-semibold text-white mb-1">Cash Out USDC</div>
            <div className="text-slate-400 text-sm">
              Convert to NGN, EUR, USD and more via Transak, Yellow Card or Chimoney
            </div>
          </div>
          <ArrowRight className="w-4 h-4 text-slate-600 group-hover:text-earth-400 transition-colors shrink-0" />
        </Link>

        {/* Airtime & Data */}
        <Link
          href="/airtime"
          className="card p-6 flex items-center gap-4 hover:border-forest-500/30
            transition-all duration-200 group cursor-pointer"
        >
          <div className="w-12 h-12 rounded-2xl bg-forest-600/15 border border-forest-500/20
            flex items-center justify-center text-forest-400 shrink-0
            group-hover:bg-forest-600/25 transition-colors">
            <Smartphone className="w-6 h-6" />
          </div>
          <div className="flex-1">
            <div className="font-display font-semibold text-white mb-1">Airtime & Data</div>
            <div className="text-slate-400 text-sm">
              Top up MTN, Glo, Airtel, 9mobile instantly with USDC — powered by Reloadly
            </div>
          </div>
          <ArrowRight className="w-4 h-4 text-slate-600 group-hover:text-forest-400 transition-colors shrink-0" />
        </Link>
      </div>

      {/* Protocol stats strip */}
      <div className="card p-8 grid grid-cols-2 md:grid-cols-4 gap-8">
        {[
          {
            value: "0.25%",
            label: "Total Protocol Fee",
            sub:   "0.12% platform + 0.13% carbon",
            color: "text-forest-400",
          },
          {
            value: "0.13%",
            label: "Carbon Offset",
            sub:   "Auto-routed to GreenFund",
            color: "text-forest-400",
          },
          {
            value: "Arc",
            label: "Network",
            sub:   "EVM-compatible testnet",
            color: "text-white",
          },
          {
            value: "USDC + EURC",
            label: "Supported Tokens",
            sub:   "6-decimal stablecoins",
            color: "text-white",
          },
        ].map(({ value, label, sub, color }) => (
          <div key={label} className="flex flex-col gap-1">
            <div className={`font-display font-bold text-xl ${color}`}>{value}</div>
            <div className="text-slate-300 text-sm font-medium">{label}</div>
            <div className="text-slate-500 text-xs">{sub}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
