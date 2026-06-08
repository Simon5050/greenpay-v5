// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Test.sol";
import "../contracts/MockUSDC.sol";
import "../contracts/GreenFund.sol";
import "../contracts/GreenPay.sol";
import "../contracts/InvoiceManager.sol";

/// @notice End-to-end integration test simulating a full protocol usage session.
///         Uses MockUSDC locally — production deploy uses real Arc Testnet USDC.
contract IntegrationTest is Test {
    MockUSDC       usdc;
    GreenFund      greenFund;
    GreenPay       greenPay;
    InvoiceManager invoiceManager;

    address owner    = address(this);
    address treasury = makeAddr("treasury");
    address alice    = makeAddr("alice");
    address bob      = makeAddr("bob");
    address carol    = makeAddr("carol");

    uint256 constant USDC_DEC     = 1e6;
    uint256 constant PLATFORM_BPS = 12;
    uint256 constant GREEN_BPS    = 13;
    uint256 constant BPS_DENOM    = 10_000;

    function setUp() public {
        usdc           = new MockUSDC(owner);
        greenFund      = new GreenFund(address(usdc), owner);
        greenPay       = new GreenPay(address(usdc), address(greenFund), treasury, owner);
        invoiceManager = new InvoiceManager(address(usdc), address(greenFund), treasury, owner);

        greenFund.setDepositor(address(greenPay), true);
        greenFund.setDepositor(address(invoiceManager), true);

        vm.prank(alice); usdc.faucet();
        vm.prank(bob);   usdc.faucet();
        vm.prank(carol); usdc.faucet();
    }

    // ── Fee helpers ───────────────────────────────────────────────────────────
    function _pf(uint256 g)  internal pure returns (uint256) { return (g * PLATFORM_BPS) / BPS_DENOM; }
    function _gf(uint256 g)  internal pure returns (uint256) { return (g * GREEN_BPS)    / BPS_DENOM; }
    function _net(uint256 g) internal pure returns (uint256) { return g - _pf(g) - _gf(g); }

    /// @notice Full session: send → invoice → request → withdraw
    function test_full_protocol_session() public {
        // ── 1. Alice sends 100 USDC to Bob ───────────────────────────────────
        uint256 send1 = 100 * USDC_DEC;

        vm.startPrank(alice);
        usdc.approve(address(greenPay), send1);
        greenPay.send(bob, send1, "Project payment");
        vm.stopPrank();

        assertEq(usdc.balanceOf(bob),      1000 * USDC_DEC + _net(send1));
        assertEq(usdc.balanceOf(treasury), _pf(send1));
        assertEq(greenFund.totalContributions(), _gf(send1));

        // ── 2. Bob creates invoice for Carol (2 line items) ──────────────────
        InvoiceManager.LineItem[] memory items = new InvoiceManager.LineItem[](2);
        items[0] = InvoiceManager.LineItem("Consulting", 200, 100 * USDC_DEC); // 2×$100
        items[1] = InvoiceManager.LineItem("Expenses",   100, 50  * USDC_DEC); // 1×$50
        // total = 250 USDC

        vm.prank(bob);
        uint256 invId = invoiceManager.createInvoice(carol, items, "Bob Invoice", "", 0);

        // ── 3. Carol pays the invoice ─────────────────────────────────────────
        uint256 invTotal = 250 * USDC_DEC;

        vm.startPrank(carol);
        usdc.approve(address(invoiceManager), invTotal);
        invoiceManager.payInvoice(invId);
        vm.stopPrank();

        assertEq(usdc.balanceOf(treasury), _pf(send1) + _pf(invTotal));
        assertEq(greenFund.userContributions(carol), _gf(invTotal));

        // ── 4. Carol requests 30 USDC from Alice ──────────────────────────────
        uint256 reqAmount = 30 * USDC_DEC;
        vm.prank(carol);
        uint256 reqId = greenPay.requestPayment(alice, reqAmount, "Reimbursement");

        // ── 5. Alice fulfils request ──────────────────────────────────────────
        vm.startPrank(alice);
        usdc.approve(address(greenPay), reqAmount);
        greenPay.fulfillRequest(reqId);
        vm.stopPrank();

        // Verify request status = Fulfilled
        (, , , , , uint8 reqStatus, , ) = greenPay.requests(reqId);
        assertEq(reqStatus, 1);

        // ── 6. Assert cumulative GreenFund balance ────────────────────────────
        uint256 totalGreen = _gf(send1) + _gf(invTotal) + _gf(reqAmount);
        assertEq(greenFund.totalContributions(),              totalGreen);
        assertEq(usdc.balanceOf(address(greenFund)),          totalGreen);

        // ── 7. Assert cumulative treasury balance ─────────────────────────────
        uint256 totalPlatform = _pf(send1) + _pf(invTotal) + _pf(reqAmount);
        assertEq(usdc.balanceOf(treasury), totalPlatform);

        // ── 8. Owner withdraws GreenFund to carbon project ───────────────────
        address carbonProject = makeAddr("carbonProject");
        greenFund.withdraw(carbonProject, totalGreen, "Gold Standard Kenya Q4 2026");

        assertEq(usdc.balanceOf(carbonProject),      totalGreen);
        assertEq(usdc.balanceOf(address(greenFund)), 0);
        assertEq(greenFund.totalWithdrawn(),         totalGreen);

        // totalContributions still reflects all-time (not reduced by withdrawal)
        assertEq(greenFund.totalContributions(), totalGreen);

        console.log("=== Integration Session Complete ===");
        console.log("Payments sent:      1");
        console.log("Invoices paid:      1");
        console.log("Requests fulfilled: 1");
        console.log("Platform fee total:", totalPlatform);
        console.log("GreenFund total:   ", totalGreen);
        console.log("Carbon project:    ", carbonProject);
    }

    /// @notice Verify treasury address is updatable by owner
    function test_treasury_update() public {
        address newTreasury = makeAddr("newTreasury");

        greenPay.setTreasury(newTreasury);
        assertEq(greenPay.treasury(), newTreasury);

        invoiceManager.setTreasury(newTreasury);
        assertEq(invoiceManager.treasury(), newTreasury);
    }

    /// @notice Non-owner cannot update treasury
    function test_only_owner_can_update_treasury() public {
        vm.prank(alice);
        vm.expectRevert();
        greenPay.setTreasury(alice);
    }
}
