import React from 'react';
import { 
  Printer, 
  Tag, 
  CheckCircle2, 
  MapPin, 
  Calendar,
  Layers,
  Award
} from 'lucide-react';
import { Dialog, DialogHeader, DialogTitle, DialogDescription, DialogCloseButton } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ProductBatch } from '@/types';
import { useLanguage } from '@/context/LanguageContext';
import { QRCodeSVG } from 'qrcode.react';
import { getBatchTraceUrl } from '@/lib/qrUtils';
import { formatDateOnly } from '@/lib/utils';

interface BoxLabelStickerModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  batch: ProductBatch | null;
}

export const BoxLabelStickerModal: React.FC<BoxLabelStickerModalProps> = ({
  open,
  onOpenChange,
  batch
}) => {
  const { language } = useLanguage();

  if (!batch) return null;

  const qrUrl = getBatchTraceUrl(batch.batchCode);

  const handlePrint = () => {
    window.print();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogCloseButton onClose={() => onOpenChange(false)} />
      <DialogHeader>
        <DialogTitle className="flex items-center gap-2">
          <Tag className="w-5 h-5 text-[#FACC15]" strokeWidth={1.5} />
          {language === 'en' ? 'Export Box Thermal Sticker Label (4"x6")' : 'Etiqueta Adhesiva Térmica para Cajas (4"x6")'}
        </DialogTitle>
        <DialogDescription>
          {language === 'en' 
            ? 'Format ready for Zebra/thermal label printers. Attach to each export banana carton in the packing facility.'
            : 'Formato listo para impresoras térmicas (Zebra). Se pega en cada caja de exportación en la empacadora de Barú.'}
        </DialogDescription>
      </DialogHeader>

      <div className="space-y-4 pt-2 font-mono text-xs max-h-[75vh] overflow-y-auto pr-1">
        {/* Printable 4x6 Thermal Label Canvas */}
        <div id="thermal-label" className="bg-white text-black border-4 border-black p-4 w-full max-w-sm mx-auto shadow-[4px_4px_0px_0px_#15803D]">
          {/* Label Header */}
          <div className="border-b-4 border-black pb-2 flex items-center justify-between">
            <div>
              <div className="font-display font-black text-xl tracking-normal leading-snug">
                AGROBARÚ
              </div>
              <div className="text-[8px] font-bold tracking-widest uppercase">
                EXPORT PROTOCOL • PANAMA
              </div>
            </div>
            <div className="text-right">
              <div className="bg-black text-white px-2 py-0.5 font-bold text-[10px]">
                {batch.qualityGrade.toUpperCase()}
              </div>
              <div className="text-[8px] font-bold mt-0.5">NET WT: 18.14 KG (40 LBS)</div>
            </div>
          </div>

          {/* Fruit Details */}
          <div className="my-3 space-y-1">
            <div className="text-lg font-black uppercase leading-snug font-display">
              {batch.cropName} // {batch.variety}
            </div>
            <div className="text-[10px] font-bold flex items-center gap-1">
              <span>ORIGEN:</span>
              <span className="bg-black text-white px-1">{batch.corregimiento.toUpperCase()}, BARÚ, CHIRIQUÍ</span>
            </div>
            <div className="text-[9px]">
              <span className="font-bold">FINCA:</span> {batch.farmName} | <span className="font-bold">PROD:</span> {batch.producerName}
            </div>
            <div className="text-[9px]">
              <span className="font-bold">FECHA CORTE:</span> {formatDateOnly(batch.harvestDate)} | <span className="font-bold">CALIBRE:</span> 39-46
            </div>
          </div>

          {/* QR & Barcode Section */}
          <div className="border-t-2 border-b-2 border-black py-2 my-2 flex items-center justify-between gap-3">
            <div className="w-24 h-24 border-2 border-black p-1 flex items-center justify-center bg-white">
              <QRCodeSVG
                value={qrUrl}
                size={88}
                level="M"
                includeMargin={true}
                fgColor="#000000"
                bgColor="#FFFFFF"
              />
            </div>

            <div className="flex-1 text-center">
              <div className="font-black text-xs tracking-wider font-mono bg-black text-white py-1 mb-1">
                {batch.batchCode}
              </div>
              {/* CSS Barcode Simulation */}
              <div className="h-8 flex items-center justify-center gap-0.5 bg-black/5 p-1">
                {[2, 1, 3, 1, 2, 4, 1, 2, 1, 3, 2, 1, 4, 1, 2, 3, 1, 2, 4, 1, 3, 2, 1, 2].map((w, i) => (
                  <div key={i} className="bg-black h-full" style={{ width: `${w * 1.5}px` }} />
                ))}
              </div>
              <div className="text-[8px] tracking-widest mt-0.5">*(01)07458921{batch.batchCode}*</div>
            </div>
          </div>

          {/* Label Footer */}
          <div className="flex items-center justify-between text-[8px] font-bold">
            <div>MIDA BPA CERT: #507-BARU-2026</div>
            <div>VERIFIED ON SHA-256 BLOCKCHAIN</div>
          </div>
        </div>

        {/* Modal Controls */}
        <div className="flex justify-end gap-2 pt-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cerrar
          </Button>
          <Button variant="yellow" onClick={handlePrint} className="flex items-center gap-2">
            <Printer className="w-4 h-4" />
            <span>Imprimir Etiqueta Térmica</span>
          </Button>
        </div>
      </div>
    </Dialog>
  );
};
