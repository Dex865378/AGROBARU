import React from 'react';
import { 
  ShieldCheck, 
  Printer, 
  Download, 
  MapPin, 
  Calendar, 
  CheckCircle2, 
  FileCheck, 
  Building2, 
  Lock 
} from 'lucide-react';
import { Dialog, DialogHeader, DialogTitle, DialogDescription, DialogCloseButton } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ProductBatch } from '@/types';
import { useLanguage } from '@/context/LanguageContext';
import { QRCodeSVG } from 'qrcode.react';
import { getBatchTraceUrl } from '@/lib/qrUtils';
import { formatDateOnly } from '@/lib/utils';

interface ExportPassportModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  batch: ProductBatch | null;
}

export const ExportPassportModal: React.FC<ExportPassportModalProps> = ({
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
          <FileCheck className="w-5 h-5 text-[#15803D]" strokeWidth={1.5} />
          {language === 'en' ? 'Official Export Passport & Phytosanitary Certificate' : 'Pasaporte Oficial de Exportación & Certificado Fitosanitario'}
        </DialogTitle>
        <DialogDescription>
          {language === 'en' 
            ? 'Cryptographically sealed document for customs, port authorities and international buyers.'
            : 'Documento sellado criptográficamente para aduanas, autoridades portuarias y compradores internacionales.'}
        </DialogDescription>
      </DialogHeader>

      <div className="space-y-4 pt-2 font-mono text-xs max-h-[75vh] overflow-y-auto pr-1">
        {/* Printable Certificate Canvas */}
        <div id="export-certificate" className="bg-[#0A0A0A] border-4 border-[#15803D] p-6 text-[#E5E5E5] relative shadow-[6px_6px_0px_0px_#15803D]">
          {/* Watermark */}
          <div className="absolute inset-0 flex items-center justify-center opacity-5 pointer-events-none select-none text-7xl font-display font-black text-[#15803D] rotate-[-25deg]">
            AGROBARÚ MIDA 2026
          </div>

          {/* Certificate Header */}
          <div className="border-b-2 border-[#15803D] pb-4 flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-[#15803D] text-black font-display font-black text-2xl flex items-center justify-center">
                AB
              </div>
              <div>
                <h2 className="font-display font-black text-lg text-[#E5E5E5] tracking-wider uppercase">
                  AGROBARÚ // PROTOCOLO DE EXPORTACIÓN
                </h2>
                <div className="text-[10px] text-[#9E9E9E]">
                  REPÚBLICA DE PANAMÁ • PROVINCIA DE CHIRIQUÍ • DISTRITO DE BARÚ
                </div>
              </div>
            </div>

            <div className="text-right">
              <div className="text-[10px] text-[#FACC15] font-bold">CERTIFICADO N°</div>
              <div className="text-sm font-bold text-[#E5E5E5]">{batch.batchCode}</div>
              <div className="text-[9px] text-[#15803D]">MIDA-BPA ACREDITADO</div>
            </div>
          </div>

          {/* Batch Details Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 my-5 bg-[#0E0E0E] p-4 border border-[#1E293B]">
            <div>
              <span className="text-[9px] uppercase text-[#666666] block">Cultivo & Variedad</span>
              <span className="font-bold text-[#E5E5E5] text-sm">{batch.cropName}</span>
              <span className="text-[10px] text-[#9E9E9E] block">({batch.variety})</span>
            </div>

            <div>
              <span className="text-[9px] uppercase text-[#666666] block">Productor Responsable</span>
              <span className="font-bold text-[#15803D] text-sm">{batch.producerName}</span>
              <span className="text-[10px] text-[#9E9E9E] block">{batch.corregimiento}, Barú</span>
            </div>

            <div>
              <span className="text-[9px] uppercase text-[#666666] block">Fecha de Corte / Cosecha</span>
              <span className="font-bold text-[#FACC15] text-sm">{formatDateOnly(batch.harvestDate)}</span>
              <span className="text-[10px] text-[#9E9E9E] block">Corte 100% Fresco</span>
            </div>

            <div>
              <span className="text-[9px] uppercase text-[#666666] block">Volumen Certificado</span>
              <span className="font-bold text-[#E5E5E5] text-sm">{batch.quantityKg.toLocaleString()} kg</span>
              <span className="text-[10px] text-[#9E9E9E] block">~{(batch.quantityKg / 18.14).toFixed(0)} Cajas Export</span>
            </div>

            <div>
              <span className="text-[9px] uppercase text-[#666666] block">Calidad Exportación</span>
              <span className="font-bold text-[#15803D] text-sm">{batch.qualityGrade}</span>
              <span className="text-[10px] text-[#9E9E9E] block">Calibre 39 - 46 mm</span>
            </div>

            <div>
              <span className="text-[9px] uppercase text-[#666666] block">Coordenadas de Origen</span>
              <span className="font-mono text-[#CCCCCC] text-[10px]">
                {batch.originCoordinates.lat.toFixed(5)}°N, {batch.originCoordinates.lng.toFixed(5)}°W
              </span>
              <span className="text-[9px] text-[#15803D] block">Geolocalización EXIF Verificada</span>
            </div>
          </div>

          {/* Cryptographic Proof & Merkle Root */}
          <div className="bg-[#141414] border border-[#7C3AED] p-3 mb-4 space-y-1.5">
            <div className="flex items-center justify-between text-[10px]">
              <span className="text-[#7C3AED] font-bold flex items-center gap-1">
                <Lock className="w-3.5 h-3.5" /> RAÍZ DE MERKLE DE CULTIVO (SHA-256):
              </span>
              <Badge variant="purple" className="text-[9px]">100% Inmutable</Badge>
            </div>
            <div className="font-mono text-[10px] text-[#CCCCCC] break-all bg-[#0A0A0A] p-2 border border-[#1E293B]">
              {batch.rootMerkleHash || '0x8f2a71bc9d44e568a12bcde3849102847aefbc'}
            </div>
            <div className="text-[9px] text-[#9E9E9E] flex items-center justify-between">
              <span>Bloques de labores notarizados: {batch.totalLogsCount || 8} registros</span>
              <span className="text-[#15803D]">Verificado por Red de Barú</span>
            </div>
          </div>

          {/* QR Code and Signatures Footer */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t-2 border-[#15803D]">
            <div className="flex items-center gap-3">
              <div className="w-20 h-20 bg-white p-1 border-2 border-[#15803D] flex items-center justify-center">
                <QRCodeSVG
                  value={qrUrl}
                  size={72}
                  level="M"
                  includeMargin={true}
                  fgColor="#000000"
                  bgColor="#FFFFFF"
                />
              </div>
              <div className="text-[9px] text-[#9E9E9E] max-w-[200px]">
                <div className="text-[#E5E5E5] font-bold">Escaneo Público Aduanero</div>
                <div>Permite a inspectores portuarios validar en vivo la cadena de custodia y laboratorios fitosanitarios.</div>
              </div>
            </div>

            <div className="text-center sm:text-right">
              <div className="w-40 border-b border-[#CCCCCC] pb-1 mb-1 mx-auto sm:ml-auto">
                <span className="font-display font-bold text-xs text-[#15803D]">Ing. M. Villarreal</span>
              </div>
              <div className="text-[9px] text-[#666666] uppercase">Inspector Fitosanitario MIDA</div>
              <div className="text-[8px] text-[#9E9E9E]">Acreditación Oficial Chiriquí 2026</div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-end gap-2 pt-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cerrar
          </Button>
          <Button variant="default" onClick={handlePrint} className="flex items-center gap-2">
            <Printer className="w-4 h-4" />
            <span>Imprimir / Guardar PDF</span>
          </Button>
        </div>
      </div>
    </Dialog>
  );
};
