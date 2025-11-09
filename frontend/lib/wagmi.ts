import { cookieStorage, createStorage } from 'wagmi';
import { baseSepolia } from 'wagmi/chains';
import { createAppKit } from '@reown/appkit/react';
import { WagmiAdapter } from '@reown/appkit-adapter-wagmi';

// Get projectId from environment
export const projectId = process.env.NEXT_PUBLIC_REOWN_PROJECT_ID!;

if (!projectId) {
  console.warn(
    'NEXT_PUBLIC_REOWN_PROJECT_ID is not set. Get one at https://cloud.reown.com/'
  );
}

// Define supported networks
const supportedNetworks = [baseSepolia];

// Create wagmi adapter
export const wagmiAdapter = new WagmiAdapter({
  networks: supportedNetworks,
  projectId,
  ssr: true,
  storage: createStorage({
    storage: cookieStorage,
  }),
});

// Create AppKit modal
export const modal = createAppKit({
  adapters: [wagmiAdapter],
  networks: supportedNetworks as any,
  projectId,
  metadata: {
    name: 'BasePulse IDO',
    description: 'Token sale platform on Base',
    url: 'https://baseido.vercel.app', // Update with your domain
    icons: ['https://sideshiftai.github.io/website/ido_logo_dark.png'], // Update with your icon
  },
  features: {
    analytics: true,
    email: false,
    socials: [],
  },
  themeMode: 'light',
  themeVariables: {
    '--w3m-accent': 'hsl(var(--primary))',
  },
});

export const config = wagmiAdapter.wagmiConfig;
