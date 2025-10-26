// Script to quickly register 5 companies for testing
const hre = require("hardhat");

async function main() {
    console.log("🏢 Registering Companies...\n");

    const contractAddress = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS;
    console.log("Contract Address:", contractAddress);

    const GrantDistribution = await hre.ethers.getContractAt(
        "GrantDistributionCELO",
        contractAddress
    );

    // Get current company count
    const currentCompanies = await GrantDistribution.companyList(0).catch(() => null);
    const companyCount = await GrantDistribution.companyList.length || 0;

    console.log("Current registered companies:", companyCount);

    // Test company addresses (valid checksummed addresses)
    const companyAddresses = [
        "0x9D0E91663E1c431EC250A414a08Cb9cAe5221d8d", // Company 1 (already registered)
        "0x70997970C51812dc3A010C7d01b50e0d17dc79C8", // Company 2
        "0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC", // Company 3
        "0x90F79bf6EB2c4f870365E785982E1f101E93b906", // Company 4
        "0x15d34AAf54267DB7D7c367839AAf71A00a2C6A65", // Company 5
    ];

    const companyNames = [
        "Tech Ventures LLC",
        "Innovation Labs Inc",
        "Blockchain Solutions Co",
        "Digital Frontier Partners",
        "Crypto Ventures Group"
    ];

    for (let i = 0; i < 5; i++) {
        try {
            console.log(`\nRegistering Company ${i + 1}: ${companyNames[i]}`);
            console.log(`Address: ${companyAddresses[i]}`);

            const tx = await GrantDistribution.registerCompany(
                companyAddresses[i],
                companyNames[i]
            );

            console.log(`Transaction sent: ${tx.hash}`);
            await tx.wait();
            console.log(`✅ ${companyNames[i]} registered successfully!`);
        } catch (error) {
            if (error.message.includes("Company already registered")) {
                console.log(`⚠️  ${companyNames[i]} already registered, skipping...`);
            } else if (error.message.includes("Maximum companies reached")) {
                console.log(`✅ All 5 companies are registered!`);
                break;
            } else {
                console.error(`❌ Error: ${error.message}`);
            }
        }
    }

    // Verify final count
    const finalCount = await GrantDistribution.companyList.length || 0;
    console.log(`\n✅ Total companies now registered: ${finalCount}/5`);

    if (finalCount >= 5) {
        console.log("\n🎉 SUCCESS! You can now submit projects!");
    } else {
        console.log(`\n⚠️  Still need to register ${5 - finalCount} more companies`);
    }
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
