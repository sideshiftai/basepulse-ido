import { ApolloClient, InMemoryCache, HttpLink } from '@apollo/client';

// Subgraph endpoint from The Graph Studio
const SUBGRAPH_URL = 'https://api.studio.thegraph.com/query/122132/bpulseido/v0.0.1';

/**
 * Apollo Client for BasePulse IDO Subgraph
 *
 * This client connects to The Graph subgraph to query indexed blockchain data.
 * Benefits:
 * - Fast queries (no RPC calls needed)
 * - Historical data easily accessible
 * - Aggregated statistics
 * - Pagination and filtering built-in
 */
export const apolloClient = new ApolloClient({
  link: new HttpLink({
    uri: SUBGRAPH_URL,
    fetch,
  }),
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
 */
export const apolloClientSSR = new ApolloClient({
  link: new HttpLink({
    uri: SUBGRAPH_URL,
    fetch,
  }),
  cache: new InMemoryCache(),
  ssrMode: true,
});
