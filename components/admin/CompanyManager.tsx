'use client';

import { useState, useEffect } from 'react';
import { useWriteContract, useWaitForTransactionReceipt, useAccount } from 'wagmi';
import { Building2, CheckCircle, AlertCircle, Loader2, Link } from 'lucide-react';

interface Project {
    id: number;
    name: string;
    description: string;
}

export default function CompanyManager() {
    const [companyAddress, setCompanyAddress] = useState('');
    const [companyName, setCompanyName] = useState('');
    const [selectedProjects, setSelectedProjects] = useState<number[]>([]);
    const [projects, setProjects] = useState<Project[]>([]);
    const [isAssigningProjects, setIsAssigningProjects] = useState(false);
    const [loadingProjects, setLoadingProjects] = useState(false);
    const { address } = useAccount();

    const contractAddress = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS as `0x${string}`;

    const { data: hash, writeContract, isPending, isError, error, reset } = useWriteContract();
    const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });

    // Fetch projects on mount and when company address changes
    useEffect(() => {
        fetchProjects();
    }, []);

    // Refetch projects when company address is entered
    useEffect(() => {
        if (companyAddress && companyAddress.length === 42) {
            fetchProjects();
        }
    }, [companyAddress]);

    // Reset form after successful registration
    useEffect(() => {
        if (isSuccess) {
            setCompanyAddress('');
            setCompanyName('');
            setSelectedProjects([]);
            setIsAssigningProjects(false);
            reset();
            // Refetch projects after registration
            fetchProjects();
        }
    }, [isSuccess, reset]);

    const fetchProjects = async () => {
        setLoadingProjects(true);
        try {

            // First, get the total project count
            const countResponse = await fetch('/api/contract/read', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    functionName: 'projectCount',
                    args: [],
                }),
            });

            if (!countResponse.ok) {
                console.error('❌ Failed to fetch project count');
                setProjects([]);
                return;
            }

            const countData = await countResponse.json();
            const projectCount = countData.result ? parseInt(countData.result) : 0;

            if (projectCount === 0) {
                setProjects([]);
                return;
            }

            // Fetch all projects
            const projectPromises = [];
            for (let i = 0; i < projectCount; i++) {
                projectPromises.push(
                    fetch('/api/contract/read', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            functionName: 'getProject',
                            args: [i.toString()],
                        }),
                    }).then(res => res.json())
                );
            }

            const projectResults = await Promise.all(projectPromises);

            const fetchedProjects = projectResults
                .filter(data => data.success && data.result)
                .map((data) => {
                    const project = data.result;
                    return {
                        id: typeof project.id === 'string' ? parseInt(project.id) : Number(project.id),
                        name: project.name || 'Unnamed Project',
                        description: project.description || 'No description',
                    };
                });

            setProjects(fetchedProjects);
        } catch (err) {
            console.error('❌ Error fetching projects:', err);
            setProjects([]);
        } finally {
            setLoadingProjects(false);
        }
    };

    const toggleProjectSelection = (projectId: number) => {
        setSelectedProjects(prev =>
            prev.includes(projectId)
                ? prev.filter(id => id !== projectId)
                : [...prev, projectId]
        );
    };

    const handleRegisterCompany = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!companyAddress || !companyName) {
            alert('Please fill in all fields');
            return;
        }

        try {
            // First, register the company
            writeContract({
                address: contractAddress,
                abi: [
                    {
                        inputs: [
                            { name: '_companyAddress', type: 'address' },
                            { name: '_name', type: 'string' }
                        ],
                        name: 'registerCompany',
                        outputs: [],
                        stateMutability: 'nonpayable',
                        type: 'function',
                    },
                ],
                functionName: 'registerCompany',
                args: [companyAddress as `0x${string}`, companyName],
            });
        } catch (err) {
            console.error('Error registering company:', err);
        }
    };

    const handleAssignProjects = async () => {
        if (selectedProjects.length === 0) {
            alert('Please select at least one project to assign');
            return;
        }

        if (!companyAddress) {
            alert('Please enter company address first');
            return;
        }

        setIsAssigningProjects(true);

        try {
            // Assign selected projects to the company
            for (const projectId of selectedProjects) {
                await writeContract({
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
                    args: [BigInt(projectId), [companyAddress as `0x${string}`]],
                });
            }
        } catch (err) {
            console.error('Error assigning projects:', err);
            setIsAssigningProjects(false);
        }
    };

    return (
        <div className="bg-gray-800/50 rounded-xl p-6 border border-gray-700">
            <h3 className="text-2xl font-bold text-white mb-6 flex items-center">
                <Building2 className="w-6 h-6 mr-2 text-blue-400" />
                Register Voting Company & Assign Projects
            </h3>

            <form onSubmit={handleRegisterCompany} className="space-y-6">
                {/* Company Details */}
                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                            Company Wallet Address
                        </label>
                        <input
                            type="text"
                            value={companyAddress}
                            onChange={(e) => setCompanyAddress(e.target.value)}
                            placeholder="0x..."
                            className="w-full px-4 py-3 bg-gray-900/50 border border-gray-600 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                            Company Name
                        </label>
                        <input
                            type="text"
                            value={companyName}
                            onChange={(e) => setCompanyName(e.target.value)}
                            placeholder="e.g., Tech Innovations Inc."
                            className="w-full px-4 py-3 bg-gray-900/50 border border-gray-600 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
                        />
                    </div>
                </div>

                {/* Register Button */}
                <button
                    type="submit"
                    disabled={isPending || isConfirming}
                    className="w-full px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed rounded-lg text-white font-semibold transition-colors flex items-center justify-center"
                >
                    {isPending || isConfirming ? (
                        <>
                            <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                            {isPending ? 'Confirm in wallet...' : 'Registering...'}
                        </>
                    ) : (
                        <>
                            <Building2 className="w-5 h-5 mr-2" />
                            Register Company
                        </>
                    )}
                </button>

                {/* Project Assignment Section (shown after registration or for existing companies) */}
                {(isSuccess || companyAddress) && (
                    <div className="border-t border-gray-700 pt-6">
                        <div className="flex items-center justify-between mb-4">
                            <h4 className="text-lg font-semibold text-white flex items-center">
                                <Link className="w-5 h-5 mr-2 text-purple-400" />
                                Assign Projects to This Company
                            </h4>
                            <div className="flex items-center space-x-3">
                                {loadingProjects && (
                                    <Loader2 className="w-4 h-4 animate-spin text-blue-400" />
                                )}
                                <span className="text-sm text-gray-400">
                                    {selectedProjects.length} selected
                                </span>
                            </div>
                        </div>

                        {loadingProjects ? (
                            <div className="flex items-center justify-center py-8 text-gray-400">
                                <Loader2 className="w-6 h-6 mr-2 animate-spin" />
                                <span>Loading projects from blockchain...</span>
                            </div>
                        ) : projects.length > 0 ? (
                            <>
                                <div className="mb-2 text-sm text-gray-400">
                                    Found {projects.length} project{projects.length !== 1 ? 's' : ''} on blockchain
                                </div>
                                <div className="space-y-2 max-h-64 overflow-y-auto mb-4 pr-2">
                                    {projects.map((project) => (
                                        <label
                                            key={project.id}
                                            className="flex items-start p-3 bg-gray-900/50 border border-gray-700 rounded-lg hover:border-purple-500/50 cursor-pointer transition-colors"
                                        >
                                            <input
                                                type="checkbox"
                                                checked={selectedProjects.includes(project.id)}
                                                onChange={() => toggleProjectSelection(project.id)}
                                                className="mt-1 mr-3 h-4 w-4 rounded border-gray-600 bg-gray-800 text-purple-600 focus:ring-purple-500 focus:ring-offset-gray-900"
                                            />
                                            <div className="flex-1">
                                                <p className="text-white font-medium">
                                                    #{project.id} - {project.name}
                                                </p>
                                                <p className="text-sm text-gray-400 mt-1 line-clamp-2">
                                                    {project.description}
                                                </p>
                                            </div>
                                        </label>
                                    ))}
                                </div>

                                <button
                                    type="button"
                                    onClick={handleAssignProjects}
                                    disabled={selectedProjects.length === 0 || isAssigningProjects || !companyAddress}
                                    className="w-full px-6 py-3 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-600 disabled:cursor-not-allowed rounded-lg text-white font-semibold transition-colors flex items-center justify-center"
                                >
                                    {isAssigningProjects ? (
                                        <>
                                            <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                                            Assigning Projects...
                                        </>
                                    ) : (
                                        <>
                                            <Link className="w-5 h-5 mr-2" />
                                            Assign {selectedProjects.length} Project{selectedProjects.length !== 1 ? 's' : ''} to Company
                                        </>
                                    )}
                                </button>
                            </>
                        ) : (
                            <div className="text-center py-8 bg-gray-900/30 rounded-lg border border-gray-700">
                                <p className="text-gray-400 mb-2">No projects available on blockchain yet</p>
                                <p className="text-sm text-gray-500">Projects will appear here once they are submitted for grants</p>
                            </div>
                        )}
                    </div>
                )}

                {isSuccess && (
                    <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-4">
                        <div className="flex items-center text-green-400">
                            <CheckCircle className="w-5 h-5 mr-2" />
                            <div>
                                <p className="font-semibold">Company Registered Successfully!</p>
                                <p className="text-sm mt-1">
                                    {selectedProjects.length > 0
                                        ? 'Now assign projects to this company above'
                                        : 'This company can now vote on assigned grant proposals'
                                    }
                                </p>
                            </div>
                        </div>
                    </div>
                )}

                {isError && (
                    <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4">
                        <div className="flex items-start text-red-400">
                            <AlertCircle className="w-5 h-5 mr-2 mt-0.5" />
                            <div>
                                <p className="font-semibold">Registration Failed</p>
                                <p className="text-sm mt-1">{error?.message || 'Unknown error'}</p>
                            </div>
                        </div>
                    </div>
                )}
            </form>

            <div className="mt-6 bg-blue-500/10 border border-blue-500/30 rounded-lg p-4">
                <h4 className="text-blue-400 font-semibold mb-2">ℹ️ How It Works</h4>
                <ul className="text-sm text-gray-300 space-y-1">
                    <li>• Register a company with their wallet address and name</li>
                    <li>• Select which projects this company should review</li>
                    <li>• Companies will only see projects assigned to them</li>
                    <li>• Majority votes from assigned companies triggers grant distribution</li>
                </ul>
            </div>
        </div>
    );
}
