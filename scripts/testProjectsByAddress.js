// Script to test projectsByAddress function
const hre = require("hardhat");

async function main() {
    console.log("🔍 Testing projectsByAddress function...\n");

    const contractAddress = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS;
    console.log("Contract Address:", contractAddress);

    const GrantDistribution = await hre.ethers.getContractAt(
        "GrantDistributionCELO",
        contractAddress
    );

    // The wallet that submitted the project
    const projectOwner = "0x16eA3c33b1c24E96eeb0C8CCe92eC7C0736aaCCb";

    console.log("\nQuerying getProjectsByAddress for:", projectOwner);

    try {
        // Use the correct function name: getProjectsByAddress (not projectsByAddress)
        const projectIds = await GrantDistribution.getProjectsByAddress(projectOwner);
        console.log("\n✅ Result:", projectIds);
        console.log("Type:", typeof projectIds);
        console.log("Is Array:", Array.isArray(projectIds));
        console.log("Length:", projectIds.length);

        if (projectIds.length > 0) {
            console.log("\n📊 Project IDs for this address:");
            projectIds.forEach((id, index) => {
                console.log(`  ${index + 1}. Project ID: ${id.toString()}`);
            });

            // Fetch details for each project
            console.log("\n📁 Fetching project details...");
            for (const projectId of projectIds) {
                const project = await GrantDistribution.projects(projectId);
                console.log(`\nProject ${projectId}:`);
                console.log(`  Name: ${project.name}`);
                console.log(`  Owner: ${project.projectAddress}`);
                console.log(`  Description: ${project.description}`);
                console.log(`  GitHub: ${project.githubUrl}`);
                console.log(`  Requested: ${hre.ethers.formatEther(project.requestedAmount)} CELO`);
                console.log(`  Active: ${project.isActive}`);
                console.log(`  Approved: ${project.isApproved}`);
                console.log(`  Funded: ${project.isFunded}`);
            }
        } else {
            console.log("\n⚠️  No projects found for this address!");
            console.log("This could mean:");
            console.log("  1. The project was submitted from a different address");
            console.log("  2. The projectsByAddress mapping is not being updated correctly");
            console.log("  3. There's an issue with the contract");
        }

        // Also check total project count
        const totalProjects = await GrantDistribution.projectCount();
        console.log(`\n📊 Total Projects in Contract: ${totalProjects}`);

        if (totalProjects > 0) {
            console.log("\nChecking all projects to find which addresses own them:");
            for (let i = 0; i < totalProjects; i++) {
                const project = await GrantDistribution.projects(i);
                console.log(`  Project ${i}: ${project.name} (Owner: ${project.projectAddress})`);
            }
        }

    } catch (error) {
        console.error("\n❌ Error querying projectsByAddress:");
        console.error(error.message);
    }
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
