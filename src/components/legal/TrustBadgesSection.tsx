import React from 'react';
import { 
  ShieldCheck, 
  Lock, 
  Clock, 
  Award, 
  CheckCircle2, 
  Banknote, 
  MapPin, 
  Sparkles 
} from 'lucide-react';

import { LegalTabType } from '@/components/legal/LegalComplianceModal';

interface TrustBadgesSectionProps {
  onOpenLegalModal?: (tab: LegalTabType) => void;
  onOpenGoogleProfile?: () => void;
}

export const TrustBadgesSection: React.FC<TrustBadgesSectionProps> = ({
  onOpenLegalModal,
  onOpenGoogleProfile
}) => {
  return (
    <div className="w-full bg-[#111714] border border-[#1E2E26] rounded-2xl py-8 px-6 font-mono">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#1E2E26] pb-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-[#10B981]" />
              <h3 className="font-display font-bold text-sm uppercase text-[#ECFDF5] tracking-wider">
                Seguridad, Garantía Legal & Sellos de Confianza
              </h3>
            </div>
            <p className="text-[11px] text-[#9E9E9E] font-sans">
              Protección de punta a punta para transacciones agropecuarias en la República de Panamá
            </p>
          </div>

          <div className="flex items-center gap-2 text-xs">
            {onOpenGoogleProfile && (
              <button
                onClick={onOpenGoogleProfile}
                className="text-[11px] font-bold text-[#FACC15] hover:underline flex items-center gap-1"
              >
                ★ Ver Ficha Google (4.9 / 5.0)
              </button>
            )}
          </div>
        </div>

        {/* 4 Pillars of Trust */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Card 1 */}
          <div className="p-4 rounded-xl bg-[#090D0B] border border-[#10B981]/30 space-y-2">
            <div className="flex items-center gap-2 text-[#10B981]">
              <Lock className="w-4 h-4" />
              <span className="font-display font-bold text-xs uppercase text-[#ECFDF5]">
                Custodia Escrow 100%
              </span>
            </div>
            <p className="text-[11px] text-[#CCCCCC] font-sans leading-relaxed">
              El dinero se resguarda en custodia y solo se libera al agricultor cuando confirmas la recepción y pesaje en bodega o puerto.
            </p>
            <div className="text-[10px] text-[#10B981] font-bold">
              Yappy • Nequi • ACH Directo
            </div>
          </div>

          {/* Card 2 */}
          <div className="p-4 rounded-xl bg-[#090D0B] border border-[#7C3AED]/30 space-y-2">
            <div className="flex items-center gap-2 text-[#A78BFA]">
              <ShieldCheck className="w-4 h-4" />
              <span className="font-display font-bold text-xs uppercase text-[#ECFDF5]">
                Cifrado SSL & SHA-256
              </span>
            </div>
            <p className="text-[11px] text-[#CCCCCC] font-sans leading-relaxed">
              Trazabilidad criptográfica inalterable. Cada lote, corte y pesaje tiene un hash matemático que ningún intermediario puede falsear.
            </p>
            <div className="text-[10px] text-[#A78BFA] font-bold">
              TLS 1.3 // 256-Bit Encryption
            </div>
          </div>

          {/* Card 3 */}
          <div className="p-4 rounded-xl bg-[#090D0B] border border-[#FACC15]/30 space-y-2">
            <div className="flex items-center gap-2 text-[#FACC15]">
              <Clock className="w-4 h-4" />
              <span className="font-display font-bold text-xs uppercase text-[#ECFDF5]">
                Frescura & Autolimpieza 24h
              </span>
            </div>
            <p className="text-[11px] text-[#CCCCCC] font-sans leading-relaxed">
              Transparencia total de antigüedad y fotos. Si un lote se vende al 100%, el productor puede eliminarlo o se autorretira en 24 horas.
            </p>
            <div className="text-[10px] text-[#FACC15] font-bold">
              Cero Catálogos Saturados
            </div>
          </div>

          {/* Card 4 */}
          <div className="p-4 rounded-xl bg-[#090D0B] border border-[#38BDF8]/30 space-y-2">
            <div className="flex items-center gap-2 text-[#38BDF8]">
              <Award className="w-4 h-4" />
              <span className="font-display font-bold text-xs uppercase text-[#E5E5E5]">
                Conformidad MIDA & Ley 81
              </span>
            </div>
            <p className="text-[11px] text-[#CCCCCC] font-sans leading-relaxed">
              Cumplimiento riguroso de la Ley 81 de Protección de Datos Personales de Panamá y Buenas Prácticas Agrícolas del MIDA.
            </p>
            <div className="text-[10px] text-[#38BDF8] font-bold">
              República de Panamá // Barú
            </div>
          </div>
        </div>

        {/* Accepted Payment & Verified Logos */}
        <div className="pt-4 border-t border-[#1E293B] flex flex-col sm:flex-row sm:flex-wrap sm:items-center sm:justify-between gap-3 text-xs text-[#9E9E9E]">
          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
            <span className="text-[10px] uppercase font-bold text-[#E5E5E5] w-full sm:w-auto">Métodos Seguros:</span>
            <span className="px-2 py-0.5 bg-[#141414] border border-[#1E293B] text-[11px] text-[#0066FF] font-bold">
              Yappy Comercial
            </span>
            <span className="px-2 py-0.5 bg-[#141414] border border-[#1E293B] text-[11px] text-[#FF1493] font-bold">
              Nequi Panamá
            </span>
            <span className="px-2 py-0.5 bg-[#141414] border border-[#1E293B] text-[11px] text-[#15803D] font-bold">
              ACH Xpress
            </span>
            <span className="px-2 py-0.5 bg-[#141414] border border-[#1E293B] text-[11px] text-[#FACC15] font-bold">
              Custodia Escrow Barú
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[10px] sm:text-[11px]">
            <button
              onClick={() => onOpenLegalModal && onOpenLegalModal('terms')}
              className="hover:text-[#15803D] underline whitespace-nowrap"
            >
              Términos de Escrow
            </button>
            <button
              onClick={() => onOpenLegalModal && onOpenLegalModal('privacy')}
              className="hover:text-[#7C3AED] underline whitespace-nowrap"
            >
              Protección de Datos
            </button>
            <button
              onClick={() => onOpenLegalModal && onOpenLegalModal('refunds')}
              className="hover:text-[#38BDF8] underline whitespace-nowrap"
            >
              Garantía de Fruta
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
