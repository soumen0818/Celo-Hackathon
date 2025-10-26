'use client';

import { useState, useEffect } from 'react';
import { Brain, Play, CheckCircle, XCircle, Loader2, ExternalLink, AlertCircle } from 'lucide-react';
import { useWriteContract, useWaitForTransactionReceipt, useAccount } from 'wagmi';

interface Project {
    id: number;
    name: string;
    github_url: string;
    impact_score: number;
    blockchain_project_id?: number | null;
    blockchain_tx_hash?: string | null;
}

export default function AIScoreManager() {
    const [projects, setProjects] = useState<Project[]>([]);
    const [loading, setLoading] = useState(false);
    const [processing, setProcessing] = useState<number | null>(null);
    const [results, setResults] = useState<Record<number, any>>({});
    const [updateError, setUpdateError] = useState<string | null>(null);
    const [currentUpdatingProject, setCurrentUpdatingProject] = useState<number | null>(null);

    const { address, isConnected } = useAccount();
    const { data: hash, writeContract, error: writeError } = useWriteContract();
    const { isLoading: isConfirming, isSuccess, error: txError } = useWaitForTransactionReceipt({ hash });

    useEffect(() => {
        fetchProjects();
    }, []);

    useEffect(() => {
        // When transaction is successful, update database and refresh projects
        if (isSuccess && hash) {

            alert('✅ Score updated successfully on blockchain!\n\nTransaction: ' + hash);
            setUpdateError(null);
            setCurrentUpdatingProject(null);
            // Refresh the projects list
            setTimeout(() => {
                fetchProjects();
            }, 2000); // Wait 2 seconds for indexers to update
        }
    }, [isSuccess, hash]);

    useEffect(() => {
        // Handle transaction errors
        if (txError) {
            console.error('❌ Transaction failed:', txError);
            console.error('Full error details:', JSON.stringify(txError, null, 2));

            let errorMessage = 'Transaction failed. Please try again.';

            // Extract meaningful error message
            if (txError.message) {
                errorMessage = txError.message;
            } else if (typeof txError === 'object') {
                errorMessage = JSON.stringify(txError);
            }

            alert('❌ Transaction failed!\n\n' + errorMessage);
            setUpdateError(errorMessage);
            setCurrentUpdatingProject(null);
        }
    }, [txError]);

    useEffect(() => {
        // Handle write errors
        if (writeError) {
            console.error('❌ Write error:', writeError);
            const errorMessage = writeError.message || 'Unknown error';

            if (errorMessage.includes('User rejected')) {
                alert('❌ Transaction rejected by user');
                setUpdateError('Transaction rejected by user');
            } else if (errorMessage.includes('insufficient funds')) {
                alert('❌ Insufficient funds for gas fee\n\nPlease add more CELO to your wallet.');
                setUpdateError('Insufficient funds for gas');
            } else {
                alert('❌ Error updating score:\n\n' + errorMessage);
                setUpdateError(errorMessage);
            }
            setCurrentUpdatingProject(null);
        }
    }, [writeError]);

    const fetchProjects = async () => {
        try {
            const response = await fetch('/api/projects');
            const data = await response.json();
            if (data.success) {
                setProjects(data.projects || []);
            }
        } catch (error) {
            console.error('Error fetching projects:', error);
        }
    };

    const calculateAIScore = async (project: Project) => {
        setProcessing(project.id);
        try {
            // Fetch GitHub data
            const githubResponse = await fetch('/api/github/fetch', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ githubUrl: project.github_url }),
            });
            const githubData = await githubResponse.json();

            if (!githubData.success) {
                throw new Error('Failed to fetch GitHub data');
            }

            // Calculate AI score
            const aiResponse = await fetch('/api/ai/score', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    projectData: {
                        githubUrl: project.github_url,
                        description: project.name,
                        ...githubData.data,
                    },
                }),
            });
            const aiData = await aiResponse.json();

            if (!aiData.success) {
                throw new Error('Failed to calculate AI score');
            }

            setResults((prev) => ({
                ...prev,
                [project.id]: aiData.analysis,
            }));

            return aiData.analysis;
        } catch (error: any) {
            console.error('Error calculating score:', error);
            setResults((prev) => ({
                ...prev,
                [project.id]: { error: error.message },
            }));
            return null;
        } finally {
            setProcessing(null);
        }
    };

    const updateScoreOnChain = async (projectId: number, score: number) => {
        // Reset errors
        setUpdateError(null);
        setCurrentUpdatingProject(projectId);

        // Find the project to get blockchain_project_id
        const project = projects.find(p => p.id === projectId);

        if (!project) {
            alert('❌ Project not found!');
            setCurrentUpdatingProject(null);
            return;
        }

        // Validation checks
        if (!isConnected) {
            alert('❌ Please connect your wallet first!');
            setUpdateError('Wallet not connected');
            setCurrentUpdatingProject(null);
            return;
        }

        if (!address) {
            alert('❌ No wallet address found!');
            setUpdateError('No wallet address');
            setCurrentUpdatingProject(null);
            return;
        }

        const CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS as `0x${string}`;

        if (!CONTRACT_ADDRESS) {
            alert('❌ Contract address not configured!\n\nPlease check your .env.local file.');
            setUpdateError('Contract address not configured');
            setCurrentUpdatingProject(null);
            return;
        }

        // Determine the blockchain project ID
        let blockchainProjectId: number;

        if (project.blockchain_project_id !== null && project.blockchain_project_id !== undefined) {
            // Use the stored blockchain project ID (for new projects)
            blockchainProjectId = project.blockchain_project_id;

        } else {
            // Fallback: Use database ID - 1 (for old projects registered before this fix)
            blockchainProjectId = projectId - 1;

            console.log('   (Database ID - 1)');
        }






        if (blockchainProjectId < 0) {
            alert('❌ Invalid blockchain project ID. Cannot update score.');
            setCurrentUpdatingProject(null);
            return;
        }

        try {
            // Update blockchain
            writeContract({
                address: CONTRACT_ADDRESS,
                abi: [
                    {
                        inputs: [
                            { name: '_projectId', type: 'uint256' },
                            { name: '_newScore', type: 'uint256' },
                        ],
                        name: 'updateImpactScore',
                        outputs: [],
                        stateMutability: 'nonpayable',
                        type: 'function',
                    },
                ],
                functionName: 'updateImpactScore',
                args: [BigInt(blockchainProjectId), BigInt(score)],
            });

        } catch (error: any) {
            console.error('❌ Error calling writeContract:', error);
            alert('❌ Error initiating transaction:\n\n' + (error.message || 'Unknown error'));
            setUpdateError(error.message || 'Unknown error');
            setCurrentUpdatingProject(null);
        }
    };

    const runAllScores = async () => {
        setLoading(true);
        for (const project of projects) {
            await calculateAIScore(project);
            // Add delay to avoid rate limiting
            await new Promise((resolve) => setTimeout(resolve, 2000));
        }
        setLoading(false);
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="bg-gradient-to-br from-purple-900/50 to-purple-800/30 rounded-xl p-6 border border-purple-500/30">
                <div className="flex items-center justify-between">
                    <div>
                        <h2 className="text-2xl font-bold text-white mb-2">AI Score Manager</h2>
                        <p className="text-gray-300">Calculate and update impact scores using AI analysis</p>
                    </div>
                    <button
                        onClick={runAllScores}
                        disabled={loading}
                        className="px-6 py-3 bg-purple-500 hover:bg-purple-600 text-white rounded-lg font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
                    >
                        {loading ? (
                            <>
                                <Loader2 className="w-5 h-5 animate-spin" />
                                <span>Processing...</span>
                            </>
                        ) : (
                            <>
                                <Play className="w-5 h-5" />
                                <span>Run All Scores</span>
                            </>
                        )}
                    </button>
                </div>
            </div>

            {/* Projects List */}
            <div className="bg-gray-800/50 rounded-xl border border-gray-700 overflow-hidden">
                <div className="p-4 border-b border-gray-700">
                    <h3 className="text-lg font-semibold text-white">Projects ({projects.length})</h3>
                </div>
                <div className="divide-y divide-gray-700">
                    {projects.length === 0 ? (
                        <div className="p-8 text-center text-gray-400">No projects found</div>
                    ) : (
                        projects.map((project) => {
                            const result = results[project.id];
                            const isProcessing = processing === project.id;

                            return (
                                <div key={project.id} className="p-6 hover:bg-gray-700/30 transition-colors">
                                    <div className="flex items-start justify-between">
                                        <div className="flex-1">
                                            <h4 className="text-lg font-semibold text-white mb-1">{project.name}</h4>
                                            <p className="text-sm text-gray-400 mb-2">{project.github_url}</p>
                                            <div className="text-sm text-gray-500">
                                                Current Score: <span className="text-blue-400 font-semibold">{project.impact_score || 0}</span>
                                            </div>

                                            {result && !result.error && (
                                                <div className="mt-4 p-4 bg-gray-900/50 rounded-lg">
                                                    <div className="flex items-center space-x-2 mb-2">
                                                        <CheckCircle className="w-5 h-5 text-green-400" />
                                                        <span className="text-green-400 font-semibold">
                                                            New Score: {result.impactScore}
                                                        </span>
                                                    </div>
                                                    <p className="text-sm text-gray-300 mb-2">{result.reasoning}</p>
                                                    {result.breakdown && (
                                                        <div className="grid grid-cols-2 gap-2 text-xs">
                                                            <div>Code Quality: {result.breakdown.codeQuality}/100</div>
                                                            <div>Community: {result.breakdown.communityEngagement}/100</div>
                                                            <div>Sustainability: {result.breakdown.sustainability}/100</div>
                                                            <div>Innovation: {result.breakdown.innovation}/100</div>
                                                        </div>
                                                    )}
                                                </div>
                                            )}

                                            {result?.error && (
                                                <div className="mt-4 p-4 bg-red-900/20 border border-red-500/30 rounded-lg">
                                                    <div className="flex items-center space-x-2 text-red-400">
                                                        <XCircle className="w-5 h-5" />
                                                        <span>Error: {result.error}</span>
                                                    </div>
                                                </div>
                                            )}
                                        </div>

                                        <div className="flex flex-col space-y-2">
                                            <button
                                                onClick={() => calculateAIScore(project)}
                                                disabled={isProcessing}
                                                className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg text-sm font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
                                            >
                                                {isProcessing ? (
                                                    <>
                                                        <Loader2 className="w-4 h-4 animate-spin" />
                                                        <span>Analyzing...</span>
                                                    </>
                                                ) : (
                                                    <>
                                                        <Brain className="w-4 h-4" />
                                                        <span>Calculate Score</span>
                                                    </>
                                                )}
                                            </button>

                                            {result && !result.error && (
                                                <button
                                                    onClick={() => updateScoreOnChain(project.id, result.impactScore)}
                                                    disabled={isConfirming}
                                                    className="px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg text-sm font-semibold transition-colors disabled:opacity-50 flex items-center space-x-2"
                                                >
                                                    {isConfirming ? (
                                                        <>
                                                            <Loader2 className="w-4 h-4 animate-spin" />
                                                            <span>Updating...</span>
                                                        </>
                                                    ) : (
                                                        <span>Update On-Chain</span>
                                                    )}
                                                </button>
                                            )}
                                        </div>
                                    </div>

                                    {/* Success message after blockchain update */}
                                    {isSuccess && (
                                        <div className="mt-4 p-4 bg-green-900/20 border border-green-500/30 rounded-lg">
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center space-x-2 text-green-400">
                                                    <CheckCircle className="w-5 h-5" />
                                                    <span>Score updated on blockchain successfully!</span>
                                                </div>
                                                <a
                                                    href={`https://alfajores.celoscan.io/tx/${hash}`}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="text-blue-400 hover:text-blue-300 text-sm flex items-center space-x-1"
                                                >
                                                    <span>View Transaction</span>
                                                    <ExternalLink className="w-4 h-4" />
                                                </a>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            );
                        })
                    )}
                </div>
            </div>
        </div>
    );
}
