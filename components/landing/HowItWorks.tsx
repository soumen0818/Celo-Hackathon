'use client';

import { motion } from 'framer-motion';
import { Database, Brain, Coins, BarChart } from 'lucide-react';

const steps = [
  {
    icon: Database,
    title: 'Data Collection',
    description: 'System fetches project data from GitHub, social metrics, and on-chain activity automatically.',
    step: '01',
    color: 'from-blue-500 to-cyan-500',
  },
  {
    icon: Brain,
    title: 'AI Analysis',
    description: 'Our AI engine analyzes multiple factors and calculates a transparent Impact Score for each project.',
    step: '02',
    color: 'from-purple-500 to-pink-500',
  },
  {
    icon: Coins,
    title: 'Smart Distribution',
    description: 'Smart contracts automatically distribute cUSD grants to top-scoring projects based on predefined rules.',
    step: '03',
    color: 'from-cyan-500 to-blue-500',
  },
  {
    icon: BarChart,
    title: 'Track Progress',
    description: 'View real-time leaderboards, funding history, and detailed analytics on the dashboard.',
    step: '04',
    color: 'from-pink-500 to-purple-500',
  },
];

export default function HowItWorks() {
  return (
    <section id="how-it-works" className="py-24 px-4 relative overflow-hidden">
      {/* Enhanced background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/2 left-0 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl"></div>
      </div>

      <div className="max-w-7xl mx-auto relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-20"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="inline-block mb-4"
          >
            <span className="px-4 py-2 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-400 text-sm font-semibold">
              Simple Process
            </span>
          </motion.div>
          <h2 className="text-5xl md:text-6xl font-bold mb-6">
            <span className="bg-gradient-to-r from-white via-purple-200 to-blue-200 bg-clip-text text-transparent">
              How It Works
            </span>
          </h2>
          <p className="text-xl text-gray-400 max-w-3xl mx-auto leading-relaxed">
            Four simple steps to transparent and automated grant distribution powered by AI and blockchain
          </p>
        </motion.div>

        <div className="relative">
          {/* Enhanced connection line with gradient */}
          <div className="hidden lg:block absolute top-32 left-[12%] right-[12%] h-1 overflow-hidden">
            <div className="w-full h-full bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 opacity-30"></div>
            <motion.div
              initial={{ scaleX: 0 }}
              whileInView={{ scaleX: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 1.5, ease: 'easeInOut' }}
              className="absolute inset-0 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 origin-left"
            ></motion.div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-6 relative z-10">
            {steps.map((step, index) => {
              const Icon = step.icon;
              return (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.2, duration: 0.5 }}
                  className="relative group"
                >
                  {/* Step card */}
                  <div className="glass-card rounded-2xl p-8 border border-gray-800/50 hover:border-gray-700 transition-all duration-300 backdrop-blur-xl h-full relative overflow-hidden">
                    {/* Gradient overlay on hover */}
                    <div className={`absolute inset-0 bg-gradient-to-br ${step.color} opacity-0 group-hover:opacity-5 transition-opacity duration-300`}></div>

                    {/* Step number badge */}
                    <div className={`absolute -top-4 -right-4 w-14 h-14 bg-gradient-to-br ${step.color} rounded-2xl flex items-center justify-center font-bold text-white text-lg shadow-xl shadow-blue-500/20 group-hover:scale-110 transition-transform duration-300`}>
                      {step.step}
                    </div>

                    {/* Icon with premium styling */}
                    <div className="relative mb-6">
                      <div className={`w-20 h-20 bg-gradient-to-br ${step.color} rounded-2xl p-0.5 mx-auto group-hover:scale-110 transition-transform duration-300`}>
                        <div className="w-full h-full bg-gray-900 rounded-2xl flex items-center justify-center">
                          <Icon className="w-10 h-10 text-white" />
                        </div>
                      </div>
                    </div>

                    <h3 className="text-2xl font-bold text-white mb-4 text-center group-hover:text-transparent group-hover:bg-gradient-to-r group-hover:from-white group-hover:to-gray-300 group-hover:bg-clip-text transition-all duration-300">
                      {step.title}
                    </h3>

                    <p className="text-gray-400 text-center leading-relaxed">
                      {step.description}
                    </p>

                    {/* Bottom indicator line */}
                    <div className={`absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r ${step.color} opacity-0 group-hover:opacity-100 transition-opacity duration-300`}></div>
                  </div>

                  {/* Arrow connector for desktop */}
                  {index < steps.length - 1 && (
                    <div className="hidden lg:block absolute top-32 -right-3 z-20">
                      <motion.div
                        initial={{ opacity: 0, x: -10 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: index * 0.2 + 0.5 }}
                        className="w-6 h-6 border-r-2 border-t-2 border-purple-500/50 transform rotate-45"
                      ></motion.div>
                    </div>
                  )}
                </motion.div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
