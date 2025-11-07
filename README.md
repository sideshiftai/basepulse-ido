# BasePulse IDO Platform

> **PULSE Token Sale & Vesting Platform on Base**

A comprehensive IDO (Initial DEX Offering) platform for the PULSE token, featuring tiered sales, vesting schedules, referral rewards, and complete admin controls.

## 📁 Monorepo Structure

```
basepulse-ido/
├── contracts/          # Smart contracts (Hardhat)
│   ├── IDOSale         # Main sale contract
│   ├── VestingManager  # Vesting with cliff
│   └── WhitelistManager # Merkle tree whitelist
├── frontend/           # Next.js 14 web app
│   ├── Landing page
│   ├── Contribution interface
│   ├── Vesting dashboard
│   └── Admin panel
├── backend/            # Express API (optional)
│   ├── Analytics
│   ├── Whitelist management
│   └── Notifications
├── subgraph/           # The Graph indexing
│   ├── Event indexing
│   └── Query API
└── packages/           # Shared code
    ├── types/          # TypeScript definitions
    └── utils/          # Common utilities
```

## 🚀 Quick Start

### Prerequisites

- Node.js >= 18.0.0
- npm >= 9.0.0
- Git

### Installation

```bash
# Clone the repository
git clone <repository-url>
cd basepulse-ido

# Install all dependencies
npm install

# Set up environment variables
cp .env.example .env
# Edit .env with your configuration
```

### Development

```bash
# Run frontend development server
npm run dev:frontend

# Run backend development server
npm run dev:backend

# Compile smart contracts
npm run compile:contracts

# Run contract tests
npm run test:contracts
```

## 🏗️ Workspaces

### Contracts

Smart contracts for the IDO platform.

```bash
cd contracts
npm install
npm run compile
npm run test
npm run deploy:sepolia
```

### Frontend

Next.js 14 application for user interface.

```bash
cd frontend
npm install
npm run dev
npm run build
```

### Backend

Express API for backend services (optional).

```bash
cd backend
npm install
npm run dev
npm run build
```

### Subgraph

The Graph indexing for blockchain data.

```bash
cd subgraph
npm install
npm run codegen
npm run deploy
```

## 🔐 Environment Variables

Create a `.env` file in the root directory:

```env
# Network Configuration
NEXT_PUBLIC_CHAIN_ID=84532
NEXT_PUBLIC_CHAIN_NAME="Base Sepolia"

# Contract Addresses
NEXT_PUBLIC_IDO_SALE_ADDRESS=
NEXT_PUBLIC_VESTING_MANAGER_ADDRESS=
NEXT_PUBLIC_PULSE_TOKEN_ADDRESS=0x19821658D5798976152146d1c1882047670B898c

# Wallet Connection
NEXT_PUBLIC_REOWN_PROJECT_ID=

# Deployment (contracts workspace)
PRIVATE_KEY=
BASESCAN_API_KEY=

# Backend (optional)
DATABASE_URL=
JWT_SECRET=
```

## 📝 Available Scripts

### Root Level

- `npm run build` - Build all workspaces
- `npm run test` - Test all workspaces
- `npm run clean` - Clean all workspaces
- `npm run dev:frontend` - Start frontend dev server
- `npm run dev:backend` - Start backend dev server

### Contracts

- `npm run compile:contracts` - Compile smart contracts
- `npm run test:contracts` - Run contract tests
- `npm run deploy:sepolia` - Deploy to Base Sepolia
- `npm run deploy:mainnet` - Deploy to Base Mainnet

### Subgraph

- `npm run graph:codegen` - Generate Graph types
- `npm run graph:deploy` - Deploy to The Graph

## 🎯 Features

### Smart Contracts

- ✅ Fixed-price tiered token sale
- ✅ Multi-token payments (ETH, USDC)
- ✅ Merkle tree whitelist verification
- ✅ Referral bonus system
- ✅ Vesting with cliff periods
- ✅ Emergency controls

### Frontend

- ✅ Landing page with tokenomics
- ✅ Contribution interface
- ✅ Whitelist checker
- ✅ Real-time sale statistics
- ✅ Vesting dashboard
- ✅ Claim interface
- ✅ Admin panel

### Backend (Optional)

- ✅ Analytics API
- ✅ Whitelist management
- ✅ Email notifications
- ✅ KYC integration

### Subgraph

- ✅ Event indexing
- ✅ Contribution tracking
- ✅ Vesting schedule queries
- ✅ Real-time analytics

## 🏦 Token Information

- **Token:** PULSE
- **Total Supply:** 1,000,000,000 PULSE
- **Decimals:** 18
- **Base Sepolia:** `0x19821658D5798976152146d1c1882047670B898c`
- **Base Mainnet:** TBD

## 📊 Sale Structure

### Tier 1 (Seed)
- Price: $0.001 per PULSE
- Max Allocation: 100,000 PULSE
- Vesting: 15% TGE, 3-month cliff, 12-month linear

### Tier 2 (Private)
- Price: $0.0012 per PULSE
- Max Allocation: 50,000 PULSE
- Vesting: 15% TGE, 6-month cliff, 18-month linear

### Tier 3 (Public)
- Price: $0.0015 per PULSE
- Max Allocation: 20,000 PULSE
- Vesting: 10% TGE, 6-month cliff, 24-month linear

## 🧪 Testing

```bash
# Test all workspaces
npm test

# Test specific workspace
npm run test:contracts

# Run integration tests
npm run test:integration
```

## 🚢 Deployment

### Smart Contracts

```bash
# Deploy to Base Sepolia
npm run deploy:sepolia

# Verify contracts
npm run verify:sepolia

# Deploy to Base Mainnet
npm run deploy:mainnet
```

### Frontend

```bash
cd frontend
npm run build
# Deploy to Vercel/Netlify
```

### Subgraph

```bash
cd subgraph
npm run deploy
```

## 📚 Documentation

- [Smart Contracts](./contracts/README.md)
- [Frontend](./frontend/README.md)
- [Backend](./backend/README.md)
- [Subgraph](./subgraph/README.md)
- [API Documentation](./docs/API.md)

## 🔒 Security

- Smart contracts will be audited before mainnet deployment
- Multi-signature wallet for admin functions
- Emergency pause functionality
- Comprehensive test coverage

## 🤝 Contributing

This is a private project. For questions or issues, contact the BasePulse team.

## 📄 License

MIT License - see [LICENSE](./LICENSE) file for details.

## 🔗 Links

- [BasePulse Polls](https://basepulse.app)
- [Documentation](https://docs.basepulse.app)
- [Twitter](https://twitter.com/basepulse)
- [Discord](https://discord.gg/basepulse)

---

Built with ❤️ by the BasePulse Team
