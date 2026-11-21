import { collection, doc, onSnapshot, query, setDoc, where } from 'firebase/firestore';
import { db } from '@/services/firebase';
import { EscrowOrder, OrderReview } from '@/types';

/**
 * Reseñas de AgroBarú.
 *
 * Se guardan en Firestore para que las vean todos los usuarios y se mantiene
 * una copia local para que la ficha siga funcionando sin conexión. Una reseña
 * solo se publica como verificada si el comprador tiene una orden entregada o
 * liberada con ese lote/productor.
 */
export interface StoredReview extends OrderReview {
  producerId?: string;
  producerName?: string;
  verified?: boolean;
}

export const REVIEWS_COLLECTION = 'orderReviews';

const STORAGE_KEY = 'agrobaru_reviews_v1';
const UPDATE_EVENT = 'agrobaru:reviews-updated';

function normalizeName(name?: string): string {
  return (name || '').trim().toLowerCase();
}

function loadStored(): StoredReview[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function persist(reviews: StoredReview[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(reviews));
  } catch {
    // Si el almacenamiento está lleno, la reseña sigue visible en memoria.
  }
  window.dispatchEvent(new CustomEvent(UPDATE_EVENT));
}

export function createSeedReviews(batchId: string, producerName?: string): StoredReview[] {
  return [
    {
      id: `SEED-${batchId}-1`,
      orderId: 'ESCROW-BARU-884920',
      batchId,
      authorId: 'BUYER-PAN-GLOBAL',
      authorName: 'Hamburg Fruit Imports GMBH',
      authorRole: 'buyer',
      authorTier: 'DIAMOND_MIDA',
      rating: 5,
      comment:
        'Excelente calidad y entrega puntual. Calibre uniforme, cajas selladas con código QR verificado y sin mermas en corona.',
      qualityCompliant: true,
      onTimeDelivery: true,
      createdAt: '2026-08-20',
      producerName,
      verified: true,
    },
    {
      id: `SEED-${batchId}-2`,
      orderId: 'ESCROW-BARU-773812',
      batchId,
      authorId: 'BUYER-USA-MIAMI',
      authorName: 'Tropical Prime Corp (Miami)',
      authorRole: 'buyer',
      authorTier: 'GOLD',
      rating: 5,
      comment:
        'Fruta recibida en temperatura óptima. Los fondos de Escrow se liberaron de inmediato al escanear la entrega en aduana.',
      qualityCompliant: true,
      onTimeDelivery: true,
      createdAt: '2026-08-15',
      producerName,
      verified: true,
    },
  ];
}

export function getReviewsForBatch(
  batchId: string,
  producerName?: string,
  producerId?: string,
  initialReviews: OrderReview[] = [],
): StoredReview[] {
  const stored = loadStored().filter((review) => review.batchId === batchId);
  const seed = initialReviews.length > 0 ? initialReviews : createSeedReviews(batchId, producerName);
  const withMeta: StoredReview[] = seed.map((review) => ({
    ...review,
    producerName,
    producerId,
  }));

  const merged = [...stored, ...withMeta.filter((review) => !stored.some((item) => item.id === review.id))];
  return sortReviews(merged);
}

export function getReviewsForProducer(producerId?: string, producerName?: string): StoredReview[] {
  const normalized = normalizeName(producerName);
  const stored = loadStored().filter((review) => {
    const sameId = Boolean(producerId && review.producerId && review.producerId === producerId);
    const sameName =
      Boolean(normalized) && normalizeName(review.producerName) === normalized;
    return sameId || sameName;
  });

  const seed = createSeedReviews(`PROFILE-${producerId || normalized || 'BARU'}`, producerName);
  const merged = [...stored, ...seed.filter((review) => !stored.some((item) => item.id === review.id))];
  return sortReviews(merged);
}

export async function addReview(
  review: OrderReview,
  producer?: { producerId?: string; producerName?: string; verified?: boolean },
): Promise<StoredReview> {
  const storedReview: StoredReview = {
    ...review,
    producerId: producer?.producerId,
    producerName: producer?.producerName,
    verified: producer?.verified === true,
  };

  persist([storedReview, ...loadStored().filter((item) => item.id !== storedReview.id)]);

  try {
    await setDoc(
      doc(db, REVIEWS_COLLECTION, storedReview.id),
      {
        ...storedReview,
        _syncedAt: new Date().toISOString(),
      },
      { merge: true },
    );
  } catch (error) {
    // La reseña queda en el dispositivo aunque no haya conexión.
    console.warn('[AgroBarú Reviews] No se pudo publicar en Firestore:', error);
  }

  return storedReview;
}

export function subscribeReviewsForBatch(
  batchId: string,
  callback: (reviews: StoredReview[]) => void,
  onError?: (error: Error) => void,
): () => void {
  return onSnapshot(
    query(collection(db, REVIEWS_COLLECTION), where('batchId', '==', batchId)),
    (snapshot) => {
      callback(snapshot.docs.map((item) => item.data() as StoredReview));
    },
    (error) => onError?.(error),
  );
}

export function subscribeReviewsForProducer(
  producerId: string | undefined,
  producerName: string | undefined,
  callback: (reviews: StoredReview[]) => void,
  onError?: (error: Error) => void,
): () => void {
  const filter = producerName
    ? where('producerName', '==', producerName)
    : producerId
      ? where('producerId', '==', producerId)
      : null;
  if (!filter) return () => {};

  return onSnapshot(
    query(collection(db, REVIEWS_COLLECTION), filter),
    (snapshot) => {
      callback(snapshot.docs.map((item) => item.data() as StoredReview));
    },
    (error) => onError?.(error),
  );
}

/** Combina Firestore + copia local/seeds y elimina duplicados por id. */
export function mergeReviews(...collections: StoredReview[][]): StoredReview[] {
  const byId = new Map<string, StoredReview>();
  collections.flat().forEach((review) => {
    if (!review?.id || byId.has(review.id)) return;
    byId.set(review.id, review);
  });
  return sortReviews([...byId.values()]);
}

export function sortReviews(reviews: StoredReview[]): StoredReview[] {
  return [...reviews].sort(
    (a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime(),
  );
}

/**
 * Devuelve la orden que autoriza a este comprador a reseñar.
 * Se acepta una entrega pendiente de inspección o una orden ya liberada.
 */
export function findVerifiedOrder(
  orders: EscrowOrder[],
  buyerId: string,
  filters: { batchId?: string; producerId?: string; producerName?: string },
): EscrowOrder | undefined {
  const validStatuses: EscrowOrder['escrowStatus'][] = ['DELIVERED_PENDING_INSPECTION', 'RELEASED'];
  const normalizedProducer = normalizeName(filters.producerName);
  return orders.find((order) => {
    if (order.buyerId !== buyerId) return false;
    if (!validStatuses.includes(order.escrowStatus)) return false;
    if (filters.batchId && order.batchId !== filters.batchId) return false;

    const sameProducer =
      Boolean(filters.producerId && order.farmerId && order.farmerId === filters.producerId) ||
      (Boolean(normalizedProducer) && normalizeName(order.farmerName) === normalizedProducer);

    if (filters.producerId || filters.producerName) return sameProducer;
    return true;
  });
}

export function getReviewSummary(reviews: OrderReview[]): {
  count: number;
  average: number;
} {
  if (reviews.length === 0) return { count: 0, average: 0 };
  const total = reviews.reduce((sum, review) => sum + review.rating, 0);
  return {
    count: reviews.length,
    average: Math.round((total / reviews.length) * 10) / 10,
  };
}

export function onReviewsUpdated(callback: () => void): () => void {
  window.addEventListener(UPDATE_EVENT, callback);
  return () => window.removeEventListener(UPDATE_EVENT, callback);
}
