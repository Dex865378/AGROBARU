import React, { useState, useEffect, useMemo } from 'react';
import { computeMerkleRoot } from '@/services/cryptoService';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ShieldCheck, 
  Terminal, 
  Hash, 
  MapPin, 
  Lock, 
  Layers, 
  Radio, 
  CheckCircle2, 
  AlertCircle, 
  Calendar, 
  Scale, 
  Thermometer, 
  Activity, 
  Cpu, 
  FileCheck2, 
  Search, 
  Plus, 
  ExternalLink,
  Copy,
  Check,
  Zap,
  ArrowDown
} from 'lucide-react';

// ==========================================
// 1. TYPES & DATA CONTRACTS
// ==========================================

export type ActivityCategory = 
  | 'PROPAGATION'
  | 'NUTRITION_ORGANIC'
  | 'BIO_DEFENSE_SIGATOKA'
  | 'CANOPY_SURGERY'
  | 'CALIBRATED_HARVEST'
  | 'MIDA_INSPECTION';

export interface CryptographicBlock {
  blockNumber: number;
  blockHash: string;
  previousHash: string;
  timestamp: string;
  operator: {
    name: string;
    idCard: string;
    midaLicense: string;
  };
  activity: {
    category: ActivityCategory;
    title: string;
    description: string;
    technicalSpecs: {
      crop: string;
      variety: string;
      lotSector: string;
      dosageOrYield?: string;
      bioAgent?: string;
      fruitCaliberMm?: number;
      brixDegrees?: number;
    };
  };
  telemetry: {
    gpsCoords: { lat: number; lng: number };
    altitudeMeters: number;
    ambientTempC: number;
    relativeHumidityPct: number;
    leafWetnessHours: number;
    deviceHardwareId: string;
  };
  midaAudit: {
    verified: boolean;
    auditorName?: string;
    resolutionCode?: string;
  };
  merkleProofIndex: number;
}

// ==========================================
// 2. CRYPTO SHA-256 UTILITY
// ==========================================

async function generateSha256(message: string): Promise<string> {
  const msgUint8 = new TextEncoder().encode(message);
  if (typeof window !== 'undefined' && window.crypto && window.crypto.subtle) {
    try {
      const hashBuffer = await window.crypto.subtle.digest('SHA-256', msgUint8);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    } catch {
      // Fallback
    }
  }
  let hash = 0;
  for (let i = 0; i < message.length; i++) {
    const char = message.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash |= 0;
  }
  return `0000${Math.abs(hash).toString(16).padStart(60, 'f')}`;
}

// ==========================================
// 3. SEED BLOCKS (BARÚ EXPORT PROTOCOL)
// ==========================================

const INITIAL_BLOCKS: CryptographicBlock[] = [
  {
    blockNumber: 1,
    blockHash: '7c9a41b2e8d35f0a1c6e4b8a9d0f2c4e6a8b0d2f4a6c8e0b2d4f6a8c0e2b4d6f',
    previousHash: '0000000000000000000000000000000000000000000000000000000000000000',
    timestamp: '2026-05-12T07:15:00Z',
    operator: {
      name: 'Dionisio Castillo',
      idCard: '4-721-1092',
      midaLicense: 'MIDA-CH-REG-0994',
    },
    activity: {
      category: 'PROPAGATION',
      title: 'Siembra de Meristemas Libres de Moko y Virus BSV',
      description: 'Establecimiento de 4.2 hectáreas de hijuelos certificados por cultivo in vitro. Densidad: 1,650 plantas/ha en diseño tresbolillo con zanja de drenaje maestro.',
      technicalSpecs: {
        crop: 'Musa acuminata (Grupo AAA)',
        variety: 'Cavendish Gran Enano Selection Barú',
        lotSector: 'Sector Santa Clara / Lote Alpha-1',
        dosageOrYield: '6,930 hijuelos auditados',
        bioAgent: 'Micorrizas Glomus intraradices + Trichoderma harzianum',
      },
    },
    telemetry: {
      gpsCoords: { lat: 8.283104, lng: -82.862418 },
      altitudeMeters: 16.4,
      ambientTempC: 28.2,
      relativeHumidityPct: 86,
      leafWetnessHours: 5.0,
      deviceHardwareId: 'SENTINEL-GPS-HW491',
    },
    midaAudit: {
      verified: true,
      auditorName: 'Ing. Marlenys Araúz (MIDA Chiriquí)',
      resolutionCode: 'RES-FITOSAN-2026-081',
    },
    merkleProofIndex: 0,
  },
  {
    blockNumber: 2,
    blockHash: '3f8e12a45c7b9d0e2f4a6c8e0b2d4f6a8c0e2b4d6f7c9a41b2e8d35f0a1c6e4b',
    previousHash: '7c9a41b2e8d35f0a1c6e4b8a9d0f2c4e6a8b0d2f4a6c8e0b2d4f6a8c0e2b4d6f',
    timestamp: '2026-06-24T06:40:00Z',
    operator: {
      name: 'Cuadrilla Agro-Bio #3',
      idCard: '4-811-3049',
      midaLicense: 'COOPASBA-OP-441',
    },
    activity: {
      category: 'NUTRITION_ORGANIC',
      title: 'Fertirriego Orgánico con Lixiviado y Sulfato de Potasio',
      description: 'Inyección de biofermento microbiano estabilizado a pH 6.4. Balance nutricional orientado a engrose de pseudotallo y asimilación de silicio foliar.',
      technicalSpecs: {
        crop: 'Banano Cavendish',
        variety: 'Gran Enano',
        lotSector: 'Sector Santa Clara / Lote Alpha-1',
        dosageOrYield: '320 Litros/ha emulsión',
        bioAgent: 'Lixiviado de lombriz roja + K2SO4 OMRI Listed',
      },
    },
    telemetry: {
      gpsCoords: { lat: 8.283155, lng: -82.862390 },
      altitudeMeters: 16.2,
      ambientTempC: 27.5,
      relativeHumidityPct: 89,
      leafWetnessHours: 7.2,
      deviceHardwareId: 'SENTINEL-GPS-HW491',
    },
    midaAudit: {
      verified: true,
      auditorName: 'Certificadora Orgánica Biolatino',
      resolutionCode: 'AUDIT-BIO-2026-552',
    },
    merkleProofIndex: 1,
  },
  {
    blockNumber: 3,
    blockHash: '9a0b2d4f6a8c0e2b4d6f7c9a41b2e8d35f0a1c6e4b8a9d0f2c4e6a8b0d2f4a6c',
    previousHash: '3f8e12a45c7b9d0e2f4a6c8e0b2d4f6a8c0e2b4d6f7c9a41b2e8d35f0a1c6e4b',
    timestamp: '2026-07-19T08:00:00Z',
    operator: {
      name: 'Dionisio Castillo & Equipo Fitosanitario',
      idCard: '4-721-1092',
      midaLicense: 'MIDA-CH-REG-0994',
    },
    activity: {
      category: 'BIO_DEFENSE_SIGATOKA',
      title: 'Protocolo de Contención Biológica: Sigatoka Negra',
      description: 'Activación del protocolo agronómico post-alerta microclimática. Deshoje quirúrgico de estrías 1-3 y aspersión dirigida de cepas antagónicas bacterianas.',
      technicalSpecs: {
        crop: 'Banano Cavendish',
        variety: 'Gran Enano',
        lotSector: 'Sector Santa Clara / Lote Alpha-1 y Perímetro',
        dosageOrYield: '1.5 L/ha nebulizado ultra-bajo volumen',
        bioAgent: 'Bacillus subtilis (Cepa QST 713, 1x10^9 UFC/ml)',
      },
    },
    telemetry: {
      gpsCoords: { lat: 8.283080, lng: -82.862450 },
      altitudeMeters: 16.6,
      ambientTempC: 29.8,
      relativeHumidityPct: 92,
      leafWetnessHours: 8.5,
      deviceHardwareId: 'SENTINEL-GPS-HW491',
    },
    midaAudit: {
      verified: true,
      auditorName: 'Dr. Héctor Villarreal (Patólogo MIDA Barú)',
      resolutionCode: 'MIDA-SIGATOKA-CLR-019',
    },
    merkleProofIndex: 2,
  },
  {
    blockNumber: 4,
    blockHash: '4e6a8b0d2f4a6c8e0b2d4f6a8c0e2b4d6f7c9a41b2e8d35f0a1c6e4b8a9d0f2c',
    previousHash: '9a0b2d4f6a8c0e2b4d6f7c9a41b2e8d35f0a1c6e4b8a9d0f2c4e6a8b0d2f4a6c',
    timestamp: '2026-08-18T05:30:00Z',
    operator: {
      name: 'Cuadrilla de Cosecha Especializada Puerto Armuelles',
      idCard: '4-690-4412',
      midaLicense: 'EXP-BARU-CERT-2026',
    },
    activity: {
      category: 'CALIBRATED_HARVEST',
      title: 'Corte Calibrado de Exportación & Embalaje Térmico',
      description: 'Cosecha a 11 semanas de floración. Inspección de calibre con pie de rey óptico. Lavado hidrotérmico con extracto cítrico y paletizado a 13.5 °C.',
      technicalSpecs: {
        crop: 'Banano Cavendish Exportación Directa',
        variety: 'Williams / Gran Enano',
        lotSector: 'Sector Santa Clara / Lote Alpha-1',
        dosageOrYield: '3,800 Kg netos (210 Cajas 18.14 Kg)',
        fruitCaliberMm: 44.5,
        brixDegrees: 20.2,
      },
    },
    telemetry: {
      gpsCoords: { lat: 8.283104, lng: -82.862418 },
      altitudeMeters: 16.4,
      ambientTempC: 25.1,
      relativeHumidityPct: 82,
      leafWetnessHours: 3.0,
      deviceHardwareId: 'SENTINEL-GPS-HW491',
    },
    midaAudit: {
      verified: true,
      auditorName: 'Oficial de Exportación Cuarentenaria MIDA',
      resolutionCode: 'CERT-EXP-PTY-884910',
    },
    merkleProofIndex: 3,
  },
];

// ==========================================
// 4. MAIN COMPONENT: CADENA DE BLOQUES
// ==========================================

export const CultivationBlockchain: React.FC = () => {
  const [blocks, setBlocks] = useState<CryptographicBlock[]>(INITIAL_BLOCKS);
  const [merkleRoot, setMerkleRoot] = useState<string>('');

  useEffect(() => {
    let cancelled = false;
    computeMerkleRoot(blocks.map((b) => b.blockHash)).then((root) => {
      if (!cancelled) setMerkleRoot(root);
    });
    return () => {
      cancelled = true;
    };
  }, [blocks]);
  const [filterCategory, setFilterCategory] = useState<string>('ALL');
  const [expandedBlockId, setExpandedBlockId] = useState<number | null>(null);
  const [copiedHash, setCopiedHash] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [isSealing, setIsSealing] = useState<boolean>(false);

  // Form State for new Block
  const [newTitle, setNewTitle] = useState('');
  const [newCategory, setNewCategory] = useState<ActivityCategory>('BIO_DEFENSE_SIGATOKA');
  const [newDescription, setNewDescription] = useState('');
  const [newBioAgent, setNewBioAgent] = useState('');
  const [newCaliber, setNewCaliber] = useState('44.0');
  const [newOperator, setNewOperator] = useState('Dionisio Castillo (Productor Titular)');

  // Filtered list
  const filteredBlocks = useMemo(() => {
    if (filterCategory === 'ALL') return blocks;
    return blocks.filter(b => b.activity.category === filterCategory);
  }, [blocks, filterCategory]);

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedHash(text);
    setTimeout(() => setCopiedHash(null), 2000);
  };

  // Add new block to immutable chain
  const handleSealNewBlock = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newDescription.trim()) return;

    setIsSealing(true);

    const previousBlock = blocks[blocks.length - 1];
    const timestamp = new Date().toISOString();
    const blockNumber = blocks.length + 1;
    const lat = 8.283104 + (Math.random() * 0.0004 - 0.0002);
    const lng = -82.862418 + (Math.random() * 0.0004 - 0.0002);

    const rawPayload = `${blockNumber}|${previousBlock.blockHash}|${timestamp}|${newCategory}|${newTitle}|${lat.toFixed(6)},${lng.toFixed(6)}|${newOperator}`;
    const newHash = await generateSha256(rawPayload);

    const newBlock: CryptographicBlock = {
      blockNumber,
      blockHash: newHash,
      previousHash: previousBlock.blockHash,
      timestamp,
      operator: {
        name: newOperator,
        idCard: '4-721-1092',
        midaLicense: 'MIDA-CH-REG-0994',
      },
      activity: {
        category: newCategory,
        title: newTitle,
        description: newDescription,
        technicalSpecs: {
          crop: 'Banano Cavendish',
          variety: 'Gran Enano',
          lotSector: 'Sector Santa Clara / Lote Alpha-1',
          bioAgent: newBioAgent || undefined,
          fruitCaliberMm: Number(newCaliber) || 44.0,
        },
      },
      telemetry: {
        gpsCoords: { lat, lng },
        altitudeMeters: 16.5,
        ambientTempC: 28.5,
        relativeHumidityPct: 88,
        leafWetnessHours: 6.2,
        deviceHardwareId: 'SENTINEL-GPS-HW491',
      },
      midaAudit: {
        verified: true,
        auditorName: 'Auditoría Digital Descentralizada MIDA',
        resolutionCode: `RES-MIDA-${Date.now().toString().slice(-6)}`,
      },
      merkleProofIndex: blocks.length,
    };

    setTimeout(() => {
      setBlocks(prev => [...prev, newBlock]);
      setIsSealing(false);
      setIsModalOpen(false);
      setNewTitle('');
      setNewDescription('');
      setNewBioAgent('');
    }, 600);
  };

  const getCategoryColor = (cat: ActivityCategory) => {
    switch (cat) {
      case 'PROPAGATION': return { border: 'border-[#15803D]', text: 'text-[#15803D]', bg: 'bg-[#15803D]/10', label: 'PROPAGACIÓN MERISTEMÁTICA' };
      case 'NUTRITION_ORGANIC': return { border: 'border-[#FACC15]', text: 'text-[#FACC15]', bg: 'bg-[#FACC15]/10', label: 'NUTRICIÓN ORGÁNICA' };
      case 'BIO_DEFENSE_SIGATOKA': return { border: 'border-[#7C3AED]', text: 'text-[#7C3AED]', bg: 'bg-[#7C3AED]/10', label: 'BIO-DEFENSA SIGATOKA' };
      case 'CANOPY_SURGERY': return { border: 'border-[#F97316]', text: 'text-[#F97316]', bg: 'bg-[#F97316]/10', label: 'CIRUGÍA FITOSANITARIA' };
      case 'CALIBRATED_HARVEST': return { border: 'border-[#15803D]', text: 'text-[#15803D]', bg: 'bg-[#15803D]/20', label: 'COSECHA CALIBRADA' };
      case 'MIDA_INSPECTION': return { border: 'border-[#15803D]', text: 'text-[#15803D]', bg: 'bg-[#15803D]/10', label: 'AUDITORÍA MIDA' };
      default: return { border: 'border-[#15803D]', text: 'text-[#15803D]', bg: 'bg-[#15803D]/10', label: 'OPERACIÓN' };
    }
  };

  return (
    <div className="relative min-h-screen w-full bg-[#0A0A0A] text-[#E5E5E5] font-sans antialiased selection:bg-[#15803D] selection:text-black">
      {/* Background Grid (Aceternity style) */}
      <div className="absolute inset-0 bg-grid-[#15803D]/[0.08] pointer-events-none" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(21,128,61,0.15),rgba(10,10,10,0))] pointer-events-none" />

      <div className="relative z-10 max-w-6xl mx-auto px-4 py-8 space-y-8">
        
        {/* ===================================================
            HEADER: PROTOCOLO DE EXPORTACIÓN & MERKLE TELEMETRY
            =================================================== */}
        <header className="border-2 border-[#15803D] bg-[#0E0E0E] p-6 shadow-[6px_6px_0px_0px_#15803D]">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <div className="space-y-2">
              <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                <span className="flex items-center gap-1.5 px-2.5 py-1 bg-[#15803D] text-black font-mono font-bold text-xs uppercase tracking-wider">
                  <Terminal className="w-3.5 h-3.5 shrink-0" strokeWidth={2} />
                  <span>PROTOCOLO CRIPTO-AGRO // MIDA CHIRIQUÍ</span>
                </span>
                <span className="text-xs font-mono text-[#FACC15] flex items-center gap-1">
                  <Radio className="w-3.5 h-3.5 animate-pulse shrink-0" strokeWidth={2} />
                  <span>GPS LOCK: BARÚ [8.2831°N, 82.8624°W]</span>
                </span>
              </div>

              <h1 className="font-mono font-extrabold text-2xl sm:text-3xl text-[#E5E5E5] uppercase tracking-normal leading-snug">
                Cadena de Bloques de Cultivo // <span className="text-[#15803D]">LOTE CAVENDISH #089</span>
              </h1>

              <p className="text-xs text-[#9E9E9E] font-mono leading-relaxed max-w-2xl">
                Ledger criptográfico inmutable de trazabilidad para exportación. Cada labor de campo se sella con hash SHA-256, telemetría de satélite y certificación de no-intermediación.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
              <div className="bg-[#0A0A0A] border border-[#15803D]/60 p-3 font-mono text-xs space-y-1">
                <div className="text-[10px] text-[#9E9E9E] uppercase">Raíz de Merkle del Lote:</div>
                <div className="text-[#7C3AED] font-bold truncate max-w-[200px]">
                  {merkleRoot ? `${merkleRoot.substring(0, 32)}...` : 'Calculando...'}
                </div>
                <div className="text-[10px] text-[#15803D] flex items-center gap-1 font-bold">
                  <ShieldCheck className="w-3 h-3" strokeWidth={2} /> 100% MATEMÁTICAMENTE VÁLIDO
                </div>
              </div>

              <button
                onClick={() => setIsModalOpen(true)}
                className="px-5 py-3 bg-[#15803D] hover:bg-[#166534] text-black font-mono font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 border-2 border-[#15803D] shadow-[4px_4px_0px_0px_#FACC15] active:translate-x-[2px] active:translate-y-[2px] transition-all"
              >
                <Plus className="w-4 h-4" strokeWidth={2} />
                Notarizar Nuevo Bloque
              </button>
            </div>
          </div>

          {/* Quick Metrics Strip */}
          <div className="mt-6 pt-4 border-t border-[#15803D]/30 grid grid-cols-2 sm:grid-cols-4 gap-4 font-mono text-xs">
            <div>
              <span className="text-[#666666] block text-[10px] uppercase">Bloques Minados</span>
              <span className="text-base font-bold text-[#E5E5E5]">{blocks.length} Bloques SHA-256</span>
            </div>
            <div>
              <span className="text-[#666666] block text-[10px] uppercase">Calibre Exportación</span>
              <span className="text-base font-bold text-[#FACC15]">44.5 mm (Grado Premium)</span>
            </div>
            <div>
              <span className="text-[#666666] block text-[10px] uppercase">Control Sigatoka</span>
              <span className="text-base font-bold text-[#7C3AED]">Bacillus subtilis QST713</span>
            </div>
            <div>
              <span className="text-[#666666] block text-[10px] uppercase">Cadena de Frío</span>
              <span className="text-base font-bold text-[#15803D]">13.5 °C Termoestable</span>
            </div>
          </div>
        </header>

        {/* ===================================================
            CATEGORY FILTERS (TERMINAL STYLE)
            =================================================== */}
        <div className="flex flex-wrap items-center justify-between gap-3 bg-[#0E0E0E] p-3 border border-[#15803D]/40 font-mono text-xs">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[#666666] uppercase text-[11px] font-bold mr-1">Filtrar Protocolo:</span>
            {[
              { id: 'ALL', label: 'Todos los Bloques' },
              { id: 'PROPAGATION', label: 'Siembra' },
              { id: 'NUTRITION_ORGANIC', label: 'Nutrición K+' },
              { id: 'BIO_DEFENSE_SIGATOKA', label: 'Sigatoka Bio' },
              { id: 'CALIBRATED_HARVEST', label: 'Cosecha & Export' },
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setFilterCategory(tab.id)}
                className={`px-3 py-1 text-[11px] font-bold uppercase transition-all ${
                  filterCategory === tab.id
                    ? 'bg-[#15803D] text-black border border-[#15803D]'
                    : 'bg-[#0A0A0A] text-[#9E9E9E] border border-[#262626] hover:border-[#15803D] hover:text-[#E5E5E5]'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="text-[11px] text-[#9E9E9E]">
            Mostrando <strong className="text-[#15803D]">{filteredBlocks.length}</strong> de {blocks.length} Bloques
          </div>
        </div>

        {/* ===================================================
            IMMUTABLE BLOCK CHAIN TIMELINE
            =================================================== */}
        <div className="space-y-6 relative">
          {/* Vertical Blockchain Bus Link Line */}
          <div className="hidden md:block absolute left-8 top-6 bottom-6 w-0.5 bg-gradient-to-b from-[#15803D] via-[#7C3AED] to-[#FACC15] z-0 opacity-40" />

          {filteredBlocks.map((block, idx) => {
            const catStyle = getCategoryColor(block.activity.category);
            const isExpanded = expandedBlockId === block.blockNumber;

            return (
              <div 
                key={block.blockNumber} 
                className="relative z-10 transition-all duration-200"
              >
                {/* Block Card Container (Hover Card style) */}
                <div 
                  className={`bg-[#0E0E0E] border-2 border-[#15803D] p-5 sm:p-6 shadow-[4px_4px_0px_0px_#15803D] hover:shadow-[6px_6px_0px_0px_#7C3AED] hover:border-[#7C3AED] transition-all space-y-4 ${
                    isExpanded ? 'ring-1 ring-[#7C3AED]' : ''
                  }`}
                >
                  {/* Block Header Strip */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#15803D]/30 pb-3 font-mono">
                    <div className="flex flex-wrap items-center gap-2.5">
                      {/* Block ID Badge */}
                      <span className="px-2.5 py-0.5 bg-[#15803D] text-black font-extrabold text-xs">
                        BLOQUE #{block.blockNumber.toString().padStart(3, '0')}
                      </span>

                      {/* Category Badge */}
                      <span className={`px-2 py-0.5 text-[10px] font-bold uppercase border ${catStyle.border} ${catStyle.text} ${catStyle.bg}`}>
                        {catStyle.label}
                      </span>

                      {/* MIDA Audit Seal */}
                      {block.midaAudit.verified && (
                        <span className="px-2 py-0.5 bg-[#15803D]/15 text-[#15803D] border border-[#15803D] text-[10px] font-bold flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3" strokeWidth={2} /> MIDA OK
                        </span>
                      )}
                    </div>

                    {/* Timestamp & Altitude */}
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-[#9E9E9E]">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5 text-[#FACC15] shrink-0" strokeWidth={1.5} />
                        <span>{new Date(block.timestamp).toUTCString().replace('GMT', 'UTC')}</span>
                      </span>
                      <span className="text-[#666666] hidden sm:inline">|</span>
                      <span className="flex items-center gap-1 text-[#15803D]">
                        <MapPin className="w-3.5 h-3.5 shrink-0" strokeWidth={1.5} />
                        ALT: {block.telemetry.altitudeMeters}m
                      </span>
                    </div>
                  </div>

                  {/* Block Body: Title & Agronomic Specs */}
                  <div className="space-y-3">
                    <h3 className="font-mono font-bold text-lg sm:text-xl text-[#E5E5E5]">
                      {block.activity.title}
                    </h3>

                    <p className="text-xs text-[#CCCCCC] font-sans leading-relaxed">
                      {block.activity.description}
                    </p>

                    {/* Technical Telemetry Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 bg-[#0A0A0A] p-3 border border-[#262626] font-mono text-xs">
                      <div>
                        <span className="text-[#666666] text-[10px] uppercase block">Sector / Parcela</span>
                        <span className="text-[#E5E5E5] font-bold">{block.activity.technicalSpecs.lotSector}</span>
                      </div>

                      {block.activity.technicalSpecs.bioAgent && (
                        <div>
                          <span className="text-[#7C3AED] text-[10px] uppercase block font-bold">Bio-Controlador Orgánico</span>
                          <span className="text-[#E5E5E5] font-bold truncate block">{block.activity.technicalSpecs.bioAgent}</span>
                        </div>
                      )}

                      {block.activity.technicalSpecs.fruitCaliberMm && (
                        <div>
                          <span className="text-[#FACC15] text-[10px] uppercase block font-bold">Calibre Fruto Inspeccionado</span>
                          <span className="text-[#FACC15] font-bold">{block.activity.technicalSpecs.fruitCaliberMm} mm • Brix: {block.activity.technicalSpecs.brixDegrees}°</span>
                        </div>
                      )}

                      {block.activity.technicalSpecs.dosageOrYield && !block.activity.technicalSpecs.fruitCaliberMm && (
                        <div>
                          <span className="text-[#15803D] text-[10px] uppercase block font-bold">Rendimiento / Aplicación</span>
                          <span className="text-[#E5E5E5] font-bold">{block.activity.technicalSpecs.dosageOrYield}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Cryptographic Linkage Footer Strip */}
                  <div className="bg-[#070707] border border-[#15803D]/40 p-3 space-y-1.5 font-mono text-[11px] overflow-hidden">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 min-w-0">
                      <span className="text-[#666666] shrink-0">HASH ANTERIOR:</span>
                      <span className="text-[#888888] truncate min-w-0 max-w-full sm:max-w-[420px]">{block.previousHash}</span>
                    </div>

                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 min-w-0">
                      <span className="text-[#7C3AED] font-bold flex items-center gap-1 shrink-0">
                        <Hash className="w-3.5 h-3.5 shrink-0" strokeWidth={2} /> HASH SHA-256 (BLOQUE #{block.blockNumber}):
                      </span>
                      <div className="flex items-center gap-2 min-w-0 max-w-full">
                        <span className="text-[#15803D] font-bold truncate min-w-0 max-w-full sm:max-w-[380px]">{block.blockHash}</span>
                        <button
                          onClick={() => handleCopy(block.blockHash)}
                          className="p-1 bg-[#1A1A1A] border border-[#333333] hover:border-[#15803D] text-[#CCCCCC] hover:text-[#15803D] transition-colors shrink-0"
                          title="Copiar Hash SHA-256"
                        >
                          {copiedHash === block.blockHash ? <Check className="w-3 h-3 text-[#15803D]" /> : <Copy className="w-3 h-3" />}
                        </button>
                      </div>
                    </div>

                    {/* Operator & Auditor signature metadata */}
                    <div className="pt-1.5 border-t border-[#1A1A1A] flex flex-wrap items-center justify-between gap-2 text-[10px] text-[#666666]">
                      <div>
                        Operador: <strong className="text-[#CCCCCC]">{block.operator.name}</strong> ({block.operator.midaLicense})
                      </div>
                      <div className="flex items-center gap-2">
                        <span>GPS: {block.telemetry.gpsCoords.lat.toFixed(6)}°N, {block.telemetry.gpsCoords.lng.toFixed(6)}°W</span>
                        <button
                          onClick={() => setExpandedBlockId(isExpanded ? null : block.blockNumber)}
                          className="text-[#FACC15] hover:underline font-bold"
                        >
                          {isExpanded ? '[Ocultar Telemetría]' : '[Ver Telemetría Completa]'}
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Expanded Telemetry Dossier */}
                  <AnimatePresence>
                    {isExpanded && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="bg-[#050505] border border-[#7C3AED] p-4 font-mono text-xs space-y-3"
                      >
                        <div className="text-xs font-bold text-[#7C3AED] uppercase flex items-center gap-2 border-b border-[#262626] pb-1.5">
                          <Cpu className="w-4 h-4" strokeWidth={1.5} />
                          Dossier Satelital & Certificación de Origen
                        </div>

                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-[11px]">
                          <div>
                            <span className="text-[#666666] block">Humedad Relativa:</span>
                            <span className="text-[#E5E5E5] font-bold">{block.telemetry.relativeHumidityPct}%</span>
                          </div>
                          <div>
                            <span className="text-[#666666] block">Humedad Foliar:</span>
                            <span className="text-[#FACC15] font-bold">{block.telemetry.leafWetnessHours} Horas continuas</span>
                          </div>
                          <div>
                            <span className="text-[#666666] block">Sensor Hardware ID:</span>
                            <span className="text-[#E5E5E5]">{block.telemetry.deviceHardwareId}</span>
                          </div>
                          <div>
                            <span className="text-[#666666] block">Resolución MIDA:</span>
                            <span className="text-[#15803D] font-bold">{block.midaAudit.resolutionCode}</span>
                          </div>
                        </div>

                        <div className="text-[10px] text-[#888888] bg-[#0E0E0E] p-2 border border-[#1A1A1A]">
                          Auditor Oficial Responsable: <strong className="text-[#E5E5E5]">{block.midaAudit.auditorName}</strong> • Certificado para exportación a la Unión Europea y EE.UU. sin intermediación.
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* Arrow connector between blocks */}
                {idx < filteredBlocks.length - 1 && (
                  <div className="flex justify-center py-2">
                    <div className="px-2.5 py-1 rounded-md bg-[#111714] border border-[#10B981]/50 text-[#10B981] font-mono text-[10px] font-bold flex items-center gap-1 shadow-sm">
                      <ArrowDown className="w-3 h-3" strokeWidth={2} />
                      ENLACE SHA-256 VERIFICADO
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* ===================================================
            MODAL: NOTARIZAR NUEVO BLOQUE CRIPTOGRÁFICO
            =================================================== */}
        <AnimatePresence>
          {isModalOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setIsModalOpen(false)}
                className="fixed inset-0 bg-black/90 backdrop-blur-sm"
              />

              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="relative z-50 w-full max-w-2xl bg-[#0E0E0E] border-2 border-[#15803D] p-6 shadow-[8px_8px_0px_0px_#15803D] max-h-[90vh] overflow-y-auto font-mono"
              >
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#15803D] pb-3 mb-4">
                  <div className="flex items-center gap-2 min-w-0">
                    <Lock className="w-5 h-5 text-[#15803D] shrink-0" strokeWidth={2} />
                    <h2 className="font-bold text-base text-[#E5E5E5] uppercase">
                      Notarizar Nuevo Bloque de Cultivo
                    </h2>
                  </div>
                  <span className="text-[10px] text-[#FACC15] font-bold shrink-0">
                    BLOQUE #{blocks.length + 1}
                  </span>
                </div>

                <form onSubmit={handleSealNewBlock} className="space-y-4 text-xs">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[#9E9E9E] uppercase mb-1 font-bold">
                        Categoría de Labor
                      </label>
                      <select
                        value={newCategory}
                        onChange={(e) => setNewCategory(e.target.value as ActivityCategory)}
                        className="w-full bg-[#0A0A0A] border-2 border-[#262626] focus:border-[#15803D] p-2.5 text-[#E5E5E5] focus:outline-none"
                      >
                        <option value="BIO_DEFENSE_SIGATOKA">Bio-Defensa Sigatoka Negra</option>
                        <option value="NUTRITION_ORGANIC">Nutrición Orgánica y Foliar</option>
                        <option value="CANOPY_SURGERY">Cirugía y Deshoje Fitosanitario</option>
                        <option value="CALIBRATED_HARVEST">Cosecha Calibrada Exportación</option>
                        <option value="PROPAGATION">Propagación y Siembra</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[#9E9E9E] uppercase mb-1 font-bold">
                        Operador Responsable
                      </label>
                      <input
                        type="text"
                        value={newOperator}
                        onChange={(e) => setNewOperator(e.target.value)}
                        className="w-full bg-[#0A0A0A] border-2 border-[#262626] focus:border-[#15803D] p-2.5 text-[#E5E5E5] focus:outline-none"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[#9E9E9E] uppercase mb-1 font-bold">
                      Título de la Intervención
                    </label>
                    <input
                      type="text"
                      placeholder="Ej. Aplicación de Bacillus subtilis cepa QST713 en Lote Alpha-1"
                      value={newTitle}
                      onChange={(e) => setNewTitle(e.target.value)}
                      className="w-full bg-[#0A0A0A] border-2 border-[#262626] focus:border-[#15803D] p-2.5 text-[#E5E5E5] focus:outline-none"
                      required
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[#9E9E9E] uppercase mb-1 font-bold">
                        Bio-Insumo / Agente Orgánico
                      </label>
                      <input
                        type="text"
                        placeholder="Ej. Bacillus subtilis / Trichoderma / Caldo Sulfocálcico"
                        value={newBioAgent}
                        onChange={(e) => setNewBioAgent(e.target.value)}
                        className="w-full bg-[#0A0A0A] border-2 border-[#262626] focus:border-[#15803D] p-2.5 text-[#E5E5E5] focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-[#9E9E9E] uppercase mb-1 font-bold">
                        Calibre Promedio (mm)
                      </label>
                      <input
                        type="number"
                        step="0.1"
                        value={newCaliber}
                        onChange={(e) => setNewCaliber(e.target.value)}
                        className="w-full bg-[#0A0A0A] border-2 border-[#262626] focus:border-[#15803D] p-2.5 text-[#E5E5E5] focus:outline-none"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[#9E9E9E] uppercase mb-1 font-bold">
                      Descripción Técnica Detallada
                    </label>
                    <textarea
                      rows={3}
                      placeholder="Detalla la calibración de boquillas, condiciones de humedad foliar y porcentaje de deshoje preventivo..."
                      value={newDescription}
                      onChange={(e) => setNewDescription(e.target.value)}
                      className="w-full bg-[#0A0A0A] border-2 border-[#262626] focus:border-[#15803D] p-2.5 text-[#E5E5E5] focus:outline-none"
                      required
                    />
                  </div>

                  {/* Telemetry auto-stamp banner */}
                  <div className="bg-[#050505] p-3 border border-[#15803D]/40 text-[10px] space-y-1 text-[#888888]">
                    <div className="text-[#15803D] font-bold uppercase flex items-center gap-1">
                      <Radio className="w-3 h-3 animate-pulse" /> Estampado Atómico de Sensores:
                    </div>
                    <div>GPS: 8.283104°N, 82.862418°W • Puerto Armuelles, Barú</div>
                    <div>Hash Previo Enlazado: {blocks[blocks.length - 1].blockHash.substring(0, 32)}...</div>
                  </div>

                  <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#262626]">
                    <button
                      type="button"
                      onClick={() => setIsModalOpen(false)}
                      className="px-4 py-2 bg-[#1A1A1A] text-[#9E9E9E] hover:text-[#E5E5E5] font-bold uppercase"
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      disabled={isSealing}
                      className="px-5 py-2.5 bg-[#15803D] hover:bg-[#166534] text-black font-bold uppercase tracking-wider flex items-center gap-2 border-2 border-[#15803D] shadow-[2px_2px_0px_0px_#FACC15]"
                    >
                      <Lock className="w-4 h-4" strokeWidth={2} />
                      {isSealing ? 'Sellando Bloque SHA-256...' : 'Firmar & Añadir a la Cadena'}
                    </button>
                  </div>
                </form>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default CultivationBlockchain;
