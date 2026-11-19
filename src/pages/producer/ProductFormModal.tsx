import React, { useEffect, useMemo, useState } from 'react';
import {
  AlertCircle,
  CalendarDays,
  Crosshair,
  Hash,
  Leaf,
  MapPin,
  Package,
  Save,
  X,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { translateAuthError } from '@/lib/authErrors';
import { createProduct, updateProduct } from '@/services/productsService';
import { generateTraceabilityHash, shortenHash } from '@/utils/crypto';
import {
  BARU_COMMUNITIES,
  CROP_CATEGORIES,
  HARVEST_STATUS_LABELS,
  PRODUCT_UNITS,
  type BaruCommunity,
  type CropCategory,
  type HarvestStatus,
  type Product,
  type ProductUnit,
} from '@/types/agrobaru';

interface ProductFormModalProps {
  open: boolean;
  editing: Product | null;
  onClose: () => void;
  onSaved: (message: string) => void;
}

const labelClass = 'block text-[10px] font-mono uppercase tracking-wider text-[#9E9E9E] mb-1.5';
const fieldClass =
  'w-full bg-[#0A0A0A] border border-[#1E293B] focus:border-[#15803D] focus:ring-1 focus:ring-[#15803D]/30 text-sm text-[#E5E5E5] placeholder-[#666666] rounded-lg px-3 py-2.5 outline-none transition-colors';

export const ProductFormModal: React.FC<ProductFormModalProps> = ({
  open,
  editing,
  onClose,
  onSaved,
}) => {
  const { user, profile, online } = useAuth();

  const [crop, setCrop] = useState<CropCategory>('Banano');
  const [variety, setVariety] = useState('');
  const [quantity, setQuantity] = useState('');
  const [unit, setUnit] = useState<ProductUnit>('Cajas');
  const [price, setPrice] = useState('');
  const [status, setStatus] = useState<HarvestStatus>('disponible');
  const [estimatedDate, setEstimatedDate] = useState('');
  const [community, setCommunity] = useState<BaruCommunity>('Puerto Armuelles');
  const [description, setDescription] = useState('');
  const [gps, setGps] = useState<{ lat: number; lng: number } | null>(null);
  const [gpsBusy, setGpsBusy] = useState(false);
  const [gpsError, setGpsError] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    if (editing) {
      setCrop(editing.crop);
      setVariety(editing.variety);
      setQuantity(String(editing.quantity));
      setUnit(editing.unit);
      setPrice(String(editing.priceUsd));
      setStatus(editing.status);
      setEstimatedDate(editing.estimatedHarvestDate);
      setCommunity(editing.community);
      setDescription(editing.description);
      setGps(editing.gps);
    } else {
      setCrop('Banano');
      setVariety('');
      setQuantity('');
      setUnit('Cajas');
      setPrice('');
      setStatus('disponible');
      setEstimatedDate('');
      setCommunity(profile?.community || 'Puerto Armuelles');
      setDescription('');
      setGps(null);
    }
    setError(null);
    setGpsError(null);
    setGpsBusy(false);
    setSaving(false);
  }, [open, editing, profile?.community]);

  const numericQty = useMemo(() => Number.parseFloat(quantity.replace(',', '.')), [quantity]);
  const numericPrice = useMemo(() => Number.parseFloat(price.replace(',', '.')), [price]);
  const inventoryValue = useMemo(() => {
    if (!Number.isFinite(numericQty) || !Number.isFinite(numericPrice)) return 0;
    return numericQty * numericPrice;
  }, [numericQty, numericPrice]);

  const captureGps = () => {
    setGpsError(null);
    if (!navigator.geolocation) {
      setGpsError('Este dispositivo no permite geolocalización.');
      return;
    }
    setGpsBusy(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setGps({
          lat: Number(position.coords.latitude.toFixed(6)),
          lng: Number(position.coords.longitude.toFixed(6)),
        });
        setGpsBusy(false);
      },
      (geoError) => {
        const messages: Record<number, string> = {
          1: 'Permiso de ubicación denegado. Actívalo en tu navegador para capturar el GPS.',
          2: 'No se pudo obtener la ubicación. Verifica la señal GPS del dispositivo.',
          3: 'La captura de GPS tardó demasiado. Inténtalo de nuevo a cielo abierto.',
        };
        setGpsError(messages[geoError.code] || 'No se pudo capturar el GPS.');
        setGpsBusy(false);
      },
      { enableHighAccuracy: true, timeout: 12000, maximumAge: 0 },
    );
  };

  if (!open) return null;

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);

    if (!user || !profile) {
      setError('Tu sesión no está lista. Vuelve a iniciar sesión.');
      return;
    }
    if (variety.trim().length < 2) {
      setError('Escribe la variedad del cultivo (mínimo 2 caracteres).');
      return;
    }
    if (!Number.isFinite(numericQty) || numericQty <= 0) {
      setError('La cantidad disponible debe ser mayor que cero.');
      return;
    }
    if (!Number.isFinite(numericPrice) || numericPrice <= 0) {
      setError('El precio unitario en USD debe ser mayor que cero.');
      return;
    }
    if (status === 'en_cosecha' && !estimatedDate) {
      setError('Indica la fecha estimada de cosecha para un lote que aún está saliendo.');
      return;
    }

    setSaving(true);
    try {
      const now = new Date().toISOString();
      const traceabilityHash = await generateTraceabilityHash({
        producerId: user.uid,
        crop,
        variety: variety.trim(),
        quantity: numericQty,
        unit,
        priceUsd: numericPrice,
        status,
        community,
        gps,
        estimatedHarvestDate: estimatedDate,
        revision: editing?.createdAt || now,
        updatedAt: now,
      });

      const payload = {
        producerId: user.uid,
        producerName: profile.name || user.displayName || 'Productor AgroBarú',
        producerEmail: profile.email || user.email || '',
        producerCommunity: profile.community,
        crop,
        variety: variety.trim(),
        quantity: numericQty,
        unit,
        priceUsd: numericPrice,
        status,
        estimatedHarvestDate: estimatedDate,
        community,
        gps,
        description: description.trim(),
        traceabilityHash,
      };

      if (editing) {
        await updateProduct(editing.id, payload);
        onSaved('Cosecha actualizada correctamente.');
      } else {
        await createProduct(payload);
        onSaved('Cosecha publicada. Ya está visible para los compradores.');
      }
      onClose();
    } catch (saveError) {
      setError(translateAuthError(saveError));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start sm:items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-sm">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="product-form-title"
        className="w-full max-w-2xl max-h-[92vh] overflow-y-auto bg-[#111714] border border-[#1E2E26] rounded-2xl shadow-2xl"
      >
        <div className="sticky top-0 z-10 flex items-start justify-between gap-3 bg-[#111714] border-b border-[#1E2E26] px-5 py-4">
          <div>
            <h2
              id="product-form-title"
              className="font-display font-black text-lg text-[#ECFDF5] leading-tight"
            >
              {editing ? 'Editar cosecha' : 'Publicar nueva cosecha'}
            </h2>
            <p className="mt-1 text-[11px] text-[#9E9E9E]">
              {editing
                ? 'Actualiza precio, stock o estado. La huella SHA-256 se recalcula al guardar.'
                : 'Completa los datos del lote. Se generará una huella SHA-256 de trazabilidad.'}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-[#9E9E9E] hover:text-[#E5E5E5] hover:bg-[#141414]"
            aria-label="Cerrar formulario"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {error && (
            <div
              role="alert"
              className="flex items-start gap-2 rounded-lg border border-[#EF4444]/60 bg-[#EF4444]/10 px-3 py-2.5 text-[11px] text-[#FCA5A5]"
            >
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="product-crop" className={labelClass}>
                Cultivo
              </label>
              <div className="relative">
                <Leaf className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#10B981]" />
                <select
                  id="product-crop"
                  value={crop}
                  onChange={(event) => setCrop(event.target.value as CropCategory)}
                  className={`${fieldClass} appearance-none pl-9`}
                >
                  {CROP_CATEGORIES.map((item) => (
                    <option key={item} value={item}>
                      {item}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label htmlFor="product-variety" className={labelClass}>
                Variedad
              </label>
              <input
                id="product-variety"
                type="text"
                value={variety}
                onChange={(event) => setVariety(event.target.value)}
                placeholder="Ej. Gran Enano / Cavendish"
                className={fieldClass}
              />
            </div>

            <div>
              <label htmlFor="product-quantity" className={labelClass}>
                Cantidad del lote
              </label>
              <div className="relative">
                <Package className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#666666]" />
                <input
                  id="product-quantity"
                  type="number"
                  min="0"
                  step="0.01"
                  inputMode="decimal"
                  value={quantity}
                  onChange={(event) => setQuantity(event.target.value)}
                  placeholder="Ej. 250"
                  className={`${fieldClass} pl-9`}
                />
              </div>
            </div>

            <div>
              <label htmlFor="product-unit" className={labelClass}>
                Unidad
              </label>
              <select
                id="product-unit"
                value={unit}
                onChange={(event) => setUnit(event.target.value as ProductUnit)}
                className={`${fieldClass} appearance-none`}
              >
                {PRODUCT_UNITS.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="product-price" className={labelClass}>
                Precio unitario (USD)
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#FACC15] font-bold">
                  $
                </span>
                <input
                  id="product-price"
                  type="number"
                  min="0"
                  step="0.01"
                  inputMode="decimal"
                  value={price}
                  onChange={(event) => setPrice(event.target.value)}
                  placeholder="0.85"
                  className={`${fieldClass} pl-7 font-mono text-[#FACC15]`}
                />
              </div>
              <p className="mt-1 font-mono text-[10px] text-[#666666]">
                Valor estimado del lote:{' '}
                <span className="text-[#FACC15]">
                  ${inventoryValue.toFixed(2)} USD
                </span>
              </p>
            </div>

            <div>
              <label htmlFor="product-community" className={labelClass}>
                Comunidad en Barú
              </label>
              <div className="relative">
                <MapPin className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#15803D]" />
                <select
                  id="product-community"
                  value={community}
                  onChange={(event) => setCommunity(event.target.value as BaruCommunity)}
                  className={`${fieldClass} appearance-none pl-9`}
                >
                  {BARU_COMMUNITIES.map((item) => (
                    <option key={item} value={item}>
                      {item}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          <div>
            <span className={labelClass}>Estado de la cosecha</span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {(Object.keys(HARVEST_STATUS_LABELS) as HarvestStatus[]).map((value) => {
                const active = status === value;
                return (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setStatus(value)}
                    className={`flex items-start gap-2 rounded-lg border px-3 py-2.5 text-left transition-colors ${
                      active
                        ? value === 'disponible'
                          ? 'border-[#10B981] bg-[#10B981]/10'
                          : 'border-[#FACC15] bg-[#FACC15]/10'
                        : 'border-[#1E293B] bg-[#0A0A0A] hover:border-[#15803D]/60'
                    }`}
                  >
                    <span
                      className={`mt-1 w-2 h-2 rounded-full shrink-0 ${
                        value === 'disponible' ? 'bg-[#10B981]' : 'bg-[#FACC15]'
                      }`}
                    />
                    <span>
                      <span
                        className={`block text-xs font-bold ${
                          value === 'disponible' ? 'text-[#10B981]' : 'text-[#FACC15]'
                        }`}
                      >
                        {value === 'disponible' ? 'Ya está listo' : 'Próxima cosecha'}
                      </span>
                      <span className="block text-[10px] text-[#9E9E9E] mt-0.5">
                        {value === 'disponible'
                          ? 'Disponible para compra inmediata'
                          : 'Cosecha en curso o por salir'}
                      </span>
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="product-date" className={labelClass}>
                Fecha estimada de cosecha
              </label>
              <div className="relative">
                <CalendarDays className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#666666]" />
                <input
                  id="product-date"
                  type="date"
                  value={estimatedDate}
                  onChange={(event) => setEstimatedDate(event.target.value)}
                  className={`${fieldClass} pl-9`}
                />
              </div>
              <p className="mt-1 font-mono text-[10px] text-[#666666]">
                Obligatoria si la cosecha aún está saliendo.
              </p>
            </div>

            <div>
              <span className={labelClass}>Coordenadas GPS (opcional)</span>
              <button
                type="button"
                onClick={captureGps}
                disabled={gpsBusy}
                className="w-full flex items-center justify-center gap-2 rounded-lg border border-[#7C3AED]/50 bg-[#7C3AED]/10 hover:bg-[#7C3AED]/20 disabled:opacity-60 text-[#A78BFA] text-xs font-bold py-2.5 transition-colors"
              >
                {gpsBusy ? (
                  <span className="w-4 h-4 border-2 border-[#A78BFA] border-t-transparent rounded-full animate-spin" />
                ) : (
                  <Crosshair className="w-4 h-4" />
                )}
                <span>{gps ? 'Recapturar GPS actual' : 'Capturar GPS actual'}</span>
              </button>
              {gps && (
                <div className="mt-1.5 flex items-center justify-between gap-2 font-mono text-[10px] text-[#A78BFA]">
                  <span>
                    {gps.lat.toFixed(5)}°N, {gps.lng.toFixed(5)}°W
                  </span>
                  <button
                    type="button"
                    onClick={() => setGps(null)}
                    className="text-[#9E9E9E] hover:text-[#EF4444]"
                  >
                    Quitar
                  </button>
                </div>
              )}
              {gpsError && (
                <p className="mt-1 text-[10px] text-[#F97316]">{gpsError}</p>
              )}
            </div>
          </div>

          <div>
            <label htmlFor="product-description" className={labelClass}>
              Descripción (opcional)
            </label>
            <textarea
              id="product-description"
              rows={3}
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              placeholder="Calibre, empaque, prácticas de cultivo o condiciones de entrega."
              className={`${fieldClass} resize-y`}
            />
          </div>

          <div className="flex items-start gap-2 rounded-lg border border-[#7C3AED]/40 bg-[#7C3AED]/10 px-3 py-2.5">
            <Hash className="w-4 h-4 text-[#A78BFA] shrink-0 mt-0.5" />
            <div className="text-[10px] text-[#A78BFA] leading-relaxed">
              <p className="font-bold">Huella de trazabilidad SHA-256</p>
              <p className="text-[#9E9E9E]">
                {editing?.traceabilityHash
                  ? `Huella actual: ${shortenHash(editing.traceabilityHash)}. Se recalcula al guardar los cambios.`
                  : 'Se generará automáticamente con los datos del lote, la ubicación y la marca de tiempo.'}
              </p>
            </div>
          </div>

          {!online && (
            <p className="font-mono text-[10px] text-[#FACC15]">
              Sin conexión: el lote se guardará en este dispositivo y se sincronizará automáticamente.
            </p>
          )}

          <div className="sticky bottom-0 z-10 -mx-5 -mb-5 mt-2 flex flex-col-reverse sm:flex-row sm:justify-end gap-2 border-t border-[#1E2E26] bg-[#111714] px-5 py-3">
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className="px-4 py-2.5 rounded-lg border border-[#1E293B] text-[#CCCCCC] hover:bg-[#141414] text-xs font-bold transition-colors disabled:opacity-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg bg-[#15803D] hover:bg-[#16A34A] disabled:opacity-60 text-black text-xs font-bold transition-colors"
            >
              {saving ? (
                <span className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  <span>{editing ? 'Guardar cambios' : 'Publicar cosecha'}</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
