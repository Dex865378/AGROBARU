import React, { useState } from 'react';
import { 
  Sprout, 
  Lock, 
  ArrowRight, 
  Radio, 
  Calculator,
  FileCheck,
  Tag,
  ShieldCheck,
  Award,
  CheckCircle2
} from 'lucide-react';
import { Spotlight } from '@/components/aceternity/Spotlight';
import { BorderBeam } from '@/components/magicui/BorderBeam';
import { NumberTicker } from '@/components/magicui/NumberTicker';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useAppState } from '@/context/AppStateContext';
import { useLanguage } from '@/context/LanguageContext';
import { AntiIntermediaryCalculator } from '@/components/tools/AntiIntermediaryCalculator';
import { ExportPassportModal } from '@/components/traceability/ExportPassportModal';
import { BoxLabelStickerModal } from '@/components/tools/BoxLabelStickerModal';
import { ExportPipelineVisualizer } from '@/components/traceability/ExportPipelineVisualizer';

export const HomePage: React.FC<{ onNavigate: (tab: string) => void }> = ({ onNavigate }) => {
  const { metrics, batches } = useAppState();
  const { language, t } = useLanguage();

  const [selectedBatchForPassport, setSelectedBatchForPassport] = useState<any>(null);
  const [selectedBatchForSticker, setSelectedBatchForSticker] = useState<any>(null);

  const sampleBatch = batches[0] || null;

  return (
    <div className="space-y-14 py-8 relative font-mono">
      {/* Hero Section */}
      <section className="relative overflow-hidden border-2 border-[#15803D] bg-[#0E0E0E] p-8 md:p-14 shadow-[8px_8px_0px_0px_#15803D]">
        <Spotlight className="-top-40 left-0 md:left-60 md:-top-20" fill="#15803D" />
        <BorderBeam size={320} duration={14} delay={0} colorFrom="#15803D" colorTo="#7C3AED" />

        <div className="relative z-10 max-w-4xl space-y-6">
          {/* Status Badges */}
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="live-green" pulse>
              {language === 'en' ? 'DIRECT EXPORT PROTOCOL // BARÚ' : 'PROTOCOLO DE EXPORTACIÓN // BARÚ'}
            </Badge>
            <Badge variant="live-purple" pulse>
              {language === 'en' ? 'MIDA & GAP CERTIFIED' : 'CERTIFICADO MIDA & BPA'}
            </Badge>
          </div>

          {/* Headline */}
          <h1 className="font-display font-black text-4xl sm:text-6xl md:text-7xl text-[#E5E5E5] uppercase tracking-tighter leading-[0.95]">
            TRAZABILIDAD <span className="text-[#15803D] underline decoration-[#FACC15] decoration-4 underline-offset-8">DIRECTA</span> & PAGOS PROTEGIDOS
          </h1>

          <p className="text-sm sm:text-base text-[#CCCCCC] font-sans leading-relaxed max-w-2xl">
            {language === 'en'
              ? 'Direct connection between Barú growers and global buyers. Zero middleman fees, Escrow payment custody, and verifiable crop audit.'
              : 'Conexión directa entre productores de Barú y compradores globales. Cero intermediarios, pagos protegidos en custodia y certificación inmutable de cosecha.'}
          </p>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center gap-3 pt-2">
            <Button
              variant="default"
              size="lg"
              onClick={() => onNavigate('marketplace')}
              className="flex items-center gap-2 text-xs sm:text-sm font-black"
            >
              <Sprout className="w-4 h-4" />
              <span>{language === 'en' ? 'EXPLORE BATCHES' : 'VER LOTES'}</span>
              <ArrowRight className="w-4 h-4" />
            </Button>

            <Button
              variant="outline"
              size="lg"
              onClick={() => onNavigate('farmer')}
              className="flex items-center gap-2 text-xs sm:text-sm"
            >
              <Lock className="w-4 h-4 text-[#15803D]" />
              <span>{language === 'en' ? 'FIELD LOG PWA' : 'BITÁCORA PWA'}</span>
            </Button>
          </div>

          {/* Quick Tools Launchers */}
          <div className="pt-4 border-t border-[#1E293B] flex flex-wrap items-center gap-3 text-xs">
            <button
              onClick={() => sampleBatch && setSelectedBatchForPassport(sampleBatch)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-[#141414] hover:bg-[#1A1A1A] border border-[#7C3AED] text-[#E5E5E5] font-bold shadow-[2px_2px_0px_0px_#7C3AED] transition-all"
            >
              <FileCheck className="w-3.5 h-3.5 text-[#7C3AED]" />
              <span>{language === 'en' ? 'PDF Passport' : 'Pasaporte PDF'}</span>
            </button>

            <button
              onClick={() => sampleBatch && setSelectedBatchForSticker(sampleBatch)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-[#141414] hover:bg-[#1A1A1A] border border-[#FACC15] text-[#E5E5E5] font-bold shadow-[2px_2px_0px_0px_#FACC15] transition-all"
            >
              <Tag className="w-3.5 h-3.5 text-[#FACC15]" />
              <span>{language === 'en' ? 'Thermal QR Labels' : 'Etiquetas QR'}</span>
            </button>

            <button
              onClick={() => onNavigate('calculator')}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-[#141414] hover:bg-[#1A1A1A] border border-[#15803D] text-[#E5E5E5] font-bold shadow-[2px_2px_0px_0px_#15803D] transition-all"
            >
              <Calculator className="w-3.5 h-3.5 text-[#15803D]" />
              <span>{language === 'en' ? 'ROI Simulator' : 'Simulador ROI'}</span>
            </button>
          </div>
        </div>

        {/* Live Metrics Footer */}
        <div className="mt-8 border-t-2 border-[#15803D] pt-4 grid grid-cols-2 md:grid-cols-4 gap-4 font-mono">
          <div>
            <div className="text-[10px] text-[#666666] uppercase">Volumen en Custodia</div>
            <div className="text-xl font-display font-bold text-[#E5E5E5]">
              $<NumberTicker value={metrics.totalEscrowVolumeUsd || 28750} decimalPlaces={2} />
            </div>
          </div>
          <div>
            <div className="text-[10px] text-[#666666] uppercase">Ahorro Intermediación</div>
            <div className="text-xl font-display font-bold text-[#15803D]">
              $<NumberTicker value={metrics.intermediaryFeeEliminatedUsd || 9150} decimalPlaces={2} />
            </div>
          </div>
          <div>
            <div className="text-[10px] text-[#666666] uppercase">Superficie Monitoreada</div>
            <div className="text-xl font-display font-bold text-[#E5E5E5]">
              <NumberTicker value={metrics.totalHectares || 87.7} suffix=" Ha" decimalPlaces={1} />
            </div>
          </div>
          <div>
            <div className="text-[10px] text-[#666666] uppercase">Pérdidas Evitadas</div>
            <div className="text-xl font-display font-bold text-[#7C3AED]">
              <NumberTicker value={metrics.lossPreventedByAlertsPct || 41.5} suffix="%" decimalPlaces={1} />
            </div>
          </div>
        </div>
      </section>

      {/* 6-Stage Traceability Pipeline */}
      <section className="space-y-4">
        <ExportPipelineVisualizer />
      </section>

      {/* Anti-Intermediary Simulator */}
      <section className="space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div>
            <h2 className="text-2xl font-display font-black text-[#E5E5E5] uppercase tracking-wide">
              {language === 'en' ? 'DIRECT ROI & SAVINGS SIMULATOR' : 'SIMULADOR DE INGRESOS & AHORRO FOB'}
            </h2>
            <p className="text-xs text-[#9E9E9E] font-mono">
              {language === 'en' ? 'Model farm revenue and export margins.' : 'Cálculo de ingresos netos por hectárea sin intermediarios.'}
            </p>
          </div>
          <Badge variant="live-yellow" pulse>
            {language === 'en' ? 'DIRECT MARGIN' : 'MARGEN DIRECTO'}
          </Badge>
        </div>

        <AntiIntermediaryCalculator />
      </section>

      {/* Standard & Authority Box */}
      <section className="border-2 border-[#7C3AED] bg-[#0E0E0E] p-6 sm:p-10 relative shadow-[6px_6px_0px_0px_#7C3AED]">
        <div className="max-w-3xl space-y-4">
          <div className="inline-flex items-center gap-1.5 text-[#7C3AED] font-mono text-xs font-bold uppercase">
            <Award className="w-4 h-4" />
            {language === 'en' ? 'EXPORT PROTOCOL STANDARD' : 'ESTÁNDAR DE EXPORTACIÓN BARÚ'}
          </div>

          <h2 className="text-3xl sm:text-4xl font-display font-black text-[#E5E5E5] uppercase leading-tight">
            {language === 'en' 
              ? 'VERIFIABLE INTEGRITY FROM SOIL TO PORT' 
              : 'INTEGRIDAD VERIFICABLE DE FINCA A PUERTO'}
          </h2>

          <p className="text-xs sm:text-sm text-[#CCCCCC] font-sans leading-relaxed">
            {language === 'en'
              ? 'AgroBarú certifies each harvest, box, and container using immutable SHA-256 records verified by MIDA. It enables transparent trade agreements and deposits 98.5% of FOB export value directly to the farmer.'
              : 'AgroBarú certifica cada corte, empaque y contenedor mediante registros inmutables SHA-256 auditados por el MIDA. Asegura contratos de compraventa transparentes y transfiere el 98.5% del valor FOB directamente al productor.'}
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-4 border-t border-[#1E293B] font-mono text-xs">
            <div className="flex items-center gap-2 text-[#15803D]">
              <CheckCircle2 className="w-4 h-4" />
              <span>Cero Intermediarios</span>
            </div>
            <div className="flex items-center gap-2 text-[#FACC15]">
              <CheckCircle2 className="w-4 h-4" />
              <span>Custodia Escrow</span>
            </div>
            <div className="flex items-center gap-2 text-[#7C3AED]">
              <CheckCircle2 className="w-4 h-4" />
              <span>Auditoría MIDA</span>
            </div>
          </div>
        </div>
      </section>

      {/* Modals */}
      <ExportPassportModal 
        open={!!selectedBatchForPassport}
        onOpenChange={(open) => !open && setSelectedBatchForPassport(null)}
        batch={selectedBatchForPassport}
      />

      <BoxLabelStickerModal 
        open={!!selectedBatchForSticker}
        onOpenChange={(open) => !open && setSelectedBatchForSticker(null)}
        batch={selectedBatchForSticker}
      />
    </div>
  );
};
