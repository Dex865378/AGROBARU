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
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/75 backdrop-blur-sm">
      <div className="flex min-h-full items-center justify-center p-3 sm:p-6 text-center">
        {/* Backdrop click closer */}
        <div 
          className="fixed inset-0"
          onClick={() => onOpenChange(false)}
        />
        
        {/* Modal Box with Safe Viewport Dimensions */}
        <div className="relative z-50 w-full max-w-lg bg-[#111714] rounded-xl border border-emerald-500/25 p-5 sm:p-6 text-left shadow-2xl shadow-black/70 my-6 max-h-[88vh] overflow-y-auto flex flex-col">
          {children}
        </div>
      </div>
    </div>
  );
}

export function DialogHeader({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn("flex flex-col space-y-1.5 pb-3 border-b border-emerald-500/15 text-left shrink-0 pr-8", className)} {...props} />
  );
}

export function DialogTitle({ className, ...props }: React.HTMLAttributes<HTMLHeadingElement>) {
  return (
    <h2 className={cn("text-lg font-display font-bold leading-snug tracking-normal text-slate-100", className)} {...props} />
  );
}

export function DialogDescription({ className, ...props }: React.HTMLAttributes<HTMLParagraphElement>) {
  return (
    <p className={cn("text-xs text-slate-400 font-sans leading-relaxed", className)} {...props} />
  );
}

export function DialogCloseButton({ onClose }: { onClose: () => void }) {
  return (
    <button
      onClick={onClose}
      type="button"
      className="absolute right-4 top-4 p-1.5 rounded-lg bg-[#18221D] border border-slate-700/80 text-slate-400 hover:text-white hover:border-emerald-500/50 transition-colors z-10"
      title="Cerrar"
    >
      <X className="w-4 h-4" />
    </button>
  );
}
