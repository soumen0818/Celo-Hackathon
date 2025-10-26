'use client';

import { useState, useEffect } from 'react';
import { Send, Loader2, CheckCircle } from 'lucide-react';
import { useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { parseEther } from 'viem';

interface Project {
    id: number;
    name: string;
    project_address: string;
    impact_score: number;
    total_grants_received: number;
}

export default function GrantDistributor() {
    const [projects, setProjects] = useState<Project[]>([]);
    const [selectedProjects, setSelectedProjects] = useState<Set<number>>(new Set());
    const [amounts, setAmounts] = useState<Record<number, string>>({});
    const [reasons, setReasons] = useState<Record<number, string>>({});

    const { data: hash, writeContract } = useWriteContract();
    const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });

    useEffect(() => {
        fetchProjects();
    }, []);

    const fetchProjects = async () => {
        try {
            const response = await fetch('/api/projects');
            const data = await response.json();
            if (data.success) {
                // Sort by impact score
                const sorted = (data.projects || []).sort(
                    (a: Project, b: Project) => b.impact_score - a.impact_score
                );
                setProjects(sorted);
            }
        } catch (error) {
            console.error('Error fetching projects:', error);
        }
    };

    const toggleProject = (id: number) => {
        const newSelected = new Set(selectedProjects);
        if (newSelected.has(id)) {
            newSelected.delete(id);
        } else {
            newSelected.add(id);
        }
        setSelectedProjects(newSelected);
    };

    const distributeGrants = async () => {
        const CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS as `0x${string}`;
        const selectedIds = Array.from(selectedProjects);

        const projectIds = selectedIds.map(BigInt);
        const grantAmounts = selectedIds.map((id) => parseEther(amounts[id] || '0'));
        const grantReasons = selectedIds.map((id) => reasons[id] || 'Grant distribution');

        writeContract({
            address: CONTRACT_ADDRESS,
            abi: [
                {
                    inputs: [
                        { name: '_projectIds', type: 'uint256[]' },
                        { name: '_amounts', type: 'uint256[]' },
                        { name: '_reasons', type: 'string[]' },
                    ],
                    name: 'distributeGrants',
                    outputs: [],
                    stateMutability: 'nonpayable',
                    type: 'function',
                },
            ],
            functionName: 'distributeGrants',
            args: [projectIds, grantAmounts, grantReasons],
        });
    };

    const totalAmount = Array.from(selectedProjects).reduce((sum, id) => {
        return sum + parseFloat(amounts[id] || '0');
    }, 0);

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="bg-gradient-to-br from-green-900/50 to-green-800/30 rounded-xl p-6 border border-green-500/30">
                <div className="flex items-center justify-between">
                    <div>
                        <h2 className="text-2xl font-bold text-white mb-2">Grant Distribution</h2>
                        <p className="text-gray-300">Distribute funds to top-performing projects</p>
                    </div>
                    <div className="text-right">
                        <div className="text-3xl font-bold text-green-400">${totalAmount.toFixed(2)}</div>
                        <div className="text-sm text-gray-400">Total to Distribute</div>
                    </div>
                </div>
            </div>

            {/* Selected Summary */}
            {selectedProjects.size > 0 && (
                <div className="bg-blue-900/20 border border-blue-500/30 rounded-xl p-4">
                    <div className="flex items-center justify-between">
                        <div className="text-blue-400">
                            {selectedProjects.size} project{selectedProjects.size > 1 ? 's' : ''} selected
                        </div>
                        <button
                            onClick={distributeGrants}
                            disabled={isConfirming || totalAmount === 0}
                            className="px-6 py-3 bg-green-500 hover:bg-green-600 text-white rounded-lg font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
                        >
                            {isConfirming ? (
                                <>
                                    <Loader2 className="w-5 h-5 animate-spin" />
                                    <span>Distributing...</span>
                                </>
                            ) : (
                                <>
                                    <Send className="w-5 h-5" />
                                    <span>Distribute Grants</span>
                                </>
                            )}
                        </button>
                    </div>
                </div>
            )}

            {isSuccess && (
                <div className="bg-green-900/20 border border-green-500/30 rounded-xl p-4">
                    <div className="flex items-center space-x-2 text-green-400">
                        <CheckCircle className="w-5 h-5" />
                        <span>Grants distributed successfully!</span>
                    </div>
                </div>
            )}

            {/* Projects List */}
            <div className="bg-gray-800/50 rounded-xl border border-gray-700 overflow-hidden">
                <div className="p-4 border-b border-gray-700">
                    <h3 className="text-lg font-semibold text-white">Top Projects by Impact Score</h3>
                </div>
                <div className="divide-y divide-gray-700">
                    {projects.length === 0 ? (
                        <div className="p-8 text-center text-gray-400">No projects found</div>
                    ) : (
                        projects.map((project, index) => {
                            const isSelected = selectedProjects.has(project.id);

                            return (
                                <div
                                    key={project.id}
                                    className={`p-6 transition-colors ${isSelected ? 'bg-blue-900/20 border-l-4 border-blue-500' : 'hover:bg-gray-700/30'
                                        }`}
                                >
                                    <div className="flex items-start space-x-4">
                                        <input
                                            type="checkbox"
                                            checked={isSelected}
                                            onChange={() => toggleProject(project.id)}
                                            className="mt-1 w-5 h-5 rounded border-gray-600 text-blue-500 focus:ring-blue-500"
                                        />

                                        <div className="flex-1">
                                            <div className="flex items-center space-x-3 mb-2">
                                                <div className="text-2xl font-bold text-gray-500">#{index + 1}</div>
                                                <div>
                                                    <h4 className="text-lg font-semibold text-white">{project.name}</h4>
                                                    <p className="text-sm text-gray-400">Score: {project.impact_score}/100</p>
                                                </div>
                                            </div>

                                            <div className="text-sm text-gray-500 mb-3">
                                                Already Received: ${(project.total_grants_received / 1e18).toFixed(2)}
                                            </div>

                                            {isSelected && (
                                                <div className="grid grid-cols-2 gap-4 mt-4">
                                                    <div>
                                                        <label className="block text-sm text-gray-400 mb-1">Amount (cUSD)</label>
                                                        <input
                                                            type="number"
                                                            value={amounts[project.id] || ''}
                                                            onChange={(e) =>
                                                                setAmounts({ ...amounts, [project.id]: e.target.value })
                                                            }
                                                            placeholder="0.00"
                                                            className="w-full px-4 py-2 bg-gray-900 border border-gray-600 rounded-lg text-white focus:border-blue-500 focus:outline-none"
                                                        />
                                                    </div>
                                                    <div>
                                                        <label className="block text-sm text-gray-400 mb-1">Reason</label>
                                                        <input
                                                            type="text"
                                                            value={reasons[project.id] || ''}
                                                            onChange={(e) =>
                                                                setReasons({ ...reasons, [project.id]: e.target.value })
                                                            }
                                                            placeholder="Outstanding contribution"
                                                            className="w-full px-4 py-2 bg-gray-900 border border-gray-600 rounded-lg text-white focus:border-blue-500 focus:outline-none"
                                                        />
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>
            </div>
        </div>
    );
}
