import {
  SaleRegistered,
  SaleDeactivated,
} from "../../generated/FactoryRegistry/FactoryRegistry";
import { Sale } from "../../generated/schema";
import { getOrCreateGlobalStats, ONE_BI } from "../helpers";

/**
 * Handle sale registered in registry
 */
export function handleSaleRegistered(event: SaleRegistered): void {
  // Sale entity should already exist from factory event
  // This event is primarily for registry tracking
  // We can update any additional info if needed
}

/**
 * Handle sale deactivated
 */
export function handleSaleDeactivated(event: SaleDeactivated): void {
  // Find sale by saleId
  // We need to look up the sale by its saleId, which is stored in the event
  // For now, we'll mark it as inactive if we can find it
  // Note: This requires iterating or maintaining a mapping

  let stats = getOrCreateGlobalStats();
  stats.activeSales = stats.activeSales.minus(ONE_BI);
  stats.updatedAt = event.block.timestamp;
  stats.save();
}
