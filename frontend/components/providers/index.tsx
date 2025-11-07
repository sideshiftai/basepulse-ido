'use client';

import { ApolloProvider } from '@apollo/client';
import { ThemeProvider } from './theme-provider';
import { Web3Provider } from './web3-provider';
import { DataSourceProvider } from '@/lib/contexts/data-source-context';
import { apolloClient } from '@/lib/apollo-client';
import { Toaster } from 'sonner';

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange
    >
      <ApolloProvider client={apolloClient}>
        <DataSourceProvider>
          <Web3Provider>
            {children}
            <Toaster position="top-right" richColors closeButton />
          </Web3Provider>
        </DataSourceProvider>
      </ApolloProvider>
    </ThemeProvider>
  );
}
