// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Test.sol";
import "../contracts/MockUSDC.sol";
import "../contracts/GreenFund.sol";
import "../contracts/InvoiceManager.sol";

/// @notice Tests use MockUSDC locally — production deploy uses real Arc Testnet USDC
contract InvoiceManagerTest is Test {
    MockUSDC       usdc;
    GreenFund      greenFund;
    InvoiceManager invoiceManager;

    address owner    = address(this);
    address treasury = makeAddr("treasury");
    address alice    = makeAddr("alice");   // issuer
    address bob      = makeAddr("bob");     // client
    address charlie  = makeAddr("charlie"); // third party

    uint256 constant USDC_DEC     = 1e6;
    uint256 constant PLATFORM_BPS = 12;
    uint256 constant GREEN_BPS    = 13;
    uint256 constant BPS_DENOM    = 10_000;

    function setUp() public {
        usdc           = new MockUSDC(owner);
        greenFund      = new GreenFund(address(usdc), owner);
        invoiceManager = new InvoiceManager(address(usdc), address(greenFund), treasury, owner);

        greenFund.setDepositor(address(invoiceManager), true);

        vm.prank(alice);   usdc.faucet();
        vm.prank(bob);     usdc.faucet();
        vm.prank(charlie); usdc.faucet();
    }

    // ── Fee helpers ───────────────────────────────────────────────────────────
    function _pf(uint256 g) internal pure returns (uint256) { return (g * PLATFORM_BPS) / BPS_DENOM; }
    function _gf(uint256 g) internal pure returns (uint256) { return (g * GREEN_BPS)    / BPS_DENOM; }
    function _net(uint256 g) internal pure returns (uint256) { return g - _pf(g) - _gf(g); }

    // ── Item helpers ──────────────────────────────────────────────────────────
    function _single(string memory desc, uint256 qty, uint256 price)
        internal pure returns (InvoiceManager.LineItem[] memory items)
    {
        items = new InvoiceManager.LineItem[](1);
        items[0] = InvoiceManager.LineItem(desc, qty, price);
    }

    function _twoItems() internal pure returns (InvoiceManager.LineItem[] memory items) {
        items = new InvoiceManager.LineItem[](2);
        items[0] = InvoiceManager.LineItem("Design",  100, 500 * USDC_DEC);
        items[1] = InvoiceManager.LineItem("Hosting", 200, 20  * USDC_DEC);
        // total = 500 + 40 = 540 USDC
    }

    // ── Creation ──────────────────────────────────────────────────────────────

    function test_create_invoice_fee_split() public {
        InvoiceManager.LineItem[] memory items = _single("Logo", 100, 300 * USDC_DEC);

        vm.prank(alice);
        uint256 id = invoiceManager.createInvoice(bob, items, "Invoice #1", "", 0);

        (, , , uint256 total, uint256 pf, uint256 gf, uint256 net, , , , , ,) =
            invoiceManager.invoices(id);

        assertEq(total, 300 * USDC_DEC);
        assertEq(pf,    _pf(300  * USDC_DEC));
        assertEq(gf,    _gf(300  * USDC_DEC));
        assertEq(net,   _net(300 * USDC_DEC));
        assertEq(net + pf + gf, total);
    }

    function test_multi_item_total() public {
        InvoiceManager.LineItem[] memory items = _twoItems();
        vm.prank(alice);
        uint256 id = invoiceManager.createInvoice(bob, items, "Multi", "", 0);

        (, , , uint256 total, , , , , , , , ,) = invoiceManager.invoices(id);
        assertEq(total, 540 * USDC_DEC);
    }

    function test_cannot_create_empty_items() public {
        InvoiceManager.LineItem[] memory items = new InvoiceManager.LineItem[](0);
        vm.prank(alice);
        vm.expectRevert(InvoiceManager.ZeroItems.selector);
        invoiceManager.createInvoice(bob, items, "Empty", "", 0);
    }

    function test_cannot_exceed_max_items() public {
        InvoiceManager.LineItem[] memory items = new InvoiceManager.LineItem[](21);
        for (uint i = 0; i < 21; i++) {
            items[i] = InvoiceManager.LineItem("Item", 100, 1 * USDC_DEC);
        }
        vm.prank(alice);
        vm.expectRevert(InvoiceManager.TooManyItems.selector);
        invoiceManager.createInvoice(bob, items, "Too many", "", 0);
    }

    function test_past_due_date_reverts() public {
        InvoiceManager.LineItem[] memory items = _single("Item", 100, 10 * USDC_DEC);
        vm.prank(alice);
        vm.expectRevert(InvoiceManager.DueDateInPast.selector);
        invoiceManager.createInvoice(bob, items, "Past", "", block.timestamp - 1);
    }

    // ── Payment routing ────────────────────────────────────────────────────────

    function test_pay_routes_to_issuer_treasury_and_greenfund() public {
        InvoiceManager.LineItem[] memory items = _single("Design", 100, 200 * USDC_DEC);
        vm.prank(alice);
        uint256 id = invoiceManager.createInvoice(bob, items, "Invoice", "", 0);

        uint256 total = 200 * USDC_DEC;

        vm.startPrank(bob);
        usdc.approve(address(invoiceManager), total);
        invoiceManager.payInvoice(id);
        vm.stopPrank();

        assertEq(usdc.balanceOf(alice),                1000 * USDC_DEC + _net(total));
        assertEq(usdc.balanceOf(treasury),             _pf(total));
        assertEq(usdc.balanceOf(address(greenFund)),   _gf(total));
        assertEq(greenFund.userContributions(bob),     _gf(total));
    }

    function test_addressed_invoice_only_client_can_pay() public {
        InvoiceManager.LineItem[] memory items = _single("Work", 100, 50 * USDC_DEC);
        vm.prank(alice);
        uint256 id = invoiceManager.createInvoice(bob, items, "Addressed", "", 0);

        vm.startPrank(charlie);
        usdc.approve(address(invoiceManager), 50 * USDC_DEC);
        vm.expectRevert(InvoiceManager.NotClient.selector);
        invoiceManager.payInvoice(id);
        vm.stopPrank();
    }

    function test_open_invoice_anyone_can_pay() public {
        InvoiceManager.LineItem[] memory items = _single("Open", 100, 100 * USDC_DEC);
        vm.prank(alice);
        uint256 id = invoiceManager.createInvoice(address(0), items, "Open", "", 0);

        vm.startPrank(charlie);
        usdc.approve(address(invoiceManager), 100 * USDC_DEC);
        invoiceManager.payInvoice(id);
        vm.stopPrank();

        (, , , , , , , , , , uint8 status, , address paidBy) = invoiceManager.invoices(id);
        assertEq(status, 2);
        assertEq(paidBy, charlie);
    }

    function test_expired_invoice_cannot_be_paid() public {
        InvoiceManager.LineItem[] memory items = _single("Item", 100, 50 * USDC_DEC);
        uint256 deadline = block.timestamp + 1 days;
        vm.prank(alice);
        uint256 id = invoiceManager.createInvoice(bob, items, "Expiring", "", deadline);

        vm.warp(deadline + 1);

        vm.startPrank(bob);
        usdc.approve(address(invoiceManager), 50 * USDC_DEC);
        vm.expectRevert(InvoiceManager.InvoiceExpired.selector);
        invoiceManager.payInvoice(id);
        vm.stopPrank();
    }

    function test_cannot_double_pay() public {
        InvoiceManager.LineItem[] memory items = _single("Item", 100, 50 * USDC_DEC);
        vm.prank(alice);
        uint256 id = invoiceManager.createInvoice(bob, items, "Invoice", "", 0);

        vm.startPrank(bob);
        usdc.approve(address(invoiceManager), 100 * USDC_DEC);
        invoiceManager.payInvoice(id);
        vm.expectRevert();
        invoiceManager.payInvoice(id);
        vm.stopPrank();
    }

    // ── Cancellation ──────────────────────────────────────────────────────────

    function test_issuer_can_cancel() public {
        InvoiceManager.LineItem[] memory items = _single("Item", 100, 50 * USDC_DEC);
        vm.prank(alice);
        uint256 id = invoiceManager.createInvoice(bob, items, "Invoice", "", 0);

        vm.prank(alice);
        invoiceManager.cancelInvoice(id);

        (, , , , , , , , , , uint8 status, ,) = invoiceManager.invoices(id);
        assertEq(status, 3); // Cancelled
    }

    function test_non_issuer_cannot_cancel() public {
        InvoiceManager.LineItem[] memory items = _single("Item", 100, 50 * USDC_DEC);
        vm.prank(alice);
        uint256 id = invoiceManager.createInvoice(bob, items, "Invoice", "", 0);

        vm.prank(bob);
        vm.expectRevert(InvoiceManager.NotIssuer.selector);
        invoiceManager.cancelInvoice(id);
    }

    // ── Dispute ───────────────────────────────────────────────────────────────

    function test_client_can_dispute_paid_invoice() public {
        InvoiceManager.LineItem[] memory items = _single("Service", 100, 100 * USDC_DEC);
        vm.prank(alice);
        uint256 id = invoiceManager.createInvoice(bob, items, "Service", "", 0);

        vm.startPrank(bob);
        usdc.approve(address(invoiceManager), 100 * USDC_DEC);
        invoiceManager.payInvoice(id);
        invoiceManager.disputeInvoice(id, "Service not delivered");
        vm.stopPrank();

        (, , , , , , , , , , uint8 status, ,) = invoiceManager.invoices(id);
        assertEq(status, 4); // Disputed
        assertEq(invoiceManager.disputeReasons(id), "Service not delivered");
    }

    function test_owner_resolves_dispute() public {
        InvoiceManager.LineItem[] memory items = _single("Service", 100, 100 * USDC_DEC);
        vm.prank(alice);
        uint256 id = invoiceManager.createInvoice(bob, items, "Invoice", "", 0);

        vm.startPrank(bob);
        usdc.approve(address(invoiceManager), 100 * USDC_DEC);
        invoiceManager.payInvoice(id);
        invoiceManager.disputeInvoice(id, "Bad work");
        vm.stopPrank();

        invoiceManager.resolveDispute(id);

        (, , , , , , , , , , uint8 status, ,) = invoiceManager.invoices(id);
        assertEq(status, 5); // Resolved
    }

    // ── Fee preview ───────────────────────────────────────────────────────────

    function test_preview_fee_matches_actual() public view {
        uint256 amount = 1000 * USDC_DEC;
        (uint256 net, uint256 pf, uint256 gf) = invoiceManager.previewFee(amount);
        assertEq(pf,  _pf(amount));
        assertEq(gf,  _gf(amount));
        assertEq(net, _net(amount));
        assertEq(net + pf + gf, amount);
    }

    function test_fuzz_invoice_fee(uint256 amount) public view {
        amount = bound(amount, 1 * USDC_DEC, 1_000_000 * USDC_DEC);
        (uint256 net, uint256 pf, uint256 gf) = invoiceManager.previewFee(amount);
        assertEq(net + pf + gf, amount);
    }
}
