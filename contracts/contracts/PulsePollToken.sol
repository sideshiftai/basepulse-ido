// SPDX-License-Identifier: MIT
pragma solidity ^0.8.22;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title PulsePollToken
 * @dev PULSE token for BasePulse ecosystem
 * - Used for poll rewards and IDO
 * - 1 billion max supply
 * - Owner can mint additional tokens if needed
 */
contract PulsePollToken is ERC20, Ownable {
    constructor() ERC20("PulsePoll Token", "PULSE") Ownable(msg.sender) {
        // Mint 1 billion tokens to deployer
        _mint(msg.sender, 1_000_000_000 * 10**18);
    }

    /**
     * @dev Mint additional tokens (only owner)
     * @param to Address to receive tokens
     * @param amount Amount to mint
     */
    function mint(address to, uint256 amount) external onlyOwner {
        _mint(to, amount);
    }
}
