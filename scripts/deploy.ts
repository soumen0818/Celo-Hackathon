import { ethers } from "hardhat";

async function main() {
  console.log("Deploying GrantDistribution contract...");

  // cUSD token address on Alfajores testnet
  const cUSDAddress = "0x874069Fa1Eb16D44d622F2e0Ca25eeA172369bC1";
  
  const GrantDistribution = await ethers.getContractFactory("GrantDistribution");
  const grantDistribution = await GrantDistribution.deploy(cUSDAddress);

  await grantDistribution.waitForDeployment();

  const address = await grantDistribution.getAddress();
  console.log("GrantDistribution deployed to:", address);
  console.log("Save this address to your .env file as NEXT_PUBLIC_CONTRACT_ADDRESS");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
