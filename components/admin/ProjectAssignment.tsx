'use client';

import { useState, useEffect } from 'react';
import { useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { Link, CheckCircle, AlertCircle, Loader2, Users } from 'lucide-react';

interface Project {
    id: number;
    name: string;
    description: string;
    githubUrl: string;
    requestedAmount: string;
}

export default function ProjectAssignment() {
    const [projects, setProjects] = useState<Project[]>([]);
    const [selectedProjectId, setSelectedProjectId] = useState<number | null>(null);
    const [companyAddresses, setCompanyAddresses] = useState<string>('');

    const contractAddress = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS as `0x${string}`;

    const { data: hash, writeContract, isPending, isError, error } = useWriteContract();
    const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });

    useEffect(() => {
        fetchProjects();
    }, []);

    const fetchProjects = async () => {
        try {
            const response = await fetch('/api/projects');
            if (response.ok) {
                const data = await response.json();
                setProjects(Array.isArray(data) ? data : (data.projects || []));
            }
        } catch (err) {
            console.error('Error fetching projects:', err);
        }
    };

    const handleAssignProject = async (e: React.FormEvent) => {
        e.preventDefault();

        if (selectedProjectId === null || !companyAddresses.trim()) {
            alert('Please select a project and enter company addresses');
            return;
        }

        // Parse comma-separated addresses
        const addresses = companyAddresses
            .split(',')
            .map(addr => addr.trim())
            .filter(addr => addr.startsWith('0x'));

        if (addresses.length === 0) {
            alert('Please enter valid Ethereum addresses (0x...)');
            return;
        }

        try {
            writeContract({
                address: contractAddress,
                abi: [
                    {
                        inputs: [
                            { name: '_projectId', type: 'uint256' },
                            { name: '_companyAddresses', type: 'address[]' }
                        ],
                        name: 'assignProjectToCompanies',
                        outputs: [],
                        stateMutability: 'nonpayable',
                        type: 'function',
                    },
                ],
                functionName: 'assignProjectToCompanies',
                args: [BigInt(selectedProjectId), addresses as `0x${string}`[]],
            });
        } catch (err) {
            console.error('Error assigning project:', err);
        }
    };

    useEffect(() => {
        if (isSuccess) {
            setSelectedProjectId(null);
            setCompanyAddresses('');
        }
    }, [isSuccess]);

    return (
        <div className="bg-gray-800/50 rounded-xl p-6 border border-gray-700">
            <h3 className="text-2xl font-bold text-white mb-6 flex items-center">
                <Link className="w-6 h-6 mr-2 text-purple-400" />
                Assign Projects to Companies
            </h3>

            <form onSubmit={handleAssignProject} className="space-y-4">
                <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                        Select Project
                    </label>
                    <select
                        value={selectedProjectId ?? ''}
                        onChange={(e) => setSelectedProjectId(e.target.value ? Number(e.target.value) : null)}
                        className="w-full px-4 py-3 bg-gray-900/50 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-purple-500"
                    >
                        <option value="">-- Select a Project --</option>
                        {projects.map((project) => (
                            <option key={project.id} value={project.id}>
                                #{project.id} - {project.name}
                            </option>
                        ))}
                    </select>
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                        Company Addresses (comma-separated)
                    </label>
                    <textarea
                        value={companyAddresses}
                        onChange={(e) => setCompanyAddresses(e.target.value)}
                        placeholder="0x123..., 0x456..., 0x789..."
                        rows={4}
                        className="w-full px-4 py-3 bg-gray-900/50 border border-gray-600 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-purple-500 resize-none"
                    />
                    <p className="text-xs text-gray-400 mt-1">
                        Enter multiple company wallet addresses separated by commas
                    </p>
                </div>

                <button
                    type="submit"
                    disabled={isPending || isConfirming || selectedProjectId === null}
                    className="w-full px-6 py-3 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-600 disabled:cursor-not-allowed rounded-lg text-white font-semibold transition-colors flex items-center justify-center"
                >
                    {isPending || isConfirming ? (
                        <>
                            <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                            {isPending ? 'Confirm in wallet...' : 'Assigning...'}
                        </>
                    ) : (
                        <>
                            <Users className="w-5 h-5 mr-2" />
                            Assign Project to Companies
                        </>
                    )}
                </button>

                {isSuccess && (
                    <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-4 flex items-start">
                        <CheckCircle className="w-5 h-5 text-green-400 mr-3 flex-shrink-0 mt-0.5" />
                        <div>
                            <p className="text-green-400 font-semibold">Project assigned successfully!</p>
                            <p className="text-sm text-gray-300 mt-1">
                                Companies can now vote on this project.
                            </p>
                        </div>
                    </div>
                )}

                {isError && error && (
                    <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4 flex items-start">
                        <AlertCircle className="w-5 h-5 text-red-400 mr-3 flex-shrink-0 mt-0.5" />
                        <div>
                            <p className="text-red-400 font-semibold">Error assigning project</p>
                            <p className="text-sm text-gray-300 mt-1">{error.message}</p>
                        </div>
                    </div>
                )}
            </form>
        </div>
    );
}
