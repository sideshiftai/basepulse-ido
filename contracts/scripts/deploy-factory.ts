import { ethers } from "hardhat";
import fs from "fs";
import path from "path";

async function main() {
  console.log("🚀 Deploying IDOFactory and infrastructure...\n");

  const [deployer] = await ethers.getSigners();
  console.log("Deploying with account:", deployer.address);
  console.log("Account balance:", ethers.formatEther(await ethers.provider.getBalance(deployer.address)), "ETH\n");

  const network = await ethers.provider.getNetwork();
  const chainId = network.chainId;
  console.log("Network:", network.name);
  console.log("Chain ID:", chainId, "\n");

  // Get USDC address based on network
  let usdcAddress: string;
  if (chainId === 84532n) {
    // Base Sepolia
    usdcAddress = "0x036CbD53842c5426634e7929541eC2318f3dCF7e";
    console.log("📍 Using Base Sepolia USDC:", usdcAddress);
  } else if (chainId === 8453n) {
    // Base Mainnet
    usdcAddress = "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913";
    console.log("📍 Using Base Mainnet USDC:", usdcAddress);
  } else {
    throw new Error(`Unsupported network. Chain ID: ${chainId}`);
  }

  // Deploy FactoryRegistry first
  console.log("\n⏳ Deploying FactoryRegistry...");
  const FactoryRegistry = await ethers.getContractFactory("FactoryRegistry");
  const registry = await FactoryRegistry.deploy();
  await registry.waitForDeployment();
  const registryAddress = await registry.getAddress();

  console.log("✅ FactoryRegistry deployed to:", registryAddress);

  // Deploy IDOFactory with registry address
  console.log("\n⏳ Deploying IDOFactory...");
  const IDOFactory = await ethers.getContractFactory("IDOFactory");
  const factory = await IDOFactory.deploy(usdcAddress, registryAddress);
  await factory.waitForDeployment();
  const factoryAddress = await factory.getAddress();

  console.log("✅ IDOFactory deployed to:", factoryAddress);
  console.log("   - USDC Token:", usdcAddress);
  console.log("   - Registry:", registryAddress);

  // Set factory address on registry
  console.log("\n⏳ Linking registry to factory...");
  const setFactoryTx = await registry.setFactory(factoryAddress);
  await setFactoryTx.wait();
  console.log("✅ Registry linked to factory");

  // Save deployment info
  const deploymentInfo = {
    network: network.name,
    chainId: chainId.toString(),
    timestamp: new Date().toISOString(),
    deployer: deployer.address,
    contracts: {
      FactoryRegistry: {
        address: registryAddress,
        factory: factoryAddress,
      },
      IDOFactory: {
        address: factoryAddress,
        usdcToken: usdcAddress,
        registry: registryAddress,
      },
    },
  };

  // Create deployments directory if it doesn't exist
  const deploymentsDir = path.join(__dirname, "../deployments");
  if (!fs.existsSync(deploymentsDir)) {
    fs.mkdirSync(deploymentsDir, { recursive: true });
  }

  // Save to file
  const filename = `factory-${network.name.toLowerCase().replace(/\s/g, "-")}.json`;
  const filepath = path.join(deploymentsDir, filename);
  fs.writeFileSync(filepath, JSON.stringify(deploymentInfo, null, 2));

  console.log(`\n📝 Deployment info saved to: ${filepath}`);

  // Print verification commands
  console.log("\n🔍 To verify on BaseScan:");
  console.log(`\n# Verify Registry:`);
  console.log(`npx hardhat verify --network ${network.name.toLowerCase().replace(/\s/g, "-")} ${registryAddress}`);
  console.log(`\n# Verify Factory:`);
  console.log(`npx hardhat verify --network ${network.name.toLowerCase().replace(/\s/g, "-")} ${factoryAddress} "${usdcAddress}" "${registryAddress}"`);

  console.log("\n✨ Deployment complete!\n");
  console.log("📋 Summary:");
  console.log("   Registry Address:", registryAddress);
  console.log("   Factory Address:", factoryAddress);
  console.log("   Network:", network.name);
  console.log("   Chain ID:", chainId.toString());
  console.log("\n📖 Next steps:");
  console.log("   1. Verify contracts on BaseScan (commands above)");
  console.log("   2. Create your first sale using scripts/create-test-sale.ts");
  console.log("   3. Update frontend .env with factory and registry addresses");
  console.log("   4. Deploy subgraph\n");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
