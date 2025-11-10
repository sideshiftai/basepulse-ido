export const CONTRACTS = {
  // Legacy single sale (for backwards compatibility)
  IDOSale: process.env.NEXT_PUBLIC_IDO_SALE_ADDRESS as `0x${string}`,
  VestingManager: process.env.NEXT_PUBLIC_VESTING_MANAGER_ADDRESS as `0x${string}`,
  WhitelistManager: process.env.NEXT_PUBLIC_WHITELIST_MANAGER_ADDRESS as `0x${string}`,

  // Factory contracts for multi-sale platform
  IDOFactory: process.env.NEXT_PUBLIC_IDO_FACTORY_ADDRESS as `0x${string}` || '0x27Cd6127E787dc96D7d76B9575f900173c2C864E' as `0x${string}`,
  FactoryRegistry: process.env.NEXT_PUBLIC_FACTORY_REGISTRY_ADDRESS as `0x${string}` || '0xF2E34D95412FDbf4606f5880bED7820d00c17D8B' as `0x${string}`,

  // Tokens
  PulseToken: process.env.NEXT_PUBLIC_PULSE_TOKEN_ADDRESS as `0x${string}`,
  USDC: process.env.NEXT_PUBLIC_USDC_ADDRESS as `0x${string}` || '0x036CbD53842c5426634e7929541eC2318f3dCF7e' as `0x${string}`,
} as const;

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
  chainId: Number(process.env.NEXT_PUBLIC_DEFAULT_CHAIN_ID) || 84532,
  name: 'Base Sepolia',
  rpcUrl: 'https://sepolia.base.org',
  blockExplorer: 'https://sepolia.basescan.org',
} as const;
