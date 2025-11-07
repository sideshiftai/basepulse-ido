# BasePulse IDO Subgraph - Complete ✅

**Status**: Built and ready for deployment
**Date**: 2025-11-07
**Phase**: 2 Complete - Subgraph Built
**Location**: `../subgraph/` (sibling to contracts/)

---

## 🎉 Summary

The Graph subgraph has been successfully created and built for the BasePulse IDO Factory system. It indexes all events from the factory, registry, sales, and vesting contracts.

**Note**: The subgraph is now located at the project root as a sibling to `contracts/` for better separation of concerns and following industry best practices.

---

## 📂 Files Created

### Project Structure
```
basepulse-ido/
├── contracts/                  (Smart contracts)
├── subgraph/                   (The Graph indexer) ← New location
│   ├── schema.graphql          ✅ GraphQL schema (15 entities)
│   ├── subgraph.yaml           ✅ Manifest with data sources
│   ├── package.json            ✅ Dependencies
│   ├── tsconfig.json           ✅ TypeScript config
│   ├── README.md               ✅ Documentation
│   │
│   ├── abis/                   ✅ Contract ABIs
│   │   ├── IDOFactory.json
│   │   ├── FactoryRegistry.json
│   │   ├── IDOSaleV2.json
│   │   └── VestingManagerV2.json
│   │
│   └── src/
│       ├── helpers.ts          ✅ Utility functions
│       └── mappings/
│           ├── factory.ts      ✅ Factory events
│           ├── registry.ts     ✅ Registry events
│           ├── ido-sale.ts     ✅ Sale events
│           └── vesting.ts      ✅ Vesting events
└── frontend/                   (Next.js app)
```

---

## 📊 Entities & Schema

### Core Entities

**Factory** (Singleton)
- Tracks total sales, fees, and configuration

**Sale**
- Individual IDO sales with all configuration
- Links to tiers, contributions, claims

**Token**
- ERC20 tokens being sold
- Links to all sales using this token

**User**
- Participants with aggregated statistics
- Links to contributions, claims, vesting

### Sale-Related Entities

**Tier**
- Sale tiers with pricing and allocations
- Tracks contributions per tier

**Contribution**
- Individual user contributions
- ETH/USDC amounts and tokens allocated

**Claim**
- TGE and vested token claims
- Links to user and sale

**VestingSchedule**
- User vesting schedules per sale
- Tracks claimed amounts and timing

### Statistics

**DailySaleStats**
- Daily aggregated metrics per sale
- Contributions, volume, unique users

**GlobalStats**
- Platform-wide statistics
- Total sales, users, volume

---

## 🔧 Event Mappings

### Factory Events
- ✅ `SaleCreated` - New sale deployed
- ✅ `PlatformFeeUpdated` - Fee changes
- ✅ `FeeCollectorUpdated` - Collector changes

### Registry Events
- ✅ `SaleRegistered` - Sale tracked in registry
- ✅ `SaleDeactivated` - Sale marked inactive

### Sale Events
- ✅ `SaleConfigured` - Sale parameters set
- ✅ `TierConfigured` - Tier setup
- ✅ `TokensPurchased` - User contributions
- ✅ `TGEClaimed` - TGE token claims
- ✅ `SaleFinalized` - Sale ended
- ✅ `RefundClaimed` - Refunds processed
- ✅ `WhitelistUpdated` - Whitelist changes
- ✅ `VestingContractSet` - Vesting linked

### Vesting Events
- ✅ `VestingScheduleCreated` - Schedule created
- ✅ `TokensClaimed` - Vesting claims
- ✅ `VestingRevoked` - Schedule cancelled

---

## 🏗️ Architecture

### Data Sources

**Main Contracts** (Base Sepolia)
- IDOFactory: `0x27Cd6127E787dc96D7d76B9575f900173c2C864E`
- FactoryRegistry: `0xF2E34D95412FDbf4606f5880bED7820d00c17D8B`

**Dynamic Templates**
- IDOSaleV2: Created for each sale
- VestingManagerV2: Created for each sale

This architecture allows the subgraph to automatically index new sales as they're created by the factory.

---

## 🚀 Deployment Steps

### 1. Create Subgraph on The Graph Studio

1. Go to [The Graph Studio](https://thegraph.com/studio/)
2. Click "Create a Subgraph"
3. Name: `basepulse-ido`
4. Network: `base-sepolia`
5. Copy your deploy key

### 2. Authenticate

```bash
cd subgraph
graph auth --studio <YOUR_DEPLOY_KEY>
```

### 3. Update Start Block (Optional)

Edit `subgraph.yaml` to set the correct start block:

```yaml
dataSources:
  - kind: ethereum
    name: IDOFactory
    source:
      address: "0x27Cd6127E787dc96D7d76B9575f900173c2C864E"
      startBlock: 18100000  # Update to actual deployment block
```

To find the deployment block:
```bash
# Check BaseScan for factory deployment transaction
https://sepolia.basescan.org/address/0x27Cd6127E787dc96D7d76B9575f900173c2C864E
```

### 4. Deploy

```bash
cd subgraph
graph deploy --studio basepulse-ido
```

### 5. Monitor Indexing

After deployment:
1. Go to your subgraph in Graph Studio
2. Watch the "Indexing Status" section
3. Wait for sync to complete
4. Test queries in the playground

---

## 📝 Example Queries

### Get All Active Sales

```graphql
query GetActiveSales {
  sales(
    where: { active: true, isFinalized: false }
    orderBy: createdAt
    orderDirection: desc
  ) {
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
      totalContributed
    }
  }
}
```

### Get User Portfolio

```graphql
query GetUserPortfolio($userAddress: String!) {
  user(id: $userAddress) {
    address
    totalContributionsETH
    totalContributionsUSDC
    totalTokensPurchased
    totalTokensClaimed
    salesParticipated
    contributions(orderBy: timestamp, orderDirection: desc) {
      sale {
        saleToken {
          symbol
        }
      }
      ethAmount
      usdcAmount
      tokensAllocated
      timestamp
    }
    vestingSchedules {
      totalAmount
      claimedAmount
      cliffEnd
      endTime
    }
  }
}
```

### Get Sale Details with Stats

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

    tiers(orderBy: tierId) {
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

    contributions(
      orderBy: timestamp
      orderDirection: desc
      first: 10
    ) {
      user {
        address
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

### Get Daily Statistics

```graphql
query GetDailyStats($saleAddress: String!) {
  dailySaleStats(
    where: { sale: $saleAddress }
    orderBy: day
    orderDirection: desc
    first: 30
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

---

## 🔍 Query Patterns

### Filtering

```graphql
# By creator
sales(where: { creator: "0x..." })

# By token
sales(where: { saleToken: "0x..." })

# By status
sales(where: { active: true, isFinalized: false })

# By date range
sales(where: { createdAt_gt: 1699304400, createdAt_lt: 1699390800 })
```

### Sorting

```graphql
# Latest sales
sales(orderBy: createdAt, orderDirection: desc)

# Highest raised
sales(orderBy: totalRaised, orderDirection: desc)

# Most contributions
sales(orderBy: totalSold, orderDirection: desc)
```

### Pagination

```graphql
# First page
sales(first: 10, skip: 0)

# Second page
sales(first: 10, skip: 10)

# With ordering
sales(first: 10, skip: 0, orderBy: createdAt, orderDirection: desc)
```

---

## 🧪 Testing Queries Locally

Before deploying, you can test your queries structure:

1. **Build the subgraph**
   ```bash
   npm run build
   ```

2. **Check generated types**
   ```bash
   ls generated/
   ```

3. **Review schema**
   ```bash
   cat schema.graphql
   ```

---

## 📊 Key Features

### Real-time Updates
- ✅ Events indexed as they occur
- ✅ Automatic sale tracking via templates
- ✅ Immediate query access

### Rich Data Model
- ✅ 15 entity types
- ✅ Full relationship mapping
- ✅ Aggregated statistics

### Flexible Queries
- ✅ Filter by any field
- ✅ Sort by multiple criteria
- ✅ Paginate results
- ✅ Full-text search ready

### Performance Optimized
- ✅ Indexed fields
- ✅ Efficient lookups
- ✅ Minimal data duplication

---

## 🔧 Technical Details

### Event Signature Fixes

During development, we fixed event signatures to match the actual contracts:

**SaleConfigured**: 5 params (not 7)
```solidity
event SaleConfigured(uint256,uint256,uint256,uint256,uint256)
```

**TierConfigured**: uint8 for tierId
```solidity
event TierConfigured(indexed uint8,uint256,uint256,uint256,uint256,uint256)
```

**TokensPurchased**: uint8 for tier, includes referrer
```solidity
event TokensPurchased(indexed address,indexed uint8,uint256,uint256,uint256,indexed address)
```

**VestingScheduleCreated**: cliff and duration (not cliffEnd and endTime)
```solidity
event VestingScheduleCreated(indexed address,uint256,uint256,uint256,uint256)
```

### Type Conversions

**uint8 to BigInt**:
```typescript
let tierIdBigInt = BigInt.fromI32(event.params.tier);
```

**Calculated Fields**:
```typescript
schedule.cliffEnd = event.params.startTime.plus(event.params.cliff);
schedule.endTime = event.params.startTime.plus(event.params.duration);
```

---

## ⚠️ Important Notes

### Before Mainnet

1. **Update Addresses**: Change contract addresses in `subgraph.yaml`
2. **Update Network**: Change `base-sepolia` to `base`
3. **Set Start Block**: Use mainnet deployment block
4. **Test Queries**: Verify all queries work as expected

### Known Limitations

- ❗ VestingSchedule.sale currently uses vesting manager address
  - **Fix**: Maintain a mapping from vesting manager to sale
  - **Impact**: Queries joining sale -> vesting schedules won't work perfectly
  - **Workaround**: Query by vesting manager address instead

- ❗ Daily stats don't track unique contributors yet
  - **Status**: Field exists but always 0
  - **Fix**: Implement unique tracking in handler

### Gas Considerations

- Each indexed event costs gas during indexing
- Complex queries may be slow on large datasets
- Consider pagination for production frontends

---

## 📚 Resources

**The Graph**
- [Graph Protocol Docs](https://thegraph.com/docs/)
- [AssemblyScript API](https://thegraph.com/docs/en/developer/assemblyscript-api/)
- [Subgraph Studio](https://thegraph.com/studio/)

**BasePulse IDO**
- Factory: https://sepolia.basescan.org/address/0x27Cd6127E787dc96D7d76B9575f900173c2C864E
- Registry: https://sepolia.basescan.org/address/0xF2E34D95412FDbf4606f5880bED7820d00c17D8B

**Development**
- Full README: `../subgraph/README.md`
- Example queries: See README
- Schema: `../subgraph/schema.graphql`

---

## ✅ Phase 2 Checklist

- [x] Schema designed (15 entities)
- [x] ABIs extracted from contracts
- [x] Helper functions created
- [x] Factory mapping implemented
- [x] Registry mapping implemented
- [x] Sale mapping implemented
- [x] Vesting mapping implemented
- [x] Event signatures fixed
- [x] Type conversions handled
- [x] Build successful
- [ ] Deploy to Graph Studio
- [ ] Verify indexing
- [ ] Test queries

---

## 🎯 Next Steps: Phase 3 (Frontend)

Now that the subgraph is ready, we can proceed with frontend integration:

### Tasks

1. **Install GraphQL Client**
   ```bash
   npm install @apollo/client graphql
   ```

2. **Configure Apollo Client**
   - Set subgraph endpoint
   - Add to React context

3. **Update Frontend Components**
   - Replace contract calls with GraphQL queries
   - Add filtering and sorting
   - Implement pagination

4. **Build Multi-Sale Features**
   - Sale listing page
   - Sale details with stats
   - User dashboard with portfolio

5. **Add Real-time Updates**
   - Polling for new data
   - Optimistic updates
   - Loading states

### Estimated Time
- Apollo setup: 2 hours
- Component updates: 8 hours
- Multi-sale features: 8 hours
- Testing & polish: 4 hours
- **Total: 3-4 days**

---

**Status**: ✅ **Phase 2 Complete - Ready to Deploy Subgraph**

Next: Deploy subgraph to The Graph Studio, then update frontend!
