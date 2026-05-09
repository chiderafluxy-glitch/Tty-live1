import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "motion/react";

const MOCK_LINES = [
  "$ npm install -g tty-live",
  "+ tty-live@1.0.0 added 124 packages...",
  "$ tty share",
  "➤ Session Live!",
  "➤ URL: https://tty.live/s/alpha-bravo-echo",
  "$ cd projects/demo",
  "$ ls -la",
  "drwxr-xr-x-dev  .",
  "drwxr-xr-x-dev  ..",
  "-rw-r--r--   package.json",
  "$ cat .env",
  "DB_PASSWORD=[REDACTED]",
  "STRIPE_KEY=[REDACTED]",
  "$ node server.js",
  "Server running at http://localhost:3000",
];

export function TerminalDemo() {
  const [lines, setLines] = useState<string[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % MOCK_LINES.length);
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    setLines(MOCK_LINES.slice(0, currentIndex + 1));
  }, [currentIndex]);

  return (
    <div className="glass-card w-full max-w-2xl h-80 overflow-hidden font-mono text-[13px] p-6 relative border-white/10">
      <div className="flex gap-1.5 mb-6">
        <div className="w-2.5 h-2.5 rounded-full bg-white/10" />
        <div className="w-2.5 h-2.5 rounded-full bg-white/10" />
        <div className="w-2.5 h-2.5 rounded-full bg-white/10" />
      </div>
      <div className="space-y-1.5 font-mono">
        <AnimatePresence mode="popLayout">
          {lines.map((line, i) => (
            <motion.div
              key={`${i}-${line}`}
              initial={{ opacity: 0, x: -4 }}
              animate={{ opacity: 1, x: 0 }}
              className={`${line.startsWith('$') ? 'text-amber-glow' : line.includes('[REDACTED]') ? 'text-neon-orange font-bold' : 'text-arctic-mist/80'}`}
            >
              {line}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
      <div className="absolute inset-0 pointer-events-none bg-radial-[at_50%_0%] from-white/5 to-transparent opacity-50" />
    </div>
  );
}
