// Acceso a Firestore para los productos agrícolas publicados.
// Todas las lecturas usan onSnapshot para reflejar cambios en tiempo real y
// aprovechar la caché persistente incluso sin conexión.

import {
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  query,
  setDoc,
  where,
  type DocumentData,
  type Query,
  type Unsubscribe,
} from 'firebase/firestore';
import { db, PRODUCTS_COLLECTION } from '@/lib/firebase';
import type { BaruCommunity, CropCategory, HarvestStatus, Product, ProductUnit } from '@/types/agrobaru';

export interface ProductsFeed {
  products: Product[];
  fromCache: boolean;
  pendingWrites: boolean;
}

function asString(value: unknown, fallback = ''): string {
  return typeof value === 'string' ? value : fallback;
}

function asNumber(value: unknown): number {
  return typeof value === 'number' && Number.isFinite(value) ? value : 0;
}

export function toProduct(id: string, data: DocumentData): Product {
  return {
    id,
    producerId: asString(data.producerId),
    producerName: asString(data.producerName, 'Productor AgroBarú'),
    producerEmail: asString(data.producerEmail),
    producerCommunity: (data.producerCommunity as BaruCommunity) || 'Otro',
    crop: (data.crop as CropCategory) || 'Otros',
    variety: asString(data.variety),
    quantity: asNumber(data.quantity),
    unit: (data.unit as ProductUnit) || 'Kg',
    priceUsd: asNumber(data.priceUsd),
    status: data.status === 'en_cosecha' ? 'en_cosecha' : ('disponible' as HarvestStatus),
    estimatedHarvestDate: asString(data.estimatedHarvestDate),
    community: (data.community as BaruCommunity) || 'Otro',
    gps:
      data.gps && typeof data.gps === 'object' && 'lat' in data.gps && 'lng' in data.gps
        ? { lat: asNumber(data.gps.lat), lng: asNumber(data.gps.lng) }
        : null,
    description: asString(data.description),
    traceabilityHash: asString(data.traceabilityHash),
    createdAt: asString(data.createdAt),
    updatedAt: asString(data.updatedAt),
  };
}

function sortByUpdated(products: Product[]): Product[] {
  return [...products].sort((a, b) => {
    const aTime = a.updatedAt || a.createdAt;
    const bTime = b.updatedAt || b.createdAt;
    return bTime.localeCompare(aTime);
  });
}

function listen(
  q: Query<DocumentData>,
  onData: (feed: ProductsFeed) => void,
  onError: (error: unknown) => void,
): Unsubscribe {
  return onSnapshot(
    q,
    { includeMetadataChanges: true },
    (snapshot) => {
      const products = sortByUpdated(
        snapshot.docs.map((item) => toProduct(item.id, item.data())),
      );
      onData({
        products,
        fromCache: snapshot.metadata.fromCache,
        pendingWrites: snapshot.docs.some((item) => item.metadata.hasPendingWrites),
      });
    },
    (error) => onError(error),
  );
}

/** Solo los productos del productor autenticado. */
export function subscribeToProducerProducts(
  producerId: string,
  onData: (feed: ProductsFeed) => void,
  onError: (error: unknown) => void,
): Unsubscribe {
  const q = query(collection(db, PRODUCTS_COLLECTION), where('producerId', '==', producerId));
  return listen(q, onData, onError);
}

/** Catálogo completo para compradores (lectura pública de ofertas). */
export function subscribeToMarketplace(
  onData: (feed: ProductsFeed) => void,
  onError: (error: unknown) => void,
): Unsubscribe {
  const q = query(collection(db, PRODUCTS_COLLECTION));
  return listen(q, onData, onError);
}

export interface SaveProductPayload {
  producerId: string;
  producerName: string;
  producerEmail: string;
  producerCommunity: BaruCommunity;
  crop: CropCategory;
  variety: string;
  quantity: number;
  unit: ProductUnit;
  priceUsd: number;
  status: HarvestStatus;
  estimatedHarvestDate: string;
  community: BaruCommunity;
  gps: { lat: number; lng: number } | null;
  description: string;
  traceabilityHash: string;
}

export async function createProduct(payload: SaveProductPayload): Promise<string> {
  const reference = doc(collection(db, PRODUCTS_COLLECTION));
  const now = new Date().toISOString();
  await setDoc(reference, { ...payload, createdAt: now, updatedAt: now });
  return reference.id;
}

export async function updateProduct(
  productId: string,
  payload: SaveProductPayload,
): Promise<void> {
  await setDoc(
    doc(db, PRODUCTS_COLLECTION, productId),
    { ...payload, updatedAt: new Date().toISOString() },
    { merge: true },
  );
}

export async function deleteProduct(productId: string): Promise<void> {
  await deleteDoc(doc(db, PRODUCTS_COLLECTION, productId));
}
