import React, { useState, useRef, useEffect } from 'react';
import { 
  ShieldCheck, 
  User as UserIcon, 
  Camera, 
  CheckCircle2, 
  Award, 
  Star, 
  ArrowLeft, 
  Building2, 
  Phone, 
  MapPin, 
  Package, 
  DollarSign, 
  Lock, 
  Check, 
  X, 
  MessageSquare,
  Sparkles
} from 'lucide-react';
import { useAppState } from '@/context/AppStateContext';
import { useLanguage } from '@/context/LanguageContext';
import { useNotification } from '@/context/NotificationContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { calculateReputationTier, checkUsernameAvailability, processAvatarUpload } from '@/services/reputationService';
import { saveDocument, COLLECTIONS } from '@/services/firebase';
import { UserProfile } from '@/types';
import { Spotlight } from '@/components/aceternity/Spotlight';
import { BorderBeam } from '@/components/magicui/BorderBeam';

interface ProfilePageProps {
  onBack: () => void;
}

export const ProfilePage: React.FC<ProfilePageProps> = ({ onBack }) => {
  const { currentUser, orders, batches, updateUserProfile } = useAppState();
  const { language } = useLanguage();
  const { success, warning, error } = useNotification();

  const [name, setName] = useState(currentUser.name || '');
  const [username, setUsername] = useState(currentUser.username || '');
  const [phone, setPhone] = useState(currentUser.phone || '+507 6700-0000');
  const [location, setLocation] = useState(currentUser.location || 'Distrito de Barú, Chiriquí');
  const [bio, setBio] = useState(currentUser.bio || 'Productor certificado de banano y frutas de exportación en Barú.');
  const [photoURL, setPhotoURL] = useState(currentUser.photoURL || '');
  const [isCheckingUsername, setIsCheckingUsername] = useState(false);
  const [usernameStatus, setUsernameStatus] = useState<{ available?: boolean; message?: string }>({});
  const [isSaving, setIsSaving] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const tierInfo = calculateReputationTier(
    currentUser.reputationScore || 99.4, 
    currentUser.successfulEscrowTrades || 12
  );

  useEffect(() => {
    setName(currentUser.name || '');
    setUsername(currentUser.username || '');
    setPhone(currentUser.phone || '+507 6700-0000');
    setLocation(currentUser.location || 'Distrito de Barú, Chiriquí');
    setBio(currentUser.bio || 'Productor certificado de banano y frutas de exportación en Barú.');
    setPhotoURL(currentUser.photoURL || '');
  }, [currentUser]);

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const base64 = await processAvatarUpload(file);
      setPhotoURL(base64);
      success('Foto de Perfil Cargada', 'Guarda los cambios para sincronizar con tu credencial en la nube.');
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
        bio: bio.trim(),
        photoURL: photoURL || undefined,
        reputationTier: tierInfo.tier,
      };

      await updateUserProfile(updatedProfile);
      success('Perfil Actualizado', 'Tus datos, reputación y credenciales están sincronizados en Firestore.');
    } catch (err: any) {
      error('Error al Guardar', err.message || 'No se pudo actualizar el perfil.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-8 py-6 max-w-5xl mx-auto font-mono">
      {/* Top Navigation Bar: Back to Home */}
      <div className="flex items-center justify-between border-b-2 border-[#15803D] pb-4">
        <Button
          onClick={onBack}
          variant="outline"
          className="flex items-center gap-2 text-xs text-[#E5E5E5] hover:text-black hover:bg-[#15803D] border-[#15803D]"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>{language === 'en' ? '← Back to Home / Dashboard' : '← Volver al Inicio del Sitio'}</span>
        </Button>

        <div className="flex items-center gap-2 text-xs">
          <Badge variant="purple" className="flex items-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5" />
            {language === 'en' ? 'Cloud Verified Identity' : 'Identidad Verificada en la Nube'}
          </Badge>
        </div>
      </div>

      {/* Main Profile Showcase Card */}
      <div className="relative overflow-hidden border-2 border-[#15803D] bg-[#0E0E0E] p-6 sm:p-10 shadow-[8px_8px_0px_0px_#15803D]">
        <Spotlight className="-top-20 left-10" fill="#15803D" />
        <BorderBeam size={280} duration={12} delay={0} colorFrom="#15803D" colorTo="#FACC15" />

        <div className="relative z-10 flex flex-col md:flex-row items-center md:items-start gap-8">
          {/* Avatar with Glow Aura & Camera upload */}
          <div className="relative group cursor-pointer" onClick={() => fileInputRef.current?.click()}>
            <div className={`w-32 h-32 bg-[#141414] overflow-hidden flex items-center justify-center transition-all ${tierInfo.avatarBorderClass}`}>
              {photoURL ? (
                <img src={photoURL} alt={name} className="w-full h-full object-cover" />
              ) : (
                <UserIcon className="w-16 h-16 text-[#15803D]" />
              )}
            </div>
            <div className="absolute inset-0 bg-black/70 opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center transition-opacity text-white text-xs font-bold">
              <Camera className="w-6 h-6 mb-1 text-[#FACC15]" />
              Cambiar Foto
            </div>
            <input 
              type="file" 
              ref={fileInputRef} 
              onChange={handleAvatarChange} 
              accept="image/*" 
              className="hidden" 
            />
          </div>

          {/* User Details & Reputation Overview */}
          <div className="flex-1 text-center md:text-left space-y-3">
            <div className="flex flex-wrap items-center justify-center md:justify-start gap-3">
              <h1 className={`text-2xl sm:text-3xl uppercase font-display font-black tracking-tight ${tierInfo.nameGlowClass}`}>
                {name || 'Productor Barú'}
              </h1>
              {username && (
                <span className="text-xs text-[#9E9E9E] bg-[#141414] px-2.5 py-0.5 border border-[#1E293B]">
                  @{username}
                </span>
              )}
            </div>

            <div className="flex flex-wrap items-center justify-center md:justify-start gap-2">
              <Badge variant="yellow" className="text-xs flex items-center gap-1 font-bold">
                <Award className="w-3.5 h-3.5 text-black" />
                {tierInfo.label}
              </Badge>
              <Badge variant="default" className="text-xs">
                REGISTRO MIDA: {currentUser.midaRegistration || 'MIDA-BARU-2026-OK'}
              </Badge>
            </div>

            <p className="text-xs text-[#CCCCCC] font-sans max-w-xl">
              {bio}
            </p>

            {/* Level Bar */}
            <div className="pt-2 max-w-md mx-auto md:mx-0">
              <div className="flex justify-between text-[10px] text-[#9E9E9E] mb-1">
                <span>Puntuación de Prestigio Comercial</span>
                <span className="text-[#FACC15] font-bold">{currentUser.reputationScore || 99.4}% Confianza</span>
              </div>
              <div className="w-full bg-[#1A1A1A] h-2.5 border border-[#1E293B]">
                <div 
                  className="bg-[#15803D] h-full shadow-[0_0_10px_#15803D] transition-all duration-500" 
                  style={{ width: `${tierInfo.levelProgressPct}%` }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Counter Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
        <div className="bg-[#0E0E0E] border-2 border-[#15803D] p-4 shadow-[3px_3px_0px_0px_#15803D]">
          <div className="text-[10px] text-[#666666] uppercase font-bold">Índice Confianza</div>
          <div className="text-2xl font-display font-black text-[#15803D] mt-1">
            {currentUser.reputationScore || 99.4}%
          </div>
          <div className="text-[9px] text-[#15803D]">Calificación 4.95 ⭐</div>
        </div>

        <div className="bg-[#0E0E0E] border-2 border-[#FACC15] p-4 shadow-[3px_3px_0px_0px_#FACC15]">
          <div className="text-[10px] text-[#666666] uppercase font-bold">Contratos Escrow</div>
          <div className="text-2xl font-display font-black text-[#FACC15] mt-1">
            {currentUser.successfulEscrowTrades || 12}
          </div>
          <div className="text-[9px] text-[#9E9E9E]">100% Sin Disputa</div>
        </div>

        <div className="bg-[#0E0E0E] border-2 border-[#7C3AED] p-4 shadow-[3px_3px_0px_0px_#7C3AED]">
          <div className="text-[10px] text-[#666666] uppercase font-bold">Volumen Entregado</div>
          <div className="text-2xl font-display font-black text-[#7C3AED] mt-1">
            {((currentUser.totalKgDelivered || 28400) / 1000).toFixed(1)}k
          </div>
          <div className="text-[9px] text-[#9E9E9E]">Kilogramos Fruta</div>
        </div>

        <div className="bg-[#0E0E0E] border-2 border-[#1E293B] p-4">
          <div className="text-[10px] text-[#666666] uppercase font-bold">Antigüedad Red</div>
          <div className="text-2xl font-display font-black text-[#E5E5E5] mt-1">
            {currentUser.memberSince || '2026'}
          </div>
          <div className="text-[9px] text-[#15803D]">Nodo Barú Activo</div>
        </div>
      </div>

      {/* Edit Form & Badges Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Edit Profile Form */}
        <div className="lg:col-span-2 bg-[#0E0E0E] border-2 border-[#15803D] p-6 space-y-4 shadow-[4px_4px_0px_0px_#15803D]">
          <div className="border-b border-[#1E293B] pb-3">
            <h3 className="text-base font-display font-black text-[#E5E5E5] uppercase">
              {language === 'en' ? 'Edit Profile & Verification Details' : 'Editar Datos de Productor & Contacto'}
            </h3>
            <p className="text-xs text-[#9E9E9E]">
              {language === 'en' ? 'Information visible to international buyers and port inspectors.' : 'Información visible para compradores internacionales e inspectores aduaneros.'}
            </p>
          </div>

          <form onSubmit={handleSave} className="space-y-4 text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] uppercase text-[#9E9E9E] mb-1 font-bold">
                  Nombre Completo / Razón Social *
                </label>
                <Input 
                  value={name} 
                  onChange={(e) => setName(e.target.value)} 
                  placeholder="Ej: Finca Don Dionisio / Dionisio Castillo" 
                  required 
                />
              </div>

              <div>
                <label className="block text-[10px] uppercase text-[#9E9E9E] mb-1 font-bold">
                  Identificador Único (@usuario) *
                </label>
                <div className="relative">
                  <Input 
                    value={username} 
                    onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
                    onBlur={handleUsernameBlur}
                    placeholder="ej: dionisio_baru_banana" 
                  />
                  <div className="absolute right-2.5 top-2.5">
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
                <label className="block text-[10px] uppercase text-[#9E9E9E] mb-1 font-bold">
                  Teléfono / WhatsApp de Ventas
                </label>
                <Input 
                  value={phone} 
                  onChange={(e) => setPhone(e.target.value)} 
                  placeholder="+507 6789-1234" 
                />
              </div>

              <div>
                <label className="block text-[10px] uppercase text-[#9E9E9E] mb-1 font-bold">
                  Ubicación / Corregimiento
                </label>
                <Input 
                  value={location} 
                  onChange={(e) => setLocation(e.target.value)} 
                  placeholder="Puerto Armuelles, Barú, Chiriquí" 
                />
              </div>
            </div>

            <div>
              <label className="block text-[10px] uppercase text-[#9E9E9E] mb-1 font-bold">
                Descripción / Bio de la Producción
              </label>
              <textarea 
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                rows={3}
                className="w-full bg-[#141414] border border-[#1E293B] p-2.5 text-[#E5E5E5] text-xs font-mono focus:border-[#15803D] focus:outline-none"
                placeholder="Detalla tus hectáreas, variedades cultivadas y certificaciones..."
              />
            </div>

            <div className="flex justify-end pt-2">
              <Button 
                type="submit" 
                variant="default"
                disabled={isSaving}
                className="flex items-center gap-2"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>{isSaving ? (language === 'en' ? 'Saving...' : 'Guardando...') : (language === 'en' ? 'Save Changes' : 'Guardar Cambios')}</span>
              </Button>
            </div>
          </form>
        </div>

        {/* Right: Certified Badges & Guarantees */}
        <div className="bg-[#0E0E0E] border-2 border-[#1E293B] p-6 space-y-4">
          <h3 className="text-base font-display font-black text-[#E5E5E5] uppercase border-b border-[#1E293B] pb-3">
            Insignias & Garantías MIDA
          </h3>

          <div className="space-y-2.5">
            {[
              { title: 'Identidad Google Verificada', desc: 'UID universal vinculado a Firestore.', color: '#15803D' },
              { title: 'Sello BPA Barú & MIDA', desc: 'Buenas Prácticas Agrícolas acreditadas.', color: '#15803D' },
              { title: '100% Entregas a Tiempo', desc: 'Sin retrasos en el despacho a puerto.', color: '#FACC15' },
              { title: 'Cero Disputas Escrow', desc: '12 transacciones comerciales sin reclamos.', color: '#7C3AED' },
            ].map((b, i) => (
              <div key={i} className="bg-[#141414] p-3 border border-[#1E293B] space-y-1">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4" style={{ color: b.color }} />
                  <span className="font-bold text-[#E5E5E5] text-xs">{b.title}</span>
                </div>
                <div className="text-[10px] text-[#9E9E9E] pl-6">{b.desc}</div>
              </div>
            ))}
          </div>

          <div className="bg-[#141414] border border-[#7C3AED] p-3 text-[10px] text-[#CCCCCC] space-y-1">
            <div className="text-[#7C3AED] font-bold">SEGURIDAD CRIPTOGRÁFICA:</div>
            <div>Tu reputación es inalterable. Cada exportación añade un bloque validado con tu clave pública.</div>
          </div>
        </div>
      </div>
    </div>
  );
};
