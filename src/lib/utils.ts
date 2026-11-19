import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
  }).format(amount);
}

export function formatDate(dateString: string): string {
  const options: Intl.DateTimeFormatOptions = { 
    year: 'numeric', 
    month: 'short', 
    day: 'numeric', 
    hour: '2-digit', 
    minute: '2-digit' 
  };
  return new Date(dateString).toLocaleDateString('es-PA', options);
}

/** Fecha sin hora para campos de solo día (cosecha, registro, reseñas). */
export function formatDateOnly(dateString?: string): string {
  if (!dateString) return 'Sin fecha';
  // Las fechas de solo día (YYYY-MM-DD) se interpretan en horario local para evitar desfase de un día.
  const isDateOnly = /^\d{4}-\d{2}-\d{2}$/.test(dateString);
  const date = new Date(isDateOnly ? `${dateString}T00:00:00` : dateString);
  if (Number.isNaN(date.getTime())) return dateString;
  return date.toLocaleDateString('es-PA', { year: 'numeric', month: 'short', day: 'numeric' });
}

export function truncateHash(hash: string, length: number = 8): string {
  if (!hash) return '';
  if (hash.length <= length * 2) return hash;
  return `${hash.substring(0, length)}...${hash.substring(hash.length - length)}`;
}

/** Precio en dólares con dos decimales y símbolo $. */
export function roundCurrency(amount: number): number {
  return Math.round((amount + Number.EPSILON) * 100) / 100;
}

export function formatUsd(amount: number): string {
  if (!Number.isFinite(amount)) return '$0.00';
  return `$${roundCurrency(amount).toFixed(2)}`;
}

/** Copia texto al portapapeles con respaldo para contextos sin Clipboard API. */
export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch {
    // Continúa con el respaldo.
  }
  try {
    const area = document.createElement('textarea');
    area.value = text;
    area.setAttribute('readonly', '');
    area.style.position = 'fixed';
    area.style.opacity = '0';
    document.body.appendChild(area);
    area.select();
    const ok = document.execCommand('copy');
    document.body.removeChild(area);
    return ok;
  } catch {
    return false;
  }
}
