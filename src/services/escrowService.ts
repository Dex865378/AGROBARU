import { EscrowStatus } from '../types';
import { calculateSha256 } from './cryptoService';

export const ESCROW_FEE_PERCENTAGE = 0.015; // 1.5% decentralized escrow operational fee

/** Etiquetas legibles para los estados del contrato Escrow */
export const ESCROW_STATUS_LABELS: Record<EscrowStatus, string> = {
  CREATED: 'Contrato Creado',
  FUNDED: 'Fondos en Custodia',
  DISPATCHED: 'Despachado de Finca',
  IN_TRANSIT: 'En Tránsito',
  DELIVERED_PENDING_INSPECTION: 'Entregado, pendiente de inspección',
  RELEASED: 'Fondos Liberados al Productor',
  DISPUTED: 'En Disputa / Arbitraje',
};

/**
 * Generate a unique cryptographic escrow contract ID and hash
 */
export async function createEscrowContract(
  batchId: string,
  buyerId: string,
  farmerName: string,
  totalUsd: number,
  paymentMethod: string
): Promise<{ orderCode: string; contractHash: string }> {
  const timestamp = Date.now();
  const orderCode = `ESCROW-BARU-${timestamp.toString().slice(-6)}`;
  const contractPayload = `${orderCode}|BATCH:${batchId}|BUYER:${buyerId}|SELLER:${farmerName}|TOTAL:$${totalUsd.toFixed(2)}|METHOD:${paymentMethod}|NONCE:${Math.random().toString(36).substring(7)}`;
  const contractHash = await calculateSha256(contractPayload);
  return { orderCode, contractHash };
}

/**
 * Validates transition between escrow states
 */
export function canTransitionEscrowStatus(
  current: EscrowStatus,
  next: EscrowStatus
): boolean {
  const validTransitions: Record<EscrowStatus, EscrowStatus[]> = {
    CREATED: ['FUNDED'],
    FUNDED: ['DISPATCHED', 'DISPUTED'],
    DISPATCHED: ['IN_TRANSIT', 'DISPUTED'],
    IN_TRANSIT: ['DELIVERED_PENDING_INSPECTION', 'DISPUTED'],
    DELIVERED_PENDING_INSPECTION: ['RELEASED', 'DISPUTED'],
    DISPUTED: ['RELEASED'],
    RELEASED: [],
  };

  return validTransitions[current]?.includes(next) ?? false;
}

/**
 * Generates simulated cold chain telemetry during shipment
 */
export function generateColdChainLogs(): { time: string; tempC: number }[] {
  const logs = [];
  const baseTemp = 13.5; // Ideal tropical fruit transport temp (13-14 °C)
  const now = Date.now();
  for (let i = 6; i >= 0; i--) {
    const time = new Date(now - i * 3600 * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const variance = (Math.sin(i) * 0.6) + (Math.random() * 0.4 - 0.2);
    logs.push({
      time,
      tempC: Number((baseTemp + variance).toFixed(1)),
    });
  }
  return logs;
}
