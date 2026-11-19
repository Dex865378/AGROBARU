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
    default: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
    purple: "bg-violet-500/15 text-violet-300 border-violet-500/30",
    yellow: "bg-amber-500/15 text-amber-300 border-amber-500/30",
    orange: "bg-orange-500/15 text-orange-300 border-orange-500/30",
    secondary: "bg-slate-800/80 text-slate-300 border-slate-700",
    destructive: "bg-red-500/15 text-red-300 border-red-500/35",
    success: "bg-emerald-500/15 text-emerald-300 border-emerald-500/35",
    warning: "bg-amber-500/15 text-amber-300 border-amber-500/35",
    outline: "bg-transparent text-slate-300 border-slate-700",
    'live-green': "bg-emerald-500/15 text-emerald-300 border-emerald-500/35",
    'live-yellow': "bg-amber-500/15 text-amber-300 border-amber-500/35",
    'live-purple': "bg-violet-500/15 text-violet-300 border-violet-500/35",
    'live-orange': "bg-orange-500/15 text-orange-300 border-orange-500/35",
    'phyto-certified': "bg-emerald-500/20 text-emerald-300 border-emerald-500/40 font-semibold",
    'escrow-locked': "bg-violet-500/20 text-violet-300 border-violet-500/40 font-semibold",
  }

  const dotColors = {
    default: "bg-emerald-400",
    purple: "bg-violet-400",
    yellow: "bg-amber-400",
    orange: "bg-orange-400",
    secondary: "bg-slate-400",
    destructive: "bg-red-400",
    success: "bg-emerald-400",
    warning: "bg-amber-400",
    outline: "bg-emerald-400",
    'live-green': "bg-emerald-400",
    'live-yellow': "bg-amber-400",
    'live-purple': "bg-violet-400",
    'live-orange': "bg-orange-400",
    'phyto-certified': "bg-emerald-400",
    'escrow-locked': "bg-violet-400",
  }

  const showDot = pulse || variant.startsWith('live-');

  return (
    <div
      className={cn(
        "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-sans font-medium leading-snug tracking-normal border transition-colors",
        variants[variant],
        className
      )}
      {...props}
    >
      {showDot && (
        <span className={cn("inline-flex rounded-full h-1.5 w-1.5 shrink-0", dotColors[variant])} />
      )}
      {children}
    </div>
  )
}

export { Badge }
