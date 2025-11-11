import { ApolloClient, InMemoryCache, HttpLink, ApolloLink } from '@apollo/client';
import { getDefaultNetworkConfig } from './network-config';

// Get default subgraph URL from network config
const defaultConfig = getDefaultNetworkConfig();
const SUBGRAPH_URL = defaultConfig.subgraphUrl;

if (!SUBGRAPH_URL) {
  console.error('Subgraph URL is not configured for the selected network. Please check your .env.local file.');
}

/**
 * Create a dynamic link that can switch subgraph URLs based on context
 * This allows us to change the endpoint at runtime based on connected chain
 */
let currentSubgraphUrl = SUBGRAPH_URL;

const dynamicHttpLink = new ApolloLink((operation, forward) => {
  const httpLink = new HttpLink({
    uri: currentSubgraphUrl,
    fetch,
  });
  return httpLink.request(operation, forward);
});

/**
 * Update the subgraph URL at runtime
 * Call this when the user switches networks
 */
export function setSubgraphUrl(url: string | undefined) {
  if (url) {
    currentSubgraphUrl = url;
  } else {
    console.warn('Attempted to set undefined subgraph URL');
  }
}

/**
 * Get the current subgraph URL
 */
export function getCurrentSubgraphUrl() {
  return currentSubgraphUrl;
}

/**
 * Apollo Client for Pulsar IDO Subgraph
 *
 * This client connects to The Graph subgraph to query indexed blockchain data.
 * The endpoint switches automatically based on the connected network.
 *
 * Benefits:
 * - Fast queries (no RPC calls needed)
 * - Historical data easily accessible
 * - Aggregated statistics
 * - Pagination and filtering built-in
 * - Network-aware endpoint switching
 */
export const apolloClient = new ApolloClient({
  link: dynamicHttpLink,
  cache: new InMemoryCache({
    typePolicies: {
      Query: {
        fields: {
          sales: {
            // Merge strategy for paginated sales
            keyArgs: ['where', 'orderBy', 'orderDirection'],
            merge(existing = [], incoming) {
              return [...existing, ...incoming];
            },
          },
        },
      },
    },
  }),
  defaultOptions: {
    watchQuery: {
      fetchPolicy: 'cache-and-network',
      errorPolicy: 'ignore',
    },
    query: {
      fetchPolicy: 'network-only',
      errorPolicy: 'all',
    },
  },
});

/**
 * Lightweight client for SSR/static generation
 * Does not use cache or watch queries
 * Uses the same dynamic link as the main client
 */
export const apolloClientSSR = new ApolloClient({
  link: dynamicHttpLink,
  cache: new InMemoryCache(),
  ssrMode: true,
});
