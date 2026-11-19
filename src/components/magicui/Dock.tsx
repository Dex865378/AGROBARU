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
        "flex h-14 max-w-[calc(100vw-1rem)] items-center justify-center gap-1 sm:gap-2 rounded-2xl bg-[#090D0B]/95 px-2 sm:px-3 py-2 border border-[#1E2E26] shadow-2xl backdrop-blur-md",
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
        "relative flex h-9 w-9 sm:h-10 sm:w-10 shrink-0 items-center justify-center rounded-xl transition-all",
        active
          ? "bg-[#10B981] text-[#05100A] shadow-sm scale-105"
          : "bg-[#111714] text-[#9E9E9E] border border-[#1E2E26] hover:border-[#10B981]/60 hover:text-[#ECFDF5] hover:scale-105",
        className
      )}
    >
      {children}
    </button>
  );
};
