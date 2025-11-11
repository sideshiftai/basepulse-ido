/**
 * Hook to access network-aware configuration
 * Automatically updates when user switches networks
 */

'use client';

import { useEffect, useMemo } from 'react';
import { useChainId } from 'wagmi';
import { getNetworkConfig, isSupportedChain } from '../network-config';
import { setSubgraphUrl } from '../apollo-client';

/**
 * Hook to get the current network configuration
 * Automatically switches configuration when the user changes networks
 */
export function useNetworkConfig() {
  const chainId = useChainId();

  // Get the network configuration for the current chain
  const config = useMemo(() => {
    return getNetworkConfig(chainId);
  }, [chainId]);

  // Update Apollo client subgraph URL when network changes
  useEffect(() => {
    if (config.subgraphUrl) {
      setSubgraphUrl(config.subgraphUrl);
    } else {
      console.warn(`No subgraph URL configured for chain ${chainId}`);
    }
  }, [config.subgraphUrl, chainId]);

  const isSupported = isSupportedChain(chainId);

  return {
    ...config,
    isSupported,
    isTestnet: chainId === 84532, // Base Sepolia
    isMainnet: chainId === 8453,  // Base Mainnet
  };
}

/**
 * Hook to get contract addresses for the current network
 */
export function useContractAddresses() {
  const { contracts } = useNetworkConfig();
  return contracts;
}

/**
 * Hook to get the subgraph URL for the current network
 */
export function useSubgraphUrl() {
  const { subgraphUrl } = useNetworkConfig();
  return subgraphUrl;
}
