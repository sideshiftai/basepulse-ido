// SPDX-License-Identifier: MIT
pragma solidity ^0.8.22;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/**
 * @title VestingManager
 * @dev Manages token vesting schedules with cliff periods and linear release
 *
 * Features:
 * - Cliff period before vesting begins
 * - Linear vesting over specified duration
 * - Multiple beneficiaries support
 * - Revokable vesting schedules (optional)
 * - Batch operations for gas efficiency
 *
 * Vesting Formula:
 * - Before cliff: 0 tokens claimable
 * - After cliff: Linear release over vesting duration
 * - Claimed amount tracked to prevent double claims
 */
contract VestingManager is Ownable, ReentrancyGuard {
    using SafeERC20 for IERC20;

    // ============ Structs ============

    struct VestingSchedule {
        uint256 totalAmount; // Total tokens to be vested
        uint256 claimedAmount; // Tokens already claimed
        uint256 startTime; // Vesting start time (TGE)
        uint256 cliff; // Cliff duration in seconds
        uint256 duration; // Total vesting duration in seconds
        bool revoked; // Whether vesting was revoked
    }

    // ============ State Variables ============

    IERC20 public immutable token; // PULSE token
    mapping(address => VestingSchedule) public vestingSchedules;

    uint256 public totalVested; // Total tokens in vesting
    uint256 public totalClaimed; // Total tokens claimed
    address public idoContract; // IDOSale contract address

    // ============ Events ============

    event VestingScheduleCreated(
        address indexed beneficiary,
        uint256 amount,
        uint256 startTime,
        uint256 cliff,
        uint256 duration
    );

    event TokensClaimed(address indexed beneficiary, uint256 amount);
    event VestingRevoked(address indexed beneficiary, uint256 unvested);
    event IDOContractSet(address idoContract);

    // ============ Errors ============

    error NoVestingSchedule();
    error NothingToClaim();
    error AlreadyRevoked();
    error InvalidSchedule();
    error Unauthorized();

    // ============ Constructor ============

    constructor(address _token) Ownable(msg.sender) {
        require(_token != address(0), "Invalid token address");
        token = IERC20(_token);
    }

    // ============ Admin Functions ============

    function setIDOContract(address _idoContract) external onlyOwner {
        require(_idoContract != address(0), "Invalid IDO contract");
        idoContract = _idoContract;
        emit IDOContractSet(_idoContract);
    }

    function createVestingSchedule(
        address _beneficiary,
        uint256 _amount,
        uint256 _startTime,
        uint256 _cliff,
        uint256 _duration
    ) external {
        require(
            msg.sender == owner() || msg.sender == idoContract,
            "Only owner or IDO contract"
        );
        require(_beneficiary != address(0), "Invalid beneficiary");
        require(_amount > 0, "Amount must be > 0");
        require(_duration > _cliff, "Duration must exceed cliff");
        require(vestingSchedules[_beneficiary].totalAmount == 0, "Schedule exists");

        vestingSchedules[_beneficiary] = VestingSchedule({
            totalAmount: _amount,
            claimedAmount: 0,
            startTime: _startTime,
            cliff: _cliff,
            duration: _duration,
            revoked: false
        });

        totalVested += _amount;

        emit VestingScheduleCreated(_beneficiary, _amount, _startTime, _cliff, _duration);
    }

    function createVestingScheduleBatch(
        address[] calldata _beneficiaries,
        uint256[] calldata _amounts,
        uint256 _startTime,
        uint256 _cliff,
        uint256 _duration
    ) external {
        require(
            msg.sender == owner() || msg.sender == idoContract,
            "Only owner or IDO contract"
        );
        require(_beneficiaries.length == _amounts.length, "Length mismatch");
        require(_duration > _cliff, "Duration must exceed cliff");

        for (uint256 i = 0; i < _beneficiaries.length; i++) {
            address beneficiary = _beneficiaries[i];
            uint256 amount = _amounts[i];

            if (beneficiary == address(0) || amount == 0) continue;
            if (vestingSchedules[beneficiary].totalAmount > 0) continue;

            vestingSchedules[beneficiary] = VestingSchedule({
                totalAmount: amount,
                claimedAmount: 0,
                startTime: _startTime,
                cliff: _cliff,
                duration: _duration,
                revoked: false
            });

            totalVested += amount;

            emit VestingScheduleCreated(beneficiary, amount, _startTime, _cliff, _duration);
        }
    }

    function revokeVesting(address _beneficiary) external onlyOwner {
        VestingSchedule storage schedule = vestingSchedules[_beneficiary];

        if (schedule.totalAmount == 0) revert NoVestingSchedule();
        if (schedule.revoked) revert AlreadyRevoked();

        uint256 vested = _calculateVestedAmount(schedule);
        uint256 unvested = schedule.totalAmount - vested;

        schedule.revoked = true;
        schedule.totalAmount = vested; // Only let them claim what's vested

        if (unvested > 0) {
            totalVested -= unvested;
            // Transfer unvested tokens back to owner
            token.safeTransfer(owner(), unvested);
            emit VestingRevoked(_beneficiary, unvested);
        }
    }

    // ============ Claim Functions ============

    function claim() external nonReentrant {
        VestingSchedule storage schedule = vestingSchedules[msg.sender];

        if (schedule.totalAmount == 0) revert NoVestingSchedule();
        if (schedule.revoked) revert AlreadyRevoked();

        uint256 claimable = getClaimableAmount(msg.sender);
        if (claimable == 0) revert NothingToClaim();

        schedule.claimedAmount += claimable;
        totalClaimed += claimable;

        token.safeTransfer(msg.sender, claimable);

        emit TokensClaimed(msg.sender, claimable);
    }

    function claimFor(address _beneficiary) external nonReentrant {
        VestingSchedule storage schedule = vestingSchedules[_beneficiary];

        if (schedule.totalAmount == 0) revert NoVestingSchedule();
        if (schedule.revoked) revert AlreadyRevoked();

        uint256 claimable = getClaimableAmount(_beneficiary);
        if (claimable == 0) revert NothingToClaim();

        schedule.claimedAmount += claimable;
        totalClaimed += claimable;

        token.safeTransfer(_beneficiary, claimable);

        emit TokensClaimed(_beneficiary, claimable);
    }

    // ============ View Functions ============

    function getClaimableAmount(address _beneficiary) public view returns (uint256) {
        VestingSchedule memory schedule = vestingSchedules[_beneficiary];

        if (schedule.totalAmount == 0 || schedule.revoked) {
            return 0;
        }

        uint256 vested = _calculateVestedAmount(schedule);
        return vested - schedule.claimedAmount;
    }

    function getVestedAmount(address _beneficiary) public view returns (uint256) {
        VestingSchedule memory schedule = vestingSchedules[_beneficiary];

        if (schedule.totalAmount == 0) {
            return 0;
        }

        return _calculateVestedAmount(schedule);
    }

    function _calculateVestedAmount(
        VestingSchedule memory schedule
    ) internal view returns (uint256) {
        if (block.timestamp < schedule.startTime) {
            return 0;
        }

        // Before cliff: nothing vested
        uint256 cliffEnd = schedule.startTime + schedule.cliff;
        if (block.timestamp < cliffEnd) {
            return 0;
        }

        // After duration: fully vested
        uint256 vestingEnd = schedule.startTime + schedule.duration;
        if (block.timestamp >= vestingEnd) {
            return schedule.totalAmount;
        }

        // During vesting: linear release
        uint256 timeFromCliff = block.timestamp - cliffEnd;
        uint256 vestingDuration = schedule.duration - schedule.cliff;

        return (schedule.totalAmount * timeFromCliff) / vestingDuration;
    }

    function getVestingSchedule(
        address _beneficiary
    ) external view returns (VestingSchedule memory) {
        return vestingSchedules[_beneficiary];
    }

    function getVestingInfo(
        address _beneficiary
    )
        external
        view
        returns (
            uint256 total,
            uint256 vested,
            uint256 claimed,
            uint256 claimable,
            uint256 remaining,
            bool revoked
        )
    {
        VestingSchedule memory schedule = vestingSchedules[_beneficiary];

        total = schedule.totalAmount;
        vested = _calculateVestedAmount(schedule);
        claimed = schedule.claimedAmount;
        claimable = vested > claimed ? vested - claimed : 0;
        remaining = total > vested ? total - vested : 0;
        revoked = schedule.revoked;
    }

    function getNextUnlockTime(address _beneficiary) external view returns (uint256) {
        VestingSchedule memory schedule = vestingSchedules[_beneficiary];

        if (schedule.totalAmount == 0) {
            return 0;
        }

        uint256 cliffEnd = schedule.startTime + schedule.cliff;

        // If before cliff, next unlock is at cliff end
        if (block.timestamp < cliffEnd) {
            return cliffEnd;
        }

        // If fully vested, no next unlock
        uint256 vestingEnd = schedule.startTime + schedule.duration;
        if (block.timestamp >= vestingEnd) {
            return 0;
        }

        // During vesting, tokens unlock continuously
        return 0; // Continuous unlock
    }

    function getTimeUntilFullyVested(address _beneficiary) external view returns (uint256) {
        VestingSchedule memory schedule = vestingSchedules[_beneficiary];

        if (schedule.totalAmount == 0) {
            return 0;
        }

        uint256 vestingEnd = schedule.startTime + schedule.duration;

        if (block.timestamp >= vestingEnd) {
            return 0;
        }

        return vestingEnd - block.timestamp;
    }

    // ============ Emergency Functions ============

    function emergencyWithdraw() external onlyOwner {
        uint256 balance = token.balanceOf(address(this));
        if (balance > 0) {
            token.safeTransfer(owner(), balance);
        }
    }
}
