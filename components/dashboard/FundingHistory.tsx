'use client';

import { useEffect, useState } from 'react';
import { Clock, ExternalLink, DollarSign } from 'lucide-react';
import { formatDate, formatAddress } from '@/lib/utils';
import { formatEther } from 'viem';

interface Grant {
  id: string;
  projectId: bigint;
  project_name: string;
  recipient: string;
  amount: string;
  transaction_hash: string;
  distributed_at: string;
  blockNumber: bigint;
}

const CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS as `0x${string}`;

export default function FundingHistory() {
  const [grants, setGrants] = useState<Grant[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchGrants();
  }, []);

  const fetchGrants = async () => {
    setLoading(true);
    setError(null);

    try {

      // Fetch GrantDistributed events from the contract
      const response = await fetch('/api/contract/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          eventName: 'GrantDistributed',
          fromBlock: 0, // Start from contract deployment
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        console.error('❌ Failed to fetch events:', errorData);
        setError(errorData.error || 'Failed to fetch funding history');
        setGrants([]);
        return;
      }

      const data = await response.json();

      if (data.success && data.events && Array.isArray(data.events)) {
        // Fetch project names for each grant
        const grantsWithDetails = await Promise.all(
          data.events.map(async (event: any) => {
            const args = event.args;
            let projectName = 'Unknown Project';

            // Fetch project details
            try {
              const projectResponse = await fetch('/api/contract/read', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  functionName: 'getProject',
                  args: [args.projectId],
                }),
              });

              if (projectResponse.ok) {
                const projectData = await projectResponse.json();
                if (projectData.success && projectData.result) {
                  projectName = projectData.result.name || 'Unknown Project';
                }
              }
            } catch (err) {

            }

            return {
              id: `${event.transactionHash}-${event.logIndex}`,
              projectId: typeof args.projectId === 'string' ? BigInt(args.projectId) : args.projectId,
              project_name: projectName,
              recipient: args.recipient,
              amount: formatEther(
                typeof args.amount === 'string' ? BigInt(args.amount) : args.amount
              ),
              transaction_hash: event.transactionHash,
              distributed_at: new Date(
                Number(typeof args.timestamp === 'string' ? BigInt(args.timestamp) : args.timestamp) * 1000
              ).toISOString(),
              blockNumber: typeof event.blockNumber === 'string' ? BigInt(event.blockNumber) : event.blockNumber,
            };
          })
        );

        setGrants(grantsWithDetails.reverse()); // Most recent first
      } else {

        setGrants([]);
      }
    } catch (error: any) {
      console.error('❌ Error fetching grants:', error);
      setError(error.message || 'Failed to fetch funding history');
      setGrants([]);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-gray-800/50 rounded-xl p-8 border border-gray-700">
        <div className="text-center text-gray-400">Loading funding history...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-gray-800/50 rounded-xl p-8 border border-gray-700">
        <div className="text-center">
          <p className="text-red-400 mb-2">Failed to load funding history</p>
          <p className="text-gray-500 text-sm">{error}</p>
          <button
            onClick={fetchGrants}
            className="mt-4 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-800/50 rounded-xl border border-gray-700 overflow-hidden">
      <div className="p-6 border-b border-gray-700">
        <h2 className="text-2xl font-bold text-white flex items-center space-x-2">
          <Clock className="w-6 h-6 text-blue-400" />
          <span>Funding History</span>
        </h2>
        <p className="text-gray-400 mt-2">Complete transaction history of all grant distributions</p>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-700/50">
            <tr>
              <th className="px-6 py-4 text-left text-xs font-semibold text-gray-400 uppercase">Project</th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-gray-400 uppercase">Recipient</th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-gray-400 uppercase">Amount</th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-gray-400 uppercase">Date</th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-gray-400 uppercase">Transaction</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-700">
            {grants.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-6 py-8 text-center text-gray-400">
                  No grants distributed yet
                </td>
              </tr>
            ) : (
              grants.map((grant) => (
                <tr key={grant.id} className="hover:bg-gray-700/30 transition-colors">
                  <td className="px-6 py-4">
                    <div className="text-white font-medium">{grant.project_name}</div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="font-mono text-sm text-gray-400">{formatAddress(grant.recipient)}</div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center space-x-1 text-green-400 font-semibold">
                      <DollarSign className="w-4 h-4" />
                      <span>{grant.amount} CELO</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-gray-400 text-sm">{formatDate(grant.distributed_at)}</div>
                  </td>
                  <td className="px-6 py-4">
                    <a
                      href={`https://alfajores.celoscan.io/tx/${grant.transaction_hash}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center space-x-1 text-blue-400 hover:text-blue-300 transition-colors"
                    >
                      <span className="font-mono text-sm">{formatAddress(grant.transaction_hash)}</span>
                      <ExternalLink className="w-4 h-4" />
                    </a>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
