'use client';

import { useState, useEffect } from 'react';
import { useAccount } from 'wagmi';
import { Shield, Building2, AlertCircle, Wallet, FolderGit2 } from 'lucide-react';
import CompanyManager from './CompanyManager';
import TreasuryManagerCELO from './TreasuryManagerCELO';
import ProjectsOverview from './ProjectsOverview';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export default function AdminPanel() {
    const { address, isConnected } = useAccount();
    const [isOwner, setIsOwner] = useState(false);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        checkOwnership();
    }, [address]);

    const checkOwnership = async () => {
        if (!address) {
            setLoading(false);
            return;
        }

        try {
            // In production, verify against contract owner
            // For now, check if wallet is connected
            const ownerAddress = process.env.NEXT_PUBLIC_OWNER_ADDRESS?.toLowerCase();
            const isOwnerWallet = !ownerAddress || address.toLowerCase() === ownerAddress;
            setIsOwner(isOwnerWallet);
        } catch (error) {
            console.error('Error checking ownership:', error);
            setIsOwner(false);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="max-w-7xl mx-auto px-4">
                <div className="bg-gray-800/50 rounded-xl p-8 border border-gray-700">
                    <div className="text-center text-gray-400">Loading admin panel...</div>
                </div>
            </div>
        );
    }

    if (!isConnected) {
        return (
            <div className="max-w-7xl mx-auto px-4">
                <div className="bg-gray-800/50 rounded-xl p-8 border border-red-500/30">
                    <div className="flex items-center space-x-3 text-red-400">
                        <AlertCircle className="w-6 h-6" />
                        <p className="text-lg">Please connect your wallet to access the admin panel</p>
                    </div>
                </div>
            </div>
        );
    }

    if (!isOwner) {
        return (
            <div className="max-w-7xl mx-auto px-4">
                <div className="bg-gray-800/50 rounded-xl p-8 border border-red-500/30">
                    <div className="flex items-center space-x-3 text-red-400">
                        <Shield className="w-6 h-6" />
                        <div>
                            <p className="text-lg font-semibold">Access Denied</p>
                            <p className="text-sm text-gray-400 mt-1">Only the contract owner can access this panel</p>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-7xl mx-auto px-4">
            {/* Header */}
            <div className="mb-8">
                <div className="flex items-center space-x-3 mb-2">
                    <Shield className="w-8 h-8 text-blue-400" />
                    <h1 className="text-4xl font-bold text-white">Admin Panel</h1>
                </div>
                <p className="text-gray-400">Manage voting companies and treasury funds for grant distribution</p>
            </div>

            {/* Admin Content with Tabs */}
            <Tabs defaultValue="overview" className="space-y-6">
                <TabsList className="bg-gray-800/50 border border-gray-700">
                    <TabsTrigger value="overview" className="data-[state=active]:bg-purple-600">
                        <FolderGit2 className="w-4 h-4 mr-2" />
                        Projects Overview
                    </TabsTrigger>
                    <TabsTrigger value="treasury" className="data-[state=active]:bg-green-600">
                        <Wallet className="w-4 h-4 mr-2" />
                        Treasury
                    </TabsTrigger>
                    <TabsTrigger value="companies" className="data-[state=active]:bg-blue-600">
                        <Building2 className="w-4 h-4 mr-2" />
                        Companies & Projects
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="overview">
                    <ProjectsOverview />
                </TabsContent>

                <TabsContent value="treasury">
                    <TreasuryManagerCELO />
                </TabsContent>

                <TabsContent value="companies">
                    <CompanyManager />
                </TabsContent>
            </Tabs>
        </div>
    );
}
