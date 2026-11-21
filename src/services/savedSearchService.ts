import type { ProductBatch } from '@/types';

export interface SavedSearch {
  id: string;
  name: string;
  searchTerm: string;
  corregimiento: string;
  cropCategory: string;
  sortBy: string;
  createdAt: string;
  seenBatchIds: string[];
}

const storageKey = (userId?: string) => `agrobaru_saved_searches_${userId || 'guest'}`;

export function getSavedSearches(userId?: string): SavedSearch[] {
  try {
    const raw = localStorage.getItem(storageKey(userId));
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function persist(userId: string | undefined, searches: SavedSearch[]) {
  try {
    localStorage.setItem(storageKey(userId), JSON.stringify(searches));
  } catch {
    // La búsqueda sigue disponible durante la sesión.
  }
}

export function saveSearch(
  userId: string | undefined,
  search: Omit<SavedSearch, 'id' | 'createdAt' | 'seenBatchIds'>,
  batches: ProductBatch[],
): SavedSearch[] {
  const current = getSavedSearches(userId);
  const entry: SavedSearch = {
    ...search,
    id: `SEARCH-${Date.now()}`,
    createdAt: new Date().toISOString(),
    seenBatchIds: batches.map((batch) => batch.id),
  };
  const next = [entry, ...current].slice(0, 8);
  persist(userId, next);
  return next;
}

export function removeSavedSearch(userId: string | undefined, id: string): SavedSearch[] {
  const next = getSavedSearches(userId).filter((item) => item.id !== id);
  persist(userId, next);
  return next;
}

export function markSavedSearchSeen(
  userId: string | undefined,
  id: string,
  batches: ProductBatch[],
): SavedSearch[] {
  const next = getSavedSearches(userId).map((item) =>
    item.id === id ? { ...item, seenBatchIds: batches.map((batch) => batch.id) } : item,
  );
  persist(userId, next);
  return next;
}

export function searchMatchesBatch(search: SavedSearch, batch: ProductBatch): boolean {
  const term = search.searchTerm.trim().toLowerCase();
  const matchesTerm =
    !term ||
    batch.cropName.toLowerCase().includes(term) ||
    batch.variety.toLowerCase().includes(term) ||
    batch.farmName.toLowerCase().includes(term) ||
    batch.producerName.toLowerCase().includes(term) ||
    batch.batchCode.toLowerCase().includes(term);
  const matchesCorregimiento =
    !search.corregimiento || search.corregimiento === 'ALL' || batch.corregimiento === search.corregimiento;
  const crop = batch.cropName.toLowerCase();
  const matchesCategory =
    !search.cropCategory ||
    search.cropCategory === 'ALL' ||
    (search.cropCategory === 'BANANO' && crop.includes('banano')) ||
    (search.cropCategory === 'PLATANO' && (crop.includes('plátano') || crop.includes('platano'))) ||
    (search.cropCategory === 'CACAO' && crop.includes('cacao')) ||
    (search.cropCategory === 'FRUTAS' &&
      !crop.includes('banano') &&
      !crop.includes('plátano') &&
      !crop.includes('platano') &&
      !crop.includes('cacao')) ||
    (search.cropCategory === 'AVAILABLE' && batch.availableKg > 0 && batch.status !== 'sold_out') ||
    (search.cropCategory === 'FAVORITES' && false);
  return matchesTerm && matchesCorregimiento && matchesCategory;
}

export function countNewSavedSearchMatches(
  searches: SavedSearch[],
  batches: ProductBatch[],
): number {
  const newBatchIds = new Set<string>();
  searches.forEach((search) => {
    const seen = new Set(search.seenBatchIds || []);
    batches.forEach((batch) => {
      if (!seen.has(batch.id) && searchMatchesBatch(search, batch)) newBatchIds.add(batch.id);
    });
  });
  return newBatchIds.size;
}
