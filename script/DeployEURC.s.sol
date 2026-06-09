// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Script.sol";
import "forge-std/console.sol";
import "../contracts/GreenFund.sol";
import "../contracts/GreenPay.sol";
import "../contracts/InvoiceManager.sol";

/// @notice Deploys a parallel GreenPay stack for Arc Testnet EURC.
///         Existing USDC contracts are completely untouched.
///
///   Required .env:
///     PRIVATE_KEY           — deployer private key
///     ARC_EURC_ADDRESS      — 0x89B50855Aa3bE2F677cD6303Cec089B5F319D72a
///     TREASURY_ADDRESS      — platform fee recipient
///
///   Run:
///     forge script script/DeployEURC.s.sol:DeployEURC \
///       --rpc-url https://rpc.testnet.arc.network \
///       --broadcast \
///       --verify \
///       --verifier-url https://testnet.arcscan.app/api \
///       -vvvv
contract DeployEURC is Script {
    function run() external {
        uint256 deployerKey = vm.envUint("PRIVATE_KEY");
        address deployer    = vm.addr(deployerKey);

        // Arc Testnet EURC — 6 decimals
        address eurcAddress = vm.envOr(
            "ARC_EURC_ADDRESS",
            address(0x89B50855Aa3bE2F677cD6303Cec089B5F319D72a)
        );

        address treasury = vm.envOr("TREASURY_ADDRESS", deployer);

        require(eurcAddress != address(0), "ARC_EURC_ADDRESS not set");

        console.log("=====================================================");
        console.log("  GreenPay — EURC Stack — Arc Testnet Deployment");
        console.log("=====================================================");
        console.log("Network    : Arc Testnet (chain %s)", block.chainid);
        console.log("Deployer   :", deployer);
        console.log("EURC       :", eurcAddress);
        console.log("Treasury   :", treasury);
        console.log("Fee split  : 0.12%% platform  +  0.13%% GreenFund");
        console.log("NOTE       : Existing USDC contracts untouched");
        console.log("-----------------------------------------------------");

        vm.startBroadcast(deployerKey);

        // 1. GreenFund (EURC)
        GreenFund greenFundEURC = new GreenFund(eurcAddress, deployer);
        console.log("GreenFund_EURC      :", address(greenFundEURC));

        // 2. GreenPay (EURC)
        GreenPay greenPayEURC = new GreenPay(
            eurcAddress,
            address(greenFundEURC),
            treasury,
            deployer
        );
        console.log("GreenPay_EURC       :", address(greenPayEURC));

        // 3. InvoiceManager (EURC)
        InvoiceManager invoiceManagerEURC = new InvoiceManager(
            eurcAddress,
            address(greenFundEURC),
            treasury,
            deployer
        );
        console.log("InvoiceManager_EURC :", address(invoiceManagerEURC));

        // 4. Authorize depositors
        greenFundEURC.setDepositor(address(greenPayEURC), true);
        greenFundEURC.setDepositor(address(invoiceManagerEURC), true);

        vm.stopBroadcast();

        console.log("-----------------------------------------------------");
        console.log("Depositors authorized on GreenFund_EURC");
        console.log("=====================================================");
        console.log("");
        console.log("# ---- Add to frontend/.env.local ----");
        console.log("NEXT_PUBLIC_EURC_ADDRESS=0x89B50855Aa3bE2F677cD6303Cec089B5F319D72a");
        console.log("NEXT_PUBLIC_EURC_GREEN_FUND_ADDRESS=%s",      address(greenFundEURC));
        console.log("NEXT_PUBLIC_EURC_GREEN_PAY_ADDRESS=%s",       address(greenPayEURC));
        console.log("NEXT_PUBLIC_EURC_INVOICE_MANAGER_ADDRESS=%s", address(invoiceManagerEURC));
        console.log("# ------------------------------------");
    }
}
