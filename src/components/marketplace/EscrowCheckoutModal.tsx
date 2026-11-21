import React, { useState } from 'react';
import { 
  ShieldCheck, 
  Lock, 
  CheckCircle2, 
  QrCode, 
  Globe2,
  Smartphone,
  Building2,
  CreditCard,
  Truck,
  Download,
  Printer
} from 'lucide-react';
import { DeliveryMode, EscrowOrder, ProductBatch } from '@/types';
import { useAppState } from '@/context/AppStateContext';
import { useLanguage } from '@/context/LanguageContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogHeader, DialogTitle, DialogDescription, DialogCloseButton } from '@/components/ui/dialog';
import { QRCodeSVG } from 'qrcode.react';
import { DELIVERY_MODE_LABELS, calculateFreightUsd, downloadOrderReceipt, printOrderReceipt } from '@/services/receiptService';

interface EscrowCheckoutModalProps {
  batch: ProductBatch | null;
  isOpen: boolean;
  onClose: () => void;
  onOrderCompleted?: () => void;
  isSampleOrder?: boolean;
}

type Currency = 'USD' | 'EUR' | 'GBP' | 'JPY';

const exchangeRates: Record<Currency, { rate: number; symbol: string }> = {
  USD: { rate: 1.0, symbol: '$' },
  EUR: { rate: 0.92, symbol: '€' },
  GBP: { rate: 0.79, symbol: '£' },
  JPY: { rate: 154.5, symbol: '¥' },
};

export const EscrowCheckoutModal: React.FC<EscrowCheckoutModalProps> = ({
  batch,
  isOpen,
  onClose,
  onOrderCompleted,
  isSampleOrder = false,
}) => {
  const { initiateEscrowCheckout, currentUser } = useAppState();
  const { language } = useLanguage();

  const [quantityKg, setQuantityKg] = useState<number>(isSampleOrder ? 18.14 : 500);
  const [deliveryMode, setDeliveryMode] = useState<DeliveryMode>('pickup_armuelles');
  const [deliveryAddress, setDeliveryAddress] = useState<string>('');
  const [companyName, setCompanyName] = useState<string>(currentUser.name || '');
  const [buyerTaxId, setBuyerTaxId] = useState<string>('');
  const [paymentMethod, setPaymentMethod] = useState<'Yappy Comercial' | 'Nequi Panamá' | 'ACH Transfer Directa'>('Yappy Comercial');
  const [currency, setCurrency] = useState<Currency>('USD');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [completedOrder, setCompletedOrder] = useState<EscrowOrder | null>(null);

  if (!batch) return null;

  const effectiveQty = isSampleOrder ? 18.14 : Math.min(batch.availableKg, Math.max(1, quantityKg));
  const totalUsd = effectiveQty * batch.pricePerKgUsd;
  const escrowFeeUsd = isSampleOrder ? 15.00 : totalUsd * 0.015;
  const freightUsd = isSampleOrder ? 0 : calculateFreightUsd(deliveryMode, effectiveQty);
  const netTotalUsd = totalUsd + escrowFeeUsd + freightUsd;

  const currentRate = exchangeRates[currency];
  const convertedTotal = (netTotalUsd * currentRate.rate).toFixed(currency === 'JPY' ? 0 : 2);
  const yappyPayload = `yappy://pay?merchant=AGROBARU_PANAMA&amount=${netTotalUsd.toFixed(2)}&ref=${batch.batchCode}`;

  const handleCheckout = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsProcessing(true);

    try {
      const order = await initiateEscrowCheckout(batch.id, effectiveQty, paymentMethod, {
        deliveryMode,
        deliveryAddress:
          deliveryMode === 'pickup_armuelles'
            ? 'Centro de Acopio Cooperativa Barú, Puerto Armuelles'
            : deliveryAddress.trim() || 'Por confirmar con logística',
        freightUsd,
        companyName: companyName.trim() || currentUser.name,
        buyerTaxId: buyerTaxId.trim() || undefined,
      });
      setCompletedOrder(order);
      setIsSuccess(true);
      onOrderCompleted?.();
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogCloseButton onClose={onClose} />
      <DialogHeader>
        <div className="flex items-center gap-2">
          <Badge variant="live-purple">
            {isSampleOrder ? 'Caja de Muestra (18.14 Kg)' : 'Pago Protegido Escrow'}
          </Badge>
          <Badge variant="outline">Respaldo MIDA Panamá</Badge>
        </div>
        <DialogTitle className="mt-1">
          {isSampleOrder 
            ? 'Solicitar Caja de Muestra Certificada' 
            : 'Confirmar Compra Protegida en Custodia'}
        </DialogTitle>
        <DialogDescription>
          {language === 'en'
            ? 'Funds remain securely held in custody and are only released after reception and weight confirmation.'
            : 'El dinero queda resguardado en custodia y solo se libera al productor tras confirmar la recepción física.'}
        </DialogDescription>
      </DialogHeader>

      {isSuccess && completedOrder ? (
        <div className="space-y-4 py-3 text-center font-sans">
          <div className="w-12 h-12 rounded-full bg-emerald-500/15 border border-emerald-500/40 mx-auto flex items-center justify-center text-emerald-400">
            <CheckCircle2 className="w-6 h-6" />
          </div>

          <div>
            <h3 className="font-display font-bold text-lg text-slate-100">
              {isSampleOrder ? 'Muestra Solicitada Exitosamente' : 'Fondos Asegurados en Custodia'}
            </h3>
            <p className="text-xs text-emerald-400 font-mono font-semibold mt-0.5">
              Contrato: {completedOrder.orderCode}
            </p>
          </div>

          <div className="bg-[#161E19] border border-emerald-500/25 rounded-xl p-4 text-left text-xs space-y-2 text-slate-400">
            <div className="flex justify-between">
              <span>Lote Asignado:</span>
              <span className="text-slate-100 font-semibold">{batch.cropName} ({effectiveQty} Kg)</span>
            </div>
            <div className="flex justify-between">
              <span>Productor:</span>
              <span className="text-slate-200">{batch.producerName}</span>
            </div>
            <div className="flex justify-between">
              <span>Método de Pago:</span>
              <span className="text-amber-300 font-semibold">{paymentMethod}</span>
            </div>
            <div className="flex justify-between border-t border-slate-800 pt-2 text-emerald-400 font-bold">
              <span>Total en Custodia:</span>
              <span className="font-mono">${netTotalUsd.toFixed(2)} USD</span>
            </div>
          </div>

          <div className="bg-[#0B100D] border border-slate-800 rounded-xl p-3 text-[11px] text-slate-300 text-left space-y-1">
            <div className="text-violet-300 font-semibold flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5" /> Garantía de Inspección en Destino
            </div>
            <div>Si la carga presenta discrepancias en calibre, peso o temperatura, puedes abrir una reclamación en 24-48h para reembolso.</div>
          </div>

          <div className="flex flex-col sm:flex-row gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => downloadOrderReceipt([completedOrder])}
              className="flex-1 flex items-center justify-center gap-1.5 text-xs"
            >
              <Download className="w-3.5 h-3.5 text-emerald-400" />
              <span>Comprobante</span>
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => printOrderReceipt([completedOrder])}
              className="flex-1 flex items-center justify-center gap-1.5 text-xs"
            >
              <Printer className="w-3.5 h-3.5 text-emerald-400" />
              <span>Imprimir / PDF</span>
            </Button>
            <Button
              onClick={() => {
                setIsSuccess(false);
                setCompletedOrder(null);
                onClose();
              }}
              variant="default"
              className="flex-1 text-xs"
            >
              Finalizar
            </Button>
          </div>
        </div>
      ) : (
        <form onSubmit={handleCheckout} className="space-y-4 py-3 font-sans text-xs">
          {/* Currency Switcher */}
          <div className="flex items-center justify-between bg-[#161E19] p-2.5 rounded-lg border border-slate-800">
            <div className="flex items-center gap-1.5 text-xs text-slate-300 font-medium">
              <Globe2 className="w-4 h-4 text-emerald-400" />
              <span>Divisa</span>
            </div>
            <div className="flex items-center gap-1">
              {(['USD', 'EUR', 'GBP', 'JPY'] as Currency[]).map((cur) => (
                <button
                  key={cur}
                  type="button"
                  onClick={() => setCurrency(cur)}
                  className={`px-2 py-0.5 rounded text-[11px] font-mono font-semibold border transition-all ${
                    currency === cur
                      ? 'bg-emerald-600 text-white border-emerald-500'
                      : 'bg-[#0B100D] text-slate-400 border-slate-700'
                  }`}
                >
                  {cur}
                </button>
              ))}
            </div>
          </div>

          {/* Quantity and Price */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-slate-300 mb-1 font-medium">
                {isSampleOrder ? 'Cantidad Muestra (Kg)' : 'Cantidad a Comprar (Kg) *'}
              </label>
              <Input 
                type="number"
                value={effectiveQty}
                onChange={(e) => setQuantityKg(Math.max(1, parseFloat(e.target.value) || 0))}
                disabled={isSampleOrder}
                min={1}
                max={batch.availableKg}
                className="font-mono font-bold text-amber-300"
              />
              <span className="text-[11px] text-slate-500 mt-1 block">
                {isSampleOrder ? '1 caja estándar (40 lb)' : `Disponible: ${batch.availableKg.toLocaleString()} Kg`}
              </span>
            </div>

            <div>
              <label className="block text-xs text-slate-300 mb-1 font-medium">
                Precio Unitario Directo
              </label>
              <div className="h-10 rounded-lg bg-[#161E19] border border-slate-800 px-3 flex items-center font-mono font-bold text-emerald-400">
                ${batch.pricePerKgUsd.toFixed(2)} USD / Kg
              </div>
              <span className="text-[11px] text-slate-500 mt-1 block">{batch.corregimiento}</span>
            </div>
          </div>

          {/* Delivery Mode */}
          {!isSampleOrder && (
            <div className="space-y-2">
              <label className="block text-xs text-slate-300 font-medium">
                Modalidad de Entrega
              </label>
              <select
                value={deliveryMode}
                onChange={(e) => setDeliveryMode(e.target.value as DeliveryMode)}
                className="w-full h-10 rounded-lg bg-[#0B100D] border border-slate-700/80 text-slate-100 text-xs px-3 focus:border-emerald-500 focus:outline-none"
              >
                {(Object.keys(DELIVERY_MODE_LABELS) as DeliveryMode[]).map((mode) => (
                  <option key={mode} value={mode}>
                    {DELIVERY_MODE_LABELS[mode].title}
                  </option>
                ))}
              </select>

              {deliveryMode !== 'pickup_armuelles' && (
                <Input
                  value={deliveryAddress}
                  onChange={(e) => setDeliveryAddress(e.target.value)}
                  placeholder="Dirección de entrega o terminal portuaria *"
                  required
                />
              )}
            </div>
          )}

          {/* Billing Info */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-slate-300 mb-1 font-medium">Comprador / Empresa</label>
              <Input
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                placeholder="Razón social"
              />
            </div>
            <div>
              <label className="block text-xs text-slate-300 mb-1 font-medium">RUC / Cédula (Opcional)</label>
              <Input
                value={buyerTaxId}
                onChange={(e) => setBuyerTaxId(e.target.value)}
                placeholder="Para comprobante"
              />
            </div>
          </div>

          {/* Payment Method Selector (Zero Emojis) */}
          <div>
            <label className="block text-xs text-slate-300 mb-1.5 font-medium">
              Método de Pago Protegido
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              {[
                { id: 'Yappy Comercial', label: 'Yappy Comercial', Icon: Smartphone },
                { id: 'ACH Transfer Directa', label: 'ACH Banco General', Icon: Building2 },
                { id: 'Nequi Panamá', label: 'Nequi Panamá', Icon: CreditCard },
              ].map((m) => {
                const Icon = m.Icon;
                const active = paymentMethod === m.id;
                return (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => setPaymentMethod(m.id as any)}
                    className={`p-2.5 rounded-xl text-center border transition-all flex flex-col items-center justify-center gap-1.5 ${
                      active
                        ? 'bg-emerald-500/15 border-emerald-500 text-slate-100'
                        : 'bg-[#161E19] border-slate-800 text-slate-400 hover:border-slate-700'
                    }`}
                  >
                    <Icon className={`w-4 h-4 ${active ? 'text-emerald-400' : 'text-slate-400'}`} />
                    <span className="text-[11px] font-semibold leading-snug">{m.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {paymentMethod === 'Yappy Comercial' && (
            <div className="bg-[#0B100D] border border-emerald-500/30 rounded-xl p-3 flex items-center justify-between gap-4">
              <div className="space-y-0.5">
                <div className="text-xs font-semibold text-amber-300 flex items-center gap-1.5">
                  <QrCode className="w-3.5 h-3.5" /> Escanea con tu App Banco General
                </div>
                <div className="text-[11px] text-slate-300">
                  Comercio acreditado: <strong>@agrobaru_panama</strong>
                </div>
                <div className="text-[11px] text-emerald-400">
                  Monto precargado con garantía Escrow
                </div>
              </div>
              <div className="bg-white p-1.5 rounded-lg shrink-0">
                <QRCodeSVG value={yappyPayload} size={58} />
              </div>
            </div>
          )}

          {/* Total Breakdown */}
          <div className="bg-[#161E19] border border-slate-800 rounded-xl p-3.5 space-y-1.5 text-xs text-slate-400">
            <div className="flex justify-between">
              <span>Subtotal Fruta ({effectiveQty} Kg)</span>
              <span className="font-mono text-slate-200">${totalUsd.toFixed(2)} USD</span>
            </div>
            <div className="flex justify-between">
              <span>{isSampleOrder ? 'Envío de muestra + Custodia Escrow' : 'Custodia Escrow y Respaldo MIDA'}</span>
              <span className="font-mono text-emerald-400">${escrowFeeUsd.toFixed(2)} USD</span>
            </div>
            {freightUsd > 0 && (
              <div className="flex justify-between">
                <span>Flete Refrigerado Estimado</span>
                <span className="font-mono text-slate-200">${freightUsd.toFixed(2)} USD</span>
              </div>
            )}
            <div className="flex justify-between border-t border-slate-800 pt-2 text-sm font-bold text-slate-100">
              <span>Total en Custodia ({currency})</span>
              <span className="font-mono text-amber-300">{currentRate.symbol}{convertedTotal} {currency}</span>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit" variant="default" disabled={isProcessing} className="flex items-center gap-1.5">
              <Lock className="w-3.5 h-3.5" />
              <span>{isProcessing ? 'Procesando...' : 'Confirmar Custodia'}</span>
            </Button>
          </div>
        </form>
      )}
    </Dialog>
  );
};
