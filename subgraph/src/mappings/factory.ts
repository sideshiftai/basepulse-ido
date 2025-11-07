import { BigInt, Bytes, DataSourceContext } from "@graphprotocol/graph-ts";
import {
  SaleCreated,
  PlatformFeeUpdated,
  FeeCollectorUpdated,
} from "../../generated/IDOFactory/IDOFactory";
import { IDOSaleV2 as IDOSaleTemplate } from "../../generated/templates";
import { VestingManagerV2 as VestingTemplate } from "../../generated/templates";
import { Sale } from "../../generated/schema";
import {
  getOrCreateFactory,
  getOrCreateUser,
  getOrCreateToken,
  getOrCreateGlobalStats,
  ZERO_BI,
  ONE_BI,
} from "../helpers";

/**
 * Handle new sale created by factory
 */
export function handleSaleCreated(event: SaleCreated): void {
  let factory = getOrCreateFactory(event.address);

  // Create Sale entity
  let sale = new Sale(event.params.idoSale.toHexString());
  sale.saleId = event.params.saleId;
  sale.factory = factory.id;
  sale.idoSaleAddress = event.params.idoSale;
  sale.vestingManagerAddress = event.params.vestingManager;
  sale.whitelistManagerAddress = event.params.whitelistManager;

  // Set creator
  let creator = getOrCreateUser(event.params.creator);
  sale.creator = creator.id;

  // Set token
  let token = getOrCreateToken(event.params.saleToken);
  sale.saleToken = token.id;

  // Initialize sale state
  sale.totalRaised = ZERO_BI;
  sale.totalSold = ZERO_BI;
  sale.isFinalized = false;
  sale.active = true;
  sale.createdAt = event.block.timestamp;

  sale.save();

  // Update factory
  factory.saleCount = factory.saleCount.plus(ONE_BI);
  factory.updatedAt = event.block.timestamp;
  factory.save();

  // Update global stats
  let stats = getOrCreateGlobalStats();
  stats.totalSales = stats.totalSales.plus(ONE_BI);
  stats.activeSales = stats.activeSales.plus(ONE_BI);
  stats.updatedAt = event.block.timestamp;
  stats.save();

  // Create data source for IDO Sale
  IDOSaleTemplate.create(event.params.idoSale);

  // Create data source for Vesting Manager
  VestingTemplate.create(event.params.vestingManager);
}

/**
 * Handle platform fee update
 */
export function handlePlatformFeeUpdated(event: PlatformFeeUpdated): void {
  let factory = getOrCreateFactory(event.address);
  factory.platformFeeBps = event.params.newFee;
  factory.updatedAt = event.block.timestamp;
  factory.save();
}

/**
 * Handle fee collector update
 */
export function handleFeeCollectorUpdated(event: FeeCollectorUpdated): void {
  let factory = getOrCreateFactory(event.address);
  factory.feeCollector = event.params.newCollector;
  factory.updatedAt = event.block.timestamp;
  factory.save();
}
