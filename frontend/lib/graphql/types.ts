/**
 * TypeScript types for GraphQL responses
 * These match the schema.graphql entities from the subgraph
 */

export interface User {
  id: string;
  address: string;
  totalContributionsETH: string;
  totalContributionsUSDC: string;
  totalTokensPurchased: string;
  totalTokensClaimed: string;
  salesParticipated: string;
}

export interface Token {
  id: string;
  address: string;
  symbol?: string;
  name?: string;
  decimals?: string;
}

export interface Sale {
  id: string;
  saleId: string;
  idoSaleAddress: string;
  vestingManagerAddress: string;
  whitelistManagerAddress: string;
  creator: User;
  saleToken: Token;
  startTime?: string;
  endTime?: string;
  tokenPrice?: string;
  hardCap?: string;
  softCap?: string;
  totalRaised: string;
  totalSold: string;
  isFinalized: boolean;
  active: boolean;
  createdAt: string;
  finalizedAt?: string;
  tiers?: Tier[];
  contributions?: Contribution[];
}

export interface Tier {
  id: string;
  tierId: string;
  startTime: string;
  endTime: string;
  tokenPrice: string;
  maxAllocation: string;
  totalAllocation: string;
  totalContributed: string;
  totalSold: string;
  contributorCount: string;
}

export interface Contribution {
  id: string;
  user: User;
  tier: {
    tierId: string;
  };
  sale?: {
    id: string;
    saleId: string;
    saleToken: {
      symbol?: string;
      name?: string;
    };
  };
  ethAmount: string;
  usdcAmount: string;
  tokensAllocated: string;
  txHash: string;
  timestamp: string;
  blockNumber: string;
}

export interface VestingSchedule {
  id: string;
  sale: {
    id: string;
    saleToken: {
      symbol?: string;
    };
  };
  totalAmount: string;
  claimedAmount: string;
  startTime: string;
  cliffEnd: string;
  endTime: string;
  isRevoked: boolean;
}

export interface DailySaleStats {
  id: string;
  day: string;
  contributionsCount: string;
  totalETH: string;
  totalUSDC: string;
  totalTokensSold: string;
  uniqueContributors: string;
}

export interface GlobalStats {
  totalSales: string;
  activeSales: string;
  totalRaisedETH: string;
  totalRaisedUSDC: string;
  totalTokensSold: string;
  totalUsers: string;
  totalContributions: string;
  updatedAt: string;
}

export interface Factory {
  id: string;
  saleCount: string;
  platformFeeBps: string;
  feeCollector: string;
  usdcToken: string;
  registry: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * Query response types
 */
export interface GetSalesResponse {
  sales: Sale[];
}

export interface GetSaleDetailsResponse {
  sale: Sale | null;
}

export interface GetUserPortfolioResponse {
  user: User & {
    contributions: Contribution[];
    vestingSchedules: VestingSchedule[];
  } | null;
}

export interface GetGlobalStatsResponse {
  globalStats: GlobalStats | null;
}

export interface GetFactoryResponse {
  factory: Factory | null;
}

export interface GetDailyStatsResponse {
  dailySaleStats: DailySaleStats[];
}
