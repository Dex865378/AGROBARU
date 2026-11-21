import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowLeft,
  Loader2,
  MessageSquare,
  Package,
  RefreshCw,
  ShieldCheck,
  Trash2,
  Users,
  History,
} from 'lucide-react';
import { collection, deleteDoc, doc, getDocs, limit, orderBy, query } from 'firebase/firestore';
import { RoleNavbar } from '@/components/layout/RoleNavbar';
import { useAuth } from '@/context/AuthContext';
import { db } from '@/lib/firebase';
import { ADMIN_EMAIL, isAdminEmail } from '@/lib/admin';
import {
  ADMIN_AUDIT_COLLECTION,
  AdminAuditEntry,
  logAdminAction,
} from '@/services/adminAuditService';

interface AdminUserRow {
  id: string;
  name: string;
  email: string;
  role: string;
  source: 'users' | 'agrobaru_users';
}

interface AdminProductRow {
  id: string;
  name: string;
  producer: string;
  price: number;
  source: 'products' | 'agrobaru_batches';
}

interface AdminCommunityRow {
  id: string;
  groupId: string;
  author: string;
  text: string;
  createdAt: string;
}

const COMMUNITY_GROUP_IDS = ['GRP-01', 'GRP-02', 'GRP-03'];

type AdminTab = 'USUARIOS' | 'PRODUCTOS' | 'COMUNIDAD' | 'AUDITORIA';

export const AdminPage: React.FC = () => {
  const { user, profile } = useAuth();
  const allowed = isAdminEmail(user?.email || profile?.email);

  const [tab, setTab] = useState<AdminTab>('USUARIOS');
  const [users, setUsers] = useState<AdminUserRow[]>([]);
  const [products, setProducts] = useState<AdminProductRow[]>([]);
  const [community, setCommunity] = useState<AdminCommunityRow[]>([]);
  const [audit, setAudit] = useState<AdminAuditEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    if (!allowed) return;
    setLoading(true);
    setError(null);
    try {
      const [newUsers, legacyUsers, newProducts, legacyBatches, auditSnapshot] = await Promise.all([
        getDocs(collection(db, 'users')),
        getDocs(collection(db, 'agrobaru_users')),
        getDocs(collection(db, 'products')),
        getDocs(collection(db, 'agrobaru_batches')),
        getDocs(query(collection(db, ADMIN_AUDIT_COLLECTION), orderBy('createdAt', 'desc'), limit(80))),
      ]);

      const communitySnapshots = await Promise.all(
        COMMUNITY_GROUP_IDS.map(async (groupId) => {
          const snapshot = await getDocs(collection(db, 'communityMessages', groupId, 'messages'));
          return snapshot.docs.map((item) => {
            const data = item.data();
            return {
              id: item.id,
              groupId,
              author: String(data.senderName || 'Usuario'),
              text: String(data.text || (data.sticker ? '[Sticker]' : '')),
              createdAt: String(data.createdAt || data.timestamp || ''),
            };
          });
        }),
      );

      const userRows: AdminUserRow[] = [
        ...newUsers.docs.map((item) => {
          const data = item.data();
          return {
            id: item.id,
            name: String(data.name || 'Sin nombre'),
            email: String(data.email || ''),
            role: String(data.role || 'sin rol'),
            source: 'users' as const,
          };
        }),
        ...legacyUsers.docs.map((item) => {
          const data = item.data();
          return {
            id: item.id,
            name: String(data.name || 'Sin nombre'),
            email: String(data.email || ''),
            role: String(data.role || 'sin rol'),
            source: 'agrobaru_users' as const,
          };
        }),
      ];

      const productRows: AdminProductRow[] = [
        ...newProducts.docs.map((item) => {
          const data = item.data();
          return {
            id: item.id,
            name: String(data.name || data.cropName || 'Producto'),
            producer: String(data.producerName || data.producerId || 'Productor'),
            price: Number(data.priceUsd || data.pricePerKgUsd || 0),
            source: 'products' as const,
          };
        }),
        ...legacyBatches.docs.map((item) => {
          const data = item.data();
          return {
            id: item.id,
            name: String(data.cropName || 'Lote agrícola'),
            producer: String(data.producerName || 'Productor'),
            price: Number(data.pricePerKgUsd || 0),
            source: 'agrobaru_batches' as const,
          };
        }),
      ];

      setUsers(userRows);
      setProducts(productRows);
      setCommunity(
        communitySnapshots
          .flat()
          .sort((left, right) => right.createdAt.localeCompare(left.createdAt)),
      );
      setAudit(
        auditSnapshot.docs.map((item) => ({
          id: item.id,
          ...(item.data() as Omit<AdminAuditEntry, 'id'>),
        })),
      );
    } catch (loadError) {
      setError(
        loadError instanceof Error
          ? loadError.message
          : 'No se pudieron cargar los datos de administración.',
      );
    } finally {
      setLoading(false);
    }
  }, [allowed]);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  const totals = useMemo(
    () => ({
      users: users.filter((item) => item.source === 'users').length,
      producers: users.filter((item) => item.role === 'productor' || item.role === 'farmer').length,
      products: products.length,
      community: community.length,
    }),
    [users, products, community],
  );

  const handleDeleteProduct = async (row: AdminProductRow) => {
    if (!window.confirm(`¿Eliminar "${row.name}" del catálogo? Esta acción no se puede deshacer.`)) {
      return;
    }
    setDeletingId(`${row.source}:${row.id}`);
    try {
      await deleteDoc(doc(db, row.source, row.id));
      setProducts((current) =>
        current.filter((item) => !(item.id === row.id && item.source === row.source)),
      );
      void logAdminAction({
        action: 'delete_product',
        targetType: 'product',
        targetId: `${row.source}/${row.id}`,
        detail: `Eliminó el lote "${row.name}" de ${row.producer}`,
        adminEmail: user?.email || profile?.email || ADMIN_EMAIL,
        adminUid: user?.uid || '',
      }).then(() => void loadData());
    } catch (deleteError) {
      setError(
        deleteError instanceof Error
          ? deleteError.message
          : 'No se pudo eliminar el producto.',
      );
    } finally {
      setDeletingId(null);
    }
  };

  const handleDeleteCommunity = async (row: AdminCommunityRow) => {
    if (!window.confirm('¿Eliminar este mensaje de la comunidad? Esta acción no se puede deshacer.')) {
      return;
    }
    setDeletingId(`community:${row.groupId}:${row.id}`);
    try {
      await deleteDoc(doc(db, 'communityMessages', row.groupId, 'messages', row.id));
      setCommunity((current) =>
        current.filter((item) => !(item.id === row.id && item.groupId === row.groupId)),
      );
      void logAdminAction({
        action: 'delete_community_message',
        targetType: 'community',
        targetId: `${row.groupId}/${row.id}`,
        detail: `Moderó un mensaje de ${row.author}: ${row.text.slice(0, 80)}`,
        adminEmail: user?.email || profile?.email || ADMIN_EMAIL,
        adminUid: user?.uid || '',
      }).then(() => void loadData());
    } catch (deleteError) {
      setError(
        deleteError instanceof Error
          ? deleteError.message
          : 'No se pudo eliminar el mensaje de la comunidad.',
      );
    } finally {
      setDeletingId(null);
    }
  };

  if (!allowed) {
    return (
      <div className="min-h-screen bg-[#090D0B] text-[#E5E5E5]">
        <RoleNavbar />
        <main className="mx-auto max-w-xl px-4 py-16 text-center font-mono">
          <ShieldCheck className="mx-auto h-10 w-10 text-[#EF4444]" />
          <h1 className="mt-3 font-display text-xl font-black text-[#ECFDF5]">
            Acceso restringido
          </h1>
          <p className="mt-2 text-xs text-[#9E9E9E]">
            Esta sección solo está disponible para la cuenta administradora de AgroBarú.
          </p>
          <Link
            to="/"
            className="mt-5 inline-flex items-center gap-1.5 rounded-lg border border-[#1E2E26] px-3 py-2 text-[11px] font-bold text-[#CCCCCC] hover:bg-[#141414]"
          >
            <ArrowLeft className="h-3.5 w-3.5" /> Volver al inicio
          </Link>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#090D0B] text-[#E5E5E5]">
      <RoleNavbar />
      <main className="mx-auto max-w-6xl space-y-5 px-3 py-6 sm:px-6">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-[#FACC15]">
              Acceso administrador · {ADMIN_EMAIL}
            </p>
            <h1 className="mt-1 font-display text-2xl font-black text-[#ECFDF5] sm:text-3xl">
              Panel de Administración
            </h1>
            <p className="mt-1 text-xs text-[#9E9E9E]">
              Usuarios, productores y catálogo de AgroBarú en un solo lugar.
            </p>
          </div>
          <button
            type="button"
            onClick={() => void loadData()}
            disabled={loading}
            className="inline-flex items-center gap-1.5 rounded-lg border border-[#1E2E26] bg-[#111714] px-3 py-2 font-mono text-[11px] font-bold text-[#CCCCCC] hover:border-[#15803D] disabled:opacity-60"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
            Actualizar
          </button>
        </div>

        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 sm:gap-3">
          <div className="rounded-xl border border-[#1E2E26] bg-[#111714] p-3">
            <Users className="h-4 w-4 text-[#10B981]" />
            <p className="mt-2 font-display text-2xl font-black text-[#ECFDF5]">{totals.users}</p>
            <p className="font-mono text-[9px] uppercase text-[#9E9E9E]">Cuentas</p>
          </div>
          <div className="rounded-xl border border-[#1E2E26] bg-[#111714] p-3">
            <ShieldCheck className="h-4 w-4 text-[#7C3AED]" />
            <p className="mt-2 font-display text-2xl font-black text-[#ECFDF5]">{totals.producers}</p>
            <p className="font-mono text-[9px] uppercase text-[#9E9E9E]">Productores</p>
          </div>
          <div className="rounded-xl border border-[#1E2E26] bg-[#111714] p-3">
            <Package className="h-4 w-4 text-[#FACC15]" />
            <p className="mt-2 font-display text-2xl font-black text-[#ECFDF5]">{totals.products}</p>
            <p className="font-mono text-[9px] uppercase text-[#9E9E9E]">Lotes</p>
          </div>
          <div className="rounded-xl border border-[#1E2E26] bg-[#111714] p-3">
            <MessageSquare className="h-4 w-4 text-[#38BDF8]" />
            <p className="mt-2 font-display text-2xl font-black text-[#ECFDF5]">{totals.community}</p>
            <p className="font-mono text-[9px] uppercase text-[#9E9E9E]">Mensajes</p>
          </div>
        </div>

        {error && (
          <div className="rounded-xl border border-[#EF4444]/60 bg-[#EF4444]/10 px-3 py-2 text-[11px] text-[#FCA5A5]">
            {error}
          </div>
        )}

        <div className="flex gap-1 border-b border-[#1E2E26]">
          {(['USUARIOS', 'PRODUCTOS', 'COMUNIDAD', 'AUDITORIA'] as const).map((item) => (
            <button
              key={item}
              type="button"
              onClick={() => setTab(item)}
              className={`px-2.5 sm:px-4 py-2 font-mono text-[10px] sm:text-[11px] font-bold whitespace-nowrap ${
                tab === item
                  ? 'border-b-2 border-[#10B981] text-[#10B981]'
                  : 'text-[#9E9E9E] hover:text-[#E5E5E5]'
              }`}
            >
              {item === 'AUDITORIA' ? 'AUDITORÍA' : item}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="flex items-center justify-center gap-2 rounded-xl border border-[#1E2E26] bg-[#111714] py-12 text-xs text-[#9E9E9E]">
            <Loader2 className="h-4 w-4 animate-spin" /> Cargando datos…
          </div>
        ) : tab === 'USUARIOS' ? (
          <div className="overflow-hidden rounded-xl border border-[#1E2E26] bg-[#111714]">
            <div className="grid grid-cols-[1.2fr_1.5fr_0.8fr_0.7fr] gap-2 border-b border-[#1E2E26] px-3 py-2 font-mono text-[9px] uppercase text-[#9E9E9E]">
              <span>Nombre</span>
              <span>Correo</span>
              <span>Rol</span>
              <span>Origen</span>
            </div>
            {users.length === 0 ? (
              <p className="px-3 py-8 text-center text-xs text-[#9E9E9E]">
                Todavía no hay cuentas registradas.
              </p>
            ) : users.map((row) => (
              <div
                key={`${row.source}:${row.id}`}
                className="grid grid-cols-[1.2fr_1.5fr_0.8fr_0.7fr] items-center gap-2 border-b border-[#1E2E26]/60 px-3 py-2 text-[11px] last:border-0"
              >
                <span className="truncate font-bold text-[#E5E5E5]">{row.name}</span>
                <span className="truncate font-mono text-[10px] text-[#9E9E9E]">{row.email || '—'}</span>
                <span className="font-mono text-[10px] uppercase text-[#FACC15]">{row.role}</span>
                <span className="font-mono text-[9px] text-[#666666]">{row.source}</span>
              </div>
            ))}
          </div>
        ) : tab === 'PRODUCTOS' ? (
          <div className="overflow-hidden rounded-xl border border-[#1E2E26] bg-[#111714]">
            <div className="grid grid-cols-[1.4fr_1fr_0.6fr_0.5fr] gap-2 border-b border-[#1E2E26] px-3 py-2 font-mono text-[9px] uppercase text-[#9E9E9E]">
              <span>Lote</span>
              <span>Productor</span>
              <span>Precio</span>
              <span className="text-right">Acción</span>
            </div>
            {products.length === 0 ? (
              <p className="px-3 py-8 text-center text-xs text-[#9E9E9E]">
                No hay lotes publicados.
              </p>
            ) : (
              products.map((row) => {
                const key = `${row.source}:${row.id}`;
                return (
                  <div
                    key={key}
                    className="grid grid-cols-[1.4fr_1fr_0.6fr_0.5fr] items-center gap-2 border-b border-[#1E2E26]/60 px-3 py-2 text-[11px] last:border-0"
                  >
                    <span className="truncate font-bold text-[#E5E5E5]">{row.name}</span>
                    <span className="truncate text-[10px] text-[#9E9E9E]">{row.producer}</span>
                    <span className="font-mono text-[10px] text-[#FACC15]">${row.price.toFixed(2)}</span>
                    <div className="text-right">
                      <button
                        type="button"
                        onClick={() => void handleDeleteProduct(row)}
                        disabled={deletingId === key}
                        className="inline-flex items-center gap-1 rounded border border-[#EF4444]/40 px-1.5 py-0.5 text-[9px] font-bold text-[#FCA5A5] hover:bg-[#EF4444] hover:text-white disabled:opacity-50"
                        title="Eliminar lote"
                      >
                        {deletingId === key ? (
                          <Loader2 className="h-3 w-3 animate-spin" />
                        ) : (
                          <Trash2 className="h-3 w-3" />
                        )}
                        Eliminar
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        ) : tab === 'COMUNIDAD' ? (
          <div className="overflow-hidden rounded-xl border border-[#1E2E26] bg-[#111714]">
            <div className="grid grid-cols-[0.9fr_1.6fr_0.5fr_0.5fr] gap-2 border-b border-[#1E2E26] px-3 py-2 font-mono text-[9px] uppercase text-[#9E9E9E]">
              <span>Autor</span>
              <span>Mensaje</span>
              <span>Grupo</span>
              <span className="text-right">Acción</span>
            </div>
            {community.length === 0 ? (
              <p className="px-3 py-8 text-center text-xs text-[#9E9E9E]">
                No hay mensajes de comunidad para moderar.
              </p>
            ) : (
              community.slice(0, 80).map((row) => {
                const key = `community:${row.groupId}:${row.id}`;
                return (
                  <div
                    key={key}
                    className="grid grid-cols-[0.9fr_1.6fr_0.5fr_0.5fr] items-center gap-2 border-b border-[#1E2E26]/60 px-3 py-2 text-[11px] last:border-0"
                  >
                    <span className="truncate font-bold text-[#E5E5E5]">{row.author}</span>
                    <span className="truncate text-[10px] text-[#9E9E9E]">{row.text || '—'}</span>
                    <span className="font-mono text-[9px] text-[#38BDF8]">{row.groupId}</span>
                    <div className="text-right">
                      <button
                        type="button"
                        onClick={() => void handleDeleteCommunity(row)}
                        disabled={deletingId === key}
                        className="inline-flex items-center gap-1 rounded border border-[#EF4444]/40 px-1.5 py-0.5 text-[9px] font-bold text-[#FCA5A5] hover:bg-[#EF4444] hover:text-white disabled:opacity-50"
                        title="Eliminar mensaje"
                      >
                        {deletingId === key ? (
                          <Loader2 className="h-3 w-3 animate-spin" />
                        ) : (
                          <Trash2 className="h-3 w-3" />
                        )}
                        Moderar
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        ) : (
          <div className="overflow-hidden rounded-xl border border-[#1E2E26] bg-[#111714]">
            <div className="flex items-center gap-2 border-b border-[#1E2E26] px-3 py-2 font-mono text-[9px] uppercase text-[#9E9E9E]">
              <History className="h-3.5 w-3.5 text-[#A78BFA]" /> Registro de acciones administrativas
            </div>
            {audit.length === 0 ? (
              <p className="px-3 py-8 text-center text-xs text-[#9E9E9E]">
                Todavía no hay acciones administrativas registradas.
              </p>
            ) : (
              audit.map((entry) => (
                <div
                  key={entry.id}
                  className="border-b border-[#1E2E26]/60 px-3 py-2 last:border-0"
                >
                  <div className="flex flex-wrap items-center justify-between gap-1">
                    <span className="font-mono text-[10px] font-bold text-[#A78BFA] uppercase">
                      {entry.action.replace(/_/g, ' ')}
                    </span>
                    <span className="font-mono text-[9px] text-[#666666]">
                      {entry.createdAt ? new Date(entry.createdAt).toLocaleString('es-PA') : '—'}
                    </span>
                  </div>
                  <p className="mt-1 text-[10px] text-[#CCCCCC] font-sans">{entry.detail}</p>
                  <p className="mt-0.5 font-mono text-[8px] text-[#666666]">
                    {entry.adminEmail} · {entry.targetType} · {entry.targetId}
                  </p>
                </div>
              ))
            )}
          </div>
        )}
      </main>
    </div>
  );
};
