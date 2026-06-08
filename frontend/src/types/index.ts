export interface Payment {
  id: bigint;
  sender: `0x${string}`;
  recipient: `0x${string}`;
  grossAmount: bigint;
  netAmount: bigint;
  greenFee: bigint;
  note: string;
  timestamp: bigint;
}

export interface PaymentRequest {
  id: bigint;
  requester: `0x${string}`;
  payer: `0x${string}`;
  amount: bigint;
  note: string;
  status: number; // 0=Pending, 1=Fulfilled, 2=Cancelled
  createdAt: bigint;
  fulfilledAt: bigint;
}

export interface LineItem {
  description: string;
  quantity: bigint;   // scaled ×100 (e.g. 100 = 1.00 units)
  unitPrice: bigint;  // USDC 6-decimals
}

export interface Invoice {
  id: bigint;
  issuer: `0x${string}`;
  client: `0x${string}`;
  totalAmount: bigint;
  greenFee: bigint;
  netAmount: bigint;
  title: string;
  description: string;
  dueDate: bigint;
  status: number; // 0-5
  createdAt: bigint;
  paidAt: bigint;
  paidBy: `0x${string}`;
}

export type TxStatus = "idle" | "approving" | "pending" | "success" | "error";
