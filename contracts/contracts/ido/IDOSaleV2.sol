// SPDX-License-Identifier: MIT
pragma solidity ^0.8.22;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";

/**
 * @title IDOSaleV2
 * @dev Fixed-price tiered token sale contract for multi-sale platform
 *
 * Changes from IDOSale:
 * - Removed immutable from token variables (set via constructor)
 * - Renamed pulseToken to saleToken (generic name)
 * - Added saleId and factory tracking
 * - Same functionality as IDOSale
 *
 * Features:
 * - 3-tier allocation system (Seed, Private, Public)
 * - Multi-token payments (ETH, USDC)
 * - Whitelist verification via Merkle proofs
 * - Referral bonus system
 * - Vesting integration
 * - Emergency controls
 *
 * Sale Flow:
 * 1. Owner sets sale parameters and whitelist
 * 2. Users contribute during their tier's timeframe
 * 3. Contributions are tracked per user/tier
 * 4. After sale ends, owner finalizes sale
 * 5. Users can claim TGE unlock immediately
 * 6. Vesting begins for remaining allocation
 */
contract IDOSaleV2 is Ownable, ReentrancyGuard, Pausable {
    using SafeERC20 for IERC20;

    // ============ Structs ============

    struct SaleConfig {
        uint256 startTime;
        uint256 endTime;
        uint256 tokenPrice; // Price per token in wei (e.g., 0.0015 USD = 1500000000000000 wei if 1 ETH = $1000)
        uint256 hardCap; // Maximum raise in wei
        uint256 softCap; // Minimum raise for success
        uint256 minContribution; // Minimum contribution per tx
        uint256 maxGasPrice; // Anti-bot: max gas price
    }

    struct TierConfig {
        uint8 tierId; // 1=Seed, 2=Private, 3=Public
        uint256 startTime; // When this tier can start buying
        uint256 endTime; // When this tier must stop
        uint256 tokenPrice; // Price for this tier
        uint256 maxAllocation; // Max tokens per wallet
        uint256 totalAllocation; // Total tokens available for tier
        uint256 tokensSold; // Tokens sold in this tier
    }

    struct UserContribution {
        uint256 totalETH; // Total ETH contributed
        uint256 totalUSDC; // Total USDC contributed
        uint256 totalTokens; // Total tokens allocated
        uint256 claimedTGE; // TGE amount claimed
        uint256 referralBonus; // Bonus tokens from referrals
        address referrer; // Who referred this user
        uint8 tier; // User's tier (0=none, 1-3=tier)
    }

    // ============ State Variables ============

    uint256 public immutable saleId; // Sale ID in factory
    address public immutable factory; // Factory contract address

    IERC20 public saleToken; // Token being sold
    IERC20 public usdcToken; // USDC payment token

    SaleConfig public saleConfig;
    mapping(uint8 => TierConfig) public tiers; // tierId => config
    mapping(address => UserContribution) public contributions;

    uint256 public totalRaisedETH;
    uint256 public totalRaisedUSDC;
    uint256 public totalTokensSold;
    uint256 public totalParticipants;

    bool public saleFinalized;
    bool public refundEnabled; // If soft cap not met

    // Referral system
    uint256 public referralBonusPercent = 10; // 10% bonus for referrals
    mapping(address => uint256) public referralCount;
    mapping(address => uint256) public referralEarnings;

    // Whitelist (Merkle root set by owner)
    bytes32 public whitelistMerkleRoot;

    // Vesting parameters
    uint256 public tgeUnlockPercent = 15; // 15% unlock at TGE
    uint256 public vestingCliff = 90 days; // 3 month cliff
    uint256 public vestingDuration = 365 days; // 12 month total vesting

    address public vestingContract; // VestingManager address

    // ============ Events ============

    event SaleConfigured(
        uint256 startTime,
        uint256 endTime,
        uint256 tokenPrice,
        uint256 hardCap,
        uint256 softCap
    );

    event TierConfigured(
        uint8 indexed tierId,
        uint256 startTime,
        uint256 endTime,
        uint256 tokenPrice,
        uint256 maxAllocation,
        uint256 totalAllocation
    );

    event TokensPurchased(
        address indexed buyer,
        uint8 indexed tier,
        uint256 ethAmount,
        uint256 usdcAmount,
        uint256 tokenAmount,
        address indexed referrer
    );

    event TGEClaimed(address indexed user, uint256 amount);
    event SaleFinalized(uint256 totalRaised, uint256 totalSold);
    event RefundClaimed(address indexed user, uint256 ethAmount, uint256 usdcAmount);
    event WhitelistUpdated(bytes32 merkleRoot);
    event VestingContractSet(address vestingContract);

    // ============ Errors ============

    error SaleNotActive();
    error SaleNotEnded();
    error SaleAlreadyFinalized();
    error SoftCapNotMet();
    error HardCapReached();
    error InvalidTier();
    error NotWhitelisted();
    error AllocationExceeded();
    error InsufficientPayment();
    error InvalidAmount();
    error NoAllocation();
    error AlreadyClaimed();
    error RefundNotAvailable();
    error InvalidReferrer();
    error GasPriceTooHigh();

    // ============ Constructor ============

    constructor(
        uint256 _saleId,
        address _factory,
        address _saleToken,
        address _usdcToken
    ) Ownable(msg.sender) {
        require(_saleToken != address(0), "Invalid sale token address");
        require(_usdcToken != address(0), "Invalid USDC address");
        require(_factory != address(0), "Invalid factory address");

        saleId = _saleId;
        factory = _factory;
        saleToken = IERC20(_saleToken);
        usdcToken = IERC20(_usdcToken);
    }

    // ============ Configuration Functions (Owner Only) ============

    function configureSale(
        uint256 _startTime,
        uint256 _endTime,
        uint256 _tokenPrice,
        uint256 _hardCap,
        uint256 _softCap,
        uint256 _minContribution,
        uint256 _maxGasPrice
    ) external onlyOwner {
        require(_startTime > block.timestamp, "Start time must be future");
        require(_endTime > _startTime, "End time must be after start");
        require(_tokenPrice > 0, "Invalid token price");
        require(_hardCap > _softCap, "Hard cap must exceed soft cap");

        saleConfig = SaleConfig({
            startTime: _startTime,
            endTime: _endTime,
            tokenPrice: _tokenPrice,
            hardCap: _hardCap,
            softCap: _softCap,
            minContribution: _minContribution,
            maxGasPrice: _maxGasPrice
        });

        emit SaleConfigured(_startTime, _endTime, _tokenPrice, _hardCap, _softCap);
    }

    function configureTier(
        uint8 _tierId,
        uint256 _startTime,
        uint256 _endTime,
        uint256 _tokenPrice,
        uint256 _maxAllocation,
        uint256 _totalAllocation
    ) external onlyOwner {
        require(_tierId >= 1 && _tierId <= 3, "Invalid tier ID");
        require(_startTime >= saleConfig.startTime, "Tier start before sale");
        require(_endTime <= saleConfig.endTime, "Tier end after sale");

        tiers[_tierId] = TierConfig({
            tierId: _tierId,
            startTime: _startTime,
            endTime: _endTime,
            tokenPrice: _tokenPrice,
            maxAllocation: _maxAllocation,
            totalAllocation: _totalAllocation,
            tokensSold: 0
        });

        emit TierConfigured(
            _tierId,
            _startTime,
            _endTime,
            _tokenPrice,
            _maxAllocation,
            _totalAllocation
        );
    }

    function setWhitelistMerkleRoot(bytes32 _merkleRoot) external onlyOwner {
        whitelistMerkleRoot = _merkleRoot;
        emit WhitelistUpdated(_merkleRoot);
    }

    function setVestingContract(address _vestingContract) external onlyOwner {
        require(_vestingContract != address(0), "Invalid vesting contract");
        vestingContract = _vestingContract;
        emit VestingContractSet(_vestingContract);
    }

    function setReferralBonus(uint256 _bonusPercent) external onlyOwner {
        require(_bonusPercent <= 20, "Bonus too high"); // Max 20%
        referralBonusPercent = _bonusPercent;
    }

    function setVestingParams(
        uint256 _tgePercent,
        uint256 _cliff,
        uint256 _duration
    ) external onlyOwner {
        require(_tgePercent <= 25, "TGE percent too high"); // Max 25%
        require(_cliff < _duration, "Cliff must be less than duration");

        tgeUnlockPercent = _tgePercent;
        vestingCliff = _cliff;
        vestingDuration = _duration;
    }

    // ============ Purchase Functions ============

    function buyTokensWithETH(
        uint8 _tier,
        bytes32[] calldata _merkleProof,
        address _referrer
    ) external payable nonReentrant whenNotPaused {
        if (tx.gasprice > saleConfig.maxGasPrice && saleConfig.maxGasPrice > 0) {
            revert GasPriceTooHigh();
        }

        _validatePurchase(_tier, _merkleProof);

        uint256 ethAmount = msg.value;
        if (ethAmount < saleConfig.minContribution) revert InsufficientPayment();

        TierConfig storage tier = tiers[_tier];
        uint256 tokenAmount = (ethAmount * 1e18) / tier.tokenPrice;

        _processPurchase(msg.sender, _tier, ethAmount, 0, tokenAmount, _referrer);

        totalRaisedETH += ethAmount;
    }

    function buyTokensWithUSDC(
        uint8 _tier,
        uint256 _usdcAmount,
        bytes32[] calldata _merkleProof,
        address _referrer
    ) external nonReentrant whenNotPaused {
        if (tx.gasprice > saleConfig.maxGasPrice && saleConfig.maxGasPrice > 0) {
            revert GasPriceTooHigh();
        }

        _validatePurchase(_tier, _merkleProof);

        if (_usdcAmount < saleConfig.minContribution) revert InsufficientPayment();

        TierConfig storage tier = tiers[_tier];
        // USDC has 6 decimals, tokens have 18 decimals
        uint256 tokenAmount = (_usdcAmount * 1e18) / tier.tokenPrice;

        // Transfer USDC from buyer
        usdcToken.safeTransferFrom(msg.sender, address(this), _usdcAmount);

        _processPurchase(msg.sender, _tier, 0, _usdcAmount, tokenAmount, _referrer);

        totalRaisedUSDC += _usdcAmount;
    }

    function _validatePurchase(
        uint8 _tier,
        bytes32[] calldata _merkleProof
    ) internal view {
        // Check sale is active
        if (block.timestamp < saleConfig.startTime || block.timestamp > saleConfig.endTime) {
            revert SaleNotActive();
        }

        // Check tier validity
        if (_tier < 1 || _tier > 3) revert InvalidTier();

        TierConfig storage tier = tiers[_tier];

        // Check tier timing
        if (block.timestamp < tier.startTime || block.timestamp > tier.endTime) {
            revert SaleNotActive();
        }

        // Check whitelist
        if (!_verifyWhitelist(msg.sender, _tier, _merkleProof)) {
            revert NotWhitelisted();
        }

        // Check hard cap
        if (totalRaisedETH + totalRaisedUSDC >= saleConfig.hardCap) {
            revert HardCapReached();
        }
    }

    function _processPurchase(
        address _buyer,
        uint8 _tier,
        uint256 _ethAmount,
        uint256 _usdcAmount,
        uint256 _tokenAmount,
        address _referrer
    ) internal {
        UserContribution storage contribution = contributions[_buyer];
        TierConfig storage tier = tiers[_tier];

        // Check allocation limits
        uint256 newTotal = contribution.totalTokens + _tokenAmount;
        if (newTotal > tier.maxAllocation) revert AllocationExceeded();

        // Check tier sold out
        if (tier.tokensSold + _tokenAmount > tier.totalAllocation) {
            revert AllocationExceeded();
        }

        // Handle referral bonus
        uint256 bonusTokens = 0;
        if (_referrer != address(0) && _referrer != _buyer && contributions[_referrer].totalTokens > 0) {
            bonusTokens = (_tokenAmount * referralBonusPercent) / 100;
            contribution.referralBonus += bonusTokens;
            contribution.referrer = _referrer;
            referralCount[_referrer]++;
            referralEarnings[_referrer] += bonusTokens;
        }

        // Update contribution
        contribution.totalETH += _ethAmount;
        contribution.totalUSDC += _usdcAmount;
        contribution.totalTokens += _tokenAmount + bonusTokens;
        if (contribution.tier == 0) {
            contribution.tier = _tier;
            totalParticipants++;
        }

        // Update tier
        tier.tokensSold += _tokenAmount + bonusTokens;
        totalTokensSold += _tokenAmount + bonusTokens;

        emit TokensPurchased(_buyer, _tier, _ethAmount, _usdcAmount, _tokenAmount, _referrer);
    }

    function _verifyWhitelist(
        address _account,
        uint8 _tier,
        bytes32[] calldata _proof
    ) internal view returns (bool) {
        if (whitelistMerkleRoot == bytes32(0)) return true; // No whitelist set

        bytes32 leaf = keccak256(abi.encodePacked(_account, _tier));
        return _verifyProof(_proof, whitelistMerkleRoot, leaf);
    }

    function _verifyProof(
        bytes32[] memory proof,
        bytes32 root,
        bytes32 leaf
    ) internal pure returns (bool) {
        bytes32 computedHash = leaf;

        for (uint256 i = 0; i < proof.length; i++) {
            bytes32 proofElement = proof[i];

            if (computedHash <= proofElement) {
                computedHash = keccak256(abi.encodePacked(computedHash, proofElement));
            } else {
                computedHash = keccak256(abi.encodePacked(proofElement, computedHash));
            }
        }

        return computedHash == root;
    }

    // ============ Claim Functions ============

    function claimTGE() external nonReentrant {
        if (!saleFinalized) revert SaleNotEnded();

        UserContribution storage contribution = contributions[msg.sender];
        if (contribution.totalTokens == 0) revert NoAllocation();
        if (contribution.claimedTGE > 0) revert AlreadyClaimed();

        uint256 tgeAmount = (contribution.totalTokens * tgeUnlockPercent) / 100;
        contribution.claimedTGE = tgeAmount;

        saleToken.safeTransfer(msg.sender, tgeAmount);

        emit TGEClaimed(msg.sender, tgeAmount);
    }

    // ============ Admin Functions ============

    function finalizeSale() external onlyOwner {
        if (block.timestamp < saleConfig.endTime) revert SaleNotEnded();
        if (saleFinalized) revert SaleAlreadyFinalized();

        uint256 totalRaised = totalRaisedETH + totalRaisedUSDC;

        if (totalRaised < saleConfig.softCap) {
            // Enable refunds if soft cap not met
            refundEnabled = true;
        } else {
            // Transfer remaining tokens to vesting contract
            if (vestingContract != address(0)) {
                uint256 vestingAmount = totalTokensSold - ((totalTokensSold * tgeUnlockPercent) / 100);
                saleToken.safeTransfer(vestingContract, vestingAmount);
            }
        }

        saleFinalized = true;
        emit SaleFinalized(totalRaised, totalTokensSold);
    }

    function claimRefund() external nonReentrant {
        if (!refundEnabled) revert RefundNotAvailable();

        UserContribution storage contribution = contributions[msg.sender];
        if (contribution.totalETH == 0 && contribution.totalUSDC == 0) revert NoAllocation();

        uint256 ethRefund = contribution.totalETH;
        uint256 usdcRefund = contribution.totalUSDC;

        contribution.totalETH = 0;
        contribution.totalUSDC = 0;
        contribution.totalTokens = 0;

        if (ethRefund > 0) {
            (bool success, ) = msg.sender.call{value: ethRefund}("");
            require(success, "ETH refund failed");
        }

        if (usdcRefund > 0) {
            usdcToken.safeTransfer(msg.sender, usdcRefund);
        }

        emit RefundClaimed(msg.sender, ethRefund, usdcRefund);
    }

    function emergencyWithdraw() external onlyOwner {
        uint256 ethBalance = address(this).balance;
        uint256 usdcBalance = usdcToken.balanceOf(address(this));
        uint256 tokenBalance = saleToken.balanceOf(address(this));

        if (ethBalance > 0) {
            (bool success, ) = owner().call{value: ethBalance}("");
            require(success, "ETH withdrawal failed");
        }

        if (usdcBalance > 0) {
            usdcToken.safeTransfer(owner(), usdcBalance);
        }

        if (tokenBalance > 0) {
            saleToken.safeTransfer(owner(), tokenBalance);
        }
    }

    function pause() external onlyOwner {
        _pause();
    }

    function unpause() external onlyOwner {
        _unpause();
    }

    // ============ View Functions ============

    function getUserContribution(address _user) external view returns (UserContribution memory) {
        return contributions[_user];
    }

    function getTierConfig(uint8 _tierId) external view returns (TierConfig memory) {
        return tiers[_tierId];
    }

    function isSaleActive() public view returns (bool) {
        return block.timestamp >= saleConfig.startTime &&
               block.timestamp <= saleConfig.endTime &&
               !paused() &&
               totalRaisedETH + totalRaisedUSDC < saleConfig.hardCap;
    }

    function getTotalRaised() external view returns (uint256) {
        return totalRaisedETH + totalRaisedUSDC;
    }

    receive() external payable {
        revert("Use buyTokensWithETH");
    }
}
