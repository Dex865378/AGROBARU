import React from 'react';
import { 
  ShieldCheck, 
  MapPin, 
  Terminal, 
  Lock, 
  Star, 
  Scale, 
  HelpCircle, 
  FileText, 
  Cookie, 
  ExternalLink 
} from 'lucide-react';
import { LegalTabType } from '@/components/legal/LegalComplianceModal';

interface FooterProps {
  onOpenLegalModal?: (tab: LegalTabType) => void;
  onOpenGoogleProfile?: () => void;
  onOpenFaqModal?: () => void;
}

export const Footer: React.FC<FooterProps> = ({
  onOpenLegalModal,
  onOpenGoogleProfile,
  onOpenFaqModal
}) => {
  return (
    <footer className="w-full border-t border-[#1E2E26] bg-[#0C120E] text-[#9E9E9E] mt-auto font-mono text-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-10 pb-28 md:py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Col 1 */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#10B981] to-[#15803D] flex items-center justify-center font-display font-bold text-[#05100A] text-sm shadow-sm">
                AB
              </div>
              <span className="font-display font-bold text-lg text-[#ECFDF5] tracking-wider">
                AGRO<span className="text-[#10B981]">BARÚ</span>
              </span>
            </div>
            <p className="text-[11px] leading-relaxed text-[#9E9E9E] font-sans">
              Protocolo descentralizado de trazabilidad criptográfica y comercio justo para los productores del Distrito de Barú, Chiriquí, República de Panamá.
            </p>
            <div className="text-[10px] text-[#15803D] font-bold">
              ESTÁNDAR MIDA // CÓDIGO ABIERTO
            </div>
            
            {/* Google Business Profile Quick Trigger */}
            <div className="pt-1">
              <button
                onClick={onOpenGoogleProfile}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-[#141414] hover:bg-[#1A1A1A] border border-[#FACC15]/40 text-[#FACC15] text-[10px] font-bold transition-colors"
              >
                <Star className="w-3 h-3 fill-current" />
                <span>Google Business 4.9★ (142 reseñas)</span>
              </button>
            </div>
          </div>

          {/* Col 2 */}
          <div className="space-y-2">
            <h4 className="font-display font-bold text-xs text-[#E5E5E5] uppercase tracking-wider border-b border-[#15803D]/40 pb-1">
              Corregimientos de Cobertura
            </h4>
            <ul className="space-y-1 text-[11px]">
              <li className="flex items-center gap-1.5 hover:text-[#15803D]">
                <MapPin className="w-3 h-3 text-[#15803D]" strokeWidth={1.5} /> Puerto Armuelles (Cabecera)
              </li>
              <li className="flex items-center gap-1.5 hover:text-[#15803D]">
                <MapPin className="w-3 h-3 text-[#15803D]" strokeWidth={1.5} /> Limones (Península Burica)
              </li>
              <li className="flex items-center gap-1.5 hover:text-[#15803D]">
                <MapPin className="w-3 h-3 text-[#15803D]" strokeWidth={1.5} /> Progreso (Frontera Paso Canoas)
              </li>
              <li className="flex items-center gap-1.5 hover:text-[#15803D]">
                <MapPin className="w-3 h-3 text-[#15803D]" strokeWidth={1.5} /> Baco (Cuenca Río Chiriquí Viejo)
              </li>
              <li className="flex items-center gap-1.5 hover:text-[#15803D]">
                <MapPin className="w-3 h-3 text-[#15803D]" strokeWidth={1.5} /> Rodolfo Aguilar Delgado
              </li>
            </ul>
          </div>

          {/* Col 3 */}
          <div className="space-y-2">
            <h4 className="font-display font-bold text-xs text-[#E5E5E5] uppercase tracking-wider border-b border-[#15803D]/40 pb-1">
              Seguridad & Protocolos
            </h4>
            <ul className="space-y-1.5 text-[11px]">
              <li className="flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-[#7C3AED]" strokeWidth={1.5} />
                <span>SHA-256 Hash Chain Inmutable</span>
              </li>
              <li className="flex items-center gap-1.5">
                <Lock className="w-3.5 h-3.5 text-[#FACC15]" strokeWidth={1.5} />
                <span>Escrow Yappy / Nequi / ACH</span>
              </li>
              <li className="flex items-center gap-1.5">
                <Terminal className="w-3.5 h-3.5 text-[#15803D]" strokeWidth={1.5} />
                <span>Árboles Merkle en Códigos QR</span>
              </li>
              <li className="flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-[#F97316]" strokeWidth={1.5} />
                <span>Sensor Térmico Cadena de Frío</span>
              </li>
            </ul>
          </div>

          {/* Col 4 */}
          <div className="space-y-2">
            <h4 className="font-display font-bold text-xs text-[#E5E5E5] uppercase tracking-wider border-b border-[#15803D]/40 pb-1">
              Centro Legal & Soporte
            </h4>
            <p className="text-[11px] leading-relaxed font-sans text-[#9E9E9E]">
              Desarrollado en alianza con asociaciones de productores de plátano, banano, cacao y palma aceitera de Chiriquí.
            </p>
            
            <div className="space-y-1.5 pt-1 text-[11px]">
              <button
                onClick={onOpenFaqModal}
                className="w-full text-left flex items-center gap-1.5 text-[#CCCCCC] hover:text-[#15803D] transition-colors"
              >
                <HelpCircle className="w-3.5 h-3.5 text-[#15803D]" />
                <span>Preguntas Frecuentes (FAQ)</span>
              </button>

              <button
                onClick={() => onOpenLegalModal && onOpenLegalModal('terms')}
                className="w-full text-left flex items-center gap-1.5 text-[#CCCCCC] hover:text-[#15803D] transition-colors"
              >
                <FileText className="w-3.5 h-3.5 text-[#7C3AED]" />
                <span>Términos y Condiciones</span>
              </button>

              <button
                onClick={() => onOpenLegalModal && onOpenLegalModal('privacy')}
                className="w-full text-left flex items-center gap-1.5 text-[#CCCCCC] hover:text-[#15803D] transition-colors"
              >
                <Scale className="w-3.5 h-3.5 text-[#38BDF8]" />
                <span>Privacidad (Ley 81 Panamá)</span>
              </button>
            </div>

            <button
              onClick={onOpenGoogleProfile}
              className="w-full p-2 bg-[#0A0A0A] hover:bg-[#141414] border border-[#15803D]/60 text-[10px] text-[#15803D] font-mono flex items-center justify-between text-left transition-colors"
            >
              <span>GPS: 8.2831° N • 82.8624° W</span>
              <ExternalLink className="w-3 h-3" />
            </button>
          </div>
        </div>

        {/* Legal Bar with functional triggers */}
        <div className="mt-8 pt-6 border-t border-[#1E293B] flex flex-col sm:flex-row items-center justify-between gap-4 text-[10px] text-[#666666]">
          <div>
            © {new Date().getFullYear()} AGROBARÚ • PROTOCOLO AGRO-CRIPTO DE PANAMÁ • TODOS LOS DERECHOS RESERVADOS
          </div>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5">
            <button
              onClick={() => onOpenLegalModal && onOpenLegalModal('terms')}
              className="hover:text-[#E5E5E5] cursor-pointer transition-colors whitespace-nowrap"
            >
              Términos de Escrow
            </button>
            <button
              onClick={() => onOpenLegalModal && onOpenLegalModal('privacy')}
              className="hover:text-[#E5E5E5] cursor-pointer transition-colors whitespace-nowrap"
            >
              Privacidad de Fincas (Ley 81)
            </button>
            <button
              onClick={() => onOpenLegalModal && onOpenLegalModal('cookies')}
              className="hover:text-[#E5E5E5] cursor-pointer transition-colors whitespace-nowrap"
            >
              Preferencias de Cookies
            </button>
            <button
              onClick={() => onOpenLegalModal && onOpenLegalModal('refunds')}
              className="hover:text-[#E5E5E5] cursor-pointer transition-colors whitespace-nowrap"
            >
              Garantía de Fruta
            </button>
            <button
              onClick={() => onOpenLegalModal && onOpenLegalModal('disclaimer')}
              className="hover:text-[#E5E5E5] cursor-pointer transition-colors whitespace-nowrap"
            >
              Aviso Legal MIDA
            </button>
          </div>
        </div>
      </div>
    </footer>
  );
};
