import React, { useState, useRef } from 'react';
import {
  Sprout,
  Package,
  Camera,
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  Upload,
  Clock,
  ShieldCheck,
  MapPin,
  DollarSign
} from 'lucide-react';
import { Dialog, DialogHeader, DialogTitle, DialogDescription, DialogCloseButton } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useAppState } from '@/context/AppStateContext';
import { optimizeProductPhoto } from '@/lib/imageOptimizer';
import { useNotification } from '@/context/NotificationContext';
import { SafeImage } from '@/components/ui/SafeImage';

interface PublishBatchWizardModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPublished?: () => void;
}

const CROP_PRESETS = [
  { crop: 'Banano Cavendish', variety: 'Gran Enano', defaultPrice: '0.95' },
  { crop: 'Plátano Curaré', variety: 'Curaré Enano', defaultPrice: '1.15' },
  { crop: 'Cacao Orgánico', variety: 'Criollo Fino', defaultPrice: '4.20' },
  { crop: 'Papaya Maradol', variety: 'Maradol Roja', defaultPrice: '1.30' },
];

export const PublishBatchWizardModal: React.FC<PublishBatchWizardModalProps> = ({
  isOpen,
  onClose,
  onPublished,
}) => {
  const { farms, createBatchFromLogs } = useAppState();
  const { warning } = useNotification();

  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
  const [selectedFarmId, setSelectedFarmId] = useState<string>(farms[0]?.id || '');
  const [cropName, setCropName] = useState('Banano Cavendish');
  const [variety, setVariety] = useState('Gran Enano');
  const [qualityGrade, setQualityGrade] = useState<'Premium Exportación' | 'Grado A' | 'Grado B Orgánico'>('Premium Exportación');

  const [quantityKg, setQuantityKg] = useState('1814');
  const [pricePerKg, setPricePerKg] = useState('0.95');
  const [harvestDate, setHarvestDate] = useState(() => new Date().toISOString().split('T')[0]);

  const [description, setDescription] = useState('Cosecha fresca de Barú seleccionada y lavada en planta empacadora.');
  const [uploadedPhoto, setUploadedPhoto] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const selectedFarm = farms.find(f => f.id === selectedFarmId) || farms[0];
  const numericQty = Math.max(1, parseFloat(quantityKg) || 0);
  const numericPrice = Math.max(0.05, parseFloat(pricePerKg) || 0);
  const boxesEquivalent = Math.round(numericQty / 18.14);
  const netProducerTotal = numericQty * numericPrice * 0.985;

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const preview = URL.createObjectURL(file);
    setUploadedPhoto(preview);
    try {
      const optimized = await optimizeProductPhoto(file);
      setUploadedPhoto((current) => (current === preview ? optimized.dataUrl : current));
    } catch {
      warning('Formato inválido', 'Por favor selecciona una imagen JPG o PNG.');
    } finally {
      URL.revokeObjectURL(preview);
    }
  };

  const handlePublish = async () => {
    setIsSubmitting(true);
    try {
      await createBatchFromLogs({
        farmId: selectedFarm?.id,
        cropName,
        variety,
        quantityKg: numericQty,
        pricePerKgUsd: numericPrice,
        harvestDate,
        description,
        qualityGrade,
        images: uploadedPhoto ? [uploadedPhoto] : [],
        certifications: ['MIDA Buenas Prácticas', 'GlobalGAP Compliant'],
      });
      setStep(1);
      setUploadedPhoto('');
      onClose();
      onPublished?.();
    } finally {
      setIsSubmitting(false);
    }
  };

  const stepLabels = [
    { num: 1, title: 'Producto' },
    { num: 2, title: 'Stock y Precio' },
    { num: 3, title: 'Fotos y Detalles' },
    { num: 4, title: 'Vista Previa' },
  ];

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogCloseButton onClose={onClose} />
      <DialogHeader>
        <div className="flex items-center gap-2">
          <Badge variant="live-green">Asistente de Publicación</Badge>
          <span className="text-xs font-mono text-slate-400">Paso {step} de 4</span>
        </div>
        <DialogTitle className="mt-1">Publicar Nueva Cosecha en el Mercado</DialogTitle>
        <DialogDescription>
          Completa los 4 pasos sencillos para que compradores verificados vean tu fruta con fecha real de frescura.
        </DialogDescription>
      </DialogHeader>

      {/* Progress Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 py-3 border-b border-slate-800">
        {stepLabels.map((s) => (
          <div key={s.num} className="space-y-1.5">
            <div
              className={`h-1.5 rounded-full transition-colors ${
                step >= s.num ? 'bg-emerald-500' : 'bg-slate-800'
              }`}
            />
            <div
              className={`text-[11px] font-medium leading-snug ${
                step === s.num ? 'text-emerald-400 font-semibold' : 'text-slate-500'
              }`}
            >
              {s.num}. {s.title}
            </div>
          </div>
        ))}
      </div>

      {/* Step Content */}
      <div className="py-4 space-y-4 font-sans">
        {step === 1 && (
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                1. Selecciona tu Finca o Parcela
              </label>
              <select
                value={selectedFarmId}
                onChange={(e) => setSelectedFarmId(e.target.value)}
                className="w-full h-10 rounded-lg bg-[#0B100D] border border-slate-700/80 text-slate-100 text-sm px-3 focus:border-emerald-500 focus:outline-none"
              >
                {farms.map((f) => (
                  <option key={f.id} value={f.id}>
                    {f.name} — {f.corregimiento} ({f.areaHectares} Ha)
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                2. Selección Rápida de Cultivo
              </label>
              <div className="grid grid-cols-2 gap-2">
                {CROP_PRESETS.map((preset) => {
                  const active = cropName === preset.crop;
                  return (
                    <button
                      key={preset.crop}
                      type="button"
                      onClick={() => {
                        setCropName(preset.crop);
                        setVariety(preset.variety);
                        setPricePerKg(preset.defaultPrice);
                      }}
                      className={`p-2.5 rounded-lg border text-left transition-all ${
                        active
                          ? 'bg-emerald-500/15 border-emerald-500 text-slate-100'
                          : 'bg-[#141B17] border-slate-800 text-slate-300 hover:border-slate-700'
                      }`}
                    >
                      <div className="text-xs font-semibold">{preset.crop}</div>
                      <div className="text-[11px] text-slate-400">{preset.variety}</div>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Cultivo</label>
                <Input value={cropName} onChange={(e) => setCropName(e.target.value)} required />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Variedad</label>
                <Input value={variety} onChange={(e) => setVariety(e.target.value)} required />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Grado de Calidad</label>
              <select
                value={qualityGrade}
                onChange={(e) => setQualityGrade(e.target.value as any)}
                className="w-full h-10 rounded-lg bg-[#0B100D] border border-slate-700/80 text-slate-100 text-sm px-3 focus:border-emerald-500 focus:outline-none"
              >
                <option value="Premium Exportación">Premium Exportación</option>
                <option value="Grado A">Grado A (Mercado Nacional Selecto)</option>
                <option value="Grado B Orgánico">Grado B Orgánico</option>
              </select>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Cantidad Disponible (Kilogramos)
                </label>
                <Input
                  type="number"
                  min={1}
                  value={quantityKg}
                  onChange={(e) => setQuantityKg(e.target.value)}
                  className="font-mono font-bold text-emerald-400"
                />
                <div className="mt-1.5 flex items-center gap-1.5 text-[11px] text-slate-400">
                  <Package className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Equivale aprox. a <strong className="text-slate-200">{boxesEquivalent} cajas</strong> de exportación (40 lb)</span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Precio de Venta ($ USD por Kg)
                </label>
                <Input
                  type="number"
                  step="0.01"
                  min="0.05"
                  value={pricePerKg}
                  onChange={(e) => setPricePerKg(e.target.value)}
                  className="font-mono font-bold text-amber-300"
                />
                <div className="mt-1.5 flex items-center gap-1.5 text-[11px] text-slate-400">
                  <DollarSign className="w-3.5 h-3.5 text-amber-400" />
                  <span>~${(numericPrice * 18.14).toFixed(2)} USD por caja de 40 lb</span>
                </div>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Fecha Real de Cosecha / Corte
              </label>
              <Input
                type="date"
                value={harvestDate}
                onChange={(e) => setHarvestDate(e.target.value)}
              />
            </div>

            <div className="bg-[#141B17] border border-emerald-500/25 rounded-xl p-4 space-y-1.5">
              <div className="text-xs font-semibold text-emerald-400">
                Estimación de Ingreso Directo para tu Finca
              </div>
              <div className="flex items-baseline justify-between">
                <span className="text-xs text-slate-400">Recibirás neto al completarse el lote (98.5%):</span>
                <span className="font-mono font-bold text-lg text-slate-100">
                  ${netProducerTotal.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USD
                </span>
              </div>
              <p className="text-[11px] text-slate-500">
                Sin comisiones de intermediarios. El 1.5% cubre custodia Escrow y respaldo MIDA.
              </p>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Fotografía Real del Producto
              </label>
              <div className="border border-dashed border-emerald-500/35 rounded-xl bg-[#0B100D] p-4 flex flex-col sm:flex-row items-center gap-4">
                <div className="w-24 h-24 rounded-lg bg-[#141B17] border border-slate-800 overflow-hidden shrink-0 flex items-center justify-center">
                  {uploadedPhoto ? (
                    <SafeImage src={uploadedPhoto} alt="Vista previa" fallbackType="product" cropHint={cropName} className="w-full h-full object-cover" />
                  ) : (
                    <Camera className="w-7 h-7 text-slate-500" />
                  )}
                </div>

                <div className="flex-1 space-y-2 text-center sm:text-left">
                  <p className="text-xs text-slate-300">
                    Sube una foto reciente de tu cosecha o empaque. Se registrará automáticamente la fecha y hora exacta para dar confianza al comprador.
                  </p>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handlePhotoUpload}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => fileInputRef.current?.click()}
                    className="inline-flex items-center gap-1.5"
                  >
                    <Upload className="w-3.5 h-3.5" />
                    <span>{uploadedPhoto ? 'Cambiar Fotografía' : 'Seleccionar Foto desde Galería/Cámara'}</span>
                  </Button>
                </div>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Descripción Clara para Compradores
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                className="w-full rounded-lg bg-[#0B100D] border border-slate-700/80 text-slate-100 text-sm p-3 focus:border-emerald-500 focus:outline-none"
                placeholder="Describe el calibre, madurez, tipo de empaque y disponibilidad de entrega..."
              />
            </div>
          </div>
        )}

        {step === 4 && (
          <div className="space-y-4">
            <div className="text-xs font-semibold text-slate-300">
              Así verán tu producto los compradores en el mercado:
            </div>

            <div className="bg-[#141B17] border border-emerald-500/30 rounded-xl p-4 space-y-3">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2 mb-1">
                    <Badge variant="live-green">Disponible</Badge>
                    <Badge variant="outline">Cosecha Fresca</Badge>
                  </div>
                  <h4 className="font-display font-bold text-base text-slate-100 break-words">
                    {cropName} — {variety}
                  </h4>
                  <p className="text-xs text-slate-400 flex items-center gap-1 mt-0.5">
                    <MapPin className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    <span className="truncate">{selectedFarm?.name} ({selectedFarm?.corregimiento})</span>
                  </p>
                </div>

                <SafeImage
                  src={uploadedPhoto}
                  alt={cropName}
                  fallbackType="product"
                  cropHint={cropName}
                  className="w-16 h-16 rounded-lg object-cover border border-slate-700 shrink-0"
                />
              </div>

              <p className="text-xs text-slate-300">{description}</p>

              <div className="grid grid-cols-2 gap-3 pt-2 border-t border-slate-800 text-xs">
                <div>
                  <span className="text-slate-400 block">Precio Directo</span>
                  <span className="font-mono font-bold text-base text-emerald-400">
                    ${numericPrice.toFixed(2)} / Kg
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-slate-400 block">Stock Inicial</span>
                  <span className="font-mono font-bold text-slate-100">
                    {numericQty.toLocaleString()} Kg ({boxesEquivalent} cajas)
                  </span>
                </div>
              </div>
            </div>

            <div className="bg-[#0B100D] border border-slate-800 rounded-xl p-3 space-y-1.5 text-[11px] text-slate-400">
              <div className="flex items-center gap-1.5 text-emerald-400 font-semibold">
                <Clock className="w-3.5 h-3.5" />
                <span>Control de Frescura y Autolimpieza en 24 horas</span>
              </div>
              <p>
                Tu publicación mostrará la hora exacta de subida y actualización de fotos. Si se vende el 100% del lote, podrás eliminarlo al instante o se retirará automáticamente a las 24 horas.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Wizard Footer Controls */}
      <div className="pt-3 border-t border-slate-800 flex items-center justify-between gap-3">
        {step > 1 ? (
          <Button
            type="button"
            variant="outline"
            onClick={() => setStep((s) => (s - 1) as any)}
            className="flex items-center gap-1.5"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Anterior</span>
          </Button>
        ) : (
          <Button type="button" variant="ghost" onClick={onClose}>
            Cancelar
          </Button>
        )}

        {step < 4 ? (
          <Button
            type="button"
            variant="default"
            onClick={() => setStep((s) => (s + 1) as any)}
            className="flex items-center gap-1.5"
          >
            <span>Siguiente</span>
            <ArrowRight className="w-4 h-4" />
          </Button>
        ) : (
          <Button
            type="button"
            variant="default"
            disabled={isSubmitting}
            onClick={handlePublish}
            className="flex items-center gap-2"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>{isSubmitting ? 'Publicando...' : 'Publicar Cosecha Ahora'}</span>
          </Button>
        )}
      </div>
    </Dialog>
  );
};
