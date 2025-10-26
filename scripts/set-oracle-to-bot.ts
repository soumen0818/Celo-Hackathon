import { ethers } from "hardhat";

/**
 * Update AI Oracle to AI_ORACLE_PRIVATE_KEY wallet
 * Run: npm run update-oracle
 */

async function main() {
    const contractAddress = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS || "";
    const oraclePrivateKey = process.env.AI_ORACLE_PRIVATE_KEY;

    if (!contractAddress) {
        throw new Error("NEXT_PUBLIC_CONTRACT_ADDRESS not set in .env.local");
    }

    if (!oraclePrivateKey) {
        throw new Error("AI_ORACLE_PRIVATE_KEY not set in .env.local");
    }

    console.log("📋 Contract Address:", contractAddress);
    console.log("━".repeat(60));

    // Get the contract
    const GrantDistribution = await ethers.getContractAt("GrantDistribution", contractAddress);

    // Get deployer (from PRIVATE_KEY)
    const [deployer] = await ethers.getSigners();
    console.log("\n👤 Deployer Wallet:", deployer.address);

    // Get oracle wallet address from private key
    const oracleWallet = new ethers.Wallet(oraclePrivateKey);
    console.log("🤖 Oracle Wallet:", oracleWallet.address);

    // Check current oracle
    const currentOracle = await GrantDistribution.aiOracle();
    console.log("\n📍 Current AI Oracle:", currentOracle);

    if (currentOracle.toLowerCase() === oracleWallet.address.toLowerCase()) {
        console.log("✅ Oracle is already set to the correct address!");
        console.log("No update needed.");
        return;
    }

    console.log("\n🔄 Updating AI Oracle to:", oracleWallet.address);
    console.log("Sending transaction from deployer wallet...");

    try {
        const tx = await GrantDistribution.connect(deployer).updateAIOracle(oracleWallet.address);
        console.log("📝 Transaction Hash:", tx.hash);
        console.log("⏳ Waiting for confirmation...");

        const receipt = await tx.wait();
        if (receipt) {
            console.log("✅ Transaction confirmed in block:", receipt.blockNumber);
        }

        // Verify the change
        const updatedOracle = await GrantDistribution.aiOracle();
        console.log("\n✅ NEW AI Oracle Address:", updatedOracle);

        if (updatedOracle.toLowerCase() === oracleWallet.address.toLowerCase()) {
            console.log("🎉 SUCCESS! Oracle address updated successfully!");
            console.log("\n📝 Next steps:");
            console.log("1. Make sure the oracle wallet has some CELO for gas");
            console.log("2. The oracle wallet can now call updateImpactScore()");
            console.log("3. You can run the AI oracle service with this wallet");
        } else {
            console.log("⚠️  WARNING: Oracle address doesn't match expected value");
        }

    } catch (error) {
        console.log("\n❌ Transaction Failed!");
        const errorMessage = error instanceof Error ? error.message : String(error);
        console.log("Error:", errorMessage);
    }
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
