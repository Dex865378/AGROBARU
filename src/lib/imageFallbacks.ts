import bananaImg from '@/assets/products/banana.webp';
import cacaoImg from '@/assets/products/cacao.webp';
import platanoImg from '@/assets/products/platano.webp';
import cafeImg from '@/assets/products/cafe.webp';

export const BUNDLED_CROP_IMAGES = {
  banana: bananaImg,
  cacao: cacaoImg,
  platano: platanoImg,
  cafe: cafeImg,
};

export function getCropImageByName(cropName?: string): string {
  const lower = (cropName || '').toLowerCase();
  if (lower.includes('cacao') || lower.includes('chocolat')) {
    return cacaoImg;
  }
  if (lower.includes('plátano') || lower.includes('platano') || lower.includes('curaré') || lower.includes('hartón')) {
    return platanoImg;
  }
  if (lower.includes('café') || lower.includes('cafe') || lower.includes('coffee') || lower.includes('robusta') || lower.includes('aroma')) {
    return cafeImg;
  }
  return bananaImg;
}

/**
 * Resolves product or field-evidence image paths.
 * Replaces missing legacy `/products/*.jpg` paths and flaky external Unsplash links
 * with locally bundled Vite agricultural photographs so images always load in WebView & offline.
 */
export function resolveProductImage(url?: string, cropName?: string): string {
  if (!url || !url.trim()) {
    return getCropImageByName(cropName);
  }
  const clean = url.trim();
  if (clean.startsWith('/products/')) {
    if (clean.includes('cacao')) return cacaoImg;
    if (clean.includes('platano')) return platanoImg;
    if (clean.includes('cafe')) return cafeImg;
    return bananaImg;
  }
  if (clean.includes('images.unsplash.com')) {
    return getCropImageByName(cropName);
  }
  return clean;
}

const AVATAR_PALETTE = [
  { bg: '#112B1E', border: '#10B981', text: '#ECFDF5' },
  { bg: '#1E1B2E', border: '#8B5CF6', text: '#F5F3FF' },
  { bg: '#272110', border: '#F59E0B', text: '#FEF3C7' },
  { bg: '#14262E', border: '#38BDF8', text: '#E0F2FE' },
];

export function createInitialsAvatarDataUri(name?: string): string {
  const cleanName = (name || 'AB').replace(/[^a-zA-Z0-9\sÁÉÍÓÚáéíóúÑñ]/g, '').trim();
  const parts = cleanName.split(/\s+/).filter(Boolean);
  const initials =
    parts.length >= 2
      ? `${parts[0][0]}${parts[1][0]}`.toUpperCase()
      : (parts[0]?.slice(0, 2) || 'AB').toUpperCase();

  let hash = 0;
  for (let i = 0; i < cleanName.length; i++) {
    hash = cleanName.charCodeAt(i) + ((hash << 5) - hash);
  }
  const palette = AVATAR_PALETTE[Math.abs(hash) % AVATAR_PALETTE.length];

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="128" height="128" viewBox="0 0 128 128"><rect width="128" height="128" fill="${palette.bg}"/><rect x="3" y="3" width="122" height="122" fill="none" stroke="${palette.border}" stroke-width="4" opacity="0.55"/><text x="64" y="75" text-anchor="middle" font-family="Arial, Helvetica, sans-serif" font-weight="700" font-size="44" fill="${palette.text}" letter-spacing="2">${initials}</text></svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

/**
 * Resolves user/organization avatars.
 * Uses local crisp SVG initials instead of external Unsplash/Dicebear CDNs when offline or unbundled,
 * while preserving user-uploaded data URLs and real Google profile URLs.
 */
export function resolveAvatarUrl(url?: string, name?: string): string {
  if (!url || !url.trim()) {
    return createInitialsAvatarDataUri(name);
  }
  const clean = url.trim();
  if (clean.includes('images.unsplash.com') || clean.includes('api.dicebear.com')) {
    return createInitialsAvatarDataUri(name);
  }
  return clean;
}
