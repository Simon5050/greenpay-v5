// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Script.sol";
import "forge-std/console.sol";
import "../contracts/GreenFund.sol";
import "../contracts/GreenPay.sol";
import "../contracts/InvoiceManager.sol";

/// @notice Foundry deployment script for GreenPay protocol
/// @dev Uses real Arc Testnet USDC + EURC
contract Deploy is Script {
    function run() external {
        uint256 deployerKey = vm.envUint("PRIVATE_KEY");
        address deployer    = vm.addr(deployerKey);

        // Arc Testnet USDC — 6 decimals
        address usdcAddress = vm.envOr(
            "ARC_USDC_ADDRESS",
            address(0x3600000000000000000000000000000000000000)
        );

        // Treasury — defaults to deployer if not set
        address treasury = vm.envOr("TREASURY_ADDRESS", deployer);

        require(usdcAddress != address(0), "ARC_USDC_ADDRESS not set");

        console.log("=====================================================");
        console.log("  GreenPay - EURC Stack - Arc Testnet Deployment");
        console.log("=====================================================");
        console.log("Network    : Arc Testnet (chain %s)", block.chainid);
        console.log("Deployer   :", deployer);
        console.log("USDC       :", usdcAddress);
        console.log("Treasury   :", treasury);
        console.log("Fee split  : 0.12%% platform  +  0.13%% GreenFund");
        console.log("-----------------------------------------------------");

        vm.startBroadcast(deployerKey);

        // 1. GreenFund — carbon offset pool
        GreenFund greenFund = new GreenFund(usdcAddress, deployer);
        console.log("GreenFund      :", address(greenFund));

        // 2. GreenPay — P2P payments & requests
        GreenPay greenPay = new GreenPay(
            usdcAddress,
            address(greenFund),
            treasury,
            deployer
        );
        console.log("GreenPay       :", address(greenPay));

        // 3. InvoiceManager — invoice lifecycle
        InvoiceManager invoiceManager = new InvoiceManager(
            usdcAddress,
            address(greenFund),
            treasury,
            deployer
        );
        console.log("InvoiceManager :", address(invoiceManager));

        // 4. Authorize depositors
        greenFund.setDepositor(address(greenPay), true);
        greenFund.setDepositor(address(invoiceManager), true);

        vm.stopBroadcast();

        console.log("-----------------------------------------------------");
        console.log("Depositors authorized on GreenFund");
        console.log("=====================================================");
        console.log("");
        console.log("# ---- Copy to frontend/.env.local ----");
        console.log("NEXT_PUBLIC_CHAIN_ID=5042002");
        console.log("NEXT_PUBLIC_ARC_RPC_URL=https://rpc.testnet.arc.network");
        console.log("NEXT_PUBLIC_EXPLORER_URL=https://testnet.arcscan.app");
        console.log("NEXT_PUBLIC_USDC_ADDRESS=0x3600000000000000000000000000000000000000");
        console.log("NEXT_PUBLIC_EURC_ADDRESS=0x89B50855Aa3bE2F677cD6303Cec089B5F319D72a");
        console.log("NEXT_PUBLIC_GREEN_FUND_ADDRESS=%s",       address(greenFund));
        console.log("NEXT_PUBLIC_GREEN_PAY_ADDRESS=%s",        address(greenPay));
        console.log("NEXT_PUBLIC_INVOICE_MANAGER_ADDRESS=%s",  address(invoiceManager));
        console.log("NEXT_PUBLIC_TREASURY_ADDRESS=%s",         treasury);
        console.log("# --------------------------------------");
    }
}