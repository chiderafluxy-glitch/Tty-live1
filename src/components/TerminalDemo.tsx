import { useEffect, useState } from "react";
import { motion } from "motion/react";

const MOCK_LINES = [
  { text: "$ npm install -g tty-live", type: "cmd" },
  { text: "+ tty-live@1.0.0 added 124 packages", type: "output" },
  { text: "$ tty share", type: "cmd" },
  { text: "➤ Session Live!", type: "success" },
  { text: "➤ URL: https://tty.live/s/alpha-bravo-echo", type: "success" },
  { text: "$ cd projects/demo && ls", type: "cmd" },
  { text: "package.json  src/  node_modules/", type: "output" },
  { text: "$ cat .env", type: "cmd" },
  { text: "DB_PASSWORD=[REDACTED]", type: "redacted" },
  { text: "STRIPE_KEY=[REDACTED]", type: "redacted" },
  { text: "$ node server.js", type: "cmd" },
  { text: "Server running on port 3000 ✓", type: "output" },
];

export function TerminalDemo() {
  const [visibleLines, setVisibleLines] = useState<typeof MOCK_LINES>([]);
  const [cursor, setCursor] = useState(true);

  useEffect(() => {
    // Add lines one by one
    let index = 0;
    const addLine = () => {
      if (index < MOCK_LINES.length) {
        setVisibleLines(prev => [...prev, MOCK_LINES[index]]);
        index++;
        setTimeout(addLine, index % 2 === 0 ? 400 : 800);
      } else {
        // Reset after showing all lines
        setTimeout(() => {
          setVisibleLines([]);
          index = 0;
          setTimeout(addLine, 500);
        }, 3000);
      }
    };
    const timer = setTimeout(addLine, 500);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    const interval = setInterval(() => setCursor(p => !p), 500);
    return () => clearInterval(interval);
  }, []);

  const getColor = (type: string) => {
    switch (type) {
      case 'cmd': return 'text-green-400';
      case 'success': return 'text-neon-orange';
      case 'redacted': return 'text-red-400';
      default: return 'text-white/60';
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto rounded-2xl border border-white/10 bg-black/60 backdrop-blur-sm overflow-hidden">
      {/* Window chrome */}
      <div className="flex items-center gap-2 px-4 py-3 border-b border-white/5 bg-white/[0.02]">
        <div className="w-3 h-3 rounded-full bg-red-500/60" />
        <div className="w-3 h-3 rounded-full bg-yellow-500/60" />
        <div className="w-3 h-3 rounded-full bg-green-500/60" />
        <span className="ml-2 text-xs text-white/30 font-mono">~/projects/demo</span>
      </div>
      {/* Terminal content */}
      <div className="p-5 font-mono text-[13px] h-64 overflow-hidden">
        {visibleLines.map((line, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.15 }}
            className={`leading-relaxed ${getColor(line.type)}`}
          >
            {line.text}
          </motion.div>
        ))}
        <span className={`inline-block w-2 h-4 bg-green-400 ml-0.5 ${cursor ? 'opacity-100' : 'opacity-0'} transition-opacity`} />
      </div>
    </div>
  );
}
