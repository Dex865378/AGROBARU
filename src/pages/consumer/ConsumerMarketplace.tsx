import React, { useEffect, useMemo, useState } from 'react';
import {
  AlertCircle,
  CalendarDays,
  CheckCircle2,
  CloudOff,
  Hash,
  Leaf,
  Mail,
  MapPin,
  Search,
  ShieldCheck,
  ShoppingBasket,
  SlidersHorizontal,
  Wifi,
  X,
} from 'lucide-react';
import { RoleNavbar } from '@/components/layout/RoleNavbar';
import { useAuth } from '@/context/AuthContext';
import { translateAuthError } from '@/lib/authErrors';
import { getCropImageByName } from '@/lib/imageFallbacks';
import { formatDateOnly, formatUsd, roundCurrency } from '@/lib/utils';
import { subscribeToMarketplace, type ProductsFeed } from '@/services/productsService';
import {
  BARU_COMMUNITIES,
  CROP_CATEGORIES,
  type BaruCommunity,
  type CropCategory,
  type HarvestStatus,
  type Product,
} from '@/types/agrobaru';

type Tab = 'todos' | HarvestStatus;

const emptyFeed: ProductsFeed = { products: [], fromCache: false, pendingWrites: false };

const STATUS_LABEL: Record<HarvestStatus, string> = {
  disponible: 'Disponible ahora',
  en_cosecha: 'Próxima cosecha',
};

const ESCROW_FEE = 0.015;

export const ConsumerMarketplace: React.FC = () => {
  const { online, profile } = useAuth();
  const [feed, setFeed] = useState<ProductsFeed>(emptyFeed);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tab, setTab] = useState<Tab>('todos');
  const [search, setSearch] = useState('');
  const [community, setCommunity] = useState<BaruCommunity | 'todas'>('todas');
  const [crop, setCrop] = useState<CropCategory | 'todos'>('todos');
  const [selected, setSelected] = useState<Product | null>(null);
  const [orderQty, setOrderQty] = useState('10');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const unsubscribe = subscribeToMarketplace(
      (nextFeed) => {
        setFeed(nextFeed);
        setLoading(false);
        setError(null);
      },
      (snapshotError) => {
        console.warn('[AgroBarú] Error en el catálogo público:', snapshotError);
        setError(translateAuthError(snapshotError));
        setLoading(false);
      },
    );
    return unsubscribe;
  }, []);

  useEffect(() => {
    if (!selected) return;
    const suggested = Math.max(1, Math.min(selected.quantity, 10));
    setOrderQty(String(Number.isInteger(suggested) ? suggested : Number(suggested.toFixed(2))));
    setCopied(false);
  }, [selected]);

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    return feed.products.filter((product) => {
      if (tab !== 'todos' && product.status !== tab) return false;
      if (community !== 'todas' && product.community !== community) return false;
      if (crop !== 'todos' && product.crop !== crop) return false;
      if (!term) return true;
      return [product.crop, product.variety, product.producerName, product.community]
        .join(' ')
        .toLowerCase()
        .includes(term);
    });
  }, [feed.products, tab, community, crop, search]);

  const counts = useMemo(
    () => ({
      disponibles: feed.products.filter((item) => item.status === 'disponible').length,
      proximas: feed.products.filter((item) => item.status === 'en_cosecha').length,
      productores: new Set(feed.products.map((item) => item.producerId)).size,
    }),
    [feed.products],
  );

  const offlineMode = !online || feed.fromCache;

  const orderPreview = useMemo(() => {
    if (!selected) return null;
    const qty = Number.parseFloat(orderQty.replace(',', '.'));
    if (!Number.isFinite(qty) || qty <= 0) return null;
    const subtotal = roundCurrency(qty * selected.priceUsd);
    const fee = roundCurrency(subtotal * ESCROW_FEE);
    return { qty, subtotal, fee, total: roundCurrency(subtotal + fee) };
  }, [selected, orderQty]);

  const handleCopyHash = async (hash: string) => {
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(hash);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }
    } catch {
      // En contextos sin Clipboard API se mantiene la huella visible.
    }
  };

  const mailtoLink = (product: Product, withOrder: boolean) => {
    const subject = withOrder
      ? `Solicitud de orden protegida · ${product.crop} ${product.variety}`
      : `Consulta por ${product.crop} ${product.variety} · AgroBarú`;
    const lines = [
      `Hola ${product.producerName},`,
      '',
      `Vi su cosecha "${product.crop} — ${product.variety}" en AgroBarú (${product.community}).`,
    ];
    if (withOrder && orderPreview) {
      lines.push(
        '',
        `Cantidad solicitada: ${orderPreview.qty} ${product.unit}`,
        `Subtotal: ${formatUsd(orderPreview.subtotal)} USD`,
        `Custodia Escrow (1.5%): ${formatUsd(orderPreview.fee)} USD`,
        `Total estimado: ${formatUsd(orderPreview.total)} USD`,
        '',
        'Deseo coordinar una orden protegida con custodia Escrow.',
      );
    } else {
      lines.push('', '¿Podría compartirme disponibilidad, empaque y condiciones de entrega?');
    }
    lines.push('', `Huella SHA-256 del lote: ${product.traceabilityHash}`, '', 'Gracias.');
    return `mailto:${product.producerEmail}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(
      lines.join('\n'),
    )}`;
  };

  return (
    <div className="min-h-screen bg-[#090D0B] text-[#E5E5E5]">
      <RoleNavbar />

      <main className="max-w-7xl mx-auto px-3 sm:px-6 py-6 space-y-6">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded border border-[#FACC15]/50 bg-[#FACC15]/10 px-2 py-1 font-mono text-[10px] uppercase tracking-wider text-[#FACC15]">
                <ShoppingBasket className="w-3 h-3" />
                Modo consumidor
              </span>
              <span
                className={`inline-flex items-center gap-1.5 rounded border px-2 py-1 font-mono text-[10px] font-bold ${
                  offlineMode
                    ? 'border-[#F97316]/50 bg-[#F97316]/10 text-[#F97316]'
                    : 'border-[#10B981]/50 bg-[#10B981]/10 text-[#10B981]'
                }`}
              >
                {offlineMode ? <CloudOff className="w-3 h-3" /> : <Wifi className="w-3 h-3" />}
                {offlineMode ? 'CATÁLOGO EN CACHÉ' : 'CATÁLOGO EN VIVO'}
              </span>
            </div>
            <h1 className="mt-2 font-display font-black text-2xl sm:text-3xl text-[#ECFDF5]">
              Mercado Agrícola Directo
            </h1>
            <p className="mt-1 text-xs text-[#9E9E9E] max-w-2xl">
              Compra directo a productores verificados de Barú. Precios transparentes en USD y
              trazabilidad SHA-256 en cada lote.
            </p>
          </div>

          <div className="grid grid-cols-3 gap-2 shrink-0">
            <div className="rounded-lg border border-[#1E2E26] bg-[#111714] px-3 py-2 text-center">
              <p className="font-display font-black text-lg text-[#FACC15]">{feed.products.length}</p>
              <p className="font-mono text-[9px] text-[#9E9E9E] uppercase">Lotes</p>
            </div>
            <div className="rounded-lg border border-[#1E2E26] bg-[#111714] px-3 py-2 text-center">
              <p className="font-display font-black text-lg text-[#10B981]">{counts.productores}</p>
              <p className="font-mono text-[9px] text-[#9E9E9E] uppercase">
                {counts.productores === 1 ? 'Productor' : 'Productores'}
              </p>
            </div>
            <div className="rounded-lg border border-[#1E2E26] bg-[#111714] px-3 py-2 text-center">
              <p className="font-display font-black text-lg text-[#10B981]">{counts.disponibles}</p>
              <p className="font-mono text-[9px] text-[#9E9E9E] uppercase">Disponibles</p>
            </div>
          </div>
        </div>

        {offlineMode && (
          <div className="flex items-start gap-2 rounded-xl border border-[#F97316]/40 bg-[#F97316]/10 px-3.5 py-3 text-[11px] text-[#F97316]">
            <CloudOff className="w-4 h-4 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold">Mostrando el catálogo guardado en tu dispositivo.</p>
              <p className="text-[#9E9E9E] mt-0.5">
                Al recuperar la conexión se actualizarán automáticamente los lotes y precios.
              </p>
            </div>
          </div>
        )}

        {error && (
          <div
            role="alert"
            className="flex items-start gap-2 rounded-xl border border-[#EF4444]/60 bg-[#EF4444]/10 px-3.5 py-3 text-[11px] text-[#FCA5A5]"
          >
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        <section className="rounded-xl border border-[#1E2E26] bg-[#111714] p-3 sm:p-4 space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            {(
              [
                { value: 'todos', label: `Todos (${feed.products.length})` },
                { value: 'disponible', label: `Disponibles ahora (${counts.disponibles})` },
                { value: 'en_cosecha', label: `Próximas cosechas (${counts.proximas})` },
              ] as { value: Tab; label: string }[]
            ).map((item) => (
              <button
                key={item.value}
                type="button"
                onClick={() => setTab(item.value)}
                className={`px-3 py-1.5 rounded-lg text-[11px] font-bold border transition-colors ${
                  tab === item.value
                    ? 'bg-[#15803D] border-[#15803D] text-black'
                    : 'bg-[#0A0A0A] border-[#1E293B] text-[#9E9E9E] hover:text-[#E5E5E5]'
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>

          <div className="grid sm:grid-cols-[1fr_auto_auto] gap-2">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#666666]" />
              <input
                type="search"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Buscar cultivo, variedad o productor…"
                className="w-full bg-[#0A0A0A] border border-[#1E293B] focus:border-[#15803D] text-sm text-[#E5E5E5] placeholder-[#666666] rounded-lg pl-9 pr-9 py-2.5 outline-none"
              />
              {search && (
                <button
                  type="button"
                  onClick={() => setSearch('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#666666] hover:text-[#E5E5E5]"
                  aria-label="Limpiar búsqueda"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            <div className="relative">
              <SlidersHorizontal className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#15803D]" />
              <select
                value={community}
                onChange={(event) => setCommunity(event.target.value as BaruCommunity | 'todas')}
                className="w-full sm:w-auto appearance-none bg-[#0A0A0A] border border-[#1E293B] focus:border-[#15803D] text-xs text-[#E5E5E5] rounded-lg pl-9 pr-8 py-2.5 outline-none"
                aria-label="Filtrar por comunidad"
              >
                <option value="todas">Todas las comunidades</option>
                {BARU_COMMUNITIES.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </select>
            </div>

            <select
              value={crop}
              onChange={(event) => setCrop(event.target.value as CropCategory | 'todos')}
              className="w-full sm:w-auto appearance-none bg-[#0A0A0A] border border-[#1E293B] focus:border-[#15803D] text-xs text-[#E5E5E5] rounded-lg px-3 pr-8 py-2.5 outline-none"
              aria-label="Filtrar por cultivo"
            >
              <option value="todos">Todos los cultivos</option>
              {CROP_CATEGORIES.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
          </div>
        </section>

        {loading ? (
          <div className="flex flex-col items-center justify-center gap-3 py-16">
            <span className="w-8 h-8 border-2 border-[#FACC15] border-t-transparent rounded-full animate-spin" />
            <p className="font-mono text-[11px] text-[#9E9E9E]">Cargando catálogo directo…</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-[#1E2E26] bg-[#111714] px-6 py-14 text-center">
            <div className="w-14 h-14 mx-auto rounded-2xl bg-[#FACC15]/10 border border-[#FACC15]/40 flex items-center justify-center">
              <ShoppingBasket className="w-7 h-7 text-[#FACC15]" />
            </div>
            <h2 className="mt-4 font-display font-black text-xl text-[#ECFDF5]">
              No encontramos cosechas con esos filtros
            </h2>
            <p className="mt-2 text-xs text-[#9E9E9E] max-w-md mx-auto leading-relaxed">
              Prueba con otra comunidad, cultivo o limpia la búsqueda para ver todo el catálogo
              disponible.
            </p>
            <button
              type="button"
              onClick={() => {
                setTab('todos');
                setSearch('');
                setCommunity('todas');
                setCrop('todos');
              }}
              className="mt-5 inline-flex items-center gap-2 rounded-lg border border-[#15803D] text-[#10B981] hover:bg-[#15803D] hover:text-black font-bold text-xs px-4 py-2"
            >
              Limpiar filtros
            </button>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-4">
            {filtered.map((product) => (
              <article
                key={product.id}
                className="rounded-xl border border-[#1E2E26] bg-[#111714] overflow-hidden flex flex-col hover:border-[#15803D]/60 transition-colors"
              >
                <div className="relative h-32 bg-[#0A0A0A]">
                  <img
                    src={getCropImageByName(product.crop)}
                    alt={product.crop}
                    className="w-full h-full object-cover opacity-80"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#111714] via-transparent to-transparent" />
                  <span
                    className={`absolute top-2 left-2 inline-flex items-center gap-1 rounded px-2 py-0.5 font-mono text-[9px] font-bold uppercase ${
                      product.status === 'disponible'
                        ? 'bg-[#10B981] text-black'
                        : 'bg-[#FACC15] text-black'
                    }`}
                  >
                    {STATUS_LABEL[product.status]}
                  </span>
                  <span className="absolute top-2 right-2 inline-flex items-center gap-1 rounded border border-[#7C3AED]/60 bg-[#0A0A0A]/85 px-1.5 py-0.5 font-mono text-[9px] text-[#A78BFA]">
                    <ShieldCheck className="w-2.5 h-2.5" />
                    MIDA · SHA-256
                  </span>
                </div>

                <div className="p-4 flex flex-col gap-2.5 flex-1">
                  <div>
                    <h2 className="font-display font-bold text-base text-[#ECFDF5] leading-tight">
                      {product.crop} — {product.variety}
                    </h2>
                    <p className="mt-1 text-[10px] font-mono text-[#9E9E9E] truncate">
                      {product.producerName}
                    </p>
                    <p className="mt-0.5 flex items-center gap-1 text-[10px] font-mono text-[#666666]">
                      <MapPin className="w-3 h-3 text-[#15803D] shrink-0" />
                      {product.community}
                    </p>
                  </div>

                  <div className="flex items-end justify-between gap-2 border-t border-[#1E2E26] pt-2.5">
                    <div>
                      <span className="block font-mono text-[9px] uppercase tracking-wider text-[#666666]">
                        Precio directo
                      </span>
                      <span className="font-display font-black text-xl text-[#FACC15]">
                        {formatUsd(product.priceUsd)}
                        <span className="ml-1 text-[10px] font-mono font-normal text-[#9E9E9E]">
                          / {product.unit}
                        </span>
                      </span>
                    </div>
                    <div className="text-right">
                      <span className="block font-mono text-[9px] uppercase tracking-wider text-[#666666]">
                        {product.status === 'disponible' ? 'Disponible' : 'Estimado'}
                      </span>
                      <span className="font-mono text-sm font-bold text-[#E5E5E5]">
                        {product.quantity.toLocaleString('es-PA')} {product.unit}
                      </span>
                    </div>
                  </div>

                  {product.estimatedHarvestDate && (
                    <p className="flex items-center gap-1 font-mono text-[10px] text-[#9E9E9E]">
                      <CalendarDays className="w-3 h-3 text-[#FACC15]" />
                      Cosecha estimada: {formatDateOnly(product.estimatedHarvestDate)}
                    </p>
                  )}

                  <button
                    type="button"
                    onClick={() => setSelected(product)}
                    className="mt-auto flex items-center justify-center gap-1.5 rounded-lg bg-[#15803D] hover:bg-[#16A34A] text-black text-[11px] font-bold py-2 transition-colors"
                  >
                    Ver detalle y contactar
                  </button>
                </div>
              </article>
            ))}
          </div>
        )}

        <p className="pb-6 text-center font-mono text-[10px] text-[#666666]">
          {profile?.name ? `${profile.name} · ` : ''}
          Los precios se muestran en USD y no incluyen logística de exportación.
        </p>
      </main>

      {selected && (
        <div className="fixed inset-0 z-50 flex items-start sm:items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-sm">
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="market-detail-title"
            className="w-full max-w-2xl max-h-[92vh] overflow-y-auto bg-[#111714] border border-[#1E2E26] rounded-2xl shadow-2xl"
          >
            <div className="relative h-40 sm:h-48">
              <img
                src={getCropImageByName(selected.crop)}
                alt={selected.crop}
                className="w-full h-full object-cover opacity-80"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#111714] via-[#111714]/40 to-transparent" />
              <button
                type="button"
                onClick={() => setSelected(null)}
                className="absolute top-3 right-3 p-1.5 rounded-lg bg-black/60 text-[#E5E5E5] hover:bg-black/80"
                aria-label="Cerrar detalle"
              >
                <X className="w-5 h-5" />
              </button>
              <div className="absolute bottom-3 left-4 right-4">
                <span
                  className={`inline-flex items-center gap-1 rounded px-2 py-0.5 font-mono text-[9px] font-bold uppercase ${
                    selected.status === 'disponible'
                      ? 'bg-[#10B981] text-black'
                      : 'bg-[#FACC15] text-black'
                  }`}
                >
                  {STATUS_LABEL[selected.status]}
                </span>
                <h2
                  id="market-detail-title"
                  className="mt-1.5 font-display font-black text-2xl text-[#ECFDF5] leading-tight"
                >
                  {selected.crop} — {selected.variety}
                </h2>
                <p className="text-[11px] font-mono text-[#CCCCCC]">
                  {selected.producerName} · {selected.community}
                </p>
              </div>
            </div>

            <div className="p-5 space-y-4">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                <div className="rounded-lg border border-[#1E2E26] bg-[#0A0A0A] p-3">
                  <p className="font-mono text-[9px] uppercase text-[#666666]">Precio</p>
                  <p className="mt-1 font-display font-black text-lg text-[#FACC15]">
                    {formatUsd(selected.priceUsd)}
                    <span className="ml-1 text-[9px] font-mono font-normal text-[#9E9E9E]">
                      /{selected.unit}
                    </span>
                  </p>
                </div>
                <div className="rounded-lg border border-[#1E2E26] bg-[#0A0A0A] p-3">
                  <p className="font-mono text-[9px] uppercase text-[#666666]">Cantidad</p>
                  <p className="mt-1 font-mono text-sm font-bold text-[#E5E5E5]">
                    {selected.quantity.toLocaleString('es-PA')} {selected.unit}
                  </p>
                </div>
                <div className="rounded-lg border border-[#1E2E26] bg-[#0A0A0A] p-3">
                  <p className="font-mono text-[9px] uppercase text-[#666666]">Comunidad</p>
                  <p className="mt-1 text-xs font-bold text-[#E5E5E5]">{selected.community}</p>
                </div>
                <div className="rounded-lg border border-[#1E2E26] bg-[#0A0A0A] p-3">
                  <p className="font-mono text-[9px] uppercase text-[#666666]">Cosecha</p>
                  <p className="mt-1 font-mono text-[11px] font-bold text-[#E5E5E5]">
                    {selected.estimatedHarvestDate
                      ? formatDateOnly(selected.estimatedHarvestDate)
                      : 'Disponible'}
                  </p>
                </div>
              </div>

              {selected.description && (
                <p className="text-xs text-[#CCCCCC] leading-relaxed">{selected.description}</p>
              )}

              <div className="rounded-lg border border-[#7C3AED]/40 bg-[#7C3AED]/10 p-3">
                <div className="flex items-center justify-between gap-2">
                  <span className="flex items-center gap-1.5 font-mono text-[10px] font-bold uppercase tracking-wider text-[#A78BFA]">
                    <Hash className="w-3.5 h-3.5" />
                    Huella SHA-256 de trazabilidad
                  </span>
                  <button
                    type="button"
                    onClick={() => handleCopyHash(selected.traceabilityHash)}
                    className="font-mono text-[9px] text-[#A78BFA] hover:text-[#E5E5E5]"
                  >
                    {copied ? 'Copiada' : 'Copiar'}
                  </button>
                </div>
                <p className="mt-1.5 break-all font-mono text-[10px] leading-relaxed text-[#CCCCCC]">
                  {selected.traceabilityHash || 'Huella no disponible'}
                </p>
                {selected.gps && (
                  <p className="mt-1.5 font-mono text-[9px] text-[#9E9E9E]">
                    GPS: {selected.gps.lat.toFixed(5)}°N, {selected.gps.lng.toFixed(5)}°W
                  </p>
                )}
              </div>

              <div className="rounded-lg border border-[#1E293B] bg-[#0A0A0A] p-3.5 space-y-3">
                <div className="flex items-center gap-1.5">
                  <Leaf className="w-4 h-4 text-[#10B981]" />
                  <h3 className="font-display font-bold text-sm text-[#ECFDF5]">
                    Orden protegida con Escrow
                  </h3>
                </div>
                <div className="flex flex-col sm:flex-row sm:items-end gap-2">
                  <div className="flex-1">
                    <label
                      htmlFor="order-qty"
                      className="block font-mono text-[9px] uppercase tracking-wider text-[#9E9E9E] mb-1"
                    >
                      Cantidad a solicitar ({selected.unit})
                    </label>
                    <input
                      id="order-qty"
                      type="number"
                      min="0.01"
                      step="0.01"
                      value={orderQty}
                      onChange={(event) => setOrderQty(event.target.value)}
                      className="w-full bg-[#111714] border border-[#1E293B] focus:border-[#FACC15] text-sm font-mono text-[#FACC15] rounded-lg px-3 py-2 outline-none"
                    />
                  </div>
                  <div className="flex-1 font-mono text-[10px] text-[#9E9E9E] space-y-0.5">
                    <p className="flex justify-between gap-2">
                      <span>Subtotal</span>
                      <span className="text-[#E5E5E5]">
                        {orderPreview ? formatUsd(orderPreview.subtotal) : '—'}
                      </span>
                    </p>
                    <p className="flex justify-between gap-2">
                      <span>Custodia Escrow (1.5%)</span>
                      <span className="text-[#E5E5E5]">
                        {orderPreview ? formatUsd(orderPreview.fee) : '—'}
                      </span>
                    </p>
                    <p className="flex justify-between gap-2 border-t border-[#1E2E26] pt-0.5">
                      <span className="text-[#FACC15] font-bold">Total estimado</span>
                      <span className="text-[#FACC15] font-bold">
                        {orderPreview ? formatUsd(orderPreview.total) : '—'}
                      </span>
                    </p>
                  </div>
                </div>
                <p className="font-mono text-[9px] text-[#666666]">
                  La solicitud se envía por correo al productor. La custodia Escrow se formaliza con
                  el equipo de AgroBarú antes de cualquier pago.
                </p>
                <div className="grid sm:grid-cols-2 gap-2">
                  <a
                    href={mailtoLink(selected, true)}
                    className={`flex items-center justify-center gap-1.5 rounded-lg bg-[#FACC15] hover:bg-[#EAB308] text-black text-[11px] font-bold py-2.5 transition-colors ${
                      orderPreview ? '' : 'pointer-events-none opacity-50'
                    }`}
                  >
                    <ShoppingBasket className="w-3.5 h-3.5" />
                    Solicitar orden protegida
                  </a>
                  <a
                    href={mailtoLink(selected, false)}
                    className="flex items-center justify-center gap-1.5 rounded-lg border border-[#15803D]/60 text-[#10B981] hover:bg-[#15803D] hover:text-black text-[11px] font-bold py-2.5 transition-colors"
                  >
                    <Mail className="w-3.5 h-3.5" />
                    Contactar al productor
                  </a>
                </div>
                {!selected.producerEmail && (
                  <p className="flex items-center gap-1 font-mono text-[9px] text-[#F97316]">
                    <AlertCircle className="w-3 h-3" />
                    El productor aún no registró un correo de contacto.
                  </p>
                )}
              </div>

              <div className="flex items-center gap-1.5 font-mono text-[9px] text-[#666666]">
                <CheckCircle2 className="w-3 h-3 text-[#10B981]" />
                Lote publicado el {formatDateOnly(selected.createdAt)}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
