import React, { useState } from 'react';
import { 
  MessageSquare, 
  X, 
  HelpCircle, 
  MapPin, 
  Phone, 
  FileText, 
  ChevronRight,
  ShieldCheck,
  Building
} from 'lucide-react';
import { Button } from '@/components/ui/button';

interface QuickHelpWidgetProps {
  onOpenFaq: () => void;
  onOpenGoogleProfile: () => void;
  onOpenLegal: (tab: any) => void;
  hidden?: boolean;
}

export const QuickHelpWidget: React.FC<QuickHelpWidgetProps> = ({
  onOpenFaq,
  onOpenGoogleProfile,
  onOpenLegal,
  hidden = false,
}) => {
  const [isOpen, setIsOpen] = useState(false);

  if (hidden) return null;

  const openWhatsApp = () => {
    window.open("https://wa.me/50768002278?text=Hola%20AgroBarú,%20necesito%20asistencia%20inmediata%20sobre%20un%20producto%20o%20lote", "_blank");
  };

  return (
    <div className="fixed bottom-20 right-3 md:bottom-6 md:right-6 z-40 font-mono max-w-[calc(100vw-1.5rem)]">
      {/* Popover Menu */}
      {isOpen && (
        <div className="mb-3 w-[min(20rem,calc(100vw-1.5rem))] bg-[#111714] border border-[#1E2E26] rounded-xl shadow-2xl p-4 text-xs text-[#E5E5E5]">
          <div className="flex items-center justify-between pb-3 border-b border-[#1E2E26]">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-[#10B981]" />
              <span className="font-display font-bold text-sm text-[#ECFDF5]">
                Mesa de Asistencia Barú
              </span>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="text-[#9E9E9E] hover:text-white p-1"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <p className="py-2.5 text-[11px] text-[#CCCCCC] font-sans leading-relaxed">
            ¿Dudas sobre calidad, pedidos en Escrow o publicación de cosechas? Atención directa desde Puerto Armuelles.
          </p>

          <div className="space-y-1.5 pt-1">
            {/* WhatsApp */}
            <button
              onClick={() => {
                setIsOpen(false);
                openWhatsApp();
              }}
              className="w-full flex items-center justify-between p-2.5 rounded-lg bg-[#090D0B] hover:bg-[#25D366]/15 border border-[#25D366]/40 text-[#25D366] font-bold text-left transition-colors"
            >
              <span className="flex items-center gap-2">
                <MessageSquare className="w-4 h-4 shrink-0" />
                <span>WhatsApp de Campo</span>
              </span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>

            {/* Google Profile */}
            <button
              onClick={() => {
                setIsOpen(false);
                onOpenGoogleProfile();
              }}
              className="w-full flex items-center justify-between p-2.5 rounded-lg bg-[#090D0B] hover:bg-[#FACC15]/15 border border-[#FACC15]/40 text-[#FACC15] font-bold text-left transition-colors"
            >
              <span className="flex items-center gap-2">
                <Building className="w-4 h-4 shrink-0" />
                <span>Ficha Google Business (4.9★)</span>
              </span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>

            {/* FAQ */}
            <button
              onClick={() => {
                setIsOpen(false);
                onOpenFaq();
              }}
              className="w-full flex items-center justify-between p-2.5 rounded-lg bg-[#090D0B] hover:bg-[#10B981]/15 border border-[#10B981]/40 text-[#10B981] font-bold text-left transition-colors"
            >
              <span className="flex items-center gap-2">
                <HelpCircle className="w-4 h-4 shrink-0" />
                <span>Preguntas Frecuentes (FAQ)</span>
              </span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>

            {/* Legal */}
            <button
              onClick={() => {
                setIsOpen(false);
                onOpenLegal('terms');
              }}
              className="w-full flex items-center justify-between p-2 rounded-lg bg-[#090D0B] hover:bg-[#161E19] border border-[#1E2E26] text-[11px] text-[#9E9E9E] hover:text-[#E5E5E5] text-left transition-colors"
            >
              <span className="flex items-center gap-2">
                <FileText className="w-3.5 h-3.5 shrink-0" />
                <span>Términos & Ley 81 Panamá</span>
              </span>
              <ChevronRight className="w-3 h-3" />
            </button>
          </div>

          <div className="mt-3 pt-2 border-t border-[#1E2E26] flex items-center justify-between text-[10px] text-[#666666]">
            <span>Horario: Lun - Sáb (6am - 6pm)</span>
            <span>+507 6800-2278</span>
          </div>
        </div>
      )}

      {/* Main Floating Trigger Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-4 py-2.5 rounded-full bg-[#10B981] hover:bg-[#059669] text-[#05100A] font-sans font-bold text-xs border border-[#34D399]/50 shadow-lg active:scale-95 transition-all"
        title="Mesa de Ayuda & WhatsApp Barú"
      >
        <MessageSquare className="w-4 h-4" />
        <span className="hidden sm:inline">Asistencia</span>
      </button>
    </div>
  );
};
