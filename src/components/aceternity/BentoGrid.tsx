import React from "react";
import { cn } from "@/lib/utils";

export const BentoGrid = ({
  className,
  children,
}: {
  className?: string;
  children?: React.ReactNode;
}) => {
  return (
    <div
      className={cn(
        "grid md:auto-rows-[18rem] grid-cols-1 md:grid-cols-3 gap-5 max-w-7xl mx-auto",
        className
      )}
    >
      {children}
    </div>
  );
};

export const BentoGridItem = ({
  className,
  title,
  description,
  header,
  icon,
  badge,
  onClick,
}: {
  className?: string;
  title?: string | React.ReactNode;
  description?: string | React.ReactNode;
  header?: React.ReactNode;
  icon?: React.ReactNode;
  badge?: React.ReactNode;
  onClick?: () => void;
}) => {
  return (
    <div
      onClick={onClick}
      className={cn(
        "row-span-1 border-2 border-[#262626] bg-[#121212] p-5 justify-between flex flex-col space-y-4 shadow-[4px_4px_0px_0px_#1A1A1A] hover:shadow-[4px_4px_0px_0px_#FF4500] hover:border-[#FF4500] transition-all duration-200 group/bento cursor-pointer relative overflow-hidden",
        className
      )}
    >
      {header}
      <div className="group-hover/bento:translate-x-1 transition duration-200">
        <div className="flex items-center justify-between gap-2 mb-2">
          {icon}
          {badge}
        </div>
        <div className="font-display font-bold text-[#E5E5E5] text-base uppercase tracking-wide mb-1">
          {title}
        </div>
        <div className="font-sans text-xs text-[#9E9E9E] line-clamp-2">
          {description}
        </div>
      </div>
    </div>
  );
};
