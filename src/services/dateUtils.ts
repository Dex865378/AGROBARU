/**
 * Utilities for formatting timestamps, freshness badges, and auto-purge countdowns
 */

export function formatTimeAgo(isoString?: string): string {
  if (!isoString) return 'Reciente';
  const time = new Date(isoString).getTime();
  if (isNaN(time)) return 'Reciente';

  const diffMs = Date.now() - time;
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHours = Math.floor(diffMin / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffSec < 45) return 'Hace un momento';
  if (diffMin < 60) return `Hace ${diffMin} ${diffMin === 1 ? 'minuto' : 'minutos'}`;
  if (diffHours < 24) return `Hace ${diffHours} ${diffHours === 1 ? 'hora' : 'horas'}`;
  if (diffDays === 1) return 'Ayer';
  if (diffDays < 7) return `Hace ${diffDays} días`;
  if (diffDays < 30) {
    const weeks = Math.floor(diffDays / 7);
    return `Hace ${weeks} ${weeks === 1 ? 'semana' : 'semanas'}`;
  }
  const months = Math.floor(diffDays / 30);
  return `Hace ${months} ${months === 1 ? 'mes' : 'meses'}`;
}

export function getFreshnessTier(isoString?: string): {
  label: string;
  badgeClass: string;
  isFresh: boolean;
  isRecent: boolean;
} {
  if (!isoString) {
    return {
      label: 'Cosecha Registrada',
      badgeClass: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
      isFresh: true,
      isRecent: true,
    };
  }

  const time = new Date(isoString).getTime();
  const diffHours = (Date.now() - time) / (1000 * 60 * 60);

  if (diffHours < 24) {
    return {
      label: 'Cosecha Fresca',
      badgeClass: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/40',
      isFresh: true,
      isRecent: true,
    };
  }
  if (diffHours < 72) {
    return {
      label: 'Cosecha Reciente',
      badgeClass: 'bg-teal-500/15 text-teal-300 border-teal-500/30',
      isFresh: true,
      isRecent: true,
    };
  }
  if (diffHours < 168) { // 7 days
    return {
      label: 'Lote Estable',
      badgeClass: 'bg-amber-500/15 text-amber-300 border-amber-500/30',
      isFresh: false,
      isRecent: false,
    };
  }

  return {
    label: 'Lote Almacenado',
    badgeClass: 'bg-slate-800 text-slate-300 border-slate-700',
    isFresh: false,
    isRecent: false,
  };
}

/** Etiquetas legibles (con tildes) para los tipos de labor agrícola */
export const ACTIVITY_TYPE_LABELS: Record<string, string> = {
  siembra: 'Siembra',
  riego: 'Riego y Drenaje',
  fertilizacion: 'Fertilización',
  control_plagas: 'Control de Plagas',
  poda: 'Poda y Deshoje',
  cosecha: 'Cosecha',
  inspeccion_mida: 'Inspección MIDA',
};

export function getActivityTypeLabel(activityType?: string): string {
  if (!activityType) return 'Labor Agrícola';
  return ACTIVITY_TYPE_LABELS[activityType] || activityType.replace(/_/g, ' ');
}

export function getRemainingPurgeHours(soldOutAt?: string, autoPurgeHours: number = 24): {
  isPurgePending: boolean;
  hoursRemaining: number;
  minutesRemaining: number;
  displayText: string;
} {
  if (!soldOutAt) {
    return { isPurgePending: false, hoursRemaining: 0, minutesRemaining: 0, displayText: '' };
  }

  const soldOutTime = new Date(soldOutAt).getTime();
  const cutoffTime = soldOutTime + (autoPurgeHours * 60 * 60 * 1000);
  const remainingMs = cutoffTime - Date.now();

  if (remainingMs <= 0) {
    return {
      isPurgePending: true,
      hoursRemaining: 0,
      minutesRemaining: 0,
      displayText: 'Limpieza inminente',
    };
  }

  const totalMin = Math.floor(remainingMs / (1000 * 60));
  const hours = Math.floor(totalMin / 60);
  const mins = totalMin % 60;

  return {
    isPurgePending: true,
    hoursRemaining: hours,
    minutesRemaining: mins,
    displayText: hours > 0 ? `Autolimpieza en ${hours} h ${mins} min` : `Autolimpieza en ${mins} min`,
  };
}
