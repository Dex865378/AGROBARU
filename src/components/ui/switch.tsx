import * as React from "react";
import { cn } from "@/lib/utils";

interface SwitchProps {
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  disabled?: boolean;
  className?: string;
  id?: string;
}

const Switch: React.FC<SwitchProps> = ({
  checked,
  onCheckedChange,
  disabled = false,
  className,
  id,
}) => {
  return (
    <button
      type="button"
      role="switch"
      id={id}
      aria-checked={checked}
      disabled={disabled}
      onClick={() => onCheckedChange(!checked)}
      className={cn(
        "inline-flex h-6 w-12 shrink-0 cursor-pointer items-center rounded-none border-2 transition-colors focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50",
        checked
          ? "border-[#FF4500] bg-[#FF4500]"
          : "border-[#383838] bg-[#1A1A1A]",
        className
      )}
    >
      <span
        className={cn(
          "pointer-events-none block h-4 w-4 rounded-none bg-black shadow-sm transition-transform",
          checked ? "translate-x-6 bg-black" : "translate-x-0.5 bg-[#9E9E9E]"
        )}
      />
    </button>
  );
};

export { Switch };
