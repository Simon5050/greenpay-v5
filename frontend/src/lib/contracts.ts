// src/lib/contracts.ts
// Arc Testnet - Shared contracts for USDC & EURC

import GreenPayJSON from '../../out/GreenPay.sol/GreenPay.json' with { type: 'json' };
import InvoiceManagerJSON from '../../out/InvoiceManager.sol/InvoiceManager.json' with { type: 'json' };
import GreenFundJSON from '../../out/GreenFund.sol/GreenFund.json' with { type: 'json' };

export const CONTRACTS = {
  GreenPay:        process.env.NEXT_PUBLIC_GREEN_PAY_ADDRESS        as `0x${string}`,
  InvoiceManager:  process.env.NEXT_PUBLIC_INVOICE_MANAGER_ADDRESS  as `0x${string}`,
  GreenFund:       process.env.NEXT_PUBLIC_GREEN_FUND_ADDRESS       as `0x${string}`,

  USDC: process.env.NEXT_PUBLIC_USDC_ADDRESS as `0x${string}`,
  EURC: "0x89B50855Aa3bE2F677cD6303Cec089B5F319D72a" as `0x${string}`,
} as const;

// ERC-20 ABI for both USDC and EURC
export const ERC20_ABI = [
  {
    inputs: [{ name: "owner", type: "address" }, { name: "spender", type: "address" }],
    name: "allowance",
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ name: "spender", type: "address" }, { name: "amount", type: "uint256" }],
    name: "approve",
    outputs: [{ name: "", type: "bool" }],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [{ name: "account", type: "address" }],
    name: "balanceOf",
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
] as const;

export const USDC_ABI = ERC20_ABI;

// Real ABIs from Foundry
export const GREEN_PAY_ABI = GreenPayJSON.abi;
export const INVOICE_MANAGER_ABI = InvoiceManagerJSON.abi;
export const GREEN_FUND_ABI = GreenFundJSON.abi;