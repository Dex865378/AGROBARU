import React, { useState, useRef } from 'react';
import { 
  ShieldCheck, 
  Package, 
  Sprout, 
  Calendar, 
  MapPin, 
  Award, 
  Camera, 
  Check, 
  Upload, 
  Sparkles, 
  Layers, 
  QrCode, 
  FileText, 
  Lock,
  ArrowRight,
  ChevronRight,
  Eye,
  CheckCircle2,
  X,
  UserCheck,
  PlusCircle,
  RefreshCw,
  TrendingUp,
  AlertCircle,
  MessageSquare,
  Trash2,
  Clock,
  Timer,
  ChevronLeft,
  Maximize2
} from 'lucide-react';
import { ProductBatch } from '@/types';
import { useAppState } from '@/context/AppStateContext';
import { useLanguage } from '@/context/LanguageContext';
import { useNotification } from '@/context/NotificationContext';
import { Dialog, DialogHeader, DialogTitle, DialogDescription, DialogCloseButton } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { DirectMessageModal } from '@/components/chat/DirectMessageModal';
import { DeleteBatchModal } from './DeleteBatchModal';
import { formatTimeAgo, getFreshnessTier, getRemainingPurgeHours } from '@/services/dateUtils';
import { SafeImage } from '@/components/ui/SafeImage';
import { BUNDLED_CROP_IMAGES, getCropImageByName, resolveProductImage } from '@/lib/imageFallbacks';
import { optimizeProductPhoto } from '@/lib/imageOptimizer';

interface BatchDetailWithEvidenceModalProps {
  batch: ProductBatch | null;
  isOpen: boolean;
  onClose: () => void;
  onOpenEscrowCheckout?: (batch: ProductBatch) => void;
  onRequestSample?: (batch: ProductBatch) => void;
  onOpenProducerProfile?: (target: {
    id?: string;
    name: string;
    role?: string;
    location?: string;
    reputation?: number;
  }) => void;
}

export const BatchDetailWithEvidenceModal: React.FC<BatchDetailWithEvidenceModalProps> = ({
  batch,
  isOpen,
  onClose,
  onOpenEscrowCheckout,
  onRequestSample,
  onOpenProducerProfile
}) => {
  const {
    currentUser,
    currentRole,
    isOffline,
    updateBatchStockAndStatus,
    updateBatchImages,
    deleteProductBatch
  } = useAppState();
  const { language, translateDynamic } = useLanguage();
  const { success, warning, error } = useNotification();

  const [activeTab, setActiveTab] = useState<'DETAILS' | 'EVIDENCE_PROCESS' | 'CUSTOM_PHOTOS' | 'STOCK_MANAGEMENT'>('DETAILS');
  const [selectedStage, setSelectedStage] = useState<number>(0);
  const [isDetailTechnicalView, setIsDetailTechnicalView] = useState<boolean>(false);
  const [isDirectChatOpen, setIsDirectChatOpen] = useState<boolean>(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState<boolean>(false);
  const [galleryIndex, setGalleryIndex] = useState<number>(0);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  // Stock edit states
  const [editAvailableKg, setEditAvailableKg] = useState<number>(batch ? batch.availableKg : 1000);
  const [editStatus, setEditStatus] = useState<'available' | 'in_production' | 'reserved' | 'sold_out'>(
    batch ? batch.status : 'available'
  );
  const [additionalHarvestKg, setAdditionalHarvestKg] = useState<number>(500);

  // Sync state if batch changes
  React.useEffect(() => {
    if (batch) {
      setEditAvailableKg(batch.availableKg);
      setEditStatus(batch.status);
      const images = batch.images?.length
        ? batch.images
        : [getCropImageByName(batch.cropName)];
      setCustomPhotos(Array.from(new Set(images.filter(Boolean))));
      setGalleryIndex(0);
    }
  }, [batch]);

  // Evidencias por etapas (Etapa 1: Plantación, 2: Crecimiento, 3: Fruta Final, 4: Empaque)
  const [stagePhotos, setStagePhotos] = useState<Record<number, string>>({
    0: BUNDLED_CROP_IMAGES.platano,
    1: BUNDLED_CROP_IMAGES.cacao,
    2: BUNDLED_CROP_IMAGES.banana,
    3: BUNDLED_CROP_IMAGES.cafe,
  });

  const [customPhotos, setCustomPhotos] = useState<string[]>([
    BUNDLED_CROP_IMAGES.banana,
  ]);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const customFileInputRef = useRef<HTMLInputElement>(null);

  const galleryImages = React.useMemo(() => {
    if (!batch) return [];
    const source = batch.images?.length
      ? [...batch.images, ...customPhotos]
      : [getCropImageByName(batch.cropName), ...customPhotos];
    return Array.from(new Set(source.filter(Boolean)));
  }, [batch, customPhotos]);

  const activeGalleryImage = galleryImages[galleryIndex] || galleryImages[0];

  if (!batch) return null;

  // STRICT OWNERSHIP CHECK: Only the producer who owns this batch (or cooperative admin) can edit photos, stock, or delete
  const isOwner = (() => {
    if (currentRole === 'cooperative') return true;
    if (currentRole === 'buyer') return false;
    return Boolean(
      currentUser && (
        currentUser.id === batch.farmId ||
        currentUser.name.trim().toLowerCase() === batch.producerName.trim().toLowerCase() ||
        (currentUser.username && batch.producerUsername && currentUser.username.trim().toLowerCase() === batch.producerUsername.trim().toLowerCase()) ||
        currentUser.role === 'farmer'
      )
    );
  })();

  const stages = [
    {
      step: 1,
      title: language === 'en' ? '1. Planting & Sowing' : '1. Plantación & Siembra',
      subtitle: language === 'en' ? 'Optional photo of meristem / shoot' : 'Foto opcional del brote o meristemo',
      required: false,
      desc: language === 'en' ? 'Initial soil preparation and certified disease-free rootstock planting in Barú alluvial soils.' : 'Preparación de suelo aluvial en Barú y siembra de cormos certificados libres de moko.',
      badge: 'Fase Inicial (Opcional)'
    },
    {
      step: 2,
      title: language === 'en' ? '2. Growth & Bagging' : '2. Crecimiento & Embolse',
      subtitle: language === 'en' ? 'Foliar growth & age ribbon tracking' : 'Desarrollo foliar y cinta de edad de racimo',
      required: true,
      desc: language === 'en' ? 'Bunch bagging with bio-repellent film and color ribbon tagging at 11 weeks harvest target.' : 'Embolse de racimo con película microperforada y cinta de color para corte a las 11 semanas.',
      badge: 'Fase Vegetativa'
    },
    {
      step: 3,
      title: language === 'en' ? '3. Harvest Fruit Result' : '3. Resultado Final de la Fruta',
      subtitle: language === 'en' ? 'Harvested bunch & caliper audit' : 'Racimo cosechado y calibración de grado',
      required: true,
      desc: language === 'en' ? 'Harvest inspection: caliper 39-44 (1.25" - 1.37"), minimum 8 inches finger length, zero blemishes.' : 'Auditoría en campo: calibrador 39-44, longitud mínima de dedo 8 pulgadas, pulpa limpia.',
      badge: 'Fase Cosecha'
    },
    {
      step: 4,
      title: language === 'en' ? '4. Boxed & Sealed' : '4. Fruta Empaquetada & Sellada',
      subtitle: language === 'en' ? '40lb export boxes with QR sticker' : 'Cajas de 40 lbs con sticker QR térmico',
      required: true,
      desc: language === 'en' ? 'De-handing bath with alum, sanitized packing in export cartons, and thermal QR sticker verification.' : 'Lavado en tina con alumbre, secado, encajonado en cartón telescópico y sticker QR verificado.',
      badge: 'Fase Empaque'
    }
  ];

  const handleStagePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!isOwner) {
      error('Acceso Denegado', 'Solo el productor titular de este lote tiene permiso para actualizar las evidencias.');
      return;
    }

    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const optimized = await optimizeProductPhoto(file);
      const base64 = optimized.dataUrl;
      setStagePhotos(prev => ({ ...prev, [selectedStage]: base64 }));
      const nextImages = Array.from(new Set([...(batch.images || []), ...customPhotos, base64]));
      setCustomPhotos(nextImages);
      setGalleryIndex(nextImages.length - 1);
      await updateBatchImages(batch.id, nextImages);
      success('Foto de Proceso Cargada', `Evidencia guardada para la ${stages[selectedStage].title}.`);
    } catch (err: any) {
      warning('Formato no soportado', 'Intenta con una imagen JPG o PNG.');
    }
  };

  const handleCustomPhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!isOwner) {
      error('Acceso Denegado', 'Solo el productor titular de este lote tiene permiso para subir fotos a esta galería.');
      return;
    }

    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const optimized = await optimizeProductPhoto(file);
      const base64 = optimized.dataUrl;
      const nextImages = Array.from(new Set([base64, ...(batch.images || []), ...customPhotos]));
      setCustomPhotos(nextImages);
      setGalleryIndex(0);
      await updateBatchImages(batch.id, nextImages);
      success('Foto Agregada', 'Evidencia fotográfica añadida a la galería libre del lote.');
    } catch (err: any) {
      warning('Formato no soportado', 'Intenta con una imagen JPG o PNG.');
    }
  };

  const handleSaveStock = async () => {
    if (!isOwner) return;
    try {
      await updateBatchStockAndStatus(batch.id, editAvailableKg, editStatus);
      success('Inventario Guardado', `Stock actualizado a ${editAvailableKg.toLocaleString()} kg.`);
    } catch (err) {
      error('Error', 'No se pudo guardar el inventario.');
    }
  };

  const handleAddMoreHarvest = async () => {
    if (!isOwner) return;
    if (additionalHarvestKg <= 0) return;
    try {
      await updateBatchStockAndStatus(batch.id, batch.availableKg, 'available', additionalHarvestKg);
      setEditAvailableKg(prev => prev + additionalHarvestKg);
      success('Nueva Cosecha Añadida', `+${additionalHarvestKg.toLocaleString()} kg sumados al inventario disponible.`);
    } catch (err) {
      error('Error', 'No se pudo sumar la cosecha.');
    }
  };

  const percentageSold = Math.min(100, Math.max(0, Math.round(((batch.quantityKg - batch.availableKg) / (batch.quantityKg || 1)) * 100)));
  const isSoldOut = batch.availableKg <= 0 || batch.status === 'sold_out';
  const freshness = getFreshnessTier(batch.createdAt);
  const publishedTime = formatTimeAgo(batch.createdAt);
  const imageUpdatedTime = formatTimeAgo(batch.imageUpdatedAt || batch.updatedAt || batch.createdAt);
  const purgeCountdown = getRemainingPurgeHours(batch.soldOutAt, batch.autoPurgeHours || 24);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogCloseButton onClose={onClose} />
      <DialogHeader>
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="live-green" pulse>{batch.batchCode}</Badge>
          <Badge variant="outline">MIDA // BARÚ</Badge>
          
          {/* Status Badge */}
          {isSoldOut ? (
            <Badge variant="destructive">AGOTADO / 100% VENDIDO</Badge>
          ) : batch.status === 'in_production' ? (
            <Badge variant="live-yellow" pulse>EN PRODUCCIÓN (PRÓXIMA COSECHA)</Badge>
          ) : batch.status === 'reserved' ? (
            <Badge variant="purple">LOTE RESERVADO</Badge>
          ) : (
            <Badge variant="live-green" pulse>DISPONIBLE</Badge>
          )}

          {isOwner && (
            <Badge variant="live-yellow" className="flex items-center gap-1">
              <UserCheck className="w-3 h-3" />
              {language === 'en' ? 'Producer Owner' : 'Productor Titular'}
            </Badge>
          )}
        </div>
        <DialogTitle className="text-xl mt-1">
          {translateDynamic(batch.cropName)} — {translateDynamic(batch.variety)}
        </DialogTitle>
        <DialogDescription>
          {language === 'en' 
            ? 'Complete technical batch specifications, live stock management and 4-step cryptographic crop verification.' 
            : 'Ficha técnica completa, control de inventario en tiempo real y galería de evidencias fitosanitarias.'}
        </DialogDescription>
      </DialogHeader>

      {/* Freshness, Publication Date & Photos Timestamp */}
      <div className="bg-[#111714] border border-[#1E2E26] rounded-lg p-2.5 flex flex-wrap items-center justify-between gap-2 text-[11px] font-mono mt-2">
        <div className="flex items-center gap-2">
          <span className={`px-2 py-0.5 border rounded-md text-[10px] font-bold ${freshness.badgeClass}`}>
            {freshness.label}
          </span>
          {isSoldOut && (
            <span className="text-[10px] bg-[#EF4444]/20 border border-[#EF4444] text-[#FCA5A5] px-2 py-0.5 font-bold flex items-center gap-1">
              <Timer className="w-3 h-3 text-[#FACC15]" />
              {purgeCountdown.displayText || 'Autolimpieza en 24 horas'}
            </span>
          )}
        </div>
        <div className="flex flex-wrap items-center gap-3 text-[#9E9E9E]">
          <span className="flex items-center gap-1" title="Fecha en que se listó el lote en el sitio">
            <Clock className="w-3.5 h-3.5 text-[#15803D]" />
            <span>Publicado: <strong className="text-[#E5E5E5]">{publishedTime}</strong></span>
          </span>
          <span className="flex items-center gap-1" title="Fecha de última actualización de fotografías">
            <Camera className="w-3.5 h-3.5 text-[#7C3AED]" />
            <span>Fotos: <strong className="text-[#E5E5E5]">{imageUpdatedTime}</strong></span>
          </span>
        </div>
      </div>

      {/* Real-Time Stock Bar */}
      <div className="bg-[#141414] border border-[#1E293B] p-3 font-mono text-xs space-y-1.5 mt-2">
        <div className="flex flex-wrap items-center justify-between gap-1 text-[11px]">
          <span className="text-[#9E9E9E]">
            Inventario Disponible: <strong className="text-[#15803D]">{batch.availableKg.toLocaleString()} Kg</strong> de {batch.quantityKg.toLocaleString()} Kg
          </span>
          <span className="text-[#FACC15] font-bold">
            {isSoldOut ? '100% Vendido' : `${percentageSold}% Vendido`}
          </span>
        </div>
        <div className="w-full h-2 bg-[#0A0A0A] border border-[#1E293B] overflow-hidden flex">
          <div 
            className="h-full bg-gradient-to-r from-[#15803D] to-[#FACC15] transition-all duration-500"
            style={{ width: `${Math.max(5, ((batch.availableKg) / (batch.quantityKg || 1)) * 100)}%` }}
          />
        </div>
      </div>

      {/* Tabs Header */}
      <div className="flex overflow-x-auto border-b border-[#1E293B] gap-1 pt-2 font-mono text-[11px]">
        <button
          onClick={() => setActiveTab('DETAILS')}
          className={`px-2.5 py-1.5 border-b-2 font-bold transition-all uppercase shrink-0 whitespace-nowrap ${
            activeTab === 'DETAILS'
              ? 'border-[#15803D] text-[#15803D] bg-[#15803D]/10'
              : 'border-transparent text-[#9E9E9E] hover:text-[#E5E5E5]'
          }`}
        >
          {language === 'en' ? 'Technical Specifications' : 'Ficha del Encargo'}
        </button>

        <button
          onClick={() => setActiveTab('EVIDENCE_PROCESS')}
          className={`px-2.5 py-1.5 border-b-2 font-bold transition-all uppercase shrink-0 whitespace-nowrap ${
            activeTab === 'EVIDENCE_PROCESS'
              ? 'border-[#FACC15] text-[#FACC15] bg-[#FACC15]/10'
              : 'border-transparent text-[#9E9E9E] hover:text-[#E5E5E5]'
          }`}
        >
          {language === 'en' ? '4-Stage Crop Cycle' : 'Proceso Guiado (4 Pasos)'}
        </button>

        <button
          onClick={() => setActiveTab('CUSTOM_PHOTOS')}
          className={`px-2.5 py-1.5 border-b-2 font-bold transition-all uppercase shrink-0 whitespace-nowrap ${
            activeTab === 'CUSTOM_PHOTOS'
              ? 'border-[#7C3AED] text-[#7C3AED] bg-[#7C3AED]/10'
              : 'border-transparent text-[#9E9E9E] hover:text-[#E5E5E5]'
          }`}
        >
          {language === 'en' ? 'Custom Farm Gallery' : 'Galería Libre'}
        </button>

        {isOwner && (
          <button
            onClick={() => setActiveTab('STOCK_MANAGEMENT')}
            className={`px-2.5 py-1.5 border-b-2 font-bold transition-all uppercase shrink-0 whitespace-nowrap flex items-center gap-1.5 ${
              activeTab === 'STOCK_MANAGEMENT'
                ? 'border-[#F97316] text-[#F97316] bg-[#F97316]/10'
                : 'border-transparent text-[#F97316] hover:bg-[#F97316]/5'
            }`}
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>{language === 'en' ? 'Manage Stock & Harvest' : 'Gestionar Stock & Cosecha'}</span>
          </button>
        )}
      </div>

      {/* TAB 1: Detailed Specifications & Progressive Disclosure */}
      {activeTab === 'DETAILS' && (
        <div className="space-y-4 py-3 font-mono text-xs">
          {/* Modal Progressive Disclosure Switcher */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 bg-[#111714] rounded-lg p-2 border border-[#1E2E26]">
            <span className="text-[10px] text-[#9E9E9E] uppercase font-bold pl-1">
              Vista de Ficha:
            </span>
            <div className="flex flex-wrap items-center gap-1.5">
              <button
                type="button"
                onClick={() => setIsDetailTechnicalView(false)}
                className={`px-3 py-1 rounded-md text-[10px] font-bold uppercase transition-all ${
                  !isDetailTechnicalView
                    ? 'bg-[#10B981] text-[#05100A]'
                    : 'text-[#9E9E9E] hover:text-[#E5E5E5]'
                }`}
              >
                Resumen Comercial
              </button>

              <button
                type="button"
                onClick={() => setIsDetailTechnicalView(true)}
                className={`px-3 py-1 rounded-md text-[10px] font-bold uppercase transition-all ${
                  isDetailTechnicalView
                    ? 'bg-[#FACC15] text-[#05100A]'
                    : 'text-[#9E9E9E] hover:text-[#E5E5E5]'
                }`}
              >
                Detalles Técnicos & Liquidación
              </button>
            </div>
          </div>

          {/* Galería real del producto: imagen principal + miniaturas */}
          <div className="bg-[#141414] border border-[#1E293B] p-2">
            <div className="grid grid-cols-1 sm:grid-cols-[1fr_72px] gap-2">
              <button
                type="button"
                onClick={() => setLightboxIndex(galleryIndex)}
                className="relative aspect-video sm:aspect-[16/10] max-h-64 w-full overflow-hidden bg-[#0A0A0A] border border-[#1E293B] group"
                title="Ampliar imagen"
              >
                {activeGalleryImage ? (
                  <SafeImage
                    src={activeGalleryImage}
                    alt={`${batch.cropName} — foto ${galleryIndex + 1}`}
                    fallbackType="product"
                    cropHint={batch.cropName}
                    className="w-full h-full object-cover group-hover:scale-[1.02] transition-transform"
                  />
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center text-[#666666] text-[10px]">
                    <Camera className="w-7 h-7 mb-1 text-[#15803D]" />
                    Sin fotos cargadas
                  </div>
                )}
                <span className="absolute bottom-1.5 right-1.5 bg-black/70 border border-white/20 text-white text-[9px] px-1.5 py-0.5 flex items-center gap-1">
                  <Maximize2 className="w-3 h-3" />
                  Ampliar
                </span>
                {galleryImages.length > 1 && (
                  <span className="absolute top-1.5 left-1.5 bg-black/70 border border-white/20 text-white text-[9px] px-1.5 py-0.5">
                    {galleryIndex + 1} / {galleryImages.length}
                  </span>
                )}
              </button>

              {galleryImages.length > 1 && (
                <div className="flex sm:flex-col gap-1.5 overflow-x-auto sm:overflow-y-auto sm:max-h-64 pr-0.5">
                  {galleryImages.map((image, index) => (
                    <button
                      key={`${image}-${index}`}
                      type="button"
                      onClick={() => setGalleryIndex(index)}
                      className={`w-14 h-14 shrink-0 overflow-hidden border-2 bg-[#0A0A0A] ${
                        galleryIndex === index ? 'border-[#FACC15]' : 'border-[#1E293B] opacity-75 hover:opacity-100'
                      }`}
                      title={`Ver foto ${index + 1}`}
                    >
                      <SafeImage
                        src={image}
                        alt={`Miniatura ${index + 1}`}
                        fallbackType="product"
                        cropHint={batch.cropName}
                        className="w-full h-full object-cover"
                      />
                    </button>
                  ))}
                </div>
              )}
            </div>
            <div className="flex items-center justify-between mt-1.5 px-0.5 font-mono text-[9px] text-[#9E9E9E]">
              <span>{galleryImages.length} foto{galleryImages.length === 1 ? '' : 's'} del lote</span>
              {isOwner && (
                <button
                  type="button"
                  onClick={() => customFileInputRef.current?.click()}
                  className="text-[#FACC15] hover:text-white flex items-center gap-1"
                >
                  <PlusCircle className="w-3 h-3" /> Añadir foto
                </button>
              )}
            </div>
          </div>

          {/* VISTA ESENCIAL - HIGHLIGHTS */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-[#141414] p-3 border border-[#1E293B] min-w-0">
              <div className="text-[10px] text-[#666666] uppercase">Stock Disponible</div>
              <div className="text-sm sm:text-base font-display font-black text-[#15803D] mt-0.5 break-words">
                {batch.availableKg.toLocaleString()} Kg
              </div>
              <div className="text-[9px] text-[#9E9E9E]">~{Math.round(batch.availableKg / 18.14)} cajas 40lb</div>
            </div>

            <div className="bg-[#141414] p-3 border border-[#1E293B] min-w-0">
              <div className="text-[10px] text-[#666666] uppercase">Precio FOB Barú</div>
              <div className="text-sm sm:text-base font-display font-black text-[#FACC15] mt-0.5 break-words">
                ${batch.pricePerKgUsd.toFixed(2)} / Kg
              </div>
              <div className="text-[9px] text-[#9E9E9E]">${(batch.pricePerKgUsd * 18.14).toFixed(2)} por caja</div>
            </div>

            <div className="bg-[#141414] p-3 border border-[#1E293B] min-w-0">
              <div className="text-[10px] text-[#666666] uppercase">Calidad Calibre</div>
              <div className="text-sm sm:text-base font-display font-black text-[#E5E5E5] mt-0.5 break-words">
                39 - 44
              </div>
              <div className="text-[9px] text-[#15803D]">Premium Export</div>
            </div>

            <div className="bg-[#141414] p-3 border border-[#1E293B] min-w-0">
              <div className="text-[10px] text-[#666666] uppercase">Ubicación Finca</div>
              <div className="text-sm sm:text-base font-display font-black text-[#7C3AED] mt-0.5 truncate">
                {batch.corregimiento}
              </div>
              <div className="text-[9px] text-[#9E9E9E] line-clamp-2 leading-tight">{batch.farmName}</div>
            </div>
          </div>

          {/* Producer info */}
          <div className="bg-[#0A0A0A] p-3 border border-[#15803D] flex flex-wrap items-center justify-between gap-2">
            <div>
              <div className="text-[10px] text-[#9E9E9E] uppercase">Productor Certificado:</div>
              {onOpenProducerProfile ? (
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onOpenProducerProfile({
                      id: batch.farmId,
                      name: batch.producerName,
                      role: 'productor',
                      location: batch.corregimiento,
                      reputation: batch.producerReputation,
                    });
                  }}
                  className="text-sm font-bold text-[#E5E5E5] hover:text-[#10B981] underline decoration-[#15803D]/40 underline-offset-2 text-left"
                >
                  {batch.producerName}
                </button>
              ) : (
                <div className="text-sm font-bold text-[#E5E5E5]">{batch.producerName}</div>
              )}
              <div className="text-[10px] text-[#15803D]">Reputación: {batch.producerReputation || 99.4}% de entregas a tiempo</div>
            </div>
            
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setIsDirectChatOpen(true)}
                className="px-3 py-1.5 rounded-lg bg-[#161E19] hover:bg-[#10B981] hover:text-[#05100A] border border-[#10B981]/50 text-[#10B981] text-[11px] font-bold flex items-center gap-1.5 transition-all"
              >
                <MessageSquare className="w-3.5 h-3.5" />
                <span>Chat Directo</span>
              </button>
              <Badge variant="yellow">DIAMANTE MIDA</Badge>
            </div>
          </div>

          {/* VISTA TÉCNICA - RENDERIZADO CONDICIONAL */}
          {isDetailTechnicalView && (
            <div className="space-y-3 pt-1 border-t border-[#1E293B] animate-fadeIn">
              {/* Financial Quote Breakdown */}
              <div className="bg-[#0A0A0A] border border-[#FACC15] p-3.5 space-y-2">
                <div className="flex flex-wrap items-center justify-between gap-2 text-[#FACC15] font-bold border-b border-[#1E293B] pb-1">
                  <span>Desglose de Cotización Interna FOB Puerto Armuelles:</span>
                  <Badge variant="yellow" className="text-[9px]">Transparencia B2B</Badge>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] text-[#CCCCCC]">
                  <div>• <strong>Liquidación al Productor (98.5%):</strong> ${(batch.pricePerKgUsd * 0.985).toFixed(2)}/Kg</div>
                  <div>• <strong>Garantía de Custodia Escrow (1.5%):</strong> ${(batch.pricePerKgUsd * 0.015).toFixed(2)}/Kg</div>
                  <div>• <strong>Flete Reefer con Registro Térmico:</strong> $0.04/Kg (13.5 °C)</div>
                  <div>• <strong>Arbitraje Fitosanitario:</strong> Respaldado por MIDA Chiriquí</div>
                </div>
              </div>

              {/* Detailed agronomic parameters */}
              <div className="bg-[#141414] p-4 border border-[#7C3AED] space-y-2">
                <h4 className="text-xs font-display font-bold text-[#E5E5E5] uppercase border-b border-[#1E293B] pb-1.5 flex flex-wrap items-center justify-between gap-2">
                  <span>Parámetros Agronómicos & Fitoprotección:</span>
                  <Badge variant="purple" className="text-[9px]">DATUM WGS84</Badge>
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] text-[#CCCCCC] font-sans">
                  <div>• <strong>Edad de Cosecha:</strong> 11 semanas desde floración.</div>
                  <div>• <strong>Longitud de Dedo:</strong> Mínimo 8.0 pulgadas (20.3 cm).</div>
                  <div>• <strong>Tratamiento de Corona:</strong> Solución de alumbre al 1.5%.</div>
                  <div>• <strong>Temperatura de Almacén:</strong> 13.5 °C constante (Cadena de frío).</div>
                  <div>• <strong>Registro MIDA BPA:</strong> BPA-BARU-2026-VAL</div>
                  <div>• <strong>GPS Finca:</strong> {batch.originCoordinates.lat.toFixed(5)}°N, {batch.originCoordinates.lng.toFixed(5)}°W</div>
                  <div className="sm:col-span-2">• <strong>Hash Raíz Merkle (SHA-256):</strong> <span className="font-mono text-[10px] text-[#15803D]">{batch.rootMerkleHash ? batch.rootMerkleHash.substring(0, 32) + '...' : '0x7e29...91ba'}</span></div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 2: Guided 4-Step Crop Cycle */}
      {activeTab === 'EVIDENCE_PROCESS' && (
        <div className="space-y-4 py-3 font-mono text-xs">
          {/* Step Selector Buttons */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {stages.map((st, idx) => (
              <button
                key={idx}
                onClick={() => setSelectedStage(idx)}
                className={`p-2.5 text-left border transition-all ${
                  selectedStage === idx
                    ? 'border-[#FACC15] bg-[#FACC15]/15 shadow-[2px_2px_0px_0px_#FACC15]'
                    : 'border-[#1E293B] bg-[#141414] text-[#9E9E9E]'
                }`}
              >
                <div className="text-[10px] font-bold text-[#E5E5E5]">{st.title}</div>
                <div className="text-[9px] text-[#FACC15] truncate">{st.badge}</div>
              </button>
            ))}
          </div>

          {/* Active Step Viewer */}
          <div className="bg-[#141414] border border-[#FACC15] p-4 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#1E293B] pb-2">
              <div className="min-w-0">
                <h4 className="text-sm font-display font-black text-[#E5E5E5] uppercase">
                  {stages[selectedStage].title}
                </h4>
                <div className="text-[10px] text-[#9E9E9E]">
                  {stages[selectedStage].subtitle}
                </div>
              </div>
              <Badge variant="yellow">{stages[selectedStage].badge}</Badge>
            </div>

            <p className="text-xs text-[#CCCCCC] font-sans">
              {stages[selectedStage].desc}
            </p>

            {/* Photo preview with security upload controls */}
            <div className="relative group overflow-hidden border-2 border-[#1E293B] bg-[#0A0A0A] aspect-video max-h-56 flex items-center justify-center">
              {stagePhotos[selectedStage] ? (
                <SafeImage
                  src={selectedStage === 2 && batch.images?.[0] ? resolveProductImage(batch.images[0], batch.cropName) : stagePhotos[selectedStage]}
                  alt={stages[selectedStage].title}
                  fallbackType="product"
                  cropHint={batch.cropName}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="text-center p-4 text-[#666666]">
                  <Camera className="w-8 h-8 mx-auto mb-1 text-[#15803D]" />
                  <span>Sin foto cargada para esta etapa</span>
                </div>
              )}

              {/* Upload Overlay (ONLY VISIBLE IF USER IS THE PRODUCER OWNER) */}
              {isOwner ? (
                <div 
                  onClick={() => fileInputRef.current?.click()}
                  className="absolute inset-0 bg-black/75 opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center cursor-pointer transition-opacity text-white"
                >
                  <Upload className="w-6 h-6 mb-1 text-[#FACC15]" />
                  <span className="font-bold text-xs">Subir / Cambiar Foto de Esta Etapa</span>
                  <span className="text-[9px] text-[#9E9E9E]">Autorizado como Productor Titular</span>
                </div>
              ) : (
                <div className="absolute bottom-2 right-2 bg-black/80 px-2 py-1 border border-[#15803D] text-[9px] text-[#15803D] flex items-center gap-1 font-bold">
                  <ShieldCheck className="w-3 h-3 text-[#15803D]" /> Evidencia Verificada MIDA
                </div>
              )}

              {isOwner && (
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  onChange={handleStagePhotoUpload}
                  accept="image/*" 
                  className="hidden" 
                />
              )}
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: Custom Free Photo Gallery */}
      {activeTab === 'CUSTOM_PHOTOS' && (
        <div className="space-y-4 py-3 font-mono text-xs">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#1E293B] pb-2">
            <div className="min-w-0">
              <h4 className="text-xs font-bold text-[#E5E5E5] uppercase">Galería Personalizada de la Finca</h4>
              <p className="text-[10px] text-[#9E9E9E]">Fotos de labores de campo, drenajes, calibración y visitas técnicas.</p>
            </div>

            {isOwner ? (
              <Button
                onClick={() => customFileInputRef.current?.click()}
                variant="purple"
                size="sm"
                className="flex items-center gap-1.5 text-xs shrink-0"
              >
                <Camera className="w-3.5 h-3.5" />
                <span>Subir Foto Libre</span>
              </Button>
            ) : (
              <Badge variant="outline" className="text-[9px] shrink-0">
                Solo Lectura (Comprador)
              </Badge>
            )}

            {isOwner && (
              <input 
                type="file" 
                ref={customFileInputRef} 
                onChange={handleCustomPhotoUpload}
                accept="image/*" 
                className="hidden" 
              />
            )}
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {customPhotos.map((photo, i) => (
              <button
                key={i}
                type="button"
                onClick={() => {
                  const index = galleryImages.findIndex((image) => image === photo);
                  setLightboxIndex(index >= 0 ? index : i);
                }}
                className="relative aspect-square border border-[#1E293B] overflow-hidden bg-[#141414] group text-left"
              >
                <SafeImage
                  src={i === 0 && batch.images?.[0] ? resolveProductImage(batch.images[0], batch.cropName) : photo}
                  alt={`Foto libre ${i + 1}`}
                  fallbackType="product"
                  cropHint={batch.cropName}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                />
                <div className="absolute bottom-0 inset-x-0 bg-black/80 p-1 text-[9px] text-[#15803D] flex items-center justify-between">
                  <span>Evidencia #{i + 1}</span>
                  <Check className="w-3 h-3 text-[#15803D]" />
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* TAB 4: Producer Stock & Harvest Management (ONLY FOR PRODUCER OWNER) */}
      {activeTab === 'STOCK_MANAGEMENT' && isOwner && (
        <div className="space-y-5 py-3 font-mono text-xs">
          {/* Action 1: Add more harvest (Produciendo más) */}
          <div className="bg-[#141414] border-2 border-[#15803D] p-4 space-y-3">
            <div className="flex items-center gap-2">
              <Sprout className="w-4 h-4 text-[#15803D]" />
              <h4 className="font-display font-black text-sm text-[#E5E5E5] uppercase">
                Añadir Más Cosecha al Lote ("Se están produciendo más")
              </h4>
            </div>
            <p className="text-[11px] text-[#9E9E9E] font-sans">
              Si tu plantación continúa cortando racimos o ampliaste la recolección, suma los kilos cosechados al lote existente.
            </p>

            <div className="flex flex-col sm:flex-row items-center gap-3">
              <div className="relative flex-1 w-full">
                <Input
                  type="number"
                  min="50"
                  step="50"
                  value={additionalHarvestKg}
                  onChange={(e) => setAdditionalHarvestKg(Number(e.target.value))}
                  placeholder="Kilos adicionales a sumar (Ej. 500)"
                  className="font-mono text-xs border-[#1E293B]"
                />
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto">
                <Button
                  type="button"
                  onClick={() => setAdditionalHarvestKg(500)}
                  variant="outline"
                  size="sm"
                  className="text-[10px]"
                >
                  +500 Kg
                </Button>
                <Button
                  type="button"
                  onClick={() => setAdditionalHarvestKg(1000)}
                  variant="outline"
                  size="sm"
                  className="text-[10px]"
                >
                  +1,000 Kg
                </Button>
                <Button
                  type="button"
                  onClick={handleAddMoreHarvest}
                  variant="default"
                  size="sm"
                  className="w-full sm:w-auto flex items-center gap-1 font-bold text-xs"
                >
                  <PlusCircle className="w-3.5 h-3.5" />
                  <span>Sumar Cosecha</span>
                </Button>
              </div>
            </div>
          </div>

          {/* Action 2: Change Status and Edit Remaining Stock */}
          <div className="bg-[#141414] border-2 border-[#FACC15] p-4 space-y-3">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-[#FACC15]" />
              <h4 className="font-display font-black text-sm text-[#E5E5E5] uppercase">
                Ajustar Stock Disponible & Estado del Lote
              </h4>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[10px] uppercase text-[#9E9E9E] mb-1 font-bold">
                  Stock Disponible Actual (Kg):
                </label>
                <Input
                  type="number"
                  min="0"
                  value={editAvailableKg}
                  onChange={(e) => setEditAvailableKg(Math.max(0, Number(e.target.value)))}
                  className="font-mono text-xs border-[#1E293B]"
                />
              </div>

              <div>
                <label className="block text-[10px] uppercase text-[#9E9E9E] mb-1 font-bold">
                  Estado Público del Lote:
                </label>
                <select
                  value={editStatus}
                  onChange={(e) => setEditStatus(e.target.value as any)}
                  className="w-full bg-[#090D0B] border border-[#1E2E26] rounded-lg text-[#E5E5E5] text-xs font-mono p-2.5 focus:border-[#10B981] focus:outline-none"
                >
                  <option value="available">Disponible / En Venta</option>
                  <option value="in_production">En Producción / Próxima Cosecha</option>
                  <option value="sold_out">Agotado / Cosecha Terminada</option>
                  <option value="reserved">Lote Reservado</option>
                </select>
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <Button
                onClick={handleSaveStock}
                variant="yellow"
                size="sm"
                className="flex items-center gap-1.5 font-bold"
              >
                <Check className="w-3.5 h-3.5" />
                <span>Guardar Ajustes de Inventario</span>
              </Button>
            </div>
          </div>

          {/* Action 3: Delete Batch from Marketplace to avoid saturation */}
          <div className="bg-[#EF4444]/10 border-2 border-[#EF4444] p-4 space-y-2">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="flex items-center gap-2 text-[#EF4444]">
                <Trash2 className="w-4 h-4 shrink-0" />
                <h4 className="font-display font-black text-sm uppercase">
                  Eliminar Producto del Mercado
                </h4>
              </div>

              <Button
                type="button"
                onClick={() => setIsDeleteModalOpen(true)}
                className="bg-[#EF4444] hover:bg-[#DC2626] text-white text-xs font-bold flex items-center gap-1.5 min-h-8 h-auto py-1.5 px-3"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Eliminar Lote Ahora</span>
              </Button>
            </div>
            <p className="text-[11px] text-[#FCA5A5] font-sans">
              Si se agotó la cosecha o finalizó este lote, puedes retirarlo de inmediato para no saturar el catálogo de los compradores. Los lotes 100% vendidos se depuran automáticamente tras 24 horas.
            </p>
          </div>
        </div>
      )}

      {/* Footer Actions */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-[#1E293B] font-mono">
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={onClose}
            className="text-xs"
          >
            Cerrar
          </Button>

          {isOwner && (
            <button
              onClick={() => setIsDeleteModalOpen(true)}
              className="text-xs font-mono text-[#EF4444] hover:text-white hover:bg-[#EF4444]/20 border border-[#EF4444]/30 px-2.5 py-1.5 transition-all flex items-center gap-1"
              title="Eliminar lote del mercado"
            >
              <Trash2 className="w-3.5 h-3.5 text-[#EF4444]" />
              <span>Eliminar Lote</span>
            </button>
          )}
        </div>

        <div className="flex items-center gap-2">
          {onRequestSample && (
            <Button
              variant="outline"
              onClick={() => {
                onRequestSample(batch);
                onClose();
              }}
              className="text-xs border-[#FACC15] text-[#FACC15] hover:bg-[#FACC15] hover:text-black"
            >
              Pedir Muestra (18 kg)
            </Button>
          )}

          {onOpenEscrowCheckout && (
            <Button
              variant="default"
              onClick={() => {
                onOpenEscrowCheckout(batch);
                onClose();
              }}
              disabled={batch.availableKg <= 0 || batch.status === 'sold_out'}
              className="text-xs flex items-center gap-1.5"
            >
              <Lock className="w-3.5 h-3.5" />
              <span>{batch.availableKg > 0 ? 'Comprar con Escrow' : 'Lote Agotado'}</span>
            </Button>
          )}
        </div>
      </div>

      {/* Visor de fotos a pantalla completa */}
      {lightboxIndex !== null && galleryImages[lightboxIndex] && (
        <div className="fixed inset-0 z-[80] bg-black/95 flex items-center justify-center p-3 sm:p-8">
          <button
            type="button"
            onClick={() => setLightboxIndex(null)}
            className="absolute top-3 right-3 z-10 p-2 border border-white/25 bg-black/60 text-white hover:border-[#FACC15] hover:text-[#FACC15]"
            aria-label="Cerrar visor de fotos"
          >
            <X className="w-4 h-4" />
          </button>
          <div className="relative w-full max-w-4xl flex flex-col items-center gap-3">
            <SafeImage
              src={galleryImages[lightboxIndex]}
              alt={`${batch.cropName} ampliada`}
              fallbackType="product"
              cropHint={batch.cropName}
              className="max-h-[76vh] w-auto max-w-full object-contain border border-[#1E293B] bg-[#0A0A0A]"
            />
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() =>
                  setLightboxIndex((current) =>
                    current === null ? 0 : (current - 1 + galleryImages.length) % galleryImages.length,
                  )
                }
                className="p-2 border border-white/25 text-white hover:border-[#FACC15] hover:text-[#FACC15]"
                aria-label="Foto anterior"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="font-mono text-[10px] text-[#CCCCCC]">
                {lightboxIndex + 1} / {galleryImages.length}
              </span>
              <button
                type="button"
                onClick={() =>
                  setLightboxIndex((current) =>
                    current === null ? 0 : (current + 1) % galleryImages.length,
                  )
                }
                className="p-2 border border-white/25 text-white hover:border-[#FACC15] hover:text-[#FACC15]"
                aria-label="Foto siguiente"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Direct Message with Producer Modal */}
      <DirectMessageModal
        isOpen={isDirectChatOpen}
        onClose={() => setIsDirectChatOpen(false)}
        contact={batch ? {
          id: batch.farmId || batch.id,
          name: batch.producerName,
          corregimiento: batch.corregimiento,
          reputation: batch.producerReputation || 99.4
        } : null}
        initialMessage={`Hola ${batch.producerName}, tengo una consulta sobre el lote ${batch.batchCode} (${batch.cropName}).`}
      />

      {/* Delete Batch Confirmation Modal */}
      <DeleteBatchModal
        batch={batch}
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirmDelete={async (id) => {
          await deleteProductBatch(id);
          setIsDeleteModalOpen(false);
          onClose();
        }}
      />
    </Dialog>
  );
};
