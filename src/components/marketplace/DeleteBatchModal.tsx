import React, { useState } from 'react';
import { Trash2, AlertTriangle, AlertOctagon, CheckCircle2, X } from 'lucide-react';
import { ProductBatch } from '@/types';
import { Button } from '@/components/ui/button';
import { Dialog, DialogHeader, DialogTitle, DialogDescription, DialogCloseButton } from '@/components/ui/dialog';

interface DeleteBatchModalProps {
  batch: ProductBatch | null;
  isOpen: boolean;
  onClose: () => void;
  onConfirmDelete: (batchId: string) => Promise<void>;
}

export const DeleteBatchModal: React.FC<DeleteBatchModalProps> = ({
  batch,
  isOpen,
  onClose,
  onConfirmDelete,
}) => {
  const [isDeleting, setIsDeleting] = useState(false);

  if (!batch) return null;

  const isSoldOut = batch.availableKg <= 0 || batch.status === 'sold_out';

  const handleDelete = async () => {
    try {
      setIsDeleting(true);
      await onConfirmDelete(batch.id);
      onClose();
    } catch (err) {
      console.error('Error al eliminar lote:', err);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogCloseButton onClose={onClose} />
      <DialogHeader>
        <div className="flex items-center gap-2 text-[#EF4444] font-mono text-sm font-bold uppercase tracking-wider">
          <AlertOctagon className="w-5 h-5 text-[#EF4444]" />
          <span>Eliminación de Producto / Lote</span>
        </div>
        <DialogTitle className="text-xl font-display font-black text-[#E5E5E5] uppercase mt-1">
          ¿Deseas retirar este lote del mercado?
        </DialogTitle>
        <DialogDescription className="text-xs text-[#9E9E9E] font-mono">
          Esta acción retirará de inmediato el producto de la plataforma para evitar saturación en el catálogo.
        </DialogDescription>
      </DialogHeader>

      <div className="space-y-4 my-4">
        {/* Batch summary card */}
        <div className="bg-[#121212] border border-[#EF4444]/40 p-4 rounded-none space-y-2 font-mono text-xs">
          <div className="flex justify-between items-start">
            <span className="text-[#9E9E9E]">Código de Lote:</span>
            <span className="font-bold text-[#E5E5E5] bg-[#1E293B] px-2 py-0.5">{batch.batchCode}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-[#9E9E9E]">Cultivo / Variedad:</span>
            <span className="font-bold text-[#15803D]">{batch.cropName} ({batch.variety})</span>
          </div>
          <div className="flex justify-between">
            <span className="text-[#9E9E9E]">Finca de Origen:</span>
            <span className="text-[#E5E5E5]">{batch.farmName} ({batch.corregimiento})</span>
          </div>
          <div className="flex justify-between">
            <span className="text-[#9E9E9E]">Estado actual:</span>
            <span className={`font-bold uppercase ${isSoldOut ? 'text-[#EF4444]' : 'text-[#FACC15]'}`}>
              {isSoldOut ? '● 100% Vendido (Agotado)' : `${batch.availableKg} Kg disponibles`}
            </span>
          </div>
        </div>

        {/* Informative notice */}
        {isSoldOut ? (
          <div className="p-3 bg-[#EF4444]/10 border border-[#EF4444]/30 text-xs font-mono text-[#FCA5A5] flex items-start gap-2.5">
            <CheckCircle2 className="w-4 h-4 text-[#EF4444] shrink-0 mt-0.5" />
            <div>
              <strong className="text-white block mb-0.5">Lote 100% Vendido y Liquidado</strong>
              Este lote ya no tiene inventario disponible. Si no lo eliminas ahora, el sistema lo limpiará automáticamente en 24 horas para mantener la plataforma despejada.
            </div>
          </div>
        ) : (
          <div className="p-3 bg-[#FACC15]/10 border border-[#FACC15]/30 text-xs font-mono text-[#FEF08A] flex items-start gap-2.5">
            <AlertTriangle className="w-4 h-4 text-[#FACC15] shrink-0 mt-0.5" />
            <div>
              <strong className="text-white block mb-0.5">Atención: Aún hay stock disponible</strong>
              Al eliminar este lote, los compradores ya no podrán adquirir los {batch.availableKg} Kg restantes a través de la plataforma.
            </div>
          </div>
        )}
      </div>

      <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#1E293B]">
        <Button
          variant="outline"
          onClick={onClose}
          disabled={isDeleting}
          className="border-[#1E293B] text-[#CCCCCC] hover:text-white"
        >
          Cancelar
        </Button>

        <Button
          onClick={handleDelete}
          disabled={isDeleting}
          className="bg-[#EF4444] hover:bg-[#DC2626] text-white border-2 border-[#B91C1C] shadow-[3px_3px_0px_0px_#B91C1C] font-mono font-bold text-xs uppercase flex items-center gap-1.5"
        >
          <Trash2 className="w-4 h-4" />
          {isDeleting ? 'Eliminando Lote...' : 'Sí, Eliminar Lote'}
        </Button>
      </div>
    </Dialog>
  );
};
