import { BigInt, Bytes, Address } from "@graphprotocol/graph-ts";
import { Factory, Sale, User, Token, GlobalStats } from "../generated/schema";

export const ZERO_BI = BigInt.fromI32(0);
export const ONE_BI = BigInt.fromI32(1);
export const ZERO_ADDRESS = "0x0000000000000000000000000000000000000000";

/**
 * Get or create Factory entity
 */
export function getOrCreateFactory(address: Address): Factory {
  let factory = Factory.load(address.toHexString());

  if (factory == null) {
    factory = new Factory(address.toHexString());
    factory.saleCount = ZERO_BI;
    factory.platformFeeBps = BigInt.fromI32(250); // Default 2.5%
    factory.feeCollector = Bytes.fromHexString(ZERO_ADDRESS);
    factory.usdcToken = Bytes.fromHexString(ZERO_ADDRESS);
    factory.registry = Bytes.fromHexString(ZERO_ADDRESS);
    factory.createdAt = ZERO_BI;
    factory.updatedAt = ZERO_BI;
    factory.save();
  }

  return factory;
}

/**
 * Get or create User entity
 */
export function getOrCreateUser(address: Address): User {
  let user = User.load(address.toHexString());

  if (user == null) {
    user = new User(address.toHexString());
    user.address = address;
    user.totalContributionsETH = ZERO_BI;
    user.totalContributionsUSDC = ZERO_BI;
    user.totalTokensPurchased = ZERO_BI;
    user.totalTokensClaimed = ZERO_BI;
    user.salesParticipated = ZERO_BI;
    user.save();

    // Update global stats
    let stats = getOrCreateGlobalStats();
    stats.totalUsers = stats.totalUsers.plus(ONE_BI);
    stats.save();
  }

  return user;
}

/**
 * Get or create Token entity
 */
export function getOrCreateToken(address: Address): Token {
  let token = Token.load(address.toHexString());

  if (token == null) {
    token = new Token(address.toHexString());
    token.address = address;
    token.save();
  }

  return token;
}

/**
 * Get or create Global Stats
 */
export function getOrCreateGlobalStats(): GlobalStats {
  let stats = GlobalStats.load("global");

  if (stats == null) {
    stats = new GlobalStats("global");
    stats.totalSales = ZERO_BI;
    stats.activeSales = ZERO_BI;
    stats.totalRaisedETH = ZERO_BI;
    stats.totalRaisedUSDC = ZERO_BI;
    stats.totalTokensSold = ZERO_BI;
    stats.totalUsers = ZERO_BI;
    stats.totalContributions = ZERO_BI;
    stats.updatedAt = ZERO_BI;
    stats.save();
  }

  return stats;
}

/**
 * Get day ID from timestamp
 */
export function getDayId(timestamp: BigInt): BigInt {
  return timestamp.div(BigInt.fromI32(86400));
}

/**
 * Create sale ID from address and tier
 */
export function createTierId(saleAddress: Address, tierId: BigInt): string {
  return saleAddress.toHexString() + "-" + tierId.toString();
}

/**
 * Create contribution ID
 */
export function createContributionId(
  saleAddress: Address,
  userAddress: Address,
  tierId: BigInt,
  txHash: Bytes
): string {
  return (
    saleAddress.toHexString() +
    "-" +
    userAddress.toHexString() +
    "-" +
    tierId.toString() +
    "-" +
    txHash.toHexString()
  );
}

/**
 * Create claim ID
 */
export function createClaimId(
  saleAddress: Address,
  userAddress: Address,
  claimType: string,
  txHash: Bytes
): string {
  return (
    saleAddress.toHexString() +
    "-" +
    userAddress.toHexString() +
    "-" +
    claimType +
    "-" +
    txHash.toHexString()
  );
}

/**
 * Create vesting schedule ID
 */
export function createVestingScheduleId(
  vestingManager: Address,
  beneficiary: Address
): string {
  return vestingManager.toHexString() + "-" + beneficiary.toHexString();
}

/**
 * Create vesting claim ID
 */
export function createVestingClaimId(
  vestingManager: Address,
  beneficiary: Address,
  txHash: Bytes
): string {
  return (
    vestingManager.toHexString() +
    "-" +
    beneficiary.toHexString() +
    "-" +
    txHash.toHexString()
  );
}

/**
 * Create daily stats ID
 */
export function createDailyStatsId(saleAddress: Address, day: BigInt): string {
  return saleAddress.toHexString() + "-" + day.toString();
}
