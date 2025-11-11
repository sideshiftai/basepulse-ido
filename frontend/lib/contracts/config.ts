import { getDefaultNetworkConfig, getContractAddresses } from '../network-config';

/**
 * Get contracts for the default network
 * This is used during build time and initial load
 */
const defaultConfig = getDefaultNetworkConfig();
const defaultContracts = defaultConfig.contracts;

export const CONTRACTS = {
  // Legacy single sale (for backwards compatibility)
  IDOSale: defaultContracts.IDOSale,
  VestingManager: defaultContracts.VestingManager,
  WhitelistManager: defaultContracts.WhitelistManager,

  // Factory contracts for multi-sale platform
  IDOFactory: defaultContracts.IDOFactory || '0x27Cd6127E787dc96D7d76B9575f900173c2C864E' as `0x${string}`,
  FactoryRegistry: defaultContracts.FactoryRegistry || '0xF2E34D95412FDbf4606f5880bED7820d00c17D8B' as `0x${string}`,

  // Tokens
  PulseToken: defaultContracts.PulseToken,
  USDC: defaultContracts.USDC || '0x036CbD53842c5426634e7929541eC2318f3dCF7e' as `0x${string}`,
} as const;

/**
 * Get contracts for a specific chain ID
 * Use this when you need to access contracts for the currently connected chain
 */
export function getContractsForChain(chainId: number) {
  return getContractAddresses(chainId);
}

// Parse admin addresses from CSV (supports single or multiple addresses)
const parseAdminAddresses = (): string[] => {
  const adminAddressEnv = process.env.NEXT_PUBLIC_ADMIN_ADDRESS;
  if (!adminAddressEnv) return [];

  return adminAddressEnv
    .split(',')
    .map(addr => addr.trim().toLowerCase())
    .filter(addr => addr.length > 0);
};

export const ADMIN_ADDRESSES = parseAdminAddresses();

export const NETWORK = {
  chainId: defaultConfig.chainId,
  name: defaultConfig.name,
  rpcUrl: defaultConfig.rpcUrl,
  blockExplorer: defaultConfig.blockExplorer,
} as const;
