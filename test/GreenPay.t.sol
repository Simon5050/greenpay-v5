// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Test.sol";
import "../contracts/MockUSDC.sol";
import "../contracts/GreenFund.sol";
import "../contracts/GreenPay.sol";
import "../contracts/InvoiceManager.sol";

contract GreenPayTest is Test {
    MockUSDC       usdc;
    GreenFund      greenFund;
    GreenPay       greenPay;
    InvoiceManager invoiceManager;

    address owner    = address(this);
    address treasury = makeAddr("treasury");
    address alice    = makeAddr("alice");
    address bob      = makeAddr("bob");
    address charlie  = makeAddr("charlie");

    uint256 constant USDC_DEC    = 1e6;
    uint256 constant SEND_AMOUNT = 100 * USDC_DEC;

    // Fee constants matching contracts
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

        vm.prank(alice);   usdc.faucet();
        vm.prank(bob);     usdc.faucet();
        vm.prank(charlie); usdc.faucet();
    }

    // ── Helpers ───────────────────────────────────────────────────────────────

    function _platformFee(uint256 gross) internal pure returns (uint256) {
        return (gross * PLATFORM_BPS) / BPS_DENOM;
    }
    function _greenFee(uint256 gross) internal pure returns (uint256) {
        return (gross * GREEN_BPS) / BPS_DENOM;
    }
    function _net(uint256 gross) internal pure returns (uint256) {
        return gross - _platformFee(gross) - _greenFee(gross);
    }

    // ── MockUSDC ──────────────────────────────────────────────────────────────

    function test_faucet_gives_1000_usdc() public view {
        assertEq(usdc.balanceOf(alice), 1000 * USDC_DEC);
    }

    // ── GreenPay: fee split ───────────────────────────────────────────────────

    function test_send_splits_fee_correctly() public {
        uint256 gross       = SEND_AMOUNT;
        uint256 platformFee = _platformFee(gross);
        uint256 greenFee    = _greenFee(gross);
        uint256 net         = _net(gross);

        vm.startPrank(alice);
        usdc.approve(address(greenPay), gross);
        greenPay.send(bob, gross, "lunch money");
        vm.stopPrank();

        assertEq(usdc.balanceOf(bob),                  1000 * USDC_DEC + net);
        assertEq(usdc.balanceOf(treasury),             platformFee);
        assertEq(usdc.balanceOf(address(greenFund)),   greenFee);
        assertEq(greenFund.userContributions(alice),   greenFee);
        assertEq(greenFund.totalContributions(),       greenFee);
    }

    function test_fee_split_sums_to_gross() public {
        uint256 gross       = SEND_AMOUNT;
        uint256 platformFee = _platformFee(gross);
        uint256 greenFee    = _greenFee(gross);
        uint256 net         = _net(gross);

        assertEq(net + platformFee + greenFee, gross);
    }

    function test_preview_split_matches_actual() public {
        uint256 gross = 1000 * USDC_DEC;
        (uint256 net, uint256 pf, uint256 gf) = greenPay.previewSplit(gross);

        assertEq(pf, _platformFee(gross));
        assertEq(gf, _greenFee(gross));
        assertEq(net, _net(gross));
        assertEq(net + pf + gf, gross);
    }

    function test_send_reverts_on_self_transfer() public {
        vm.startPrank(alice);
        usdc.approve(address(greenPay), SEND_AMOUNT);
        vm.expectRevert(GreenPay.SelfTransfer.selector);
        greenPay.send(alice, SEND_AMOUNT, "");
        vm.stopPrank();
    }

    function test_send_reverts_on_zero_amount() public {
        vm.startPrank(alice);
        usdc.approve(address(greenPay), 1);
        vm.expectRevert(GreenPay.ZeroAmount.selector);
        greenPay.send(bob, 0, "");
        vm.stopPrank();
    }

    function test_send_records_payment_history() public {
        vm.startPrank(alice);
        usdc.approve(address(greenPay), SEND_AMOUNT);
        uint256 pid = greenPay.send(bob, SEND_AMOUNT, "test");
        vm.stopPrank();

        assertEq(greenPay.getSentPayments(alice).length, 1);
        assertEq(greenPay.getSentPayments(alice)[0], pid);
        assertEq(greenPay.getReceivedPayments(bob).length, 1);
    }

    function test_fuzz_send_split(uint256 gross) public {
        gross = bound(gross, 1 * USDC_DEC, 100_000 * USDC_DEC);

        vm.prank(owner);
        usdc.mint(alice, gross);

        vm.startPrank(alice);
        usdc.approve(address(greenPay), gross);
        greenPay.send(bob, gross, "fuzz");
        vm.stopPrank();

        assertEq(usdc.balanceOf(treasury),           _platformFee(gross));
        assertEq(usdc.balanceOf(address(greenFund)), _greenFee(gross));
        assertEq(usdc.balanceOf(bob),                1000 * USDC_DEC + _net(gross));
    }

    // ── GreenPay: requests ────────────────────────────────────────────────────

    function test_request_and_fulfill() public {
        vm.prank(alice);
        uint256 reqId = greenPay.requestPayment(bob, 50 * USDC_DEC, "design work");

        vm.startPrank(bob);
        usdc.approve(address(greenPay), 50 * USDC_DEC);
        greenPay.fulfillRequest(reqId);
        vm.stopPrank();

        (, , , , , uint8 status, , ) = greenPay.requests(reqId);
        assertEq(status, 1); // Fulfilled
    }

    function test_cancel_request() public {
        vm.prank(alice);
        uint256 reqId = greenPay.requestPayment(bob, 10 * USDC_DEC, "cancel me");

        vm.prank(alice);
        greenPay.cancelRequest(reqId);

        (, , , , , uint8 status, , ) = greenPay.requests(reqId);
        assertEq(status, 2); // Cancelled
    }

    function test_non_requester_cannot_cancel() public {
        vm.prank(alice);
        uint256 reqId = greenPay.requestPayment(bob, 10 * USDC_DEC, "");

        vm.prank(charlie);
        vm.expectRevert(GreenPay.NotRequester.selector);
        greenPay.cancelRequest(reqId);
    }

    // ── InvoiceManager ────────────────────────────────────────────────────────

    function _makeItems() internal pure returns (InvoiceManager.LineItem[] memory items) {
        items = new InvoiceManager.LineItem[](2);
        items[0] = InvoiceManager.LineItem("Web design", 100, 200 * USDC_DEC);
        items[1] = InvoiceManager.LineItem("Hosting",    200, 10  * USDC_DEC);
        // total = 200 + 20 = 220 USDC
    }

    function test_create_invoice_calculates_total() public {
        InvoiceManager.LineItem[] memory items = _makeItems();

        vm.prank(alice);
        uint256 invId = invoiceManager.createInvoice(bob, items, "Invoice #1", "", 0);

        (
            uint256 id, , , uint256 totalAmount,
            uint256 platformFee, uint256 greenFee, uint256 netAmount,
            , , , , ,
        ) = invoiceManager.invoices(invId);

        assertEq(id,          1);
        assertEq(totalAmount, 220 * USDC_DEC);
        assertEq(platformFee, _platformFee(220 * USDC_DEC));
        assertEq(greenFee,    _greenFee(220 * USDC_DEC));
        assertEq(netAmount,   _net(220 * USDC_DEC));
    }

    function test_pay_invoice_routes_correctly() public {
        InvoiceManager.LineItem[] memory items = _makeItems();

        vm.prank(alice);
        uint256 invId = invoiceManager.createInvoice(bob, items, "Invoice #1", "", 0);

        uint256 total       = 220 * USDC_DEC;
        uint256 platformFee = _platformFee(total);
        uint256 greenFee    = _greenFee(total);
        uint256 net         = _net(total);

        vm.startPrank(bob);
        usdc.approve(address(invoiceManager), total);
        invoiceManager.payInvoice(invId);
        vm.stopPrank();

        assertEq(usdc.balanceOf(alice),                1000 * USDC_DEC + net);
        assertEq(usdc.balanceOf(treasury),             platformFee);
        assertEq(usdc.balanceOf(address(greenFund)),   greenFee);

        (, , , , , , , , , , uint8 status, ,) = invoiceManager.invoices(invId);
        assertEq(status, 2); // Paid
    }

    // ── GreenFund ─────────────────────────────────────────────────────────────

    function test_unauthorized_depositor_reverts() public {
        vm.prank(charlie);
        vm.expectRevert(GreenFund.NotAuthorized.selector);
        greenFund.depositFee(alice, 100);
    }

    function test_cumulative_contributions() public {
        uint256 g1 = 100 * USDC_DEC;
        uint256 g2 = 200 * USDC_DEC;

        vm.prank(owner);
        usdc.mint(alice, g1 + g2);

        vm.startPrank(alice);
        usdc.approve(address(greenPay), g1 + g2);
        greenPay.send(bob, g1, "tx1");
        greenPay.send(bob, g2, "tx2");
        vm.stopPrank();

        assertEq(greenFund.userContributions(alice), _greenFee(g1) + _greenFee(g2));
        assertEq(greenFund.totalContributions(),     _greenFee(g1) + _greenFee(g2));
    }

    function test_treasury_receives_platform_fees() public {
        uint256 g1 = 100 * USDC_DEC;
        uint256 g2 = 200 * USDC_DEC;

        vm.prank(owner);
        usdc.mint(alice, g1 + g2);

        vm.startPrank(alice);
        usdc.approve(address(greenPay), g1 + g2);
        greenPay.send(bob, g1, "tx1");
        greenPay.send(bob, g2, "tx2");
        vm.stopPrank();

        assertEq(usdc.balanceOf(treasury), _platformFee(g1) + _platformFee(g2));
    }
}
