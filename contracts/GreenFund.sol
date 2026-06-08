// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/// @title GreenFund - Carbon offset pool
/// @notice Accumulates 0.5% green fee from every GreenPay transaction.
///         Tracks per-user carbon offset contributions and total impact score.
///         Owner (DAO / multisig) can withdraw to certified carbon credit projects.
contract GreenFund is Ownable, ReentrancyGuard {
    using SafeERC20 for IERC20;

    IERC20 public immutable usdc;

    /// @notice Authorised callers that can deposit fees (GreenPay, InvoiceManager)
    mapping(address => bool) public authorizedDepositors;

    /// @notice Cumulative USDC (6 decimals) contributed per user address
    mapping(address => uint256) public userContributions;

    /// @notice Total USDC deposited into the green fund (all time)
    uint256 public totalContributions;

    /// @notice Total USDC withdrawn to carbon projects
    uint256 public totalWithdrawn;

    // ── Events ──────────────────────────────────────────────────────────────
    event GreenFeeDeposited(address indexed payer, uint256 amount);
    event FundsWithdrawn(address indexed project, uint256 amount, string description);
    event DepositorAuthorized(address indexed depositor, bool status);

    // ── Errors ───────────────────────────────────────────────────────────────
    error NotAuthorized();
    error ZeroAmount();
    error ZeroAddress();

    constructor(address _usdc, address initialOwner) Ownable(initialOwner) {
        if (_usdc == address(0)) revert ZeroAddress();
        usdc = IERC20(_usdc);
    }

    // ── Modifiers ────────────────────────────────────────────────────────────

    modifier onlyAuthorized() {
        if (!authorizedDepositors[msg.sender]) revert NotAuthorized();
        _;
    }

    // ── Depositor management ─────────────────────────────────────────────────

    /// @notice Owner grants/revokes deposit rights to payment contracts
    function setDepositor(address depositor, bool status) external onlyOwner {
        if (depositor == address(0)) revert ZeroAddress();
        authorizedDepositors[depositor] = status;
        emit DepositorAuthorized(depositor, status);
    }

    // ── Core logic ───────────────────────────────────────────────────────────

    /// @notice Called by GreenPay / InvoiceManager to record a green fee
    /// @param payer  Original transaction sender (for impact tracking)
    /// @param amount USDC amount (already transferred to this contract)
    function depositFee(address payer, uint256 amount) external onlyAuthorized {
        if (amount == 0) revert ZeroAmount();
        if (payer == address(0)) revert ZeroAddress();

        userContributions[payer] += amount;
        totalContributions += amount;

        emit GreenFeeDeposited(payer, amount);
    }

    /// @notice Owner withdraws USDC to a certified carbon credit project
    /// @param project     Destination address (verified carbon project wallet)
    /// @param amount      USDC to send
    /// @param description Human-readable label (e.g. "Gold Standard — Kenya Cookstoves Q3")
    function withdraw(
        address project,
        uint256 amount,
        string calldata description
    ) external onlyOwner nonReentrant {
        if (project == address(0)) revert ZeroAddress();
        if (amount == 0) revert ZeroAmount();

        totalWithdrawn += amount;
        usdc.safeTransfer(project, amount);

        emit FundsWithdrawn(project, amount, description);
    }

    // ── Views ────────────────────────────────────────────────────────────────

    /// @notice Current USDC balance sitting in the fund
    function balance() external view returns (uint256) {
        return usdc.balanceOf(address(this));
    }

    /// @notice Returns a user's total green contribution in USDC (6 dec)
    function contributionOf(address user) external view returns (uint256) {
        return userContributions[user];
    }
}
