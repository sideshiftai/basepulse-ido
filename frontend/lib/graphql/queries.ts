import { gql } from '@apollo/client';

/**
 * GraphQL Fragments for reusable field sets
 */
export const SALE_FRAGMENT = gql`
  fragment SaleFields on Sale {
    id
    saleId
    idoSaleAddress
    vestingManagerAddress
    whitelistManagerAddress
    creator {
      id
      address
    }
    saleToken {
      id
      address
      symbol
      name
      decimals
    }
    startTime
    endTime
    tokenPrice
    hardCap
    softCap
    totalRaised
    totalSold
    isFinalized
    active
    createdAt
    finalizedAt
  }
`;

export const TIER_FRAGMENT = gql`
  fragment TierFields on Tier {
    id
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
`;

export const CONTRIBUTION_FRAGMENT = gql`
  fragment ContributionFields on Contribution {
    id
    user {
      id
      address
    }
    tier {
      tierId
    }
    ethAmount
    usdcAmount
    tokensAllocated
    txHash
    timestamp
    blockNumber
  }
`;

/**
 * Get factory information
 */
export const GET_FACTORY = gql`
  query GetFactory($id: ID!) {
    factory(id: $id) {
      id
      saleCount
      platformFeeBps
      feeCollector
      usdcToken
      registry
      createdAt
      updatedAt
    }
  }
`;

/**
 * Get all sales with optional filtering
 */
export const GET_SALES = gql`
  ${SALE_FRAGMENT}
  query GetSales(
    $first: Int = 10
    $skip: Int = 0
    $orderBy: Sale_orderBy = createdAt
    $orderDirection: OrderDirection = desc
    $where: Sale_filter
  ) {
    sales(
      first: $first
      skip: $skip
      orderBy: $orderBy
      orderDirection: $orderDirection
      where: $where
    ) {
      ...SaleFields
    }
  }
`;

/**
 * Get a single sale with full details
 */
export const GET_SALE_DETAILS = gql`
  ${SALE_FRAGMENT}
  ${TIER_FRAGMENT}
  ${CONTRIBUTION_FRAGMENT}
  query GetSaleDetails($id: ID!) {
    sale(id: $id) {
      ...SaleFields
      tiers(orderBy: tierId) {
        ...TierFields
      }
      contributions(
        first: 10
        orderBy: timestamp
        orderDirection: desc
      ) {
        ...ContributionFields
      }
    }
  }
`;

/**
 * Get user's portfolio across all sales
 */
export const GET_USER_PORTFOLIO = gql`
  ${CONTRIBUTION_FRAGMENT}
  query GetUserPortfolio($userId: ID!) {
    user(id: $userId) {
      id
      address
      totalContributionsETH
      totalContributionsUSDC
      totalTokensPurchased
      totalTokensClaimed
      salesParticipated
      contributions(
        orderBy: timestamp
        orderDirection: desc
      ) {
        ...ContributionFields
        sale {
          id
          saleId
          saleToken {
            symbol
            name
          }
        }
      }
      vestingSchedules {
        id
        sale {
          id
          saleToken {
            symbol
          }
        }
        totalAmount
        claimedAmount
        startTime
        cliffEnd
        endTime
        isRevoked
      }
    }
  }
`;

/**
 * Get global platform statistics
 */
export const GET_GLOBAL_STATS = gql`
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
`;

/**
 * Get daily statistics for a sale
 */
export const GET_DAILY_STATS = gql`
  query GetDailyStats(
    $saleId: ID!
    $days: Int = 30
  ) {
    dailySaleStats(
      where: { sale: $saleId }
      first: $days
      orderBy: day
      orderDirection: desc
    ) {
      id
      day
      contributionsCount
      totalETH
      totalUSDC
      totalTokensSold
      uniqueContributors
    }
  }
`;

/**
 * Get sales by creator
 */
export const GET_SALES_BY_CREATOR = gql`
  ${SALE_FRAGMENT}
  query GetSalesByCreator($creatorId: ID!) {
    user(id: $creatorId) {
      createdSales(orderBy: createdAt, orderDirection: desc) {
        ...SaleFields
      }
    }
  }
`;

/**
 * Get sales by token
 */
export const GET_SALES_BY_TOKEN = gql`
  ${SALE_FRAGMENT}
  query GetSalesByToken($tokenId: ID!) {
    token(id: $tokenId) {
      id
      address
      symbol
      name
      sales(orderBy: createdAt, orderDirection: desc) {
        ...SaleFields
      }
    }
  }
`;

/**
 * Search for active sales
 */
export const GET_ACTIVE_SALES = gql`
  ${SALE_FRAGMENT}
  query GetActiveSales(
    $first: Int = 10
    $skip: Int = 0
  ) {
    sales(
      first: $first
      skip: $skip
      where: { active: true, isFinalized: false }
      orderBy: createdAt
      orderDirection: desc
    ) {
      ...SaleFields
    }
  }
`;
