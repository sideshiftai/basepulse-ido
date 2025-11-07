import { ethers } from "hardhat";

async function main() {
  const registryAddress = "0xF2E34D95412FDbf4606f5880bED7820d00c17D8B";
  const factoryAddress = "0x27Cd6127E787dc96D7d76B9575f900173c2C864E";

  console.log("Setting factory address on registry...");
  console.log("Registry:", registryAddress);
  console.log("Factory:", factoryAddress);

  const registry = await ethers.getContractAt("FactoryRegistry", registryAddress);

  const tx = await registry.setFactory(factoryAddress);
  console.log("\nTransaction hash:", tx.hash);
  await tx.wait();

  console.log("✅ Factory address set successfully!");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
