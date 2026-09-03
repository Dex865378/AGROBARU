import React, { useState } from 'react';
import { 
  Sprout, 
  ShieldCheck, 
  Package, 
  Lock, 
  Truck, 
  CheckCircle2, 
  FileText, 
  QrCode, 
  ArrowRight,
  ChevronRight,
  Info
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { useLanguage } from '@/context/LanguageContext';

interface PipelineStep {
  id: string;
  stepNumber: number;
  titleEs: string;
  titleEn: string;
  locationEs: string;
  locationEn: string;
  statusEs: string;
  statusEn: string;
  badgeVariant: 'live-green' | 'live-yellow' | 'live-purple' | 'phyto-certified';
  icon: any;
  descriptionEs: string;
  descriptionEn: string;
  securityProofEs: string;
  securityProofEn: string;
  sampleHash: string;
}

const stepsData: PipelineStep[] = [
  {
    id: 'step-1',
    stepNumber: 1,
    titleEs: 'Cosecha & Calibración en Finca',
    titleEn: 'Farm Harvest & Fruit Calibration',
    locationEs: 'Progreso / Baco, Barú (GPS ±4m)',
    locationEn: 'Progreso / Baco, Barú (GPS ±4m)',
    statusEs: 'Completado en Campo',
    statusEn: 'Completed On-Field',
    badgeVariant: 'live-green',
    icon: Sprout,
    descriptionEs: 'Corte de racimos a 11-12 semanas de floración con calibrador 39-44 (1.25" a 1.37") y control de edad por cintas de color.',
    descriptionEn: 'Bunch harvest at 11-12 weeks post-bloom with 39-44 caliper and ribbon age tracking.',
    securityProofEs: 'Firma biométrica y coordenada satelital registrada en PWA sin conexión.',
    securityProofEn: 'Biometric signature and satellite coordinates registered in offline PWA.',
    sampleHash: '0x8f4b...912a',
  },
  {
    id: 'step-2',
    stepNumber: 2,
    titleEs: 'Inspección Fitosanitaria MIDA',
    titleEn: 'MIDA Phytosanitary Inspection',
    locationEs: 'Puesto de Control Barú',
    locationEn: 'Barú Agricultural Checkpoint',
    statusEs: 'Certificado BPA Válido',
    statusEn: 'GAP Certificate Valid',
    badgeVariant: 'phyto-certified',
    icon: ShieldCheck,
    descriptionEs: 'Toma de muestras fitosanitarias. Certificación de fruta libre de cochinilla, trips y trazas de Sigatoka Negra.',
    descriptionEn: 'Phytosanitary sampling. Certified free of mealybugs, thrips, and Black Sigatoka lesions.',
    securityProofEs: 'Acta fitosanitaria MIDA digital con folio único y sello criptográfico.',
    securityProofEn: 'Digital MIDA inspection certificate with unique ledger serial.',
    sampleHash: '0x3c2e...77e1',
  },
  {
    id: 'step-3',
    stepNumber: 3,
    titleEs: 'Lavado, Desmane & Etiquetado QR',
    titleEn: 'Washing, De-handing & QR Labeling',
    locationEs: 'Empacadora Central Barú',
    locationEn: 'Barú Central Packing House',
    statusEs: '1,080 Cajas Selladas',
    statusEn: '1,080 Sealed Boxes',
    badgeVariant: 'live-yellow',
    icon: Package,
    descriptionEs: 'Desmane en agua con sulfato de aluminio para cicatrización de corona, secado y pegado de sticker térmico 4"x6" con QR inmutable.',
    descriptionEn: 'De-handing bath with alum for crown sealing, drying, and 4"x6" thermal QR sticker placement.',
    securityProofEs: 'Cada caja lleva un código único vinculado a la raíz de Merkle del lote.',
    securityProofEn: 'Every box bears a unique serial bound to the batch Merkle root.',
    sampleHash: '0x71a9...5b3d',
  },
  {
    id: 'step-4',
    stepNumber: 4,
    titleEs: 'Contrato Escrow Criptográfico',
    titleEn: 'Cryptographic Escrow Contract',
    locationEs: 'Nodo Barú // Custodia',
    locationEn: 'Barú Node // Custody Lock',
    statusEs: 'Fondos en Custodia',
    statusEn: 'Funds in Escrow',
    badgeVariant: 'live-purple',
    icon: Lock,
    descriptionEs: 'El comprador deposita el 100% del valor pactado vía ACH / Yappy. Los fondos quedan asegurados y nadie puede retirarlos hasta la entrega.',
    descriptionEn: 'Buyer deposits 100% of order value via ACH / Yappy. Funds are locked and protected until delivery.',
    securityProofEs: 'Contrato condicional indexado a la clave pública del exportador y productor.',
    securityProofEn: 'Conditional smart agreement indexed to exporter & producer public keys.',
    sampleHash: '0x992b...d44f',
  },
  {
    id: 'step-5',
    stepNumber: 5,
    titleEs: 'Despacho en Contenedor Refrigerado',
    titleEn: 'Reefer Container Dispatch',
    locationEs: 'Ruta Barú ➔ Puerto Armuelles',
    locationEn: 'Barú Route ➔ Port Terminal',
    statusEs: 'Cadena de Frío a 13.5°C',
    statusEn: 'Cold Chain at 13.5°C',
    badgeVariant: 'live-green',
    icon: Truck,
    descriptionEs: 'Carga en contenedor Reefer 40ft High Cube a temperatura constante de 13.5°C (56.3°F) con telemetría de humedad al 85%.',
    descriptionEn: 'Loaded in 40ft High Cube Reefer at continuous 13.5°C (56.3°F) and 85% humidity.',
    securityProofEs: 'Marchamo aduanero electrónico registrado en el pasaporte de exportación.',
    securityProofEn: 'Electronic customs seal hash logged into digital export passport.',
    sampleHash: '0x44d1...88c2',
  },
  {
    id: 'step-6',
    stepNumber: 6,
    titleEs: 'Liberación Inmediata de Pago al Productor',
    titleEn: 'Instant Producer Payout Release',
    locationEs: 'Puerto Destino / Liquidación',
    locationEn: 'Destination Port / Settlement',
    statusEs: 'Liquidación 100% Exitosa',
    statusEn: '100% Settled Payout',
    badgeVariant: 'live-green',
    icon: CheckCircle2,
    descriptionEs: 'El comprador o inspector escanea el QR en puerto; al validar el estado de la fruta, los fondos se transfieren automáticamente al productor sin comisiones abusivas.',
    descriptionEn: 'Buyer or inspector scans port QR; upon condition clearance, escrow releases funds directly to the farmer.',
    securityProofEs: 'Recibo inmutable con hash final de transacción bancaria directa.',
    securityProofEn: 'Immutable receipt with direct bank clearing hash.',
    sampleHash: '0x15e7...339a',
  },
];

export const ExportPipelineVisualizer: React.FC = () => {
  const { language } = useLanguage();
  const [activeStepIndex, setActiveStepIndex] = useState<number>(0);

  const activeStep = stepsData[activeStepIndex];

  return (
    <div className="bg-[#0E0E0E] border-2 border-[#15803D] p-6 shadow-[6px_6px_0px_0px_#15803D] space-y-6 font-mono">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-[#1E293B] pb-4 gap-3">
        <div>
          <div className="flex items-center gap-2">
            <Badge variant="live-green">PROTOCOLO DE EXPORTACIÓN DIRECTA</Badge>
            <Badge variant="outline">MIDA & ACH BARÚ</Badge>
          </div>
          <h3 className="text-lg font-display font-black text-[#E5E5E5] uppercase mt-1">
            {language === 'en' ? '6-Stage Cryptographic Traceability Pipeline' : 'Cadena de Trazabilidad Criptográfica en 6 Etapas'}
          </h3>
          <p className="text-xs text-[#9E9E9E] font-sans">
            {language === 'en' 
              ? 'From local harvest in Chiriquí to international container port clearance.' 
              : 'Desde la cosecha en fincas de Chiriquí hasta el desembarque y fondeo en puerto.'}
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs bg-[#141414] border border-[#15803D]/50 px-3 py-1.5 self-start">
          <Info className="w-4 h-4 text-[#FACC15]" />
          <span className="text-[#E5E5E5] font-bold">
            {language === 'en' ? 'Click any stage to audit' : 'Haz clic en una etapa para auditar'}
          </span>
        </div>
      </div>

      {/* Stepper Navigation */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
        {stepsData.map((step, idx) => {
          const Icon = step.icon;
          const isSelected = activeStepIndex === idx;

          return (
            <button
              key={step.id}
              onClick={() => setActiveStepIndex(idx)}
              className={`p-3 text-left border transition-all flex flex-col justify-between space-y-2 ${
                isSelected
                  ? 'bg-[#15803D]/15 border-[#15803D] shadow-[3px_3px_0px_0px_#15803D]'
                  : 'bg-[#141414] border-[#1E293B] hover:border-[#15803D]/60'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className={`text-[10px] font-black px-1.5 py-0.5 border ${
                  isSelected ? 'bg-[#15803D] text-black border-[#15803D]' : 'bg-[#1A1A1A] text-[#9E9E9E] border-[#262626]'
                }`}>
                  0{step.stepNumber}
                </span>
                <Icon className={`w-4 h-4 ${isSelected ? 'text-[#FACC15]' : 'text-[#666666]'}`} />
              </div>

              <div className="text-[11px] font-bold uppercase text-[#E5E5E5] leading-tight line-clamp-2">
                {language === 'en' ? step.titleEn : step.titleEs}
              </div>

              <div className="text-[9px] text-[#15803D] truncate font-bold">
                {language === 'en' ? step.statusEn : step.statusEs}
              </div>
            </button>
          );
        })}
      </div>

      {/* Detail Showcase of Active Stage */}
      <div className="bg-[#141414] border border-[#15803D] p-5 relative overflow-hidden space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-[#1E293B] pb-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-[#15803D] flex items-center justify-center font-display font-black text-black text-lg">
              0{activeStep.stepNumber}
            </div>
            <div>
              <h4 className="text-base font-display font-black text-[#E5E5E5] uppercase">
                {language === 'en' ? activeStep.titleEn : activeStep.titleEs}
              </h4>
              <div className="text-xs text-[#9E9E9E]">
                📍 {language === 'en' ? activeStep.locationEn : activeStep.locationEs}
              </div>
            </div>
          </div>

          <Badge variant={activeStep.badgeVariant} pulse>
            {language === 'en' ? activeStep.statusEn : activeStep.statusEs}
          </Badge>
        </div>

        <p className="text-xs text-[#E5E5E5] font-sans leading-relaxed">
          {language === 'en' ? activeStep.descriptionEn : activeStep.descriptionEs}
        </p>

        {/* Security / Cryptographic Proof Box */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
          <div className="bg-[#0A0A0A] border border-[#1E293B] p-3 space-y-1">
            <div className="text-[10px] text-[#FACC15] font-bold flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5" />
              {language === 'en' ? 'Cryptographic Guarantee' : 'Garantía Criptográfica'}
            </div>
            <div className="text-[11px] text-[#CCCCCC] font-sans">
              {language === 'en' ? activeStep.securityProofEn : activeStep.securityProofEs}
            </div>
          </div>

          <div className="bg-[#0A0A0A] border border-[#1E293B] p-3 space-y-1 font-mono">
            <div className="text-[10px] text-[#7C3AED] font-bold flex items-center gap-1.5">
              <QrCode className="w-3.5 h-3.5" />
              {language === 'en' ? 'Immutable Proof Hash' : 'Hash de Prueba Inmutable'}
            </div>
            <div className="text-xs text-[#15803D] font-bold">
              {activeStep.sampleHash}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
