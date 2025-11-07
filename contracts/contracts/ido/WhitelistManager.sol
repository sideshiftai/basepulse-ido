// SPDX-License-Identifier: MIT
pragma solidity ^0.8.22;

import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title WhitelistManager
 * @dev Utility contract for managing whitelist with Merkle proofs
 *
 * Features:
 * - Merkle tree based whitelist verification
 * - Gas-efficient on-chain verification
 * - Support for tiered access (Seed, Private, Public)
 * - Manual whitelist override for special cases
 *
 * Usage:
 * 1. Generate Merkle tree off-chain from whitelist
 * 2. Set Merkle root on-chain via setMerkleRoot
 * 3. Users provide Merkle proof during purchase
 * 4. Contract verifies proof against stored root
 *
 * Merkle Tree Structure:
 * - Leaf: keccak256(abi.encodePacked(address, tierId))
 * - Proof verification follows OpenZeppelin MerkleProof pattern
 */
contract WhitelistManager is Ownable {
    // ============ State Variables ============

    bytes32 public merkleRoot;
    mapping(address => mapping(uint8 => bool)) public manualWhitelist;

    bool public whitelistEnabled = true;

    // ============ Events ============

    event MerkleRootUpdated(bytes32 indexed newRoot, bytes32 indexed oldRoot);
    event ManualWhitelistUpdated(address indexed account, uint8 tier, bool status);
    event WhitelistStatusChanged(bool enabled);

    // ============ Constructor ============

    constructor() Ownable(msg.sender) {}

    // ============ Admin Functions ============

    /**
     * @dev Set the Merkle root for whitelist verification
     * @param _merkleRoot The new Merkle root hash
     */
    function setMerkleRoot(bytes32 _merkleRoot) external onlyOwner {
        bytes32 oldRoot = merkleRoot;
        merkleRoot = _merkleRoot;
        emit MerkleRootUpdated(_merkleRoot, oldRoot);
    }

    /**
     * @dev Manually whitelist an address for a specific tier
     * @param _account Address to whitelist
     * @param _tier Tier ID (1=Seed, 2=Private, 3=Public)
     * @param _status Whitelist status (true=whitelisted, false=removed)
     */
    function setManualWhitelist(
        address _account,
        uint8 _tier,
        bool _status
    ) external onlyOwner {
        require(_account != address(0), "Invalid address");
        require(_tier >= 1 && _tier <= 3, "Invalid tier");

        manualWhitelist[_account][_tier] = _status;
        emit ManualWhitelistUpdated(_account, _tier, _status);
    }

    /**
     * @dev Batch whitelist multiple addresses for a tier
     * @param _accounts Array of addresses to whitelist
     * @param _tier Tier ID for all addresses
     * @param _status Whitelist status for all addresses
     */
    function setManualWhitelistBatch(
        address[] calldata _accounts,
        uint8 _tier,
        bool _status
    ) external onlyOwner {
        require(_tier >= 1 && _tier <= 3, "Invalid tier");

        for (uint256 i = 0; i < _accounts.length; i++) {
            if (_accounts[i] == address(0)) continue;

            manualWhitelist[_accounts[i]][_tier] = _status;
            emit ManualWhitelistUpdated(_accounts[i], _tier, _status);
        }
    }

    /**
     * @dev Enable or disable whitelist enforcement
     * @param _enabled True to enable whitelist, false to disable
     */
    function setWhitelistEnabled(bool _enabled) external onlyOwner {
        whitelistEnabled = _enabled;
        emit WhitelistStatusChanged(_enabled);
    }

    // ============ Verification Functions ============

    /**
     * @dev Verify if an address is whitelisted for a tier
     * @param _account Address to verify
     * @param _tier Tier ID to check
     * @param _merkleProof Merkle proof for verification
     * @return bool True if whitelisted, false otherwise
     */
    function isWhitelisted(
        address _account,
        uint8 _tier,
        bytes32[] calldata _merkleProof
    ) public view returns (bool) {
        // If whitelist is disabled, everyone is whitelisted
        if (!whitelistEnabled) return true;

        // Check manual whitelist first (overrides Merkle)
        if (manualWhitelist[_account][_tier]) return true;

        // If no Merkle root set, fall back to manual whitelist only
        if (merkleRoot == bytes32(0)) return false;

        // Verify Merkle proof
        bytes32 leaf = keccak256(abi.encodePacked(_account, _tier));
        return verifyProof(_merkleProof, merkleRoot, leaf);
    }

    /**
     * @dev Verify Merkle proof
     * @param proof Array of sibling hashes
     * @param root Merkle root hash
     * @param leaf Leaf hash to verify
     * @return bool True if proof is valid
     */
    function verifyProof(
        bytes32[] memory proof,
        bytes32 root,
        bytes32 leaf
    ) public pure returns (bool) {
        bytes32 computedHash = leaf;

        for (uint256 i = 0; i < proof.length; i++) {
            bytes32 proofElement = proof[i];

            if (computedHash <= proofElement) {
                // Hash(current computed hash + current element of the proof)
                computedHash = keccak256(abi.encodePacked(computedHash, proofElement));
            } else {
                // Hash(current element of the proof + current computed hash)
                computedHash = keccak256(abi.encodePacked(proofElement, computedHash));
            }
        }

        // Check if the computed hash (root) is equal to the provided root
        return computedHash == root;
    }

    /**
     * @dev Check if address is manually whitelisted for any tier
     * @param _account Address to check
     * @return tiers Array of booleans [tier1, tier2, tier3]
     */
    function getManualWhitelistStatus(address _account) external view returns (bool[3] memory tiers) {
        tiers[0] = manualWhitelist[_account][1];
        tiers[1] = manualWhitelist[_account][2];
        tiers[2] = manualWhitelist[_account][3];
    }

    /**
     * @dev Get complete whitelist info for an address
     * @param _account Address to check
     * @param _tier Tier to check
     * @param _merkleProof Merkle proof for verification
     * @return whitelisted True if whitelisted
     * @return method "merkle", "manual", or "disabled"
     */
    function getWhitelistInfo(
        address _account,
        uint8 _tier,
        bytes32[] calldata _merkleProof
    ) external view returns (bool whitelisted, string memory method) {
        if (!whitelistEnabled) {
            return (true, "disabled");
        }

        if (manualWhitelist[_account][_tier]) {
            return (true, "manual");
        }

        if (merkleRoot != bytes32(0)) {
            bytes32 leaf = keccak256(abi.encodePacked(_account, _tier));
            if (verifyProof(_merkleProof, merkleRoot, leaf)) {
                return (true, "merkle");
            }
        }

        return (false, "none");
    }
}
