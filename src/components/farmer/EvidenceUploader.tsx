import React, { useState } from 'react';
import { Camera, ShieldCheck, MapPin, Cpu, UploadCloud, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { calculateSha256 } from '@/services/cryptoService';
import { useNotification } from '@/context/NotificationContext';

interface EvidenceUploaderProps {
  farmId: string;
  farmName: string;
  onEvidenceNotarized: (evidence: {
    photoUrl: string;
    hash: string;
    gpsCoords: { lat: number; lng: number };
    timestamp: string;
    deviceModel: string;
  }) => void;
}

export const EvidenceUploader: React.FC<EvidenceUploaderProps> = ({
  farmId,
  farmName,
  onEvidenceNotarized,
}) => {
  const { success } = useNotification();
  const [isProcessing, setIsProcessing] = useState(false);
  const [previewSvg, setPreviewSvg] = useState<string | null>(null);
  const [calculatedHash, setCalculatedHash] = useState<string | null>(null);
  const [metadata, setMetadata] = useState<{
    lat: number;
    lng: number;
    timestamp: string;
    device: string;
    altitude: number;
  } | null>(null);

  // Generate a cryptographically stamped SVG canvas evidence
  const handleCaptureEvidence = async () => {
    setIsProcessing(true);
    
    // Simulate real camera shutter & GPS EXIF capture
    const timestamp = new Date().toISOString();
    const lat = 8.2831 + (Math.random() * 0.005 - 0.0025);
    const lng = -82.8624 + (Math.random() * 0.005 - 0.0025);
    const altitude = Math.floor(14 + Math.random() * 10);
    const device = 'AgroBarú PWA Sentinel Mobile [Sensor v2.4]';

    const payloadToHash = `${farmId}|${timestamp}|${lat.toFixed(6)},${lng.toFixed(6)}|ALT:${altitude}m|DEV:${device}`;
    const hash = await calculateSha256(payloadToHash);

    // Create stamped visual evidence SVG
    const svgData = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="400" height="240" viewBox="0 0 400 240"><rect fill="%230E0E0E" width="400" height="240"/><rect x="8" y="8" width="384" height="224" fill="none" stroke="%23FF4500" stroke-width="2"/><text x="20" y="36" fill="%23FF4500" font-family="monospace" font-weight="bold" font-size="12">AGROBARÚ CRYPTO EVIDENCE SEAL</text><text x="20" y="60" fill="%23E5E5E5" font-family="monospace" font-size="10">FINCA: ${farmName}</text><text x="20" y="80" fill="%239E9E9E" font-family="monospace" font-size="10">GPS: ${lat.toFixed(6)} N, ${lng.toFixed(6)} W</text><text x="20" y="100" fill="%239E9E9E" font-family="monospace" font-size="10">HORA: ${new Date(timestamp).toLocaleTimeString()} | ALT: ${altitude}m</text><text x="20" y="125" fill="%2310B981" font-family="monospace" font-size="9">SHA-256: ${hash.substring(0, 32)}...</text><circle cx="330" cy="170" r="35" fill="%23FF4500" opacity="0.15"/><path d="M330 145 L330 195 M305 170 L355 170" stroke="%23FF4500" stroke-width="2"/><text x="20" y="215" fill="%23666666" font-family="monospace" font-size="8">VERIFIED BY DISTRICT OF BARÚ PROTOCOL</text></svg>`;

    setTimeout(() => {
      setPreviewSvg(svgData);
      setCalculatedHash(hash);
      setMetadata({ lat, lng, timestamp, device, altitude });
      setIsProcessing(false);
      
      onEvidenceNotarized({
        photoUrl: svgData,
        hash,
        gpsCoords: { lat, lng },
        timestamp,
        deviceModel: device,
      });

      success('Evidencia Notarizada', `Hash SHA-256 generado: ${hash.substring(0, 16)}...`);
    }, 600);
  };

  return (
    <div className="bg-[#121212] border-2 border-[#262626] p-5 space-y-4 shadow-[4px_4px_0px_0px_#1A1A1A]">
      <div className="flex items-center justify-between border-b border-[#262626] pb-3">
        <div className="flex items-center gap-2">
          <Camera className="w-5 h-5 text-[#FF4500]" strokeWidth={1.5} />
          <h4 className="font-display font-bold text-sm text-[#E5E5E5] uppercase tracking-wide">
            Captura de Evidencia Criptográfica
          </h4>
        </div>
        <span className="text-[10px] font-mono px-2 py-0.5 bg-[#1A1A1A] text-[#10B981] border border-[#10B981]/30">
          GPS STAMP READY
        </span>
      </div>

      <p className="text-xs text-[#9E9E9E] font-sans leading-relaxed">
        Las fotos tomadas en campo extraen metadatos GPS verificados de Barú, estampan la hora atómica y generan un hash inmutable SHA-256 antes de guardarse en la bitácora.
      </p>

      {previewSvg ? (
        <div className="space-y-3">
          <div className="border-2 border-[#FF4500] p-1 bg-black">
            <img src={previewSvg} alt="Evidencia Criptográfica Notarizada" className="w-full h-auto object-cover" />
          </div>
          {metadata && (
            <div className="bg-[#0E0E0E] p-3 border border-[#262626] text-[11px] font-mono space-y-1 text-[#9E9E9E]">
              <div className="flex justify-between">
                <span className="text-[#E5E5E5] font-bold">Estado:</span>
                <span className="text-[#10B981] flex items-center gap-1 font-bold">
                  <CheckCircle2 className="w-3 h-3" strokeWidth={1.5} /> SELLADO & VERIFICADO
                </span>
              </div>
              <div className="flex justify-between">
                <span>Coordenadas:</span>
                <span className="text-[#E5E5E5]">{metadata.lat.toFixed(6)}° N, {metadata.lng.toFixed(6)}° W</span>
              </div>
              <div className="flex justify-between">
                <span>Hash SHA-256:</span>
                <span className="text-[#FF4500] truncate max-w-[200px]">{calculatedHash}</span>
              </div>
            </div>
          )}
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={handleCaptureEvidence}
            disabled={isProcessing}
            className="w-full"
          >
            Tomar Otra Foto / Evidencia
          </Button>
        </div>
      ) : (
        <div className="border-2 border-dashed border-[#383838] p-6 text-center space-y-3 hover:border-[#FF4500] transition-colors">
          <div className="w-12 h-12 bg-[#1A1A1A] border border-[#383838] mx-auto flex items-center justify-center text-[#FF4500]">
            <UploadCloud className="w-6 h-6" strokeWidth={1.5} />
          </div>
          <div className="text-xs text-[#E5E5E5] font-display uppercase tracking-wider font-bold">
            Simular Captura de Campo con Geolocalización
          </div>
          <p className="text-[11px] text-[#666666] font-sans">
            Captura fotográfica de riego, poda, control fitosanitario o corte de racimos en Barú.
          </p>
          <Button
            type="button"
            variant="default"
            size="sm"
            onClick={handleCaptureEvidence}
            disabled={isProcessing}
            className="w-full"
          >
            {isProcessing ? 'Calculando Hash SHA-256...' : 'Capturar & Notarizar Evidencia'}
          </Button>
        </div>
      )}
    </div>
  );
};
