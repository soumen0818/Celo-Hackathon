import { ethers } from "hardhat";

async function main() {
    console.log("🚀 Deploying GrantDistribution Contract (Native CELO Version)...\n");

    // Get deployer
    const [deployer] = await ethers.getSigners();
    console.log("📝 Deploying with account:", deployer.address);

    const balance = await ethers.provider.getBalance(deployer.address);
    console.log("💰 Account balance:", ethers.formatEther(balance), "CELO\n");

    // Deploy contract (no cUSD address needed - uses native CELO)
    const GrantDistribution = await ethers.getContractFactory("GrantDistributionCELO");
    const contract = await GrantDistribution.deploy();

    await contract.waitForDeployment();
    const contractAddress = await contract.getAddress();

    console.log("✅ GrantDistributionCELO deployed to:", contractAddress);
    console.log("📊 Network: Celo Alfajores Testnet");
    console.log("💵 Treasury Token: Native CELO");
    console.log("\n🔗 View on explorer:");
    console.log(`   https://explorer.celo.org/alfajores/address/${contractAddress}`);
    console.log(`   https://alfajores.celoscan.io/address/${contractAddress}`);

    console.log("\n⚙️  Update your .env.local file:");
    console.log(`   NEXT_PUBLIC_CONTRACT_ADDRESS=${contractAddress}`);

    console.log("\n✨ Deployment complete!");
    console.log("\n📝 Next steps:");
    console.log("   1. Update NEXT_PUBLIC_CONTRACT_ADDRESS in .env.local");
    console.log("   2. Restart your Next.js dev server");
    console.log("   3. Use your 1.66 CELO to deposit to treasury!");
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error("❌ Error:", error);
        process.exit(1);
    });
