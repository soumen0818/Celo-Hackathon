'use client';

import Navbar from '@/components/landing/Navbar';
import Footer from '@/components/landing/Footer';
import VotingPanel from '@/components/company/VotingPanel';

export default function CompanyPage() {
    return (
        <div className="min-h-screen bg-gradient-to-b from-gray-900 via-purple-900/10 to-gray-900">
            <Navbar />

            <main className="pt-24 pb-12 px-4">
                <div className="max-w-7xl mx-auto">
                    {/* Header */}
                    <div className="mb-8">
                        <h1 className="text-4xl font-bold text-white mb-2">
                            Company Voting Portal
                        </h1>
                        <p className="text-gray-400">
                            Review and vote on grant proposals as a registered voting company
                        </p>
                    </div>

                    {/* Voting Panel */}
                    <VotingPanel />
                </div>
            </main>

            <Footer />
        </div>
    );
}
