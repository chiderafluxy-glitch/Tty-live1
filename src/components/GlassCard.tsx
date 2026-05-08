import React from "react";
import { motion } from "motion/react";

interface GlassCardProps {
  children: React.ReactNode;
  className?: string;
  delay?: number;
  key?: React.Key;
}

export function GlassCard({ children, className = "", delay = 0, ...props }: GlassCardProps) {
  return (
    <motion.div
      {...props}
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5, delay }}
      className={`glass-card p-6 border-white/5 bg-white/[0.03] shadow-subtle-glass backdrop-blur-md ${className}`}
    >
      {children}
    </motion.div>
  );
}
