/**
 * Network-aware configuration utility
 * Provides contract addresses and API endpoints based on the connected chain
 */

import { base, baseSepolia } from 'wagmi/chains';

export type SupportedChainId = typeof base.id | typeof baseSepolia.id;

export interface NetworkConfig {
  chainId: number;
  name: string;
  rpcUrl: string;
  blockExplorer: string;
  contracts: {
    IDOFactory: `0x${string}` | undefined;
    FactoryRegistry: `0x${string}` | undefined;
    IDOSale: `0x${string}` | undefined;
    VestingManager: `0x${string}` | undefined;
    WhitelistManager: `0x${string}` | undefined;
    PulseToken: `0x${string}` | undefined;
    USDC: `0x${string}` | undefined;
  };
  subgraphUrl: string | undefined;
}

/**
 * Get configuration for a specific chain ID
 */
export function getNetworkConfig(chainId: number): NetworkConfig {
  switch (chainId) {
    case baseSepolia.id: // 84532
      return {
        chainId: baseSepolia.id,
        name: 'Base Sepolia',
        rpcUrl: 'https://sepolia.base.org',
        blockExplorer: 'https://sepolia.basescan.org',
        contracts: {
          IDOFactory: process.env.NEXT_PUBLIC_IDO_FACTORY_ADDRESS_SEPOLIA as `0x${string}` | undefined,
          FactoryRegistry: process.env.NEXT_PUBLIC_FACTORY_REGISTRY_ADDRESS_SEPOLIA as `0x${string}` | undefined,
          IDOSale: process.env.NEXT_PUBLIC_IDO_SALE_ADDRESS_SEPOLIA as `0x${string}` | undefined,
          VestingManager: process.env.NEXT_PUBLIC_VESTING_MANAGER_ADDRESS_SEPOLIA as `0x${string}` | undefined,
          WhitelistManager: process.env.NEXT_PUBLIC_WHITELIST_MANAGER_ADDRESS_SEPOLIA as `0x${string}` | undefined,
          PulseToken: process.env.NEXT_PUBLIC_PULSE_TOKEN_ADDRESS_SEPOLIA as `0x${string}` | undefined,
          USDC: (process.env.NEXT_PUBLIC_USDC_ADDRESS_SEPOLIA || '0x036CbD53842c5426634e7929541eC2318f3dCF7e') as `0x${string}`,
        },
        subgraphUrl: process.env.NEXT_PUBLIC_SUBGRAPH_URL_SEPOLIA,
      };

    case base.id: // 8453
      return {
        chainId: base.id,
        name: 'Base Mainnet',
        rpcUrl: 'https://mainnet.base.org',
        blockExplorer: 'https://basescan.org',
        contracts: {
          IDOFactory: process.env.NEXT_PUBLIC_IDO_FACTORY_ADDRESS_MAINNET as `0x${string}` | undefined,
          FactoryRegistry: process.env.NEXT_PUBLIC_FACTORY_REGISTRY_ADDRESS_MAINNET as `0x${string}` | undefined,
          IDOSale: process.env.NEXT_PUBLIC_IDO_SALE_ADDRESS_MAINNET as `0x${string}` | undefined,
          VestingManager: process.env.NEXT_PUBLIC_VESTING_MANAGER_ADDRESS_MAINNET as `0x${string}` | undefined,
          WhitelistManager: process.env.NEXT_PUBLIC_WHITELIST_MANAGER_ADDRESS_MAINNET as `0x${string}` | undefined,
          PulseToken: process.env.NEXT_PUBLIC_PULSE_TOKEN_ADDRESS_MAINNET as `0x${string}` | undefined,
          USDC: (process.env.NEXT_PUBLIC_USDC_ADDRESS_MAINNET || '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913') as `0x${string}`,
        },
        subgraphUrl: process.env.NEXT_PUBLIC_SUBGRAPH_URL_MAINNET,
      };

    default:
      // Default to Base Sepolia for unsupported chains
      console.warn(`Unsupported chain ID: ${chainId}. Falling back to Base Sepolia config.`);
      return getNetworkConfig(baseSepolia.id);
  }
}

/**
 * Get the default network configuration based on NEXT_PUBLIC_DEFAULT_CHAIN_ID
 */
export function getDefaultNetworkConfig(): NetworkConfig {
  const defaultChainId = Number(process.env.NEXT_PUBLIC_DEFAULT_CHAIN_ID) || baseSepolia.id;
  return getNetworkConfig(defaultChainId);
}

/**
 * Check if a chain ID is supported
 */
export function isSupportedChain(chainId: number): chainId is SupportedChainId {
  return chainId === base.id || chainId === baseSepolia.id;
}

/**
 * Get the subgraph URL for a specific chain
 */
export function getSubgraphUrl(chainId: number): string | undefined {
  return getNetworkConfig(chainId).subgraphUrl;
}

/**
 * Get contract addresses for a specific chain
 */
export function getContractAddresses(chainId: number) {
  return getNetworkConfig(chainId).contracts;
}
