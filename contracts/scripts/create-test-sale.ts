import { ethers } from "hardhat";
import fs from "fs";
import path from "path";

async function main() {
  console.log("🎬 Creating test IDO sale...\n");

  const [deployer] = await ethers.getSigners();
  console.log("Using account:", deployer.address);

  // Load factory deployment info
  const network = await ethers.provider.getNetwork();
  const filename = `factory-${network.name.toLowerCase().replace(/\s/g, "-")}.json`;
  const filepath = path.join(__dirname, "../deployments", filename);

  if (!fs.existsSync(filepath)) {
    throw new Error(`Factory deployment file not found: ${filepath}`);
  }

  const deploymentInfo = JSON.parse(fs.readFileSync(filepath, "utf8"));
  const factoryAddress = deploymentInfo.contracts.IDOFactory.address;

  console.log("Factory Address:", factoryAddress, "\n");

  // Deploy a test ERC20 token for the sale
  console.log("⏳ Deploying test token...");
  const TestToken = await ethers.getContractFactory("PulsePollToken");
  const token = await TestToken.deploy();
  await token.waitForDeployment();
  const tokenAddress = await token.getAddress();

  console.log("✅ Test token deployed:", tokenAddress, "\n");

  // Connect to factory
  const factory = await ethers.getContractAt("IDOFactory", factoryAddress);

  // Create sale metadata
  const metadata = {
    name: "Test Token Sale",
    symbol: "TEST",
    description: "This is a test token sale for development and testing purposes",
    logoUrl: "https://via.placeholder.com/150",
    websiteUrl: "https://example.com",
    twitterUrl: "https://twitter.com/example",
    telegramUrl: "https://t.me/example",
  };

  console.log("⏳ Creating sale on factory...");
  const tx = await factory.createSale(tokenAddress, metadata);
  const receipt = await tx.wait();

  // Find SaleCreated event
  const event = receipt?.logs
    .map((log: any) => {
      try {
        return factory.interface.parseLog(log);
      } catch {
        return null;
      }
    })
    .find((e: any) => e?.name === "SaleCreated");

  if (!event) {
    throw new Error("SaleCreated event not found");
  }

  const saleId = event.args.saleId;
  const idoSaleAddress = event.args.idoSale;
  const vestingManagerAddress = event.args.vestingManager;
  const whitelistManagerAddress = event.args.whitelistManager;

  console.log("✅ Sale created!");
  console.log("   Sale ID:", saleId.toString());
  console.log("   IDOSale:", idoSaleAddress);
  console.log("   VestingManager:", vestingManagerAddress);
  console.log("   WhitelistManager:", whitelistManagerAddress);
  console.log("   Token:", tokenAddress);

  // Configure the sale
  console.log("\n⏳ Configuring sale parameters...");
  const idoSale = await ethers.getContractAt("IDOSaleV2", idoSaleAddress);

  const now = Math.floor(Date.now() / 1000);
  const startTime = now + 300; // Start in 5 minutes
  const endTime = startTime + 86400 * 30; // 30 days
  const tokenPrice = ethers.parseEther("0.0015"); // 0.0015 ETH per token
  const hardCap = ethers.parseEther("100"); // 100 ETH hard cap
  const softCap = ethers.parseEther("10"); // 10 ETH soft cap
  const minContribution = ethers.parseEther("0.01"); // 0.01 ETH minimum
  const maxGasPrice = ethers.parseUnits("100", "gwei"); // 100 gwei max

  const configureTx = await idoSale.configureSale(
    startTime,
    endTime,
    tokenPrice,
    hardCap,
    softCap,
    minContribution,
    maxGasPrice
  );
  await configureTx.wait();

  console.log("✅ Sale configured");
  console.log("   Start:", new Date(startTime * 1000).toLocaleString());
  console.log("   End:", new Date(endTime * 1000).toLocaleString());
  console.log("   Token Price:", ethers.formatEther(tokenPrice), "ETH");
  console.log("   Hard Cap:", ethers.formatEther(hardCap), "ETH");
  console.log("   Soft Cap:", ethers.formatEther(softCap), "ETH");

  // Configure tiers
  console.log("\n⏳ Configuring tiers...");

  // Tier 1: Seed
  await idoSale.configureTier(
    1, // tierId
    startTime,
    startTime + 86400 * 7, // 7 days
    ethers.parseEther("0.001"), // 0.001 ETH per token
    ethers.parseEther("100000"), // 100k tokens max per wallet
    ethers.parseEther("10000000") // 10M tokens total
  );

  // Tier 2: Private
  await idoSale.configureTier(
    2,
    startTime + 86400 * 7,
    startTime + 86400 * 14,
    ethers.parseEther("0.0012"),
    ethers.parseEther("50000"),
    ethers.parseEther("5000000")
  );

  // Tier 3: Public
  await idoSale.configureTier(
    3,
    startTime + 86400 * 14,
    endTime,
    ethers.parseEther("0.0015"),
    ethers.parseEther("20000"),
    ethers.parseEther("3000000")
  );

  console.log("✅ All tiers configured");

  // Configure vesting
  console.log("\n⏳ Setting vesting parameters...");
  await idoSale.setVestingParams(
    15, // 15% TGE
    90 * 24 * 3600, // 90 days cliff
    365 * 24 * 3600 // 365 days total
  );

  console.log("✅ Vesting configured");
  console.log("   TGE Unlock: 15%");
  console.log("   Cliff: 90 days");
  console.log("   Duration: 365 days");

  // Transfer tokens to sale contract
  console.log("\n⏳ Funding sale contract with tokens...");
  const saleAllocation = ethers.parseEther("18000000"); // 18M tokens (10M + 5M + 3M)
  await token.transfer(idoSaleAddress, saleAllocation);

  console.log("✅ Sale funded with", ethers.formatEther(saleAllocation), "tokens");

  console.log("\n✨ Test sale created successfully!");
  console.log("\n📋 Summary:");
  console.log("   Sale ID:", saleId.toString());
  console.log("   Token:", tokenAddress);
  console.log("   IDOSale:", idoSaleAddress);
  console.log("   Factory:", factoryAddress);
  console.log("\n📝 View on BaseScan:");
  console.log(`   https://sepolia.basescan.org/address/${idoSaleAddress}`);
  console.log("\n💡 To test the sale:");
  console.log("   1. Wait for start time:", new Date(startTime * 1000).toLocaleString());
  console.log("   2. Call buyTokensWithETH() on IDOSale contract");
  console.log("   3. After sale ends, call finalizeSale()");
  console.log("   4. Users can claim TGE tokens with claimTGE()\n");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
