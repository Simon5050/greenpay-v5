// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "./GreenFund.sol";

/// @title InvoiceManager - On-chain invoice lifecycle management
/// @notice Issue, pay, and dispute invoices.
///         Every payment applies a 0.25% total fee split as:
///           - 0.12% (12 BPS) → platform treasury
///           - 0.13% (13 BPS) → GreenFund carbon offset pool
contract InvoiceManager is Ownable, ReentrancyGuard {
    using SafeERC20 for IERC20;

    // ── Fee constants ─────────────────────────────────────────────────────────
    uint256 public constant PLATFORM_FEE_BPS = 12;     // 0.12% → platform treasury
    uint256 public constant GREEN_FEE_BPS    = 13;     // 0.13% → GreenFund
    uint256 public constant TOTAL_FEE_BPS    = 25;     // 0.25% total fee
    uint256 public constant BPS_DENOMINATOR  = 10_000;
    uint256 public constant MAX_DESC_LENGTH  = 500;
    uint256 public constant MAX_ITEMS        = 20;

    // ── State ─────────────────────────────────────────────────────────────────
    IERC20    public immutable usdc;
    GreenFund public immutable greenFund;
    address   public           treasury;

    uint256 private _nextInvoiceId = 1;

    // ── Enums & Structs ───────────────────────────────────────────────────────
    enum InvoiceStatus { Draft, Issued, Paid, Cancelled, Disputed, Resolved }

    struct LineItem {
        string  description;
        uint256 quantity;   // scaled ×100 (e.g. 100 = 1.00 units)
        uint256 unitPrice;  // USDC 6-decimal amount per unit
    }

    struct Invoice {
        uint256 id;
        address issuer;
        address client;         // address(0) = open invoice
        uint256 totalAmount;    // gross USDC due
        uint256 platformFee;    // 0.12% of totalAmount → treasury
        uint256 greenFee;       // 0.13% of totalAmount → GreenFund
        uint256 netAmount;      // issuer receives totalAmount - platformFee - greenFee
        string  title;
        string  description;
        uint256 dueDate;
        InvoiceStatus status;
        uint256 createdAt;
        uint256 paidAt;
        address paidBy;
    }

    mapping(uint256 => LineItem[])  public invoiceItems;
    mapping(uint256 => Invoice)     public invoices;
    mapping(address => uint256[])   public issuedInvoices;
    mapping(address => uint256[])   public receivedInvoices;
    mapping(uint256 => string)      public disputeReasons;

    // ── Events ────────────────────────────────────────────────────────────────
    event InvoiceCreated(
        uint256 indexed id,
        address indexed issuer,
        address indexed client,
        uint256 totalAmount,
        uint256 dueDate
    );
    event InvoicePaid(
        uint256 indexed id,
        address indexed paidBy,
        uint256 grossAmount,
        uint256 netAmount,
        uint256 platformFee,
        uint256 greenFee
    );
    event InvoiceCancelled(uint256 indexed id);
    event InvoiceDisputed(uint256 indexed id, address indexed disputedBy, string reason);
    event InvoiceResolved(uint256 indexed id);
    event TreasuryUpdated(address indexed oldTreasury, address indexed newTreasury);

    // ── Errors ────────────────────────────────────────────────────────────────
    error ZeroAddress();
    error ZeroAmount();
    error NotIssuer();
    error NotClient();
    error InvalidStatus(InvoiceStatus current);
    error DescriptionTooLong();
    error TooManyItems();
    error ZeroItems();
    error DueDateInPast();
    error InvoiceExpired();

    // ── Constructor ───────────────────────────────────────────────────────────
    constructor(
        address _usdc,
        address _greenFund,
        address _treasury,
        address initialOwner
    ) Ownable(initialOwner) {
        if (_usdc == address(0) || _greenFund == address(0) || _treasury == address(0))
            revert ZeroAddress();
        usdc      = IERC20(_usdc);
        greenFund = GreenFund(_greenFund);
        treasury  = _treasury;
    }

    // ── Admin ─────────────────────────────────────────────────────────────────

    function setTreasury(address newTreasury) external onlyOwner {
        if (newTreasury == address(0)) revert ZeroAddress();
        emit TreasuryUpdated(treasury, newTreasury);
        treasury = newTreasury;
    }

    // ── Internal ──────────────────────────────────────────────────────────────

    function _splitAmount(uint256 gross)
        internal
        pure
        returns (uint256 net, uint256 platformFee, uint256 greenFee)
    {
        platformFee = (gross * PLATFORM_FEE_BPS) / BPS_DENOMINATOR;
        greenFee    = (gross * GREEN_FEE_BPS)    / BPS_DENOMINATOR;
        net         = gross - platformFee - greenFee;
    }

    function _calcTotal(LineItem[] calldata items) internal pure returns (uint256 total) {
        for (uint256 i = 0; i < items.length; i++) {
            total += (items[i].quantity * items[i].unitPrice) / 100;
        }
    }

    // ── External: Create ──────────────────────────────────────────────────────

    /// @notice Issue a new invoice
    function createInvoice(
        address client,
        LineItem[] calldata items,
        string calldata title,
        string calldata description,
        uint256 dueDate
    ) external returns (uint256 invoiceId) {
        if (client == msg.sender)                         revert ZeroAddress();
        if (items.length == 0)                            revert ZeroItems();
        if (items.length > MAX_ITEMS)                     revert TooManyItems();
        if (bytes(description).length > MAX_DESC_LENGTH)  revert DescriptionTooLong();
        if (dueDate != 0 && dueDate <= block.timestamp)   revert DueDateInPast();

        uint256 total = _calcTotal(items);
        if (total == 0) revert ZeroAmount();

        (uint256 net, uint256 platformFee, uint256 greenFee) = _splitAmount(total);

        invoiceId = _nextInvoiceId++;
        invoices[invoiceId] = Invoice({
            id:          invoiceId,
            issuer:      msg.sender,
            client:      client,
            totalAmount: total,
            platformFee: platformFee,
            greenFee:    greenFee,
            netAmount:   net,
            title:       title,
            description: description,
            dueDate:     dueDate,
            status:      InvoiceStatus.Issued,
            createdAt:   block.timestamp,
            paidAt:      0,
            paidBy:      address(0)
        });

        for (uint256 i = 0; i < items.length; i++) {
            invoiceItems[invoiceId].push(items[i]);
        }

        issuedInvoices[msg.sender].push(invoiceId);
        if (client != address(0)) {
            receivedInvoices[client].push(invoiceId);
        }

        emit InvoiceCreated(invoiceId, msg.sender, client, total, dueDate);
    }

    // ── External: Pay ─────────────────────────────────────────────────────────

    /// @notice Pay an invoice
    function payInvoice(uint256 invoiceId) external nonReentrant {
        Invoice storage inv = invoices[invoiceId];

        if (inv.status != InvoiceStatus.Issued) revert InvalidStatus(inv.status);
        if (inv.client != address(0) && inv.client != msg.sender) revert NotClient();
        if (inv.dueDate != 0 && block.timestamp > inv.dueDate)    revert InvoiceExpired();

        uint256 gross = inv.totalAmount;
        (, uint256 platformFee, uint256 greenFee) = _splitAmount(gross);
        uint256 net = gross - platformFee - greenFee;

        inv.status = InvoiceStatus.Paid;
        inv.paidAt = block.timestamp;
        inv.paidBy = msg.sender;

        if (inv.client == address(0)) {
            receivedInvoices[msg.sender].push(invoiceId);
        }

        // Pull from payer
        usdc.safeTransferFrom(msg.sender, address(this), gross);

        // Route net to issuer
        usdc.safeTransfer(inv.issuer, net);

        // Route platform fee to treasury
        usdc.safeTransfer(treasury, platformFee);

        // Route green fee to GreenFund
        usdc.safeTransfer(address(greenFund), greenFee);
        greenFund.depositFee(msg.sender, greenFee);

        emit InvoicePaid(invoiceId, msg.sender, gross, net, platformFee, greenFee);
    }

    // ── External: Cancel / Dispute / Resolve ──────────────────────────────────

    function cancelInvoice(uint256 invoiceId) external {
        Invoice storage inv = invoices[invoiceId];
        if (inv.issuer != msg.sender)               revert NotIssuer();
        if (inv.status != InvoiceStatus.Issued)     revert InvalidStatus(inv.status);
        inv.status = InvoiceStatus.Cancelled;
        emit InvoiceCancelled(invoiceId);
    }

    function disputeInvoice(uint256 invoiceId, string calldata reason) external {
        Invoice storage inv = invoices[invoiceId];
        if (inv.paidBy != msg.sender)           revert NotClient();
        if (inv.status != InvoiceStatus.Paid)   revert InvalidStatus(inv.status);
        inv.status = InvoiceStatus.Disputed;
        disputeReasons[invoiceId] = reason;
        emit InvoiceDisputed(invoiceId, msg.sender, reason);
    }

    function resolveDispute(uint256 invoiceId) external onlyOwner {
        Invoice storage inv = invoices[invoiceId];
        if (inv.status != InvoiceStatus.Disputed) revert InvalidStatus(inv.status);
        inv.status = InvoiceStatus.Resolved;
        emit InvoiceResolved(invoiceId);
    }

    // ── Views ─────────────────────────────────────────────────────────────────

    function getLineItems(uint256 invoiceId)         external view returns (LineItem[] memory) { return invoiceItems[invoiceId]; }
    function getIssuedInvoices(address user)         external view returns (uint256[] memory)  { return issuedInvoices[user]; }
    function getReceivedInvoices(address user)       external view returns (uint256[] memory)  { return receivedInvoices[user]; }

    function previewFee(uint256 amount)
        external
        pure
        returns (uint256 net, uint256 platformFee, uint256 greenFee)
    {
        return _splitAmount(amount);
    }
}
