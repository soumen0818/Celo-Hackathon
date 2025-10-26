'use client';

import { motion } from 'framer-motion';
import { TrendingUp, Users, DollarSign, Award } from 'lucide-react';

const stats = [
  {
    icon: DollarSign,
    value: '$2.5M',
    label: 'Total Grants Distributed',
    change: '+125%',
    color: 'from-green-500 to-emerald-500',
  },
  {
    icon: Users,
    value: '524',
    label: 'Projects Funded',
    change: '+89%',
    color: 'from-blue-500 to-cyan-500',
  },
  {
    icon: Award,
    value: '1,240',
    label: 'Active Contributors',
    change: '+156%',
    color: 'from-purple-500 to-pink-500',
  },
  {
    icon: TrendingUp,
    value: '99.2%',
    label: 'Transparency Score',
    change: '+2.4%',
    color: 'from-orange-500 to-red-500',
  },
];

export default function Stats() {
  return (
    <section className="py-20 px-4">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {stats.map((stat, index) => {
            const Icon = stat.icon;
            return (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="relative group"
              >
                <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border border-gray-700 hover:border-blue-500/50 transition-all duration-300">
                  {/* Icon */}
                  <div className={`w-12 h-12 rounded-lg bg-gradient-to-br ${stat.color} p-2.5 mb-4`}>
                    <Icon className="w-full h-full text-white" />
                  </div>

                  {/* Value */}
                  <div className="text-3xl font-bold text-white mb-1">
                    {stat.value}
                  </div>

                  {/* Label */}
                  <div className="text-gray-400 text-sm mb-2">
                    {stat.label}
                  </div>

                  {/* Change indicator */}
                  <div className="flex items-center space-x-1 text-green-400 text-sm">
                    <TrendingUp className="w-4 h-4" />
                    <span>{stat.change}</span>
                    <span className="text-gray-500">vs last month</span>
                  </div>
                </div>

                {/* Glow effect */}
                <div className={`absolute inset-0 bg-gradient-to-br ${stat.color} opacity-0 group-hover:opacity-10 rounded-xl blur-xl transition-opacity duration-300`}></div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
