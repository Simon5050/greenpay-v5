// Contract addresses — populated from .env.local after deployment
export const CONTRACTS = {
  USDC:            process.env.NEXT_PUBLIC_USDC_ADDRESS           as `0x${string}`,
  GreenFund:       process.env.NEXT_PUBLIC_GREEN_FUND_ADDRESS      as `0x${string}`,
  GreenPay:        process.env.NEXT_PUBLIC_GREEN_PAY_ADDRESS       as `0x${string}`,
  InvoiceManager:  process.env.NEXT_PUBLIC_INVOICE_MANAGER_ADDRESS as `0x${string}`,
  Treasury:        process.env.NEXT_PUBLIC_TREASURY_ADDRESS        as `0x${string}`,
} as const;

// ── Standard ERC-20 ABI (works with real Arc Testnet USDC) ───────────────────
export const USDC_ABI = [
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
  {
    inputs: [],
    name: "decimals",
    outputs: [{ name: "", type: "uint8" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "symbol",
    outputs: [{ name: "", type: "string" }],
    stateMutability: "view",
    type: "function",
  },
] as const;

// ── GreenPay ABI ──────────────────────────────────────────────────────────────
export const GREEN_PAY_ABI = [
  // ── Write ─────────────────────────────────────────────────────────────────
  {
    inputs: [
      { name: "recipient", type: "address" },
      { name: "amount",    type: "uint256" },
      { name: "note",      type: "string"  },
    ],
    name: "send",
    outputs: [{ name: "paymentId", type: "uint256" }],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      { name: "payer",  type: "address" },
      { name: "amount", type: "uint256" },
      { name: "note",   type: "string"  },
    ],
    name: "requestPayment",
    outputs: [{ name: "requestId", type: "uint256" }],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [{ name: "requestId", type: "uint256" }],
    name: "fulfillRequest",
    outputs: [{ name: "paymentId", type: "uint256" }],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [{ name: "requestId", type: "uint256" }],
    name: "cancelRequest",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  // ── Read: individual records ───────────────────────────────────────────────
  {
    inputs: [{ name: "", type: "uint256" }],
    name: "payments",
    outputs: [
      { name: "id",          type: "uint256"  },
      { name: "sender",      type: "address"  },
      { name: "recipient",   type: "address"  },
      { name: "grossAmount", type: "uint256"  },
      { name: "netAmount",   type: "uint256"  },
      { name: "platformFee", type: "uint256"  }, // 0.12% → treasury
      { name: "greenFee",    type: "uint256"  }, // 0.13% → GreenFund
      { name: "note",        type: "string"   },
      { name: "timestamp",   type: "uint256"  },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ name: "", type: "uint256" }],
    name: "requests",
    outputs: [
      { name: "id",          type: "uint256"  },
      { name: "requester",   type: "address"  },
      { name: "payer",       type: "address"  },
      { name: "amount",      type: "uint256"  },
      { name: "note",        type: "string"   },
      // RequestStatus enum: 0 = Pending, 1 = Fulfilled, 2 = Cancelled
      { name: "requestStatus", type: "uint8"  },
      { name: "createdAt",   type: "uint256"  },
      { name: "fulfilledAt", type: "uint256"  },
    ],
    stateMutability: "view",
    type: "function",
  },
  // ── Read: index lists ──────────────────────────────────────────────────────
  {
    inputs: [{ name: "user", type: "address" }],
    name: "getSentPayments",
    outputs: [{ name: "", type: "uint256[]" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ name: "user", type: "address" }],
    name: "getReceivedPayments",
    outputs: [{ name: "", type: "uint256[]" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ name: "user", type: "address" }],
    name: "getMyRequests",
    outputs: [{ name: "", type: "uint256[]" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ name: "user", type: "address" }],
    name: "getRequestsToMe",
    outputs: [{ name: "", type: "uint256[]" }],
    stateMutability: "view",
    type: "function",
  },
  // ── Read: fee preview ──────────────────────────────────────────────────────
  {
    inputs: [{ name: "gross", type: "uint256" }],
    name: "previewSplit",
    outputs: [
      { name: "net",         type: "uint256" },
      { name: "platformFee", type: "uint256" },
      { name: "greenFee",    type: "uint256" },
    ],
    stateMutability: "pure",
    type: "function",
  },
  // ── Read: fee constants ────────────────────────────────────────────────────
  {
    inputs: [],
    name: "PLATFORM_FEE_BPS",
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "GREEN_FEE_BPS",
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "TOTAL_FEE_BPS",
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
] as const;

// ── InvoiceManager ABI ────────────────────────────────────────────────────────
export const INVOICE_MANAGER_ABI = [
  // ── Write ─────────────────────────────────────────────────────────────────
  {
    inputs: [
      { name: "client", type: "address" },
      {
        name: "items",
        type: "tuple[]",
        components: [
          { name: "description", type: "string"  },
          { name: "quantity",    type: "uint256" },
          { name: "unitPrice",   type: "uint256" },
        ],
      },
      { name: "title",       type: "string"  },
      { name: "description", type: "string"  },
      { name: "dueDate",     type: "uint256" },
    ],
    name: "createInvoice",
    outputs: [{ name: "invoiceId", type: "uint256" }],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [{ name: "invoiceId", type: "uint256" }],
    name: "payInvoice",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [{ name: "invoiceId", type: "uint256" }],
    name: "cancelInvoice",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      { name: "invoiceId", type: "uint256" },
      { name: "reason",    type: "string"  },
    ],
    name: "disputeInvoice",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  // ── Read: individual records ───────────────────────────────────────────────
  {
    inputs: [{ name: "", type: "uint256" }],
    name: "invoices",
    outputs: [
      { name: "id",          type: "uint256"  },
      { name: "issuer",      type: "address"  },
      { name: "client",      type: "address"  },
      { name: "totalAmount", type: "uint256"  },
      { name: "platformFee", type: "uint256"  }, // 0.12% → treasury
      { name: "greenFee",    type: "uint256"  }, // 0.13% → GreenFund
      { name: "netAmount",   type: "uint256"  },
      { name: "title",       type: "string"   },
      { name: "description", type: "string"   },
      { name: "dueDate",     type: "uint256"  },
      // InvoiceStatus: 0=Draft 1=Issued 2=Paid 3=Cancelled 4=Disputed 5=Resolved
      { name: "status",      type: "uint8"    },
      { name: "createdAt",   type: "uint256"  },
      { name: "paidAt",      type: "uint256"  },
      { name: "paidBy",      type: "address"  },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ name: "invoiceId", type: "uint256" }],
    name: "getLineItems",
    outputs: [
      {
        name: "",
        type: "tuple[]",
        components: [
          { name: "description", type: "string"  },
          { name: "quantity",    type: "uint256" },
          { name: "unitPrice",   type: "uint256" },
        ],
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  // ── Read: index lists ──────────────────────────────────────────────────────
  {
    inputs: [{ name: "user", type: "address" }],
    name: "getIssuedInvoices",
    outputs: [{ name: "", type: "uint256[]" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ name: "user", type: "address" }],
    name: "getReceivedInvoices",
    outputs: [{ name: "", type: "uint256[]" }],
    stateMutability: "view",
    type: "function",
  },
  // ── Read: fee preview ──────────────────────────────────────────────────────
  {
    inputs: [{ name: "amount", type: "uint256" }],
    name: "previewFee",
    outputs: [
      { name: "net",         type: "uint256" },
      { name: "platformFee", type: "uint256" },
      { name: "greenFee",    type: "uint256" },
    ],
    stateMutability: "pure",
    type: "function",
  },
] as const;

// ── GreenFund ABI ─────────────────────────────────────────────────────────────
export const GREEN_FUND_ABI = [
  {
    inputs: [],
    name: "totalContributions",
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ name: "user", type: "address" }],
    name: "contributionOf",
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "balance",
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
] as const;
