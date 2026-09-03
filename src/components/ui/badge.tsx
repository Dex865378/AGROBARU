import * as React from "react"
import { cn } from "@/lib/utils"

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 
    | 'default' 
    | 'purple' 
    | 'yellow' 
    | 'orange' 
    | 'secondary' 
    | 'outline' 
    | 'destructive' 
    | 'success' 
    | 'warning'
    | 'live-green'
    | 'live-yellow'
    | 'live-purple'
    | 'live-orange'
    | 'phyto-certified'
    | 'escrow-locked';
  pulse?: boolean;
}

function Badge({ className, variant = "default", pulse = false, children, ...props }: BadgeProps) {
  const variants = {
    default: "bg-[#15803D]/15 text-[#15803D] border-[#15803D]",
    purple: "bg-[#7C3AED]/15 text-[#7C3AED] border-[#7C3AED]",
    yellow: "bg-[#FACC15]/15 text-[#FACC15] border-[#FACC15]",
    orange: "bg-[#F97316]/15 text-[#F97316] border-[#F97316]",
    secondary: "bg-[#141414] text-[#9E9E9E] border-[#262626]",
    destructive: "bg-[#F97316]/15 text-[#F97316] border-[#F97316]",
    success: "bg-[#15803D]/20 text-[#15803D] border-[#15803D]",
    warning: "bg-[#FACC15]/20 text-[#FACC15] border-[#FACC15]",
    outline: "bg-transparent text-[#E5E5E5] border-[#15803D]",
    'live-green': "bg-[#15803D]/20 text-[#22C55E] border-[#15803D] shadow-[0_0_8px_rgba(21,128,61,0.3)]",
    'live-yellow': "bg-[#FACC15]/20 text-[#FACC15] border-[#FACC15] shadow-[0_0_8px_rgba(250,204,21,0.3)]",
    'live-purple': "bg-[#7C3AED]/20 text-[#A78BFA] border-[#7C3AED] shadow-[0_0_8px_rgba(124,58,237,0.3)]",
    'live-orange': "bg-[#F97316]/20 text-[#FB923C] border-[#F97316] shadow-[0_0_8px_rgba(249,115,22,0.3)]",
    'phyto-certified': "bg-[#15803D]/25 text-[#4ADE80] border-[#15803D] font-black",
    'escrow-locked': "bg-[#7C3AED]/25 text-[#C084FC] border-[#7C3AED] font-black",
  }

  const dotColors = {
    default: "bg-[#15803D]",
    purple: "bg-[#7C3AED]",
    yellow: "bg-[#FACC15]",
    orange: "bg-[#F97316]",
    secondary: "bg-[#9E9E9E]",
    destructive: "bg-[#F97316]",
    success: "bg-[#15803D]",
    warning: "bg-[#FACC15]",
    outline: "bg-[#15803D]",
    'live-green': "bg-[#22C55E]",
    'live-yellow': "bg-[#FACC15]",
    'live-purple': "bg-[#A78BFA]",
    'live-orange': "bg-[#FB923C]",
    'phyto-certified': "bg-[#4ADE80]",
    'escrow-locked': "bg-[#C084FC]",
  }

  const shouldPulse = pulse || variant.startsWith('live-');

  return (
    <div
      className={cn(
        "inline-flex items-center gap-1.5 px-2.5 py-0.5 text-[10px] font-mono font-bold uppercase tracking-wider border transition-colors",
        variants[variant],
        className
      )}
      {...props}
    >
      {shouldPulse && (
        <span className="relative flex h-2 w-2">
          <span className={cn("animate-ping absolute inline-flex h-full w-full rounded-full opacity-75", dotColors[variant])}></span>
          <span className={cn("relative inline-flex rounded-full h-2 w-2", dotColors[variant])}></span>
        </span>
      )}
      {children}
    </div>
  )
}

export { Badge }
