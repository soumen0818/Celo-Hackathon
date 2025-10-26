const { Wallet } = require("ethers");

// Your private key from .env.local
const privateKey = "5e6ea55ec3fd504129ea3f0f3712031913bf2035c897115b73e8234964b7d423";

const wallet = new Wallet(privateKey);

console.log("\n=====================================");
console.log("ADMIN WALLET ADDRESS:");
console.log(wallet.address);
console.log("=====================================\n");
