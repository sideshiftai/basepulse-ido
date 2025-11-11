# Multi-Network Setup Guide

This guide explains how to configure and use the Pulsar IDO frontend with multiple networks (Base Sepolia and Base Mainnet).

## Overview

The frontend now supports automatic network switching between:
- **Base Sepolia** (Chain ID: 84532) - Testnet
- **Base Mainnet** (Chain ID: 8453) - Production

When users switch networks in their wallet, the app automatically:
- Updates contract addresses
- Switches to the correct subgraph endpoint
- Displays network-specific data

## Environment Configuration

### 1. Network-Specific Environment Variables

Each network requires its own set of contract addresses and subgraph URL. Update your `.env.local` file:

```env
# ============================================
# Base Sepolia (Testnet) Configuration
# ============================================

# Factory Contracts (Sepolia)
NEXT_PUBLIC_IDO_FACTORY_ADDRESS_SEPOLIA=0x27Cd6127E787dc96D7d76B9575f900173c2C864E
NEXT_PUBLIC_FACTORY_REGISTRY_ADDRESS_SEPOLIA=0xF2E34D95412FDbf4606f5880bED7820d00c17D8B

# Legacy Contract Addresses (Sepolia)
NEXT_PUBLIC_IDO_SALE_ADDRESS_SEPOLIA=0x1a3f2F6A5D1d88c5c34c37c86FB08E446F8856e0
NEXT_PUBLIC_VESTING_MANAGER_ADDRESS_SEPOLIA=0x7119eEdAd84C6A79ea7aB7Cd1EA68feA6e0865Ed
NEXT_PUBLIC_WHITELIST_MANAGER_ADDRESS_SEPOLIA=0x23044915b2922847950737c8dF5fCCaebCFe6ECe
NEXT_PUBLIC_PULSE_TOKEN_ADDRESS_SEPOLIA=0x19821658D5798976152146d1c1882047670B898c

# Token Addresses (Sepolia)
NEXT_PUBLIC_USDC_ADDRESS_SEPOLIA=0x036CbD53842c5426634e7929541eC2318f3dCF7e

# Subgraph URL (Sepolia)
NEXT_PUBLIC_SUBGRAPH_URL_SEPOLIA=https://api.studio.thegraph.com/query/1715423/bpulseido-sepolia/v0.0.1

# ============================================
# Base Mainnet (Production) Configuration
# ============================================

# Factory Contracts (Mainnet)
NEXT_PUBLIC_IDO_FACTORY_ADDRESS_MAINNET=your_mainnet_factory_address
NEXT_PUBLIC_FACTORY_REGISTRY_ADDRESS_MAINNET=your_mainnet_registry_address

# Legacy Contract Addresses (Mainnet)
NEXT_PUBLIC_IDO_SALE_ADDRESS_MAINNET=your_mainnet_sale_address
NEXT_PUBLIC_VESTING_MANAGER_ADDRESS_MAINNET=your_mainnet_vesting_address
NEXT_PUBLIC_WHITELIST_MANAGER_ADDRESS_MAINNET=your_mainnet_whitelist_address
NEXT_PUBLIC_PULSE_TOKEN_ADDRESS_MAINNET=your_mainnet_pulse_address

# Token Addresses (Mainnet)
NEXT_PUBLIC_USDC_ADDRESS_MAINNET=0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913

# Subgraph URL (Mainnet)
NEXT_PUBLIC_SUBGRAPH_URL_MAINNET=your_mainnet_subgraph_url
```

### 2. Default Network Configuration

Set which network to use by default:

```env
# Network Configuration
NEXT_PUBLIC_DEFAULT_CHAIN_ID=84532  # 84532 for Sepolia, 8453 for Mainnet

# Enable mainnet features (set to true to show mainnet in network selector)
NEXT_PUBLIC_ENABLE_MAINNET=false
```

## Using Network-Aware Features

### 1. Network Configuration Hook

Use the `useNetworkConfig()` hook to access network-specific configuration:

```typescript
import { useNetworkConfig } from '@/lib/hooks/use-network-config';

function MyComponent() {
  const config = useNetworkConfig();

  console.log(config.chainId);        // Current chain ID
  console.log(config.name);           // Network name
  console.log(config.contracts);      // Contract addresses for current network
  console.log(config.subgraphUrl);    // Subgraph URL for current network
  console.log(config.isSupported);    // Whether the network is supported
  console.log(config.isTestnet);      // True if Base Sepolia
  console.log(config.isMainnet);      // True if Base Mainnet
}
```

### 2. Contract Addresses Hook

Get contract addresses for the current network:

```typescript
import { useContractAddresses } from '@/lib/hooks/use-network-config';

function MyComponent() {
  const contracts = useContractAddresses();

  const { IDOFactory, FactoryRegistry, USDC } = contracts;
}
```

### 3. Subgraph URL Hook

Get the subgraph URL for the current network:

```typescript
import { useSubgraphUrl } from '@/lib/hooks/use-network-config';

function MyComponent() {
  const subgraphUrl = useSubgraphUrl();
}
```

## UI Components

### 1. Network Guard

Wrap your app with `NetworkGuard` to show a warning when users are on an unsupported network:

```typescript
import { NetworkGuard } from '@/components/network-guard';

export default function Layout({ children }) {
  return (
    <NetworkGuard>
      {children}
    </NetworkGuard>
  );
}
```

### 2. Network Indicator

Show the current network in your UI:

```typescript
import { NetworkIndicator } from '@/components/network-indicator';

export default function Header() {
  return (
    <header>
      <NetworkIndicator />
    </header>
  );
}
```

## How It Works

### 1. Network Detection

The app uses wagmi's `useChainId()` hook to detect the current network.

### 2. Configuration Switching

When the network changes:
1. `useNetworkConfig()` hook detects the change
2. Calls `getNetworkConfig(chainId)` to get network-specific config
3. Updates Apollo client subgraph URL via `setSubgraphUrl()`
4. Components re-render with new configuration

### 3. Contract Interactions

All contract hooks automatically use the addresses for the connected network:

```typescript
import { useReadContract } from 'wagmi';
import { useContractAddresses } from '@/lib/hooks/use-network-config';

function MyComponent() {
  const { IDOFactory } = useContractAddresses();

  const { data } = useReadContract({
    address: IDOFactory, // Automatically uses correct address for current network
    abi: FACTORY_ABI,
    functionName: 'getAllSales',
  });
}
```

### 4. GraphQL Queries

Apollo client automatically queries the correct subgraph:

```typescript
import { useQuery } from '@apollo/client';
import { GET_SALES } from '@/lib/graphql/queries';

function MyComponent() {
  // Automatically queries the correct subgraph for the current network
  const { data } = useQuery(GET_SALES);
}
```

## Deployment Checklist

### Before deploying to mainnet:

1. ✅ Deploy contracts to Base Mainnet
2. ✅ Deploy subgraph to The Graph (mainnet)
3. ✅ Update `.env.local` with mainnet addresses:
   - Factory contracts
   - Token addresses
   - Subgraph URL
4. ✅ Set `NEXT_PUBLIC_ENABLE_MAINNET=true`
5. ✅ Test network switching in your wallet
6. ✅ Verify contract interactions work on both networks
7. ✅ Verify subgraph queries work on both networks

## Troubleshooting

### Subgraph queries failing

Check that the subgraph URL is correct for the current network:
```typescript
import { getCurrentSubgraphUrl } from '@/lib/apollo-client';

console.log('Current subgraph URL:', getCurrentSubgraphUrl());
```

### Contract calls failing

Verify the contract address is set for the current network:
```typescript
import { useContractAddresses } from '@/lib/hooks/use-network-config';

const contracts = useContractAddresses();
console.log('IDOFactory address:', contracts.IDOFactory);
```

### Wrong network detected

Check `NEXT_PUBLIC_DEFAULT_CHAIN_ID` in `.env.local` matches your wallet's network.

## Manual Network Switching

You can manually get configuration for any supported network:

```typescript
import { getNetworkConfig } from '@/lib/network-config';
import { baseSepolia, base } from 'wagmi/chains';

// Get Sepolia config
const sepoliaConfig = getNetworkConfig(baseSepolia.id);

// Get Mainnet config
const mainnetConfig = getNetworkConfig(base.id);
```

## Testing

Test network switching:

1. Connect wallet to Base Sepolia
2. Verify app shows "Base Sepolia (Testnet)" badge
3. Create a test transaction
4. Switch wallet to Base Mainnet (if enabled)
5. Verify app shows "Base Mainnet" badge
6. Verify contract addresses changed
7. Verify subgraph queries go to mainnet endpoint
