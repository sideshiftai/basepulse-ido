'use client';

import { ThemeProvider } from './theme-provider';
import { Web3Provider } from './web3-provider';
import { Toaster } from 'sonner';

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange
    >
      <Web3Provider>
        {children}
        <Toaster position="top-right" richColors closeButton />
      </Web3Provider>
    </ThemeProvider>
  );
}
