'use client';

import { useEffect, useState } from 'react';
import { Trophy, Star, GitBranch, TrendingUp, ExternalLink, Award, Wallet, FileText } from 'lucide-react';
import { motion } from 'framer-motion';
import { formatAddress } from '@/lib/utils';
import { useAccount, useReadContract } from 'wagmi';
import { formatEther } from 'viem';

interface BlockchainProject {
  id: number;
  projectAddress: string;
  name: string;
  description: string;
  githubUrl: string;
  requestedAmount: bigint;
  votesFor: number;
  votesAgainst: number;
  totalGrantsReceived: bigint;
  createdAt: number;
  isActive: boolean;
  isApproved: boolean;
  isFunded: boolean;
}

interface Project {
  id: number;
  name: string;
  description: string;
  project_address: string;
  github_url: string;
  impact_score: number;
  total_grants_received: number;
  is_verified: boolean;
  requested_amount: string;
  votes_for: number;
  votes_against: number;
  is_funded: boolean;
  is_approved: boolean;
  is_active: boolean;
}

const CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS as `0x${string}`;

export default function ProjectLeaderboard() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const { address } = useAccount();

  // Get user's project IDs from blockchain
  const { data: userProjectIds, isError: isProjectIdsError, error: projectIdsError, isLoading: isProjectIdsLoading } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: [
      {
        inputs: [{ name: '_address', type: 'address' }],
        name: 'getProjectsByAddress',
        outputs: [{ name: '', type: 'uint256[]' }],
        stateMutability: 'view',
        type: 'function',
      },
    ],
    functionName: 'getProjectsByAddress',
    args: address ? [address] : undefined,
  });

  // Log the contract read result
  useEffect(() => {






    console.log('  - data is array?', Array.isArray(userProjectIds));
  }, [userProjectIds, isProjectIdsError, projectIdsError, isProjectIdsLoading]);

  useEffect(() => {



    if (address) {
      fetchUserProjects();
    } else {
      setProjects([]);
      setLoading(false);
    }
  }, [address, userProjectIds]);

  const fetchUserProjects = async () => {



    console.log('Project IDs length:', userProjectIds ? (userProjectIds as any[]).length : 0);

    if (!address || !userProjectIds || (userProjectIds as any[]).length === 0) {

      console.log('Reasons: address?', !!address, 'userProjectIds?', !!userProjectIds, 'length:', userProjectIds ? (userProjectIds as any[]).length : 0);
      setProjects([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const projectIds = userProjectIds as bigint[];
      const fetchedProjects: Project[] = [];


      console.log('Project IDs types:', projectIds.map(id => typeof id));

      // Fetch each project from blockchain
      for (const projectId of projectIds) {
        try {
          console.log(`  - Fetching project ID: ${projectId.toString()}`);

          const response = await fetch('/api/contract/read', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              functionName: 'getProject',
              args: [projectId.toString()],
            }),
          });


          if (response.ok) {
            const data = await response.json();

            if (data.result) {
              const project = data.result as any; // API returns strings for BigInt values

              // Convert string values back to appropriate types
              fetchedProjects.push({
                id: typeof project.id === 'string' ? BigInt(project.id) : project.id,
                name: project.name,
                description: project.description,
                project_address: project.projectAddress,
                github_url: project.githubUrl,
                impact_score: 0, // Can be calculated or fetched from AI
                total_grants_received: Number(project.totalGrantsReceived),
                is_verified: project.isFunded,
                requested_amount: formatEther(
                  typeof project.requestedAmount === 'string'
                    ? BigInt(project.requestedAmount)
                    : project.requestedAmount
                ),
                votes_for: typeof project.votesFor === 'string' ? BigInt(project.votesFor) : project.votesFor,
                votes_against: typeof project.votesAgainst === 'string' ? BigInt(project.votesAgainst) : project.votesAgainst,
                is_funded: project.isFunded,
                is_approved: project.isApproved,
                is_active: project.isActive,
              });
            } else {
              console.error(`    ❌ No result in response data:`, data);
            }
          } else {
            const errorText = await response.text();
            console.error(`    ❌ Failed to fetch project ${projectId}: ${response.status}`, errorText);
          }
        } catch (error) {
          console.error(`Error fetching project ${projectId}:`, error);
        }
      }

      setProjects(fetchedProjects);
    } catch (error) {
      console.error('Error fetching user projects:', error);
      setProjects([]);
    } finally {
      setLoading(false);
    }
  };

  const getRankColor = (index: number) => {
    if (index === 0) return 'from-yellow-500 to-orange-500';
    if (index === 1) return 'from-gray-400 to-gray-500';
    if (index === 2) return 'from-orange-700 to-orange-800';
    return 'from-blue-500 to-purple-500';
  };

  const getRankIcon = (index: number) => {
    if (index < 3) return <Trophy className="w-5 h-5" />;
    return <Award className="w-5 h-5" />;
  };

  if (loading) {
    return (
      <div className="bg-gray-800/50 rounded-xl p-8 border border-gray-700">
        <div className="text-center text-gray-400">
          <div className="flex items-center justify-center space-x-2">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-400"></div>
            <span>Loading your projects...</span>
          </div>
        </div>
      </div>
    );
  }

  if (!address) {
    return (
      <div className="bg-gray-800/50 rounded-xl p-8 border border-gray-700">
        <div className="text-center">
          <Wallet className="w-12 h-12 mx-auto text-gray-500 mb-4" />
          <p className="text-gray-400 text-lg">Please connect your wallet to view your projects</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-800/50 rounded-xl border border-gray-700 overflow-hidden">
      <div className="p-6 border-b border-gray-700">
        <h2 className="text-2xl font-bold text-white flex items-center space-x-2">
          <TrendingUp className="w-6 h-6 text-blue-400" />
          <span>My Projects</span>
        </h2>
        <p className="text-gray-400 mt-2">
          Your submitted grant proposals {address && `(${formatAddress(address)})`}
        </p>
      </div>

      <div className="divide-y divide-gray-700">
        {projects.length === 0 ? (
          <div className="p-8 text-center">
            <FileText className="w-16 h-16 mx-auto text-gray-600 mb-4" />
            <p className="text-gray-400 text-lg mb-2">No projects submitted yet</p>
            <p className="text-gray-500 text-sm">
              Go to the "Propose Project" tab to submit your first grant proposal
            </p>
          </div>
        ) : (
          projects.map((project, index) => (
            <motion.div
              key={project.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              className="p-6 hover:bg-gray-700/30 transition-colors"
            >
              <div className="flex items-start space-x-4">
                {/* Rank */}
                <div className={`flex-shrink-0 w-12 h-12 rounded-lg bg-gradient-to-br ${getRankColor(index)} flex items-center justify-center text-white font-bold shadow-lg`}>
                  {index < 3 ? getRankIcon(index) : index + 1}
                </div>

                {/* Project Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center space-x-2 mb-2">
                    <h3 className="text-lg font-semibold text-white">{project.name}</h3>
                    {project.is_funded && (
                      <div className="px-2 py-0.5 bg-green-500/20 border border-green-500/30 rounded text-xs text-green-400 flex items-center space-x-1">
                        <Star className="w-3 h-3" />
                        <span>Funded</span>
                      </div>
                    )}
                    {!project.is_funded && project.is_approved && (
                      <div className="px-2 py-0.5 bg-blue-500/20 border border-blue-500/30 rounded text-xs text-blue-400 flex items-center space-x-1">
                        <Star className="w-3 h-3" />
                        <span>Approved</span>
                      </div>
                    )}
                    {!project.is_active && (
                      <div className="px-2 py-0.5 bg-gray-500/20 border border-gray-500/30 rounded text-xs text-gray-400">
                        <span>Inactive</span>
                      </div>
                    )}
                  </div>

                  <p className="text-gray-400 text-sm mb-3 line-clamp-2">{project.description}</p>

                  <div className="flex flex-wrap items-center gap-3 text-sm">
                    <div className="flex items-center space-x-1 text-gray-400">
                      <span>Requested:</span>
                      <span className="font-semibold text-blue-400">{project.requested_amount} CELO</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="text-green-400">👍 {project.votes_for}</span>
                      <span className="text-red-400">👎 {project.votes_against}</span>
                    </div>
                    <a
                      href={project.github_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center space-x-1 text-blue-400 hover:text-blue-300 transition-colors"
                    >
                      <GitBranch className="w-4 h-4" />
                      <span>GitHub</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                </div>

                {/* Status & Stats */}
                <div className="flex-shrink-0 text-right">
                  <div className="text-2xl font-bold text-gradient mb-1">
                    {project.is_funded ? '✅' : project.is_approved ? '⏳' : '📋'}
                  </div>
                  <div className="text-xs text-gray-400 mb-2">
                    {project.is_funded ? 'Funded' : project.is_approved ? 'Approved' : 'Pending'}
                  </div>
                  {project.is_funded && (
                    <div className="text-sm text-green-400 font-semibold">
                      {formatEther(BigInt(project.total_grants_received))} CELO
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          ))
        )}
      </div>
    </div>
  );
}
