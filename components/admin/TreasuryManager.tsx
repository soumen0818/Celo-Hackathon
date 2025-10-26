'use client';

import { useState, useEffect } from 'react';
import { useWriteContract, useWaitForTransactionReceipt, useReadContract, useAccount } from 'wagmi';
import { DollarSign, TrendingUp, Wallet, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import { parseUnits, formatUnits } from 'viem';

export default function TreasuryManager() {
    const [depositAmount, setDepositAmount] = useState('');
    const [showSuccessMessage, setShowSuccessMessage] = useState(false);
    const [showErrorMessage, setShowErrorMessage] = useState(false);
    const [depositedAmount, setDepositedAmount] = useState('');
    const { address } = useAccount();

    const contractAddress = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS as `0x${string}`;
    const cUSDAddress = '0x874069Fa1Eb16D44d622F2e0Ca25eeA172369bC1' as `0x${string}`; // Alfajores cUSD

    // Read contract's cUSD balance
    const { data: contractBalance, refetch: refetchBalance, isRefetching: isRefetchingBalance } = useReadContract({
        address: cUSDAddress,
        abi: [
            {
                inputs: [{ name: 'account', type: 'address' }],
                name: 'balanceOf',
                outputs: [{ name: '', type: 'uint256' }],
                stateMutability: 'view',
                type: 'function',
            },
        ],
        functionName: 'balanceOf',
        args: [contractAddress],
    });

    // Read user's cUSD balance
    const { data: userBalance, refetch: refetchUserBalance, isRefetching: isRefetchingUserBalance } = useReadContract({
        address: cUSDAddress,
        abi: [
            {
                inputs: [{ name: 'account', type: 'address' }],
                name: 'balanceOf',
                outputs: [{ name: '', type: 'uint256' }],
                stateMutability: 'view',
                type: 'function',
            },
        ],
        functionName: 'balanceOf',
        args: address ? [address] : undefined,
    });

    // Approve cUSD spending
    const {
        data: approveHash,
        writeContract: approveWrite,
        isPending: isApprovePending,
        isError: isApproveError,
        error: approveError
    } = useWriteContract();

    const { isLoading: isApproveConfirming, isSuccess: isApproveSuccess } =
        useWaitForTransactionReceipt({ hash: approveHash });

    // Transfer cUSD to contract
    const {
        data: transferHash,
        writeContract: transferWrite,
        isPending: isTransferPending,
        isError: isTransferError,
        error: transferError
    } = useWriteContract();

    const { isLoading: isTransferConfirming, isSuccess: isTransferSuccess } =
        useWaitForTransactionReceipt({ hash: transferHash });

    // Handle deposit process
    const handleDeposit = async () => {
        if (!address) {
            alert('Please connect your wallet first!');
            return;
        }

        if (!depositAmount || parseFloat(depositAmount) <= 0) {
            alert('Please enter a valid amount');
            return;
        }

        const amount = parseFloat(depositAmount);
        const userBal = parseFloat(formattedUserBalance);

        if (amount > userBal) {
            alert(`Insufficient balance! You have ${userBal.toFixed(2)} cUSD but trying to deposit ${amount} cUSD`);
            return;
        }

        try {
            const amountInWei = parseUnits(depositAmount, 18);

            console.log('💰 Amount in Wei:', amountInWei.toString());

            // First approve the transfer
            approveWrite({
                address: cUSDAddress,
                abi: [
                    {
                        inputs: [
                            { name: 'spender', type: 'address' },
                            { name: 'amount', type: 'uint256' }
                        ],
                        name: 'approve',
                        outputs: [{ name: '', type: 'bool' }],
                        stateMutability: 'nonpayable',
                        type: 'function',
                    },
                ],
                functionName: 'approve',
                args: [contractAddress, amountInWei],
            });
        } catch (err: any) {
            console.error('❌ Error approving:', err);
            alert('Error: ' + (err?.message || 'Unknown error'));
        }
    };

    // After approval success, call depositToTreasury on the contract
    useEffect(() => {
        if (isApproveSuccess && depositAmount) {
            const amount = parseUnits(depositAmount, 18);

            transferWrite({
                address: contractAddress,
                abi: [
                    {
                        inputs: [{ name: '_amount', type: 'uint256' }],
                        name: 'depositToTreasury',
                        outputs: [],
                        stateMutability: 'nonpayable',
                        type: 'function',
                    },
                ],
                functionName: 'depositToTreasury',
                args: [amount],
            });
        }
    }, [isApproveSuccess]);

    // Refresh balances after successful transfer
    useEffect(() => {
        if (isTransferSuccess) {

            // Store the deposited amount for display
            setDepositedAmount(depositAmount);

            // Show success message
            setShowSuccessMessage(true);
            setShowErrorMessage(false);

            // Wait a bit for blockchain to update, then refresh
            setTimeout(() => {

                refetchBalance();
                refetchUserBalance();
            }, 2000); // Wait 2 seconds before refetching

            // Clear the input field
            setDepositAmount('');

            // Auto-hide success message after 10 seconds
            const timer = setTimeout(() => {
                setShowSuccessMessage(false);
            }, 10000);

            return () => clearTimeout(timer);
        }
    }, [isTransferSuccess, depositAmount, refetchBalance, refetchUserBalance]);

    // Show error message when transaction fails
    useEffect(() => {
        if (isApproveError || isTransferError) {
            console.error('❌ Transaction failed:', approveError || transferError);

            setShowErrorMessage(true);
            setShowSuccessMessage(false);

            // Auto-hide error message after 15 seconds
            const timer = setTimeout(() => {
                setShowErrorMessage(false);
            }, 15000);

            return () => clearTimeout(timer);
        }
    }, [isApproveError, isTransferError, approveError, transferError]);

    const formattedContractBalance = contractBalance
        ? formatUnits(contractBalance as bigint, 18)
        : '0';

    const formattedUserBalance = userBalance
        ? formatUnits(userBalance as bigint, 18)
        : '0';

    return (
        <div className="space-y-6">
            {/* Treasury Balance Display */}
            <div className="bg-gradient-to-br from-green-500/10 to-blue-500/10 rounded-xl p-6 border border-green-500/30">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-xl font-bold text-white flex items-center">
                        <Wallet className="w-6 h-6 mr-2 text-green-400" />
                        Treasury Balance
                    </h3>
                    <button
                        onClick={() => {
                            refetchBalance();
                            refetchUserBalance();
                        }}
                        className="text-sm text-blue-400 hover:text-blue-300"
                    >
                        🔄 Refresh
                    </button>
                </div>

                <div className="bg-gray-900/50 rounded-lg p-6 mb-4">
                    <div className="flex items-center justify-center">
                        <DollarSign className="w-8 h-8 text-green-400 mr-2" />
                        <p className="text-5xl font-bold text-green-400">
                            {parseFloat(formattedContractBalance).toFixed(2)}
                        </p>
                        <span className="text-2xl text-gray-400 ml-2">cUSD</span>
                    </div>
                    <p className="text-center text-gray-400 text-sm mt-2">
                        Available for grant distribution
                    </p>
                    {isTransferConfirming && (
                        <div className="mt-3 text-center">
                            <p className="text-yellow-400 text-xs flex items-center justify-center">
                                <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                                Updating balance...
                            </p>
                        </div>
                    )}
                </div>

                {parseFloat(formattedContractBalance) < 100 && (
                    <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-3">
                        <p className="text-yellow-400 text-sm flex items-center">
                            <AlertCircle className="w-4 h-4 mr-2" />
                            Low treasury balance! Consider depositing more funds.
                        </p>
                    </div>
                )}
            </div>

            {/* Deposit Form */}
            <div className="bg-gray-800/50 rounded-xl p-6 border border-gray-700">
                <h3 className="text-xl font-bold text-white mb-4 flex items-center">
                    <TrendingUp className="w-6 h-6 mr-2 text-blue-400" />
                    Deposit Funds to Treasury
                </h3>

                <div className="space-y-4">
                    {/* User Balance */}
                    <div className="bg-gray-900/50 rounded-lg p-4">
                        <p className="text-sm text-gray-400 mb-3">💰 Your Wallet Balances</p>
                        <div className="space-y-3">
                            <div>
                                <p className="text-xs text-gray-500 mb-1">cUSD Balance (for deposits)</p>
                                <p className="text-2xl font-bold text-white">
                                    {parseFloat(formattedUserBalance).toFixed(2)} cUSD
                                </p>
                            </div>
                            <div className="pt-2 border-t border-gray-700">
                                <p className="text-xs text-gray-500 mb-1">CELO Balance (for gas fees)</p>
                                <p className="text-lg font-semibold text-green-400">
                                    ~1.66 CELO ✅
                                </p>
                            </div>
                        </div>

                        {parseFloat(formattedUserBalance) === 0 && (
                            <div className="mt-3 bg-yellow-500/10 border border-yellow-500/30 rounded p-3">
                                <p className="text-yellow-400 text-xs">
                                    ⚠️ <strong>You have 0 cUSD!</strong>
                                    <br />
                                    You have CELO (for gas) but need cUSD to deposit.
                                    <br />
                                    👇 Use the faucet below to get free cUSD!
                                </p>
                            </div>
                        )}
                    </div>

                    {/* Amount Input */}
                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                            Deposit Amount (cUSD)
                        </label>
                        <div className="relative">
                            <input
                                type="number"
                                value={depositAmount}
                                onChange={(e) => setDepositAmount(e.target.value)}
                                placeholder="0.00"
                                step="0.01"
                                min="0"
                                className="w-full px-4 py-3 bg-gray-900/50 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                            <button
                                onClick={() => setDepositAmount(formattedUserBalance)}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-blue-400 hover:text-blue-300"
                            >
                                MAX
                            </button>
                        </div>
                    </div>

                    {/* Quick Amount Buttons */}
                    <div className="grid grid-cols-4 gap-2">
                        {['100', '500', '1000', '5000'].map((amount) => (
                            <button
                                key={amount}
                                onClick={() => setDepositAmount(amount)}
                                className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg text-white text-sm transition-colors"
                            >
                                {amount}
                            </button>
                        ))}
                    </div>

                    {/* Deposit Button */}
                    <button
                        onClick={handleDeposit}
                        disabled={
                            !depositAmount ||
                            parseFloat(depositAmount) <= 0 ||
                            isApprovePending ||
                            isApproveConfirming ||
                            isTransferPending ||
                            isTransferConfirming
                        }
                        className="w-full px-6 py-4 bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700 disabled:from-gray-600 disabled:to-gray-600 disabled:cursor-not-allowed rounded-lg text-white font-semibold transition-all flex items-center justify-center"
                    >
                        {isApprovePending || isApproveConfirming ? (
                            <>
                                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                                Approving Transaction...
                            </>
                        ) : isTransferPending || isTransferConfirming ? (
                            <>
                                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                                Depositing to Treasury...
                            </>
                        ) : (
                            <>
                                <DollarSign className="w-5 h-5 mr-2" />
                                Deposit to Treasury
                            </>
                        )}
                    </button>

                    {/* Transaction Status */}
                    {(isApprovePending || isApproveConfirming || isTransferPending || isTransferConfirming) && (
                        <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4 animate-pulse">
                            <div className="flex items-start space-x-3">
                                <Loader2 className="w-5 h-5 text-blue-400 animate-spin flex-shrink-0 mt-0.5" />
                                <div className="flex-1">
                                    <p className="text-blue-400 font-semibold text-sm mb-2">
                                        {isApprovePending && "Step 1/2: Waiting for approval confirmation..."}
                                        {isApproveConfirming && "Step 1/2: Confirming approval on blockchain..."}
                                        {isTransferPending && "Step 2/2: Waiting for deposit confirmation..."}
                                        {isTransferConfirming && "Step 2/2: Confirming deposit on blockchain..."}
                                    </p>
                                    <p className="text-gray-400 text-xs">
                                        Please check your wallet and confirm the transaction.
                                        {isTransferConfirming && " Your treasury balance will update automatically once confirmed."}
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Success/Error Messages */}
                    {showSuccessMessage && isTransferSuccess && (
                        <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-4 relative animate-in fade-in slide-in-from-top-2 duration-300">
                            <button
                                onClick={() => setShowSuccessMessage(false)}
                                className="absolute top-2 right-2 text-gray-400 hover:text-white"
                            >
                                ✕
                            </button>
                            <div className="space-y-3">
                                <p className="text-green-400 font-semibold flex items-center">
                                    <CheckCircle className="w-5 h-5 mr-2" />
                                    ✅ Deposit Successful!
                                </p>
                                <div className="text-sm text-green-300 space-y-1">
                                    <p>• <strong>{depositedAmount || 'Your'} cUSD</strong> has been deposited to the treasury</p>
                                    <p>• Treasury balance is updating... {isRefetchingBalance && <Loader2 className="w-3 h-3 inline animate-spin ml-1" />}</p>
                                    <p>• Your wallet balance has been deducted</p>
                                </div>
                                {transferHash && (
                                    <div className="pt-2 border-t border-green-500/30">
                                        <a
                                            href={`https://explorer.celo.org/alfajores/tx/${transferHash}`}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="text-blue-400 hover:text-blue-300 text-sm underline flex items-center"
                                        >
                                            📊 View transaction on Celo Explorer →
                                        </a>
                                        <p className="text-xs text-gray-400 mt-1">
                                            Transaction Hash: {transferHash.slice(0, 10)}...{transferHash.slice(-8)}
                                        </p>
                                    </div>
                                )}
                                <button
                                    onClick={() => {
                                        refetchBalance();
                                        refetchUserBalance();
                                    }}
                                    className="w-full mt-2 px-3 py-2 bg-green-600/20 hover:bg-green-600/30 rounded text-green-400 text-sm flex items-center justify-center"
                                >
                                    {isRefetchingBalance || isRefetchingUserBalance ? (
                                        <>
                                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                            Refreshing...
                                        </>
                                    ) : (
                                        <>
                                            🔄 Refresh Balance Now
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>
                    )}

                    {showErrorMessage && (isApproveError || isTransferError) && (
                        <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4 relative animate-in fade-in slide-in-from-top-2 duration-300">
                            <button
                                onClick={() => setShowErrorMessage(false)}
                                className="absolute top-2 right-2 text-gray-400 hover:text-white"
                            >
                                ✕
                            </button>
                            <div className="space-y-3">
                                <p className="text-red-400 font-semibold flex items-center">
                                    <AlertCircle className="w-5 h-5 mr-2" />
                                    ❌ Transaction Failed
                                </p>
                                <div className="text-sm text-red-300">
                                    <p className="font-semibold mb-2">Error Details:</p>
                                    <div className="bg-red-900/20 rounded p-2 text-xs font-mono break-all max-h-32 overflow-auto">
                                        {approveError?.message || transferError?.message || 'Unknown error occurred'}
                                    </div>
                                </div>
                                <div className="text-yellow-400 text-sm">
                                    <p className="font-semibold mb-2">💡 Possible Reasons:</p>
                                    <ul className="list-disc list-inside space-y-1 text-xs">
                                        <li><strong>Insufficient cUSD:</strong> You don't have enough cUSD in your wallet (need {depositAmount || depositedAmount || '0'} cUSD)</li>
                                        <li><strong>No gas fees:</strong> You need CELO tokens to pay for transaction fees</li>
                                        <li><strong>Rejected transaction:</strong> You declined the transaction in your wallet</li>
                                        <li><strong>Network issues:</strong> Connection problem with Celo Alfajores network</li>
                                        <li><strong>Wallet not connected:</strong> Make sure your wallet is connected to the app</li>
                                        <li><strong>Wrong network:</strong> Make sure you're connected to Celo Alfajores testnet</li>
                                    </ul>
                                </div>
                                <div className="pt-2 border-t border-red-500/30">
                                    <p className="text-xs text-gray-400">
                                        💰 Your current balance: <strong className="text-white">{parseFloat(formattedUserBalance).toFixed(2)} cUSD</strong>
                                    </p>
                                    <p className="text-xs text-gray-400 mt-1">
                                        � Connected wallet: <strong className="text-white">{address ? `${address.slice(0, 6)}...${address.slice(-4)}` : 'Not connected'}</strong>
                                    </p>
                                    <p className="text-xs text-gray-400 mt-1">
                                        �📍 If you need test tokens, use the faucet below
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Show a message if wallet is not connected */}
                    {!address && (
                        <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4">
                            <p className="text-yellow-400 text-sm flex items-center">
                                <AlertCircle className="w-4 h-4 mr-2" />
                                ⚠️ <strong>Wallet Not Connected!</strong> Please connect your wallet to deposit funds.
                            </p>
                        </div>
                    )}

                    {/* Info */}
                    <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-3">
                        <p className="text-blue-400 text-sm">
                            💡 <strong>Info:</strong> Deposited funds will be used to automatically
                            distribute grants when projects get approved by the majority of companies.
                        </p>
                    </div>
                </div>
            </div>

            {/* Get cUSD Instructions */}
            <div className="bg-purple-500/10 border border-purple-500/30 rounded-xl p-6">
                <h4 className="text-lg font-bold text-white mb-3 flex items-center">
                    🚰 How to Get cUSD (Celo Dollar) - NOT CELO!
                </h4>

                <div className="bg-orange-500/10 border border-orange-500/30 rounded-lg p-4 mb-4">
                    <p className="text-orange-400 text-sm font-semibold mb-2">
                        ⚠️ IMPORTANT: You Need cUSD, Not CELO!
                    </p>
                    <div className="text-xs text-gray-300 space-y-1">
                        <p>• <strong>CELO</strong> = Native token (for gas fees) ✅ You have this!</p>
                        <p>• <strong>cUSD</strong> = Stable coin ($1 = 1 cUSD) ❌ You need this!</p>
                        <p>• Treasury only accepts <strong>cUSD</strong> deposits</p>
                    </div>
                </div>

                <div className="space-y-4">
                    <div className="bg-gray-900/50 rounded-lg p-4">
                        <p className="text-sm text-gray-300 mb-3">
                            <strong className="text-white">Your Admin Wallet:</strong>
                        </p>
                        <code className="text-xs text-blue-400 bg-gray-800 p-2 rounded block break-all">
                            {address || '0xcD7432D02Ac572F6318AFa367232af54c3217018'}
                        </code>
                    </div>

                    <div className="space-y-2">
                        <p className="text-white font-semibold text-sm">📌 Get Free cUSD (Step by Step):</p>
                        <ol className="space-y-2 text-gray-300 text-sm list-decimal list-inside">
                            <li>
                                Visit{' '}
                                <a
                                    href="https://faucet.celo.org/alfajores"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-blue-400 hover:underline font-semibold"
                                >
                                    Celo Alfajores Faucet
                                </a>
                            </li>
                            <li>Paste your wallet address (shown above)</li>
                            <li className="font-bold text-yellow-400">
                                ⚠️ MAKE SURE TO SELECT "cUSD" (not CELO) from the dropdown!
                            </li>
                            <li>Click "Get Alfajores cUSD" - you'll receive <strong>10 cUSD</strong></li>
                            <li>Wait 10-30 seconds for tokens to arrive</li>
                            <li>Refresh this page to see your updated cUSD balance</li>
                        </ol>
                    </div>

                    <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-3">
                        <p className="text-green-400 text-xs">
                            ✅ <strong>Alternative:</strong> You can also swap your CELO for cUSD on{' '}
                            <a
                                href="https://app.ubeswap.org/#/swap"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="underline"
                            >
                                Ubeswap
                            </a> (keep at least 1 CELO for gas!)
                        </p>
                    </div>

                    <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-3">
                        <p className="text-yellow-400 text-xs">
                            💡 <strong>Current Status:</strong>
                            <br />• Your cUSD Balance: <strong>{parseFloat(formattedUserBalance).toFixed(2)} cUSD</strong>
                            <br />• Your CELO Balance: <strong>~1.66 CELO</strong> (for gas fees ✅)
                            <br />• You need cUSD to deposit to the treasury!
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
