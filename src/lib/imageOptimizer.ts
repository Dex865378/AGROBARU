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
  /**
   * Ignora la etiqueta EXIF y usa los píxeles tal como están codificados.
   * Necesario para wallpapers horizontales que traen un EXIF erróneo y, si se
   * respeta, el navegador los guarda girados como si fueran verticales.
   */
  ignoreExif?: boolean;
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

function loadImageSource(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error('La imagen no se pudo decodificar.'));
    image.src = src;
  });
}

async function loadImage(file: Blob): Promise<HTMLImageElement> {
  const url = URL.createObjectURL(file);
  try {
    return await loadImageSource(url);
  } finally {
    URL.revokeObjectURL(url);
  }
}

interface ImageFileMeta {
  /** Orientación EXIF 1-8 (1 = normal). */
  orientation: number;
  /** Dimensiones reales del JPEG, antes de que el navegador aplique EXIF. */
  rawWidth: number;
  rawHeight: number;
}

/**
 * Lee la orientación EXIF y el tamaño real del JPEG. Algunos navegadores
 * (Safari/iOS y WebViews antiguos) entregan los píxeles sin rotar al canvas,
 * aunque la vista previa se vea correcta. Con estos datos podemos rotar el
 * banner nosotros mismos en vez de guardarlo acostado.
 */
async function readImageFileMeta(file: File): Promise<ImageFileMeta> {
  const fallback: ImageFileMeta = { orientation: 1, rawWidth: 0, rawHeight: 0 };
  if (!/^image\/jpe?g$/i.test(file.type) && !/\.jpe?g$/i.test(file.name)) {
    return fallback;
  }

  try {
    const bytes = new Uint8Array(await file.arrayBuffer());
    if (bytes[0] !== 0xff || bytes[1] !== 0xd8) return fallback;

    let orientation = 1;
    let rawWidth = 0;
    let rawHeight = 0;
    let offset = 2;

    while (offset + 4 < bytes.length) {
      if (bytes[offset] !== 0xff) {
        offset += 1;
        continue;
      }

      const marker = bytes[offset + 1];
      if (marker === 0xff) {
        offset += 1;
        continue;
      }
      if (marker === 0xd8 || marker === 0x01 || (marker >= 0xd0 && marker <= 0xd7)) {
        offset += 2;
        continue;
      }
      if (marker === 0xd9 || marker === 0xda) break;

      const segmentLength = (bytes[offset + 2] << 8) | bytes[offset + 3];
      if (segmentLength < 2) break;
      const dataStart = offset + 4;

      // APP1 / Exif: obtener la orientación de la IFD0.
      if (
        marker === 0xe1 &&
        dataStart + 6 < bytes.length &&
        bytes[dataStart] === 0x45 &&
        bytes[dataStart + 1] === 0x78 &&
        bytes[dataStart + 2] === 0x69 &&
        bytes[dataStart + 3] === 0x66
      ) {
        const tiff = dataStart + 6;
        if (tiff + 8 < bytes.length) {
          const littleEndian = bytes[tiff] === 0x49 && bytes[tiff + 1] === 0x49;
          const readU16 = (position: number) =>
            littleEndian
              ? bytes[position] | (bytes[position + 1] << 8)
              : (bytes[position] << 8) | bytes[position + 1];
          const readU32 = (position: number) =>
            (littleEndian
              ? bytes[position] |
                (bytes[position + 1] << 8) |
                (bytes[position + 2] << 16) |
                (bytes[position + 3] << 24)
              : (bytes[position] << 24) |
                (bytes[position + 1] << 16) |
                (bytes[position + 2] << 8) |
                bytes[position + 3]) >>> 0;

          const ifd = tiff + readU32(tiff + 4);
          if (ifd + 2 < bytes.length) {
            const entries = readU16(ifd);
            for (let index = 0; index < entries; index += 1) {
              const entry = ifd + 2 + index * 12;
              if (entry + 12 > bytes.length) break;
              if (readU16(entry) === 0x0112) {
                orientation = readU16(entry + 8) || 1;
                break;
              }
            }
          }
        }
      }

      // SOF0-SOF15: dimensiones reales codificadas en el JPEG.
      const isStartOfFrame =
        (marker >= 0xc0 && marker <= 0xc3) ||
        (marker >= 0xc5 && marker <= 0xc7) ||
        (marker >= 0xc9 && marker <= 0xcb) ||
        (marker >= 0xcd && marker <= 0xcf);
      if (isStartOfFrame && dataStart + 5 < bytes.length) {
        rawHeight = (bytes[dataStart + 1] << 8) | bytes[dataStart + 2];
        rawWidth = (bytes[dataStart + 3] << 8) | bytes[dataStart + 4];
      }

      offset += 2 + segmentLength;
    }

    return { orientation, rawWidth, rawHeight };
  } catch {
    return fallback;
  }
}

/** Dibuja la imagen aplicando la transformación EXIF sobre un canvas. */
function normalizeOrientation(
  source: CanvasImageSource,
  width: number,
  height: number,
  orientation: number,
): HTMLCanvasElement {
  const swapsDimensions = orientation >= 5 && orientation <= 8;
  const canvas = document.createElement('canvas');
  canvas.width = swapsDimensions ? height : width;
  canvas.height = swapsDimensions ? width : height;
  const context = canvas.getContext('2d', { alpha: false });
  if (!context) return canvas;

  context.save();
  switch (orientation) {
    case 2:
      context.transform(-1, 0, 0, 1, width, 0);
      break;
    case 3:
      context.transform(-1, 0, 0, -1, width, height);
      break;
    case 4:
      context.transform(1, 0, 0, -1, 0, height);
      break;
    case 5:
      context.transform(0, 1, 1, 0, 0, 0);
      break;
    case 6:
      context.transform(0, 1, -1, 0, height, 0);
      break;
    case 7:
      context.transform(0, -1, -1, 0, height, width);
      break;
    case 8:
      context.transform(0, -1, 1, 0, 0, width);
      break;
    default:
      break;
  }
  context.drawImage(source, 0, 0, width, height);
  context.restore();
  return canvas;
}

/**
 * Elimina el bloque APP1/Exif del JPEG sin recomprimir la imagen. Así el
 * navegador decodifica los píxeles reales y no aplica una orientación EXIF
 * incorrecta (habitual en wallpapers descargados de Internet).
 */
async function stripJpegExif(file: File): Promise<Blob> {
  if (!/^image\/jpe?g$/i.test(file.type)) return file;

  try {
    const bytes = new Uint8Array(await file.arrayBuffer());
    if (bytes[0] !== 0xff || bytes[1] !== 0xd8) return file;

    const parts: Uint8Array[] = [bytes.subarray(0, 2)];
    let offset = 2;
    let removed = false;

    while (offset + 4 <= bytes.length) {
      if (bytes[offset] !== 0xff) {
        parts.push(bytes.subarray(offset));
        break;
      }
      const marker = bytes[offset + 1];

      if (marker === 0xff) {
        offset += 1;
        continue;
      }
      if (marker === 0xd8 || marker === 0x01 || (marker >= 0xd0 && marker <= 0xd7)) {
        parts.push(bytes.subarray(offset, offset + 2));
        offset += 2;
        continue;
      }
      if (marker === 0xd9 || marker === 0xda) {
        parts.push(bytes.subarray(offset));
        break;
      }

      const segmentLength = (bytes[offset + 2] << 8) | bytes[offset + 3];
      if (segmentLength < 2) {
        parts.push(bytes.subarray(offset));
        break;
      }
      const segmentEnd = offset + 2 + segmentLength;
      if (segmentEnd > bytes.length) {
        parts.push(bytes.subarray(offset));
        break;
      }

      const isExif =
        marker === 0xe1 &&
        segmentLength >= 8 &&
        bytes[offset + 4] === 0x45 &&
        bytes[offset + 5] === 0x78 &&
        bytes[offset + 6] === 0x69 &&
        bytes[offset + 7] === 0x66;

      if (isExif) {
        removed = true;
      } else {
        parts.push(bytes.subarray(offset, segmentEnd));
      }
      offset = segmentEnd;
    }

    if (!removed) return file;
    return new Blob(parts.map((part) => part.slice().buffer), { type: file.type });
  } catch {
    return file;
  }
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
    ignoreExif = false,
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

  const decodeFile = ignoreExif ? await stripJpegExif(file) : file;
  const fileMeta = ignoreExif
    ? { orientation: 1, rawWidth: 0, rawHeight: 0 }
    : await readImageFileMeta(file);

  // Deja que el navegador pinte la vista previa antes del trabajo pesado.
  await new Promise<void>((resolve) => window.setTimeout(resolve, 0));

  // `createImageBitmap` respeta la orientación EXIF de las fotos tomadas con
  // el teléfono, evitando que un banner horizontal salga girado o vertical.
  let bitmap: ImageBitmap | null = null;
  let source: CanvasImageSource | null = null;
  let naturalWidth = 0;
  let naturalHeight = 0;

  try {
    if (typeof createImageBitmap === 'function') {
      bitmap = await createImageBitmap(decodeFile, { imageOrientation: 'from-image' });
      source = bitmap;
      naturalWidth = bitmap.width;
      naturalHeight = bitmap.height;
    }
  } catch {
    bitmap = null;
  }

  if (!source) {
    const image = await loadImage(decodeFile);
    source = image;
    naturalWidth = image.naturalWidth || image.width;
    naturalHeight = image.naturalHeight || image.height;
  }

  // Si el navegador devolvió los píxeles sin rotar (pero el JPEG trae EXIF),
  // rotamos aquí para que el banner no se guarde acostado.
  const sourceMatchesRawJpeg =
    fileMeta.rawWidth > 0 &&
    naturalWidth === fileMeta.rawWidth &&
    naturalHeight === fileMeta.rawHeight;
  if (sourceMatchesRawJpeg && fileMeta.orientation > 1) {
    const normalized = normalizeOrientation(
      source,
      naturalWidth,
      naturalHeight,
      fileMeta.orientation,
    );
    source = normalized;
    naturalWidth = normalized.width;
    naturalHeight = normalized.height;
  }

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
    source,
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

  bitmap?.close();
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
    maxHeight: 1600,
    quality: 0.82,
    preserveAnimation: true,
    maxAnimatedBytes: 600 * 1024,
    ignoreExif: true,
  });

export const optimizeProductPhoto = (file: File) =>
  optimizeImage(file, { maxWidth: 1400, maxHeight: 1400, quality: 0.82 });

export const optimizeChatImage = (file: File) =>
  optimizeImage(file, { maxWidth: 1200, maxHeight: 1200, quality: 0.8 });
