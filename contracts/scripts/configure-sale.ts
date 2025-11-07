import { ethers } from "hardhat";
import fs from "fs";
import path from "path";

/**
 * Configure the IDO sale with realistic parameters
 *
 * This script sets up:
 * - Sale configuration (timing, caps, pricing)
 * - Tier configurations (Seed, Private, Public)
 * - Vesting parameters
 */
async function main() {
  console.log("Configuring IDO Sale...\n");

  const [deployer] = await ethers.getSigners();
  const network = await ethers.provider.getNetwork();

  // Load deployment addresses
  const deploymentPath = path.join(__dirname, "..", "deployments", getNetworkFileName(Number(network.chainId)));

  if (!fs.existsSync(deploymentPath)) {
    throw new Error("Deployment file not found. Please run deploy script first.");
  }

  const deployment = JSON.parse(fs.readFileSync(deploymentPath, "utf8"));
  const idoAddress = deployment.contracts.IDOSale.address;

  console.log("IDOSale address:", idoAddress);
  console.log("Network:", network.name, "\n");

  const idoSale = await ethers.getContractAt("IDOSale", idoAddress);

  // Sale configuration
  const now = Math.floor(Date.now() / 1000);
  const saleStart = now + 3600; // Start in 1 hour
  const saleEnd = saleStart + (30 * 24 * 3600); // 30 days duration

  const saleConfig = {
    startTime: saleStart,
    endTime: saleEnd,
    tokenPrice: ethers.parseEther("0.0015"), // $0.0015 per PULSE (assuming 1 ETH = $1 for simplicity)
    hardCap: ethers.parseEther("500"), // 500 ETH hard cap
    softCap: ethers.parseEther("100"), // 100 ETH soft cap
    minContribution: ethers.parseEther("0.1"), // 0.1 ETH minimum
    maxGasPrice: ethers.parseUnits("100", "gwei"), // Anti-bot: 100 gwei max
  };

  console.log("1. Configuring sale parameters...");
  const configureSaleTx = await idoSale.configureSale(
    saleConfig.startTime,
    saleConfig.endTime,
    saleConfig.tokenPrice,
    saleConfig.hardCap,
    saleConfig.softCap,
    saleConfig.minContribution,
    saleConfig.maxGasPrice
  );
  await configureSaleTx.wait();
  console.log("✅ Sale configured\n");

  // Tier 1: Seed - Best price, longest vesting
  console.log("2. Configuring Tier 1 (Seed)...");
  const tier1Config = {
    tierId: 1,
    startTime: saleStart,
    endTime: saleStart + (7 * 24 * 3600), // 7 days
    tokenPrice: ethers.parseEther("0.001"), // $0.001 per PULSE
    maxAllocation: ethers.parseEther("100000"), // 100k PULSE per wallet
    totalAllocation: ethers.parseEther("50000000"), // 50M PULSE total
  };

  const tier1Tx = await idoSale.configureTier(
    tier1Config.tierId,
    tier1Config.startTime,
    tier1Config.endTime,
    tier1Config.tokenPrice,
    tier1Config.maxAllocation,
    tier1Config.totalAllocation
  );
  await tier1Tx.wait();
  console.log("✅ Tier 1 (Seed) configured\n");

  // Tier 2: Private
  console.log("3. Configuring Tier 2 (Private)...");
  const tier2Config = {
    tierId: 2,
    startTime: saleStart + (7 * 24 * 3600),
    endTime: saleStart + (14 * 24 * 3600), // Next 7 days
    tokenPrice: ethers.parseEther("0.0012"), // $0.0012 per PULSE
    maxAllocation: ethers.parseEther("50000"), // 50k PULSE per wallet
    totalAllocation: ethers.parseEther("30000000"), // 30M PULSE total
  };

  const tier2Tx = await idoSale.configureTier(
    tier2Config.tierId,
    tier2Config.startTime,
    tier2Config.endTime,
    tier2Config.tokenPrice,
    tier2Config.maxAllocation,
    tier2Config.totalAllocation
  );
  await tier2Tx.wait();
  console.log("✅ Tier 2 (Private) configured\n");

  // Tier 3: Public - Highest price, shortest vesting
  console.log("4. Configuring Tier 3 (Public)...");
  const tier3Config = {
    tierId: 3,
    startTime: saleStart + (14 * 24 * 3600),
    endTime: saleEnd, // Until sale ends
    tokenPrice: ethers.parseEther("0.0015"), // $0.0015 per PULSE
    maxAllocation: ethers.parseEther("20000"), // 20k PULSE per wallet
    totalAllocation: ethers.parseEther("20000000"), // 20M PULSE total
  };

  const tier3Tx = await idoSale.configureTier(
    tier3Config.tierId,
    tier3Config.startTime,
    tier3Config.endTime,
    tier3Config.tokenPrice,
    tier3Config.maxAllocation,
    tier3Config.totalAllocation
  );
  await tier3Tx.wait();
  console.log("✅ Tier 3 (Public) configured\n");

  // Configure vesting parameters
  console.log("5. Configuring vesting parameters...");
  const vestingParams = {
    tgePercent: 15, // 15% at TGE
    cliff: 90 * 24 * 3600, // 90 days (3 months)
    duration: 365 * 24 * 3600, // 365 days (12 months)
  };

  const vestingTx = await idoSale.setVestingParams(
    vestingParams.tgePercent,
    vestingParams.cliff,
    vestingParams.duration
  );
  await vestingTx.wait();
  console.log("✅ Vesting parameters configured\n");

  // Update deployment file with configuration
  deployment.configuration = {
    sale: {
      startTime: new Date(saleStart * 1000).toISOString(),
      endTime: new Date(saleEnd * 1000).toISOString(),
      tokenPrice: "0.0015 USD",
      hardCap: "500 ETH",
      softCap: "100 ETH",
      minContribution: "0.1 ETH",
    },
    tiers: [
      {
        id: 1,
        name: "Seed",
        price: "0.001 USD",
        maxPerWallet: "100,000 PULSE",
        totalAllocation: "50,000,000 PULSE",
        startTime: new Date(tier1Config.startTime * 1000).toISOString(),
        endTime: new Date(tier1Config.endTime * 1000).toISOString(),
      },
      {
        id: 2,
        name: "Private",
        price: "0.0012 USD",
        maxPerWallet: "50,000 PULSE",
        totalAllocation: "30,000,000 PULSE",
        startTime: new Date(tier2Config.startTime * 1000).toISOString(),
        endTime: new Date(tier2Config.endTime * 1000).toISOString(),
      },
      {
        id: 3,
        name: "Public",
        price: "0.0015 USD",
        maxPerWallet: "20,000 PULSE",
        totalAllocation: "20,000,000 PULSE",
        startTime: new Date(tier3Config.startTime * 1000).toISOString(),
        endTime: new Date(tier3Config.endTime * 1000).toISOString(),
      },
    ],
    vesting: {
      tgeUnlock: "15%",
      cliff: "90 days",
      duration: "365 days",
    },
  };

  fs.writeFileSync(deploymentPath, JSON.stringify(deployment, null, 2));

  console.log("=== Configuration Summary ===");
  console.log("\nSale:");
  console.log("  Start:", new Date(saleStart * 1000).toLocaleString());
  console.log("  End:", new Date(saleEnd * 1000).toLocaleString());
  console.log("  Hard Cap: 500 ETH");
  console.log("  Soft Cap: 100 ETH");

  console.log("\nTiers:");
  console.log("  Seed: 50M PULSE @ $0.001 (100k max/wallet)");
  console.log("  Private: 30M PULSE @ $0.0012 (50k max/wallet)");
  console.log("  Public: 20M PULSE @ $0.0015 (20k max/wallet)");

  console.log("\nVesting:");
  console.log("  TGE Unlock: 15%");
  console.log("  Cliff: 90 days");
  console.log("  Duration: 365 days");

  console.log("\n=== Next Steps ===");
  console.log("1. Generate whitelist Merkle tree");
  console.log("2. Set Merkle root using setWhitelistMerkleRoot()");
  console.log("3. Transfer 100M PULSE tokens to IDOSale contract");
  console.log("4. Announce sale to community!");
}

function getNetworkFileName(chainId: number): string {
  const networkNames: { [key: number]: string } = {
    8453: "base.json",
    84532: "base-sepolia.json",
    31337: "localhost.json",
  };

  return networkNames[chainId] || "unknown.json";
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
