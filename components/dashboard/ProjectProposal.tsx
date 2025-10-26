'use client';

import { useState, useEffect } from 'react';
import { useWriteContract, useWaitForTransactionReceipt, useReadContract, useAccount } from 'wagmi';
import { parseUnits } from 'viem';
import { FileText, DollarSign, CheckCircle, AlertCircle, Loader2, Github, X } from 'lucide-react';

export default function ProjectProposal() {
    const [projectName, setProjectName] = useState('');
    const [description, setDescription] = useState('');
    const [githubUrl, setGithubUrl] = useState('');
    const [requestedAmount, setRequestedAmount] = useState('');
    const [isValidatingRepo, setIsValidatingRepo] = useState(false);
    const [repoValidation, setRepoValidation] = useState<{
        isValid: boolean | null;
        message: string;
    }>({ isValid: null, message: '' });
    const [showNotification, setShowNotification] = useState(false);
    const { address } = useAccount();

    const contractAddress = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS as `0x${string}`;

    const { data: hash, writeContract, isPending, isError, error } = useWriteContract();
    const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });

    // Validate GitHub repository
    const validateGitHubRepo = async (url: string) => {
        if (!url) {
            setRepoValidation({ isValid: null, message: '' });
            return;
        }

        // Extract owner and repo from GitHub URL
        const githubRegex = /github\.com\/([^\/]+)\/([^\/]+)/;
        const match = url.match(githubRegex);

        if (!match) {
            setRepoValidation({
                isValid: false,
                message: 'Invalid GitHub URL format. Use: https://github.com/username/repo'
            });
            return;
        }

        const [, owner, repo] = match;
        const cleanRepo = repo.replace(/\.git$/, ''); // Remove .git if present

        setIsValidatingRepo(true);
        setRepoValidation({ isValid: null, message: 'Validating repository...' });

        try {
            const response = await fetch(`https://api.github.com/repos/${owner}/${cleanRepo}`);

            if (response.ok) {
                const data = await response.json();
                setRepoValidation({
                    isValid: true,
                    message: `✓ Repository verified: ${data.full_name} (${data.stargazers_count} stars)`
                });
            } else if (response.status === 404) {
                setRepoValidation({
                    isValid: false,
                    message: '✗ Repository not found. Please check the URL and ensure the repository is public.'
                });
            } else {
                setRepoValidation({
                    isValid: false,
                    message: `✗ Unable to verify repository (Status: ${response.status})`
                });
            }
        } catch (error) {
            setRepoValidation({
                isValid: false,
                message: '✗ Error validating repository. Please check your internet connection.'
            });
        } finally {
            setIsValidatingRepo(false);
        }
    };

    // Validate repo when GitHub URL changes (with debounce)
    useEffect(() => {
        const timer = setTimeout(() => {
            if (githubUrl) {
                validateGitHubRepo(githubUrl);
            }
        }, 800); // Wait 800ms after user stops typing

        return () => clearTimeout(timer);
    }, [githubUrl]);

    const handleProposeProject = async (e: React.FormEvent) => {
        e.preventDefault();







        if (!projectName || !description || !githubUrl || !requestedAmount) {
            alert('Please fill in all fields');
            return;
        }

        // Check if repository is validated
        if (repoValidation.isValid !== true) {
            alert('Please enter a valid GitHub repository URL that exists and is publicly accessible.');
            return;
        }

        if (!address) {
            alert('Please connect your wallet first');
            return;
        }

        try {
            const amountInWei = parseUnits(requestedAmount, 18); // CELO has 18 decimals
            console.log('Amount in Wei:', amountInWei.toString());

            writeContract({
                address: contractAddress,
                abi: [
                    {
                        inputs: [
                            { name: '_name', type: 'string' },
                            { name: '_description', type: 'string' },
                            { name: '_githubUrl', type: 'string' },
                            { name: '_requestedAmount', type: 'uint256' }
                        ],
                        name: 'proposeProject',
                        outputs: [{ name: '', type: 'uint256' }],
                        stateMutability: 'nonpayable',
                        type: 'function',
                    },
                ],
                functionName: 'proposeProject',
                args: [projectName, description, githubUrl, amountInWei],
            });

        } catch (err) {
            console.error('Error proposing project:', err);
            alert(`Error: ${err instanceof Error ? err.message : 'Unknown error'}`);
        }
    };

    useEffect(() => {
        if (isSuccess) {

            // Show notification
            setShowNotification(true);

            // Reset form on success
            setProjectName('');
            setDescription('');
            setGithubUrl('');
            setRequestedAmount('');
            setRepoValidation({ isValid: null, message: '' });

            // Auto-hide notification after 10 seconds
            setTimeout(() => {
                setShowNotification(false);
            }, 10000);
        }
    }, [isSuccess, hash]);

    useEffect(() => {
        if (isError) {
            console.error('❌ Transaction failed:', error);
            console.error('Error message:', error?.message);
            console.error('Error details:', error);
            // Show notification
            setShowNotification(true);

            // Auto-hide notification after 10 seconds
            setTimeout(() => {
                setShowNotification(false);
            }, 10000);
        }
    }, [isError, error]);

    useEffect(() => {
        if (isPending) {

        }
    }, [isPending]);

    useEffect(() => {
        if (isConfirming) {

        }
    }, [isConfirming]);

    return (
        <>
            {/* Fixed Top Notification */}
            {showNotification && (isSuccess || isError) && (
                <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50 w-full max-w-2xl px-4 animate-in slide-in-from-top">
                    {isSuccess && (
                        <div className="bg-green-500 border-2 border-green-400 rounded-lg p-4 shadow-2xl">
                            <div className="flex items-start justify-between">
                                <div className="flex items-start space-x-3">
                                    <CheckCircle className="w-6 h-6 text-white flex-shrink-0 mt-0.5" />
                                    <div className="text-white">
                                        <p className="font-bold text-lg">✅ Project Proposal Submitted Successfully!</p>
                                        <p className="text-sm mt-1 text-green-50">
                                            Your project has been stored on the blockchain. Companies will now review and vote on your proposal.
                                        </p>
                                        {hash && (
                                            <div className="mt-2 bg-green-600/30 rounded px-2 py-1">
                                                <p className="text-xs font-mono break-all">Transaction: {hash}</p>
                                                <a
                                                    href={`https://alfajores.celoscan.io/tx/${hash}`}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="text-xs underline hover:text-green-100"
                                                >
                                                    View on Celoscan →
                                                </a>
                                            </div>
                                        )}
                                    </div>
                                </div>
                                <button
                                    onClick={() => setShowNotification(false)}
                                    className="text-white hover:text-green-100 transition-colors"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </div>
                        </div>
                    )}

                    {isError && (
                        <div className="bg-red-500 border-2 border-red-400 rounded-lg p-4 shadow-2xl">
                            <div className="flex items-start justify-between">
                                <div className="flex items-start space-x-3">
                                    <AlertCircle className="w-6 h-6 text-white flex-shrink-0 mt-0.5" />
                                    <div className="text-white">
                                        <p className="font-bold text-lg">❌ Proposal Submission Failed</p>
                                        <p className="text-sm mt-1 text-red-50">
                                            {error?.message?.includes('User rejected')
                                                ? 'You rejected the transaction in your wallet.'
                                                : error?.message?.includes('insufficient funds')
                                                    ? 'Insufficient funds to pay for gas fees. Please add CELO to your wallet.'
                                                    : error?.message?.includes('already exists')
                                                        ? 'A project with this name or GitHub URL already exists.'
                                                        : `Error: ${error?.message || 'Unknown error occurred. Please try again.'}`
                                            }
                                        </p>
                                        <p className="text-xs mt-2 text-red-100">
                                            💡 Tip: Make sure you have enough CELO for gas fees and check your wallet connection.
                                        </p>
                                    </div>
                                </div>
                                <button
                                    onClick={() => setShowNotification(false)}
                                    className="text-white hover:text-red-100 transition-colors"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            )}

            <div className="bg-gray-800/50 rounded-xl p-6 border border-gray-700">
                <h3 className="text-2xl font-bold text-white mb-6 flex items-center">
                    <FileText className="w-6 h-6 mr-2 text-green-400" />
                    Propose Your Project for Grant
                </h3>

                <form onSubmit={handleProposeProject} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                            Project Name
                        </label>
                        <input
                            type="text"
                            value={projectName}
                            onChange={(e) => setProjectName(e.target.value)}
                            placeholder="Your Awesome DApp"
                            className="w-full px-4 py-3 bg-gray-900/50 border border-gray-600 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-green-500"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                            Description
                        </label>
                        <textarea
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder="Describe your project, its impact, and how you'll use the grant..."
                            rows={4}
                            className="w-full px-4 py-3 bg-gray-900/50 border border-gray-600 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-green-500"
                        />
                    </div>

                    <div>
                        <label className="flex items-center text-sm font-medium text-gray-300 mb-2">
                            <Github className="w-4 h-4 mr-1" />
                            GitHub Repository URL
                        </label>
                        <div className="relative">
                            <input
                                type="url"
                                value={githubUrl}
                                onChange={(e) => setGithubUrl(e.target.value)}
                                placeholder="https://github.com/username/repo"
                                className={`w-full px-4 py-3 bg-gray-900/50 border rounded-lg text-white placeholder-gray-500 focus:outline-none ${repoValidation.isValid === true
                                    ? 'border-green-500 focus:border-green-500'
                                    : repoValidation.isValid === false
                                        ? 'border-red-500 focus:border-red-500'
                                        : 'border-gray-600 focus:border-green-500'
                                    }`}
                            />
                            {isValidatingRepo && (
                                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                                    <Loader2 className="w-5 h-5 text-blue-400 animate-spin" />
                                </div>
                            )}
                            {!isValidatingRepo && repoValidation.isValid === true && (
                                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                                    <CheckCircle className="w-5 h-5 text-green-400" />
                                </div>
                            )}
                            {!isValidatingRepo && repoValidation.isValid === false && (
                                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                                    <AlertCircle className="w-5 h-5 text-red-400" />
                                </div>
                            )}
                        </div>
                        {repoValidation.message && (
                            <p className={`text-xs mt-1 ${repoValidation.isValid === true ? 'text-green-400' :
                                repoValidation.isValid === false ? 'text-red-400' :
                                    'text-blue-400'
                                }`}>
                                {repoValidation.message}
                            </p>
                        )}
                    </div>

                    <div>
                        <label className="flex items-center text-sm font-medium text-gray-300 mb-2">
                            <DollarSign className="w-4 h-4 mr-1" />
                            Requested Grant Amount (CELO)
                        </label>
                        <input
                            type="number"
                            step="0.01"
                            min="0"
                            value={requestedAmount}
                            onChange={(e) => setRequestedAmount(e.target.value)}
                            placeholder="100"
                            className="w-full px-4 py-3 bg-gray-900/50 border border-gray-600 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-green-500"
                        />
                        <p className="text-xs text-gray-400 mt-1">
                            Enter the amount of CELO you need for your project development
                        </p>
                    </div>

                    <button
                        type="submit"
                        disabled={isPending || isConfirming || repoValidation.isValid !== true || isValidatingRepo}
                        className="w-full px-6 py-3 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 disabled:cursor-not-allowed rounded-lg text-white font-semibold transition-colors flex items-center justify-center"
                    >
                        {isPending || isConfirming ? (
                            <>
                                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                                {isPending ? 'Confirm in wallet...' : 'Submitting Proposal...'}
                            </>
                        ) : (
                            <>
                                <FileText className="w-5 h-5 mr-2" />
                                Submit Grant Proposal
                            </>
                        )}
                    </button>

                    {/* Inline success/error messages (smaller, below form) */}
                    {isSuccess && !showNotification && (
                        <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-4">
                            <div className="flex items-center text-green-400">
                                <CheckCircle className="w-5 h-5 mr-2" />
                                <div>
                                    <p className="font-semibold">Proposal Submitted Successfully!</p>
                                    <p className="text-sm mt-1">Check the top notification for details</p>
                                </div>
                            </div>
                        </div>
                    )}

                    {isError && !showNotification && (
                        <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4">
                            <div className="flex items-start text-red-400">
                                <AlertCircle className="w-5 h-5 mr-2 mt-0.5" />
                                <div>
                                    <p className="font-semibold">Proposal Failed</p>
                                    <p className="text-sm mt-1">Check the top notification for details</p>
                                </div>
                            </div>
                        </div>
                    )}
                </form>

                <div className="mt-6 bg-green-500/10 border border-green-500/30 rounded-lg p-4">
                    <h4 className="text-green-400 font-semibold mb-2">📋 How It Works</h4>
                    <ul className="text-sm text-gray-300 space-y-1">
                        <li>• 1. Submit your project with requested grant amount</li>
                        <li>• 2. 5 registered companies will vote on your proposal</li>
                        <li>• 3. If 3+ companies approve, grant is automatically sent to you!</li>
                        <li>• 4. All voting and distribution happens on-chain (transparent)</li>
                    </ul>
                </div>
            </div>
        </>
    );
}
