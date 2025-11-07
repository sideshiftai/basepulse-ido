# BasePulse IDO Subgraph

The Graph subgraph for indexing BasePulse IDO Factory events on Base Sepolia.

## Overview

This subgraph indexes all events from the BasePulse IDO Factory system, including:
- Factory contract events (sale creation, fee updates)
- Registry events (sale registration, deactivation)
- Individual sale events (purchases, claims, configuration)
- Vesting events (schedule creation, claims)

## Entities

### Core Entities
- **Factory** - The factory contract singleton
- **Sale** - Individual IDO sales
- **Token** - ERC20 tokens being sold
- **User** - Participants in IDO sales

### Sale-Related Entities
- **Tier** - Sale tiers with different pricing
- **Contribution** - User contributions to tiers
- **Claim** - TGE and vested token claims
- **VestingSchedule** - User vesting schedules
- **VestingClaim** - Individual vesting claims

### Statistics
- **DailySaleStats** - Daily aggregated statistics per sale
- **GlobalStats** - Overall platform statistics

## Setup

### 1. Install Dependencies

```bash
cd subgraph
npm install
```

### 2. Update Contract Addresses

Edit `subgraph.yaml` and update the contract addresses:

```yaml
dataSources:
  - kind: ethereum
    name: IDOFactory
    source:
      address: "0x27Cd6127E787dc96D7d76B9575f900173c2C864E"  # Update this
      startBlock: 18000000  # Update to deployment block
```

### 3. Generate Types

```bash
npm run codegen
```

This generates TypeScript types from your GraphQL schema and ABIs.

### 4. Build Subgraph

```bash
npm run build
```

## Deployment

### The Graph Studio (Recommended)

1. **Create Subgraph**
   - Go to [The Graph Studio](https://thegraph.com/studio/)
   - Create new subgraph
   - Get your deploy key

2. **Authenticate**
   ```bash
   graph auth <DEPLOY_KEY>
   ```

3. **Deploy**
   ```bash
   graph deploy bpulseido
   ```

### Hosted Service (Legacy)

1. **Create Subgraph**
   ```bash
   graph create --node https://api.thegraph.com/deploy/ your-github-username/basepulse-ido
   ```

2. **Deploy**
   ```bash
   graph deploy --node https://api.thegraph.com/deploy/ --ipfs https://api.thegraph.com/ipfs/ your-github-username/basepulse-ido
   ```

### Local Graph Node (Development)

1. **Start Graph Node**
   ```bash
   docker-compose up
   ```

2. **Create Local Subgraph**
   ```bash
   npm run create-local
   ```

3. **Deploy Locally**
   ```bash
   npm run deploy-local
   ```

## Example Queries

### Get All Active Sales

```graphql
query GetActiveSales {
  sales(where: { active: true, isFinalized: false }) {
    id
    saleId
    creator {
      address
    }
    saleToken {
      name
      symbol
    }
    totalRaised
    totalSold
    startTime
    endTime
    tiers {
      tierId
      tokenPrice
      totalAllocation
    }
  }
}
```

### Get User Contributions

```graphql
query GetUserContributions($userAddress: String!) {
  user(id: $userAddress) {
    address
    totalContributionsETH
    totalContributionsUSDC
    totalTokensPurchased
    totalTokensClaimed
    contributions {
      sale {
        saleToken {
          symbol
        }
      }
      tier {
        tierId
      }
      ethAmount
      usdcAmount
      tokensAllocated
      timestamp
    }
  }
}
```

### Get Sale Details

```graphql
query GetSaleDetails($saleAddress: String!) {
  sale(id: $saleAddress) {
    saleId
    creator {
      address
    }
    saleToken {
      name
      symbol
      address
    }
    startTime
    endTime
    tokenPrice
    hardCap
    softCap
    totalRaised
    totalSold
    isFinalized
    tiers {
      tierId
      startTime
      endTime
      tokenPrice
      maxAllocation
      totalAllocation
      totalContributed
      totalSold
      contributorCount
    }
    contributions {
      user {
        address
      }
      tier {
        tierId
      }
      ethAmount
      usdcAmount
      tokensAllocated
      timestamp
    }
  }
}
```

### Get Global Statistics

```graphql
query GetGlobalStats {
  globalStats(id: "global") {
    totalSales
    activeSales
    totalRaisedETH
    totalRaisedUSDC
    totalTokensSold
    totalUsers
    totalContributions
    updatedAt
  }
}
```

### Get Daily Sale Stats

```graphql
query GetDailySaleStats($saleAddress: String!, $days: Int!) {
  dailySaleStats(
    where: { sale: $saleAddress }
    orderBy: day
    orderDirection: desc
    first: $days
  ) {
    day
    contributionsCount
    totalETH
    totalUSDC
    totalTokensSold
    uniqueContributors
  }
}
```

### Get User Vesting Schedule

```graphql
query GetUserVesting($vestingScheduleId: String!) {
  vestingSchedule(id: $vestingScheduleId) {
    beneficiary {
      address
    }
    totalAmount
    claimedAmount
    startTime
    cliffEnd
    endTime
    isRevoked
    claims {
      amount
      timestamp
    }
  }
}
```

### Get Factory Info

```graphql
query GetFactory($factoryAddress: String!) {
  factory(id: $factoryAddress) {
    saleCount
    platformFeeBps
    feeCollector
    usdcToken
    sales(orderBy: createdAt, orderDirection: desc) {
      saleId
      creator {
        address
      }
      saleToken {
        symbol
      }
      totalRaised
      totalSold
      isFinalized
      createdAt
    }
  }
}
```

## Filtering & Pagination

### Filter by Creator

```graphql
query GetSalesByCreator($creatorAddress: String!) {
  sales(where: { creator: $creatorAddress }) {
    id
    saleId
    saleToken {
      symbol
    }
    totalRaised
    createdAt
  }
}
```

### Filter by Token

```graphql
query GetSalesByToken($tokenAddress: String!) {
  token(id: $tokenAddress) {
    name
    symbol
    sales {
      saleId
      creator {
        address
      }
      totalRaised
      totalSold
    }
  }
}
```

### Pagination

```graphql
query GetSalesPaginated($skip: Int!, $first: Int!) {
  sales(
    skip: $skip
    first: $first
    orderBy: createdAt
    orderDirection: desc
  ) {
    id
    saleId
    creator {
      address
    }
    totalRaised
    createdAt
  }
}
```

## Development

### Running Codegen

After making changes to `schema.graphql`:

```bash
npm run codegen
```

### Building

```bash
npm run build
```

### Deploying

```bash
npm run deploy
```

## Troubleshooting

### Build Errors

If you encounter build errors:
1. Check that all ABIs are in `abis/` directory
2. Run `npm run codegen` to regenerate types
3. Verify event signatures match contracts

### Indexing Issues

If indexing fails:
1. Check contract addresses in `subgraph.yaml`
2. Verify start block is before contract deployment
3. Check network name matches (`base-sepolia`)
4. Review logs in Graph Studio

### Missing Data

If data isn't appearing:
1. Verify events are being emitted
2. Check contract is verified on BaseScan
3. Wait for indexing to catch up
4. Query recent blocks to test

## Contract Addresses (Base Sepolia)

```
IDOFactory: 0x27Cd6127E787dc96D7d76B9575f900173c2C864E
FactoryRegistry: 0xF2E34D95412FDbf4606f5880bED7820d00c17D8B
USDC: 0x036CbD53842c5426634e7929541eC2318f3dCF7e
```

## Resources

- [The Graph Documentation](https://thegraph.com/docs/)
- [AssemblyScript API](https://thegraph.com/docs/en/developer/assemblyscript-api/)
- [Subgraph Studio](https://thegraph.com/studio/)
- [BaseScan](https://sepolia.basescan.org/)

## License

MIT
