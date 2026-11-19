import React, { useState } from 'react';
import { MapPin, Plus, Trash2, Clock, Timer, AlertCircle, Sprout, CheckCircle2 } from 'lucide-react';
import { useAppState } from '@/context/AppStateContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogHeader, DialogTitle, DialogDescription, DialogCloseButton } from '@/components/ui/dialog';
import { BaruCorregimiento, ProductBatch } from '@/types';
import { DeleteBatchModal } from '@/components/marketplace/DeleteBatchModal';
import { PublishBatchWizardModal } from './PublishBatchWizardModal';
import { formatTimeAgo, getFreshnessTier, getRemainingPurgeHours } from '@/services/dateUtils';
import { useNotification } from '@/context/NotificationContext';

export const FarmManagement: React.FC = () => {
  const { farms, batches, deleteProductBatch } = useAppState();
  const { success } = useNotification();

  const [isFarmModalOpen, setIsFarmModalOpen] = useState(false);
  const [isWizardOpen, setIsWizardOpen] = useState(false);
  const [batchToDelete, setBatchToDelete] = useState<ProductBatch | null>(null);

  // Form states - Farm
  const [farmName, setFarmName] = useState('');
  const [corregimiento, setCorregimiento] = useState<BaruCorregimiento>('Puerto Armuelles');
  const [areaHectares, setAreaHectares] = useState('5.0');
  const [cropType, setCropType] = useState('Banano Cavendish');

  const handleCreateFarm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!farmName.trim()) return;

    success('Parcela Registrada', `Finca "${farmName}" enviada para verificación catastral MIDA.`);
    setIsFarmModalOpen(false);
    setFarmName('');
  };

  return (
    <div className="space-y-6">
      {/* Header Actions */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#1E2E26] pb-4">
        <div>
          <h2 className="font-display font-bold text-2xl text-[#ECFDF5] tracking-normal leading-snug">
            Mis Parcelas & Publicación de Cosechas
          </h2>
          <p className="text-xs text-[#9E9E9E] font-sans mt-0.5">
            Registra tus fincas con ubicación exacta y publica nuevas cosechas en 4 pasos guiados para compradores directos.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <Button
            onClick={() => setIsFarmModalOpen(true)}
            variant="secondary"
            size="sm"
            className="flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4 text-[#10B981]" strokeWidth={1.5} />
            Nueva Parcela
          </Button>

          <Button
            onClick={() => setIsWizardOpen(true)}
            variant="default"
            size="sm"
            className="flex items-center gap-1.5"
          >
            <Sprout className="w-4 h-4" strokeWidth={1.75} />
            Publicar Nueva Cosecha
          </Button>
        </div>
      </div>

      {/* Guided Onboarding Banner for New Producers */}
      <div className="bg-[#111714] border border-[#10B981]/40 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-lg bg-[#10B981]/15 border border-[#10B981]/30 flex items-center justify-center shrink-0 text-[#10B981]">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-display font-semibold text-sm text-[#ECFDF5]">
              Publicación Guiada en 4 Pasos
            </h3>
            <p className="text-xs text-[#9E9E9E] font-sans leading-relaxed mt-0.5">
              El asistente calcula automáticamente la equivalencia en cajas de 40 lb, tu ingreso neto (98.5%) y genera el certificado QR para compradores.
            </p>
          </div>
        </div>

        <Button
          onClick={() => setIsWizardOpen(true)}
          variant="outline"
          size="sm"
          className="shrink-0"
        >
          Iniciar Asistente
        </Button>
      </div>

      {/* Farms List */}
      <div className="space-y-4">
        <h3 className="font-display font-bold text-base text-[#ECFDF5]">
          Parcelas Registradas ({farms.length})
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {farms.map((farm) => (
            <div
              key={farm.id}
              className="bg-[#111714] border border-[#1E2E26] hover:border-[#10B981]/50 rounded-xl p-5 space-y-3 transition-all shadow-sm"
            >
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div className="min-w-0 flex-1">
                  <Badge variant="default" className="text-[10px]">
                    {farm.primaryCrops.join(', ')}
                  </Badge>
                  <h4 className="font-display font-bold text-lg text-[#ECFDF5] mt-1.5 break-words">
                    {farm.name}
                  </h4>
                  <div className="text-xs font-mono text-[#9E9E9E]">
                    Titular: <strong className="text-[#E5E5E5]">{farm.ownerName}</strong>
                  </div>
                </div>

                <div className="text-left sm:text-right font-mono text-xs text-[#10B981] shrink-0">
                  <div className="font-bold">{farm.areaHectares} Ha</div>
                  <div className="text-[10px] text-[#9E9E9E]">MIDA Verificado</div>
                </div>
              </div>

              <div className="bg-[#090D0B] border border-[#1E2E26] rounded-lg p-3 text-xs font-mono space-y-1.5 text-[#9E9E9E]">
                <div className="flex flex-wrap justify-between gap-2">
                  <span className="flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-[#10B981] shrink-0" strokeWidth={1.5} /> Corregimiento:
                  </span>
                  <span className="text-[#FACC15] font-bold">{farm.corregimiento}</span>
                </div>
                <div className="flex flex-wrap justify-between gap-2">
                  <span>Registro MIDA:</span>
                  <span className="text-[#E5E5E5]">{farm.registrationNumber}</span>
                </div>
                <div className="flex flex-wrap justify-between gap-2">
                  <span>GPS Finca:</span>
                  <span className="text-[#A78BFA]">{farm.coordinates.lat}°N, {farm.coordinates.lng}°W</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Published Batches */}
      <div className="space-y-4 pt-4 border-t border-[#1E2E26]">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <h3 className="font-display font-bold text-base text-[#ECFDF5]">
            Lotes Publicados en el Catálogo ({batches.length})
          </h3>
          <span className="text-[11px] font-mono text-[#9E9E9E]">
            Los lotes 100% vendidos se retiran automáticamente tras 24 horas
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {batches.map((batch) => {
            const isSoldOut = batch.availableKg <= 0 || batch.status === 'sold_out';
            const freshness = getFreshnessTier(batch.createdAt);
            const publishedTime = formatTimeAgo(batch.createdAt);
            const imageUpdatedTime = formatTimeAgo(batch.imageUpdatedAt || batch.updatedAt || batch.createdAt);
            const purgeCountdown = getRemainingPurgeHours(batch.soldOutAt, batch.autoPurgeHours || 24);

            return (
              <div
                key={batch.id}
                className="bg-[#111714] border border-[#1E2E26] hover:border-[#10B981]/50 rounded-xl p-5 space-y-3 flex flex-col justify-between transition-all shadow-sm"
              >
                <div className="space-y-3">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2 mb-1">
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-[#10B981]/15 text-[#10B981] border border-[#10B981]/40 font-bold uppercase">
                          {batch.batchCode}
                        </span>
                        {isSoldOut ? (
                          <Badge variant="destructive" className="text-[9px]">100% VENDIDO</Badge>
                        ) : (
                          <span className={`text-[9px] font-mono px-1.5 py-0.5 rounded-md border ${freshness.badgeClass}`}>
                            {freshness.label}
                          </span>
                        )}
                      </div>
                      <h4 className="font-display font-bold text-lg text-[#ECFDF5] break-words">
                        {batch.cropName} ({batch.variety})
                      </h4>
                    </div>

                    <div className="text-left sm:text-right font-mono shrink-0">
                      <div className="text-base font-bold text-[#10B981]">
                        ${batch.pricePerKgUsd.toFixed(2)}/Kg
                      </div>
                      <div className={`text-[10px] ${isSoldOut ? 'text-[#EF4444] font-bold' : 'text-[#9E9E9E]'}`}>
                        {batch.availableKg.toLocaleString()} Kg disponibles
                      </div>
                    </div>
                  </div>

                  {/* Freshness timestamp info */}
                  <div className="flex flex-wrap items-center justify-between gap-2 text-[10px] font-mono text-[#9E9E9E] bg-[#090D0B] p-2.5 rounded-lg border border-[#1E2E26]">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3 text-[#10B981]" />
                      Publicado: <strong className="text-[#E5E5E5]">{publishedTime}</strong>
                    </span>
                    <span>Fotos: <strong className="text-[#E5E5E5]">{imageUpdatedTime}</strong></span>
                    <span className="text-[#A78BFA]">
                      {batch.corregimiento}
                    </span>
                  </div>

                  {/* Auto-purge notice if sold out */}
                  {isSoldOut && (
                    <div className="bg-[#EF4444]/10 border border-[#EF4444]/50 rounded-lg p-2.5 text-xs font-mono text-[#FCA5A5] flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-1.5 min-w-0">
                        <AlertCircle className="w-4 h-4 text-[#EF4444] shrink-0" />
                        <div className="min-w-0">
                          <span className="font-bold text-white block text-[11px]">Lote Agotado</span>
                          <span className="text-[10px] text-[#FEF08A] flex items-center gap-1">
                            <Timer className="w-3 h-3 shrink-0" />
                            {purgeCountdown.displayText || 'Autolimpieza en 24 horas'}
                          </span>
                        </div>
                      </div>
                      <Button
                        onClick={() => setBatchToDelete(batch)}
                        size="sm"
                        className="bg-[#EF4444] hover:bg-[#DC2626] text-white text-[10px] min-h-8 h-auto py-1 px-2.5 font-bold shrink-0"
                      >
                        Eliminar Ahora
                      </Button>
                    </div>
                  )}

                  <div className="bg-[#090D0B] p-2.5 rounded-lg border border-[#1E2E26] text-[10px] font-mono space-y-1">
                    <div className="flex flex-wrap justify-between gap-2 text-[#9E9E9E]">
                      <span>Finca:</span>
                      <span className="text-[#E5E5E5] font-bold">{batch.farmName}</span>
                    </div>
                    <div className="flex flex-wrap justify-between gap-2 text-[#9E9E9E]">
                      <span>Código Certificado:</span>
                      <span className="text-[#A78BFA] truncate max-w-[180px]">{batch.rootMerkleHash}</span>
                    </div>
                  </div>
                </div>

                {/* Footer action */}
                <div className="pt-2.5 border-t border-[#1E2E26] flex items-center justify-between">
                  <span className="text-[10px] font-mono text-[#9E9E9E]">
                    Gestión del Productor
                  </span>
                  <button
                    onClick={() => setBatchToDelete(batch)}
                    className="text-xs font-mono text-[#EF4444] hover:text-white hover:bg-[#EF4444] border border-[#EF4444]/40 rounded-lg px-2.5 py-1 transition-all flex items-center gap-1"
                    title="Eliminar este lote de la plataforma"
                  >
                    <Trash2 className="w-3 h-3" />
                    <span>Eliminar Lote</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* New Farm Modal */}
      <Dialog open={isFarmModalOpen} onOpenChange={setIsFarmModalOpen}>
        <DialogCloseButton onClose={() => setIsFarmModalOpen(false)} />
        <DialogHeader>
          <DialogTitle>Registrar Nueva Parcela Agrícola</DialogTitle>
          <DialogDescription>
            Ingresa los datos de la finca para validación catastral y fitosanitaria del MIDA.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleCreateFarm} className="space-y-4 mt-3">
          <div>
            <label className="block text-xs font-mono uppercase text-[#9E9E9E] mb-1 font-bold">
              Nombre de la Finca / Parcela
            </label>
            <Input
              value={farmName}
              onChange={(e) => setFarmName(e.target.value)}
              placeholder="Ej. Finca El Progreso #2"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-mono uppercase text-[#9E9E9E] mb-1 font-bold">
                Corregimiento
              </label>
              <select
                value={corregimiento}
                onChange={(e) => setCorregimiento(e.target.value as any)}
                className="w-full bg-[#090D0B] border border-[#1E2E26] rounded-lg text-[#E5E5E5] text-xs font-mono p-2.5 focus:border-[#10B981] focus:outline-none"
              >
                <option value="Puerto Armuelles">Puerto Armuelles</option>
                <option value="Limones">Limones</option>
                <option value="Progreso">Progreso</option>
                <option value="Baco">Baco</option>
                <option value="Rodolfo Aguilar Delgado">Rodolfo Aguilar Delgado</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-mono uppercase text-[#9E9E9E] mb-1 font-bold">
                Superficie (Ha)
              </label>
              <Input
                type="number"
                step="0.1"
                value={areaHectares}
                onChange={(e) => setAreaHectares(e.target.value)}
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-mono uppercase text-[#9E9E9E] mb-1 font-bold">
              Cultivo Principal
            </label>
            <Input
              value={cropType}
              onChange={(e) => setCropType(e.target.value)}
              placeholder="Ej. Banano Cavendish, Cacao Criollo..."
              required
            />
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="secondary" onClick={() => setIsFarmModalOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit" variant="default">
              Registrar Parcela
            </Button>
          </div>
        </form>
      </Dialog>

      {/* Guided 4-Step Batch Publishing Wizard */}
      <PublishBatchWizardModal
        isOpen={isWizardOpen}
        onClose={() => setIsWizardOpen(false)}
      />

      {/* Delete Batch Confirmation Modal */}
      <DeleteBatchModal
        batch={batchToDelete}
        isOpen={!!batchToDelete}
        onClose={() => setBatchToDelete(null)}
        onConfirmDelete={deleteProductBatch}
      />
    </div>
  );
};
