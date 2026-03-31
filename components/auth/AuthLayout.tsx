'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import { FaUtensils } from 'react-icons/fa';

interface AuthLayoutProps {
  children: React.ReactNode;
  title: string;
  subtitle: string;
}

export default function AuthLayout({ children, title, subtitle }: AuthLayoutProps) {
  return (
    <div className="min-h-screen relative overflow-hidden bg-[#0f172a] flex items-center justify-center p-4">
      {/* Animated Background Blobs */}
      <motion.div
        animate={{
          scale: [1, 1.2, 1],
          x: [0, 50, 0],
          y: [0, 30, 0],
        }}
        transition={{
          duration: 20,
          repeat: Infinity,
          ease: "linear"
        }}
        className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-indigo-600/20 blur-[120px]"
      />
      <motion.div
        animate={{
          scale: [1, 1.3, 1],
          x: [0, -70, 0],
          y: [0, -50, 0],
        }}
        transition={{
          duration: 25,
          repeat: Infinity,
          ease: "linear"
        }}
        className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-purple-600/20 blur-[120px]"
      />
      <motion.div
        animate={{
          scale: [1, 1.5, 1],
          opacity: [0.3, 0.6, 0.3],
        }}
        transition={{
          duration: 15,
          repeat: Infinity,
          ease: "linear"
        }}
        className="absolute top-[20%] right-[10%] w-[30%] h-[30%] rounded-full bg-blue-600/10 blur-[100px]"
      />

      <div className="w-full max-w-md relative z-10">
        {/* Logo Section */}
        <motion.div 
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="text-center mb-10"
        >
          <Link href="/" className="inline-flex items-center space-x-3 mb-4 group">
            <div className="w-12 h-12 bg-indigo-600 rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-500/50 group-hover:scale-110 transition-transform duration-300">
              <FaUtensils className="w-6 h-6 text-white" />
            </div>
            <span className="text-3xl font-bold text-white tracking-tight">Digital<span className="text-indigo-400">Menu</span></span>
          </Link>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
          >
            <h2 className="text-xl font-semibold text-white/90">{title}</h2>
            <p className="text-gray-400 mt-2">{subtitle}</p>
          </motion.div>
        </motion.div>

        {/* Main Content Card (Glassmorphism) */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="backdrop-blur-xl bg-white/10 p-8 rounded-3xl border border-white/10 shadow-2xl"
        >
          {children}
        </motion.div>

        {/* Footer Link */}
        <motion.p 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
          className="mt-8 text-center"
        >
          <Link href="/" className="text-gray-500 hover:text-white transition-colors text-sm flex items-center justify-center space-x-2">
            <span>←</span>
            <span>Back to website</span>
          </Link>
        </motion.p>
      </div>
    </div>
  );
}
