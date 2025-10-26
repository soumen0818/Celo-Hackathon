import { ethers } from "hardhat";

/**
 * This script checks the current oracle and owner, then updates the oracle if needed
 * Run: npx hardhat run scripts/check-and-update-oracle.ts --network alfajores
 */

async function main() {
    const contractAddress = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS || "";

    if (!contractAddress) {
        throw new Error("NEXT_PUBLIC_CONTRACT_ADDRESS not set in .env.local");
    }

    console.log("📋 Contract Address:", contractAddress);
    console.log("━".repeat(60));

    // Get the contract
    const GrantDistribution = await ethers.getContractAt("GrantDistribution", contractAddress);

    // Get signer (from PRIVATE_KEY in .env.local)
    const [signer] = await ethers.getSigners();
    console.log("\n👤 Your Wallet Address:", signer.address);

    // Check contract owner
    try {
        const owner = await GrantDistribution.owner();
        console.log("🔐 Contract Owner:", owner);

        const isOwner = owner.toLowerCase() === signer.address.toLowerCase();
        console.log("✓ Are you the owner?", isOwner ? "YES ✅" : "NO ❌");

        if (!isOwner) {
            console.log("\n❌ ERROR: You are not the contract owner!");
            console.log("Only the owner can update the AI Oracle address.");
            console.log("\nTo fix this:");
            console.log("1. Make sure PRIVATE_KEY in .env.local matches the deployer wallet");
            console.log("2. Or use the wallet that deployed the contract");
            return;
        }
    } catch (error) {
        console.log("⚠️  Could not read owner (this is normal for some contracts)");
    }

    // Check current oracle
    try {
        const currentOracle = await GrantDistribution.aiOracle();
        console.log("\n🤖 Current AI Oracle:", currentOracle);
    } catch (error) {
        console.log("\n❌ Error reading aiOracle:", error);
        return;
    }

    // Ask what address to set
    console.log("\n" + "━".repeat(60));
    console.log("What address should be the AI Oracle?");
    console.log("1. Use your current wallet:", signer.address);
    console.log("2. Use AI_ORACLE_PRIVATE_KEY wallet (if set)");
    console.log("3. Enter a custom address");
    console.log("━".repeat(60));

    // For now, let's use the signer address as default
    const newOracleAddress = signer.address;

    console.log("\n🔄 Updating AI Oracle to:", newOracleAddress);
    console.log("Sending transaction...");

    try {
        const tx = await GrantDistribution.updateAIOracle(newOracleAddress);
        console.log("📝 Transaction Hash:", tx.hash);
        console.log("⏳ Waiting for confirmation...");

        const receipt = await tx.wait();
        if (receipt) {
            console.log("✅ Transaction confirmed in block:", receipt.blockNumber);
        }

        // Verify the change
        const updatedOracle = await GrantDistribution.aiOracle();
        console.log("\n✅ NEW AI Oracle Address:", updatedOracle);

        if (updatedOracle.toLowerCase() === newOracleAddress.toLowerCase()) {
            console.log("🎉 SUCCESS! Oracle address updated successfully!");
        } else {
            console.log("⚠️  WARNING: Oracle address doesn't match expected value");
        }

    } catch (error) {
        console.log("\n❌ Transaction Failed!");
        const errorMessage = error instanceof Error ? error.message : String(error);
        console.log("Error:", errorMessage);

        if (errorMessage.includes("Ownable")) {
            console.log("\n💡 This means only the contract owner can update the oracle.");
            console.log("Make sure you're using the deployer's private key.");
        }
    }
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
