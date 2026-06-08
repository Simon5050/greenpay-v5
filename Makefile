# ── GreenPay Makefile ─────────────────────────────────────────────────────────
-include .env

.PHONY: install build test test-gas test-fuzz deploy-local deploy-arc \
        deploy-arc-dry verify anvil frontend-install frontend-dev \
        frontend-build frontend-typecheck clean setup

# ── Contract targets ──────────────────────────────────────────────────────────

## Install Foundry dependencies
install:
	forge install OpenZeppelin/openzeppelin-contracts --no-commit
	forge install foundry-rs/forge-std --no-commit

## Compile contracts
build:
	forge build

## Run all tests
test:
	forge test -vv

## Run tests with gas report
test-gas:
	forge test -vv --gas-report

## Run fuzz tests with more runs
test-fuzz:
	forge test -vv --fuzz-runs 1000

## Deploy to local anvil node
deploy-local:
	forge script script/Deploy.s.sol:Deploy \
		--rpc-url http://127.0.0.1:8545 \
		--broadcast \
		-vvvv

## Dry-run on Arc Testnet (no broadcast)
deploy-arc-dry:
	forge script script/Deploy.s.sol:Deploy \
		--rpc-url $(ARC_RPC_URL) \
		-vvvv

## Deploy and broadcast on Arc Testnet
deploy-arc:
	forge script script/Deploy.s.sol:Deploy \
		--rpc-url $(ARC_RPC_URL) \
		--broadcast \
		--verify \
		--verifier-url $(EXPLORER_API_URL) \
		--etherscan-api-key $(EXPLORER_API_KEY) \
		-vvvv

## Verify a contract (usage: make verify CONTRACT=GreenPay ADDR=0x...)
verify:
	forge verify-contract $(ADDR) contracts/$(CONTRACT).sol:$(CONTRACT) \
		--verifier-url $(EXPLORER_API_URL) \
		--etherscan-api-key $(EXPLORER_API_KEY) \
		--chain-id $(ARC_CHAIN_ID)

## Start local anvil node
anvil:
	anvil --chain-id 31337 --block-time 2

## Check Arc Testnet connectivity
check-rpc:
	cast chain-id --rpc-url $(ARC_RPC_URL)
	cast block-number --rpc-url $(ARC_RPC_URL)

## Check deployer balance on Arc Testnet
check-balance:
	cast balance $(shell cast wallet address --private-key $(PRIVATE_KEY)) \
		--rpc-url $(ARC_RPC_URL)

## Check USDC balance of deployer
check-usdc:
	cast call $(ARC_USDC_ADDRESS) "balanceOf(address)(uint256)" \
		$(shell cast wallet address --private-key $(PRIVATE_KEY)) \
		--rpc-url $(ARC_RPC_URL)

# ── Frontend targets ──────────────────────────────────────────────────────────

frontend-install:
	cd frontend && npm install

frontend-dev:
	cd frontend && npm run dev

frontend-build:
	cd frontend && npm run build

frontend-typecheck:
	cd frontend && npm run type-check

# ── Housekeeping ──────────────────────────────────────────────────────────────

clean:
	forge clean
	rm -rf frontend/.next

setup: install build frontend-install
	@echo "✅ Setup complete."

## Deploy EURC stack (dry run)
deploy-eurc-dry:
	forge script script/DeployEURC.s.sol:DeployEURC \
		--rpc-url $(ARC_RPC_URL) \
		-vvvv

## Deploy EURC stack (live broadcast)
deploy-eurc:
	forge script script/DeployEURC.s.sol:DeployEURC \
		--rpc-url $(ARC_RPC_URL) \
		--broadcast \
		--verify \
		--verifier-url $(EXPLORER_API_URL) \
		--etherscan-api-key $(EXPLORER_API_KEY) \
		-vvvv

## Check EURC balance of deployer
check-eurc:
	cast call $(ARC_EURC_ADDRESS) "balanceOf(address)(uint256)" \
		$(shell cast wallet address --private-key $(PRIVATE_KEY)) \
		--rpc-url $(ARC_RPC_URL)
