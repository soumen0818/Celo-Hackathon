// Script to check project assignments
const hre = require("hardhat");

async function main() {
    console.log("🔍 Checking Project Assignments...\n");

    const contractAddress = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS;
    console.log("Contract Address:", contractAddress);

    const GrantDistribution = await hre.ethers.getContractAt(
        "GrantDistributionCELO",
        contractAddress
    );

    // Get total project count
    const projectCount = await GrantDistribution.projectCount();
    console.log(`\n📊 Total Projects: ${projectCount}\n`);

    for (let i = 0; i < projectCount; i++) {
        console.log(`\n${'='.repeat(60)}`);
        console.log(`PROJECT #${i}`);
        console.log('='.repeat(60));

        try {
            // Get project details
            const project = await GrantDistribution.getProject(i);
            console.log(`Name: ${project.name}`);
            console.log(`Description: ${project.description}`);
            console.log(`Requested Amount: ${hre.ethers.formatEther(project.requestedAmount)} CELO`);
            console.log(`Votes For: ${project.votesFor}`);
            console.log(`Votes Against: ${project.votesAgainst}`);
            console.log(`Status: ${project.isApproved ? 'Approved' : 'Pending'}`);

            // Get assigned companies
            console.log(`\n👥 Assigned Companies:`);
            const assignedCompanies = await GrantDistribution.getProjectAssignedCompanies(i);
            console.log(`Total Assigned: ${assignedCompanies.length}`);

            if (assignedCompanies.length === 0) {
                console.log("⚠️  NO COMPANIES ASSIGNED TO THIS PROJECT!");
            } else {
                for (let j = 0; j < assignedCompanies.length; j++) {
                    const companyAddr = assignedCompanies[j];
                    try {
                        const company = await GrantDistribution.companies(companyAddr);
                        console.log(`  ${j + 1}. ${company.name} (${companyAddr})`);
                    } catch (err) {
                        console.log(`  ${j + 1}. ${companyAddr} (Failed to fetch company details)`);
                    }
                }
            }
        } catch (error) {
            console.error(`❌ Error fetching project ${i}:`, error.message);
        }
    }

    console.log(`\n${'='.repeat(60)}\n`);
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
