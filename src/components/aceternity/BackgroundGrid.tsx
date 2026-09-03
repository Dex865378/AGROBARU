import React from "react";

export function BackgroundGrid({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen w-full bg-[#0A0A0A] relative flex flex-col">
      {/* Precision Grid Layer */}
      <div 
        className="fixed inset-0 pointer-events-none z-0"
        style={{
          backgroundImage: `
            linear-gradient(to right, rgba(21, 128, 61, 0.07) 1px, transparent 1px),
            linear-gradient(to bottom, rgba(21, 128, 61, 0.07) 1px, transparent 1px)
          `,
          backgroundSize: '32px 32px',
        }}
      />
      {/* Subtle Agro Vignette */}
      <div className="fixed inset-0 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(21,128,61,0.12),rgba(10,10,10,0))] pointer-events-none z-0" />
      
      {/* Content */}
      <div className="relative z-10 flex flex-col min-h-screen">
        {children}
      </div>
    </div>
  );
}
