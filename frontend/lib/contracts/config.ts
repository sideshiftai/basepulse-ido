export const CONTRACTS = {
  IDOSale: process.env.NEXT_PUBLIC_IDO_SALE_ADDRESS as `0x${string}`,
  VestingManager: process.env.NEXT_PUBLIC_VESTING_MANAGER_ADDRESS as `0x${string}`,
  WhitelistManager: process.env.NEXT_PUBLIC_WHITELIST_MANAGER_ADDRESS as `0x${string}`,
  PulseToken: process.env.NEXT_PUBLIC_PULSE_TOKEN_ADDRESS as `0x${string}`,
  USDC: process.env.NEXT_PUBLIC_USDC_ADDRESS as `0x${string}`,
} as const;

export const NETWORK = {
  chainId: Number(process.env.NEXT_PUBLIC_DEFAULT_CHAIN_ID) || 84532,
  name: 'Base Sepolia',
  rpcUrl: 'https://sepolia.base.org',
  blockExplorer: 'https://sepolia.basescan.org',
} as const;

export const ADMIN_ADDRESS = process.env.NEXT_PUBLIC_ADMIN_ADDRESS as `0x${string}`;
