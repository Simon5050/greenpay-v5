# 🌱 GreenPay — Sustainable P2P Payments & Invoicing

A decentralised payment protocol on **Arc Testnet** where every USDC transaction
automatically splits a **0.25% total fee**:
- **0.12%** → Platform treasury
- **0.13%** → GreenFund carbon offset pool

---

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    Next.js Frontend                     │
│   wagmi v2 · viem · RainbowKit · Tailwind CSS           │
└──────────────┬──────────────────────────────────────────┘
               │
     ┌─────────▼──────────┐   ┌────────────────────┐
     │     GreenPay.sol   │   │ InvoiceManager.sol │
     │  P2P send/request  │   │  Create/Pay/Dispute│
     └─────────┬──────────┘   └────────┬───────────┘
               │  0.25% fee split      │  0.25% fee split
               └──────────┬────────────┘
                    ┌──────┴──────┐
                    ▼             ▼
             ┌────────────┐  ┌──────────────┐
             │ GreenFund  │  │  Treasury    │
             │ 0.13% CO₂  │  │  0.12% fees  │
             └────────────┘  └──────────────┘
                    │
             ┌──────▼──────┐
             │  Arc Testnet│
             │    USDC     │
             │  (real)     │
             └─────────────┘
```

---

## Fee Split

| Recipient | Rate | Purpose |
|-----------|------|---------|
| Recipient / Invoice Issuer | 99.75% | Net payment |
| Platform Treasury | 0.12% | Protocol revenue |
| GreenFund | 0.13% | Carbon offset pool |
| **Total fee** | **0.25%** | |

---

## Prerequisites

| Tool | Version | Install |
|------|---------|---------|
| Foundry | latest | `curl -L https://foundry.paradigm.xyz \| bash && foundryup` |
| Node.js | ≥ 18 | https://nodejs.org |

---

## 1 · Contract Setup (Foundry)

```bash
git clone https://github.com/yourrepo/greenpay
cd greenpay

# Install OpenZeppelin
forge install OpenZeppelin/openzeppelin-contracts --no-commit

# Build
forge build

# Run all tests
forge test -vv

# Gas report
forge test -vv --gas-report
```

---

## 2 · Deploy to Arc Testnet

### 2a — Environment setup

```bash
cp .env.example .env
```

Fill in your `.env`:

```env
PRIVATE_KEY=0xyour_deployer_key

# Arc Testnet
ARC_RPC_URL=https://rpc.testnet.arc.network
ARC_CHAIN_ID=5042002

# Real USDC on Arc Testnet (check Arc docs/explorer for address)
ARC_USDC_ADDRESS=0x3600000000000000000000000000000000000000

# Your treasury wallet (receives 0.12% platform fee)
# Use a multisig in production — defaults to deployer if not set
TREASURY_ADDRESS=0x...
```

> ⚠️ GreenPay uses the **real Arc Testnet USDC** — MockUSDC is only
> used in local Forge tests. Find the official Arc Testnet USDC address
> in the Arc documentation or block explorer before deploying.

### 2b — Dry run (no broadcast)

```bash
forge script script/Deploy.s.sol:Deploy \
  --rpc-url https://rpc.testnet.arc.network \
  -vvvv
```

### 2c — Live deploy

```bash
forge script script/Deploy.s.sol:Deploy \
  --rpc-url https://rpc.testnet.arc.network \
  --broadcast \
  --verify \
  --verifier-url https://testnet.arcscan.app/api \
  -vvvv
```

The script prints a `.env.local` block at the end — copy it into `frontend/.env.local`.

### 2d — Or use Make

```bash
make deploy-arc
```

---

## 3 · Run the Frontend Locally

```bash
cd frontend
npm install

# Copy env template and fill in contract addresses
cp .env.local.example .env.local

# Start dev server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

---

## 4 · How to Get USDC on Arc Testnet

Since GreenPay uses the **real Arc Testnet USDC** (not a mock), you need
to obtain test USDC from the Arc Testnet faucet or bridge:

**Option A — Arc Testnet Faucet**
- Visit https://testnet.arcscan.app for the faucet link
- USDC contract: `0x3600000000000000000000000000000000000000`
- Request test USDC to your wallet address

**Option B — Arc Bridge**
- Use the Arc bridge to bring USDC from another testnet

**Option C — Cast (if you control the USDC contract)**
```bash
cast send $ARC_USDC_ADDRESS \
  "transfer(address,uint256)" \
  <YOUR_ADDRESS> 10000000000 \
  --rpc-url $ARC_RPC_URL \
  --private-key $PRIVATE_KEY
```

---

## 5 · Project Structure

```
greenpay/
├── contracts/
│   ├── GreenFund.sol       # Carbon offset pool (0.13% fee)
│   ├── GreenPay.sol        # P2P payments & requests (0.25% split)
│   └── InvoiceManager.sol  # Invoice lifecycle (0.25% split)
├── script/
│   └── Deploy.s.sol        # Deploys 3 contracts using real Arc USDC
├── test/
│   ├── GreenPay.t.sol      # Unit + fuzz tests (~25 tests)
│   ├── InvoiceManager.t.sol# Invoice tests (~20 tests)
│   └── Integration.t.sol   # End-to-end session test
├── lib/                    # Foundry libs (OpenZeppelin, forge-std)
├── foundry.toml
├── Makefile
├── .env.example
└── frontend/
    ├── src/
    │   ├── app/
    │   │   ├── page.tsx          # Landing page
    │   │   ├── dashboard/        # Stats + quick actions
    │   │   ├── send/             # Send USDC
    │   │   ├── request/          # Request & fulfil payments
    │   │   ├── invoices/         # Create, pay, cancel invoices
    │   │   ├── history/          # Transaction history
    │   │   └── impact/           # Carbon impact dashboard
    │   ├── components/           # Navbar, UI primitives
    │   ├── hooks/                # wagmi hooks
    │   ├── lib/                  # ABIs, wagmi config, utils
    │   └── types/                # TypeScript types
    └── package.json
```

---

## 6 · Makefile Commands

```bash
make install          # Install Foundry libs
make build            # Compile contracts
make test             # Run all tests
make test-gas         # Tests with gas report
make deploy-arc       # Deploy to Arc Testnet (broadcast)
make deploy-arc-dry   # Dry run (no broadcast)
make frontend-dev     # Start Next.js dev server
make frontend-build   # Build for production
make clean            # Remove build artifacts
```

---

## 7 · Security Notes

- **ReentrancyGuard** on all fund-transferring functions
- **SafeERC20** throughout — protects against non-standard tokens
- **Custom errors** — cheaper than revert strings
- **Access control** — only authorized depositors can call `GreenFund.depositFee()`
- **Immutable addresses** — USDC, GreenFund addresses set at deploy, never change
- **Updatable treasury** — owner can update treasury address via `setTreasury()`
- No proxy/upgrade patterns — contracts are immutable after deployment

---

## 8 · Future Roadmap

| Phase | Timeline | Features |
|-------|----------|---------|
| Phase 1 | Q2 2026 | Core protocol — deploy & launch ✅ |
| Phase 2 | Q3 2026 | Transak off-ramp + Circle SDK |
| Phase 3 | Q4 2026 | Yellow Card, Chimoney, airtime/data (Reloadly) |
| Phase 4 | Q1 2027 | SafeTrade escrow with arbiter |

---

## License

MIT
