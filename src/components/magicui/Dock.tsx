import React from "react";
import { cn } from "@/lib/utils";

interface DockProps {
  className?: string;
  children: React.ReactNode;
  direction?: "top" | "middle" | "bottom";
}

export const Dock = ({ className, children }: DockProps) => {
  return (
    <div
      className={cn(
        "flex h-14 items-center gap-2 bg-[#0E0E0E] p-2 border-2 border-[#15803D] shadow-[4px_4px_0px_0px_#15803D] backdrop-blur-md",
        className
      )}
    >
      {children}
    </div>
  );
};

interface DockIconProps {
  className?: string;
  children: React.ReactNode;
  onClick?: () => void;
  active?: boolean;
  title?: string;
}

export const DockIcon = ({
  className,
  children,
  onClick,
  active,
  title,
}: DockIconProps) => {
  return (
    <button
      onClick={onClick}
      title={title}
      className={cn(
        "relative flex h-10 w-10 items-center justify-center transition-all",
        active
          ? "bg-[#15803D] text-black shadow-[2px_2px_0px_0px_#FACC15] scale-105"
          : "bg-[#141414] text-[#9E9E9E] border border-[#1E293B] hover:border-[#15803D] hover:text-[#E5E5E5] hover:scale-105",
        className
      )}
    >
      {children}
    </button>
  );
};
