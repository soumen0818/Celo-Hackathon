'use client';

import { useState, useEffect } from 'react';
import { useReadContract, useAccount } from 'wagmi';
import {
    FolderGit2,
    Users,
    CheckCircle2,
    XCircle,
    DollarSign,
    Calendar,
    ExternalLink,
    RefreshCw,
    AlertCircle,
    Building2,
    GitBranch,
    TrendingUp,
    Clock
} from 'lucide-react';
import { formatEther } from 'viem';

const CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS as `0x${string}`;

const GRANT_DISTRIBUTION_ABI = [
    {
        inputs: [],
        name: 'projectCount',
        outputs: [{ name: '', type: 'uint256' }],
        stateMutability: 'view',
        type: 'function',
    },
    {
        inputs: [{ name: '_projectId', type: 'uint256' }],
        name: 'getProject',
        outputs: [{
            components: [
                { name: 'id', type: 'uint256' },
                { name: 'projectAddress', type: 'address' },
                { name: 'name', type: 'string' },
                { name: 'description', type: 'string' },
                { name: 'githubUrl', type: 'string' },
                { name: 'requestedAmount', type: 'uint256' },
                { name: 'votesFor', type: 'uint256' },
                { name: 'votesAgainst', type: 'uint256' },
                { name: 'totalGrantsReceived', type: 'uint256' },
                { name: 'createdAt', type: 'uint256' },
                { name: 'isActive', type: 'bool' },
                { name: 'isApproved', type: 'bool' },
                { name: 'isFunded', type: 'bool' },
            ],
            name: '',
            type: 'tuple',
        }],
        stateMutability: 'view',
        type: 'function',
    },
    {
        inputs: [{ name: '_projectId', type: 'uint256' }],
        name: 'getProjectAssignedCompanies',
        outputs: [{ name: '', type: 'address[]' }],
        stateMutability: 'view',
        type: 'function',
    },
    {
        inputs: [{ name: '_address', type: 'address' }],
        name: 'companies',
        outputs: [
            { name: 'companyAddress', type: 'address' },
            { name: 'name', type: 'string' },
            { name: 'isActive', type: 'bool' },
            { name: 'registeredAt', type: 'uint256' },
        ],
        stateMutability: 'view',
        type: 'function',
    },
] as const;

interface ProjectData {
    id: bigint;
    projectAddress: string;
    name: string;
    description: string;
    githubUrl: string;
    requestedAmount: bigint;
    votesFor: bigint;
    votesAgainst: bigint;
    totalGrantsReceived: bigint;
    createdAt: bigint;
    isActive: boolean;
    isApproved: boolean;
    isFunded: boolean;
    assignedCompanies?: CompanyInfo[];
}

interface CompanyInfo {
    address: string;
    name: string;
}

export default function ProjectsOverview() {
    const [projects, setProjects] = useState<ProjectData[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [selectedProject, setSelectedProject] = useState<ProjectData | null>(null);
    const [error, setError] = useState<string | null>(null);
    const { address } = useAccount();

    // Get total project count
    const { data: projectCount, refetch: refetchCount, isError: isCountError, error: countError } = useReadContract({
        address: CONTRACT_ADDRESS,
        abi: GRANT_DISTRIBUTION_ABI,
        functionName: 'projectCount',
    });

    // Load all projects
    const loadProjects = async () => {

        if (projectCount === undefined) {

            setLoading(false);
            return;
        }

        const count = Number(projectCount);

        if (count === 0) {

            setProjects([]);
            setLoading(false);
            setRefreshing(false);
            return;
        }

        setRefreshing(true);
        setError(null);

        // First, get all companies for lookup

        const companiesMap = new Map<string, string>();
        try {
            const allCompaniesResponse = await fetch(
                `/api/contract/read?function=getAllCompanies`
            );
            const allCompaniesResult = await allCompaniesResponse.json();
            if (allCompaniesResult.success && allCompaniesResult.data) {
                const companyAddresses = allCompaniesResult.data as string[];

                // Fetch each company's details using POST (more reliable for addresses)
                for (const addr of companyAddresses) {
                    try {
                        const response = await fetch('/api/contract/read', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                                functionName: 'companies',
                                args: [addr]
                            })
                        });
                        const result = await response.json();
                        if (result.success && result.result) {
                            // result is [companyAddress, name, isActive, registeredAt]
                            const companyName = result.result[1];
                            companiesMap.set(addr.toLowerCase(), companyName);

                        }
                    } catch (err) {

                    }
                }
            }
        } catch (err) {
            console.error('❌ Failed to fetch companies list:', err);
        }

        const projectsData: ProjectData[] = [];

        for (let i = 0; i < count; i++) {
            try {

                // Fetch project data
                const response = await fetch(
                    `/api/contract/read?function=getProject&args=${i}`
                );
                const result = await response.json();

                if (!result.success) {
                    console.error(`Failed to fetch project ${i}:`, result.error);
                    continue;
                }

                const projectData = result.data;

                if (projectData) {
                    // Fetch assigned companies

                    const companiesResponse = await fetch(
                        `/api/contract/read?function=getProjectAssignedCompanies&args=${i}`
                    );
                    const companiesResult = await companiesResponse.json();

                    const companyAddresses = companiesResult.data || [];

                    // Map addresses to names using our pre-fetched map
                    const assignedCompanies: CompanyInfo[] = [];
                    if (companyAddresses && Array.isArray(companyAddresses) && companyAddresses.length > 0) {

                        for (const companyAddr of companyAddresses) {
                            const companyName = companiesMap.get(companyAddr.toLowerCase());
                            if (companyName) {
                                assignedCompanies.push({
                                    address: companyAddr,
                                    name: companyName,
                                });
                                console.log(`  ✅ ${companyName} (${companyAddr})`);
                            } else {
                                // Fallback to displaying address if name not found
                                assignedCompanies.push({
                                    address: companyAddr,
                                    name: `Company ${companyAddr.slice(0, 6)}...${companyAddr.slice(-4)}`,
                                });

                            }
                        }
                    } else {

                    }

                    projectsData.push({
                        ...projectData,
                        assignedCompanies,
                    });
                }
            } catch (error) {
                console.error(`Error loading project ${i}:`, error);
                setError(`Failed to load some projects. Check console for details.`);
            }
        }

        setProjects(projectsData);
        setLoading(false);
        setRefreshing(false);
    };

    useEffect(() => {
        if (projectCount !== undefined) {

            loadProjects();
        }
    }, [projectCount]);

    const handleRefresh = () => {
        refetchCount();
        loadProjects();
    };

    const formatDate = (timestamp: bigint) => {
        return new Date(Number(timestamp) * 1000).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
        });
    };

    const getStatusBadge = (project: ProjectData) => {
        if (project.isFunded) {
            return (
                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-500/10 text-green-400 border border-green-500/30">
                    <CheckCircle2 className="w-3 h-3 mr-1" />
                    Funded
                </span>
            );
        }
        if (project.isApproved) {
            return (
                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-500/10 text-blue-400 border border-blue-500/30">
                    <TrendingUp className="w-3 h-3 mr-1" />
                    Approved
                </span>
            );
        }
        if (!project.isActive) {
            return (
                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-gray-500/10 text-gray-400 border border-gray-500/30">
                    <XCircle className="w-3 h-3 mr-1" />
                    Inactive
                </span>
            );
        }
        return (
            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-yellow-500/10 text-yellow-400 border border-yellow-500/30">
                <Clock className="w-3 h-3 mr-1" />
                Pending
            </span>
        );
    };

    const getTotalVotes = (project: ProjectData) => {
        return Number(project.votesFor) + Number(project.votesAgainst);
    };

    const getVotePercentage = (votes: bigint, totalAssignedCompanies: number) => {
        if (totalAssignedCompanies === 0) return 0;
        return Math.round((Number(votes) / totalAssignedCompanies) * 100);
    };

    const getAssignedCompaniesCount = (project: ProjectData) => {
        return project.assignedCompanies?.length || 0;
    };

    if (loading) {
        return (
            <div className="bg-gray-800/50 rounded-xl p-8 border border-gray-700">
                <div className="flex flex-col items-center justify-center space-y-3">
                    <RefreshCw className="w-5 h-5 animate-spin text-blue-400" />
                    <p className="text-gray-400">Loading projects overview...</p>
                    {CONTRACT_ADDRESS && (
                        <p className="text-xs text-gray-500">
                            Contract: {CONTRACT_ADDRESS.slice(0, 6)}...{CONTRACT_ADDRESS.slice(-4)}
                        </p>
                    )}
                </div>
            </div>
        );
    }

    if (isCountError) {
        return (
            <div className="bg-red-900/20 rounded-xl p-8 border border-red-500/30">
                <div className="text-center">
                    <AlertCircle className="w-16 h-16 mx-auto text-red-400 mb-4" />
                    <h3 className="text-xl font-semibold text-white mb-2">Error Loading Projects</h3>
                    <p className="text-gray-400 mb-4">
                        Failed to connect to the smart contract. Please check:
                    </p>
                    <ul className="text-left text-sm text-gray-400 space-y-2 max-w-md mx-auto">
                        <li>• Contract address is correct</li>
                        <li>• You're connected to Alfajores testnet</li>
                        <li>• Contract is deployed at: {CONTRACT_ADDRESS}</li>
                    </ul>
                    <button
                        onClick={handleRefresh}
                        className="mt-4 px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
                    >
                        Retry
                    </button>
                </div>
            </div>
        );
    }

    if (projects.length === 0) {
        return (
            <div className="bg-gray-800/50 rounded-xl p-8 border border-gray-700">
                <div className="text-center">
                    <FolderGit2 className="w-16 h-16 mx-auto text-gray-600 mb-4" />
                    <h3 className="text-xl font-semibold text-white mb-2">No Projects Yet</h3>
                    <p className="text-gray-400 mb-4">
                        No projects have been submitted for grant funding.
                    </p>
                    <button
                        onClick={handleRefresh}
                        className="mt-4 px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors flex items-center space-x-2 mx-auto"
                    >
                        <RefreshCw className="w-4 h-4" />
                        <span>Refresh</span>
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Error Display */}
            {error && (
                <div className="bg-red-900/20 rounded-xl p-4 border border-red-500/30">
                    <div className="flex items-start space-x-3">
                        <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                        <div>
                            <p className="text-red-400 font-semibold">Error Loading Data</p>
                            <p className="text-sm text-gray-400 mt-1">{error}</p>
                        </div>
                    </div>
                </div>
            )}

            {/* Header with Stats */}
            <div className="bg-gradient-to-r from-purple-500/10 to-blue-500/10 rounded-xl p-6 border border-purple-500/30">
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-3">
                        <FolderGit2 className="w-8 h-8 text-purple-400" />
                        <div>
                            <h2 className="text-2xl font-bold text-white">Projects Overview</h2>
                            <p className="text-gray-400">Monitor all submitted projects and their voting status</p>
                        </div>
                    </div>
                    <button
                        onClick={handleRefresh}
                        disabled={refreshing}
                        className="flex items-center space-x-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-600 disabled:cursor-not-allowed rounded-lg transition-colors"
                    >
                        <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
                        <span>Refresh</span>
                    </button>
                </div>

                {/* Quick Stats */}
                <div className="grid grid-cols-4 gap-4">
                    <div className="bg-gray-800/50 rounded-lg p-4 border border-gray-700">
                        <div className="text-2xl font-bold text-white">
                            {projects.length}
                        </div>
                        <div className="text-sm text-gray-400">Total Projects</div>
                    </div>
                    <div className="bg-gray-800/50 rounded-lg p-4 border border-gray-700">
                        <div className="text-2xl font-bold text-green-400">
                            {projects.filter(p => p.isFunded).length}
                        </div>
                        <div className="text-sm text-gray-400">Funded</div>
                    </div>
                    <div className="bg-gray-800/50 rounded-lg p-4 border border-gray-700">
                        <div className="text-2xl font-bold text-blue-400">
                            {projects.filter(p => p.isApproved && !p.isFunded).length}
                        </div>
                        <div className="text-sm text-gray-400">Approved</div>
                    </div>
                    <div className="bg-gray-800/50 rounded-lg p-4 border border-gray-700">
                        <div className="text-2xl font-bold text-yellow-400">
                            {projects.filter(p => !p.isApproved && !p.isFunded && p.isActive).length}
                        </div>
                        <div className="text-sm text-gray-400">Pending</div>
                    </div>
                </div>
            </div>

            {/* Projects List */}
            <div className="grid gap-6">
                {projects.map((project) => {
                    const totalVotes = getTotalVotes(project);
                    const assignedCompaniesCount = getAssignedCompaniesCount(project);
                    const approvalRate = getVotePercentage(project.votesFor, assignedCompaniesCount);
                    const rejectionRate = getVotePercentage(project.votesAgainst, assignedCompaniesCount);

                    return (
                        <div
                            key={project.id.toString()}
                            className="bg-gray-800/50 rounded-xl border border-gray-700 hover:border-purple-500/50 transition-all"
                        >
                            <div className="p-6">
                                {/* Project Header */}
                                <div className="flex items-start justify-between mb-4">
                                    <div className="flex-1">
                                        <div className="flex items-center space-x-3 mb-2">
                                            <h3 className="text-xl font-bold text-white">{project.name}</h3>
                                            {getStatusBadge(project)}
                                        </div>
                                        <p className="text-gray-400 text-sm mb-3">{project.description}</p>
                                        <div className="flex items-center space-x-4 text-sm text-gray-500">
                                            <div className="flex items-center space-x-1">
                                                <Calendar className="w-4 h-4" />
                                                <span>Created: {formatDate(project.createdAt)}</span>
                                            </div>
                                            <div className="flex items-center space-x-1">
                                                <DollarSign className="w-4 h-4" />
                                                <span>Requested: {formatEther(project.requestedAmount)} CELO</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Project Details Grid */}
                                <div className="grid grid-cols-2 gap-6 mb-4">
                                    {/* Voting Stats */}
                                    <div className="space-y-3">
                                        <h4 className="text-sm font-semibold text-gray-300 flex items-center space-x-2">
                                            <TrendingUp className="w-4 h-4" />
                                            <span>Voting Status</span>
                                        </h4>
                                        <div className="space-y-2">
                                            {/* Approval Bar */}
                                            <div>
                                                <div className="flex justify-between text-xs text-gray-400 mb-1">
                                                    <span>Approvals</span>
                                                    <span className="text-green-400">{Number(project.votesFor)} votes ({approvalRate}%)</span>
                                                </div>
                                                <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
                                                    <div
                                                        className="h-full bg-green-500 transition-all"
                                                        style={{ width: `${approvalRate}%` }}
                                                    />
                                                </div>
                                            </div>
                                            {/* Rejection Bar */}
                                            <div>
                                                <div className="flex justify-between text-xs text-gray-400 mb-1">
                                                    <span>Rejections</span>
                                                    <span className="text-red-400">
                                                        {Number(project.votesAgainst)} votes ({rejectionRate}%)
                                                    </span>
                                                </div>
                                                <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
                                                    <div
                                                        className="h-full bg-red-500 transition-all"
                                                        style={{ width: `${rejectionRate}%` }}
                                                    />
                                                </div>
                                            </div>
                                            <div className="text-xs text-gray-500 pt-1">
                                                Total Votes: {totalVotes} / {assignedCompaniesCount} assigned companies
                                            </div>
                                        </div>
                                    </div>

                                    {/* Assigned Companies */}
                                    <div className="space-y-3">
                                        <h4 className="text-sm font-semibold text-gray-300 flex items-center space-x-2">
                                            <Building2 className="w-4 h-4" />
                                            <span>Assigned Companies ({project.assignedCompanies?.length || 0})</span>
                                        </h4>
                                        <div className="space-y-2 max-h-24 overflow-y-auto">
                                            {project.assignedCompanies && project.assignedCompanies.length > 0 ? (
                                                project.assignedCompanies.map((company) => (
                                                    <div
                                                        key={company.address}
                                                        className="flex items-center justify-between p-2 bg-gray-900/50 rounded-lg"
                                                    >
                                                        <span className="text-sm text-white">{company.name}</span>
                                                        <code className="text-xs text-gray-500">
                                                            {company.address.slice(0, 6)}...{company.address.slice(-4)}
                                                        </code>
                                                    </div>
                                                ))
                                            ) : (
                                                <div className="text-sm text-gray-500 italic flex items-center space-x-2">
                                                    <AlertCircle className="w-4 h-4" />
                                                    <span>No companies assigned yet</span>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                {/* Project Footer */}
                                <div className="flex items-center justify-between pt-4 border-t border-gray-700">
                                    <div className="flex items-center space-x-4 text-sm">
                                        <div className="flex items-center space-x-2">
                                            <span className="text-gray-400">Project Address:</span>
                                            <code className="text-purple-400 bg-purple-500/10 px-2 py-1 rounded">
                                                {project.projectAddress.slice(0, 6)}...{project.projectAddress.slice(-4)}
                                            </code>
                                        </div>
                                        {project.isFunded && (
                                            <div className="flex items-center space-x-2">
                                                <CheckCircle2 className="w-4 h-4 text-green-400" />
                                                <span className="text-green-400">
                                                    Funded: {formatEther(project.totalGrantsReceived)} CELO
                                                </span>
                                            </div>
                                        )}
                                    </div>
                                    {project.githubUrl && (
                                        <a
                                            href={project.githubUrl}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="flex items-center space-x-2 text-sm text-blue-400 hover:text-blue-300"
                                        >
                                            <GitBranch className="w-4 h-4" />
                                            <span>View on GitHub</span>
                                            <ExternalLink className="w-3 h-3" />
                                        </a>
                                    )}
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
