import React from "react";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "orange" | "glass" | "outline";
  className?: string;
  onClick?: React.MouseEventHandler<HTMLButtonElement>;
  children?: React.ReactNode;
}

export function Button({ variant = "glass", children, className = "", ...props }: ButtonProps) {
  const baseStyles = "px-6 py-2.5 rounded-full font-medium transition-all duration-300 flex items-center justify-center gap-2 cursor-pointer text-sm tracking-tight h-10 select-none";
  
  const variantStyles = {
    orange: "bg-neon-orange text-white hover:shadow-orange-glow border-none",
    glass: "glass-button text-white",
    outline: "bg-transparent text-whisper-blue border border-white/10 hover:border-white/30 hover:text-white"
  };

  return (
    <button 
      className={`${baseStyles} ${variantStyles[variant]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
