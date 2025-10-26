import { ethers } from "hardhat";

async function main() {
    const contractAddress = "0xFaBe97e108F5c71a305EB557DBe24c5c639b7cE2";

    console.log("🚀 Registering existing projects on blockchain...\n");

    // Get the contract
    const GrantDistribution = await ethers.getContractAt("GrantDistribution", contractAddress);

    // Get signer
    const [signer] = await ethers.getSigners();
    console.log("📝 Using wallet:", signer.address);
    console.log("");

    // Check current project count
    const currentCount = await GrantDistribution.projectCount();
    console.log("📊 Current blockchain project count:", currentCount.toString());
    console.log("");

    // YOUR PROJECTS - UPDATE THIS WITH YOUR ACTUAL PROJECT DATA FROM SUPABASE
    const projects = [
        {
            name: "AI Grant Platform",
            description: "AI-powered grant distribution system for Celo ecosystem",
            githubUrl: "https://github.com/Sumanpradhan1706/AI-Powered-Grant-Distribution-on-Celo"
        },
        // Add more projects here if you have them
        // {
        //     name: "Second Project",
        //     description: "Description here",
        //     githubUrl: "https://github.com/username/repo"
        // },
    ];

    console.log(`🎯 Will register ${projects.length} project(s)\n`);
    console.log("⚠️  IMPORTANT: Make sure these match your Supabase database projects!\n");

    for (let i = 0; i < projects.length; i++) {
        const project = projects[i];
        console.log(`\n[${i + 1}/${projects.length}] Registering: ${project.name}`);
        console.log(`   GitHub: ${project.githubUrl}`);

        try {
            const tx = await GrantDistribution.registerProject(
                project.name,
                project.description,
                project.githubUrl
            );

            console.log(`   📤 Transaction sent: ${tx.hash}`);
            console.log(`   ⏳ Waiting for confirmation...`);

            const receipt = await tx.wait();

            if (!receipt) {
                console.log(`   ⚠️  No receipt received`);
                continue;
            }

            // Parse the event to get project ID
            const event = receipt.logs.find((log: any) => {
                try {
                    const parsed = GrantDistribution.interface.parseLog({
                        topics: log.topics as string[],
                        data: log.data
                    });
                    return parsed?.name === 'ProjectRegistered';
                } catch {
                    return false;
                }
            });

            if (event) {
                const parsed = GrantDistribution.interface.parseLog({
                    topics: event.topics as string[],
                    data: event.data
                });
                const projectId = parsed?.args[0];
                console.log(`   ✅ Success! Blockchain Project ID: ${projectId}`);
                console.log(`   🔗 https://alfajores.celoscan.io/tx/${tx.hash}`);
                console.log(`\n   📝 UPDATE YOUR SUPABASE DATABASE:`);
                console.log(`   UPDATE projects SET blockchain_project_id = ${projectId} WHERE id = ${i + 1};`);
            } else {
                console.log(`   ✅ Transaction confirmed!`);
                console.log(`   🔗 https://alfajores.celoscan.io/tx/${tx.hash}`);
            }
        } catch (error: any) {
            console.error(`   ❌ Failed:`, error.message);
        }

        // Wait between transactions
        if (i < projects.length - 1) {
            console.log("\n   ⏳ Waiting 3 seconds before next registration...");
            await new Promise(resolve => setTimeout(resolve, 3000));
        }
    }

    // Final verification
    const finalCount = await GrantDistribution.projectCount();
    console.log(`\n\n✅ DONE! Total projects on blockchain: ${finalCount}`);

    // Show details of registered projects
    console.log(`\n📋 Registered Projects:\n`);
    for (let i = 0; i < Number(finalCount); i++) {
        const project = await GrantDistribution.projects(i);
        console.log(`Project ${i}:`);
        console.log(`  Name: ${project.name}`);
        console.log(`  Address: ${project.projectAddress}`);
        console.log(`  GitHub: ${project.githubUrl}`);
        console.log(`  Score: ${project.impactScore}`);
        console.log(``);
    }

    console.log(`\n🎯 NEXT STEPS:`);
    console.log(`1. Copy the UPDATE commands above`);
    console.log(`2. Run them in Supabase SQL Editor`);
    console.log(`3. This will sync your database with blockchain IDs`);
    console.log(`4. Then try updating scores again!`);
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
