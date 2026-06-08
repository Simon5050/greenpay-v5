// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/// @title MockUSDC - Test USDC token for Arc Testnet
/// @notice Mintable ERC20 with 6 decimals (matches real USDC)
contract MockUSDC is ERC20, Ownable {
    uint8 private constant DECIMALS = 6;

    /// @notice Emitted when tokens are minted via faucet
    event FaucetUsed(address indexed recipient, uint256 amount);

    /// @param initialOwner Contract deployer / admin
    constructor(address initialOwner)
        ERC20("USD Coin", "USDC")
        Ownable(initialOwner)
    {
        // Mint 1,000,000 USDC to deployer for seeding
        _mint(initialOwner, 1_000_000 * 10 ** DECIMALS);
    }

    /// @notice Returns 6 (matches real USDC decimals)
    function decimals() public pure override returns (uint8) {
        return DECIMALS;
    }

    /// @notice Public faucet — anyone can claim 1,000 USDC once per call (testnet only)
    function faucet() external {
        uint256 amount = 1_000 * 10 ** DECIMALS;
        _mint(msg.sender, amount);
        emit FaucetUsed(msg.sender, amount);
    }

    /// @notice Owner can mint arbitrary amounts (for seeding liquidity pools, etc.)
    function mint(address to, uint256 amount) external onlyOwner {
        _mint(to, amount);
    }
}
