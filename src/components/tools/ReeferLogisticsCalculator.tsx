import React, { useState } from 'react';
import { 
  Truck, 
  Package, 
  Boxes, 
  DollarSign, 
  Thermometer, 
  Ship, 
  Calculator, 
  Info,
  CheckCircle2,
  FileCheck
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/context/LanguageContext';

export const ReeferLogisticsCalculator: React.FC = () => {
  const { language } = useLanguage();
  const [boxesCount, setBoxesCount] = useState<number>(1080);
  const [pricePerBoxUSD, setPricePerBoxUSD] = useState<number>(10.50);
  const [customsFeeUSD, setCustomsFeeUSD] = useState<number>(350);

  // Constants for banana export standards
  const KG_PER_BOX = 18.14; // 40 lbs standard export box
  const BOXES_PER_PALLET = 54;
  const BOXES_PER_REEFER_40FT = 1080; // 20 pallets

  const totalKg = boxesCount * KG_PER_BOX;
  const palletsCount = Math.ceil(boxesCount / BOXES_PER_PALLET);
  const reeferContainers = (boxesCount / BOXES_PER_REEFER_40FT).toFixed(2);
  const totalFruitValueUSD = boxesCount * pricePerBoxUSD;
  const totalFOBValueUSD = totalFruitValueUSD + customsFeeUSD;

  return (
    <div className="bg-[#0E0E0E] border-2 border-[#15803D] p-6 shadow-[6px_6px_0px_0px_#15803D] space-y-6 font-mono">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-[#1E293B] pb-4 gap-3">
        <div>
          <div className="flex items-center gap-2">
            <Badge variant="live-yellow">LOGÍSTICA DE EXPORTACIÓN REEFER</Badge>
            <Badge variant="outline">PUERTO ARMUELLES // FOB</Badge>
          </div>
          <h3 className="text-lg font-display font-black text-[#E5E5E5] uppercase mt-1">
            {language === 'en' ? 'Reefer Container & Box Payload Simulator' : 'Simulador de Embarque Reefer & Cajas de Banano'}
          </h3>
          <p className="text-xs text-[#9E9E9E] font-sans">
            {language === 'en'
              ? 'Calculate 40lb boxes, 54-box pallets, and 40ft High Cube container loads with FOB estimates.'
              : 'Cálculo de cajas estándar de 40 lbs, pallets de 54 cajas y contenedores High Cube con liquidación FOB.'}
          </p>
        </div>

        <div className="flex items-center gap-2 bg-[#141414] border border-[#15803D] px-3 py-1.5 self-start text-xs">
          <Thermometer className="w-4 h-4 text-[#15803D]" />
          <span className="text-[#E5E5E5] font-bold">13.5°C / 56.3°F Cadena de Frío</span>
        </div>
      </div>

      {/* Inputs Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="space-y-1.5">
          <label className="text-[10px] text-[#9E9E9E] uppercase font-bold">
            {language === 'en' ? 'Total Boxes (40 lbs / 18.14 kg)' : 'Cantidad de Cajas (40 lbs / 18.14 kg)'}
          </label>
          <Input 
            type="number"
            value={boxesCount}
            onChange={(e) => setBoxesCount(Math.max(1, parseInt(e.target.value) || 0))}
            min={1}
            className="text-sm font-bold text-[#FACC15]"
          />
          <div className="text-[9px] text-[#666666]">
            1 Contenedor 40ft = 1,080 Cajas (20 Pallets)
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="text-[10px] text-[#9E9E9E] uppercase font-bold">
            {language === 'en' ? 'Pact Price / Box (USD)' : 'Precio Pactado por Caja (USD)'}
          </label>
          <Input 
            type="number"
            step="0.10"
            value={pricePerBoxUSD}
            onChange={(e) => setPricePerBoxUSD(Math.max(0, parseFloat(e.target.value) || 0))}
            min={0}
            className="text-sm font-bold text-[#15803D]"
          />
          <div className="text-[9px] text-[#666666]">
            Precio referencial FOB Barú: $9.50 - $12.00
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="text-[10px] text-[#9E9E9E] uppercase font-bold">
            {language === 'en' ? 'Customs & Port Fees (USD)' : 'Tarifa Portuaria & MIDA (USD)'}
          </label>
          <Input 
            type="number"
            value={customsFeeUSD}
            onChange={(e) => setCustomsFeeUSD(Math.max(0, parseFloat(e.target.value) || 0))}
            min={0}
            className="text-sm font-bold text-[#E5E5E5]"
          />
          <div className="text-[9px] text-[#666666]">
            Fitosanitario MIDA + Estibado en muelle
          </div>
        </div>
      </div>

      {/* Real-time Calculation Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
        <div className="bg-[#141414] border-2 border-[#15803D] p-4 shadow-[3px_3px_0px_0px_#15803D]">
          <div className="text-[10px] text-[#666666] uppercase font-bold">Peso Neto Fruta</div>
          <div className="text-2xl font-display font-black text-[#15803D] mt-1">
            {(totalKg / 1000).toFixed(2)} Ton
          </div>
          <div className="text-[9px] text-[#9E9E9E]">{totalKg.toLocaleString()} Kilogramos</div>
        </div>

        <div className="bg-[#141414] border-2 border-[#FACC15] p-4 shadow-[3px_3px_0px_0px_#FACC15]">
          <div className="text-[10px] text-[#666666] uppercase font-bold">Pallets Requeridos</div>
          <div className="text-2xl font-display font-black text-[#FACC15] mt-1">
            {palletsCount}
          </div>
          <div className="text-[9px] text-[#9E9E9E]">54 cajas por pallet estándar</div>
        </div>

        <div className="bg-[#141414] border-2 border-[#7C3AED] p-4 shadow-[3px_3px_0px_0px_#7C3AED]">
          <div className="text-[10px] text-[#666666] uppercase font-bold">Contenedores Reefer</div>
          <div className="text-2xl font-display font-black text-[#7C3AED] mt-1">
            {reeferContainers}
          </div>
          <div className="text-[9px] text-[#9E9E9E]">Reefer 40ft High Cube</div>
        </div>

        <div className="bg-[#141414] border-2 border-[#15803D] p-4 shadow-[3px_3px_0px_0px_#15803D]">
          <div className="text-[10px] text-[#666666] uppercase font-bold">Valor FOB Total</div>
          <div className="text-2xl font-display font-black text-[#15803D] mt-1">
            ${totalFOBValueUSD.toLocaleString('en-US', { minimumFractionDigits: 2 })}
          </div>
          <div className="text-[9px] text-[#15803D]">En Custodia Escrow 100%</div>
        </div>
      </div>

      {/* Protocol Guarantee Summary */}
      <div className="bg-[#141414] border border-[#1E293B] p-4 space-y-2 text-xs">
        <div className="text-[#E5E5E5] font-bold flex items-center gap-2">
          <FileCheck className="w-4 h-4 text-[#15803D]" />
          <span>Protocolo de Entrega en Muelle de Puerto Armuelles:</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-[11px] text-[#CCCCCC] font-sans">
          <div>• Registro de marchamo inmutable en el pasaporte digital.</div>
          <div>• Monitoreo de pulpa a 13.5°C antes de encajonar.</div>
          <div>• Desembolso Escrow liberado al recibir el BL marítimo.</div>
        </div>
      </div>
    </div>
  );
};
