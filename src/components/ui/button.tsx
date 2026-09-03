import * as React from "react"
import { cn } from "@/lib/utils"

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'secondary' | 'outline' | 'purple' | 'yellow' | 'orange' | 'destructive' | 'ghost' | 'success';
  size?: 'default' | 'sm' | 'lg' | 'icon';
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'default', size = 'default', ...props }, ref) => {
    const baseStyles = "inline-flex items-center justify-center font-mono font-bold uppercase transition-all focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50 active:translate-x-[2px] active:translate-y-[2px]"
    
    const variants = {
      default: "bg-[#15803D] text-black border-2 border-[#15803D] hover:bg-[#166534] shadow-[4px_4px_0px_0px_#FACC15]",
      secondary: "bg-[#0E0E0E] text-[#E5E5E5] border-2 border-[#15803D] hover:bg-[#15803D]/15 hover:text-[#15803D] shadow-[4px_4px_0px_0px_#1E293B]",
      outline: "bg-transparent text-[#E5E5E5] border-2 border-[#15803D] hover:bg-[#15803D]/10 hover:border-[#FACC15]",
      purple: "bg-[#7C3AED] text-white border-2 border-[#7C3AED] hover:bg-[#6D28D9] shadow-[4px_4px_0px_0px_#15803D]",
      yellow: "bg-[#FACC15] text-black border-2 border-[#FACC15] hover:bg-[#EAB308] shadow-[4px_4px_0px_0px_#15803D]",
      orange: "bg-[#F97316] text-black border-2 border-[#F97316] hover:bg-[#EA580C] shadow-[4px_4px_0px_0px_#7C3AED]",
      destructive: "bg-[#F97316] text-black border-2 border-[#F97316] hover:bg-[#EA580C] shadow-[4px_4px_0px_0px_#0A0A0A]",
      success: "bg-[#15803D] text-black border-2 border-[#15803D] hover:bg-[#166534] shadow-[4px_4px_0px_0px_#7C3AED]",
      ghost: "bg-transparent text-[#9E9E9E] hover:text-[#E5E5E5] hover:bg-[#141414]",
    }

    const sizes = {
      default: "h-11 px-5 py-2.5 text-xs tracking-wider",
      sm: "h-9 px-3.5 text-[11px] tracking-wider",
      lg: "h-13 px-7 text-sm tracking-widest",
      icon: "h-10 w-10 text-xs",
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
