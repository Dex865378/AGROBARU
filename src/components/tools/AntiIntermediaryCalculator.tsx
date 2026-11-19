import React, { useState } from 'react';
import { 
  Calculator, 
  TrendingUp, 
  DollarSign, 
  ShieldCheck, 
  CheckCircle2, 
  ArrowRight,
  AlertCircle
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useLanguage } from '@/context/LanguageContext';

export const AntiIntermediaryCalculator: React.FC = () => {
  const { language } = useLanguage();
  const [hectares, setHectares] = useState<number>(10);
  const [boxesPerHectareWeek, setBoxesPerHectareWeek] = useState<number>(45); // Average Barú yield: 40-50 boxes/ha/week

  // Pricing constants (Barú banana economics)
  const COYOTE_PRICE_PER_BOX = 4.30; // What abusive middlemen pay in cash ($4.00 - $4.50)
  const AGROBARU_EXPORT_PRICE = 9.75; // Direct export container FOB Puerto Armuelles ($9.50 - $10.50)

  // Calculations
  const weeklyBoxes = hectares * boxesPerHectareWeek;
  const annualBoxes = weeklyBoxes * 52;

  const coyoteWeeklyGross = weeklyBoxes * COYOTE_PRICE_PER_BOX;
  const agrobaruWeeklyGross = weeklyBoxes * AGROBARU_EXPORT_PRICE;

  const weeklyExtraIncome = agrobaruWeeklyGross - coyoteWeeklyGross;
  const annualExtraIncome = annualBoxes * (AGROBARU_EXPORT_PRICE - COYOTE_PRICE_PER_BOX);
  const percentageIncrease = ((AGROBARU_EXPORT_PRICE - COYOTE_PRICE_PER_BOX) / COYOTE_PRICE_PER_BOX) * 100;

  return (
    <Card className="border-2 border-[#15803D] bg-[#0A0A0A] shadow-[4px_4px_0px_0px_#15803D]">
      <CardHeader className="border-b border-[#1E293B] pb-4">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <CardTitle className="flex items-center gap-2 text-lg text-[#E5E5E5] font-display">
            <Calculator className="w-5 h-5 text-[#FACC15]" strokeWidth={1.5} />
            {language === 'en' ? 'Anti-Middleman Savings Calculator' : 'Calculadora de Ahorro Anti-Intermediarios'}
          </CardTitle>
          <Badge variant="yellow">
            +{percentageIncrease.toFixed(0)}% {language === 'en' ? 'DIRECT PROFIT' : 'GANANCIA DIRECTA'}
          </Badge>
        </div>
        <p className="text-xs text-[#9E9E9E] font-mono">
          {language === 'en' 
            ? 'Compare your net profit by selling directly via AgroBarú Escrow vs traditional field middlemen in Barú.'
            : 'Compara tu ingreso real vendiendo directo con custodia Escrow vs. el precio impuesto por intermediarios en Barú.'}
        </p>
      </CardHeader>

      <CardContent className="pt-6 space-y-6 font-mono text-xs">
        {/* Sliders Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-[#0E0E0E] p-4 border border-[#1E293B]">
          {/* Hectares Slider */}
          <div>
            <div className="flex flex-wrap justify-between items-center gap-2 mb-2">
              <label className="text-[11px] uppercase text-[#CCCCCC] font-bold">
                {language === 'en' ? 'Cultivated Hectares (Barú):' : 'Hectáreas Sembradas (Barú):'}
              </label>
              <span className="text-[#15803D] font-display text-lg font-black">{hectares} ha</span>
            </div>
            <input 
              type="range" 
              min="1" 
              max="150" 
              value={hectares} 
              onChange={(e) => setHectares(Number(e.target.value))}
              className="w-full accent-[#15803D] cursor-pointer"
            />
            <div className="flex justify-between text-[9px] text-[#666666] mt-1">
              <span>1 ha (Pequeño)</span>
              <span>50 ha (Mediano)</span>
              <span>150+ ha (Cooperativa)</span>
            </div>
          </div>

          {/* Boxes per Hectare Slider */}
          <div>
            <div className="flex flex-wrap justify-between items-center gap-2 mb-2">
              <label className="text-[11px] uppercase text-[#CCCCCC] font-bold">
                {language === 'en' ? 'Weekly Yield (Boxes / ha):' : 'Rendimiento Semanal (Cajas / ha):'}
              </label>
              <span className="text-[#FACC15] font-display text-lg font-black">{boxesPerHectareWeek} cjs</span>
            </div>
            <input 
              type="range" 
              min="20" 
              max="70" 
              value={boxesPerHectareWeek} 
              onChange={(e) => setBoxesPerHectareWeek(Number(e.target.value))}
              className="w-full accent-[#FACC15] cursor-pointer"
            />
            <div className="flex justify-between text-[9px] text-[#666666] mt-1">
              <span>20 cjs (Bajo)</span>
              <span>45 cjs (Promedio Barú)</span>
              <span>70 cjs (Alta Tecnología)</span>
            </div>
          </div>
        </div>

        {/* Comparison Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Traditional Intermediary Card */}
          <div className="bg-[#141414] border-2 border-[#F97316] p-4 relative min-w-0">
            <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
              <span className="text-[10px] uppercase font-bold text-[#F97316]">
                {language === 'en' ? 'Traditional Middleman / Coyote' : 'Intermediario Tradicional / Coyote'}
              </span>
              <span className="text-xs text-[#F97316] font-bold shrink-0">${COYOTE_PRICE_PER_BOX.toFixed(2)} / caja</span>
            </div>
            <div className="text-2xl font-display font-black text-[#CCCCCC]">
              ${coyoteWeeklyGross.toLocaleString('en-US', { maximumFractionDigits: 0 })} <span className="text-xs text-[#666666] font-normal">/ semana</span>
            </div>
            <div className="text-[11px] text-[#9E9E9E] mt-1">
              ${(coyoteWeeklyGross * 52).toLocaleString('en-US', { maximumFractionDigits: 0 })} al año
            </div>
            <div className="text-[10px] text-[#F97316] mt-3 flex items-center gap-1">
              <AlertCircle className="w-3 h-3 shrink-0" /> Pago tardío, cheques sin fondo y castigo arbitrario por calibre.
            </div>
          </div>

          {/* AgroBaru Direct Protocol Card */}
          <div className="bg-[#0D1F12] border-2 border-[#15803D] p-4 relative shadow-[3px_3px_0px_0px_#15803D] min-w-0">
            <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
              <span className="text-[10px] uppercase font-bold text-[#15803D]">
                {language === 'en' ? 'AgroBarú Direct Escrow Protocol' : 'Protocolo Directo AgroBarú Escrow'}
              </span>
              <span className="text-xs text-[#15803D] font-bold shrink-0">${AGROBARU_EXPORT_PRICE.toFixed(2)} / caja</span>
            </div>
            <div className="text-2xl font-display font-black text-[#15803D]">
              ${agrobaruWeeklyGross.toLocaleString('en-US', { maximumFractionDigits: 0 })} <span className="text-xs text-[#15803D] font-normal">/ semana</span>
            </div>
            <div className="text-[11px] text-[#CCCCCC] mt-1">
              ${(agrobaruWeeklyGross * 52).toLocaleString('en-US', { maximumFractionDigits: 0 })} al año
            </div>
            <div className="text-[10px] text-[#15803D] mt-3 flex items-center gap-1 font-bold">
              <CheckCircle2 className="w-3.5 h-3.5" /> Pago retenido en Escrow y liberado instantáneo a Yappy/ACH.
            </div>
          </div>
        </div>

        {/* Big ROI Callout */}
        <div className="bg-[#141414] border-2 border-[#FACC15] p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>
            <div className="text-[10px] uppercase text-[#FACC15] font-bold tracking-wider">
              {language === 'en' ? 'TOTAL EXTRA MONEY IN YOUR POCKET:' : 'DINERO EXTRA DIRECTO EN TU BOLSILLO:'}
            </div>
            <div className="text-2xl sm:text-3xl font-display font-black text-[#E5E5E5]">
              +${annualExtraIncome.toLocaleString('en-US', { maximumFractionDigits: 0 })} USD <span className="text-xs text-[#9E9E9E] font-normal">/ año</span>
            </div>
            <div className="text-[10px] text-[#9E9E9E] mt-0.5">
              Equivale a +${weeklyExtraIncome.toLocaleString('en-US', { maximumFractionDigits: 0 })} USD adicionales cada semana.
            </div>
          </div>

          <Button variant="default" className="flex items-center gap-2">
            <span>{language === 'en' ? 'Publish Batch in Escrow' : 'Publicar Lote en Escrow'}</span>
            <ArrowRight className="w-4 h-4 shrink-0" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
