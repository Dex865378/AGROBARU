import React, { useState } from 'react';
import { 
  MapPin, 
  ShieldCheck, 
  QrCode, 
  Layers, 
  Eye, 
  Sprout, 
  Building2, 
  ExternalLink,
  Activity,
  Award
} from 'lucide-react';
import { useAppState } from '@/context/AppStateContext';
import { useLanguage } from '@/context/LanguageContext';
import { Farm } from '@/types';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

export const BaruGeoMap: React.FC = () => {
  const { farms, batches } = useAppState();
  const { language, translateDynamic } = useLanguage();
  const [selectedFarm, setSelectedFarm] = useState<Farm | null>(farms[0] || null);
  const [mapLayer, setMapLayer] = useState<'VECTOR' | 'NDVI_SATELLITE' | 'SIGATOKA_HEATMAP'>('NDVI_SATELLITE');

  return (
    <div className="space-y-6 font-mono">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b-2 border-[#15803D] pb-4">
        <div>
          <div className="flex items-center gap-2">
            <Badge variant="live-green" pulse>GIS MIDA BARÚ</Badge>
            <Badge variant="outline">DATUM WGS84</Badge>
          </div>
          <h2 className="font-display font-black text-2xl text-[#E5E5E5] uppercase tracking-tight mt-1">
            {language === 'en' ? 'Geospatial Map & Parcel Registry // Barú' : 'Mapa Geoespacial & Catastro de Fincas de Barú'}
          </h2>
          <p className="text-xs text-[#9E9E9E] font-sans">
            {language === 'en'
              ? 'Satellite inspection of MIDA certified agricultural parcels across all 5 corregimientos.'
              : 'Inspección territorial de parcelas certificadas en Puerto Armuelles, Progreso, Limones, Baco y Rodolfo Aguilar.'}
          </p>
        </div>

        {/* Layer Controls */}
        <div className="flex items-center gap-1 bg-[#141414] p-1 border border-[#15803D]">
          <button
            onClick={() => setMapLayer('NDVI_SATELLITE')}
            className={`px-2.5 py-1 text-[10px] font-bold uppercase transition-all ${
              mapLayer === 'NDVI_SATELLITE'
                ? 'bg-[#15803D] text-black'
                : 'text-[#9E9E9E] hover:text-[#E5E5E5]'
            }`}
          >
            🛰️ Satelital / NDVI
          </button>
          <button
            onClick={() => setMapLayer('SIGATOKA_HEATMAP')}
            className={`px-2.5 py-1 text-[10px] font-bold uppercase transition-all ${
              mapLayer === 'SIGATOKA_HEATMAP'
                ? 'bg-[#F97316] text-black'
                : 'text-[#9E9E9E] hover:text-[#E5E5E5]'
            }`}
          >
            🔥 Riesgo Sigatoka
          </button>
          <button
            onClick={() => setMapLayer('VECTOR')}
            className={`px-2.5 py-1 text-[10px] font-bold uppercase transition-all ${
              mapLayer === 'VECTOR'
                ? 'bg-[#FACC15] text-black'
                : 'text-[#9E9E9E] hover:text-[#E5E5E5]'
            }`}
          >
            🗺️ Vectorial Catastral
          </button>
        </div>
      </div>

      {/* Interactive Map Canvas + Details Splitter */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* SVG Interactive GIS Map */}
        <div className="lg:col-span-2 bg-[#0E0E0E] border-2 border-[#15803D] p-6 space-y-4 shadow-[4px_4px_0px_0px_#15803D]">
          <div className="flex items-center justify-between border-b border-[#1E293B] pb-3 text-xs">
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-[#15803D]" />
              <h3 className="font-display font-bold text-sm text-[#E5E5E5] uppercase">
                {language === 'en' ? 'Corregimientos of Barú (Chiriquí)' : 'Distrito de Barú (5 Corregimientos)'}
              </h3>
            </div>
            <span className="text-[10px] text-[#15803D] font-bold">
              {farms.length} Fincas Auditadas
            </span>
          </div>

          {/* SVG Map of Baru District with Corregimientos and Farm Markers */}
          <div className="relative w-full h-[400px] bg-[#0A0A0A] border-2 border-[#1E293B] overflow-hidden flex items-center justify-center p-4">
            {/* Grid overlay */}
            <div className="absolute inset-0 bg-grid-[#15803D]/[0.08]" />

            <svg
              viewBox="0 0 800 500"
              className="w-full h-full object-contain relative z-10"
            >
              {/* Coastline / Pacific Ocean & Gulf of Chiriquí hint */}
              <path
                d="M 50,450 Q 200,480 400,440 T 750,420 L 800,500 L 0,500 Z"
                fill="#050505"
                stroke="#1E293B"
                strokeWidth="1"
              />

              {/* District Boundary Shape with Satellite / NDVI Shader */}
              <polygon
                points="100,50 350,30 650,80 720,380 450,460 200,440 80,300"
                fill={
                  mapLayer === 'NDVI_SATELLITE' 
                    ? '#0B1A0E' 
                    : mapLayer === 'SIGATOKA_HEATMAP' 
                    ? '#1A110E' 
                    : '#0E0E0E'
                }
                stroke="#15803D"
                strokeWidth="2"
                strokeDasharray="4 2"
              />

              {/* Corregimiento Regional Labels */}
              <text x="180" y="100" fill="#666666" fontSize="11" fontFamily="JetBrains Mono" fontWeight="bold">PROGRESO (FRONTERA)</text>
              <text x="450" y="120" fill="#666666" fontSize="11" fontFamily="JetBrains Mono" fontWeight="bold">RODOLFO AGUILAR DELGADO</text>
              <text x="320" y="240" fill="#666666" fontSize="11" fontFamily="JetBrains Mono" fontWeight="bold">BACO (RÍO CHIRIQUÍ VIEJO)</text>
              <text x="220" y="380" fill="#15803D" fontSize="13" fontFamily="Space Grotesk" fontWeight="bold">PUERTO ARMUELLES (PUERTO FOB)</text>
              <text x="100" y="440" fill="#666666" fontSize="11" fontFamily="JetBrains Mono" fontWeight="bold">LIMONES (BURICA)</text>

              {/* Farm Pins with Polygons */}
              {farms.map((f) => {
                const isSelected = selectedFarm?.id === f.id;
                const x = 150 + ((f.coordinates.lng - (-82.95)) / (0.15)) * 500;
                const y = 450 - ((f.coordinates.lat - 8.24) / (0.18)) * 400;

                return (
                  <g
                    key={f.id}
                    onClick={() => setSelectedFarm(f)}
                    className="cursor-pointer group"
                  >
                    {/* Simulated Parcel Boundary Polygon */}
                    <rect
                      x={x - 20}
                      y={y - 15}
                      width="40"
                      height="30"
                      fill={isSelected ? "rgba(250, 204, 21, 0.2)" : "rgba(21, 128, 61, 0.15)"}
                      stroke={isSelected ? "#FACC15" : "#15803D"}
                      strokeWidth="1"
                    />

                    {isSelected && (
                      <circle
                        cx={x}
                        cy={y}
                        r="18"
                        fill="none"
                        stroke="#FACC15"
                        strokeWidth="2"
                        className="animate-ping"
                      />
                    )}

                    <circle
                      cx={x}
                      cy={y}
                      r={isSelected ? "8" : "6"}
                      fill={isSelected ? "#FACC15" : "#15803D"}
                      stroke="#0A0A0A"
                      strokeWidth="2"
                    />

                    <text
                      x={x + 10}
                      y={y + 4}
                      fill={isSelected ? "#FACC15" : "#E5E5E5"}
                      fontSize="9"
                      fontFamily="JetBrains Mono"
                      fontWeight="bold"
                    >
                      {f.name} ({f.areaHectares} Ha)
                    </text>
                  </g>
                );
              })}
            </svg>

            {/* Map Legend */}
            <div className="absolute bottom-2 left-2 bg-[#0A0A0A]/95 p-2.5 border border-[#15803D] text-[10px] font-mono text-[#9E9E9E] space-y-1">
              <div className="text-[#E5E5E5] font-bold">CAPA ACTIVA: {mapLayer}</div>
              <div>🟢 Parcela Certificada BPA (NDVI 0.82)</div>
              <div>🟡 Parcela Seleccionada</div>
            </div>
          </div>
        </div>

        {/* Selected Farm Information Card */}
        {selectedFarm ? (
          <div className="bg-[#0E0E0E] border-2 border-[#15803D] p-6 space-y-4 shadow-[4px_4px_0px_0px_#15803D] flex flex-col justify-between">
            <div className="space-y-4">
              <div className="border-b border-[#1E293B] pb-3">
                <div className="flex items-center gap-2">
                  <Badge variant="live-green" pulse>{selectedFarm.primaryCrops.join(', ')}</Badge>
                  <span className="text-[10px] font-mono text-[#FACC15] font-bold uppercase">
                    {selectedFarm.corregimiento}
                  </span>
                </div>
                <h3 className="font-display font-black text-xl text-[#E5E5E5] uppercase mt-2">
                  {selectedFarm.name}
                </h3>
                <div className="text-xs font-mono text-[#9E9E9E]">
                  Titular: <strong className="text-[#E5E5E5]">{selectedFarm.ownerName}</strong>
                </div>
              </div>

              <div className="bg-[#141414] border border-[#1E293B] p-4 space-y-2 text-xs font-mono">
                <div className="flex justify-between">
                  <span className="text-[#666666]">Registro MIDA:</span>
                  <span className="text-[#15803D] font-bold">{selectedFarm.registrationNumber}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#666666]">Superficie Catastral:</span>
                  <span className="text-[#E5E5E5] font-bold">{selectedFarm.areaHectares} Hectáreas</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#666666]">Coordenadas GPS:</span>
                  <span className="text-[#7C3AED] font-bold">
                    {selectedFarm.coordinates.lat}°N, {selectedFarm.coordinates.lng}°W
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#666666]">Índice Vigor Vegetativo:</span>
                  <span className="text-[#15803D] font-bold">NDVI 0.84 (Óptimo)</span>
                </div>
              </div>

              {/* Lotes asociados */}
              <div>
                <div className="text-[10px] font-mono text-[#666666] uppercase mb-1.5 font-bold">
                  Lotes en Cosecha & Exportación:
                </div>
                {batches.filter((b) => b.farmId === selectedFarm.id).length > 0 ? (
                  <div className="space-y-1.5">
                    {batches
                      .filter((b) => b.farmId === selectedFarm.id)
                      .map((b) => (
                        <div
                          key={b.id}
                          className="bg-[#141414] border border-[#1E293B] p-2.5 text-xs font-mono flex items-center justify-between"
                        >
                          <div>
                            <span className="text-[#15803D] font-bold">{b.cropName}</span>
                            <span className="text-[#666666] text-[10px] block">{b.batchCode}</span>
                          </div>
                          <span className="text-[#FACC15] font-bold">${b.pricePerKgUsd.toFixed(2)}/Kg</span>
                        </div>
                      ))}
                  </div>
                ) : (
                  <div className="text-xs font-mono text-[#666666]">No hay lotes activos actualmente.</div>
                )}
              </div>
            </div>

            <div className="pt-3 border-t border-[#1E293B]">
              <div className="bg-[#141414] p-2.5 border border-[#15803D] text-[10px] text-[#CCCCCC] mb-2 flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-[#15803D] shrink-0" />
                <span>Auditoría de Inocuidad y Libre de Sigatoka vigente por MIDA.</span>
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-[#0E0E0E] border-2 border-[#15803D] p-6 text-center text-[#9E9E9E] font-mono text-xs flex items-center justify-center">
            Selecciona una finca en el mapa para ver su expediente y telemetría.
          </div>
        )}
      </div>
    </div>
  );
};
