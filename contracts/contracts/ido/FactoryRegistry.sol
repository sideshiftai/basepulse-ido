// SPDX-License-Identifier: MIT
pragma solidity ^0.8.22;

import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title FactoryRegistry
 * @dev Registry contract for tracking and querying IDO sales
 *
 * Separation of Concerns:
 * - IDOFactory: Deploys sales (lean, under size limit)
 * - FactoryRegistry: Tracks sales, provides views (can be large)
 *
 * This pattern allows:
 * - Factory to stay under 24KB limit
 * - Registry to have complex view functions
 * - Both can be upgraded independently
 */
contract FactoryRegistry is Ownable {

    struct SaleInfo {
        uint256 saleId;
        address idoSale;
        address saleToken;
        address creator;
        uint256 createdAt;
        bool active;
    }

    // Factory contract address
    address public factory;

    // All sales
    mapping(uint256 => SaleInfo) public sales;
    uint256 public saleCount;

    // Indices for querying
    mapping(address => uint256[]) public tokenToSales;
    mapping(address => uint256[]) public creatorToSales;
    uint256[] public activeSaleIds;

    // Events
    event SaleRegistered(uint256 indexed saleId, address indexed saleToken, address indexed creator);
    event SaleDeactivated(uint256 indexed saleId);
    event FactoryUpdated(address indexed oldFactory, address indexed newFactory);

    constructor() Ownable(msg.sender) {}

    /**
     * @dev Set factory address (only owner)
     */
    function setFactory(address _factory) external onlyOwner {
        address oldFactory = factory;
        factory = _factory;
        emit FactoryUpdated(oldFactory, _factory);
    }

    /**
     * @dev Register a new sale (only factory)
     */
    function registerSale(
        uint256 _saleId,
        address _idoSale,
        address _saleToken,
        address _creator
    ) external {
        require(msg.sender == factory, "Only factory");

        sales[_saleId] = SaleInfo({
            saleId: _saleId,
            idoSale: _idoSale,
            saleToken: _saleToken,
            creator: _creator,
            createdAt: block.timestamp,
            active: true
        });

        tokenToSales[_saleToken].push(_saleId);
        creatorToSales[_creator].push(_saleId);
        activeSaleIds.push(_saleId);
        saleCount++;

        emit SaleRegistered(_saleId, _saleToken, _creator);
    }

    /**
     * @dev Deactivate a sale (only factory or owner)
     */
    function deactivateSale(uint256 _saleId) external {
        require(msg.sender == factory || msg.sender == owner(), "Unauthorized");
        require(sales[_saleId].active, "Already inactive");

        sales[_saleId].active = false;

        // Remove from active list
        for (uint256 i = 0; i < activeSaleIds.length; i++) {
            if (activeSaleIds[i] == _saleId) {
                activeSaleIds[i] = activeSaleIds[activeSaleIds.length - 1];
                activeSaleIds.pop();
                break;
            }
        }

        emit SaleDeactivated(_saleId);
    }

    // ============ View Functions ============

    function getSale(uint256 _saleId) external view returns (SaleInfo memory) {
        return sales[_saleId];
    }

    function getSalesByToken(address _token) external view returns (uint256[] memory) {
        return tokenToSales[_token];
    }

    function getSalesByCreator(address _creator) external view returns (uint256[] memory) {
        return creatorToSales[_creator];
    }

    function getActiveSales() external view returns (uint256[] memory) {
        return activeSaleIds;
    }

    function getAllSales(uint256 _offset, uint256 _limit)
        external
        view
        returns (SaleInfo[] memory salesPage)
    {
        uint256 end = _offset + _limit;
        if (end > saleCount) {
            end = saleCount;
        }

        uint256 pageSize = end - _offset;
        salesPage = new SaleInfo[](pageSize);

        for (uint256 i = 0; i < pageSize; i++) {
            salesPage[i] = sales[_offset + i];
        }
    }

    function isSaleActive(uint256 _saleId) external view returns (bool) {
        if (_saleId >= saleCount) return false;
        return sales[_saleId].active;
    }
}
