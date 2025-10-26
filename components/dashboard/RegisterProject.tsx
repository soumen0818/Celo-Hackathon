'use client';

import { useState } from 'react';
import { useAccount, usePublicClient, useConfig } from 'wagmi';
import { writeContract, waitForTransactionReceipt } from 'wagmi/actions';
import { Send, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

export default function RegisterProject() {
  const { address, isConnected } = useAccount();
  const config = useConfig();
  const publicClient = usePublicClient();

  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    githubUrl: '',
    requestedAmount: '',
  });

  const CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS as `0x${string}`;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!isConnected || !address) {
      toast.error('Please connect your wallet first');
      return;
    }

    if (!CONTRACT_ADDRESS) {
      toast.error('Contract address not configured');
      return;
    }

    setLoading(true);

    try {
      // Step 1: Fetch GitHub data
      toast.info('Fetching GitHub data...');
      const githubResponse = await fetch('/api/github/fetch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ githubUrl: formData.githubUrl }),
      });

      const githubData = await githubResponse.json();
      if (!githubData.success) {
        throw new Error(githubData.error || 'Failed to fetch GitHub data');
      }

      // Step 2: Calculate AI score
      toast.info('Calculating impact score with AI...');
      const aiResponse = await fetch('/api/ai/score', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectData: {
            ...formData,
            ...githubData.data,
          },
        }),
      });

      const aiData = await aiResponse.json();
      if (!aiData.success) {
        throw new Error(aiData.error || 'Failed to calculate impact score');
      }

      // Step 3: Register project on blockchain FIRST
      toast.info('Proposing project on blockchain...');
      toast.info('Please confirm the transaction in your wallet');

      // Convert requested amount to wei (CELO has 18 decimals)
      const requestedAmountWei = BigInt(Math.floor(parseFloat(formData.requestedAmount) * 1e18));

      const txHash = await writeContract(config, {
        address: CONTRACT_ADDRESS,
        abi: [
          {
            inputs: [
              { name: '_name', type: 'string' },
              { name: '_description', type: 'string' },
              { name: '_githubUrl', type: 'string' },
              { name: '_requestedAmount', type: 'uint256' },
            ],
            name: 'proposeProject',
            outputs: [{ name: '', type: 'uint256' }],
            stateMutability: 'nonpayable',
            type: 'function',
          },
        ],
        functionName: 'proposeProject',
        args: [formData.name, formData.description, formData.githubUrl, requestedAmountWei],
      });

      toast.info('Waiting for blockchain confirmation...');

      // Wait for transaction receipt
      const receipt = await waitForTransactionReceipt(config, { hash: txHash });

      if (!receipt || receipt.status === 'reverted') {
        throw new Error('Transaction failed on blockchain');
      }

      toast.success('✅ Project registered on blockchain!');


      // Parse the ProjectRegistered event to get blockchain project ID
      let blockchainProjectId = null;

      try {
        // The ProjectProposed event emits the projectId as the first indexed parameter
        // Event signature: ProjectProposed(uint256 indexed projectId, address indexed projectAddress, string name, uint256 requestedAmount, uint256 timestamp)
        const projectProposedTopic = '0x' + require('crypto').createHash('sha256').update('ProjectProposed(uint256,address,string,uint256,uint256)').digest('hex').slice(0, 8);

        const log = receipt.logs.find((log: any) => log.topics && log.topics.length > 0);

        if (log && log.topics && log.topics[1]) {
          // The project ID is in topics[1] (first indexed parameter after event signature)
          blockchainProjectId = parseInt(log.topics[1], 16);

          toast.info(`Project ID on blockchain: ${blockchainProjectId}`);
        }
      } catch (parseError) {

        // We'll continue without it - can be manually synced later
      }

      // Step 4: Save to database
      toast.info('Saving to database...');
      const projectResponse = await fetch('/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectAddress: address,
          name: formData.name,
          description: formData.description,
          githubUrl: formData.githubUrl,
          requestedAmount: formData.requestedAmount,
          blockchainTxHash: txHash,
          blockchainProjectId: blockchainProjectId,
          aiScore: aiData.score || 0,
        }),
      });

      const projectData = await projectResponse.json();
      if (!projectData.success) {
        throw new Error(projectData.error || 'Failed to save to database');
      }

      toast.success('🎉 Project proposed successfully!');
      toast.success(`View on CeloScan: https://alfajores.celoscan.io/tx/${txHash}`);
      setFormData({ name: '', description: '', githubUrl: '', requestedAmount: '' });
    } catch (error: any) {
      console.error('Registration Error:', error);

      // Show user-friendly error messages
      if (error.message?.includes('User rejected')) {
        toast.error('Transaction was cancelled');
      } else if (error.message?.includes('insufficient funds')) {
        toast.error('Insufficient funds for gas fees');
      } else {
        toast.error(error.message || 'Failed to register project');
      }
    } finally {
      setLoading(false);
    }
  };

  if (!isConnected) {
    return (
      <div className="bg-gray-800/50 rounded-xl p-12 border border-gray-700 text-center">
        <div className="max-w-md mx-auto">
          <div className="w-16 h-16 bg-blue-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <Send className="w-8 h-8 text-blue-400" />
          </div>
          <h3 className="text-2xl font-bold text-white mb-2">Connect Your Wallet</h3>
          <p className="text-gray-400">
            Please connect your wallet to register your project for grant distribution
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-800/50 rounded-xl border border-gray-700 overflow-hidden">
      <div className="p-6 border-b border-gray-700">
        <h2 className="text-2xl font-bold text-white flex items-center space-x-2">
          <Send className="w-6 h-6 text-blue-400" />
          <span>Register Your Project</span>
        </h2>
        <p className="text-gray-400 mt-2">
          Submit your project for AI evaluation and grant eligibility
        </p>
      </div>

      <form onSubmit={handleSubmit} className="p-6 space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Project Name
          </label>
          <input
            type="text"
            required
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            className="w-full px-4 py-3 bg-gray-700/50 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Your Awesome Celo Project"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Description
          </label>
          <textarea
            required
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            rows={4}
            className="w-full px-4 py-3 bg-gray-700/50 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
            placeholder="Describe your project, its impact on the Celo ecosystem, and key achievements..."
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            GitHub Repository URL
          </label>
          <input
            type="url"
            required
            value={formData.githubUrl}
            onChange={(e) => setFormData({ ...formData, githubUrl: e.target.value })}
            className="w-full px-4 py-3 bg-gray-700/50 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="https://github.com/username/repo"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Requested Grant Amount (CELO)
          </label>
          <input
            type="number"
            required
            min="0.1"
            step="0.1"
            value={formData.requestedAmount}
            onChange={(e) => setFormData({ ...formData, requestedAmount: e.target.value })}
            className="w-full px-4 py-3 bg-gray-700/50 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="e.g., 100"
          />
          <p className="mt-1 text-sm text-gray-400">
            Specify how much CELO funding you're requesting for your project
          </p>
        </div>

        <div className="bg-blue-900/20 border border-blue-500/30 rounded-lg p-4">
          <p className="text-sm text-blue-300">
            <strong>Note:</strong> Your project will be analyzed by our AI system which evaluates
            code quality, community engagement, and impact potential. This process may take a few moments.
          </p>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-semibold rounded-lg transition-colors flex items-center justify-center space-x-2"
        >
          {loading ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              <span>Processing...</span>
            </>
          ) : (
            <>
              <Send className="w-5 h-5" />
              <span>Register Project</span>
            </>
          )}
        </button>
      </form>
    </div>
  );
}
