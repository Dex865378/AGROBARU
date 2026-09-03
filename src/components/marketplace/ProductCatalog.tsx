import React, { useState } from 'react';
import { 
  Search, 
  Filter, 
  ShieldCheck, 
  MapPin, 
  Lock, 
  QrCode, 
  TrendingDown,
  FileCheck,
  Tag,
  Star,
  MessageSquare,
  Award,
  Eye,
  Camera,
  Boxes,
  SlidersHorizontal,
  Sparkles,
  Info,
  Cpu,
  Layers,
  ChevronDown,
  ChevronUp,
  ShoppingBag
} from 'lucide-react';
import { useAppState } from '@/context/AppStateContext';
import { ProductBatch } from '@/types';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { EscrowCheckoutModal } from './EscrowCheckoutModal';
import { BatchDetailWithEvidenceModal } from './BatchDetailWithEvidenceModal';
import { ExportPassportModal } from '@/components/traceability/ExportPassportModal';
import { BoxLabelStickerModal } from '@/components/tools/BoxLabelStickerModal';
import { BatchReviewsSection } from '@/components/reviews/BatchReviewsSection';
import { calculateReputationTier } from '@/services/reputationService';
import { useLanguage } from '@/context/LanguageContext';
import { DirectMessageModal, ChatContact } from '@/components/chat/DirectMessageModal';

export const ProductCatalog: React.FC<{ 
  onNavigateToTraceability?: (batchCode: string) => void;
  onNavigateToChat?: (contact: ChatContact) => void;
}> = ({
  onNavigateToTraceability,
  onNavigateToChat,
}) => {
  const { batches } = useAppState();
  const { language, translateDynamic } = useLanguage();

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCorregimiento, setSelectedCorregimiento] = useState<string>('ALL');
  
  // Progressive disclosure global state: 'SIMPLE' (default) vs 'TECHNICAL'
  const [globalViewMode, setGlobalViewMode] = useState<'SIMPLE' | 'TECHNICAL'>('SIMPLE');
  // Per-card toggle overrides
  const [expandedTechnicalCards, setExpandedTechnicalCards] = useState<Record<string, boolean>>({});

  // Modals state
  const [selectedBatchForCheckout, setSelectedBatchForCheckout] = useState<ProductBatch | null>(null);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [isSampleOrder, setIsSampleOrder] = useState(false);

  const [selectedBatchForDetail, setSelectedBatchForDetail] = useState<ProductBatch | null>(null);
  const [selectedBatchForPassport, setSelectedBatchForPassport] = useState<ProductBatch | null>(null);
  const [selectedBatchForSticker, setSelectedBatchForSticker] = useState<ProductBatch | null>(null);
  const [expandedReviewsBatchId, setExpandedReviewsBatchId] = useState<string | null>(null);
  const [selectedChatContact, setSelectedChatContact] = useState<ChatContact | null>(null);

  const toggleCardTechnicalView = (batchId: string) => {
    setExpandedTechnicalCards(prev => ({
      ...prev,
      [batchId]: prev[batchId] !== undefined ? !prev[batchId] : globalViewMode !== 'TECHNICAL'
    }));
  };

  const isCardTechnical = (batchId: string) => {
    if (expandedTechnicalCards[batchId] !== undefined) {
      return expandedTechnicalCards[batchId];
    }
    return globalViewMode === 'TECHNICAL';
  };

  const filteredBatches = batches.filter((b) => {
    const matchesSearch = 
      b.cropName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      b.variety.toLowerCase().includes(searchTerm.toLowerCase()) ||
      b.farmName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      b.batchCode.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesCorregimiento = 
      selectedCorregimiento === 'ALL' || b.corregimiento === selectedCorregimiento;

    return matchesSearch && matchesCorregimiento;
  });

  const handleStartEscrow = (batch: ProductBatch, isSample: boolean = false) => {
    setSelectedBatchForCheckout(batch);
    setIsSampleOrder(isSample);
    setIsCheckoutOpen(true);
  };

  // Crop image default fallbacks
  const getCropThumbnail = (cropName: string) => {
    if (cropName.toLowerCase().includes('banano')) {
      return 'https://images.unsplash.com/photo-1571771894821-ce9b6c11b08e?w=500&auto=format&fit=crop&q=80';
    }
    if (cropName.toLowerCase().includes('cacao')) {
      return 'https://images.unsplash.com/photo-1540420773420-3366772f4999?w=500&auto=format&fit=crop&q=80';
    }
    return 'https://images.unsplash.com/photo-1589883661923-6476cb0ae9f2?w=500&auto=format&fit=crop&q=80';
  };

  return (
    <div className="space-y-6 font-mono">
      {/* Top Banner & Mode Switcher */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b-2 border-[#15803D] pb-4">
        <div>
          <div className="flex items-center gap-2">
            <Badge variant="live-green" pulse>BARÚ DIRECT TRADE</Badge>
            <Badge variant="outline">MIDA BPA 2026</Badge>
          </div>
          <h2 className="font-display font-black text-2xl text-[#E5E5E5] uppercase tracking-tight mt-1">
            {language === 'en' ? 'Direct Agricultural Market // Barú' : 'Mercado Agrícola Directo de Barú'}
          </h2>
          <p className="text-xs text-[#9E9E9E] font-sans">
            {language === 'en' 
              ? 'Fair trade without middlemen: Banana, Cacao, Plantain and Fruit with Escrow and SHA-256 verification.'
              : 'Comercio justo sin intermediarios: Banano, Cacao, Plátano y Frutas de exportación en Chiriquí.'}
          </p>
        </div>

        {/* Global Progressive Disclosure View Switcher */}
        <div className="flex items-center bg-[#141414] p-1 border-2 border-[#15803D] shadow-[3px_3px_0px_0px_#15803D]">
          <button
            onClick={() => {
              setGlobalViewMode('SIMPLE');
              setExpandedTechnicalCards({});
            }}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold uppercase transition-all ${
              globalViewMode === 'SIMPLE'
                ? 'bg-[#15803D] text-black shadow-[1px_1px_0px_0px_#FACC15]'
                : 'text-[#9E9E9E] hover:text-[#E5E5E5]'
            }`}
          >
            <ShoppingBag className="w-3.5 h-3.5" />
            <span>Vista Esencial</span>
          </button>

          <button
            onClick={() => {
              setGlobalViewMode('TECHNICAL');
              setExpandedTechnicalCards({});
            }}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold uppercase transition-all ${
              globalViewMode === 'TECHNICAL'
                ? 'bg-[#FACC15] text-black shadow-[1px_1px_0px_0px_#15803D]'
                : 'text-[#9E9E9E] hover:text-[#E5E5E5]'
            }`}
          >
            <Cpu className="w-3.5 h-3.5" />
            <span>Vista Técnica / Auditoría</span>
          </button>
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div className="bg-[#0E0E0E] border-2 border-[#15803D] p-4 flex flex-col md:flex-row items-center gap-3 shadow-[4px_4px_0px_0px_#15803D]">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 absolute left-3 top-3 text-[#666666]" />
          <Input
            placeholder={language === 'en' ? 'Search by crop, farm, variety or batch code...' : 'Buscar por cultivo, finca, variedad o código de lote...'}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9 text-xs border-[#1E293B] focus-visible:border-[#15803D]"
          />
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto">
          <Filter className="w-4 h-4 text-[#15803D]" />
          <select
            value={selectedCorregimiento}
            onChange={(e) => setSelectedCorregimiento(e.target.value)}
            className="bg-[#141414] border-2 border-[#1E293B] text-[#E5E5E5] text-xs font-mono px-3 py-2 focus:border-[#15803D] focus:outline-none w-full md:w-auto"
          >
            <option value="ALL">Todos los Corregimientos de Barú</option>
            <option value="Puerto Armuelles">Puerto Armuelles</option>
            <option value="Progreso">Progreso</option>
            <option value="Baco">Baco</option>
            <option value="Limones">Limones</option>
            <option value="Rodolfo Aguilar Delgado">Rodolfo Aguilar Delgado</option>
          </select>
        </div>
      </div>

      {/* Batches Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {filteredBatches.map((batch) => {
          const tierInfo = calculateReputationTier(batch.producerReputation || 99.4, 12);
          const isReviewsOpen = expandedReviewsBatchId === batch.id;
          const isTech = isCardTechnical(batch.id);
          const percentageSold = Math.min(100, Math.max(0, Math.round(((batch.quantityKg - batch.availableKg) / (batch.quantityKg || 1)) * 100)));

          return (
            <div
              key={batch.id}
              className="bg-[#0E0E0E] border-2 border-[#15803D] p-5 space-y-4 shadow-[4px_4px_0px_0px_#15803D] flex flex-col justify-between transition-all"
            >
              <div className="space-y-3">
                {/* Header with Switch Toggle & Badges */}
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#1E293B] pb-3">
                  <div className="flex items-center gap-2">
                    <Badge variant="live-green" pulse>{batch.batchCode}</Badge>
                    <Badge variant="outline">{batch.corregimiento}</Badge>
                  </div>

                  {/* Individual Card Toggle Switch */}
                  <button
                    onClick={() => toggleCardTechnicalView(batch.id)}
                    className={`px-2 py-0.5 text-[10px] font-bold uppercase border transition-all flex items-center gap-1 ${
                      isTech
                        ? 'bg-[#FACC15] text-black border-[#FACC15]'
                        : 'bg-[#141414] text-[#9E9E9E] border-[#1E293B] hover:text-[#E5E5E5]'
                    }`}
                  >
                    <span>{isTech ? '🔬 Modo Técnico' : '🛍️ Modo Esencial'}</span>
                    {isTech ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                  </button>
                </div>

                {/* VISTA ESENCIAL (DEFAULT - PÚBLICO GENERAL) */}
                <div className="space-y-3">
                  {/* Title & Origin */}
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        {batch.status === 'sold_out' || batch.availableKg <= 0 ? (
                          <Badge variant="destructive" className="text-[9px]">🔴 AGOTADO</Badge>
                        ) : batch.status === 'in_production' ? (
                          <Badge variant="live-yellow" pulse className="text-[9px]">🟡 EN PRODUCCIÓN</Badge>
                        ) : batch.status === 'reserved' ? (
                          <Badge variant="purple" className="text-[9px]">🔒 RESERVADO</Badge>
                        ) : (
                          <Badge variant="live-green" pulse className="text-[9px]">🟢 DISPONIBLE</Badge>
                        )}
                        <span className="text-[10px] text-[#666666] font-bold">CALIDAD: {batch.qualityGrade}</span>
                      </div>

                      <h3 className="font-display font-black text-xl text-[#E5E5E5] uppercase">
                        {translateDynamic(batch.cropName)} — {translateDynamic(batch.variety)}
                      </h3>
                      
                      <div className="text-xs text-[#9E9E9E] mt-0.5 flex items-center gap-2 font-sans">
                        <MapPin className="w-3.5 h-3.5 text-[#15803D]" />
                        <span>Finca {batch.farmName} • <strong>{batch.producerName}</strong> ({batch.corregimiento})</span>
                      </div>
                    </div>

                    {/* Thumbnail Image */}
                    <div className="w-16 h-16 shrink-0 border-2 border-[#1E293B] overflow-hidden bg-[#141414]">
                      <img 
                        src={getCropThumbnail(batch.cropName)} 
                        alt={batch.cropName}
                        className="w-full h-full object-cover" 
                      />
                    </div>
                  </div>

                  {/* Clean Price & Available Stock Block */}
                  <div className="bg-[#141414] p-3 border border-[#1E293B] flex items-center justify-between">
                    <div>
                      <div className="text-[10px] text-[#9E9E9E] uppercase font-bold">Precio Final Directo:</div>
                      <div className="text-xl font-display font-black text-[#15803D] mt-0.5">
                        ${batch.pricePerKgUsd.toFixed(2)} <span className="text-xs text-[#CCCCCC] font-normal">/ Kg</span>
                      </div>
                      <div className="text-[10px] text-[#FACC15] font-bold">
                        ~${(batch.pricePerKgUsd * 18.14).toFixed(2)} por caja export (40 lbs)
                      </div>
                    </div>

                    <div className="text-right">
                      <div className="text-[10px] text-[#9E9E9E] uppercase font-bold">Stock Disponible:</div>
                      <div className="text-sm font-bold text-[#E5E5E5] mt-0.5">
                        {batch.availableKg.toLocaleString()} Kg
                      </div>
                      <div className="text-[10px] text-[#9E9E9E]">
                        ~{Math.round(batch.availableKg / 18.14)} Cajas
                      </div>
                    </div>
                  </div>

                  {/* Stock Level Meter */}
                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-[10px] text-[#9E9E9E]">
                      <span>Disponibilidad en Barú:</span>
                      <span className="text-[#FACC15] font-bold">
                        {batch.availableKg <= 0 ? '100% Vendido' : `${percentageSold}% Vendido`}
                      </span>
                    </div>
                    <div className="w-full h-1.5 bg-[#0A0A0A] border border-[#1E293B] overflow-hidden flex">
                      <div 
                        className="h-full bg-gradient-to-r from-[#15803D] to-[#FACC15] transition-all duration-300"
                        style={{ width: `${Math.max(0, Math.min(100, (batch.availableKg / (batch.quantityKg || 1)) * 100))}%` }}
                      />
                    </div>
                  </div>
                </div>

                {/* VISTA AVANZADA / TÉCNICA (RENDERIZADO CONDICIONAL POR TOGGLE) */}
                {isTech && (
                  <div className="pt-2 border-t border-[#1E293B] space-y-3 animate-fadeIn">
                    <div className="bg-[#0A0A0A] border border-[#FACC15] p-3 space-y-2 text-xs">
                      <div className="flex items-center justify-between text-[#FACC15] font-bold border-b border-[#1E293B] pb-1">
                        <span className="flex items-center gap-1">
                          <Cpu className="w-3.5 h-3.5" /> Desglose Interno de Liquidación FOB:
                        </span>
                        <Badge variant="yellow" className="text-[9px]">Transparente 100%</Badge>
                      </div>

                      <div className="space-y-1 text-[11px] text-[#9E9E9E]">
                        <div className="flex justify-between">
                          <span>• Pago Neto al Productor (97%):</span>
                          <span className="text-[#E5E5E5] font-bold">${(batch.pricePerKgUsd * 0.97).toFixed(2)}/kg</span>
                        </div>
                        <div className="flex justify-between">
                          <span>• Cobertura Custodia Escrow & Arbitraje MIDA (3%):</span>
                          <span className="text-[#15803D] font-bold">${(batch.pricePerKgUsd * 0.03).toFixed(2)}/kg</span>
                        </div>
                        <div className="flex justify-between">
                          <span>• Flete Estimado Reefer Barú → Puerto FOB:</span>
                          <span className="text-[#CCCCCC]">$0.04/kg (13.5°C constante)</span>
                        </div>
                      </div>
                    </div>

                    {/* Agronomic Technical Specs */}
                    <div className="bg-[#141414] p-3 border border-[#7C3AED] space-y-1.5 text-[11px]">
                      <div className="text-[#7C3AED] font-bold uppercase flex items-center justify-between">
                        <span>Ficha Técnica de Cultivo & Trazabilidad:</span>
                        <span className="text-[9px] text-[#9E9E9E]">DATUM WGS84</span>
                      </div>
                      <div className="text-[#CCCCCC] space-y-0.5">
                        <div>• <strong>Calibre:</strong> 39 - 44 mm | <strong>Edad:</strong> 11 semanas</div>
                        <div>• <strong>Tratamiento Corona:</strong> Alumbre 1.5% | <strong>Inocuidad:</strong> BPA-BARU-2026</div>
                        <div>• <strong>GPS Finca:</strong> {batch.originCoordinates.lat.toFixed(5)}°N, {batch.originCoordinates.lng.toFixed(5)}°W</div>
                        <div>• <strong>Hash Raíz Merkle:</strong> <span className="font-mono text-[9px] text-[#15803D]">{batch.rootMerkleHash ? batch.rootMerkleHash.substring(0, 20) + '...' : '0x7e29...91ba'}</span></div>
                      </div>
                    </div>

                    {/* Export Documents Buttons */}
                    <div className="flex items-center gap-2 pt-1">
                      <button
                        onClick={() => setSelectedBatchForPassport(batch)}
                        className="flex-1 px-2.5 py-1.5 bg-[#141414] hover:bg-[#1A1A1A] border border-[#7C3AED] text-[#E5E5E5] text-[10px] font-mono flex items-center justify-center gap-1.5 shadow-[2px_2px_0px_0px_#7C3AED]"
                      >
                        <FileCheck className="w-3.5 h-3.5 text-[#7C3AED]" />
                        <span>Pasaporte PDF</span>
                      </button>

                      <button
                        onClick={() => setSelectedBatchForSticker(batch)}
                        className="flex-1 px-2.5 py-1.5 bg-[#141414] hover:bg-[#1A1A1A] border border-[#FACC15] text-[#E5E5E5] text-[10px] font-mono flex items-center justify-center gap-1.5 shadow-[2px_2px_0px_0px_#FACC15]"
                      >
                        <Tag className="w-3.5 h-3.5 text-[#FACC15]" />
                        <span>Sticker QR 4"x6"</span>
                      </button>
                    </div>
                  </div>
                )}

                {/* Quick Photos Trigger */}
                <div className="pt-1">
                  <button
                    onClick={() => setSelectedBatchForDetail(batch)}
                    className="w-full flex items-center justify-center gap-1.5 text-xs text-[#FACC15] hover:text-white bg-[#141414] hover:bg-[#1A1A1A] border border-[#FACC15] py-1.5 transition-all shadow-[2px_2px_0px_0px_#FACC15]"
                  >
                    <Camera className="w-3.5 h-3.5 text-[#FACC15]" />
                    <span>Ver Fotos del Cultivo en 4 Etapas</span>
                  </button>
                </div>

                {/* Reviews Toggle Section */}
                <div>
                  <button
                    onClick={() => setExpandedReviewsBatchId(isReviewsOpen ? null : batch.id)}
                    className="text-[11px] font-mono text-[#9E9E9E] hover:text-[#FACC15] flex items-center gap-1.5"
                  >
                    <MessageSquare className="w-3.5 h-3.5 text-[#FACC15]" />
                    <span>{isReviewsOpen ? 'Ocultar Reseñas' : 'Ver Reseñas de Compradores (2)'}</span>
                  </button>

                  {isReviewsOpen && (
                    <div className="mt-3 pt-3 border-t border-[#1E293B]">
                      <BatchReviewsSection 
                        batchId={batch.id} 
                        producerName={batch.producerName} 
                      />
                    </div>
                  )}
                </div>
              </div>

              {/* Action Buttons Footer */}
              <div className="pt-4 border-t border-[#1E293B] flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => onNavigateToTraceability?.(batch.batchCode)}
                    className="text-xs font-mono text-[#9E9E9E] hover:text-[#7C3AED] flex items-center gap-1.5 underline decoration-[#7C3AED] underline-offset-4 transition-colors"
                  >
                    <QrCode className="w-3.5 h-3.5 text-[#7C3AED]" strokeWidth={1.5} />
                    Auditar
                  </button>

                  <button
                    onClick={() => {
                      const contact: ChatContact = {
                        id: batch.farmId || batch.id,
                        name: batch.producerName,
                        corregimiento: batch.corregimiento,
                        reputation: batch.producerReputation || 99.4
                      };
                      if (onNavigateToChat) {
                        onNavigateToChat(contact);
                      } else {
                        setSelectedChatContact(contact);
                      }
                    }}
                    className="text-xs font-mono text-[#15803D] hover:text-[#FACC15] flex items-center gap-1 transition-colors"
                    title={`Chatear directamente con ${batch.producerName}`}
                  >
                    <MessageSquare className="w-3.5 h-3.5 text-[#15803D]" />
                    <span>Chat Directo</span>
                  </button>
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    onClick={() => handleStartEscrow(batch, true)}
                    variant="outline"
                    size="sm"
                    className="text-xs border-[#FACC15] text-[#FACC15] hover:bg-[#FACC15] hover:text-black"
                  >
                    Pedir Muestra (18 kg)
                  </Button>

                  <Button
                    onClick={() => handleStartEscrow(batch, false)}
                    variant="default"
                    size="sm"
                    className="flex items-center gap-1.5 text-xs font-bold"
                    disabled={batch.availableKg <= 0 || batch.status === 'sold_out'}
                  >
                    <Lock className="w-3.5 h-3.5 text-black" strokeWidth={1.5} />
                    {batch.availableKg > 0 && batch.status !== 'sold_out' ? 'Comprar con Escrow' : 'Lote Agotado'}
                  </Button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Batch Detail with 4-Stage Crop Evidence Photos Modal */}
      <BatchDetailWithEvidenceModal
        batch={selectedBatchForDetail}
        isOpen={!!selectedBatchForDetail}
        onClose={() => setSelectedBatchForDetail(null)}
        onOpenEscrowCheckout={(batch) => handleStartEscrow(batch, false)}
        onRequestSample={(batch) => handleStartEscrow(batch, true)}
      />

      {/* Escrow Checkout Modal */}
      <EscrowCheckoutModal
        isOpen={isCheckoutOpen}
        onClose={() => setIsCheckoutOpen(false)}
        batch={selectedBatchForCheckout}
        isSampleOrder={isSampleOrder}
      />

      {/* Export Passport Modal */}
      <ExportPassportModal
        batch={selectedBatchForPassport}
        open={!!selectedBatchForPassport}
        onOpenChange={(open) => !open && setSelectedBatchForPassport(null)}
      />

      {/* Zebra Box Label Sticker Modal */}
      <BoxLabelStickerModal
        batch={selectedBatchForSticker}
        open={!!selectedBatchForSticker}
        onOpenChange={(open) => !open && setSelectedBatchForSticker(null)}
      />

      {/* Direct Chat with Seller Modal */}
      <DirectMessageModal
        isOpen={!!selectedChatContact}
        onClose={() => setSelectedChatContact(null)}
        contact={selectedChatContact}
      />
    </div>
  );
};
