# BasePulse IDO Frontend

Modern, type-safe frontend for the BasePulse token sale platform built with Next.js 14, Wagmi, and Reown AppKit.

## Features

- **Multi-tier IDO System**: Support for Seed, Private, and Public sale tiers
- **Wallet Integration**: Seamless connection with Reown AppKit (WalletConnect v2)
- **Real-time Countdown**: Live countdown timers for sale periods
- **Vesting Dashboard**: Track and claim vested tokens
- **Responsive Design**: Works on all devices with Tailwind CSS
- **Type-safe**: Full TypeScript support with Wagmi v2

## Getting Started

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Environment

Update `.env.local` with your Reown Project ID:

```env
NEXT_PUBLIC_REOWN_PROJECT_ID=your_project_id_here
```

Get your Project ID from [https://cloud.reown.com/](https://cloud.reown.com/)

### 3. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### 4. Build for Production

```bash
npm run build
npm start
```

## Project Structure

```
frontend/
├── app/                      # Next.js 14 App Router
│   ├── page.tsx             # Homepage with IDO listings
│   ├── ido/[id]/page.tsx    # IDO details page
│   └── dashboard/page.tsx   # User dashboard
├── components/
│   ├── ui/                  # shadcn/ui components
│   ├── layout/              # Navigation, Footer
│   ├── ido/                 # IDO-specific components
│   └── providers/           # Web3, Theme providers
├── lib/
│   ├── wagmi.ts            # Wagmi & Reown config
│   ├── contracts/          # Contract ABIs & hooks
│   └── utils.ts            # Utility functions
└── hooks/
    └── use-countdown.ts    # Countdown timer hook
```

## Key Components

### Pages

- **Homepage** (`/`): Lists all available IDO tiers with progress bars and countdown timers
- **IDO Details** (`/ido/[id]`): Detailed view with contribution dialog and allocation info
- **Dashboard** (`/dashboard`): User's contributions and vesting schedules

### Components

- **IdoCard**: Displays IDO tier information with live countdown
- **ContributeDialog**: Multi-payment (ETH/USDC) contribution interface
- **VestingSchedule**: Shows vesting progress with claimable amounts
- **Navigation**: Wallet connection and theme toggle

### Hooks

- **useIdoDetails**: Read IDO sale information
- **useTierInfo**: Get tier-specific data
- **useUserContribution**: User's contribution per tier
- **useContributeETH / useContributeToken**: Write operations for contributing
- **useClaimTGE / useClaimVested**: Claim tokens
- **useCountdown**: Real-time countdown timer

## Smart Contract Integration

All contract interactions are type-safe using Wagmi v2:

```typescript
import { useContributeETH } from '@/lib/contracts/hooks';

function Component() {
  const { contribute, isPending, isSuccess } = useContributeETH();

  const handleContribute = async () => {
    await contribute(0, "1.0"); // Tier 0, 1 ETH
  };
}
```

## Environment Variables

```env
# Required
NEXT_PUBLIC_REOWN_PROJECT_ID=        # From cloud.reown.com

# Network (pre-configured for Base Sepolia)
NEXT_PUBLIC_DEFAULT_CHAIN_ID=84532
NEXT_PUBLIC_ENABLE_MAINNET=false

# Contract Addresses (already set)
NEXT_PUBLIC_IDO_SALE_ADDRESS=0x1a3f2F6A5D1d88c5c34c37c86FB08E446F8856e0
NEXT_PUBLIC_VESTING_MANAGER_ADDRESS=0x7119eEdAd84C6A79ea7aB7Cd1EA68feA6e0865Ed
NEXT_PUBLIC_WHITELIST_MANAGER_ADDRESS=0x23044915b2922847950737c8dF5fCCaebCFe6ECe
NEXT_PUBLIC_PULSE_TOKEN_ADDRESS=0x19821658D5798976152146d1c1882047670B898c
NEXT_PUBLIC_USDC_ADDRESS=0x036CbD53842c5426634e7929541eC2318f3dCF7e
```

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Web3**: Wagmi v2 + Viem + Reown AppKit
- **Styling**: Tailwind CSS v4
- **UI Components**: shadcn/ui
- **Forms**: React Hook Form + Zod
- **State**: TanStack Query
- **Icons**: Lucide React
- **Notifications**: Sonner

## Next Steps

1. **Get Reown Project ID**: Visit https://cloud.reown.com/ and create a project
2. **Update .env.local**: Add your project ID
3. **Test locally**: Run `npm run dev`
4. **Configure Sale**: Use the admin panel or configure-sale.ts script
5. **Deploy**: Deploy to Vercel or your preferred hosting

## Deployment

### Vercel (Recommended)

```bash
vercel
```

Or connect your GitHub repo to Vercel for automatic deployments.

### Other Platforms

```bash
npm run build
npm start
```

## Troubleshooting

### Wallet Not Connecting

- Ensure NEXT_PUBLIC_REOWN_PROJECT_ID is set
- Check browser console for errors
- Try clearing browser cache

### Contract Reads Failing

- Verify you're on Base Sepolia (Chain ID: 84532)
- Check contract addresses in .env.local
- Ensure sale has been configured (see contracts/scripts/configure-sale.ts)

### Build Errors

```bash
rm -rf .next node_modules
npm install
npm run build
```

## License

MIT
