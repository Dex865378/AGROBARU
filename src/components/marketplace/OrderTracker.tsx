import React, { useState } from 'react';
import { 
  Truck, 
  CheckCircle2, 
  AlertTriangle, 
  Thermometer, 
  Lock, 
  DollarSign
} from 'lucide-react';
import { useAppState } from '@/context/AppStateContext';
import { EscrowOrder, EscrowStatus } from '@/types';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogHeader, DialogTitle, DialogDescription, DialogCloseButton } from '@/components/ui/dialog';
import { formatCurrency, truncateHash } from '@/lib/utils';
import confetti from 'canvas-confetti';

export const OrderTracker: React.FC = () => {
  const { orders, advanceEscrowStatus } = useAppState();

  const [selectedOrder, setSelectedOrder] = useState<EscrowOrder | null>(null);
  const [disputeModalOpen, setDisputeModalOpen] = useState(false);
  const [disputeReason, setDisputeReason] = useState('');

  const getStatusBadge = (status: EscrowStatus) => {
    switch (status) {
      case 'FUNDED':
        return <Badge variant="yellow">Fondos en Custodia</Badge>;
      case 'DISPATCHED':
        return <Badge variant="purple">Despachado de Finca</Badge>;
      case 'IN_TRANSIT':
        return <Badge variant="default" className="animate-pulse">En Tránsito Frío (13.5°C)</Badge>;
      case 'DELIVERED_PENDING_INSPECTION':
        return <Badge variant="yellow">Entregado (Inspección Activa)</Badge>;
      case 'RELEASED':
        return <Badge variant="success">Fondos Liberados al Productor</Badge>;
      case 'DISPUTED':
        return <Badge variant="destructive">En Disputa / Arbitraje</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const handleReleaseEscrow = async (orderId: string) => {
    await advanceEscrowStatus(orderId, 'RELEASED');
    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 },
      colors: ['#15803D', '#7C3AED', '#FACC15', '#F97316']
    });
  };

  const handleOpenDispute = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOrder || !disputeReason.trim()) return;

    await advanceEscrowStatus(selectedOrder.id, 'DISPUTED', { disputeReason });
    setDisputeModalOpen(false);
    setDisputeReason('');
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b-2 border-[#15803D] pb-4">
        <div>
          <h2 className="font-display font-black text-2xl text-[#E5E5E5] uppercase tracking-tight">
            Monitor de Contratos Escrow & Envíos
          </h2>
          <p className="text-xs text-[#9E9E9E] font-sans">
            Transparencia de pago condicional: Los fondos están seguros hasta la verificación física en destino.
          </p>
        </div>

        <div className="text-xs font-mono text-[#9E9E9E] bg-[#121212] p-2 border border-[#15803D]">
          Contratos Registrados: <strong className="text-[#15803D]">{orders.length}</strong>
        </div>
      </div>

      {orders.length === 0 ? (
        <div className="bg-[#121212] border-2 border-[#1E293B] p-8 text-center text-[#9E9E9E] font-mono text-xs">
          No hay órdenes de Escrow activas. Realiza una compra en el Catálogo de Productos para iniciar un contrato.
        </div>
      ) : (
        <div className="space-y-5">
          {orders.map((order) => {
            return (
              <div
                key={order.id}
                className="bg-[#121212] border-2 border-[#15803D] p-6 space-y-5 shadow-[4px_4px_0px_0px_#15803D] hover:border-[#7C3AED] hover:shadow-[6px_6px_0px_0px_#7C3AED] transition-all"
              >
                {/* Header Strip */}
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#15803D]/40 pb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-[#15803D]/15 border border-[#15803D] flex items-center justify-center text-[#15803D]">
                      <Lock className="w-5 h-5" strokeWidth={1.5} />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-display font-bold text-base text-[#E5E5E5] uppercase">
                          {order.productName} ({order.quantityKg} Kg)
                        </h3>
                        {getStatusBadge(order.escrowStatus)}
                      </div>
                      <div className="text-[11px] font-mono text-[#9E9E9E] mt-0.5">
                        Contrato: <span className="text-[#15803D]">{order.orderCode}</span> • Finca: {order.farmName} ({order.farmerName})
                      </div>
                    </div>
                  </div>

                  <div className="text-right font-mono">
                    <div className="text-xs text-[#9E9E9E]">MONTO EN CUSTODIA</div>
                    <div className="text-base font-display font-bold text-[#15803D]">
                      {formatCurrency(order.totalUsd)}
                    </div>
                    <div className="text-[10px] text-[#666666]">Método: {order.paymentMethod}</div>
                  </div>
                </div>

                {/* Visual Pipeline Bar */}
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-2 pt-1 font-mono text-xs">
                  {/* Step 1 */}
                  <div className={`p-3 border ${order.escrowStatus !== 'CREATED' ? 'border-[#15803D] bg-[#15803D]/10 text-[#15803D]' : 'border-[#1E293B] bg-[#0E0E0E] text-[#666666]'}`}>
                    <div className="font-bold flex items-center gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5" strokeWidth={1.5} /> 1. Fondos Bloqueados
                    </div>
                    <div className="text-[10px] mt-1 text-[#9E9E9E]">Pago retenido en Escrow</div>
                  </div>

                  {/* Step 2 */}
                  <div className={`p-3 border ${['DISPATCHED', 'IN_TRANSIT', 'DELIVERED_PENDING_INSPECTION', 'RELEASED'].includes(order.escrowStatus) ? 'border-[#7C3AED] bg-[#7C3AED]/10 text-[#7C3AED]' : 'border-[#1E293B] bg-[#0E0E0E] text-[#666666]'}`}>
                    <div className="font-bold flex items-center gap-1.5">
                      <Truck className="w-3.5 h-3.5" strokeWidth={1.5} /> 2. Despacho de Finca
                    </div>
                    <div className="text-[10px] mt-1 text-[#9E9E9E] truncate">{order.trackingNumber}</div>
                  </div>

                  {/* Step 3 */}
                  <div className={`p-3 border ${['DELIVERED_PENDING_INSPECTION', 'RELEASED'].includes(order.escrowStatus) ? 'border-[#FACC15] bg-[#FACC15]/10 text-[#FACC15]' : 'border-[#1E293B] bg-[#0E0E0E] text-[#666666]'}`}>
                    <div className="font-bold flex items-center gap-1.5">
                      <Thermometer className="w-3.5 h-3.5" strokeWidth={1.5} /> 3. Cadena de Frío
                    </div>
                    <div className="text-[10px] mt-1 text-[#9E9E9E]">13.5°C Promedio Termo</div>
                  </div>

                  {/* Step 4 */}
                  <div className={`p-3 border ${order.escrowStatus === 'RELEASED' ? 'border-[#15803D] bg-[#15803D]/10 text-[#15803D]' : order.escrowStatus === 'DISPUTED' ? 'border-[#F97316] bg-[#F97316]/10 text-[#F97316]' : 'border-[#1E293B] bg-[#0E0E0E] text-[#666666]'}`}>
                    <div className="font-bold flex items-center gap-1.5">
                      <DollarSign className="w-3.5 h-3.5" strokeWidth={1.5} /> 4. Pago Liberado
                    </div>
                    <div className="text-[10px] mt-1 text-[#9E9E9E]">
                      {order.escrowStatus === 'RELEASED' ? 'Directo al Productor' : 'Pendiente de Inspección'}
                    </div>
                  </div>
                </div>

                {/* Cold Chain Sensor Telemetry Preview */}
                {order.temperatureLog && order.temperatureLog.length > 0 && (
                  <div className="bg-[#0E0E0E] border border-[#1E293B] p-3 text-xs font-mono">
                    <div className="flex items-center justify-between text-[#9E9E9E] mb-2">
                      <span className="flex items-center gap-1.5 text-[#E5E5E5] font-bold">
                        <Thermometer className="w-3.5 h-3.5 text-[#FACC15]" strokeWidth={1.5} />
                        Telemetría del Sensor Térmico IoT en Tránsito:
                      </span>
                      <span className="text-[#15803D]">RANGO ÓPTIMO: 12.5°C - 14.5°C</span>
                    </div>
                    <div className="flex flex-wrap gap-3">
                      {order.temperatureLog.map((t, idx) => (
                        <div key={idx} className="bg-[#141414] border border-[#262626] px-2.5 py-1 text-[11px]">
                          <span className="text-[#666666]">{t.time}: </span>
                          <span className="text-[#15803D] font-bold">{t.tempC}°C</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Dispute details if present */}
                {order.escrowStatus === 'DISPUTED' && (
                  <div className="p-4 bg-[#F97316]/10 border-2 border-[#F97316] text-xs font-mono space-y-1">
                    <div className="text-[#F97316] font-bold flex items-center gap-1.5">
                      <AlertTriangle className="w-4 h-4" strokeWidth={1.5} /> CONTRATO CONGELADO EN DISPUTA
                    </div>
                    <p className="text-[#E5E5E5] font-sans text-xs">{order.disputeReason}</p>
                    <p className="text-[10px] text-[#9E9E9E]">
                      El tribunal arbitral de la Cooperativa de Barú y el perito del MIDA están analizando las fotos notarizadas y calibración de campo.
                    </p>
                  </div>
                )}

                {/* Action Toolbar for Escrow Stages */}
                <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-[#1E293B]">
                  <div className="text-[11px] font-mono text-[#666666]">
                    Hash Contrato: <span className="text-[#7C3AED] font-bold">{truncateHash(order.escrowContractHash, 12)}</span>
                  </div>

                  <div className="flex items-center gap-2">
                    {order.escrowStatus === 'FUNDED' && (
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => advanceEscrowStatus(order.id, 'DISPATCHED')}
                      >
                        [Simular Productor] Despachar Carga
                      </Button>
                    )}

                    {order.escrowStatus === 'DISPATCHED' && (
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => advanceEscrowStatus(order.id, 'IN_TRANSIT')}
                      >
                        [Simular Courier] Iniciar Ruta Frigorífica
                      </Button>
                    )}

                    {order.escrowStatus === 'IN_TRANSIT' && (
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => advanceEscrowStatus(order.id, 'DELIVERED_PENDING_INSPECTION')}
                      >
                        [Simular Courier] Entregar en Destino
                      </Button>
                    )}

                    {order.escrowStatus === 'DELIVERED_PENDING_INSPECTION' && (
                      <>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => {
                            setSelectedOrder(order);
                            setDisputeModalOpen(true);
                          }}
                        >
                          Reportar Daño / Abrir Disputa
                        </Button>
                        <Button
                          size="sm"
                          variant="success"
                          onClick={() => handleReleaseEscrow(order.id)}
                          className="flex items-center gap-1.5"
                        >
                          <CheckCircle2 className="w-4 h-4 text-black" strokeWidth={1.5} />
                          Aprobar Inspección & Liberar Fondos
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Dispute Modal */}
      <Dialog open={disputeModalOpen} onOpenChange={setDisputeModalOpen}>
        <DialogCloseButton onClose={() => setDisputeModalOpen(false)} />
        <DialogHeader>
          <DialogTitle className="text-[#F97316] flex items-center gap-2">
            <AlertTriangle className="w-5 h-5" strokeWidth={1.5} />
            Apertura de Disputa Escrow
          </DialogTitle>
          <DialogDescription>
            Si la carga presenta inconsistencias en peso, calibre o calidad biológica respecto a la bitácora criptográfica, los fondos quedan congelados.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleOpenDispute} className="space-y-4 mt-3">
          <div>
            <label className="block text-xs font-mono uppercase text-[#9E9E9E] mb-1 font-bold">
              Motivo Detallado de la Disputa
            </label>
            <textarea
              value={disputeReason}
              onChange={(e) => setDisputeReason(e.target.value)}
              required
              rows={4}
              placeholder="Ej. El calibre del banano recibido es de 38 mm en lugar de 44 mm especificado en la ficha de corte..."
              className="w-full bg-[#0E0E0E] border-2 border-[#F97316] p-3 text-xs text-[#E5E5E5] font-mono focus:outline-none"
            />
          </div>

          <div className="flex justify-end gap-3">
            <Button type="button" variant="secondary" onClick={() => setDisputeModalOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit" variant="destructive">
              Congelar Contrato & Escalar a Cooperativa
            </Button>
          </div>
        </form>
      </Dialog>
    </div>
  );
};
