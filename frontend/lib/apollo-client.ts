import { ApolloClient, InMemoryCache, HttpLink } from '@apollo/client';

// Subgraph endpoint from The Graph Studio
// Configure via NEXT_PUBLIC_SUBGRAPH_URL environment variable
const SUBGRAPH_URL = process.env.NEXT_PUBLIC_SUBGRAPH_URL;

if (!SUBGRAPH_URL) {
  console.error('NEXT_PUBLIC_SUBGRAPH_URL is not set. Please add it to your .env.local file.');
}

/**
 * Apollo Client for Pulsar IDO Subgraph
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
