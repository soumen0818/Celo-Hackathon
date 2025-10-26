'use client';

import Link from 'next/link';
import Image from 'next/image';
import { ConnectButton } from '@rainbow-me/rainbowkit';

export default function Navbar() {
  return (
    <nav className="fixed top-0 w-full z-50 bg-gray-900/80 backdrop-blur-lg border-b border-gray-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <Link href="/" className="flex items-center space-x-3 group">
            <div className="relative w-10 h-10 transition-transform group-hover:scale-110 duration-300">
              <Image
                src="/logo.svg"
                alt="AI Grant Logo"
                width={40}
                height={40}
                className="drop-shadow-[0_0_10px_rgba(59,130,246,0.5)]"
              />
            </div>
            <span className="text-xl font-bold bg-gradient-to-r from-blue-400 via-cyan-400 to-purple-400 bg-clip-text text-transparent">
              AI Grant
            </span>
          </Link>

          <div className="hidden md:flex items-center space-x-8">
            <Link href="/features" className="text-gray-300 hover:text-white transition-colors">
              Features
            </Link>
            <Link href="/how-it-works" className="text-gray-300 hover:text-white transition-colors">
              How It Works
            </Link>
            <Link href="/dashboard" className="text-gray-300 hover:text-white transition-colors">
              Dashboard
            </Link>
            <Link href="/company" className="text-purple-400 hover:text-purple-300 transition-colors font-semibold">
              Company Voting
            </Link>
            <Link href="/admin" className="text-blue-400 hover:text-blue-300 transition-colors font-semibold">
              Admin
            </Link>
          </div>

          <div className="flex items-center space-x-4">
            <ConnectButton showBalance={true} chainStatus="icon" accountStatus="address" />
          </div>
        </div>
      </div>
    </nav>
  );
}
