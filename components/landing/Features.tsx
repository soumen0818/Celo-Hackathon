'use client';

import { motion } from 'framer-motion';
import { Brain, Shield, Zap, Globe, TrendingUp, Lock } from 'lucide-react';

const features = [
  {
    icon: Brain,
    title: 'AI-Powered Scoring',
    description: 'Advanced machine learning analyzes project data, GitHub activity, and community engagement to calculate fair impact scores.',
    color: 'from-blue-500 to-cyan-500',
    glowColor: 'rgba(59, 130, 246, 0.4)',
  },
  {
    icon: Shield,
    title: 'Blockchain Transparency',
    description: 'Every transaction and decision is recorded on Celo blockchain, ensuring complete transparency and trust.',
    color: 'from-purple-500 to-pink-500',
    glowColor: 'rgba(168, 85, 247, 0.4)',
  },
  {
    icon: Zap,
    title: 'Automated Distribution',
    description: 'Smart contracts automatically distribute grants to top-ranked projects based on AI scoring, no manual intervention needed.',
    color: 'from-yellow-500 to-orange-500',
    glowColor: 'rgba(234, 179, 8, 0.4)',
  },
  {
    icon: Globe,
    title: 'Global Accessibility',
    description: 'Built on Celo for mobile-first experience and low transaction fees, making it accessible worldwide.',
    color: 'from-green-500 to-emerald-500',
    glowColor: 'rgba(34, 197, 94, 0.4)',
  },
  {
    icon: TrendingUp,
    title: 'Real-time Metrics',
    description: 'Track project performance, funding history, and impact scores in real-time through our intuitive dashboard.',
    color: 'from-red-500 to-rose-500',
    glowColor: 'rgba(239, 68, 68, 0.4)',
  },
  {
    icon: Lock,
    title: 'Secure & Audited',
    description: 'Smart contracts are thoroughly audited and tested to ensure the safety of funds and fair distribution.',
    color: 'from-indigo-500 to-blue-500',
    glowColor: 'rgba(99, 102, 241, 0.4)',
  },
];

export default function Features() {
  return (
    <section id="features" className="py-24 px-4 relative overflow-hidden">
      {/* Background effects */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl"></div>
      </div>

      <div className="max-w-7xl mx-auto relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="text-center mb-20"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="inline-block mb-4"
          >
            <span className="px-4 py-2 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-sm font-semibold">
              Why Choose Us
            </span>
          </motion.div>
          <h2 className="text-5xl md:text-6xl font-bold mb-6">
            <span className="bg-gradient-to-r from-white via-gray-200 to-gray-400 bg-clip-text text-transparent">
              Powerful Features
            </span>
          </h2>
          <p className="text-xl text-gray-400 max-w-3xl mx-auto leading-relaxed">
            Combining AI intelligence with blockchain security for the next generation of grant distribution
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1, duration: 0.5 }}
                whileHover={{ y: -8, transition: { duration: 0.3 } }}
                className="group relative"
              >
                {/* Glow effect on hover */}
                <div
                  className="absolute inset-0 rounded-2xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                  style={{ background: feature.glowColor }}
                ></div>

                {/* Card */}
                <div className="relative h-full glass-card rounded-2xl p-8 border border-gray-800/50 group-hover:border-gray-700 transition-all duration-300 backdrop-blur-xl">
                  {/* Gradient line on top */}
                  <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${feature.color} rounded-t-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300`}></div>

                  {/* Icon with enhanced gradient background */}
                  <div className="relative mb-6">
                    <div className={`w-16 h-16 rounded-xl bg-gradient-to-br ${feature.color} p-0.5 group-hover:scale-110 transition-transform duration-300`}>
                      <div className="w-full h-full bg-gray-900 rounded-xl flex items-center justify-center">
                        <Icon className="w-8 h-8 text-white" />
                      </div>
                    </div>
                  </div>

                  <h3 className="text-2xl font-bold text-white mb-4 group-hover:text-transparent group-hover:bg-gradient-to-r group-hover:from-white group-hover:to-gray-300 group-hover:bg-clip-text transition-all duration-300">
                    {feature.title}
                  </h3>

                  <p className="text-gray-400 leading-relaxed text-base">
                    {feature.description}
                  </p>

                  {/* Hover indicator */}
                  <div className="absolute bottom-6 right-6 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <div className={`w-2 h-2 rounded-full bg-gradient-to-r ${feature.color}`}></div>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
