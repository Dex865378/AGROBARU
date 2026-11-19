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
import { TrustBadgesSection } from '@/components/legal/TrustBadgesSection';
import { LegalTabType } from '@/components/legal/LegalComplianceModal';

interface HomePageProps {
  onNavigate: (tab: string) => void;
  onOpenLegalModal?: (tab?: LegalTabType) => void;
  onOpenGoogleProfile?: () => void;
}

export const HomePage: React.FC<HomePageProps> = ({ 
  onNavigate,
  onOpenLegalModal,
  onOpenGoogleProfile
}) => {
  const { metrics, batches } = useAppState();
  const { language, t } = useLanguage();

  const [selectedBatchForPassport, setSelectedBatchForPassport] = useState<any>(null);
  const [selectedBatchForSticker, setSelectedBatchForSticker] = useState<any>(null);

  const sampleBatch = batches[0] || null;

  return (
    <div className="space-y-10 sm:space-y-14 py-4 sm:py-8 relative font-mono">
      {/* Hero Section */}
      <section className="relative overflow-hidden rounded-2xl border border-[#1E2E26] bg-[#111714] p-5 sm:p-8 md:p-12 shadow-xl">
        <Spotlight className="-top-40 left-0 md:left-60 md:-top-20" fill="#10B981" />
        <BorderBeam size={320} duration={14} delay={0} colorFrom="#10B981" colorTo="#7C3AED" />

        <div className="relative z-10 max-w-4xl space-y-5 sm:space-y-6">
          {/* Status Badges */}
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="live-green" pulse>
              {language === 'en' ? 'DIRECT AGRICULTURAL TRADE // BARÚ' : 'COMERCIO AGRÍCOLA DIRECTO // BARÚ'}
            </Badge>
            <Badge variant="live-purple" pulse>
              {language === 'en' ? 'MIDA & GAP CERTIFIED' : 'CERTIFICADO MIDA & BPA'}
            </Badge>
          </div>

          {/* Headline */}
          <h1 className="font-display font-bold text-2xl sm:text-5xl md:text-6xl text-[#ECFDF5] tracking-normal leading-[1.2] sm:leading-[1.15] break-words">
            {language === 'en' ? (
              <>Barú harvests, <span className="text-[#10B981]">straight from the producer</span> with protected payments</>
            ) : (
              <>Cosechas de Barú, <span className="text-[#10B981]">directas del productor</span> y con pagos protegidos</>
            )}
          </h1>

          <p className="text-sm sm:text-base text-[#CCCCCC] font-sans leading-relaxed max-w-2xl">
            {language === 'en'
              ? 'Direct connection between Barú growers and buyers. Zero middleman fees, protected Escrow payments, and verifiable harvest traceability.'
              : 'Conexión directa entre productores de Barú y compradores comerciales. Sin intermediarios, pagos protegidos en cuenta Escrow y trazabilidad verificada en cada lote.'}
          </p>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center gap-3 pt-2">
            <Button
              variant="default"
              size="lg"
              onClick={() => onNavigate('marketplace')}
              className="flex items-center gap-2 text-xs sm:text-sm font-bold"
            >
              <Sprout className="w-4 h-4" />
              <span>{language === 'en' ? 'EXPLORE HARVESTS' : 'EXPLORAR COSECHAS'}</span>
              <ArrowRight className="w-4 h-4" />
            </Button>

            <Button
              variant="outline"
              size="lg"
              onClick={() => onNavigate('farmer')}
              className="flex items-center gap-2 text-xs sm:text-sm"
            >
              <Lock className="w-4 h-4 text-[#10B981]" />
              <span>{language === 'en' ? 'PUBLISH HARVEST' : 'PUBLICAR MI COSECHA'}</span>
            </Button>
          </div>

          {/* Quick Tools Launchers */}
          <div className="pt-4 border-t border-[#1E2E26] flex flex-wrap items-center gap-3 text-xs">
            <button
              onClick={() => sampleBatch && setSelectedBatchForPassport(sampleBatch)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#090D0B] hover:bg-[#161E19] border border-[#7C3AED]/50 text-[#E5E5E5] font-semibold transition-all"
            >
              <FileCheck className="w-3.5 h-3.5 text-[#A78BFA]" />
              <span>{language === 'en' ? 'Export Certificate PDF' : 'Certificado PDF'}</span>
            </button>

            <button
              onClick={() => sampleBatch && setSelectedBatchForSticker(sampleBatch)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#090D0B] hover:bg-[#161E19] border border-[#FACC15]/50 text-[#E5E5E5] font-semibold transition-all"
            >
              <Tag className="w-3.5 h-3.5 text-[#FACC15]" />
              <span>{language === 'en' ? 'Box QR Labels' : 'Etiquetas QR'}</span>
            </button>

            <button
              onClick={() => onNavigate('calculator')}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#090D0B] hover:bg-[#161E19] border border-[#10B981]/50 text-[#E5E5E5] font-semibold transition-all"
            >
              <Calculator className="w-3.5 h-3.5 text-[#10B981]" />
              <span>{language === 'en' ? 'Earnings Calculator' : 'Calculadora de Márgenes'}</span>
            </button>
          </div>
        </div>

        {/* Live Metrics Footer */}
        <div className="mt-8 border-t border-[#1E2E26] pt-5 grid grid-cols-2 md:grid-cols-4 gap-4 font-mono">
          <div className="min-w-0">
            <div className="text-[10px] text-[#666666] uppercase">{language === 'en' ? 'Volume in Escrow' : 'Volumen en Custodia'}</div>
            <div className="text-lg sm:text-xl font-display font-bold text-[#E5E5E5] break-words">
              $<NumberTicker value={metrics.totalEscrowVolumeUsd || 28750} decimalPlaces={2} />
            </div>
          </div>
          <div className="min-w-0">
            <div className="text-[10px] text-[#666666] uppercase">{language === 'en' ? 'Middleman Savings' : 'Ahorro Intermediación'}</div>
            <div className="text-lg sm:text-xl font-display font-bold text-[#15803D] break-words">
              $<NumberTicker value={metrics.intermediaryFeeEliminatedUsd || 9150} decimalPlaces={2} />
            </div>
          </div>
          <div className="min-w-0">
            <div className="text-[10px] text-[#666666] uppercase">{language === 'en' ? 'Monitored Area' : 'Superficie Monitoreada'}</div>
            <div className="text-lg sm:text-xl font-display font-bold text-[#E5E5E5] break-words">
              <NumberTicker value={metrics.totalHectares || 87.7} suffix={language === 'en' ? ' ha' : ' ha'} decimalPlaces={1} />
            </div>
          </div>
          <div className="min-w-0">
            <div className="text-[10px] text-[#666666] uppercase">{language === 'en' ? 'Losses Prevented' : 'Pérdidas Evitadas'}</div>
            <div className="text-lg sm:text-xl font-display font-bold text-[#7C3AED] break-words">
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
              {language === 'en' ? 'DIRECT ROI & SAVINGS SIMULATOR' : 'SIMULADOR DE INGRESOS Y AHORRO'}
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
      <section className="rounded-2xl border border-[#1E2E26] bg-[#111714] p-6 sm:p-10 relative shadow-md">
        <div className="max-w-3xl space-y-4">
          <div className="inline-flex items-center gap-1.5 text-[#A78BFA] font-mono text-xs font-bold uppercase">
            <Award className="w-4 h-4" />
            {language === 'en' ? 'BARÚ EXPORT STANDARD' : 'ESTÁNDAR COMERCIAL BARÚ'}
          </div>

          <h2 className="text-2xl sm:text-3xl font-display font-bold text-[#ECFDF5] leading-snug">
            {language === 'en' 
              ? 'Verifiable Quality from Soil to Port' 
              : 'Calidad Verificable de la Finca al Destino'}
          </h2>

          <p className="text-xs sm:text-sm text-[#CCCCCC] font-sans leading-relaxed">
            {language === 'en'
              ? 'AgroBarú certifies each harvest, box, and shipment under MIDA inspection standards, enabling transparent B2B agreements and delivering 98.5% of order value directly to the producer.'
              : 'AgroBarú respalda cada corte, empaque y envío con registros digitales verificados ante el MIDA. Protege cada operación de compraventa y liquida directamente al productor sin comisiones de intermediación.'}
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-4 border-t border-[#1E2E26] font-mono text-xs">
            <div className="flex items-center gap-2 text-[#10B981]">
              <CheckCircle2 className="w-4 h-4" />
              <span>Trato Directo sin Intermediarios</span>
            </div>
            <div className="flex items-center gap-2 text-[#FACC15]">
              <CheckCircle2 className="w-4 h-4" />
              <span>Pagos en Custodia Escrow</span>
            </div>
            <div className="flex items-center gap-2 text-[#A78BFA]">
              <CheckCircle2 className="w-4 h-4" />
              <span>Respaldo Fitosanitario MIDA</span>
            </div>
          </div>
        </div>
      </section>

      {/* Trust, Legal & Payment Badges Section */}
      <section>
        <TrustBadgesSection 
          onOpenLegalModal={onOpenLegalModal}
          onOpenGoogleProfile={onOpenGoogleProfile}
        />
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
