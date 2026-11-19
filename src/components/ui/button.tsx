import * as React from "react"
import { cn } from "@/lib/utils"

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'secondary' | 'outline' | 'purple' | 'yellow' | 'orange' | 'destructive' | 'ghost' | 'success';
  size?: 'default' | 'sm' | 'lg' | 'icon';
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'default', size = 'default', ...props }, ref) => {
    const baseStyles = "inline-flex items-center justify-center rounded-lg font-sans font-semibold leading-snug text-center transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/50 disabled:pointer-events-none disabled:opacity-50 active:scale-[0.99]"
    
    const variants = {
      default: "bg-emerald-600 text-white border border-emerald-500/60 hover:bg-emerald-500 shadow-sm shadow-emerald-950/50",
      secondary: "bg-[#141B17] text-slate-100 border border-emerald-500/25 hover:bg-[#1B2520] hover:border-emerald-500/50",
      outline: "bg-transparent text-slate-200 border border-slate-700 hover:bg-emerald-500/10 hover:border-emerald-500/50 hover:text-emerald-300",
      purple: "bg-violet-600 text-white border border-violet-500/50 hover:bg-violet-500 shadow-sm",
      yellow: "bg-amber-500 text-slate-950 border border-amber-400/60 hover:bg-amber-400 shadow-sm",
      orange: "bg-orange-600 text-white border border-orange-500/50 hover:bg-orange-500 shadow-sm",
      destructive: "bg-red-600 text-white border border-red-500/60 hover:bg-red-500 shadow-sm",
      success: "bg-emerald-600 text-white border border-emerald-500/60 hover:bg-emerald-500 shadow-sm",
      ghost: "bg-transparent text-slate-400 hover:text-slate-100 hover:bg-white/5",
    }

    const sizes = {
      default: "min-h-10 h-auto px-4 py-2 text-sm",
      sm: "min-h-8 h-auto px-3 py-1.5 text-xs",
      lg: "min-h-11 h-auto px-6 py-2.5 text-sm",
      icon: "h-9 w-9 shrink-0 text-xs",
    }

    return (
      <button
        className={cn(baseStyles, variants[variant], sizes[size], className)}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button }
