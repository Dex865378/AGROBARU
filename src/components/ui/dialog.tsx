import * as React from "react"
import { X } from "lucide-react"
import { cn } from "@/lib/utils"

interface DialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  children: React.ReactNode;
}

export function Dialog({ open, onOpenChange, children }: DialogProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/85 backdrop-blur-sm">
      <div className="flex min-h-full items-center justify-center p-3 sm:p-6 text-center">
        {/* Backdrop click closer */}
        <div 
          className="fixed inset-0"
          onClick={() => onOpenChange(false)}
        />
        
        {/* Modal Box with Safe Viewport Dimensions */}
        <div className="relative z-50 w-full max-w-lg bg-[#0E0E0E] border-2 border-[#15803D] p-5 sm:p-6 text-left shadow-[8px_8px_0px_0px_#15803D] my-6 max-h-[88vh] overflow-y-auto flex flex-col">
          {children}
        </div>
      </div>
    </div>
  );
}

export function DialogHeader({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn("flex flex-col space-y-1 pb-3 border-b border-[#15803D]/40 text-left shrink-0", className)} {...props} />
  );
}

export function DialogTitle({ className, ...props }: React.HTMLAttributes<HTMLHeadingElement>) {
  return (
    <h2 className={cn("text-base sm:text-lg font-display font-black text-[#E5E5E5] uppercase tracking-wide", className)} {...props} />
  );
}

export function DialogDescription({ className, ...props }: React.HTMLAttributes<HTMLParagraphElement>) {
  return (
    <p className={cn("text-[11px] text-[#9E9E9E] font-sans leading-normal", className)} {...props} />
  );
}

export function DialogCloseButton({ onClose }: { onClose: () => void }) {
  return (
    <button
      onClick={onClose}
      className="absolute right-3 top-3 p-1.5 bg-[#141414] border border-[#262626] text-[#9E9E9E] hover:text-[#FACC15] hover:border-[#15803D] transition-colors z-10"
      title="Cerrar modal"
    >
      <X className="w-4 h-4" />
    </button>
  );
}
