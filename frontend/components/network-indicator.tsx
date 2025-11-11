/**
 * Network Indicator Component
 * Shows the current network status in the UI
 */

'use client';

import { useNetworkConfig } from '@/lib/hooks/use-network-config';
import { Badge } from '@/components/ui/badge';

export function NetworkIndicator() {
  const { name, isTestnet, isMainnet, isSupported } = useNetworkConfig();

  if (!isSupported) {
    return (
      <Badge variant="destructive" className="text-xs">
        Unsupported Network
      </Badge>
    );
  }

  if (isTestnet) {
    return (
      <Badge variant="outline" className="text-xs border-yellow-500 text-yellow-700 dark:text-yellow-400">
        {name} (Testnet)
      </Badge>
    );
  }

  if (isMainnet) {
    return (
      <Badge variant="default" className="text-xs bg-green-600 hover:bg-green-700">
        {name}
      </Badge>
    );
  }

  return (
    <Badge variant="outline" className="text-xs">
      {name}
    </Badge>
  );
}
