import {
  VestingScheduleCreated,
  TokensClaimed,
  VestingRevoked,
} from "../../generated/templates/VestingManagerV2/VestingManagerV2";
import { VestingSchedule, VestingClaim, Sale } from "../../generated/schema";
import {
  getOrCreateUser,
  createVestingScheduleId,
  createVestingClaimId,
  ZERO_BI,
} from "../helpers";

/**
 * Handle vesting schedule created
 */
export function handleVestingScheduleCreated(event: VestingScheduleCreated): void {
  let user = getOrCreateUser(event.params.beneficiary);

  let scheduleId = createVestingScheduleId(event.address, event.params.beneficiary);
  let schedule = new VestingSchedule(scheduleId);

  // Try to find the sale associated with this vesting manager
  // The vesting manager address should match a sale's vestingManagerAddress
  // For now, we'll set it to the vesting manager address as a placeholder
  // In production, you might want to maintain a mapping
  schedule.sale = event.address.toHexString(); // This needs to be the sale ID

  schedule.beneficiary = user.id;
  schedule.totalAmount = event.params.amount;
  schedule.claimedAmount = ZERO_BI;
  schedule.startTime = event.params.startTime;
  // Calculate cliffEnd and endTime from duration and cliff
  schedule.cliffEnd = event.params.startTime.plus(event.params.cliff);
  schedule.endTime = event.params.startTime.plus(event.params.duration);
  schedule.isRevoked = false;
  schedule.createdAt = event.block.timestamp;

  schedule.save();
}

/**
 * Handle tokens claimed from vesting
 */
export function handleTokensClaimed(event: TokensClaimed): void {
  let user = getOrCreateUser(event.params.beneficiary);
  let scheduleId = createVestingScheduleId(event.address, event.params.beneficiary);
  let schedule = VestingSchedule.load(scheduleId);

  if (schedule == null) return;

  // Create vesting claim
  let claimId = createVestingClaimId(
    event.address,
    event.params.beneficiary,
    event.transaction.hash
  );
  let claim = new VestingClaim(claimId);
  claim.schedule = schedule.id;
  claim.amount = event.params.amount;
  claim.txHash = event.transaction.hash;
  claim.timestamp = event.block.timestamp;
  claim.blockNumber = event.block.number;
  claim.save();

  // Update schedule
  schedule.claimedAmount = schedule.claimedAmount.plus(event.params.amount);
  schedule.save();

  // Update user stats
  user.totalTokensClaimed = user.totalTokensClaimed.plus(event.params.amount);
  user.save();
}

/**
 * Handle vesting revoked
 */
export function handleVestingRevoked(event: VestingRevoked): void {
  let scheduleId = createVestingScheduleId(event.address, event.params.beneficiary);
  let schedule = VestingSchedule.load(scheduleId);

  if (schedule == null) return;

  schedule.isRevoked = true;
  schedule.revokedAt = event.block.timestamp;
  schedule.save();
}
