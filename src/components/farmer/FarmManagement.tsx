import React, { useState } from 'react';
import { MapPin, Plus, QrCode } from 'lucide-react';
import { useAppState } from '@/context/AppStateContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogHeader, DialogTitle, DialogDescription, DialogCloseButton } from '@/components/ui/dialog';
import { BaruCorregimiento } from '@/types';

export const FarmManagement: React.FC = () => {
  const { farms, batches, createBatchFromLogs } = useAppState();

  const [isFarmModalOpen, setIsFarmModalOpen] = useState(false);
  const [isBatchModalOpen, setIsBatchModalOpen] = useState(false);
  const [selectedFarmId, setSelectedFarmId] = useState<string>(farms[0]?.id || '');

  // Form states - Farm
  const [farmName, setFarmName] = useState('');
  const [corregimiento, setCorregimiento] = useState<BaruCorregimiento>('Puerto Armuelles');
  const [areaHectares, setAreaHectares] = useState('5.0');
  const [cropType, setCropType] = useState('Banano Cavendish');

  // Form states - Batch
  const [batchCrop, setBatchCrop] = useState('Banano Cavendish');
  const [batchVariety, setBatchVariety] = useState('Gran Enano');
  const [batchQuantity, setBatchQuantity] = useState('3500');
  const [batchPrice, setBatchPrice] = useState('0.95');
  const [batchDescription, setBatchDescription] = useState('Cosecha de banano de exportación libre de pesticidas sintéticos.');

  const handleCreateFarm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!farmName.trim()) return;

    alert(`Finca "${farmName}" registrada y enviada para verificación catastral MIDA.`);
    setIsFarmModalOpen(false);
    setFarmName('');
  };

  const handleCreateBatch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFarmId) return;

    await createBatchFromLogs({
      farmId: selectedFarmId,
      cropName: batchCrop,
      variety: batchVariety,
      quantityKg: Number(batchQuantity),
      pricePerKgUsd: Number(batchPrice),
      description: batchDescription,
      qualityGrade: 'Premium Exportación',
      certifications: ['GlobalGAP Compliant', 'MIDA Buenas Prácticas'],
    });

    setIsBatchModalOpen(false);
  };

  return (
    <div className="space-y-6">
      {/* Header Actions */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b-2 border-[#15803D] pb-4">
        <div>
          <h2 className="font-display font-black text-2xl text-[#E5E5E5] uppercase tracking-tight">
            Gestión de Parcelas & Empaque de Lotes
          </h2>
          <p className="text-xs text-[#9E9E9E] font-sans">
            Registra fincas con coordenadas GPS y empaqueta lotes cosechados con raíz de Merkle para exportación directa.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            onClick={() => setIsFarmModalOpen(true)}
            variant="secondary"
            size="sm"
            className="flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4 text-[#15803D]" strokeWidth={1.5} />
            Nueva Parcela
          </Button>

          <Button
            onClick={() => setIsBatchModalOpen(true)}
            variant="default"
            size="sm"
            className="flex items-center gap-1.5"
          >
            <QrCode className="w-4 h-4 text-black" strokeWidth={1.5} />
            Empaquetar Lote con QR
          </Button>
        </div>
      </div>

      {/* Farms List */}
      <div className="space-y-4">
        <h3 className="font-display font-bold text-base text-[#E5E5E5] uppercase tracking-wide">
          Parcelas Registradas ({farms.length})
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {farms.map((farm) => (
            <div
              key={farm.id}
              className="bg-[#121212] border-2 border-[#15803D] p-5 space-y-3 shadow-[4px_4px_0px_0px_#15803D] hover:border-[#FACC15] transition-all"
            >
              <div className="flex items-start justify-between">
                <div>
                  <Badge variant="default" className="text-[10px]">
                    {farm.primaryCrops.join(', ')}
                  </Badge>
                  <h4 className="font-display font-black text-lg text-[#E5E5E5] uppercase mt-1">
                    {farm.name}
                  </h4>
                  <div className="text-xs font-mono text-[#9E9E9E]">
                    Titular: <strong className="text-[#E5E5E5]">{farm.ownerName}</strong>
                  </div>
                </div>

                <div className="text-right font-mono text-xs text-[#15803D]">
                  <div className="font-bold">{farm.areaHectares} Ha</div>
                  <div className="text-[10px] text-[#666666]">MIDA OK</div>
                </div>
              </div>

              <div className="bg-[#0E0E0E] border border-[#1E293B] p-3 text-xs font-mono space-y-1 text-[#9E9E9E]">
                <div className="flex justify-between">
                  <span className="flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-[#15803D]" strokeWidth={1.5} /> Corregimiento:
                  </span>
                  <span className="text-[#FACC15] font-bold">{farm.corregimiento}</span>
                </div>
                <div className="flex justify-between">
                  <span>Registro MIDA:</span>
                  <span className="text-[#E5E5E5]">{farm.registrationNumber}</span>
                </div>
                <div className="flex justify-between">
                  <span>GPS Finca:</span>
                  <span className="text-[#7C3AED]">{farm.coordinates.lat}°N, {farm.coordinates.lng}°W</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Batches Packaged */}
      <div className="space-y-4 pt-4 border-t border-[#1E293B]">
        <h3 className="font-display font-bold text-base text-[#E5E5E5] uppercase tracking-wide">
          Lotes Criptográficos Empaquetados ({batches.length})
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {batches.map((batch) => (
            <div
              key={batch.id}
              className="bg-[#121212] border-2 border-[#15803D] p-5 space-y-3 shadow-[4px_4px_0px_0px_#7C3AED]"
            >
              <div className="flex items-start justify-between">
                <div>
                  <span className="text-[10px] font-mono px-2 py-0.5 bg-[#15803D]/15 text-[#15803D] border border-[#15803D] font-bold uppercase">
                    {batch.batchCode}
                  </span>
                  <h4 className="font-display font-black text-lg text-[#E5E5E5] uppercase mt-1">
                    {batch.cropName} ({batch.variety})
                  </h4>
                </div>

                <div className="text-right font-mono">
                  <div className="text-base font-bold text-[#15803D]">
                    ${batch.pricePerKgUsd.toFixed(2)}/Kg
                  </div>
                  <div className="text-[10px] text-[#9E9E9E]">{batch.availableKg} Kg disponibles</div>
                </div>
              </div>

              <div className="bg-[#0E0E0E] p-2.5 border border-[#1E293B] text-[10px] font-mono space-y-1">
                <div className="flex justify-between text-[#9E9E9E]">
                  <span>Finca:</span>
                  <span className="text-[#E5E5E5] font-bold">{batch.farmName} ({batch.corregimiento})</span>
                </div>
                <div className="flex justify-between text-[#9E9E9E]">
                  <span>Raíz Merkle SHA-256:</span>
                  <span className="text-[#7C3AED] truncate max-w-[200px]">{batch.rootMerkleHash}</span>
                </div>
              </div>
            </div>
          ))}
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
                className="w-full bg-[#0A0A0A] border-2 border-[#1E293B] text-[#E5E5E5] text-xs font-mono p-2.5 focus:border-[#15803D] focus:outline-none"
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

      {/* New Batch Modal */}
      <Dialog open={isBatchModalOpen} onOpenChange={setIsBatchModalOpen}>
        <DialogCloseButton onClose={() => setIsBatchModalOpen(false)} />
        <DialogHeader>
          <DialogTitle>Empaquetar y Sellar Lote Cosechado</DialogTitle>
          <DialogDescription>
            Calcula automáticamente el Árbol de Merkle de las labores registradas y publica en el Marketplace.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleCreateBatch} className="space-y-4 mt-3">
          <div>
            <label className="block text-xs font-mono uppercase text-[#9E9E9E] mb-1 font-bold">
              Finca de Origen
            </label>
            <select
              value={selectedFarmId}
              onChange={(e) => setSelectedFarmId(e.target.value)}
              className="w-full bg-[#0A0A0A] border-2 border-[#1E293B] text-[#E5E5E5] text-xs font-mono p-2.5 focus:border-[#15803D] focus:outline-none"
            >
              {farms.map((f) => (
                <option key={f.id} value={f.id}>
                  {f.name} ({f.corregimiento}) - {f.primaryCrops.join(', ')}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-mono uppercase text-[#9E9E9E] mb-1 font-bold">
                Cultivo
              </label>
              <Input
                value={batchCrop}
                onChange={(e) => setBatchCrop(e.target.value)}
                required
              />
            </div>
            <div>
              <label className="block text-xs font-mono uppercase text-[#9E9E9E] mb-1 font-bold">
                Variedad
              </label>
              <Input
                value={batchVariety}
                onChange={(e) => setBatchVariety(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-mono uppercase text-[#9E9E9E] mb-1 font-bold">
                Cantidad (Kg)
              </label>
              <Input
                type="number"
                value={batchQuantity}
                onChange={(e) => setBatchQuantity(e.target.value)}
                required
              />
            </div>
            <div>
              <label className="block text-xs font-mono uppercase text-[#9E9E9E] mb-1 font-bold">
                Precio / Kg (USD)
              </label>
              <Input
                type="number"
                step="0.05"
                value={batchPrice}
                onChange={(e) => setBatchPrice(e.target.value)}
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-mono uppercase text-[#9E9E9E] mb-1 font-bold">
              Descripción del Lote
            </label>
            <textarea
              rows={2}
              value={batchDescription}
              onChange={(e) => setBatchDescription(e.target.value)}
              className="w-full bg-[#0A0A0A] border-2 border-[#1E293B] p-2.5 text-xs text-[#E5E5E5] font-mono focus:border-[#15803D] focus:outline-none"
            />
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="secondary" onClick={() => setIsBatchModalOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit" variant="default">
              Firmar Lote & Generar QR
            </Button>
          </div>
        </form>
      </Dialog>
    </div>
  );
};
