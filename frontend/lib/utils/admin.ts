import { ADMIN_ADDRESSES } from '@/lib/contracts/config';

/**
 * Check if an address is an authorized admin/creator
 * @param address - The wallet address to check
 * @returns true if the address is in the admin list, false otherwise
 */
export function isAdmin(address: string | undefined): boolean {
  if (!address) return false;

  const normalizedAddress = address.toLowerCase();
  return ADMIN_ADDRESSES.includes(normalizedAddress);
}

/**
 * Get the list of all admin addresses
 * @returns Array of admin addresses
 */
export function getAdminAddresses(): string[] {
  return ADMIN_ADDRESSES;
}

/**
 * Check if there are any configured admin addresses
 * @returns true if at least one admin is configured
 */
export function hasAdminConfigured(): boolean {
  return ADMIN_ADDRESSES.length > 0;
}
