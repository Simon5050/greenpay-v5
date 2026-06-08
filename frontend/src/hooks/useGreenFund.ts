"use client";
import { useAccount, useReadContract } from "wagmi";
import { CONTRACTS, GREEN_FUND_ABI } from "@/lib/contracts";

export function useGreenFund() {
  const { address } = useAccount();

  const { data: totalContributions } = useReadContract({
    address: CONTRACTS.GreenFund,
    abi: GREEN_FUND_ABI,
    functionName: "totalContributions",
  });

  const { data: userContribution } = useReadContract({
    address: CONTRACTS.GreenFund,
    abi: GREEN_FUND_ABI,
    functionName: "contributionOf",
    args: [address!],
    query: { enabled: !!address },
  });

  const { data: fundBalance } = useReadContract({
    address: CONTRACTS.GreenFund,
    abi: GREEN_FUND_ABI,
    functionName: "balance",
  });

  return {
    totalContributions: totalContributions ?? 0n,
    userContribution: userContribution ?? 0n,
    fundBalance: fundBalance ?? 0n,
  };
}
