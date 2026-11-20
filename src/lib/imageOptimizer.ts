/**
 * Compresión de imágenes en segundo plano.
 *
 * La selección de archivo se atiende de inmediato con una vista previa local
 * (object URL) y la optimización real ocurre de forma asíncrona en el canvas,
 * sin bloquear la interfaz ni mostrar mensajes de "comprimiendo".
 */

export interface OptimizeImageOptions {
  maxWidth?: number;
  maxHeight?: number;
  /** 0..1 */
  quality?: number;
  /** Recorte centrado con relación de aspecto ancho/alto (ej. 1 para avatar, 4 para banner). */
  cropAspect?: number;
  /** GIF/APNG animados pequeños se conservan intactos para no perder la animación. */
  preserveAnimation?: boolean;
  /** Tamaño máximo del archivo animado que se acepta sin recomprimir. */
  maxAnimatedBytes?: number;
}

export interface OptimizedImage {
  dataUrl: string;
  animated: boolean;
  originalBytes: number;
  outputBytes: number;
}

const ANIMATED_TYPES = new Set(['image/gif', 'image/apng']);

function readAsDataUrl(file: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ''));
    reader.onerror = () => reject(new Error('No se pudo leer la imagen.'));
    reader.readAsDataURL(file);
  });
}

function blobToDataUrl(blob: Blob): Promise<string> {
  return readAsDataUrl(blob);
}

function loadImage(file: Blob): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const image = new Image();
    image.onload = () => {
      URL.revokeObjectURL(url);
      resolve(image);
    };
    image.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('La imagen no se pudo decodificar.'));
    };
    image.src = url;
  });
}

/**
 * Acepta la imagen y devuelve un data URL comprimido. Si es un GIF/APNG
 * animado por debajo del límite se devuelve tal cual para mantener el
 * movimiento del banner.
 */
export async function optimizeImage(
  file: File,
  options: OptimizeImageOptions = {},
): Promise<OptimizedImage> {
  if (!file.type.startsWith('image/')) {
    throw new Error('El archivo debe ser una imagen (JPG, PNG, WebP o GIF).');
  }

  const {
    maxWidth = 1280,
    maxHeight = 1280,
    quality = 0.82,
    cropAspect,
    preserveAnimation = false,
    maxAnimatedBytes = 650 * 1024,
  } = options;

  const originalBytes = file.size;
  const animatedType = ANIMATED_TYPES.has(file.type);

  if (preserveAnimation && animatedType && originalBytes <= maxAnimatedBytes) {
    const dataUrl = await readAsDataUrl(file);
    return {
      dataUrl,
      animated: true,
      originalBytes,
      outputBytes: originalBytes,
    };
  }

  // Deja que el navegador pinte la vista previa antes del trabajo pesado.
  await new Promise<void>((resolve) => window.setTimeout(resolve, 0));

  const image = await loadImage(file);
  const naturalWidth = image.naturalWidth || image.width;
  const naturalHeight = image.naturalHeight || image.height;

  let sourceX = 0;
  let sourceY = 0;
  let sourceWidth = naturalWidth;
  let sourceHeight = naturalHeight;

  if (cropAspect && naturalWidth > 0 && naturalHeight > 0) {
    const currentAspect = naturalWidth / naturalHeight;
    if (currentAspect > cropAspect) {
      sourceWidth = Math.round(naturalHeight * cropAspect);
      sourceX = Math.round((naturalWidth - sourceWidth) / 2);
    } else if (currentAspect < cropAspect) {
      sourceHeight = Math.round(naturalWidth / cropAspect);
      sourceY = Math.round((naturalHeight - sourceHeight) / 2);
    }
  }

  let targetWidth = sourceWidth;
  let targetHeight = sourceHeight;
  const widthScale = maxWidth / sourceWidth;
  const heightScale = maxHeight / sourceHeight;
  const scale = Math.min(1, widthScale, heightScale);

  targetWidth = Math.max(1, Math.round(sourceWidth * scale));
  targetHeight = Math.max(1, Math.round(sourceHeight * scale));

  const canvas = document.createElement('canvas');
  canvas.width = targetWidth;
  canvas.height = targetHeight;
  const context = canvas.getContext('2d', { alpha: false });
  if (!context) throw new Error('El navegador no pudo procesar la imagen.');

  context.imageSmoothingEnabled = true;
  context.imageSmoothingQuality = 'high';
  context.fillStyle = '#0A0A0A';
  context.fillRect(0, 0, targetWidth, targetHeight);
  context.drawImage(
    image,
    sourceX,
    sourceY,
    sourceWidth,
    sourceHeight,
    0,
    0,
    targetWidth,
    targetHeight,
  );

  const blob = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (result) => {
        if (result) resolve(result);
        else reject(new Error('No se pudo comprimir la imagen.'));
      },
      'image/jpeg',
      quality,
    );
  });

  const dataUrl = await blobToDataUrl(blob);
  return {
    dataUrl,
    animated: false,
    originalBytes,
    outputBytes: blob.size,
  };
}

export const optimizeAvatar = (file: File) =>
  optimizeImage(file, { maxWidth: 420, maxHeight: 420, quality: 0.84, cropAspect: 1 });

export const optimizeBanner = (file: File) =>
  optimizeImage(file, {
    maxWidth: 1600,
    maxHeight: 640,
    quality: 0.8,
    cropAspect: 3,
    preserveAnimation: true,
    maxAnimatedBytes: 600 * 1024,
  });

export const optimizeProductPhoto = (file: File) =>
  optimizeImage(file, { maxWidth: 1400, maxHeight: 1400, quality: 0.82 });

export const optimizeChatImage = (file: File) =>
  optimizeImage(file, { maxWidth: 1200, maxHeight: 1200, quality: 0.8 });
