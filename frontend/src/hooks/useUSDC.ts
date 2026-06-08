"use client";
import {
  useAccount,
  useReadContract,
  useWriteContract,
  useWaitForTransactionReceipt,
} from "wagmi";
import { CONTRACTS, USDC_ABI } from "@/lib/contracts";
import { MAX_UINT256 } from "@/lib/utils";

/// @notice Hook for interacting with the Arc Testnet USDC contract.
///         Uses standard ERC-20 ABI — no faucet (real USDC on Arc Testnet).
export function useUSDC() {
  const { address } = useAccount();

  const { data: balance, refetch: refetchBalance } = useReadContract({
    address: CONTRACTS.USDC,
    abi: USDC_ABI,
    functionName: "balanceOf",
    args: [address!],
    query: { enabled: !!address },
  });

  const {
    writeContract,
    writeContractAsync,
    data: lastTxHash,
    isPending: isWritePending,
  } = useWriteContract();

  const { isLoading: isTxConfirming, isSuccess: isTxSuccess } =
    useWaitForTransactionReceipt({ hash: lastTxHash });

  function approve(spender: `0x${string}`, amount?: bigint) {
    writeContract({
      address: CONTRACTS.USDC,
      abi: USDC_ABI,
      functionName: "approve",
      args: [spender, amount ?? MAX_UINT256],
    });
  }

  async function approveAsync(spender: `0x${string}`, amount?: bigint) {
    return writeContractAsync({
      address: CONTRACTS.USDC,
      abi: USDC_ABI,
      functionName: "approve",
      args: [spender, amount ?? MAX_UINT256],
    });
  }

  return {
    balance: balance ?? 0n,
    refetchBalance,
    approve,
    approveAsync,
    isWritePending,
    isTxConfirming,
    isTxSuccess,
    lastTxHash,
  };
}

// ── Standalone allowance hook ────────────────────────────────────────────────
export function useAllowance(spender: `0x${string}`) {
  const { address } = useAccount();
  return useReadContract({
    address: CONTRACTS.USDC,
    abi: USDC_ABI,
    functionName: "allowance",
    args: [address!, spender],
    query: { enabled: !!address },
  });
}
