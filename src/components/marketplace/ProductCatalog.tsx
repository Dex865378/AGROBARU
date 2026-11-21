import React, { useState, useMemo } from 'react';
import { 
  Search, 
  Filter, 
  ShieldCheck, 
  MapPin, 
  Lock, 
  QrCode, 
  FileCheck,
  Tag,
  MessageSquare,
  Camera,
  Cpu,
  ChevronDown,
  ChevronUp,
  ShoppingBag,
  ShoppingCart,
  Trash2,
  Clock,
  AlertCircle,
  Timer,
  Heart,
  ArrowUpDown,
  Plus
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
import { useLanguage } from '@/context/LanguageContext';
import { DirectMessageModal, ChatContact } from '@/components/chat/DirectMessageModal';
import { DeleteBatchModal } from './DeleteBatchModal';
import { formatTimeAgo, getFreshnessTier, getRemainingPurgeHours } from '@/services/dateUtils';
import { SafeImage } from '@/components/ui/SafeImage';
import { resolveProductImage } from '@/lib/imageFallbacks';
import { PublicProfileModal, PublicProfileTarget } from '@/components/profile/PublicProfileModal';

type CropCategory = 'ALL' | 'BANANO' | 'PLATANO' | 'CACAO' | 'FRUTAS' | 'AVAILABLE' | 'FAVORITES';
type SortOption = 'newest' | 'price_asc' | 'stock_desc' | 'reputation_desc';

export const ProductCatalog: React.FC<{ 
  onNavigateToTraceability?: (batchCode: string) => void;
  onNavigateToChat?: (contact: ChatContact) => void;
}> = ({
  onNavigateToTraceability,
  onNavigateToChat,
}) => {
  const {
    batches,
    deleteProductBatch,
    addToCart,
    favorites,
    toggleFavorite,
    currentUser,
    currentRole,
    farms
  } = useAppState();
  const { language, translateDynamic } = useLanguage();

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCorregimiento, setSelectedCorregimiento] = useState<string>('ALL');
  const [cropCategory, setCropCategory] = useState<CropCategory>('ALL');
  const [sortBy, setSortBy] = useState<SortOption>('newest');

  // Progressive disclosure global state: 'SIMPLE' (default) vs 'TECHNICAL'
  const [globalViewMode, setGlobalViewMode] = useState<'SIMPLE' | 'TECHNICAL'>('SIMPLE');
  const [expandedTechnicalCards, setExpandedTechnicalCards] = useState<Record<string, boolean>>({});

  // Modals state
  const [selectedBatchForCheckout, setSelectedBatchForCheckout] = useState<ProductBatch | null>(null);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [isSampleOrder, setIsSampleOrder] = useState(false);
  const [batchToDelete, setBatchToDelete] = useState<ProductBatch | null>(null);

  const [selectedBatchForDetail, setSelectedBatchForDetail] = useState<ProductBatch | null>(null);
  const [selectedBatchForPassport, setSelectedBatchForPassport] = useState<ProductBatch | null>(null);
  const [selectedBatchForSticker, setSelectedBatchForSticker] = useState<ProductBatch | null>(null);
  const [expandedReviewsBatchId, setExpandedReviewsBatchId] = useState<string | null>(null);
  const [selectedChatContact, setSelectedChatContact] = useState<ChatContact | null>(null);
  const [selectedPublicProfile, setSelectedPublicProfile] = useState<PublicProfileTarget | null>(null);

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

  const isBatchOwner = (batch: ProductBatch) => {
    if (!currentUser || currentRole === 'buyer') return false;
    // El UID es la fuente de verdad cuando el lote fue publicado por esta cuenta.
    if (batch.producerId) return batch.producerId === currentUser.id;

    const normalize = (value?: string) =>
      (value || '')
        .trim()
        .toLowerCase()
        .replace(/^(don|doña|dona|sr|sra)\.?\s+/, '');
    const namesMatch = (left?: string, right?: string) => {
      const a = normalize(left);
      const b = normalize(right);
      return Boolean(a && b) && (a === b || (a.length > 3 && (a.includes(b) || b.includes(a))));
    };
    const farm = farms.find((item) => item.id === batch.farmId);
    if (farm) {
      return farm.ownerId === currentUser.id || namesMatch(farm.ownerName, currentUser.name);
    }

    return (
      namesMatch(currentUser.name, batch.producerName) ||
      (Boolean(currentUser.username) &&
        normalize(currentUser.username) === normalize(batch.producerUsername))
    );
  };

  const filteredBatches = useMemo(() => {
    const filtered = batches.filter((b) => {
      const q = searchTerm.toLowerCase();
      const matchesSearch = 
        b.cropName.toLowerCase().includes(q) ||
        b.variety.toLowerCase().includes(q) ||
        b.farmName.toLowerCase().includes(q) ||
        b.producerName.toLowerCase().includes(q) ||
        b.batchCode.toLowerCase().includes(q);

      const matchesCorregimiento = 
        selectedCorregimiento === 'ALL' || b.corregimiento === selectedCorregimiento;

      const cropLower = b.cropName.toLowerCase();
      const matchesCategory =
        cropCategory === 'ALL' ? true :
        cropCategory === 'BANANO' ? cropLower.includes('banano') :
        cropCategory === 'PLATANO' ? (cropLower.includes('plátano') || cropLower.includes('platano')) :
        cropCategory === 'CACAO' ? cropLower.includes('cacao') :
        cropCategory === 'FRUTAS' ? (!cropLower.includes('banano') && !cropLower.includes('plátano') && !cropLower.includes('platano') && !cropLower.includes('cacao')) :
        cropCategory === 'AVAILABLE' ? (b.availableKg > 0 && b.status !== 'sold_out') :
        cropCategory === 'FAVORITES' ? favorites.includes(b.id) :
        true;

      return matchesSearch && matchesCorregimiento && matchesCategory;
    });

    return [...filtered].sort((a, b) => {
      if (sortBy === 'price_asc') return a.pricePerKgUsd - b.pricePerKgUsd;
      if (sortBy === 'stock_desc') return b.availableKg - a.availableKg;
      if (sortBy === 'reputation_desc') return (b.producerReputation || 99) - (a.producerReputation || 99);
      const tA = new Date(a.createdAt || 0).getTime();
      const tB = new Date(b.createdAt || 0).getTime();
      return tB - tA;
    });
  }, [batches, searchTerm, selectedCorregimiento, cropCategory, sortBy, favorites]);

  const handleStartEscrow = (batch: ProductBatch, isSample: boolean = false) => {
    setSelectedBatchForCheckout(batch);
    setIsSampleOrder(isSample);
    setIsCheckoutOpen(true);
  };

  const getCropThumbnail = (batch: ProductBatch) => {
    return resolveProductImage(batch.images?.[0], batch.cropName);
  };

  const categoryPills: { id: CropCategory; label: string }[] = [
    { id: 'ALL', label: 'Todos los Lotes' },
    { id: 'BANANO', label: 'Banano' },
    { id: 'PLATANO', label: 'Plátano' },
    { id: 'CACAO', label: 'Cacao' },
    { id: 'FRUTAS', label: 'Papaya y Frutas' },
    { id: 'AVAILABLE', label: 'Solo Disponibles' },
    { id: 'FAVORITES', label: `Favoritos (${favorites.length})` },
  ];

  return (
    <div className="space-y-6 font-sans">
      {/* Top Banner & View Mode Switcher */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-emerald-500/20 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <Badge variant="live-green">Comercio Directo Barú</Badge>
            <Badge variant="outline">Certificación MIDA</Badge>
          </div>
          <h2 className="font-display font-bold text-2xl text-slate-100 tracking-normal leading-snug mt-1.5">
            {language === 'en' ? 'Direct Agricultural Market — Barú' : 'Mercado Agrícola Directo de Barú'}
          </h2>
          <p className="text-xs text-slate-400">
            {language === 'en' 
              ? 'Direct trade with verified harvest freshness, real-time stock, and protected Escrow payments.'
              : 'Compra directa a productores verificados con fecha real de frescura, carrito multi-lote y pago protegido.'}
          </p>
        </div>

        {/* View Mode Switcher */}
        <div className="inline-flex items-center rounded-xl bg-[#111714] p-1 border border-emerald-500/20 self-start">
          <button
            onClick={() => {
              setGlobalViewMode('SIMPLE');
              setExpandedTechnicalCards({});
            }}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              globalViewMode === 'SIMPLE'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-100'
            }`}
          >
            <ShoppingBag className="w-3.5 h-3.5" />
            <span>Vista Simple</span>
          </button>

          <button
            onClick={() => {
              setGlobalViewMode('TECHNICAL');
              setExpandedTechnicalCards({});
            }}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              globalViewMode === 'TECHNICAL'
                ? 'bg-amber-500 text-slate-950 shadow-sm'
                : 'text-slate-400 hover:text-slate-100'
            }`}
          >
            <Cpu className="w-3.5 h-3.5" />
            <span>Detalles Técnicos</span>
          </button>
        </div>
      </div>

      {/* Search, Filter & Sort Controls */}
      <div className="bg-[#111714] border border-emerald-500/20 rounded-xl p-4 space-y-3">
        <div className="flex flex-col md:flex-row items-center gap-3">
          <div className="relative flex-1 w-full">
            <Search className="w-4 h-4 absolute left-3 top-3 text-slate-500" />
            <Input
              placeholder={language === 'en' ? 'Search by crop, farm, variety or batch code...' : 'Buscar por producto, finca, productor o código de lote...'}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 w-full md:w-auto">
            <div className="flex items-center gap-1.5 min-w-0 md:flex-initial">
              <Filter className="w-4 h-4 text-emerald-400 shrink-0" />
              <select
                value={selectedCorregimiento}
                onChange={(e) => setSelectedCorregimiento(e.target.value)}
                className="h-10 rounded-lg bg-[#0B100D] border border-slate-700/80 text-slate-200 text-xs px-3 focus:border-emerald-500 focus:outline-none w-full md:w-auto"
              >
                <option value="ALL">Todos los Corregimientos</option>
                <option value="Puerto Armuelles">Puerto Armuelles</option>
                <option value="Progreso">Progreso</option>
                <option value="Baco">Baco</option>
                <option value="Limones">Limones</option>
                <option value="Rodolfo Aguilar Delgado">Rodolfo Aguilar Delgado</option>
              </select>
            </div>

            <div className="flex items-center gap-1.5 min-w-0 md:flex-initial">
              <ArrowUpDown className="w-4 h-4 text-amber-400 shrink-0" />
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as SortOption)}
                className="h-10 rounded-lg bg-[#0B100D] border border-slate-700/80 text-slate-200 text-xs px-3 focus:border-emerald-500 focus:outline-none w-full md:w-auto"
              >
                <option value="newest">Más recientes primero</option>
                <option value="price_asc">Menor precio por Kg</option>
                <option value="stock_desc">Mayor inventario disponible</option>
                <option value="reputation_desc">Mejor calificación</option>
              </select>
            </div>
          </div>
        </div>

        {/* Category Pills */}
        <div className="flex flex-wrap items-center gap-1.5 pt-1 border-t border-slate-800/80">
          {categoryPills.map((pill) => {
            const active = cropCategory === pill.id;
            return (
              <button
                key={pill.id}
                onClick={() => setCropCategory(pill.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  active
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'bg-[#0B100D] text-slate-400 border border-slate-800 hover:text-slate-200 hover:border-slate-700'
                }`}
              >
                {pill.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Empty State */}
      {filteredBatches.length === 0 && (
        <div className="bg-[#111714] border border-slate-800 rounded-xl p-10 text-center space-y-3">
          <ShoppingBag className="w-8 h-8 text-slate-500 mx-auto" />
          <h3 className="font-display font-bold text-base text-slate-200">
            No se encontraron lotes con los filtros actuales
          </h3>
          <p className="text-xs text-slate-400 max-w-md mx-auto">
            Prueba limpiando la búsqueda o seleccionando otro corregimiento o categoría de cultivo.
          </p>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setSearchTerm('');
              setSelectedCorregimiento('ALL');
              setCropCategory('ALL');
            }}
          >
            Restablecer Filtros
          </Button>
        </div>
      )}

      {/* Batches Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {filteredBatches.map((batch) => {
          const isReviewsOpen = expandedReviewsBatchId === batch.id;
          const isTech = isCardTechnical(batch.id);
          const percentageSold = Math.min(100, Math.max(0, Math.round(((batch.quantityKg - batch.availableKg) / (batch.quantityKg || 1)) * 100)));
          const isSoldOut = batch.availableKg <= 0 || batch.status === 'sold_out';
          const freshness = getFreshnessTier(batch.createdAt);
          const publishedTime = formatTimeAgo(batch.createdAt);
          const imageUpdatedTime = formatTimeAgo(batch.imageUpdatedAt || batch.updatedAt || batch.createdAt);
          const purgeCountdown = getRemainingPurgeHours(batch.soldOutAt, batch.autoPurgeHours || 24);
          const isFavorite = favorites.includes(batch.id);
          const canManageBatch = isBatchOwner(batch);

          return (
            <div
              key={batch.id}
              className="bg-[#111714] border border-emerald-500/20 hover:border-emerald-500/45 rounded-xl p-5 space-y-4 shadow-lg shadow-black/25 flex flex-col justify-between transition-all"
            >
              <div className="space-y-3.5">
                {/* Header with Switch Toggle & Favorite */}
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800/80 pb-3">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-[11px] font-semibold px-2.5 py-0.5 rounded-md bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                      {batch.batchCode}
                    </span>
                    <Badge variant="outline">{batch.corregimiento}</Badge>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => toggleFavorite(batch.id)}
                      className={`p-1.5 rounded-lg border transition-colors ${
                        isFavorite
                          ? 'bg-red-500/15 border-red-500/40 text-red-400'
                          : 'bg-[#0B100D] border-slate-800 text-slate-400 hover:text-slate-200'
                      }`}
                      title={isFavorite ? 'Quitar de favoritos' : 'Guardar en favoritos'}
                    >
                      <Heart className={`w-3.5 h-3.5 ${isFavorite ? 'fill-current' : ''}`} />
                    </button>

                    <button
                      onClick={() => toggleCardTechnicalView(batch.id)}
                      className={`px-2.5 py-1 rounded-lg text-[11px] font-medium border transition-all flex items-center gap-1 ${
                        isTech
                          ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                          : 'bg-[#0B100D] text-slate-400 border-slate-800 hover:text-slate-200'
                      }`}
                    >
                      <span>{isTech ? 'Detalles Técnicos' : 'Vista Simple'}</span>
                      {isTech ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                    </button>
                  </div>
                </div>

                {/* Freshness & Timestamp Transparency Bar */}
                <div className="bg-[#0B100D] border border-slate-800/90 rounded-lg px-3 py-2 flex flex-wrap items-center justify-between gap-2 text-[11px]">
                  <span className={`px-2 py-0.5 rounded border text-[10px] font-medium ${freshness.badgeClass}`}>
                    {freshness.label}
                  </span>
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-slate-400">
                    <span className="flex items-center gap-1" title="Fecha de publicación en el portal">
                      <Clock className="w-3 h-3 text-emerald-400" />
                      <span>Publicado: <strong className="text-slate-200">{publishedTime}</strong></span>
                    </span>
                    <span className="flex items-center gap-1" title="Última actualización de fotografías">
                      <Camera className="w-3 h-3 text-violet-400" />
                      <span>Fotos: <strong className="text-slate-200">{imageUpdatedTime}</strong></span>
                    </span>
                  </div>
                </div>

                {/* Sold Out Notice with Auto-Purge Countdown */}
                {isSoldOut && (
                  <div className="bg-red-500/10 border border-red-500/40 rounded-lg p-3 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-xs">
                    <div className="flex items-start gap-2 text-red-200">
                      <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                      <div>
                        <div className="font-semibold text-white flex items-center gap-2">
                          <span>Lote 100% Vendido</span>
                          <span className="text-[10px] bg-red-600 text-white px-1.5 py-0.5 rounded font-semibold">Sin Stock</span>
                        </div>
                        <div className="text-[11px] text-amber-200 flex items-center gap-1 mt-0.5">
                          <Timer className="w-3.5 h-3.5 text-amber-400" />
                          <span>{purgeCountdown.displayText || 'Autolimpieza en 24 horas'} (evita saturación)</span>
                        </div>
                      </div>
                    </div>

                    {canManageBatch && (
                      <Button
                        onClick={() => setBatchToDelete(batch)}
                        variant="destructive"
                        size="sm"
                        className="text-[11px] min-h-8 h-auto py-1 px-2.5 flex items-center gap-1 shrink-0"
                      >
                        <Trash2 className="w-3 h-3" />
                        Eliminar Ahora
                      </Button>
                    )}
                  </div>
                )}

                {/* Title, Status & Thumbnail */}
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2 mb-1.5">
                      {batch.status === 'sold_out' || batch.availableKg <= 0 ? (
                        <Badge variant="destructive">Agotado</Badge>
                      ) : batch.status === 'in_production' ? (
                        <Badge variant="live-yellow">En Producción</Badge>
                      ) : batch.status === 'reserved' ? (
                        <Badge variant="purple">Reservado</Badge>
                      ) : (
                        <Badge variant="live-green">Disponible</Badge>
                      )}
                      <span className="text-[11px] text-slate-400 font-medium">
                        {batch.qualityGrade}
                      </span>
                    </div>

                    <h3 className="font-display font-bold text-lg text-slate-100 leading-snug break-words">
                      {translateDynamic(batch.cropName)} — {translateDynamic(batch.variety)}
                    </h3>
                    
                    <div className="text-xs text-slate-400 mt-1 flex items-center gap-1.5 min-w-0">
                      <MapPin className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                      <span className="break-words">
                        {batch.farmName} •{' '}
                        <button
                          type="button"
                          onClick={() =>
                            setSelectedPublicProfile({
                              id: batch.producerId || batch.farmId,
                              name: batch.producerName,
                              role: 'productor',
                              location: batch.corregimiento,
                              reputation: batch.producerReputation,
                            })
                          }
                          className="text-slate-200 font-bold hover:text-emerald-300 underline decoration-emerald-500/30 underline-offset-2"
                          title={`Ver perfil de ${batch.producerName}`}
                        >
                          {batch.producerName}
                        </button>
                      </span>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => setSelectedBatchForDetail(batch)}
                    className="w-20 h-20 rounded-lg shrink-0 border border-slate-800 overflow-hidden bg-[#0B100D] group"
                    title="Ver fotos del producto"
                  >
                    <SafeImage
                      src={getCropThumbnail(batch)}
                      alt={batch.cropName}
                      fallbackType="product"
                      cropHint={batch.cropName}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                    />
                  </button>
                </div>

                {/* Price & Stock Block */}
                <div className="bg-[#161E19] rounded-xl p-3.5 border border-slate-800/90 flex flex-wrap items-center justify-between gap-3">
                  <div className="min-w-0">
                    <div className="text-[11px] text-slate-400">Precio Directo Finca</div>
                    <div className="text-xl font-mono font-bold text-emerald-400 mt-0.5">
                      ${batch.pricePerKgUsd.toFixed(2)} <span className="text-xs text-slate-300 font-normal">/ Kg</span>
                    </div>
                    <div className="text-[11px] text-amber-300 font-mono">
                      ~${(batch.pricePerKgUsd * 18.14).toFixed(2)} por caja (40 lb)
                    </div>
                  </div>

                  <div className="text-left sm:text-right min-w-0">
                    <div className="text-[11px] text-slate-400">Inventario Actual</div>
                    <div className="text-sm font-mono font-bold text-slate-100 mt-0.5">
                      {batch.availableKg.toLocaleString()} Kg
                    </div>
                    <div className="text-[11px] text-slate-400 font-mono">
                      ~{Math.round(batch.availableKg / 18.14)} Cajas
                    </div>
                  </div>
                </div>

                {/* Stock Level Meter */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-[11px] text-slate-400">
                    <span>Progreso de venta del lote</span>
                    <span className="text-amber-300 font-mono font-semibold">
                      {batch.availableKg <= 0 ? '100% Vendido' : `${percentageSold}% Vendido`}
                    </span>
                  </div>
                  <div className="w-full h-1.5 rounded-full bg-[#0B100D] overflow-hidden flex">
                    <div 
                      className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-amber-400 transition-all duration-300"
                      style={{ width: `${Math.max(0, Math.min(100, (batch.availableKg / (batch.quantityKg || 1)) * 100))}%` }}
                    />
                  </div>
                </div>

                {/* VISTA AVANZADA / TÉCNICA (OPCIONAL) */}
                {isTech && (
                  <div className="pt-3 border-t border-slate-800 space-y-3">
                    <div className="bg-[#0B100D] border border-amber-500/30 rounded-lg p-3 space-y-2 text-xs">
                      <div className="flex items-center justify-between text-amber-300 font-semibold border-b border-slate-800 pb-1.5">
                        <span className="flex items-center gap-1.5">
                          <Cpu className="w-3.5 h-3.5" /> Desglose de Precio y Custodia
                        </span>
                        <Badge variant="yellow">100% Transparente</Badge>
                      </div>

                      <div className="space-y-1 text-[11px] text-slate-400">
                        <div className="flex justify-between">
                          <span>Pago neto al productor (98.5%):</span>
                          <span className="text-slate-100 font-mono font-semibold">${(batch.pricePerKgUsd * 0.985).toFixed(2)}/kg</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Custodia Escrow y respaldo MIDA (1.5%):</span>
                          <span className="text-emerald-400 font-mono font-semibold">${(batch.pricePerKgUsd * 0.015).toFixed(2)}/kg</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Flete estimado refrigerado a puerto:</span>
                          <span className="text-slate-300 font-mono">$0.04/kg (13.5 °C)</span>
                        </div>
                      </div>
                    </div>

                    <div className="bg-[#161E19] rounded-lg p-3 border border-violet-500/25 space-y-1.5 text-[11px]">
                      <div className="text-violet-300 font-semibold flex items-center justify-between">
                        <span>Especificaciones de Cultivo y Trazabilidad</span>
                        <span className="text-[10px] font-mono text-slate-400">WGS84</span>
                      </div>
                      <div className="text-slate-300 space-y-0.5">
                        <div>• <strong>Calibre:</strong> 39 - 44 mm | <strong>Edad:</strong> 11 semanas</div>
                        <div>• <strong>Inocuidad:</strong> BPA-BARU-2026 | <strong>GPS:</strong> {batch.originCoordinates.lat.toFixed(4)}°N, {batch.originCoordinates.lng.toFixed(4)}°W</div>
                        <div>• <strong>Código de verificación:</strong> <span className="font-mono text-[10px] text-emerald-400">{batch.rootMerkleHash ? batch.rootMerkleHash.substring(0, 20) + '...' : '0x7e29...91ba'}</span></div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setSelectedBatchForPassport(batch)}
                        className="flex-1 px-3 py-1.5 rounded-lg bg-[#0B100D] hover:bg-[#161E19] border border-violet-500/35 text-slate-200 text-xs flex items-center justify-center gap-1.5 transition-colors"
                      >
                        <FileCheck className="w-3.5 h-3.5 text-violet-400" />
                        <span>Pasaporte PDF</span>
                      </button>

                      <button
                        onClick={() => setSelectedBatchForSticker(batch)}
                        className="flex-1 px-3 py-1.5 rounded-lg bg-[#0B100D] hover:bg-[#161E19] border border-amber-500/35 text-slate-200 text-xs flex items-center justify-center gap-1.5 transition-colors"
                      >
                        <Tag className="w-3.5 h-3.5 text-amber-400" />
                        <span>Etiqueta QR</span>
                      </button>
                    </div>
                  </div>
                )}

                {/* Quick Photos Trigger & Reviews */}
                <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                  <button
                    onClick={() => setSelectedBatchForDetail(batch)}
                    className="flex items-center gap-1.5 text-xs font-medium text-amber-300 hover:text-amber-200 bg-[#0B100D] hover:bg-[#161E19] border border-amber-500/30 rounded-lg px-3 py-1.5 transition-colors"
                  >
                    <Camera className="w-3.5 h-3.5" />
                    <span>Ver Fotos y Ficha Completa</span>
                  </button>

                  <button
                    onClick={() => setExpandedReviewsBatchId(isReviewsOpen ? null : batch.id)}
                    className="text-xs text-slate-400 hover:text-slate-200 flex items-center gap-1"
                  >
                    <MessageSquare className="w-3.5 h-3.5 text-emerald-400" />
                    <span>{isReviewsOpen ? 'Ocultar reseñas' : 'Reseñas (2)'}</span>
                  </button>
                </div>

                {isReviewsOpen && (
                  <div className="pt-3 border-t border-slate-800">
                    <BatchReviewsSection
                      batchId={batch.id}
                      producerId={batch.producerId || batch.farmId}
                      producerName={batch.producerName}
                      onOpenProfile={(target) =>
                        setSelectedPublicProfile({
                          id: target.id,
                          name: target.name,
                          role: target.role,
                          location: batch.corregimiento,
                        })
                      }
                    />
                  </div>
                )}
              </div>

              {/* Action Buttons Footer */}
              <div className="pt-3.5 border-t border-slate-800 space-y-2.5">
                <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => onNavigateToTraceability?.(batch.batchCode)}
                      className="text-slate-400 hover:text-violet-300 flex items-center gap-1 transition-colors"
                    >
                      <QrCode className="w-3.5 h-3.5 text-violet-400" />
                      <span>Certificado de Origen</span>
                    </button>

                    <button
                      onClick={() => {
                        const contact: ChatContact = {
                          id: batch.producerId || batch.farmId || batch.id,
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
                      className="text-emerald-400 hover:text-emerald-300 flex items-center gap-1 transition-colors"
                      title={`Chatear directamente con ${batch.producerName}`}
                    >
                      <MessageSquare className="w-3.5 h-3.5" />
                      <span>Chat Directo</span>
                    </button>
                  </div>

                  {canManageBatch && (
                    <button
                      onClick={() => setBatchToDelete(batch)}
                      className="text-red-400 hover:text-white hover:bg-red-600/80 border border-red-500/30 rounded-md px-2 py-0.5 transition-colors flex items-center gap-1 text-[11px]"
                      title="Eliminar lote del catálogo"
                    >
                      <Trash2 className="w-3 h-3" />
                      <span>Eliminar</span>
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <Button
                    onClick={() => addToCart(batch.id, Math.min(batch.availableKg, 500), false)}
                    variant="secondary"
                    size="sm"
                    disabled={isSoldOut}
                    className="flex items-center justify-center gap-1.5 text-xs"
                  >
                    <ShoppingCart className="w-3.5 h-3.5 text-emerald-400" />
                    <span>+ Carrito</span>
                  </Button>

                  <Button
                    onClick={() => handleStartEscrow(batch, true)}
                    variant="outline"
                    size="sm"
                    disabled={isSoldOut}
                    className="text-xs border-amber-500/40 text-amber-300 hover:bg-amber-500/15"
                  >
                    Muestra (18 kg)
                  </Button>

                  <Button
                    onClick={() => handleStartEscrow(batch, false)}
                    variant="default"
                    size="sm"
                    className="flex items-center justify-center gap-1.5 text-xs"
                    disabled={isSoldOut}
                  >
                    <Lock className="w-3.5 h-3.5" />
                    <span>{!isSoldOut ? 'Comprar Ahora' : 'Agotado'}</span>
                  </Button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Batch Detail Modal */}
      <BatchDetailWithEvidenceModal
        batch={selectedBatchForDetail}
        isOpen={!!selectedBatchForDetail}
        onClose={() => setSelectedBatchForDetail(null)}
        onOpenEscrowCheckout={(batch) => handleStartEscrow(batch, false)}
        onRequestSample={(batch) => handleStartEscrow(batch, true)}
        onOpenProducerProfile={(target) => setSelectedPublicProfile(target)}
      />

      {/* Direct Single Escrow Checkout Modal */}
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

      {/* Delete Batch Confirmation Modal */}
      <DeleteBatchModal
        batch={batchToDelete}
        isOpen={!!batchToDelete}
        onClose={() => setBatchToDelete(null)}
        onConfirmDelete={deleteProductBatch}
      />

      {/* Perfil público del productor / comprador */}
      <PublicProfileModal
        open={!!selectedPublicProfile}
        target={selectedPublicProfile}
        onClose={() => setSelectedPublicProfile(null)}
        onOpenProduct={(batch) => setSelectedBatchForDetail(batch)}
      />
    </div>
  );
};
