import React, { useState } from 'react';
import { 
  Truck, 
  CheckCircle2, 
  AlertTriangle, 
  Thermometer, 
  Lock, 
  DollarSign,
  Download,
  Printer,
  MapPin
} from 'lucide-react';
import { useAppState } from '@/context/AppStateContext';
import { EscrowOrder, EscrowStatus } from '@/types';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogHeader, DialogTitle, DialogDescription, DialogCloseButton } from '@/components/ui/dialog';
import { formatCurrency, truncateHash } from '@/lib/utils';
import { downloadOrderReceipt, printOrderReceipt } from '@/services/receiptService';

export const OrderTracker: React.FC = () => {
  const { orders, advanceEscrowStatus } = useAppState();

  const [selectedOrder, setSelectedOrder] = useState<EscrowOrder | null>(null);
  const [disputeModalOpen, setDisputeModalOpen] = useState(false);
  const [disputeReason, setDisputeReason] = useState('');

  const getTempStats = (order: EscrowOrder) => {
    const temps = (order.temperatureLog || []).map((t) => t.tempC);
    if (temps.length === 0) return null;
    const min = Math.min(...temps);
    const max = Math.max(...temps);
    const avg = temps.reduce((s, t) => s + t, 0) / temps.length;
    return { min, max, avg };
  };

  const getStatusBadge = (status: EscrowStatus) => {
    switch (status) {
      case 'FUNDED':
        return <Badge variant="yellow">Fondos en Custodia</Badge>;
      case 'DISPATCHED':
        return <Badge variant="purple">Despachado de Finca</Badge>;
      case 'IN_TRANSIT':
        return <Badge variant="default">En Tránsito</Badge>;
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
  };

  const handleOpenDispute = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOrder || !disputeReason.trim()) return;

    await advanceEscrowStatus(selectedOrder.id, 'DISPUTED', { disputeReason });
    setDisputeModalOpen(false);
    setDisputeReason('');
  };

  return (
    <div className="space-y-6 font-sans">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-emerald-500/20 pb-4">
        <div>
          <h2 className="font-display font-bold text-2xl text-slate-100 tracking-normal leading-snug">
            Mis Contratos y Seguimiento de Entregas
          </h2>
          <p className="text-xs text-slate-400">
            Transparencia de pago protegido: el dinero permanece en custodia hasta confirmar la recepción física conforme.
          </p>
        </div>

        <div className="text-xs font-mono text-slate-300 bg-[#111714] px-3 py-2 rounded-lg border border-emerald-500/20 self-start">
          Contratos Activos: <strong className="text-emerald-400">{orders.length}</strong>
        </div>
      </div>

      {orders.length === 0 ? (
        <div className="bg-[#111714] border border-slate-800 rounded-xl p-10 text-center text-slate-400 text-xs space-y-2">
          <Lock className="w-7 h-7 text-slate-500 mx-auto" />
          <div className="font-semibold text-slate-200 text-sm">Aún no tienes órdenes registradas</div>
          <p>Agrega uno o varios lotes al carrito en el Mercado Agrícola para iniciar un contrato de compra protegida.</p>
        </div>
      ) : (
        <div className="space-y-5">
          {orders.map((order) => {
            return (
              <div
                key={order.id}
                className="bg-[#111714] border border-emerald-500/20 rounded-xl p-5 sm:p-6 space-y-5 shadow-lg shadow-black/25 hover:border-emerald-500/40 transition-all"
              >
                {/* Header Strip */}
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800/80 pb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                      <Lock className="w-5 h-5" strokeWidth={1.5} />
                    </div>
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="font-display font-bold text-base text-slate-100">
                          {order.productName} ({order.quantityKg.toLocaleString()} Kg)
                        </h3>
                        {getStatusBadge(order.escrowStatus)}
                      </div>
                      <div className="text-xs text-slate-400 mt-0.5">
                        Contrato: <span className="font-mono text-emerald-400 font-semibold">{order.orderCode}</span> • Finca: {order.farmName} ({order.farmerName})
                      </div>
                      {order.deliveryAddress && (
                        <div className="text-[11px] text-slate-400 mt-0.5 flex items-center gap-1">
                          <MapPin className="w-3 h-3 text-emerald-400" />
                          <span>Destino: {order.deliveryAddress}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="text-left sm:text-right">
                    <div className="text-[11px] text-slate-400">Monto en Custodia</div>
                    <div className="text-lg font-mono font-bold text-emerald-400">
                      {formatCurrency(order.totalUsd + (order.freightUsd || 0))}
                    </div>
                    <div className="text-[11px] text-slate-500">Pago: {order.paymentMethod}</div>
                  </div>
                </div>

                {/* Visual Pipeline Bar */}
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-2.5 text-xs">
                  <div className={`p-3 rounded-lg border ${order.escrowStatus !== 'CREATED' ? 'border-emerald-500/35 bg-emerald-500/10 text-emerald-300' : 'border-slate-800 bg-[#0B100D] text-slate-500'}`}>
                    <div className="font-semibold flex items-center gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5" strokeWidth={1.5} /> 1. Fondos Asegurados
                    </div>
                    <div className="text-[11px] mt-1 text-slate-400">Retenido en custodia Escrow</div>
                  </div>

                  <div className={`p-3 rounded-lg border ${['DISPATCHED', 'IN_TRANSIT', 'DELIVERED_PENDING_INSPECTION', 'RELEASED'].includes(order.escrowStatus) ? 'border-violet-500/35 bg-violet-500/10 text-violet-300' : 'border-slate-800 bg-[#0B100D] text-slate-500'}`}>
                    <div className="font-semibold flex items-center gap-1.5">
                      <Truck className="w-3.5 h-3.5" strokeWidth={1.5} /> 2. Despacho de Finca
                    </div>
                    <div className="text-[11px] mt-1 font-mono text-slate-400 truncate">{order.trackingNumber}</div>
                  </div>

                  <div className={`p-3 rounded-lg border ${['DELIVERED_PENDING_INSPECTION', 'RELEASED'].includes(order.escrowStatus) ? 'border-amber-500/35 bg-amber-500/10 text-amber-300' : 'border-slate-800 bg-[#0B100D] text-slate-500'}`}>
                    <div className="font-semibold flex items-center gap-1.5">
                      <Thermometer className="w-3.5 h-3.5" strokeWidth={1.5} /> 3. Control de Temperatura
                    </div>
                    <div className="text-[11px] mt-1 text-slate-400">
                      {getTempStats(order) ? `${getTempStats(order)!.avg.toFixed(1)} °C promedio registrado` : 'Sin registro térmico'}
                    </div>
                  </div>

                  <div className={`p-3 rounded-lg border ${order.escrowStatus === 'RELEASED' ? 'border-emerald-500/35 bg-emerald-500/10 text-emerald-300' : order.escrowStatus === 'DISPUTED' ? 'border-red-500/35 bg-red-500/10 text-red-300' : 'border-slate-800 bg-[#0B100D] text-slate-500'}`}>
                    <div className="font-semibold flex items-center gap-1.5">
                      <DollarSign className="w-3.5 h-3.5" strokeWidth={1.5} /> 4. Pago Liberado
                    </div>
                    <div className="text-[11px] mt-1 text-slate-400">
                      {order.escrowStatus === 'RELEASED' ? 'Transferido al productor' : 'Pendiente de inspección'}
                    </div>
                  </div>
                </div>

                {/* Cold Chain Sensor Telemetry Preview */}
                {order.temperatureLog && order.temperatureLog.length > 0 && (
                  <div className="bg-[#0B100D] border border-slate-800 rounded-lg p-3 text-xs">
                    <div className="flex flex-wrap items-center justify-between gap-2 text-slate-400 mb-2">
                      <span className="flex items-center gap-1.5 text-slate-200 font-medium">
                        <Thermometer className="w-3.5 h-3.5 text-amber-400" strokeWidth={1.5} />
                        Registro Térmico en Tránsito:
                      </span>
                      <span className="font-mono text-[11px] text-emerald-400">
                        {getTempStats(order)
                          ? `Rango registrado: ${getTempStats(order)!.min} °C - ${getTempStats(order)!.max} °C`
                          : 'Sin registros'}
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {order.temperatureLog.map((t, idx) => (
                        <div key={idx} className="bg-[#161E19] border border-slate-800 rounded px-2.5 py-1 text-[11px] font-mono">
                          <span className="text-slate-400">{t.time}: </span>
                          <span className="text-emerald-400 font-semibold">{t.tempC} °C</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Dispute details if present */}
                {order.escrowStatus === 'DISPUTED' && (
                  <div className="p-4 bg-red-500/10 border border-red-500/40 rounded-xl text-xs space-y-1">
                    <div className="text-red-300 font-semibold flex items-center gap-1.5">
                      <AlertTriangle className="w-4 h-4" strokeWidth={1.5} /> Contrato en Revisión / Disputa
                    </div>
                    <p className="text-slate-200">{order.disputeReason}</p>
                    <p className="text-[11px] text-slate-400">
                      El comité técnico de la Cooperativa de Barú y MIDA están evaluando las evidencias para resolver el reembolso.
                    </p>
                  </div>
                )}

                {/* Action Toolbar */}
                <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-800/80">
                  <div className="flex items-center gap-3">
                    <div className="text-[11px] font-mono text-slate-500">
                      Sello: <span className="text-violet-400 font-semibold">{truncateHash(order.escrowContractHash, 12)}</span>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => downloadOrderReceipt([order])}
                      className="min-h-8 h-auto py-1 px-2.5 text-[11px] flex items-center gap-1"
                    >
                      <Download className="w-3 h-3 text-emerald-400 shrink-0" />
                      <span>Comprobante</span>
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => printOrderReceipt([order])}
                      className="min-h-8 h-auto py-1 px-2 text-[11px] flex items-center gap-1"
                      title="Imprimir o guardar la factura en PDF"
                      aria-label="Imprimir o guardar la factura en PDF"
                    >
                      <Printer className="w-3 h-3 text-emerald-400 shrink-0" />
                      <span>PDF</span>
                    </Button>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    {order.escrowStatus === 'FUNDED' && (
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => advanceEscrowStatus(order.id, 'DISPATCHED')}
                      >
                        Registrar Despacho de Finca
                      </Button>
                    )}

                    {order.escrowStatus === 'DISPATCHED' && (
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => advanceEscrowStatus(order.id, 'IN_TRANSIT')}
                      >
                        Iniciar Ruta Refrigerada
                      </Button>
                    )}

                    {order.escrowStatus === 'IN_TRANSIT' && (
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => advanceEscrowStatus(order.id, 'DELIVERED_PENDING_INSPECTION')}
                      >
                        Confirmar Entrega en Destino
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
                          Reportar Problema
                        </Button>
                        <Button
                          size="sm"
                          variant="success"
                          onClick={() => handleReleaseEscrow(order.id)}
                          className="flex items-center gap-1.5"
                        >
                          <CheckCircle2 className="w-4 h-4" strokeWidth={1.5} />
                          Aprobar y Liberar Pago
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
          <DialogTitle className="text-red-400 flex items-center gap-2">
            <AlertTriangle className="w-5 h-5" strokeWidth={1.5} />
            Reportar Problema y Retener Pago
          </DialogTitle>
          <DialogDescription>
            Si la carga presenta inconsistencias en peso, calibre o estado de la fruta, los fondos se mantienen retenidos mientras se revisa el caso.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleOpenDispute} className="space-y-4 mt-3">
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5">
              Describe el Motivo de la Reclamación
            </label>
            <textarea
              value={disputeReason}
              onChange={(e) => setDisputeReason(e.target.value)}
              required
              rows={4}
              placeholder="Ej. El calibre recibido es menor al especificado o hubo ruptura de temperatura en ruta..."
              className="w-full rounded-lg bg-[#0B100D] border border-red-500/40 p-3 text-xs text-slate-100 focus:outline-none focus:border-red-400"
            />
          </div>

          <div className="flex justify-end gap-3">
            <Button type="button" variant="secondary" onClick={() => setDisputeModalOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit" variant="destructive">
              Enviar Reclamación
            </Button>
          </div>
        </form>
      </Dialog>
    </div>
  );
};
