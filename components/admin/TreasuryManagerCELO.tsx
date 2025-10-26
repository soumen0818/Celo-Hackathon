'use client';

import { useState, useEffect } from 'react';
import { useWriteContract, useWaitForTransactionReceipt, useBalance, useAccount } from 'wagmi';
import { DollarSign, TrendingUp, Wallet, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import { parseEther, formatEther } from 'viem';

export default function TreasuryManagerCELO() {
    const [depositAmount, setDepositAmount] = useState('');
    const [showSuccessMessage, setShowSuccessMessage] = useState(false);
    const [showErrorMessage, setShowErrorMessage] = useState(false);
    const [depositedAmount, setDepositedAmount] = useState('');
    const { address } = useAccount();

    const contractAddress = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS as `0x${string}`;

    // Read contract's CELO balance (native)
    const { data: contractBalance, refetch: refetchBalance, isRefetching: isRefetchingBalance } = useBalance({
        address: contractAddress,
    });

    // Read user's CELO balance (native)
    const { data: userBalance, refetch: refetchUserBalance, isRefetching: isRefetchingUserBalance } = useBalance({
        address: address,
    });

    // Deposit CELO to contract
    const {
        data: depositHash,
        writeContract: depositWrite,
        isPending: isDepositPending,
        isError: isDepositError,
        error: depositError
    } = useWriteContract();

    const { isLoading: isDepositConfirming, isSuccess: isDepositSuccess } =
        useWaitForTransactionReceipt({ hash: depositHash });

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
        const userBal = userBalance ? parseFloat(formatEther(userBalance.value)) : 0;

        if (amount > userBal) {
            alert(`Insufficient balance! You have ${userBal.toFixed(2)} CELO but trying to deposit ${amount} CELO`);
            return;
        }

        try {
            const amountInWei = parseEther(depositAmount);

            console.log('💰 Amount in Wei:', amountInWei.toString());

            // Send CELO directly to contract
            depositWrite({
                address: contractAddress,
                abi: [
                    {
                        inputs: [],
                        name: 'depositToTreasury',
                        outputs: [],
                        stateMutability: 'payable',
                        type: 'function',
                    },
                ],
                functionName: 'depositToTreasury',
                value: amountInWei,
            });
        } catch (err: any) {
            console.error('❌ Error depositing:', err);
            alert('Error: ' + (err?.message || 'Unknown error'));
        }
    };

    // Refresh balances after successful transfer
    useEffect(() => {
        if (isDepositSuccess) {

            // Store the deposited amount for display
            setDepositedAmount(depositAmount);

            // Show success message
            setShowSuccessMessage(true);
            setShowErrorMessage(false);

            // Wait a bit for blockchain to update, then refresh
            setTimeout(() => {

                refetchBalance();
                refetchUserBalance();
            }, 2000);

            // Clear the input field
            setDepositAmount('');

            // Auto-hide success message after 10 seconds
            const timer = setTimeout(() => {
                setShowSuccessMessage(false);
            }, 10000);

            return () => clearTimeout(timer);
        }
    }, [isDepositSuccess, depositAmount, refetchBalance, refetchUserBalance]);

    // Show error message when transaction fails
    useEffect(() => {
        if (isDepositError) {
            console.error('❌ Transaction failed:', depositError);

            setShowErrorMessage(true);
            setShowSuccessMessage(false);

            // Auto-hide error message after 15 seconds
            const timer = setTimeout(() => {
                setShowErrorMessage(false);
            }, 15000);

            return () => clearTimeout(timer);
        }
    }, [isDepositError, depositError]);

    const formattedContractBalance = contractBalance
        ? formatEther(contractBalance.value)
        : '0';

    const formattedUserBalance = userBalance
        ? formatEther(userBalance.value)
        : '0';

    return (
        <div className="space-y-6">
            {/* Treasury Balance Display */}
            <div className="bg-gradient-to-br from-green-500/10 to-blue-500/10 rounded-xl p-6 border border-green-500/30">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-xl font-bold text-white flex items-center">
                        <Wallet className="w-6 h-6 mr-2 text-green-400" />
                        Treasury Balance (Native CELO)
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
                            {parseFloat(formattedContractBalance).toFixed(4)}
                        </p>
                        <span className="text-2xl text-gray-400 ml-2">CELO</span>
                    </div>
                    <p className="text-center text-gray-400 text-sm mt-2">
                        Available for grant distribution
                    </p>
                    {isDepositConfirming && (
                        <div className="mt-3 text-center">
                            <p className="text-yellow-400 text-xs flex items-center justify-center">
                                <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                                Updating balance...
                            </p>
                        </div>
                    )}
                </div>

                {parseFloat(formattedContractBalance) < 1 && (
                    <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-3">
                        <p className="text-yellow-400 text-sm flex items-center">
                            <AlertCircle className="w-4 h-4 mr-2" />
                            Low treasury balance! Consider depositing more CELO.
                        </p>
                    </div>
                )}
            </div>

            {/* Deposit Form */}
            <div className="bg-gray-800/50 rounded-xl p-6 border border-gray-700">
                <h3 className="text-xl font-bold text-white mb-4 flex items-center">
                    <TrendingUp className="w-6 h-6 mr-2 text-blue-400" />
                    Deposit CELO to Treasury
                </h3>

                <div className="space-y-4">
                    {/* User Balance */}
                    <div className="bg-gray-900/50 rounded-lg p-4">
                        <p className="text-sm text-gray-400 mb-3">💰 Your CELO Balance</p>
                        <p className="text-2xl font-bold text-white">
                            {parseFloat(formattedUserBalance).toFixed(4)} CELO
                        </p>
                        <p className="text-xs text-gray-500 mt-2">
                            ✅ You can now use your CELO directly for treasury deposits!
                        </p>
                    </div>

                    {/* Amount Input */}
                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                            Deposit Amount (CELO)
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
                                onClick={() => {
                                    // Leave some CELO for gas
                                    const maxDeposit = Math.max(0, parseFloat(formattedUserBalance) - 0.1);
                                    setDepositAmount(maxDeposit.toFixed(4));
                                }}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-blue-400 hover:text-blue-300"
                            >
                                MAX
                            </button>
                        </div>
                        <p className="text-xs text-gray-500 mt-1">
                            💡 Tip: Keep at least 0.1 CELO for future gas fees
                        </p>
                    </div>

                    {/* Quick Amount Buttons */}
                    <div className="grid grid-cols-4 gap-2">
                        {['0.1', '0.5', '1', '1.5'].map((amount) => (
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
                            isDepositPending ||
                            isDepositConfirming
                        }
                        className="w-full px-6 py-4 bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700 disabled:from-gray-600 disabled:to-gray-600 disabled:cursor-not-allowed rounded-lg text-white font-semibold transition-all flex items-center justify-center"
                    >
                        {isDepositPending || isDepositConfirming ? (
                            <>
                                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                                {isDepositPending ? 'Confirming in Wallet...' : 'Depositing CELO...'}
                            </>
                        ) : (
                            <>
                                <DollarSign className="w-5 h-5 mr-2" />
                                Deposit CELO to Treasury
                            </>
                        )}
                    </button>

                    {/* Transaction Status */}
                    {(isDepositPending || isDepositConfirming) && (
                        <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4 animate-pulse">
                            <div className="flex items-start space-x-3">
                                <Loader2 className="w-5 h-5 text-blue-400 animate-spin flex-shrink-0 mt-0.5" />
                                <div className="flex-1">
                                    <p className="text-blue-400 font-semibold text-sm mb-2">
                                        {isDepositPending && "Waiting for transaction confirmation..."}
                                        {isDepositConfirming && "Confirming deposit on blockchain..."}
                                    </p>
                                    <p className="text-gray-400 text-xs">
                                        Please check your wallet and confirm the transaction.
                                        {isDepositConfirming && " Your treasury balance will update automatically once confirmed."}
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Success Message */}
                    {showSuccessMessage && isDepositSuccess && (
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
                                    <p>• <strong>{depositedAmount || 'Your'} CELO</strong> has been deposited to the treasury</p>
                                    <p>• Treasury balance is updating... {isRefetchingBalance && <Loader2 className="w-3 h-3 inline animate-spin ml-1" />}</p>
                                    <p>• Your wallet balance has been deducted</p>
                                </div>
                                {depositHash && (
                                    <div className="pt-2 border-t border-green-500/30">
                                        <a
                                            href={`https://explorer.celo.org/alfajores/tx/${depositHash}`}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="text-blue-400 hover:text-blue-300 text-sm underline flex items-center"
                                        >
                                            📊 View transaction on Celo Explorer →
                                        </a>
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

                    {/* Error Message */}
                    {showErrorMessage && isDepositError && (
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
                                        {depositError?.message || 'Unknown error occurred'}
                                    </div>
                                </div>
                                <div className="text-yellow-400 text-sm">
                                    <p className="font-semibold mb-2">💡 Possible Reasons:</p>
                                    <ul className="list-disc list-inside space-y-1 text-xs">
                                        <li><strong>Insufficient CELO:</strong> Need {depositAmount || depositedAmount || '0'} CELO + gas fees</li>
                                        <li><strong>Rejected transaction:</strong> You declined in your wallet</li>
                                        <li><strong>Network issues:</strong> Connection problem with Celo Alfajores</li>
                                        <li><strong>Wrong network:</strong> Make sure you're on Celo Alfajores testnet</li>
                                    </ul>
                                </div>
                                <div className="pt-2 border-t border-red-500/30">
                                    <p className="text-xs text-gray-400">
                                        💰 Your current balance: <strong className="text-white">{parseFloat(formattedUserBalance).toFixed(4)} CELO</strong>
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}

                    {!address && (
                        <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4">
                            <p className="text-yellow-400 text-sm flex items-center">
                                <AlertCircle className="w-4 h-4 mr-2" />
                                ⚠️ <strong>Wallet Not Connected!</strong> Please connect your wallet to deposit CELO.
                            </p>
                        </div>
                    )}

                    {/* Info */}
                    <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-3">
                        <p className="text-blue-400 text-sm">
                            💡 <strong>Using Native CELO:</strong> You can now deposit your 1.66 CELO directly! No need for cUSD.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
