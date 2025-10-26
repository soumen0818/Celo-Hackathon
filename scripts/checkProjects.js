const { ethers } = require('hardhat');

async function main() {
    console.log('🔍 Checking Blockchain for Projects...\n');

    const contractAddress = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS || '0x0243FD476b211BC4FB086f33876Af847868fdDd7';

    console.log('Contract Address:', contractAddress);
    console.log('Network: Celo Alfajores Testnet\n');

    // Minimal ABI just to read projectCount
    const minimalABI = [
        'function projectCount() view returns (uint256)',
        'function getProject(uint256) view returns (tuple(uint256 id, address projectAddress, string name, string description, string githubUrl, uint256 requestedAmount, uint256 votesFor, uint256 votesAgainst, uint256 totalGrantsReceived, uint256 createdAt, bool isActive, bool isApproved, bool isFunded))',
        'function getAllCompanies() view returns (address[])',
    ];

    try {
        const contract = await ethers.getContractAt(minimalABI, contractAddress);

        // Get project count
        const count = await contract.projectCount();
        console.log('📊 Total Projects on Blockchain:', count.toString());

        // Get companies
        try {
            const companies = await contract.getAllCompanies();
            console.log('🏢 Total Registered Companies:', companies.length);
            console.log('Companies:', companies);
        } catch (err) {
            console.log('⚠️  Could not fetch companies');
        }

        if (count > 0) {
            console.log('\n📁 Projects:\n');
            for (let i = 0; i < count; i++) {
                try {
                    const project = await contract.getProject(i);
                    console.log(`Project ${i}:`);
                    console.log('  Name:', project.name);
                    console.log('  Description:', project.description);
                    console.log('  GitHub:', project.githubUrl);
                    console.log('  Requested Amount:', ethers.formatEther(project.requestedAmount), 'CELO');
                    console.log('  Votes For:', project.votesFor.toString());
                    console.log('  Votes Against:', project.votesAgainst.toString());
                    console.log('  Is Active:', project.isActive);
                    console.log('  Is Approved:', project.isApproved);
                    console.log('  Is Funded:', project.isFunded);
                    console.log('  Project Address:', project.projectAddress);
                    console.log('');
                } catch (err) {
                    console.error(`❌ Error fetching project ${i}:`, err.message);
                }
            }
        } else {
            console.log('\n⚠️  No projects found on blockchain!');
            console.log('\nℹ️  This means:');
            console.log('   1. No projects have been submitted yet, OR');
            console.log('   2. Projects were submitted to a different contract address');
            console.log('\nTo submit a project:');
            console.log('   1. Go to http://localhost:3000/dashboard');
            console.log('   2. Fill in the project form (including Requested Amount)');
            console.log('   3. Submit and confirm the transaction');
            console.log('   4. Run this script again to verify');
        }

        console.log('\n✅ Blockchain check complete!');
    } catch (error) {
        console.error('\n❌ Error connecting to contract:');
        console.error(error.message);
        console.log('\nPossible issues:');
        console.log('  1. Contract address is wrong');
        console.log('  2. Not connected to Alfajores network');
        console.log('  3. Contract not deployed');
    }
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
