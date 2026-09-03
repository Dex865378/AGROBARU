import * as React from "react"
import { cn } from "@/lib/utils"

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          "flex h-11 w-full bg-[#0A0A0A] px-3 py-2 text-xs font-mono text-[#E5E5E5] border-2 border-[#1E293B] shadow-inner placeholder:text-[#666666] focus-visible:outline-none focus-visible:border-[#15803D] focus-visible:ring-1 focus-visible:ring-[#15803D] disabled:cursor-not-allowed disabled:opacity-50 transition-all",
          className
        )}
        ref={ref}
        {...props}
      />
    )
  }
)
Input.displayName = "Input"

export { Input }
