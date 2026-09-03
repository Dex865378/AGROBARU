import React, { useState } from 'react';
import { 
  ShieldCheck, 
  Lock, 
  CheckCircle2, 
  QrCode, 
  DollarSign, 
  Send, 
  Building2, 
  Info, 
  FileCheck,
  AlertTriangle,
  Globe2,
  RefreshCw
} from 'lucide-react';
import { ProductBatch } from '@/types';
import { useAppState } from '@/context/AppStateContext';
import { useLanguage } from '@/context/LanguageContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogHeader, DialogTitle, DialogDescription, DialogCloseButton } from '@/components/ui/dialog';
import { QRCodeSVG } from 'qrcode.react';
import confetti from 'canvas-confetti';

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
  const { language, translateDynamic } = useLanguage();

  const [quantityKg, setQuantityKg] = useState<number>(isSampleOrder ? 18.14 : 500);
  const [paymentMethod, setPaymentMethod] = useState<'Yappy Comercial' | 'Nequi Panamá' | 'ACH Transfer Directa'>('Yappy Comercial');
  const [currency, setCurrency] = useState<Currency>('USD');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [contractCode, setContractCode] = useState<string>('');
  const [yappyStep, setYappyStep] = useState<'DETAILS' | 'QR_PAY'>('DETAILS');

  if (!batch) return null;

  const totalUsd = quantityKg * batch.pricePerKgUsd;
  const escrowFeeUsd = isSampleOrder ? 15.00 : totalUsd * 0.015; // 1.5% fee or courier sample fee
  const netTotalUsd = totalUsd + escrowFeeUsd;

  const currentRate = exchangeRates[currency];
  const convertedTotal = (netTotalUsd * currentRate.rate).toFixed(currency === 'JPY' ? 0 : 2);

  const yappyPayload = `yappy://pay?merchant=AGROBARU_PANAMA&amount=${netTotalUsd.toFixed(2)}&ref=${batch.batchCode}`;

  const handleCheckout = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsProcessing(true);

    try {
      const order = await initiateEscrowCheckout(batch.id, quantityKg, paymentMethod);
      setContractCode(order.orderCode);
      setIsSuccess(true);

      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#15803D', '#7C3AED', '#FACC15', '#F97316']
      });

      if (onOrderCompleted) onOrderCompleted();
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogCloseButton onClose={onClose} />
      <DialogHeader>
        <div className="flex items-center gap-2">
          <Badge variant="live-purple" pulse>
            {isSampleOrder ? 'SOLICITUD DE CAJA MUESTRA (18 KG)' : 'CONTRATO ESCROW MULTIFIRMA'}
          </Badge>
          <Badge variant="outline">MIDA // ACH PANAMÁ</Badge>
        </div>
        <DialogTitle className="text-lg sm:text-xl mt-1">
          {isSampleOrder 
            ? 'Caja de Muestra Certificada con Envío Refrigerado' 
            : 'Checkout de Custodia & Escrow Protegido'}
        </DialogTitle>
        <DialogDescription>
          {language === 'en'
            ? 'Funds are locked in escrow and only released to the farmer after port reception and quality clearance.'
            : 'Los fondos quedan retenidos en custodia inteligente y solo se transfieren al agricultor tras la validación física en puerto.'}
        </DialogDescription>
      </DialogHeader>

      {isSuccess ? (
        <div className="space-y-4 py-3 text-center font-mono">
          <div className="w-14 h-14 bg-[#15803D]/20 border-2 border-[#15803D] mx-auto flex items-center justify-center text-[#15803D]">
            <CheckCircle2 className="w-8 h-8" />
          </div>

          <div>
            <h3 className="font-display font-black text-lg text-[#E5E5E5] uppercase">
              {isSampleOrder ? '¡Muestra Solicitada Exitosamente!' : '¡Fondos Retenidos en Escrow!'}
            </h3>
            <p className="text-xs text-[#15803D] font-bold mt-0.5">
              CÓDIGO DE CONTRATO: {contractCode}
            </p>
          </div>

          <div className="bg-[#141414] border border-[#15803D] p-4 text-left text-xs space-y-2 text-[#9E9E9E]">
            <div className="flex justify-between">
              <span>Lote Asignado:</span>
              <span className="text-[#E5E5E5] font-bold">{batch.cropName} ({quantityKg} Kg)</span>
            </div>
            <div className="flex justify-between">
              <span>Productor Certificado:</span>
              <span className="text-[#E5E5E5]">{batch.producerName}</span>
            </div>
            <div className="flex justify-between">
              <span>Método de Retención:</span>
              <span className="text-[#FACC15] font-bold">{paymentMethod}</span>
            </div>
            <div className="flex justify-between border-t border-[#1E293B] pt-1.5 text-[#15803D] font-bold">
              <span>Monto en Custodia:</span>
              <span>${netTotalUsd.toFixed(2)} USD</span>
            </div>
          </div>

          <div className="bg-[#0A0A0A] border border-[#1E293B] p-3 text-[11px] text-[#CCCCCC] text-left space-y-1">
            <div className="text-[#7C3AED] font-bold flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5" /> Cláusula de Arbitraje MIDA:
            </div>
            <div>Si la fruta sufre alteraciones térmicas en tránsito, MIDA efectúa peritaje y reembolsa los fondos directamente.</div>
          </div>

          <Button
            onClick={() => {
              setIsSuccess(false);
              onClose();
            }}
            variant="default"
            className="w-full text-xs"
          >
            Entendido / Ver Estado en Mis Órdenes
          </Button>
        </div>
      ) : (
        <form onSubmit={handleCheckout} className="space-y-4 py-2 font-mono text-xs">
          {/* Currency Switcher */}
          <div className="flex items-center justify-between bg-[#141414] p-2.5 border border-[#1E293B]">
            <div className="flex items-center gap-1.5 text-[10px] text-[#9E9E9E] font-bold">
              <Globe2 className="w-3.5 h-3.5 text-[#15803D]" />
              <span>DIVISA COMERCIAL:</span>
            </div>
            <div className="flex items-center gap-1">
              {(['USD', 'EUR', 'GBP', 'JPY'] as Currency[]).map((cur) => (
                <button
                  key={cur}
                  type="button"
                  onClick={() => setCurrency(cur)}
                  className={`px-2 py-0.5 text-[10px] font-bold border transition-all ${
                    currency === cur
                      ? 'bg-[#15803D] text-black border-[#15803D]'
                      : 'bg-[#1A1A1A] text-[#9E9E9E] border-[#262626]'
                  }`}
                >
                  {cur}
                </button>
              ))}
            </div>
          </div>

          {/* Quantity and Price */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[10px] text-[#9E9E9E] uppercase mb-1 font-bold">
                {isSampleOrder ? 'Cantidad Muestra (Kg)' : 'Cantidad a Reservar (Kg) *'}
              </label>
              <Input 
                type="number"
                value={quantityKg}
                onChange={(e) => setQuantityKg(Math.max(1, parseFloat(e.target.value) || 0))}
                disabled={isSampleOrder}
                min={1}
                max={batch.availableKg}
                className="text-xs font-bold text-[#FACC15]"
              />
              <span className="text-[9px] text-[#666666]">
                {isSampleOrder ? '1 caja estándar 40 lbs' : `Disponible: ${batch.availableKg.toLocaleString()} Kg`}
              </span>
            </div>

            <div>
              <label className="block text-[10px] text-[#9E9E9E] uppercase mb-1 font-bold">
                Precio Unitario FOB
              </label>
              <div className="bg-[#141414] border border-[#1E293B] p-2 text-xs font-bold text-[#15803D]">
                ${batch.pricePerKgUsd.toFixed(2)} USD / Kg
              </div>
              <span className="text-[9px] text-[#666666]">Puerto Armuelles</span>
            </div>
          </div>

          {/* Payment Method Selector */}
          <div>
            <label className="block text-[10px] text-[#9E9E9E] uppercase mb-1 font-bold">
              Canal de Pago Protegido (Panamá / Internacional)
            </label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { id: 'Yappy Comercial', label: 'Yappy Comercial', icon: '📱' },
                { id: 'ACH Transfer Directa', label: 'ACH Directo (Banco General)', icon: '🏦' },
                { id: 'Nequi Panamá', label: 'Nequi Panamá', icon: '⚡' },
              ].map((m) => (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => setPaymentMethod(m.id as any)}
                  className={`p-2.5 text-center border transition-all text-xs font-bold flex flex-col items-center justify-center gap-1 ${
                    paymentMethod === m.id
                      ? 'bg-[#15803D]/20 border-[#15803D] text-[#E5E5E5] shadow-[2px_2px_0px_0px_#15803D]'
                      : 'bg-[#141414] border-[#1E293B] text-[#9E9E9E]'
                  }`}
                >
                  <span className="text-base">{m.icon}</span>
                  <span className="text-[10px] uppercase truncate w-full">{m.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Dynamic Yappy QR Preview */}
          {paymentMethod === 'Yappy Comercial' && (
            <div className="bg-[#0A0A0A] border-2 border-[#15803D] p-3 flex items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="text-[11px] font-bold text-[#FACC15] flex items-center gap-1">
                  <QrCode className="w-3.5 h-3.5" /> Escanea con tu App Banco General:
                </div>
                <div className="text-[10px] text-[#CCCCCC]">
                  Comercio Acreditado: <strong>@agrobaru_panama</strong>
                </div>
                <div className="text-[9px] text-[#15803D]">
                  Monto exacto precargado con garantía Escrow
                </div>
              </div>

              <div className="bg-white p-1.5 border border-[#15803D] shrink-0">
                <QRCodeSVG value={yappyPayload} size={64} />
              </div>
            </div>
          )}

          {/* Total Breakdown */}
          <div className="bg-[#141414] border border-[#1E293B] p-3 space-y-1.5 text-xs text-[#9E9E9E]">
            <div className="flex justify-between">
              <span>Subtotal Fruta ({quantityKg} Kg):</span>
              <span className="text-[#E5E5E5]">${totalUsd.toFixed(2)} USD</span>
            </div>
            <div className="flex justify-between">
              <span>Custodia Escrow & Arbitraje MIDA:</span>
              <span className="text-[#15803D]">${escrowFeeUsd.toFixed(2)} USD</span>
            </div>
            <div className="flex justify-between border-t border-[#1E293B] pt-1.5 text-sm font-bold text-[#E5E5E5]">
              <span>Total en Custodia ({currency}):</span>
              <span className="text-[#FACC15]">{currentRate.symbol}{convertedTotal} {currency}</span>
            </div>
          </div>

          {/* Submit */}
          <div className="flex justify-end gap-2 pt-2 border-t border-[#1E293B]">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="text-xs"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              variant="default"
              disabled={isProcessing}
              className="text-xs flex items-center gap-1.5"
            >
              <Lock className="w-3.5 h-3.5" />
              <span>{isProcessing ? 'Bloqueando Fondos...' : `Confirmar Custodia Escrow`}</span>
            </Button>
          </div>
        </form>
      )}
    </Dialog>
  );
};
