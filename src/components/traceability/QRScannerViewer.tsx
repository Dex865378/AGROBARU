import React, { useState, useEffect } from 'react';
import { 
  QrCode, 
  Search, 
  ShieldCheck, 
  CheckCircle2, 
  XCircle, 
  MapPin, 
  Clock, 
  Hash, 
  FileCheck, 
  Printer, 
  AlertTriangle
} from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { useAppState } from '@/context/AppStateContext';
import { ProductBatch } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { verifyHashChain } from '@/services/cryptoService';
import { formatDate } from '@/lib/utils';
import { getBatchTraceUrl } from '@/lib/qrUtils';
import { Dialog, DialogHeader, DialogTitle, DialogDescription, DialogCloseButton } from '@/components/ui/dialog';

export const QRScannerViewer: React.FC<{ initialBatchCode?: string }> = ({
  initialBatchCode,
}) => {
  const { batches, logs, farms } = useAppState();

  const [inputCode, setInputCode] = useState(initialBatchCode || 'AGRO-BARU-2026-CAV-089');
  const [selectedBatch, setSelectedBatch] = useState<ProductBatch | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);
  const [verificationResult, setVerificationResult] = useState<{ isValid: boolean; checkedLogsCount: number } | null>(null);
  const [isCertificateOpen, setIsCertificateOpen] = useState(false);

  useEffect(() => {
    if (initialBatchCode) {
      setInputCode(initialBatchCode);
      handleSearch(initialBatchCode);
    } else {
      handleSearch('AGRO-BARU-2026-CAV-089');
    }
  }, [initialBatchCode]);

  const handleSearch = async (codeToSearch: string) => {
    const clean = codeToSearch.trim().toUpperCase();
    const found = batches.find((b) => b.batchCode.toUpperCase() === clean);

    if (found) {
      setSelectedBatch(found);
      setIsVerifying(true);

      const batchLogs = logs.filter((l) => l.farmId === found.farmId);
      const result = await verifyHashChain(batchLogs);

      setTimeout(() => {
        setVerificationResult({
          isValid: result.isValid,
          checkedLogsCount: batchLogs.length,
        });
        setIsVerifying(false);
      }, 500);
    } else {
      setSelectedBatch(null);
      setVerificationResult(null);
    }
  };

  const activeFarm = selectedBatch ? farms.find((f) => f.id === selectedBatch.farmId) : null;
  const batchLogs = selectedBatch ? logs.filter((l) => l.farmId === selectedBatch.farmId) : [];

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b-2 border-[#15803D] pb-4">
        <div>
          <h2 className="font-display font-black text-2xl text-[#E5E5E5] uppercase tracking-tight">
            Verificador Criptográfico & Auditoría QR
          </h2>
          <p className="text-xs text-[#9E9E9E] font-sans">
            Inspección pública del Árbol de Merkle y hashes SHA-256 de cada lote agrícola del Distrito de Barú.
          </p>
        </div>

        {selectedBatch && verificationResult?.isValid && (
          <Button
            onClick={() => setIsCertificateOpen(true)}
            variant="success"
            size="sm"
            className="flex items-center gap-1.5"
          >
            <FileCheck className="w-4 h-4 text-black" strokeWidth={1.5} />
            Ver Certificado Oficial de Origen
          </Button>
        )}
      </div>

      {/* Code Search & Preset Selectors */}
      <div className="bg-[#121212] border-2 border-[#15803D] p-5 space-y-4 shadow-[4px_4px_0px_0px_#15803D]">
        <div className="flex flex-col sm:flex-row items-center gap-3">
          <div className="relative flex-1 w-full">
            <QrCode className="w-4 h-4 absolute left-3 top-3.5 text-[#15803D]" strokeWidth={1.5} />
            <Input
              value={inputCode}
              onChange={(e) => setInputCode(e.target.value)}
              placeholder="Ingresa código de lote (Ej. AGRO-BARU-2026-CAV-089)..."
              className="pl-9 font-mono uppercase text-xs border-[#1E293B] focus-visible:border-[#15803D]"
            />
          </div>
          <Button
            onClick={() => handleSearch(inputCode)}
            variant="default"
            size="default"
            className="w-full sm:w-auto"
          >
            <Search className="w-4 h-4 mr-1.5 text-black" strokeWidth={1.5} />
            Verificar Lote
          </Button>
        </div>

        {/* Quick Batch Chips */}
        <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-[#1E293B] text-xs font-mono">
          <span className="text-[#666666]">Lotes de Prueba:</span>
          {batches.map((b) => (
            <button
              key={b.id}
              onClick={() => {
                setInputCode(b.batchCode);
                handleSearch(b.batchCode);
              }}
              className={`px-2.5 py-1 border text-[11px] transition-colors ${
                selectedBatch?.id === b.id
                  ? 'border-[#15803D] bg-[#15803D] text-black font-bold'
                  : 'border-[#1E293B] bg-[#0E0E0E] text-[#9E9E9E] hover:border-[#15803D] hover:text-[#E5E5E5]'
              }`}
            >
              {b.cropName} ({b.batchCode})
            </button>
          ))}
        </div>
      </div>

      {/* Verification Result Overview */}
      {isVerifying ? (
        <div className="bg-[#121212] border-2 border-[#15803D] p-12 text-center space-y-3 font-mono">
          <div className="w-12 h-12 border-4 border-[#15803D] border-t-transparent animate-spin mx-auto" />
          <div className="text-sm text-[#E5E5E5] font-bold">Verificando Integridad de la Cadena SHA-256...</div>
          <div className="text-xs text-[#666666]">Calculando hashes de bloques y raíz de Merkle...</div>
        </div>
      ) : selectedBatch ? (
        <div className="space-y-6">
          {/* Main Inspection Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* QR Card & Trust Seal */}
            <div className="bg-[#121212] border-2 border-[#15803D] p-6 space-y-5 shadow-[4px_4px_0px_0px_#15803D] flex flex-col items-center text-center">
              <div className="p-3 bg-white border-4 border-[#15803D] shadow-[4px_4px_0px_0px_#FACC15]">
                <QRCodeSVG
                  value={getBatchTraceUrl(selectedBatch.batchCode)}
                  size={160}
                  level="M"
                  includeMargin={true}
                  fgColor="#0A0A0A"
                  bgColor="#FFFFFF"
                />
              </div>

              <div>
                <span className="text-[10px] font-mono text-[#666666] uppercase">CÓDIGO DE TRAZABILIDAD</span>
                <h3 className="font-mono font-bold text-sm text-[#15803D] mt-0.5">
                  {selectedBatch.batchCode}
                </h3>
              </div>

              {/* Status Seal */}
              {verificationResult?.isValid ? (
                <div className="w-full p-3 bg-[#15803D]/15 border-2 border-[#15803D] space-y-1">
                  <div className="font-display font-bold text-xs text-[#15803D] uppercase flex items-center justify-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4" strokeWidth={1.5} />
                    Integridad Matemática 100% Válida
                  </div>
                  <div className="text-[10px] font-mono text-[#E5E5E5]">
                    {verificationResult.checkedLogsCount} Bloques SHA-256 verificados sin alteración
                  </div>
                </div>
              ) : (
                <div className="w-full p-3 bg-[#F97316]/15 border-2 border-[#F97316] space-y-1">
                  <div className="font-display font-bold text-xs text-[#F97316] uppercase flex items-center justify-center gap-1.5">
                    <XCircle className="w-4 h-4" strokeWidth={1.5} />
                    Alerta: Cadena Manipulada
                  </div>
                </div>
              )}

              <div className="w-full text-left font-mono text-[11px] space-y-1.5 text-[#9E9E9E] border-t border-[#1E293B] pt-3">
                <div>
                  <span className="text-[#666666]">Raíz Merkle:</span>
                  <div className="text-[#7C3AED] truncate font-bold">{selectedBatch.rootMerkleHash}</div>
                </div>
                <div>
                  <span className="text-[#666666]">Coordenadas Finca:</span>
                  <div className="text-[#15803D] font-bold">{selectedBatch.originCoordinates.lat}°N, {selectedBatch.originCoordinates.lng}°W</div>
                </div>
              </div>
            </div>

            {/* Product & Farm Detailed Data */}
            <div className="lg:col-span-2 bg-[#121212] border-2 border-[#15803D] p-6 space-y-5 shadow-[4px_4px_0px_0px_#15803D]">
              <div className="flex items-start justify-between border-b border-[#15803D]/40 pb-4">
                <div>
                  <span className="text-[10px] font-mono px-2 py-0.5 bg-[#15803D]/15 text-[#15803D] border border-[#15803D]/30 font-bold uppercase">
                    {selectedBatch.qualityGrade}
                  </span>
                  <h3 className="font-display font-black text-2xl text-[#E5E5E5] uppercase mt-1">
                    {selectedBatch.cropName}
                  </h3>
                  <div className="text-xs font-mono text-[#9E9E9E]">
                    Variedad: <strong className="text-[#E5E5E5]">{selectedBatch.variety}</strong> • Cosecha: {selectedBatch.harvestDate}
                  </div>
                </div>

                <div className="text-right font-mono">
                  <div className="text-xs text-[#9E9E9E]">VOLUMEN DEL LOTE</div>
                  <div className="font-display font-bold text-xl text-[#15803D]">
                    {selectedBatch.quantityKg} Kg
                  </div>
                </div>
              </div>

              <p className="text-xs text-[#9E9E9E] font-sans leading-relaxed">
                {selectedBatch.description}
              </p>

              {/* Farm metadata box */}
              {activeFarm && (
                <div className="bg-[#0E0E0E] border border-[#1E293B] p-4 space-y-2 text-xs font-mono">
                  <div className="flex items-center justify-between text-[#E5E5E5]">
                    <span className="font-bold flex items-center gap-1.5">
                      <MapPin className="w-4 h-4 text-[#15803D]" strokeWidth={1.5} />
                      {activeFarm.name}
                    </span>
                    <span className="text-[#FACC15] font-bold">{activeFarm.corregimiento}, Barú</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[#9E9E9E] text-[11px] pt-1 border-t border-[#1A1A1A]">
                    <div>Titular: <strong className="text-[#E5E5E5]">{activeFarm.ownerName}</strong></div>
                    <div>Registro MIDA: <strong className="text-[#E5E5E5]">{activeFarm.registrationNumber}</strong></div>
                    <div>Área Finca: <strong className="text-[#E5E5E5]">{activeFarm.areaHectares} Ha</strong></div>
                    <div>Fecha Registro: <strong className="text-[#E5E5E5]">{activeFarm.registeredDate}</strong></div>
                  </div>
                </div>
              )}

              {/* Certifications list */}
              <div>
                <div className="text-[10px] font-mono text-[#666666] uppercase mb-1.5">
                  Certificaciones y Sellos de Calidad:
                </div>
                <div className="flex flex-wrap gap-2">
                  {selectedBatch.certifications.map((cert) => (
                    <Badge key={cert} variant="default" className="text-xs">
                      {cert}
                    </Badge>
                  ))}
                  <Badge variant="purple" className="text-xs flex items-center gap-1">
                    <ShieldCheck className="w-3.5 h-3.5" strokeWidth={1.5} /> MIDA Verificado
                  </Badge>
                </div>
              </div>
            </div>
          </div>

          {/* Detailed Cryptographic Audit Timeline */}
          <div className="bg-[#121212] border-2 border-[#15803D] p-6 space-y-4 shadow-[4px_4px_0px_0px_#15803D]">
            <div className="flex items-center justify-between border-b border-[#15803D]/40 pb-3">
              <div className="flex items-center gap-2">
                <Hash className="w-5 h-5 text-[#7C3AED]" strokeWidth={1.5} />
                <h4 className="font-display font-bold text-base text-[#E5E5E5] uppercase tracking-wide">
                  Historial de Cadena de Custodia del Lote ({batchLogs.length} Bloques)
                </h4>
              </div>
              <span className="text-[11px] font-mono text-[#15803D] font-bold">
                CADENA INMUTABLE SELLADA
              </span>
            </div>

            <div className="space-y-4">
              {batchLogs.map((log, index) => (
                <div
                  key={log.id}
                  className="bg-[#0E0E0E] border border-[#1E293B] p-4 space-y-3 font-mono text-xs hover:border-[#15803D]/60 transition-all"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 bg-[#15803D] text-black font-bold text-[10px]">
                        BLOQUE #{index + 1}
                      </span>
                      <span className="text-[#E5E5E5] font-bold uppercase">
                        {log.activityType.replace('_', ' ')}
                      </span>
                    </div>
                    <span className="text-[#9E9E9E] flex items-center gap-1 text-[11px]">
                      <Clock className="w-3.5 h-3.5 text-[#FACC15]" strokeWidth={1.5} />
                      {formatDate(log.date)}
                    </span>
                  </div>

                  <p className="text-xs text-[#E5E5E5] font-sans">
                    {typeof log.details === 'string' ? log.details : (log.details?.notes || JSON.stringify(log.details))}
                  </p>

                  {(log.quantity || log.organicProductUsed) && (
                    <div className="flex flex-wrap gap-4 text-[11px] text-[#9E9E9E]">
                      {log.quantity && <div>CANTIDAD: <strong className="text-[#E5E5E5]">{log.quantity}</strong></div>}
                      {log.organicProductUsed && <div>BIO-INSUMO: <strong className="text-[#7C3AED]">{log.organicProductUsed}</strong></div>}
                    </div>
                  )}

                  <div className="bg-[#0A0A0A] p-2.5 border border-[#1A1A1A] text-[10px] space-y-1">
                    <div className="flex justify-between">
                      <span className="text-[#666666]">HASH PREVIO:</span>
                      <span className="text-[#9E9E9E] truncate max-w-[280px]">{log.previousHash}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[#7C3AED] font-bold">HASH BLOQUE (SHA-256):</span>
                      <span className="text-[#15803D] truncate max-w-[280px] font-bold">{log.cryptoHash}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-[#121212] border-2 border-[#15803D] p-12 text-center text-[#9E9E9E] font-mono text-xs space-y-2">
          <AlertTriangle className="w-8 h-8 text-[#FACC15] mx-auto" strokeWidth={1.5} />
          <div className="text-sm font-bold text-[#E5E5E5]">Lote No Encontrado</div>
          <p>No se encontró ningún registro para el código "{inputCode}". Selecciona uno de los lotes de prueba arriba.</p>
        </div>
      )}

      {/* Official Certificate Dialog */}
      {selectedBatch && (
        <Dialog open={isCertificateOpen} onOpenChange={setIsCertificateOpen}>
          <DialogCloseButton onClose={() => setIsCertificateOpen(false)} />
          <DialogHeader>
            <DialogTitle>Certificado Criptográfico de Origen</DialogTitle>
            <DialogDescription>
              Acreditación oficial emitida bajo el protocolo descentralizado de trazabilidad de Barú.
            </DialogDescription>
          </DialogHeader>

          <div className="border-4 border-[#15803D] bg-[#0A0A0A] p-6 space-y-5 text-center my-2 font-mono">
            <div className="w-12 h-12 bg-[#15803D] mx-auto flex items-center justify-center font-display font-black text-black text-lg">
              AB
            </div>
            
            <div>
              <div className="text-[10px] text-[#9E9E9E] uppercase tracking-widest">REPÚBLICA DE PANAMÁ • PROVINCIA DE CHIRIQUÍ</div>
              <h3 className="font-display font-black text-xl text-[#E5E5E5] uppercase mt-1">
                CERTIFICADO DE ORIGEN & NO-INTERMEDIACIÓN
              </h3>
              <div className="text-xs text-[#15803D] font-bold mt-0.5">
                DISTRITO DE BARÚ // PROTOCOLO CRYPTO-AGRO
              </div>
            </div>

            <div className="bg-[#121212] border-2 border-[#1E293B] p-4 text-left text-xs space-y-2 text-[#9E9E9E]">
              <div className="flex justify-between">
                <span>Producto Certificado:</span>
                <strong className="text-[#E5E5E5]">{selectedBatch.cropName} ({selectedBatch.variety})</strong>
              </div>
              <div className="flex justify-between">
                <span>Finca de Producción:</span>
                <strong className="text-[#E5E5E5]">{selectedBatch.farmName} ({selectedBatch.corregimiento})</strong>
              </div>
              <div className="flex justify-between">
                <span>Productor Titular:</span>
                <strong className="text-[#E5E5E5]">{selectedBatch.producerName}</strong>
              </div>
              <div className="flex justify-between">
                <span>Código de Lote:</span>
                <strong className="text-[#15803D]">{selectedBatch.batchCode}</strong>
              </div>
              <div className="flex justify-between">
                <span>Raíz Merkle SHA-256:</span>
                <strong className="text-[#7C3AED] truncate max-w-[220px]">{selectedBatch.rootMerkleHash}</strong>
              </div>
              <div className="flex justify-between">
                <span>Total Bloques Auditados:</span>
                <strong className="text-[#E5E5E5]">{selectedBatch.totalLogsCount} Registros Inmutables</strong>
              </div>
            </div>

            <div className="text-[10px] text-[#666666] leading-relaxed">
              Este documento certifica que el producto ha sido cultivado bajo prácticas sostenibles y vendido directamente al comprador con custodia Escrow, garantizando el 100% del pago para el productor local.
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <Button
                variant="default"
                size="sm"
                onClick={() => window.print()}
                className="flex items-center gap-1.5"
              >
                <Printer className="w-4 h-4 text-black" strokeWidth={1.5} />
                Imprimir Certificado Oficial
              </Button>
            </div>
          </div>
        </Dialog>
      )}
    </div>
  );
};
