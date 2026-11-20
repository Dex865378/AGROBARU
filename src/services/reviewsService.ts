import { OrderReview } from '@/types';

/**
 * Reseñas locales de AgroBarú.
 *
 * Se guardan en el dispositivo para que una reseña publicada desde la ficha
 * de un lote también aparezca en el perfil público del productor y sobreviva
 * a una recarga. El formato es compatible con `OrderReview`.
 */

interface StoredReview extends OrderReview {
  producerId?: string;
  producerName?: string;
}

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

export function createSeedReviews(batchId: string, producerName?: string): OrderReview[] {
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
    },
  ];
}

export function getReviewsForBatch(
  batchId: string,
  producerName?: string,
  producerId?: string,
  initialReviews: OrderReview[] = [],
): OrderReview[] {
  const stored = loadStored().filter((review) => review.batchId === batchId);
  const seed = initialReviews.length > 0 ? initialReviews : createSeedReviews(batchId, producerName);
  const withMeta: StoredReview[] = seed.map((review) => ({
    ...review,
    producerName,
    producerId,
  }));

  if (stored.length > 0) {
    const storedIds = new Set(stored.map((review) => review.id));
    return [...stored, ...withMeta.filter((review) => !storedIds.has(review.id))];
  }

  persist([...loadStored(), ...withMeta]);
  return withMeta;
}

export function getReviewsForProducer(producerId?: string, producerName?: string): OrderReview[] {
  const normalized = normalizeName(producerName);
  const stored = loadStored().filter((review) => {
    const sameId = Boolean(producerId && review.producerId && review.producerId === producerId);
    const sameName =
      Boolean(normalized) && normalizeName(review.producerName) === normalized;
    return sameId || sameName;
  });

  const seed = createSeedReviews(`PROFILE-${producerId || normalized || 'BARU'}`, producerName);
  if (stored.length === 0) return seed;

  const storedIds = new Set(stored.map((review) => review.id));
  return [...stored, ...seed.filter((review) => !storedIds.has(review.id))];
}

export function addReview(
  review: OrderReview,
  producer?: { producerId?: string; producerName?: string },
): void {
  const storedReview: StoredReview = {
    ...review,
    producerId: producer?.producerId,
    producerName: producer?.producerName,
  };
  persist([storedReview, ...loadStored()]);
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
