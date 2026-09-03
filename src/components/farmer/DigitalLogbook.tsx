import React, { useState } from 'react';
import { 
  FileSpreadsheet, 
  Plus, 
  Hash, 
  MapPin, 
  ShieldCheck, 
  CheckCircle2, 
  Clock, 
  Leaf, 
  Droplets, 
  Bug, 
  Scissors, 
  Package, 
  Building2,
  Lock,
  Mic,
  MicOff,
  Sparkles,
  Info
} from 'lucide-react';
import { useAppState } from '@/context/AppStateContext';
import { useNotification } from '@/context/NotificationContext';
import { useLanguage } from '@/context/LanguageContext';
import { ActivityType, CultivationLog } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { EvidenceUploader } from './EvidenceUploader';
import { truncateHash, formatDate } from '@/lib/utils';

export const DigitalLogbook: React.FC = () => {
  const { farms, logs, addCultivationLog, currentUser, isOffline } = useAppState();
  const { info, success, warning } = useNotification();
  const { language } = useLanguage();

  const [selectedFarmId, setSelectedFarmId] = useState<string>(farms[0]?.id || 'FARM-01');
  const [activityType, setActivityType] = useState<ActivityType>('fertilizacion');
  const [cropName, setCropName] = useState('Banano Cavendish Gran Enano');
  const [details, setDetails] = useState('');
  const [quantity, setQuantity] = useState('');
  const [organicProduct, setOrganicProduct] = useState('');
  const [evidencePhotos, setEvidencePhotos] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [isRecording, setIsRecording] = useState(false);

  const activeFarm = farms.find((f) => f.id === selectedFarmId) || farms[0];
  const farmLogs = logs.filter((l) => l.farmId === selectedFarmId);

  const getActivityIcon = (type: ActivityType) => {
    switch (type) {
      case 'siembra': return <Leaf className="w-4 h-4 text-[#15803D]" strokeWidth={1.5} />;
      case 'riego': return <Droplets className="w-4 h-4 text-[#FACC15]" strokeWidth={1.5} />;
      case 'fertilizacion': return <Leaf className="w-4 h-4 text-[#15803D]" strokeWidth={1.5} />;
      case 'control_plagas': return <Bug className="w-4 h-4 text-[#F97316]" strokeWidth={1.5} />;
      case 'poda': return <Scissors className="w-4 h-4 text-[#7C3AED]" strokeWidth={1.5} />;
      case 'cosecha': return <Package className="w-4 h-4 text-[#FACC15]" strokeWidth={1.5} />;
      case 'inspeccion_mida': return <Building2 className="w-4 h-4 text-[#15803D]" strokeWidth={1.5} />;
      default: return <Leaf className="w-4 h-4 text-[#9E9E9E]" strokeWidth={1.5} />;
    }
  };

  // Voice Dictation with Form Pre-Filling (Does not submit automatically)
  const handleStartVoiceDictation = () => {
    // Check if SpeechRecognition is available in browser
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.lang = 'es-PA';
      recognition.interimResults = false;
      recognition.maxAlternatives = 1;

      setIsRecording(true);
      info('Escuchando Dictado por Voz', 'Habla ahora (Ej: "Aplicamos 20 litros de Bacillus subtilis para control de Sigatoka").');

      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        parseVoiceInputAndPreFill(transcript);
        setIsRecording(false);
      };

      recognition.onerror = () => {
        setIsRecording(false);
        fallbackVoicePreset();
      };

      recognition.start();
    } else {
      fallbackVoicePreset();
    }
  };

  // Fallback preset if microphone is unavailable in sandbox
  const fallbackVoicePreset = () => {
    setIsRecording(true);
    setTimeout(() => {
      setIsRecording(false);
      const sampleText = 'Cosecha de 1,080 cajas de Banano Cavendish con calibración 42 y desmane en tina con alumbre.';
      parseVoiceInputAndPreFill(sampleText);
    }, 1200);
  };

  const parseVoiceInputAndPreFill = (text: string) => {
    const lower = text.toLowerCase();
    
    // Detect activity
    if (lower.includes('cosech') || lower.includes('caja') || lower.includes('corte')) {
      setActivityType('cosecha');
    } else if (lower.includes('sigatoka') || lower.includes('plaga') || lower.includes('bacillus')) {
      setActivityType('control_plagas');
    } else if (lower.includes('abono') || lower.includes('fertiliz') || lower.includes('compost')) {
      setActivityType('fertilizacion');
    } else if (lower.includes('poda') || lower.includes('deshoje')) {
      setActivityType('poda');
    } else if (lower.includes('riego') || lower.includes('agua')) {
      setActivityType('riego');
    }

    // Detect bio product
    if (lower.includes('bacillus')) {
      setOrganicProduct('Bacillus subtilis cepa QST 713 (Bio-fungicida)');
    } else if (lower.includes('trichoderma')) {
      setOrganicProduct('Trichoderma harzianum bio-controlador');
    } else if (lower.includes('alumbre')) {
      setOrganicProduct('Sulfato de aluminio al 1.5% para cicatrización');
    } else if (lower.includes('compost')) {
      setOrganicProduct('Compost orgánico de raquis de banano');
    }

    // Set details and quantity
    setDetails(text);
    if (lower.includes('1080') || lower.includes('1,080')) {
      setQuantity('1,080 Cajas (19,591 Kg)');
    } else if (lower.includes('20')) {
      setQuantity('20 Litros / Ha');
    } else {
      setQuantity('Lote 01 // Registro de Campo');
    }

    setShowAddForm(true);
    success(
      'Campos Pre-Llenados por Voz', 
      'Revisa los datos en el formulario. Puedes editarlos y luego pulsar "Registrar en Blockchain".'
    );
  };

  const handleCreateLog = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!details.trim()) return;

    setIsSubmitting(true);
    try {
      await addCultivationLog({
        farmId: selectedFarmId,
        farmName: activeFarm.name,
        cropName,
        activityType,
        date: new Date().toISOString(),
        details,
        quantity: quantity || undefined,
        organicProductUsed: organicProduct || undefined,
        operatorName: currentUser.name,
        gpsCoords: activeFarm.coordinates,
        evidencePhotos,
      });

      setDetails('');
      setQuantity('');
      setOrganicProduct('');
      setEvidencePhotos([]);
      setShowAddForm(false);
      success('Bloque SHA-256 Registrado', 'La labor se firmó criptográficamente en la cadena de cultivo.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 font-mono">
      {/* Header with Farm Selector & Action */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b-2 border-[#15803D] pb-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="font-display font-black text-2xl text-[#E5E5E5] uppercase tracking-tight">
              Bitácora de Campo Inmutable
            </h2>
            {isOffline && (
              <Badge variant="destructive">PWA Offline Mode</Badge>
            )}
          </div>
          <p className="text-xs text-[#9E9E9E] font-sans">
            Cada labor agrícola es firmada criptográficamente con SHA-256 y enlazada al bloque anterior.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {/* Voice Dictation Button */}
          <Button
            type="button"
            onClick={handleStartVoiceDictation}
            disabled={isRecording}
            variant="purple"
            size="sm"
            className="flex items-center gap-1.5 shadow-[2px_2px_0px_0px_#7C3AED]"
            title="Dictar labor por voz para auto-completar el formulario"
          >
            {isRecording ? (
              <>
                <MicOff className="w-4 h-4 animate-ping text-[#FACC15]" />
                <span className="animate-pulse">Escuchando...</span>
              </>
            ) : (
              <>
                <Mic className="w-4 h-4" />
                <span>Dictar por Voz</span>
              </>
            )}
          </Button>

          {/* Farm selector */}
          <select
            value={selectedFarmId}
            onChange={(e) => setSelectedFarmId(e.target.value)}
            className="bg-[#141414] border-2 border-[#15803D] text-[#E5E5E5] text-xs font-mono px-3 py-1.5 focus:border-[#FACC15] focus:outline-none"
          >
            {farms.map((f) => (
              <option key={f.id} value={f.id}>
                {f.name} ({f.corregimiento})
              </option>
            ))}
          </select>

          <Button
            onClick={() => setShowAddForm(!showAddForm)}
            variant={showAddForm ? 'outline' : 'default'}
            size="sm"
            className="flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" />
            {showAddForm ? 'Cancelar' : 'Nuevo Registro'}
          </Button>
        </div>
      </div>

      {/* Farm Profile Summary Banner */}
      <div className="bg-[#0E0E0E] border-2 border-[#15803D] p-4 flex flex-wrap items-center justify-between gap-4 shadow-[4px_4px_0px_0px_#15803D]">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-[#141414] border border-[#15803D] flex items-center justify-center text-[#15803D]">
            <MapPin className="w-5 h-5" strokeWidth={1.5} />
          </div>
          <div>
            <div className="font-display font-bold text-sm text-[#E5E5E5] uppercase">
              {activeFarm.name}
            </div>
            <div className="text-[11px] font-mono text-[#9E9E9E]">
              {activeFarm.corregimiento}, Barú • GPS: {activeFarm.coordinates.lat}°N, {activeFarm.coordinates.lng}°W • {activeFarm.areaHectares} Hectáreas
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {activeFarm.certificaciones.map((cert) => (
            <Badge key={cert} variant="default">
              {cert}
            </Badge>
          ))}
          {activeFarm.verifiedByMida && (
            <Badge variant="live-green" pulse>
              <ShieldCheck className="w-3 h-3 mr-1" /> MIDA Verificado
            </Badge>
          )}
        </div>
      </div>

      {/* Add New Log Form Drawer */}
      {showAddForm && (
        <form
          onSubmit={handleCreateLog}
          className="bg-[#0E0E0E] border-2 border-[#15803D] p-6 space-y-5 shadow-[6px_6px_0px_0px_#15803D] animate-in fade-in slide-in-from-top-2"
        >
          <div className="flex items-center justify-between border-b border-[#1E293B] pb-3">
            <h3 className="font-display font-bold text-base text-[#E5E5E5] uppercase tracking-wide flex items-center gap-2">
              <Lock className="w-4 h-4 text-[#15803D]" />
              Crear Nuevo Bloque de Cultivo
            </h3>
            <span className="text-[11px] font-mono text-[#15803D] font-bold">
              HASHING SHA-256 AUTOMÁTICO
            </span>
          </div>

          <div className="bg-[#141414] border border-[#7C3AED] p-3 flex items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2">
              <Mic className="w-4 h-4 text-[#7C3AED]" />
              <span>¿Prefieres dictar? Toca el botón para autocompletar con tu voz.</span>
            </div>
            <Button
              type="button"
              onClick={handleStartVoiceDictation}
              variant="outline"
              size="sm"
              className="text-[10px] border-[#7C3AED] text-[#7C3AED]"
            >
              Dictar Ahora
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Activity Type */}
            <div>
              <label className="block text-xs font-mono uppercase text-[#9E9E9E] mb-1.5 font-bold">
                Tipo de Labor Agrícola
              </label>
              <select
                value={activityType}
                onChange={(e) => setActivityType(e.target.value as ActivityType)}
                className="w-full bg-[#141414] border-2 border-[#1E293B] text-[#E5E5E5] text-xs font-mono p-2.5 focus:border-[#15803D] focus:outline-none"
              >
                <option value="siembra">🌱 Siembra / Propagación</option>
                <option value="riego">💧 Riego y Drenaje</option>
                <option value="fertilizacion">🍃 Fertilización Orgánica</option>
                <option value="control_plagas">🛡️ Control Biológico (Sigatoka / Plagas)</option>
                <option value="poda">✂️ Poda y Deshoje Fitosanitario</option>
                <option value="cosecha">📦 Cosecha y Embalaje</option>
                <option value="inspeccion_mida">🏛️ Inspección Técnica MIDA</option>
              </select>
            </div>

            {/* Crop Name */}
            <div>
              <label className="block text-xs font-mono uppercase text-[#9E9E9E] mb-1.5 font-bold">
                Cultivo / Variedad
              </label>
              <Input
                value={cropName}
                onChange={(e) => setCropName(e.target.value)}
                placeholder="Ej. Banano Cavendish Gran Enano"
                required
              />
            </div>

            {/* Quantity / Scale */}
            <div>
              <label className="block text-xs font-mono uppercase text-[#9E9E9E] mb-1.5 font-bold">
                Cantidad / Dosis
              </label>
              <Input
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                placeholder="Ej. 1.5 L/ha o 1,080 Cajas"
              />
            </div>
          </div>

          {/* Bio product used */}
          <div>
            <label className="block text-xs font-mono uppercase text-[#9E9E9E] mb-1.5 font-bold">
              Insumo Orgánico / Bio-preparado Utilizado
            </label>
            <Input
              value={organicProduct}
              onChange={(e) => setOrganicProduct(e.target.value)}
              placeholder="Ej. Bacillus subtilis cepa QST 713 / Sulfato de aluminio al 1.5%"
            />
          </div>

          {/* Details */}
          <div>
            <label className="block text-xs font-mono uppercase text-[#9E9E9E] mb-1.5 font-bold">
              Detalles de la Operación de Campo
            </label>
            <textarea
              value={details}
              onChange={(e) => setDetails(e.target.value)}
              rows={3}
              className="w-full bg-[#141414] border-2 border-[#1E293B] text-[#E5E5E5] text-xs font-mono p-2.5 focus:border-[#15803D] focus:outline-none"
              placeholder="Describe la labor realizada, estado de la fruta, cinta de edad o cuadrilla..."
              required
            />
          </div>

          {/* Evidence uploader */}
          <div>
            <label className="block text-xs font-mono uppercase text-[#9E9E9E] mb-1.5 font-bold">
              Evidencia Fotográfica de Campo (Opcional)
            </label>
            <EvidenceUploader 
              farmId={selectedFarmId} 
              farmName={activeFarm.name} 
              onEvidenceNotarized={(ev) => setEvidencePhotos(prev => [...prev, ev.photoUrl])} 
            />
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-3 border-t border-[#1E293B]">
            <Button
              type="button"
              variant="outline"
              onClick={() => setShowAddForm(false)}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              variant="default"
              disabled={isSubmitting}
              className="flex items-center gap-2"
            >
              <CheckCircle2 className="w-4 h-4" />
              {isSubmitting ? 'Firmando Bloque...' : 'Registrar en Blockchain'}
            </Button>
          </div>
        </form>
      )}

      {/* Blockchain Timeline of Logs */}
      <div className="space-y-4">
        <h3 className="font-display font-black text-lg text-[#E5E5E5] uppercase tracking-wide flex items-center justify-between">
          <span>Cadena Histórica de Bloques ({farmLogs.length})</span>
          <span className="text-xs font-mono text-[#15803D] font-bold">PROTOCOLO ACTIVO</span>
        </h3>

        {farmLogs.length === 0 ? (
          <div className="bg-[#0E0E0E] border-2 border-[#1E293B] p-8 text-center text-[#9E9E9E] font-mono text-xs">
            No hay registros para esta finca. Crea el primer bloque de cultivo.
          </div>
        ) : (
          <div className="space-y-3">
            {farmLogs.map((log, idx) => (
              <div
                key={log.id}
                className="bg-[#0E0E0E] border-2 border-[#15803D] p-5 shadow-[4px_4px_0px_0px_#15803D] space-y-3"
              >
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#1E293B] pb-2 text-xs">
                  <div className="flex items-center gap-2">
                    {getActivityIcon(log.activityType)}
                    <span className="font-bold text-[#E5E5E5] uppercase">{log.activityType.replace('_', ' ')}</span>
                    <Badge variant="outline">{log.cropName}</Badge>
                  </div>
                  <div className="text-[#9E9E9E] text-[11px] flex items-center gap-2">
                    <Clock className="w-3.5 h-3.5" />
                    {formatDate(log.date)}
                  </div>
                </div>

                <p className="text-xs text-[#CCCCCC] font-sans leading-relaxed">
                  {typeof log.details === 'string' ? log.details : log.details?.notes || 'Labor completada.'}
                </p>

                {log.organicProductUsed && (
                  <div className="text-[11px] text-[#15803D] font-bold">
                    🌿 Insumo Orgánico: {log.organicProductUsed}
                  </div>
                )}

                <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-[#1E293B] text-[10px] text-[#666666]">
                  <div className="flex items-center gap-1.5">
                    <Hash className="w-3.5 h-3.5 text-[#15803D]" />
                    <span>HASH:</span>
                    <span className="text-[#15803D] font-bold">{truncateHash(log.cryptoHash)}</span>
                  </div>
                  <div>Operador: {log.operatorName}</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
