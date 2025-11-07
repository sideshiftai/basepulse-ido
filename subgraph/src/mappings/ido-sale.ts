import { BigInt } from "@graphprotocol/graph-ts";
import {
  SaleConfigured,
  TierConfigured,
  TokensPurchased,
  TGEClaimed,
  SaleFinalized,
  RefundClaimed,
  WhitelistUpdated,
  VestingContractSet,
} from "../../generated/templates/IDOSaleV2/IDOSaleV2";
import { Sale, Tier, Contribution, Claim, DailySaleStats } from "../../generated/schema";
import {
  getOrCreateUser,
  getOrCreateGlobalStats,
  createTierId,
  createContributionId,
  createClaimId,
  createDailyStatsId,
  getDayId,
  ZERO_BI,
  ONE_BI,
} from "../helpers";

/**
 * Handle sale configuration
 */
export function handleSaleConfigured(event: SaleConfigured): void {
  let sale = Sale.load(event.address.toHexString());
  if (sale == null) return;

  sale.startTime = event.params.startTime;
  sale.endTime = event.params.endTime;
  sale.tokenPrice = event.params.tokenPrice;
  sale.hardCap = event.params.hardCap;
  sale.softCap = event.params.softCap;
  sale.configuredAt = event.block.timestamp;

  sale.save();
}

/**
 * Handle tier configuration
 */
export function handleTierConfigured(event: TierConfigured): void {
  let sale = Sale.load(event.address.toHexString());
  if (sale == null) return;

  // Convert uint8 to BigInt
  let tierIdBigInt = BigInt.fromI32(event.params.tierId);
  let tierId = createTierId(event.address, tierIdBigInt);
  let tier = Tier.load(tierId);

  if (tier == null) {
    tier = new Tier(tierId);
    tier.sale = sale.id;
    tier.tierId = tierIdBigInt;
    tier.totalContributed = ZERO_BI;
    tier.totalSold = ZERO_BI;
    tier.contributorCount = ZERO_BI;
  }

  tier.startTime = event.params.startTime;
  tier.endTime = event.params.endTime;
  tier.tokenPrice = event.params.tokenPrice;
  tier.maxAllocation = event.params.maxAllocation;
  tier.totalAllocation = event.params.totalAllocation;

  tier.save();
}

/**
 * Handle tokens purchased
 */
export function handleTokensPurchased(event: TokensPurchased): void {
  let sale = Sale.load(event.address.toHexString());
  if (sale == null) return;

  let user = getOrCreateUser(event.params.buyer);
  // Convert uint8 tier to BigInt for consistency
  let tierIdBigInt = BigInt.fromI32(event.params.tier);
  let tierId = createTierId(event.address, tierIdBigInt);
  let tier = Tier.load(tierId);

  if (tier == null) return;

  // Create contribution
  let contributionId = createContributionId(
    event.address,
    event.params.buyer,
    tierIdBigInt,
    event.transaction.hash
  );
  let contribution = new Contribution(contributionId);
  contribution.sale = sale.id;
  contribution.tier = tier.id;
  contribution.user = user.id;
  contribution.ethAmount = event.params.ethAmount;
  contribution.usdcAmount = event.params.usdcAmount;
  contribution.tokensAllocated = event.params.tokenAmount;
  contribution.txHash = event.transaction.hash;
  contribution.timestamp = event.block.timestamp;
  contribution.blockNumber = event.block.number;
  contribution.save();

  // Update tier stats
  let totalContributed = event.params.ethAmount.plus(event.params.usdcAmount);
  tier.totalContributed = tier.totalContributed.plus(totalContributed);
  tier.totalSold = tier.totalSold.plus(event.params.tokenAmount);
  tier.contributorCount = tier.contributorCount.plus(ONE_BI);
  tier.save();

  // Update sale stats
  sale.totalRaised = sale.totalRaised.plus(totalContributed);
  sale.totalSold = sale.totalSold.plus(event.params.tokenAmount);
  sale.save();

  // Update user stats
  user.totalContributionsETH = user.totalContributionsETH.plus(event.params.ethAmount);
  user.totalContributionsUSDC = user.totalContributionsUSDC.plus(event.params.usdcAmount);
  user.totalTokensPurchased = user.totalTokensPurchased.plus(event.params.tokenAmount);
  user.save();

  // Update global stats
  let stats = getOrCreateGlobalStats();
  stats.totalRaisedETH = stats.totalRaisedETH.plus(event.params.ethAmount);
  stats.totalRaisedUSDC = stats.totalRaisedUSDC.plus(event.params.usdcAmount);
  stats.totalTokensSold = stats.totalTokensSold.plus(event.params.tokenAmount);
  stats.totalContributions = stats.totalContributions.plus(ONE_BI);
  stats.updatedAt = event.block.timestamp;
  stats.save();

  // Update daily stats
  let dayId = getDayId(event.block.timestamp);
  let dailyStatsId = createDailyStatsId(event.address, dayId);
  let dailyStats = DailySaleStats.load(dailyStatsId);

  if (dailyStats == null) {
    dailyStats = new DailySaleStats(dailyStatsId);
    dailyStats.sale = sale.id;
    dailyStats.day = dayId;
    dailyStats.contributionsCount = ZERO_BI;
    dailyStats.totalETH = ZERO_BI;
    dailyStats.totalUSDC = ZERO_BI;
    dailyStats.totalTokensSold = ZERO_BI;
    dailyStats.uniqueContributors = ZERO_BI;
  }

  dailyStats.contributionsCount = dailyStats.contributionsCount.plus(ONE_BI);
  dailyStats.totalETH = dailyStats.totalETH.plus(event.params.ethAmount);
  dailyStats.totalUSDC = dailyStats.totalUSDC.plus(event.params.usdcAmount);
  dailyStats.totalTokensSold = dailyStats.totalTokensSold.plus(event.params.tokenAmount);
  dailyStats.save();
}

/**
 * Handle TGE claimed
 */
export function handleTGEClaimed(event: TGEClaimed): void {
  let sale = Sale.load(event.address.toHexString());
  if (sale == null) return;

  let user = getOrCreateUser(event.params.user);

  // Create claim
  let claimId = createClaimId(event.address, event.params.user, "TGE", event.transaction.hash);
  let claim = new Claim(claimId);
  claim.sale = sale.id;
  claim.user = user.id;
  claim.claimType = "TGE";
  claim.amount = event.params.amount;
  claim.txHash = event.transaction.hash;
  claim.timestamp = event.block.timestamp;
  claim.blockNumber = event.block.number;
  claim.save();

  // Update user stats
  user.totalTokensClaimed = user.totalTokensClaimed.plus(event.params.amount);
  user.save();
}

/**
 * Handle sale finalized
 */
export function handleSaleFinalized(event: SaleFinalized): void {
  let sale = Sale.load(event.address.toHexString());
  if (sale == null) return;

  sale.isFinalized = true;
  sale.finalizedAt = event.block.timestamp;
  sale.totalRaised = event.params.totalRaised;
  sale.totalSold = event.params.totalSold;
  sale.save();
}

/**
 * Handle refund claimed
 */
export function handleRefundClaimed(event: RefundClaimed): void {
  // Track refunds if needed
  // For now, we'll just log the event
}

/**
 * Handle whitelist updated
 */
export function handleWhitelistUpdated(event: WhitelistUpdated): void {
  // Whitelist update tracking if needed
}

/**
 * Handle vesting contract set
 */
export function handleVestingContractSet(event: VestingContractSet): void {
  let sale = Sale.load(event.address.toHexString());
  if (sale == null) return;

  sale.vestingManagerAddress = event.params.vestingContract;
  sale.save();
}
