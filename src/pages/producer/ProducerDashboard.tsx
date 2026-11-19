import React, { useEffect, useMemo, useState } from 'react';
import {
  AlertCircle,
  CalendarDays,
  CheckCircle2,
  CloudOff,
  Copy,
  Edit3,
  Hash,
  Leaf,
  MapPin,
  Package,
  Plus,
  RefreshCw,
  ShieldCheck,
  Sprout,
  Trash2,
  Wifi,
  WifiOff,
  X,
} from 'lucide-react';
import { RoleNavbar } from '@/components/layout/RoleNavbar';
import { useAuth } from '@/context/AuthContext';
import { translateAuthError } from '@/lib/authErrors';
import { getCropImageByName } from '@/lib/imageFallbacks';
import { copyToClipboard, formatDateOnly, formatUsd } from '@/lib/utils';
import {
  deleteProduct,
  subscribeToProducerProducts,
  type ProductsFeed,
} from '@/services/productsService';
import { shortenHash } from '@/utils/crypto';
import type { HarvestStatus, Product } from '@/types/agrobaru';
import { ProductFormModal } from './ProductFormModal';

type Filter = 'todos' | HarvestStatus;

const STATUS_LABEL: Record<HarvestStatus, string> = {
  disponible: 'Disponible ahora',
  en_cosecha: 'Próxima cosecha',
};

const emptyFeed: ProductsFeed = { products: [], fromCache: false, pendingWrites: false };

export const ProducerDashboard: React.FC = () => {
  const { user, profile, online } = useAuth();
  const [feed, setFeed] = useState<ProductsFeed>(emptyFeed);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<Filter>('todos');
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Product | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Product | null>(null);
  const [deleteBusy, setDeleteBusy] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [toastError, setToastError] = useState(false);

  useEffect(() => {
    if (!user?.uid) return;
    setLoading(true);
    const unsubscribe = subscribeToProducerProducts(
      user.uid,
      (nextFeed) => {
        setFeed(nextFeed);
        setLoading(false);
        setError(null);
      },
      (snapshotError) => {
        console.warn('[AgroBarú] Error en productos del productor:', snapshotError);
        setError(translateAuthError(snapshotError));
        setLoading(false);
      },
    );
    return unsubscribe;
  }, [user?.uid]);

  useEffect(() => {
    if (!toast) return;
    const timeout = setTimeout(() => setToast(null), 4200);
    return () => clearTimeout(timeout);
  }, [toast]);

  const showToast = (message: string, isError = false) => {
    setToast(message);
    setToastError(isError);
  };

  const visibleProducts = useMemo(() => {
    if (filter === 'todos') return feed.products;
    return feed.products.filter((product) => product.status === filter);
  }, [feed.products, filter]);

  const stats = useMemo(() => {
    const disponibles = feed.products.filter((item) => item.status === 'disponible').length;
    const enCosecha = feed.products.filter((item) => item.status === 'en_cosecha').length;
    const value = feed.products.reduce(
      (total, item) => total + item.quantity * item.priceUsd,
      0,
    );
    return { disponibles, enCosecha, value };
  }, [feed.products]);

  const handleCopyHash = async (product: Product) => {
    const copied = await copyToClipboard(product.traceabilityHash);
    showToast(
      copied ? 'Huella SHA-256 copiada al portapapeles.' : 'No se pudo copiar la huella.',
      !copied,
    );
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleteBusy(true);
    try {
      await deleteProduct(deleteTarget.id);
      setDeleteTarget(null);
      showToast('Cosecha eliminada del catálogo.');
    } catch (deleteError) {
      showToast(translateAuthError(deleteError), true);
    } finally {
      setDeleteBusy(false);
    }
  };

  const offlineMode = !online || feed.fromCache;

  return (
    <div className="min-h-screen bg-[#090D0B] text-[#E5E5E5]">
      <RoleNavbar />

      <main className="max-w-7xl mx-auto px-3 sm:px-6 py-6 space-y-6">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded border border-[#15803D]/50 bg-[#15803D]/10 px-2 py-1 font-mono text-[10px] uppercase tracking-wider text-[#10B981]">
                <Sprout className="w-3 h-3" />
                Panel de productor
              </span>
              <span
                className={`inline-flex items-center gap-1.5 rounded border px-2 py-1 font-mono text-[10px] font-bold ${
                  offlineMode
                    ? 'border-[#FACC15]/50 bg-[#FACC15]/10 text-[#FACC15]'
                    : 'border-[#10B981]/50 bg-[#10B981]/10 text-[#10B981]'
                }`}
              >
                {offlineMode ? <CloudOff className="w-3 h-3" /> : <Wifi className="w-3 h-3" />}
                {offlineMode ? 'CACHÉ OFFLINE' : 'TIEMPO REAL'}
              </span>
            </div>
            <h1 className="mt-2 font-display font-black text-2xl sm:text-3xl text-[#ECFDF5]">
              Mi Panel de Cosechas
            </h1>
            <p className="mt-1 text-xs text-[#9E9E9E] max-w-2xl">
              {profile?.name ? `Hola, ${profile.name}. ` : ''}Publica, actualiza y retira tus
              lotes. Solo tú puedes gestionar los productos de esta cuenta.
            </p>
          </div>

          <button
            type="button"
            onClick={() => {
              setEditing(null);
              setFormOpen(true);
            }}
            className="flex items-center justify-center gap-2 rounded-lg bg-[#15803D] hover:bg-[#16A34A] text-black font-bold text-sm px-4 py-2.5 transition-colors shrink-0"
          >
            <Plus className="w-4 h-4" />
            Publicar cosecha
          </button>
        </div>

        {offlineMode && (
          <div className="flex items-start gap-2 rounded-xl border border-[#FACC15]/40 bg-[#FACC15]/10 px-3.5 py-3 text-[11px] text-[#FACC15]">
            <CloudOff className="w-4 h-4 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold">Estás trabajando con la copia local de tus lotes.</p>
              <p className="text-[#9E9E9E] mt-0.5">
                Los cambios que hagas ahora se guardarán en este dispositivo y se sincronizarán
                automáticamente cuando vuelvas a tener señal.
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

        <section className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="rounded-xl border border-[#1E2E26] bg-[#111714] p-4">
            <div className="flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-wider text-[#9E9E9E]">
              <Package className="w-3.5 h-3.5 text-[#10B981]" />
              Cosechas publicadas
            </div>
            <p className="mt-2 font-display font-black text-2xl text-[#ECFDF5]">
              {feed.products.length}
            </p>
          </div>
          <div className="rounded-xl border border-[#1E2E26] bg-[#111714] p-4">
            <div className="flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-wider text-[#9E9E9E]">
              <CheckCircle2 className="w-3.5 h-3.5 text-[#10B981]" />
              Disponibles
            </div>
            <p className="mt-2 font-display font-black text-2xl text-[#10B981]">
              {stats.disponibles}
            </p>
          </div>
          <div className="rounded-xl border border-[#1E2E26] bg-[#111714] p-4">
            <div className="flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-wider text-[#9E9E9E]">
              <RefreshCw className="w-3.5 h-3.5 text-[#FACC15]" />
              Próximas cosechas
            </div>
            <p className="mt-2 font-display font-black text-2xl text-[#FACC15]">
              {stats.enCosecha}
            </p>
          </div>
          <div className="rounded-xl border border-[#FACC15]/40 bg-[#FACC15]/5 p-4">
            <div className="flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-wider text-[#9E9E9E]">
              <Leaf className="w-3.5 h-3.5 text-[#FACC15]" />
              Valor del inventario
            </div>
            <p className="mt-2 font-display font-black text-2xl text-[#FACC15]">
              {formatUsd(stats.value)}
            </p>
          </div>
        </section>

        <div className="flex flex-wrap items-center gap-2">
          {(
            [
              { value: 'todos', label: `Todas (${feed.products.length})` },
              { value: 'disponible', label: `Disponibles (${stats.disponibles})` },
              { value: 'en_cosecha', label: `Próximas (${stats.enCosecha})` },
            ] as { value: Filter; label: string }[]
          ).map((item) => (
            <button
              key={item.value}
              type="button"
              onClick={() => setFilter(item.value)}
              className={`px-3 py-1.5 rounded-lg text-[11px] font-bold border transition-colors ${
                filter === item.value
                  ? 'bg-[#15803D] border-[#15803D] text-black'
                  : 'bg-[#111714] border-[#1E2E26] text-[#9E9E9E] hover:text-[#E5E5E5]'
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center gap-3 py-16">
            <span className="w-8 h-8 border-2 border-[#15803D] border-t-transparent rounded-full animate-spin" />
            <p className="font-mono text-[11px] text-[#9E9E9E]">Cargando tus cosechas…</p>
          </div>
        ) : visibleProducts.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-[#1E2E26] bg-[#111714] px-6 py-14 text-center">
            <div className="w-14 h-14 mx-auto rounded-2xl bg-[#15803D]/15 border border-[#15803D]/40 flex items-center justify-center">
              <Sprout className="w-7 h-7 text-[#10B981]" />
            </div>
            <h2 className="mt-4 font-display font-black text-xl text-[#ECFDF5]">
              {feed.products.length === 0 ? 'Aún no has publicado cosechas' : 'No hay lotes en este filtro'}
            </h2>
            <p className="mt-2 text-xs text-[#9E9E9E] max-w-md mx-auto leading-relaxed">
              {feed.products.length === 0
                ? 'Publica tu primer lote para que compradores de todo Panamá y del exterior puedan encontrarte.'
                : 'Cambia el filtro para ver tus otros lotes publicados.'}
            </p>
            {feed.products.length === 0 && (
              <button
                type="button"
                onClick={() => {
                  setEditing(null);
                  setFormOpen(true);
                }}
                className="mt-5 inline-flex items-center gap-2 rounded-lg bg-[#15803D] hover:bg-[#16A34A] text-black font-bold text-sm px-4 py-2.5"
              >
                <Plus className="w-4 h-4" />
                Publicar mi primera cosecha
              </button>
            )}
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-4">
            {visibleProducts.map((product) => (
              <article
                key={product.id}
                className="rounded-xl border border-[#1E2E26] bg-[#111714] overflow-hidden flex flex-col"
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
                  <span
                    className={`absolute top-2 right-2 inline-flex items-center gap-1 rounded border px-1.5 py-0.5 font-mono text-[9px] ${
                      offlineMode || feed.pendingWrites
                        ? 'border-[#FACC15]/60 bg-[#0A0A0A]/85 text-[#FACC15]'
                        : 'border-[#10B981]/60 bg-[#0A0A0A]/85 text-[#10B981]'
                    }`}
                    title={
                      offlineMode || feed.pendingWrites
                        ? 'Guardado en el dispositivo; pendiente de sincronizar'
                        : 'Sincronizado con Firestore'
                    }
                  >
                    {offlineMode || feed.pendingWrites ? (
                      <WifiOff className="w-2.5 h-2.5" />
                    ) : (
                      <ShieldCheck className="w-2.5 h-2.5" />
                    )}
                    {offlineMode || feed.pendingWrites ? 'OFFLINE' : 'AL DÍA'}
                  </span>
                </div>

                <div className="p-4 flex flex-col gap-2.5 flex-1">
                  <div>
                    <h2 className="font-display font-bold text-base text-[#ECFDF5] leading-tight">
                      {product.crop} — {product.variety}
                    </h2>
                    <p className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[10px] text-[#9E9E9E] font-mono">
                      <span className="inline-flex items-center gap-1">
                        <MapPin className="w-3 h-3 text-[#15803D]" />
                        {product.community}
                      </span>
                      {product.estimatedHarvestDate && (
                        <span className="inline-flex items-center gap-1">
                          <CalendarDays className="w-3 h-3 text-[#15803D]" />
                          {formatDateOnly(product.estimatedHarvestDate)}
                        </span>
                      )}
                    </p>
                  </div>

                  <div className="flex items-end justify-between gap-2 border-t border-[#1E2E26] pt-2.5">
                    <div>
                      <span className="block font-mono text-[9px] uppercase tracking-wider text-[#666666]">
                        Precio unitario
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

                  <button
                    type="button"
                    onClick={() => handleCopyHash(product)}
                    className="group flex items-center justify-between gap-2 rounded-lg border border-[#7C3AED]/40 bg-[#7C3AED]/10 px-2.5 py-1.5 text-left"
                    title="Copiar huella SHA-256 completa"
                  >
                    <span className="flex items-center gap-1.5 min-w-0">
                      <Hash className="w-3 h-3 text-[#A78BFA] shrink-0" />
                      <span className="font-mono text-[10px] text-[#A78BFA] truncate">
                        {shortenHash(product.traceabilityHash)}
                      </span>
                    </span>
                    <Copy className="w-3 h-3 text-[#A78BFA]/70 group-hover:text-[#A78BFA] shrink-0" />
                  </button>

                  <div className="mt-auto flex items-center gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => {
                        setEditing(product);
                        setFormOpen(true);
                      }}
                      className="flex-1 flex items-center justify-center gap-1.5 rounded-lg border border-[#15803D]/60 text-[#10B981] hover:bg-[#15803D] hover:text-black text-[11px] font-bold py-2 transition-colors"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                      Editar
                    </button>
                    <button
                      type="button"
                      onClick={() => setDeleteTarget(product)}
                      className="flex-1 flex items-center justify-center gap-1.5 rounded-lg border border-[#EF4444]/50 text-[#EF4444] hover:bg-[#EF4444] hover:text-black text-[11px] font-bold py-2 transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      Eliminar
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </main>

      <ProductFormModal
        open={formOpen}
        editing={editing}
        onClose={() => {
          setFormOpen(false);
          setEditing(null);
        }}
        onSaved={(message) => showToast(message)}
      />

      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="delete-title"
            className="w-full max-w-md rounded-2xl border border-[#EF4444]/50 bg-[#111714] p-5"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#EF4444]/15 border border-[#EF4444]/40 flex items-center justify-center shrink-0">
                <Trash2 className="w-5 h-5 text-[#EF4444]" />
              </div>
              <button
                type="button"
                onClick={() => setDeleteTarget(null)}
                className="text-[#9E9E9E] hover:text-[#E5E5E5]"
                aria-label="Cerrar confirmación"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <h2 id="delete-title" className="mt-3 font-display font-black text-lg text-[#ECFDF5]">
              ¿Eliminar esta cosecha?
            </h2>
            <p className="mt-1.5 text-xs text-[#9E9E9E] leading-relaxed">
              Se retirará permanentemente <strong className="text-[#E5E5E5]">{deleteTarget.crop} — {deleteTarget.variety}</strong>{' '}
              del catálogo. Esta acción no se puede deshacer.
            </p>
            <div className="mt-5 flex flex-col-reverse sm:flex-row gap-2 sm:justify-end">
              <button
                type="button"
                onClick={() => setDeleteTarget(null)}
                disabled={deleteBusy}
                className="px-4 py-2 rounded-lg border border-[#1E293B] text-[#CCCCCC] hover:bg-[#141414] text-xs font-bold disabled:opacity-50"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleDelete}
                disabled={deleteBusy}
                className="flex items-center justify-center gap-1.5 px-4 py-2 rounded-lg bg-[#EF4444] hover:bg-[#DC2626] text-black text-xs font-bold disabled:opacity-60"
              >
                {deleteBusy ? (
                  <span className="w-3.5 h-3.5 border-2 border-black border-t-transparent rounded-full animate-spin" />
                ) : (
                  <Trash2 className="w-3.5 h-3.5" />
                )}
                Sí, eliminar
              </button>
            </div>
          </div>
        </div>
      )}

      {toast && (
        <div
          role="status"
          className={`fixed bottom-4 left-1/2 -translate-x-1/2 z-[60] max-w-[92vw] flex items-center gap-2 rounded-lg border px-3.5 py-2.5 shadow-xl text-[11px] ${
            toastError
              ? 'bg-[#1A0E0E] border-[#EF4444]/60 text-[#FCA5A5]'
              : 'bg-[#0E1A14] border-[#10B981]/60 text-[#6EE7B7]'
          }`}
        >
          {toastError ? (
            <AlertCircle className="w-4 h-4 shrink-0" />
          ) : (
            <CheckCircle2 className="w-4 h-4 shrink-0" />
          )}
          <span>{toast}</span>
        </div>
      )}
    </div>
  );
};
