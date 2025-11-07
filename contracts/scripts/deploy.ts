import { ethers } from "hardhat";
import fs from "fs";
import path from "path";

interface DeploymentInfo {
  network: string;
  chainId: number;
  timestamp: string;
  contracts: {
    VestingManager: {
      address: string;
      deployer: string;
      pulseToken: string;
    };
    IDOSale: {
      address: string;
      deployer: string;
      pulseToken: string;
      usdcToken: string;
    };
    WhitelistManager: {
      address: string;
      deployer: string;
    };
  };
  configuration?: {
    sale?: any;
    tiers?: any[];
    vesting?: any;
  };
}

async function main() {
  console.log("Starting IDO Platform deployment...\n");

  const [deployer] = await ethers.getSigners();

  if (!deployer) {
    throw new Error("No deployer account found. Please set PRIVATE_KEY in .env file");
  }

  const network = await ethers.provider.getNetwork();

  console.log("Deploying contracts with account:", deployer.address);
  console.log("Network:", network.name, "Chain ID:", network.chainId);
  console.log("Account balance:", ethers.formatEther(await ethers.provider.getBalance(deployer.address)), "ETH\n");

  // Token addresses
  const PULSE_TOKEN = process.env.NEXT_PUBLIC_PULSE_TOKEN_ADDRESS || "0x19821658D5798976152146d1c1882047670B898c";
  const USDC_TOKEN = getUSDCAddress(Number(network.chainId));

  console.log("Using PULSE token:", PULSE_TOKEN);
  console.log("Using USDC token:", USDC_TOKEN, "\n");

  // Deploy VestingManager
  console.log("1. Deploying VestingManager...");
  const VestingManager = await ethers.getContractFactory("VestingManager");
  const vestingManager = await VestingManager.deploy(PULSE_TOKEN);
  await vestingManager.waitForDeployment();
  const vestingAddress = await vestingManager.getAddress();
  console.log("✅ VestingManager deployed to:", vestingAddress, "\n");

  // Wait for network confirmation
  await delay(5000);

  // Deploy IDOSale
  console.log("2. Deploying IDOSale...");
  const IDOSale = await ethers.getContractFactory("IDOSale");
  const idoSale = await IDOSale.deploy(PULSE_TOKEN, USDC_TOKEN);
  await idoSale.waitForDeployment();
  const idoAddress = await idoSale.getAddress();
  console.log("✅ IDOSale deployed to:", idoAddress, "\n");

  await delay(5000);

  // Deploy WhitelistManager
  console.log("3. Deploying WhitelistManager...");
  const WhitelistManager = await ethers.getContractFactory("WhitelistManager");
  const whitelistManager = await WhitelistManager.deploy();
  await whitelistManager.waitForDeployment();
  const whitelistAddress = await whitelistManager.getAddress();
  console.log("✅ WhitelistManager deployed to:", whitelistAddress, "\n");

  await delay(5000);

  // Configure contracts
  console.log("4. Configuring contracts...\n");

  // Set VestingManager's IDO contract
  console.log("Setting IDO contract on VestingManager...");
  const setIdoTx = await vestingManager.setIDOContract(idoAddress);
  await setIdoTx.wait();
  console.log("✅ IDO contract set on VestingManager\n");

  // Set IDOSale's VestingManager
  console.log("Setting VestingManager on IDOSale...");
  const setVestingTx = await idoSale.setVestingContract(vestingAddress);
  await setVestingTx.wait();
  console.log("✅ VestingManager set on IDOSale\n");

  // Save deployment info
  const deploymentInfo: DeploymentInfo = {
    network: network.name,
    chainId: Number(network.chainId),
    timestamp: new Date().toISOString(),
    contracts: {
      VestingManager: {
        address: vestingAddress,
        deployer: deployer.address,
        pulseToken: PULSE_TOKEN,
      },
      IDOSale: {
        address: idoAddress,
        deployer: deployer.address,
        pulseToken: PULSE_TOKEN,
        usdcToken: USDC_TOKEN,
      },
      WhitelistManager: {
        address: whitelistAddress,
        deployer: deployer.address,
      },
    },
  };

  saveDeployment(deploymentInfo);

  console.log("\n=== Deployment Summary ===");
  console.log("VestingManager:", vestingAddress);
  console.log("IDOSale:", idoAddress);
  console.log("WhitelistManager:", whitelistAddress);
  console.log("\n=== Next Steps ===");
  console.log("1. Configure sale parameters using configureSale()");
  console.log("2. Configure tier settings using configureTier()");
  console.log("3. Set whitelist Merkle root using setWhitelistMerkleRoot()");
  console.log("4. Transfer PULSE tokens to IDOSale contract for distribution");
  console.log("5. Start the sale!");
  console.log("\nDeployment info saved to deployments/", getNetworkFileName(Number(network.chainId)));
}

function getUSDCAddress(chainId: number): string {
  const USDC_ADDRESSES: { [key: number]: string } = {
    8453: "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913", // Base Mainnet
    84532: "0x036CbD53842c5426634e7929541eC2318f3dCF7e", // Base Sepolia
  };

  return USDC_ADDRESSES[chainId] || "0x0000000000000000000000000000000000000000";
}

function getNetworkFileName(chainId: number): string {
  const networkNames: { [key: number]: string } = {
    8453: "base.json",
    84532: "base-sepolia.json",
    31337: "localhost.json",
  };

  return networkNames[chainId] || "unknown.json";
}

function saveDeployment(info: DeploymentInfo): void {
  const deploymentsDir = path.join(__dirname, "..", "deployments");

  if (!fs.existsSync(deploymentsDir)) {
    fs.mkdirSync(deploymentsDir, { recursive: true });
  }

  const fileName = getNetworkFileName(info.chainId);
  const filePath = path.join(deploymentsDir, fileName);

  fs.writeFileSync(filePath, JSON.stringify(info, null, 2));
  console.log(`\n✅ Deployment info saved to: ${filePath}`);
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
