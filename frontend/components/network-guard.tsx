/**
 * Network Guard Component
 * Displays a warning when the user is connected to an unsupported network
 */

'use client';

import { useNetworkConfig } from '@/lib/hooks/use-network-config';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { ExclamationTriangleIcon } from '@radix-ui/react-icons';

export function NetworkGuard({ children }: { children: React.ReactNode }) {
  const { isSupported, chainId, name } = useNetworkConfig();

  if (!isSupported) {
    return (
      <div className="container mx-auto max-w-4xl py-8">
        <Alert variant="destructive">
          <ExclamationTriangleIcon className="h-4 w-4" />
          <AlertTitle>Unsupported Network</AlertTitle>
          <AlertDescription>
            You are currently connected to {name} (Chain ID: {chainId}).
            This application only supports Base Sepolia and Base Mainnet.
            Please switch your network in your wallet.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return <>{children}</>;
}
