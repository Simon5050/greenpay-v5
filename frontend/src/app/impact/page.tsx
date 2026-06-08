"use client";
import { useAccount } from "wagmi";
import { useTokenGreenFund, useTokenGreenPay } from "@/hooks/useTokenContracts";
import { useToken } from "@/lib/token";
import { TokenSelector } from "@/components/TokenSelector";
import { formatUSDC, usdcToKgCO2, kgToTrees } from "@/lib/utils";
import { PageHeader, StatCard } from "@/components/ui";
import { Leaf, Droplets, TrendingUp, Globe, TreePine, Wind } from "lucide-react";

export default function ImpactPage() {
  const { isConnected } = useAccount();
  const { token } = useToken();
  const { totalContributions, userContribution, fundBalance } = useTokenGreenFund();
  const { sentIds, receivedIds } = useTokenGreenPay();

  const userKg = usdcToKgCO2(userContribution);
  const userTrees = kgToTrees(userKg);
  const totalKg = usdcToKgCO2(totalContributions);
  const totalTrees = kgToTrees(totalKg);

  // Impact tiers
  const tier =
    userKg >= 100 ? { label: "Climate Champion 🏆", color: "text-earth-400" }
    : userKg >= 10 ? { label: "Green Pioneer 🌿", color: "text-forest-400" }
    : userKg >= 1  ? { label: "Eco Starter 🌱", color: "text-forest-500" }
    :                { label: "Getting Started 🌍", color: "text-slate-400" };

  return (
    <div className="max-w-3xl mx-auto px-4 py-10">
      <div className="flex items-start justify-between mb-8"><div><h1 className="font-display font-bold text-2xl md:text-3xl text-white">Green Impact</h1><p className="text-slate-400 mt-1 text-sm">{token.symbol} carbon contribution</p></div><TokenSelector /></div>

      {/* Hero card */}
      <div className="card p-8 mb-6 relative overflow-hidden">
        <div className="absolute inset-0 bg-mesh-green opacity-50 pointer-events-none" />
        <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
          <div>
            <div className="badge-green mb-3">
              <Leaf className="w-3.5 h-3.5" /> 0.5% of every transaction
            </div>
            <h2 className="font-display font-extrabold text-4xl text-white mb-1">
              {userKg.toFixed(3)} kg
            </h2>
            <p className="text-slate-400">CO₂ offset by your transactions</p>
            <p className={`font-display font-semibold mt-2 ${tier.color}`}>{tier.label}</p>
          </div>
          <div className="text-center sm:text-right">
            <div className="font-display font-bold text-6xl text-forest-400">
              {userTrees.toFixed(1)}
            </div>
            <div className="text-slate-400 text-sm">tree-years equivalent</div>
          </div>
        </div>
      </div>

      {/* Personal stats */}
      <h3 className="font-display font-semibold text-white mb-3">Your Impact</h3>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-8">
        <StatCard
          label="USDC Contributed"
          value={`$${formatUSDC(userContribution)}`}
          icon={<Leaf className="w-4 h-4" />}
          accent="green"
        />
        <StatCard
          label="CO₂ Offset"
          value={`${userKg.toFixed(3)} kg`}
          sub="carbon dioxide equivalent"
          icon={<Wind className="w-4 h-4" />}
          accent="green"
        />
        <StatCard
          label="Tree Equivalent"
          value={`${userTrees.toFixed(2)}`}
          sub="trees absorbing CO₂/year"
          icon={<TreePine className="w-4 h-4" />}
          accent="green"
        />
        <StatCard
          label="Payments Made"
          value={sentIds.length.toString()}
          icon={<TrendingUp className="w-4 h-4" />}
        />
        <StatCard
          label="Payments Received"
          value={receivedIds.length.toString()}
          icon={<TrendingUp className="w-4 h-4" />}
        />
      </div>

      {/* Protocol stats */}
      <h3 className="font-display font-semibold text-white mb-3">Protocol Impact</h3>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <StatCard
          label="Total Fund"
          value={`$${formatUSDC(totalContributions)}`}
          sub="all-time contributions"
          icon={<Globe className="w-4 h-4" />}
          accent="green"
        />
        <StatCard
          label="Fund Balance"
          value={`$${formatUSDC(fundBalance)}`}
          sub="pending distribution"
          icon={<Droplets className="w-4 h-4" />}
          accent="earth"
        />
        <StatCard
          label="Protocol CO₂"
          value={`${totalKg.toFixed(2)} kg`}
          icon={<Wind className="w-4 h-4" />}
          accent="green"
        />
        <StatCard
          label="Protocol Trees"
          value={totalTrees.toFixed(1)}
          sub="tree-years equivalent"
          icon={<TreePine className="w-4 h-4" />}
          accent="green"
        />
      </div>

      {/* How it works */}
      <div className="card p-6">
        <h3 className="font-display font-semibold text-white mb-4">How GreenFund Works</h3>
        <div className="flex flex-col gap-4">
          {[
            {
              step: "1",
              title: "Automatic 0.5% Fee",
              desc: "Every USDC transaction through GreenPay deducts 0.5% as a green fee — baked into the protocol, no opt-out.",
            },
            {
              step: "2",
              title: "On-chain Pool",
              desc: "Fees accumulate in the GreenFund smart contract, fully transparent and auditable on the Arc Testnet.",
            },
            {
              step: "3",
              title: "Carbon Projects",
              desc: "The fund owner (DAO / multisig) distributes USDC to verified carbon offset projects like Gold Standard or Verra.",
            },
            {
              step: "4",
              title: "Your Impact Score",
              desc: "Your cumulative contribution is tracked on-chain. Every address has a permanent, verifiable green footprint.",
            },
          ].map(({ step, title, desc }) => (
            <div key={step} className="flex gap-4">
              <div className="w-7 h-7 rounded-full bg-forest-600/20 border border-forest-500/30 flex items-center justify-center text-forest-400 font-display font-bold text-xs shrink-0 mt-0.5">
                {step}
              </div>
              <div>
                <div className="font-display font-semibold text-white text-sm">{title}</div>
                <p className="text-slate-400 text-sm mt-0.5 leading-relaxed">{desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
