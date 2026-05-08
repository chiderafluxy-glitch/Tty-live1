import { Shield, Copy, Highlighter, History, Mic2, Bot } from "lucide-react";

export const FEATURES = [
  {
    title: "Privacy Shield",
    description: "Automatically detects and redacts secrets before they leave your machine.",
    icon: Shield,
    isPro: false,
  },
  {
    title: "Copy-Paste Blocks",
    description: "Everything on the viewer's screen is selectable and copy-pasteable.",
    icon: Copy,
    isPro: false,
  },
  {
    title: "Magic Highlighter",
    description: "Click a line to highlight it on the sharer's screen instantly.",
    icon: Highlighter,
    isPro: true,
  },
  {
    title: "5-Minute Rewind",
    description: "Viewers can scroll back independently without affecting the live stream.",
    icon: History,
    isPro: false,
  },
  {
    title: "Voice Chat",
    description: "Built-in high-quality voice streaming for seamless pair programming.",
    icon: Mic2,
    isPro: true,
  },
  {
    title: "AI Viewer Sidekick",
    description: "An AI companion that explains complex commands and suggests fixes.",
    icon: Bot,
    isPro: true,
  },
];

export const PRICING = [
  {
    name: "Basic",
    price: "9",
    features: [
      "Unlimited public sessions",
      "Privacy Shield",
      "5-Minute Rewind",
      "Standard support"
    ]
  },
  {
    name: "Pro",
    price: "30",
    features: [
      "Everything in Basic",
      "Magic Highlighter",
      "Voice Chat",
      "AI Viewer Sidekick",
      "Priority support"
    ]
  }
];

export const STEPS = [
  {
    title: "Install the CLI",
    command: "npm install -g tty-live"
  },
  {
    title: "Share Session",
    command: "tty share"
  },
  {
    title: "Send the Link",
    command: "https://tty.live/share/xyz"
  }
];
