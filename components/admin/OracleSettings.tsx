'use client';

import { useState } from 'react';
import { useReadContract, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { parseEther } from 'viem';
import { RefreshCw, CheckCircle, AlertCircle, Copy } from 'lucide-react';

export default function OracleSettings() {
    const [newOracleAddress, setNewOracleAddress] = useState('');
    const contractAddress = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS as `0x${string}`;

    // Read current oracle address
    const { data: currentOracle, refetch: refetchOracle } = useReadContract({
        address: contractAddress,
        abi: [
            {
                inputs: [],
                name: 'aiOracle',
                outputs: [{ name: '', type: 'address' }],
                stateMutability: 'view',
                type: 'function',
            },
        ],
        functionName: 'aiOracle',
    });

    // Write contract hook for updating oracle
    const { data: hash, writeContract, isPending, isError, error } = useWriteContract();

    const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
        hash,
    });

    const handleUpdateOracle = async () => {
        if (!newOracleAddress) {
            alert('Please enter an oracle address');
            return;
        }

        try {
            writeContract({
                address: contractAddress,
                abi: [
                    {
                        inputs: [
                            {
                                name: '_newOracle',
                                type: 'address',
                            },
                        ],
                        name: 'updateAIOracle',
                        outputs: [],
                        stateMutability: 'nonpayable',
                        type: 'function',
                    },
                ],
                functionName: 'updateAIOracle',
                args: [newOracleAddress as `0x${string}`],
            });
        } catch (err) {
            console.error('Error updating oracle:', err);
        }
    };

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text);
    };

    return (
        <div className="space-y-6">
            {/* Current Oracle Display */}
            <div className="bg-gray-800/50 rounded-xl p-6 border border-gray-700">
                <h3 className="text-xl font-semibold text-white mb-4 flex items-center">
                    <RefreshCw className="w-5 h-5 mr-2 text-blue-400" />
                    Current AI Oracle Address
                </h3>

                {currentOracle ? (
                    <div className="bg-gray-900/50 rounded-lg p-4 border border-gray-600">
                        <div className="flex items-center justify-between">
                            <div className="font-mono text-sm text-gray-300 break-all">
                                {currentOracle as string}
                            </div>
                            <button
                                onClick={() => copyToClipboard(currentOracle as string)}
                                className="ml-4 p-2 hover:bg-gray-700 rounded-lg transition-colors"
                                title="Copy address"
                            >
                                <Copy className="w-4 h-4 text-gray-400" />
                            </button>
                        </div>
                    </div>
                ) : (
                    <div className="text-gray-400">Loading...</div>
                )}

                <button
                    onClick={() => refetchOracle()}
                    className="mt-4 px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg text-white text-sm transition-colors"
                >
                    Refresh
                </button>
            </div>

            {/* Update Oracle */}
            <div className="bg-gray-800/50 rounded-xl p-6 border border-gray-700">
                <h3 className="text-xl font-semibold text-white mb-4">Update AI Oracle</h3>

                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                            New Oracle Address
                        </label>
                        <input
                            type="text"
                            value={newOracleAddress}
                            onChange={(e) => setNewOracleAddress(e.target.value)}
                            placeholder="0x..."
                            className="w-full px-4 py-3 bg-gray-900/50 border border-gray-600 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
                        />
                        <p className="mt-2 text-sm text-gray-400">
                            Enter the wallet address that will be authorized to update AI scores
                        </p>
                    </div>

                    <button
                        onClick={handleUpdateOracle}
                        disabled={isPending || isConfirming || !newOracleAddress}
                        className="w-full px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed rounded-lg text-white font-semibold transition-colors"
                    >
                        {isPending || isConfirming ? (
                            <span className="flex items-center justify-center">
                                <RefreshCw className="w-5 h-5 mr-2 animate-spin" />
                                {isPending ? 'Waiting for approval...' : 'Updating...'}
                            </span>
                        ) : (
                            'Update Oracle Address'
                        )}
                    </button>

                    {/* Success Message */}
                    {isSuccess && (
                        <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-4">
                            <div className="flex items-center text-green-400">
                                <CheckCircle className="w-5 h-5 mr-2" />
                                <div>
                                    <p className="font-semibold">Oracle Updated Successfully!</p>
                                    <p className="text-sm mt-1">Transaction hash: {hash?.slice(0, 10)}...{hash?.slice(-8)}</p>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Error Message */}
                    {isError && (
                        <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4">
                            <div className="flex items-start text-red-400">
                                <AlertCircle className="w-5 h-5 mr-2 mt-0.5" />
                                <div>
                                    <p className="font-semibold">Transaction Failed</p>
                                    <p className="text-sm mt-1">{error?.message || 'Unknown error occurred'}</p>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Info Box */}
            <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4">
                <h4 className="text-blue-400 font-semibold mb-2">ℹ️ About AI Oracle</h4>
                <ul className="text-sm text-gray-300 space-y-1">
                    <li>• The AI Oracle is the wallet authorized to update project impact scores</li>
                    <li>• Only the contract owner (you) can change the oracle address</li>
                    <li>• Make sure the oracle wallet has some CELO for gas fees</li>
                    <li>• The oracle can be a backend service wallet or your own wallet</li>
                </ul>
            </div>
        </div>
    );
}
