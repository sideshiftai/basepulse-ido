// SPDX-License-Identifier: MIT
pragma solidity ^0.8.22;

import "./IDOSaleV2.sol";
import "./VestingManagerV2.sol";
import "./WhitelistManager.sol";
import "./FactoryRegistry.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/**
 * @title IDOFactory
 * @dev Lightweight factory contract for deploying IDO sales
 *
 * Features:
 * - Deploy complete IDO infrastructure (Sale + Vesting + Whitelist contracts)
 * - Metadata storage for each sale
 * - Admin controls for pausing sales
 *
 * Architecture:
 * - Factory: Deploys sales (lean, under 24KB)
 * - Registry: Tracks and queries sales (separate contract)
 * - Each sale gets its own IDOSaleV2, VestingManagerV2, and WhitelistManager
 */
contract IDOFactory is Ownable, ReentrancyGuard {

    // ============ Structs ============

    struct SaleMetadata {
        string name;           // e.g., "PULSE Token Sale"
        string symbol;         // e.g., "PULSE"
        string description;    // Full description
        string logoUrl;        // Logo image URL (IPFS preferred)
        string websiteUrl;     // Project website
        string twitterUrl;     // Twitter link
        string telegramUrl;    // Telegram link
    }

    // ============ State Variables ============

    uint256 public saleCount;
    address public immutable usdcToken; // Payment token (same for all sales)
    FactoryRegistry public registry; // Registry contract for tracking/querying

    // Fees (in basis points, e.g., 250 = 2.5%)
    uint256 public platformFeeBps = 250; // 2.5% platform fee
    address public feeCollector;

    // ============ Events ============

    event SaleCreated(
        uint256 indexed saleId,
        address indexed saleToken,
        address idoSale,
        address vestingManager,
        address whitelistManager,
        address indexed creator
    );

    event PlatformFeeUpdated(uint256 oldFee, uint256 newFee);
    event FeeCollectorUpdated(address oldCollector, address newCollector);

    // ============ Errors ============

    error InvalidSaleId();
    error InvalidToken();
    error InvalidFee();
    error InvalidAddress();
    error Unauthorized();

    // ============ Constructor ============

    constructor(address _usdcToken, address _registry) Ownable(msg.sender) {
        require(_usdcToken != address(0), "Invalid USDC address");
        require(_registry != address(0), "Invalid registry address");
        usdcToken = _usdcToken;
        registry = FactoryRegistry(_registry);
        feeCollector = msg.sender;
    }

    /**
     * @dev Update registry contract (owner only)
     */
    function setRegistry(address _registry) external onlyOwner {
        require(_registry != address(0), "Invalid registry");
        registry = FactoryRegistry(_registry);
    }

    // ============ Sale Creation ============

    /**
     * @dev Create a new IDO sale with all supporting contracts
     * @param _saleToken Token being sold
     * @param _metadata Sale metadata (name, description, links)
     * @return saleId The ID of the created sale
     */
    function createSale(
        address _saleToken,
        SaleMetadata calldata _metadata
    ) external nonReentrant returns (uint256 saleId) {
        require(_saleToken != address(0), "Invalid sale token");
        require(bytes(_metadata.name).length > 0, "Name required");
        require(bytes(_metadata.symbol).length > 0, "Symbol required");

        saleId = saleCount++;

        // Deploy VestingManager
        VestingManagerV2 vestingManager = new VestingManagerV2(_saleToken);

        // Deploy WhitelistManager
        WhitelistManager whitelistManager = new WhitelistManager();

        // Deploy IDOSale
        IDOSaleV2 idoSale = new IDOSaleV2(
            saleId,
            address(this),
            _saleToken,
            usdcToken
        );

        // Link contracts
        vestingManager.setIDOContract(address(idoSale));
        idoSale.setVestingContract(address(vestingManager));

        // Transfer ownership to factory owner (admin)
        vestingManager.transferOwnership(owner());
        whitelistManager.transferOwnership(owner());
        idoSale.transferOwnership(owner());

        // Register in registry for tracking/querying
        registry.registerSale(saleId, address(idoSale), _saleToken, msg.sender);

        emit SaleCreated(
            saleId,
            _saleToken,
            address(idoSale),
            address(vestingManager),
            address(whitelistManager),
            msg.sender
        );
    }

    // ============ Admin Functions ============

    /**
     * @dev Update platform fee
     */
    function setPlatformFee(uint256 _feeBps) external onlyOwner {
        if (_feeBps > 1000) revert InvalidFee(); // Max 10%

        uint256 oldFee = platformFeeBps;
        platformFeeBps = _feeBps;

        emit PlatformFeeUpdated(oldFee, _feeBps);
    }

    /**
     * @dev Update fee collector address
     */
    function setFeeCollector(address _feeCollector) external onlyOwner {
        if (_feeCollector == address(0)) revert InvalidAddress();

        address oldCollector = feeCollector;
        feeCollector = _feeCollector;

        emit FeeCollectorUpdated(oldCollector, _feeCollector);
    }

}

