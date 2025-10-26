const hre = require("hardhat");

async function main() {
    const contractAddress = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS;
    const cUSDAddress = '0x874069Fa1Eb16D44d622F2e0Ca25eeA172369bC1'; // Alfajores cUSD

    if (!contractAddress) {
        console.error('❌ Contract address not found in .env.local');
        process.exit(1);
    }

    console.log('🔍 Checking balances...\n');
    console.log('📍 Contract Address:', contractAddress);
    console.log('💵 cUSD Token Address:', cUSDAddress);
    console.log('─'.repeat(60));

    // Get cUSD token contract
    const cUSDContract = await hre.ethers.getContractAt(
        'IERC20',
        cUSDAddress
    );

    // Check contract's cUSD balance
    const balance = await cUSDContract.balanceOf(contractAddress);
    const balanceInCUSD = hre.ethers.formatUnits(balance, 18);

    console.log('\n💰 Treasury Balance:');
    console.log('   Raw:', balance.toString(), 'wei');
    console.log('   Formatted:', balanceInCUSD, 'cUSD');
    console.log('─'.repeat(60));

    if (parseFloat(balanceInCUSD) === 0) {
        console.log('\n⚠️  WARNING: Contract has no cUSD balance!');
        console.log('   The contract needs cUSD to distribute grants.');
        console.log('\n📝 To fund the contract:');
        console.log('   1. Get test cUSD from: https://faucet.celo.org');
        console.log('   2. Send cUSD to contract:', contractAddress);
        console.log('   3. Or use the Admin UI to deposit funds');
    } else {
        console.log('\n✅ Contract has sufficient funds for grants!');
    }

    console.log('\n🔗 View on Explorer:');
    console.log(`   https://alfajores.celoscan.io/address/${contractAddress}`);
}

main()
    .then(() => process.exit(0))
    .catch((error: any) => {
        console.error(error);
        process.exit(1);
    });
