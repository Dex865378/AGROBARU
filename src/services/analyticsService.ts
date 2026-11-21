/** Métricas locales de interés de lotes (sin datos personales). */
export interface BatchAnalytics {
  views: number;
  lastViewedAt?: string;
}

const STORAGE_KEY = 'agrobaru_batch_analytics_v1';
const EVENT = 'agrobaru:analytics-updated';

function loadAll(): Record<string, BatchAnalytics> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : {};
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch {
    return {};
  }
}

function saveAll(value: Record<string, BatchAnalytics>) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(value));
  } catch {
    // La métrica es complementaria; no bloquea la aplicación.
  }
  window.dispatchEvent(new CustomEvent(EVENT));
}

export function trackBatchView(batchId: string): void {
  if (!batchId) return;
  const all = loadAll();
  const current = all[batchId] || { views: 0 };
  all[batchId] = {
    views: current.views + 1,
    lastViewedAt: new Date().toISOString(),
  };
  saveAll(all);
}

export function getBatchAnalytics(batchId: string): BatchAnalytics {
  return loadAll()[batchId] || { views: 0 };
}

export function getTotalBatchViews(batchIds: string[]): number {
  const all = loadAll();
  return batchIds.reduce((sum, id) => sum + (all[id]?.views || 0), 0);
}

export function onAnalyticsUpdated(callback: () => void): () => void {
  window.addEventListener(EVENT, callback);
  return () => window.removeEventListener(EVENT, callback);
}
