// Script to test fetching company data
const hre = require("hardhat");

async function main() {
    console.log("🧪 Testing Company Data Fetch...\n");

    const contractAddress = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS;
    const GrantDistribution = await hre.ethers.getContractAt(
        "GrantDistributionCELO",
        contractAddress
    );

    const testAddress = "0x9D0E91663E1c431EC250A414a08Cb9cAe5221d8d";

    console.log(`Testing address: ${testAddress}\n`);

    try {
        const company = await GrantDistribution.companies(testAddress);
        console.log("✅ Company Data:");
        console.log(`  Company Address: ${company.companyAddress}`);
        console.log(`  Name: ${company.name}`);
        console.log(`  Is Active: ${company.isActive}`);
        console.log(`  Registered At: ${new Date(Number(company.registeredAt) * 1000).toLocaleString()}`);
    } catch (error) {
        console.error("❌ Error:", error.message);
    }
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
