import React, { useState, useRef } from 'react';
import { 
  ShieldCheck, 
  User as UserIcon, 
  Upload, 
  CheckCircle2, 
  AlertTriangle, 
  Star, 
  Sparkles, 
  Award, 
  Camera,
  Check,
  X
} from 'lucide-react';
import { useAppState } from '@/context/AppStateContext';
import { Dialog, DialogHeader, DialogTitle, DialogDescription, DialogCloseButton } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { calculateReputationTier, checkUsernameAvailability, processAvatarUpload } from '@/services/reputationService';
import { saveDocument, COLLECTIONS } from '@/services/firebase';
import { useNotification } from '@/context/NotificationContext';
import { UserProfile } from '@/types';

interface UserProfileModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const UserProfileModal: React.FC<UserProfileModalProps> = ({ open, onOpenChange }) => {
  const { currentUser, firebaseUser } = useAppState();
  const { success, warning, error } = useNotification();

  const [name, setName] = useState(currentUser.name || '');
  const [username, setUsername] = useState(currentUser.username || '');
  const [phone, setPhone] = useState(currentUser.phone || '+507 6700-0000');
  const [location, setLocation] = useState(currentUser.location || 'Distrito de Barú, Chiriquí');
  const [photoURL, setPhotoURL] = useState(currentUser.photoURL || '');
  const [isCheckingUsername, setIsCheckingUsername] = useState(false);
  const [usernameStatus, setUsernameStatus] = useState<{ available?: boolean; message?: string }>({});
  const [isSaving, setIsSaving] = useState(false);

  // Sync state with currentUser when opened
  React.useEffect(() => {
    if (open) {
      setName(currentUser.name || '');
      setUsername(currentUser.username || '');
      setPhone(currentUser.phone || '+507 6700-0000');
      setLocation(currentUser.location || 'Distrito de Barú, Chiriquí');
      setPhotoURL(currentUser.photoURL || '');
      setUsernameStatus({});
    }
  }, [open, currentUser]);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const tierInfo = calculateReputationTier(
    currentUser.reputationScore || 99.4, 
    currentUser.successfulEscrowTrades || 12
  );

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const base64 = await processAvatarUpload(file);
      setPhotoURL(base64);
      success('Foto de Perfil Cargada', 'La imagen está lista. Guarda los cambios para sincronizar.');
    } catch (err: any) {
      error('Error al Cargar Imagen', err.message || 'Formato no soportado.');
    }
  };

  const handleUsernameBlur = async () => {
    if (!username) return;
    setIsCheckingUsername(true);
    const result = await checkUsernameAvailability(username, currentUser.id);
    setIsCheckingUsername(false);
    setUsernameStatus(result);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      warning('Campo Requerido', 'Debes ingresar un nombre o razón social.');
      return;
    }

    setIsSaving(true);
    try {
      const updatedProfile: UserProfile = {
        ...currentUser,
        name: name.trim(),
        username: username.trim().toLowerCase().replace(/[^a-z0-9_]/g, '') || undefined,
        phone: phone.trim(),
        location: location.trim(),
        photoURL: photoURL || undefined,
        reputationTier: tierInfo.tier,
      };

      await saveDocument(COLLECTIONS.USERS, updatedProfile);
      success('Perfil Actualizado', 'Tus datos y credenciales se han sincronizado en Firestore.');
      onOpenChange(false);
    } catch (err: any) {
      error('Error al Guardar', err.message || 'No se pudo actualizar el perfil.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogCloseButton onClose={() => onOpenChange(false)} />
      <DialogHeader>
        <DialogTitle className="flex items-center gap-2">
          <ShieldCheck className="w-5 h-5 text-[#15803D]" strokeWidth={1.5} />
          Perfil & Credencial Digital de Productor
        </DialogTitle>
        <DialogDescription>
          Personaliza tu identidad y foto de perfil. Tu reputación se incrementa automáticamente con cada exportación y contrato Escrow exitoso.
        </DialogDescription>
      </DialogHeader>

      <form onSubmit={handleSave} className="space-y-4 pt-2 font-mono text-xs">
        {/* Profile Card Header with Dynamic Reputation Aura */}
        <div className="bg-[#0E0E0E] border-2 border-[#15803D] p-4 relative overflow-hidden">
          <div className="flex flex-col sm:flex-row items-center gap-4">
            {/* Avatar with dynamic border */}
            <div className="relative group cursor-pointer" onClick={() => fileInputRef.current?.click()}>
              <div className={`w-20 h-20 bg-[#141414] overflow-hidden flex items-center justify-center transition-all ${tierInfo.avatarBorderClass}`}>
                {photoURL ? (
                  <img src={photoURL} alt={name} className="w-full h-full object-cover" />
                ) : (
                  <UserIcon className="w-10 h-10 text-[#15803D]" />
                )}
              </div>
              <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center transition-opacity text-white text-[9px] font-bold">
                <Camera className="w-4 h-4 mb-0.5 text-[#FACC15]" />
                Cambiar
              </div>
              <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handleAvatarChange} 
                accept="image/*" 
                className="hidden" 
              />
            </div>

            {/* User Title & Dynamic Reputation Level */}
            <div className="text-center sm:text-left flex-1">
              <div className="flex items-center justify-center sm:justify-start gap-2 flex-wrap">
                <span className={`text-base uppercase ${tierInfo.nameGlowClass}`}>
                  {name || 'Productor Barú'}
                </span>
                {username && (
                  <span className="text-[10px] text-[#9E9E9E]">@{username}</span>
                )}
              </div>

              <div className="text-[10px] text-[#15803D] font-bold mt-0.5 flex items-center justify-center sm:justify-start gap-1">
                <Award className="w-3.5 h-3.5 text-[#FACC15]" />
                {tierInfo.label}
              </div>

              {/* Progress bar to next rank */}
              <div className="mt-2 w-full max-w-xs">
                <div className="flex justify-between text-[9px] text-[#666666] mb-1">
                  <span>Nivel de Prestigio</span>
                  <span className="text-[#FACC15] font-bold">{currentUser.reputationScore || 99.4}%</span>
                </div>
                <div className="w-full bg-[#1A1A1A] h-2 border border-[#1E293B]">
                  <div 
                    className="bg-[#15803D] h-full shadow-[0_0_8px_#15803D] transition-all duration-500" 
                    style={{ width: `${tierInfo.levelProgressPct}%` }}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Inputs Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-[10px] uppercase text-[#9E9E9E] mb-1">Nombre Completo / Razón Social *</label>
            <Input 
              value={name} 
              onChange={(e) => setName(e.target.value)} 
              placeholder="Ej: Finca Las Palmas / Don Carlos" 
              required 
            />
          </div>

          <div>
            <label className="block text-[10px] uppercase text-[#9E9E9E] mb-1">Identificador Único (@usuario) *</label>
            <div className="relative">
              <Input 
                value={username} 
                onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
                onBlur={handleUsernameBlur}
                placeholder="ej: carlos_baru_banana" 
              />
              <div className="absolute right-2 top-2.5">
                {isCheckingUsername && <span className="text-[9px] text-[#FACC15] animate-pulse">Verificando...</span>}
                {!isCheckingUsername && usernameStatus.available === true && <Check className="w-4 h-4 text-[#15803D]" />}
                {!isCheckingUsername && usernameStatus.available === false && <X className="w-4 h-4 text-[#F97316]" />}
              </div>
            </div>
            {usernameStatus.message && (
              <div className={`text-[9px] mt-1 ${usernameStatus.available ? 'text-[#15803D]' : 'text-[#F97316]'}`}>
                {usernameStatus.message}
              </div>
            )}
          </div>

          <div>
            <label className="block text-[10px] uppercase text-[#9E9E9E] mb-1">Teléfono / WhatsApp de Contacto</label>
            <Input 
              value={phone} 
              onChange={(e) => setPhone(e.target.value)} 
              placeholder="+507 6000-0000" 
            />
          </div>

          <div>
            <label className="block text-[10px] uppercase text-[#9E9E9E] mb-1">Ubicación / Corregimiento</label>
            <Input 
              value={location} 
              onChange={(e) => setLocation(e.target.value)} 
              placeholder="Progreso, Barú, Chiriquí" 
            />
          </div>
        </div>

        {/* Buttons */}
        <div className="flex justify-end gap-2 pt-2 border-t border-[#1E293B]">
          <Button 
            type="button" 
            variant="outline" 
            onClick={() => onOpenChange(false)}
          >
            Cancelar
          </Button>
          <Button 
            type="submit" 
            variant="default"
            disabled={isSaving}
            className="flex items-center gap-1.5"
          >
            <CheckCircle2 className="w-4 h-4" />
            {isSaving ? 'Sincronizando...' : 'Guardar Credencial'}
          </Button>
        </div>
      </form>
    </Dialog>
  );
};
