/**
 * QR Code and Traceability URL Utilities for AgroBarú
 * Guaranteed to generate public, universally scannable HTTPS links on any phone camera.
 */

export const PRODUCTION_URL = 'https://mapache-4ab0f.web.app';

export const getBatchTraceUrl = (batchCode: string): string => {
  const cleanCode = encodeURIComponent(batchCode.trim());
  return `${PRODUCTION_URL}/?batch=${cleanCode}`;
};
