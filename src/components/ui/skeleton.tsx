import * as React from "react"
import { cn } from "@/lib/utils"

function Skeleton({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "animate-pulse bg-[#161F16] border border-[#15803D]/20",
        className
      )}
      {...props}
    />
  )
}

export { Skeleton }
