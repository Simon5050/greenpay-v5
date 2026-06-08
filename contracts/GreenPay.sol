// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "./GreenFund.sol";

/// @title GreenPay - Sustainable P2P Payment Engine
/// @notice Handles direct payments and payment requests.
///         Every USDC transfer applies a 0.25% total fee split as:
///           - 0.12% (12 BPS) → platform treasury
///           - 0.13% (13 BPS) → GreenFund carbon offset pool
contract GreenPay is Ownable, ReentrancyGuard {
    using SafeERC20 for IERC20;

    // ── Fee constants ─────────────────────────────────────────────────────────
    uint256 public constant PLATFORM_FEE_BPS = 12;     // 0.12% → platform treasury
    uint256 public constant GREEN_FEE_BPS    = 13;     // 0.13% → GreenFund
    uint256 public constant TOTAL_FEE_BPS    = 25;     // 0.25% total fee
    uint256 public constant BPS_DENOMINATOR  = 10_000;
    uint256 public constant MAX_NOTE_LENGTH  = 200;

    // ── State ─────────────────────────────────────────────────────────────────
    IERC20    public immutable usdc;
    GreenFund public immutable greenFund;
    address   public           treasury;    // platform fee recipient

    uint256 private _nextPaymentId = 1;
    uint256 private _nextRequestId = 1;

    // ── Structs ───────────────────────────────────────────────────────────────
    enum RequestStatus { Pending, Fulfilled, Cancelled }

    struct Payment {
        uint256 id;
        address sender;
        address recipient;
        uint256 grossAmount;    // amount sender paid (pre-fee)
        uint256 netAmount;      // amount recipient received
        uint256 platformFee;    // 0.12% to treasury
        uint256 greenFee;       // 0.13% to GreenFund
        string  note;
        uint256 timestamp;
    }

    struct PaymentRequest {
        uint256 id;
        address requester;
        address payer;
        uint256 amount;
        string  note;
        RequestStatus status;
        uint256 createdAt;
        uint256 fulfilledAt;
    }

    // ── Storage ───────────────────────────────────────────────────────────────
    mapping(uint256 => Payment)        public payments;
    mapping(uint256 => PaymentRequest) public requests;
    mapping(address => uint256[])      public sentPayments;
    mapping(address => uint256[])      public receivedPayments;
    mapping(address => uint256[])      public myRequests;
    mapping(address => uint256[])      public requestsToMe;

    // ── Events ────────────────────────────────────────────────────────────────
    event PaymentSent(
        uint256 indexed id,
        address indexed sender,
        address indexed recipient,
        uint256 grossAmount,
        uint256 netAmount,
        uint256 platformFee,
        uint256 greenFee,
        string  note
    );
    event PaymentRequested(
        uint256 indexed id,
        address indexed requester,
        address indexed payer,
        uint256 amount,
        string  note
    );
    event RequestFulfilled(uint256 indexed requestId, uint256 indexed paymentId);
    event RequestCancelled(uint256 indexed requestId);
    event TreasuryUpdated(address indexed oldTreasury, address indexed newTreasury);

    // ── Errors ────────────────────────────────────────────────────────────────
    error ZeroAmount();
    error ZeroAddress();
    error SelfTransfer();
    error NoteTooLong();
    error NotRequester();
    error RequestNotPending();

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

    /// @notice Owner can update the platform treasury address
    function setTreasury(address newTreasury) external onlyOwner {
        if (newTreasury == address(0)) revert ZeroAddress();
        emit TreasuryUpdated(treasury, newTreasury);
        treasury = newTreasury;
    }

    // ── Internal helpers ──────────────────────────────────────────────────────

    /// @dev Splits a gross amount into net, platform fee, and green fee
    function _splitAmount(uint256 gross)
        internal
        pure
        returns (uint256 net, uint256 platformFee, uint256 greenFee)
    {
        platformFee = (gross * PLATFORM_FEE_BPS) / BPS_DENOMINATOR;
        greenFee    = (gross * GREEN_FEE_BPS)    / BPS_DENOMINATOR;
        net         = gross - platformFee - greenFee;
    }

    /// @dev Executes a payment: pulls USDC, splits, routes to recipient + treasury + GreenFund
    function _executePayment(
        address sender,
        address recipient,
        uint256 gross,
        string memory note
    ) internal returns (uint256 paymentId) {
        (uint256 net, uint256 platformFee, uint256 greenFee) = _splitAmount(gross);

        // Pull full amount from sender
        usdc.safeTransferFrom(sender, address(this), gross);

        // Route net to recipient
        usdc.safeTransfer(recipient, net);

        // Route platform fee to treasury
        usdc.safeTransfer(treasury, platformFee);

        // Route green fee to GreenFund
        usdc.safeTransfer(address(greenFund), greenFee);
        greenFund.depositFee(sender, greenFee);

        // Record payment
        paymentId = _nextPaymentId++;
        payments[paymentId] = Payment({
            id:          paymentId,
            sender:      sender,
            recipient:   recipient,
            grossAmount: gross,
            netAmount:   net,
            platformFee: platformFee,
            greenFee:    greenFee,
            note:        note,
            timestamp:   block.timestamp
        });
        sentPayments[sender].push(paymentId);
        receivedPayments[recipient].push(paymentId);
    }

    // ── External: Payments ────────────────────────────────────────────────────

    /// @notice Send USDC directly to a recipient
    /// @param recipient Target wallet address
    /// @param amount    Gross USDC amount (6 decimals).
    ///                  0.12% → platform treasury, 0.13% → GreenFund, 99.75% → recipient
    /// @param note      Optional message (max 200 chars)
    function send(
        address recipient,
        uint256 amount,
        string calldata note
    ) external nonReentrant returns (uint256 paymentId) {
        if (recipient == address(0))          revert ZeroAddress();
        if (recipient == msg.sender)           revert SelfTransfer();
        if (amount == 0)                       revert ZeroAmount();
        if (bytes(note).length > MAX_NOTE_LENGTH) revert NoteTooLong();

        paymentId = _executePayment(msg.sender, recipient, amount, note);

        Payment storage p = payments[paymentId];
        emit PaymentSent(
            paymentId, msg.sender, recipient,
            amount, p.netAmount, p.platformFee, p.greenFee, note
        );
    }

    // ── External: Requests ────────────────────────────────────────────────────

    /// @notice Request payment from another address
    function requestPayment(
        address payer,
        uint256 amount,
        string calldata note
    ) external returns (uint256 requestId) {
        if (payer == address(0))               revert ZeroAddress();
        if (payer == msg.sender)               revert SelfTransfer();
        if (amount == 0)                       revert ZeroAmount();
        if (bytes(note).length > MAX_NOTE_LENGTH) revert NoteTooLong();

        requestId = _nextRequestId++;
        requests[requestId] = PaymentRequest({
            id:          requestId,
            requester:   msg.sender,
            payer:       payer,
            amount:      amount,
            note:        note,
            status:      RequestStatus.Pending,
            createdAt:   block.timestamp,
            fulfilledAt: 0
        });
        myRequests[msg.sender].push(requestId);
        requestsToMe[payer].push(requestId);

        emit PaymentRequested(requestId, msg.sender, payer, amount, note);
    }

    /// @notice Payer fulfils a pending payment request
    function fulfillRequest(uint256 requestId)
        external
        nonReentrant
        returns (uint256 paymentId)
    {
        PaymentRequest storage req = requests[requestId];
        if (req.status != RequestStatus.Pending) revert RequestNotPending();
        if (req.payer != address(0) && req.payer != msg.sender) revert NotRequester();

        req.status      = RequestStatus.Fulfilled;
        req.fulfilledAt = block.timestamp;

        paymentId = _executePayment(msg.sender, req.requester, req.amount, req.note);

        Payment storage p = payments[paymentId];
        emit PaymentSent(
            paymentId, msg.sender, req.requester,
            req.amount, p.netAmount, p.platformFee, p.greenFee, req.note
        );
        emit RequestFulfilled(requestId, paymentId);
    }

    /// @notice Requester cancels their own pending request
    function cancelRequest(uint256 requestId) external {
        PaymentRequest storage req = requests[requestId];
        if (req.requester != msg.sender)         revert NotRequester();
        if (req.status != RequestStatus.Pending) revert RequestNotPending();

        req.status = RequestStatus.Cancelled;
        emit RequestCancelled(requestId);
    }

    // ── Views ─────────────────────────────────────────────────────────────────

    function getSentPayments(address user)     external view returns (uint256[] memory) { return sentPayments[user]; }
    function getReceivedPayments(address user) external view returns (uint256[] memory) { return receivedPayments[user]; }
    function getMyRequests(address user)       external view returns (uint256[] memory) { return myRequests[user]; }
    function getRequestsToMe(address user)     external view returns (uint256[] memory) { return requestsToMe[user]; }

    /// @notice Preview fee split before sending
    function previewSplit(uint256 gross)
        external
        pure
        returns (uint256 net, uint256 platformFee, uint256 greenFee)
    {
        return _splitAmount(gross);
    }
}
