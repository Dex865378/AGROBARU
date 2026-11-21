import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  ArrowLeft,
  Award,
  Camera,
  Check,
  CheckCircle2,
  CreditCard,
  Edit3,
  Image as ImageIcon,
  LayoutDashboard,
  MapPin,
  MessageSquare,
  Package,
  Phone,
  BarChart3,
  Eye,
  Heart,
  Settings2,
  ShieldCheck,
  Star,
  X,
} from 'lucide-react';
import { useAppState } from '@/context/AppStateContext';
import { useLanguage } from '@/context/LanguageContext';
import { useNotification } from '@/context/NotificationContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { SafeImage } from '@/components/ui/SafeImage';
import { ProfileBanner } from '@/components/profile/ProfileBanner';
import { UserSettingsPanel } from '@/components/profile/UserSettingsPanel';
import { processAvatarUpload, calculateReputationTier, checkUsernameAvailability } from '@/services/reputationService';
import {
  getReviewsForProducer,
  mergeReviews,
  onReviewsUpdated,
  StoredReview,
  subscribeReviewsForProducer,
} from '@/services/reviewsService';
import { optimizeBanner } from '@/lib/imageOptimizer';
import { formatUsd } from '@/lib/utils';
import { getTotalBatchViews } from '@/services/analyticsService';
import { UserProfile, OrderReview } from '@/types';

interface ProfilePageProps {
  onBack: () => void;
}

type ProfileTab = 'RESUMEN' | 'EDITAR' | 'RESENAS' | 'PRODUCTOS' | 'AJUSTES';

export const ProfilePage: React.FC<ProfilePageProps> = ({ onBack }) => {
  const { currentUser, orders, batches, updateUserProfile, favorites } = useAppState();
  const { language } = useLanguage();
  const { success, warning, error } = useNotification();

  const isProducerRole =
    currentUser.role === 'farmer' || currentUser.role === 'cooperative';
  const defaultBio = isProducerRole
    ? 'Productor certificado de banano y frutas de exportación en Barú.'
    : 'Comprador verificable de cosechas frescas de Barú, con pagos protegidos en custodia Escrow.';

  const [activeTab, setActiveTab] = useState<ProfileTab>('RESUMEN');
  const [name, setName] = useState(currentUser.name || '');
  const [username, setUsername] = useState(currentUser.username || '');
  const [phone, setPhone] = useState(currentUser.phone || '+507 6700-0000');
  const [location, setLocation] = useState(currentUser.location || 'Distrito de Barú, Chiriquí');
  const [bio, setBio] = useState(currentUser.bio || defaultBio);
  const [photoURL, setPhotoURL] = useState(currentUser.photoURL || '');
  const [bannerURL, setBannerURL] = useState(currentUser.bannerURL || '');
  const [isCheckingUsername, setIsCheckingUsername] = useState(false);
  const [usernameStatus, setUsernameStatus] = useState<{ available?: boolean; message?: string }>({});
  const [isSaving, setIsSaving] = useState(false);
  const [localReviews, setLocalReviews] = useState<StoredReview[]>(() =>
    getReviewsForProducer(currentUser.id, currentUser.name),
  );
  const [remoteReviews, setRemoteReviews] = useState<StoredReview[]>([]);

  const avatarInputRef = useRef<HTMLInputElement>(null);
  const bannerInputRef = useRef<HTMLInputElement>(null);

  const tierInfo = calculateReputationTier(
    currentUser.reputationScore || 99.4,
    currentUser.successfulEscrowTrades || 12,
  );

  useEffect(() => {
    setName(currentUser.name || '');
    setUsername(currentUser.username || '');
    setPhone(currentUser.phone || '+507 6700-0000');
    setLocation(currentUser.location || 'Distrito de Barú, Chiriquí');
    setBio(currentUser.bio || defaultBio);
    setPhotoURL(currentUser.photoURL || '');
    setBannerURL(currentUser.bannerURL || '');
  }, [currentUser]);

  useEffect(() => {
    const refresh = () => setLocalReviews(getReviewsForProducer(currentUser.id, currentUser.name));
    refresh();
    const unsubscribeLocal = onReviewsUpdated(refresh);
    const unsubscribeRemote = subscribeReviewsForProducer(
      currentUser.id,
      currentUser.name,
      setRemoteReviews,
    );
    return () => {
      unsubscribeLocal();
      unsubscribeRemote();
    };
  }, [currentUser.id, currentUser.name]);

  const reviews = mergeReviews(remoteReviews, localReviews);

  const myBatches = useMemo(
    () =>
      batches.filter(
        (batch) =>
          batch.farmId === currentUser.id ||
          batch.producerName.trim().toLowerCase() === currentUser.name.trim().toLowerCase(),
      ),
    [batches, currentUser.id, currentUser.name],
  );

  const totalSalesUsd = useMemo(
    () =>
      orders
        .filter((order) => order.farmerName === currentUser.name || order.farmerId === currentUser.id)
        .reduce((sum, order) => sum + order.totalUsd, 0),
    [orders, currentUser.id, currentUser.name],
  );

  const isProducer = isProducerRole;
  const myOrders = useMemo(
    () =>
      orders.filter(
        (order) =>
          order.buyerId === currentUser.id ||
          order.buyerName.trim().toLowerCase() === currentUser.name.trim().toLowerCase() ||
          order.farmerId === currentUser.id ||
          order.farmerName.trim().toLowerCase() === currentUser.name.trim().toLowerCase(),
      ),
    [orders, currentUser.id, currentUser.name],
  );
  const purchasedKg = myOrders.reduce((sum, order) => sum + order.quantityKg, 0);
  const purchasedUsd = myOrders.reduce((sum, order) => sum + order.totalUsd, 0);
  const totalBatchViews = useMemo(
    () => getTotalBatchViews(myBatches.map((batch) => batch.id)),
    [myBatches],
  );
  const favoriteBatchCount = useMemo(
    () => myBatches.filter((batch) => favorites.includes(batch.id)).length,
    [favorites, myBatches],
  );

  const roleLabel =
    currentUser.role === 'farmer'
      ? 'Productor Agrícola'
      : currentUser.role === 'buyer'
        ? 'Comprador / Consumidor'
        : currentUser.role === 'cooperative'
          ? 'Cooperativa / MIDA'
          : 'Auditor';

  const handleAvatarChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const preview = URL.createObjectURL(file);
    setPhotoURL(preview);
    // La vista previa aparece al instante; la compresión termina en segundo plano.
    processAvatarUpload(file)
      .then(async (optimized) => {
        setPhotoURL((current) => (current === preview ? optimized : current));
        await updateUserProfile({ photoURL: optimized });
      })
      .catch((err: Error) => error('Imagen no válida', err.message))
      .finally(() => URL.revokeObjectURL(preview));
    event.target.value = '';
  };

  const handleBannerChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const preview = URL.createObjectURL(file);
    setBannerURL(preview);
    optimizeBanner(file)
      .then(async (optimized) => {
        setBannerURL((current) => (current === preview ? optimized.dataUrl : current));
        await updateUserProfile({ bannerURL: optimized.dataUrl });
      })
      .catch((err: Error) => warning('Banner no válido', err.message))
      .finally(() => URL.revokeObjectURL(preview));
    event.target.value = '';
  };

  const handleUsernameBlur = async () => {
    if (!username) return;
    setIsCheckingUsername(true);
    const result = await checkUsernameAvailability(username, currentUser.id);
    setIsCheckingUsername(false);
    setUsernameStatus(result);
  };

  const handleSave = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!name.trim()) {
      warning('Campo requerido', 'Debes ingresar un nombre o razón social.');
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
        bannerURL: bannerURL || undefined,
        reputationTier: tierInfo.tier,
      };

      await updateUserProfile(updatedProfile);
      success('Perfil actualizado', 'Tus datos, banner y credenciales se sincronizaron.');
    } catch (err: any) {
      error('Error al guardar', err.message || 'No se pudo actualizar el perfil.');
    } finally {
      setIsSaving(false);
    }
  };

  const averageReview =
    reviews.length > 0
      ? Math.round((reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length) * 10) / 10
      : 4.9;

  return (
    <div className="space-y-4 py-4 sm:py-6 max-w-5xl mx-auto font-mono">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <Button
          onClick={onBack}
          variant="outline"
          className="flex items-center gap-2 text-xs text-[#E5E5E5] hover:text-black hover:bg-[#15803D] border-[#15803D]"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>{language === 'en' ? 'Back' : 'Volver al inicio'}</span>
        </Button>
        <Badge variant="purple" className="flex items-center gap-1 text-[9px]">
          <ShieldCheck className="w-3 h-3" />
          {language === 'en' ? 'Cloud verified identity' : 'Identidad verificada'}
        </Badge>
      </div>

      {/* Tarjeta de identidad compacta con banner largo */}
      <div className="relative overflow-hidden border-2 border-[#15803D] bg-[#0E0E0E] shadow-[4px_4px_0px_0px_#15803D]">
        <ProfileBanner src={bannerURL} alt={`Portada de ${name}`}>
          <div className="pointer-events-none absolute inset-0 z-20 bg-gradient-to-t from-[#0E0E0E] via-black/15 to-transparent" />
          <button
            type="button"
            onClick={() => bannerInputRef.current?.click()}
            className="absolute right-2.5 top-2.5 z-30 flex items-center gap-1 border border-white/25 bg-black/55 px-2 py-1 text-[9px] font-bold text-white hover:border-[#FACC15] hover:text-[#FACC15]"
            title="Subir banner estático o animado (GIF)"
          >
            <ImageIcon className="w-3 h-3" />
            Cambiar banner
          </button>
          <input
            ref={bannerInputRef}
            type="file"
            accept="image/*"
            onChange={handleBannerChange}
            className="hidden"
          />
        </ProfileBanner>

        <div className="px-4 pb-4">
          <div className="relative z-30 -mt-10 sm:-mt-12 flex flex-wrap items-end gap-3">
            <button
              type="button"
              onClick={() => avatarInputRef.current?.click()}
              className={`relative w-20 h-20 sm:w-24 sm:h-24 shrink-0 overflow-hidden bg-[#141414] group ${tierInfo.avatarBorderClass}`}
              title="Cambiar foto de perfil"
            >
              <SafeImage
                src={photoURL}
                alt={name}
                fallbackType="avatar"
                nameHint={name}
                className="w-full h-full object-cover"
              />
              <span className="absolute inset-0 bg-black/65 opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center text-[8px] text-white font-bold transition-opacity">
                <Camera className="w-4 h-4 mb-0.5 text-[#FACC15]" />
                Cambiar
              </span>
            </button>
            <input
              ref={avatarInputRef}
              type="file"
              accept="image/*"
              onChange={handleAvatarChange}
              className="hidden"
            />

            <div className="min-w-0 flex-1 pb-0.5 bg-[#0E0E0E]/80 sm:bg-transparent backdrop-blur-[2px] sm:backdrop-blur-none rounded px-1.5 py-0.5">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className={`text-xl sm:text-2xl uppercase font-display font-bold leading-tight tracking-normal ${tierInfo.nameGlowClass}`}>
                  {name || 'Productor Barú'}
                </h1>
                {username && (
                  <span className="text-[10px] text-[#9E9E9E] bg-[#141414] px-2 py-0.5 border border-[#1E293B]">
                    @{username}
                  </span>
                )}
              </div>
              <div className="mt-1 flex flex-wrap items-center gap-1.5">
                <Badge variant="yellow" className="text-[9px] flex items-center gap-1 font-bold">
                  <Award className="w-3 h-3 text-black" />
                  {isProducer ? tierInfo.label.split('//')[0] : 'COMPRADOR ESCROW'}
                </Badge>
                <Badge variant="default" className="text-[9px]">
                  {roleLabel}
                </Badge>
                <span className="text-[9px] text-[#9E9E9E] flex items-center gap-1">
                  <MapPin className="w-3 h-3 text-[#15803D]" />
                  {location}
                </span>
              </div>
            </div>
          </div>

          {/* Métricas compactas */}
          <div className="grid grid-cols-4 gap-1.5 sm:gap-2 mt-3 text-center">
            <div className="bg-[#141414] border border-[#1E293B] px-1 py-2">
              <div className="text-[8px] text-[#666666] uppercase">Confianza</div>
              <div className="text-sm font-display font-black text-[#15803D]">{currentUser.reputationScore || 99.4}%</div>
            </div>
            <div className="bg-[#141414] border border-[#1E293B] px-1 py-2">
              <div className="text-[8px] text-[#666666] uppercase">Escrow</div>
              <div className="text-sm font-display font-black text-[#FACC15]">
                {isProducer ? currentUser.successfulEscrowTrades || 12 : myOrders.length}
              </div>
            </div>
            <div className="bg-[#141414] border border-[#1E293B] px-1 py-2">
              <div className="text-[8px] text-[#666666] uppercase">Volumen</div>
              <div className="text-sm font-display font-black text-[#7C3AED]">
                {isProducer
                  ? `${((currentUser.totalKgDelivered || 28400) / 1000).toFixed(1)}k`
                  : `${(purchasedKg / 1000).toFixed(1)}k`}
              </div>
            </div>
            <div className="bg-[#141414] border border-[#1E293B] px-1 py-2">
              <div className="text-[8px] text-[#666666] uppercase">Desde</div>
              <div className="text-sm font-display font-black text-[#E5E5E5]">{currentUser.memberSince || '2026'}</div>
            </div>
          </div>

          {isProducer && (
            <div className="mt-2 grid grid-cols-3 gap-1.5 text-center">
              <div className="bg-[#0E1A13] border border-[#15803D]/30 px-1 py-2">
                <Eye className="w-3 h-3 mx-auto text-[#10B981]" />
                <div className="mt-0.5 text-sm font-display font-black text-[#10B981]">{totalBatchViews}</div>
                <div className="text-[7px] text-[#9E9E9E] uppercase">Vistas</div>
              </div>
              <div className="bg-[#141414] border border-[#1E293B] px-1 py-2">
                <Heart className="w-3 h-3 mx-auto text-[#FACC15]" />
                <div className="mt-0.5 text-sm font-display font-black text-[#FACC15]">{favoriteBatchCount}</div>
                <div className="text-[7px] text-[#9E9E9E] uppercase">Guardados</div>
              </div>
              <div className="bg-[#141414] border border-[#1E293B] px-1 py-2">
                <BarChart3 className="w-3 h-3 mx-auto text-[#7C3AED]" />
                <div className="mt-0.5 text-sm font-display font-black text-[#A78BFA]">{myBatches.length}</div>
                <div className="text-[7px] text-[#9E9E9E] uppercase">Lotes</div>
              </div>
            </div>
          )}

          {/* Pestañas para no saturar la vista */}
          <div className="grid grid-cols-5 border-b border-[#1E293B] mt-4 text-[8px] sm:text-[9px]">
            {[
              { id: 'RESUMEN' as const, label: 'Resumen', icon: LayoutDashboard },
              { id: 'EDITAR' as const, label: 'Editar', icon: Edit3 },
              { id: 'PRODUCTOS' as const, label: isProducer ? 'Productos' : 'Compras', icon: Package },
              { id: 'RESENAS' as const, label: 'Reseñas', icon: Star },
              { id: 'AJUSTES' as const, label: 'Ajustes', icon: Settings2 },
            ].map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setActiveTab(item.id)}
                  className={`flex items-center justify-center gap-1 px-1 py-2 border-b-2 font-bold uppercase transition-colors ${
                    activeTab === item.id
                      ? 'border-[#15803D] text-[#15803D]'
                      : 'border-transparent text-[#9E9E9E] hover:text-[#E5E5E5]'
                  }`}
                >
                  <Icon className="w-2.5 h-2.5 shrink-0" />
                  {item.label}
                </button>
              );
            })}
          </div>

          <div className="pt-3">
            {activeTab === 'RESUMEN' && (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 text-xs">
                <div className="lg:col-span-2 space-y-3">
                  <p className="text-[11px] text-[#CCCCCC] font-sans leading-relaxed">{bio}</p>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="bg-[#141414] border border-[#1E293B] p-2.5">
                      <div className="text-[8px] text-[#666666] uppercase">Calificación</div>
                      <div className="flex items-center gap-1 text-[#FACC15] font-bold">
                        {averageReview} <Star className="w-3.5 h-3.5 fill-[#FACC15]" />
                        <span className="text-[9px] text-[#9E9E9E] font-normal">({reviews.length})</span>
                      </div>
                    </div>
                    <div className="bg-[#141414] border border-[#1E293B] p-2.5">
                      <div className="text-[8px] text-[#666666] uppercase">
                        {isProducer ? 'Ventas directas' : 'Compras protegidas'}
                      </div>
                      <div className="text-[#FACC15] font-bold">
                        {formatUsd(isProducer ? totalSalesUsd || 28400 : purchasedUsd)}
                      </div>
                    </div>
                    <div className="bg-[#141414] border border-[#1E293B] p-2.5">
                      <div className="text-[8px] text-[#666666] uppercase">Teléfono</div>
                      <div className="flex items-center gap-1 text-[#E5E5E5] text-[10px]">
                        <Phone className="w-3 h-3 text-[#15803D]" /> {phone}
                      </div>
                    </div>
                    <div className="bg-[#141414] border border-[#1E293B] p-2.5">
                      <div className="text-[8px] text-[#666666] uppercase">
                        {isProducer ? 'Registro MIDA' : 'Cuenta'}
                      </div>
                      <div className="text-[#A78BFA] text-[10px] truncate">
                        {isProducer
                          ? currentUser.midaRegistration || 'MIDA-BARU-2026-OK'
                          : currentUser.email || 'Cuenta activa'}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-[#141414] border border-[#1E293B] p-3 space-y-2">
                  <div className="text-[10px] font-bold text-[#E5E5E5] uppercase">Insignias & garantías</div>
                  {(isProducer
                    ? [
                        'Identidad Google verificada',
                        'Sello BPA Barú & MIDA',
                        '100% entregas a tiempo',
                        'Cero disputas Escrow',
                      ]
                    : [
                        'Identidad Google verificada',
                        'Comprador Escrow verificado',
                        'Pago protegido en custodia',
                        'Cero disputas como comprador',
                      ]
                  ).map((badge) => (
                    <div key={badge} className="flex items-center gap-1.5 text-[10px] text-[#CCCCCC]">
                      <CheckCircle2 className="w-3.5 h-3.5 text-[#15803D] shrink-0" />
                      {badge}
                    </div>
                  ))}
                  <div className="border-t border-[#1E293B] pt-2 text-[9px] text-[#7C3AED]">
                    {isProducer
                      ? 'Reputación protegida con hash SHA-256.'
                      : 'Tus compras y reseñas también construyen tu reputación.'}
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'EDITAR' && (
              <form onSubmit={handleSave} className="space-y-3 text-xs">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[9px] uppercase text-[#9E9E9E] mb-1 font-bold">
                      Nombre completo / razón social *
                    </label>
                    <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Finca / nombre" required />
                  </div>
                  <div>
                    <label className="block text-[9px] uppercase text-[#9E9E9E] mb-1 font-bold">
                      Identificador único (@usuario)
                    </label>
                    <div className="relative">
                      <Input
                        value={username}
                        onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
                        onBlur={handleUsernameBlur}
                        placeholder="ej: finca_baru"
                      />
                      <div className="absolute right-2.5 top-2.5">
                        {isCheckingUsername && <span className="text-[8px] text-[#FACC15] animate-pulse">…</span>}
                        {!isCheckingUsername && usernameStatus.available === true && <Check className="w-3.5 h-3.5 text-[#15803D]" />}
                        {!isCheckingUsername && usernameStatus.available === false && <X className="w-3.5 h-3.5 text-[#F97316]" />}
                      </div>
                    </div>
                  </div>
                  <div>
                    <label className="block text-[9px] uppercase text-[#9E9E9E] mb-1 font-bold">
                      Teléfono / WhatsApp
                    </label>
                    <Input value={phone} onChange={(e) => setPhone(e.target.value)} />
                  </div>
                  <div>
                    <label className="block text-[9px] uppercase text-[#9E9E9E] mb-1 font-bold">
                      Ubicación / corregimiento
                    </label>
                    <Input value={location} onChange={(e) => setLocation(e.target.value)} />
                  </div>
                </div>
                <div>
                  <label className="block text-[9px] uppercase text-[#9E9E9E] mb-1 font-bold">
                    Descripción / bio
                  </label>
                  <textarea
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    rows={2}
                    className="w-full bg-[#141414] border border-[#1E293B] p-2 text-[#E5E5E5] text-xs font-mono focus:border-[#15803D] focus:outline-none"
                    placeholder="Hectáreas, variedades y certificaciones..."
                  />
                </div>
                <div className="flex justify-end">
                  <Button type="submit" variant="default" disabled={isSaving} className="flex items-center gap-2 text-xs">
                    <CheckCircle2 className="w-4 h-4" />
                    {isSaving ? 'Guardando...' : 'Guardar cambios'}
                  </Button>
                </div>
              </form>
            )}

            {activeTab === 'PRODUCTOS' && (
              <div className="space-y-2">
                {isProducer ? (
                  myBatches.length === 0 ? (
                    <div className="border border-[#1E293B] bg-[#141414] p-4 text-center text-[10px] text-[#9E9E9E]">
                      <Package className="w-5 h-5 mx-auto mb-1 text-[#15803D]" />
                      Aún no tienes cosechas publicadas.
                    </div>
                  ) : (
                    myBatches.map((batch) => (
                      <div key={batch.id} className="flex items-center gap-2.5 bg-[#141414] border border-[#1E293B] p-2">
                        <div className="w-10 h-10 border border-[#1E293B] overflow-hidden shrink-0">
                          <SafeImage
                            src={batch.images?.[0]}
                            alt={batch.cropName}
                            fallbackType="product"
                            cropHint={batch.cropName}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="text-[11px] font-bold text-[#E5E5E5] truncate">{batch.cropName}</div>
                          <div className="text-[9px] text-[#9E9E9E]">
                            {formatUsd(batch.pricePerKgUsd)}/kg · {batch.availableKg.toLocaleString()} kg
                          </div>
                        </div>
                        <Badge variant={batch.status === 'sold_out' ? 'destructive' : 'live-green'} className="text-[8px]">
                          {batch.status === 'sold_out' ? 'Agotado' : 'Disponible'}
                        </Badge>
                      </div>
                    ))
                  )
                ) : myOrders.length === 0 ? (
                  <div className="border border-[#1E293B] bg-[#141414] p-4 text-center text-[10px] text-[#9E9E9E]">
                    <Package className="w-5 h-5 mx-auto mb-1 text-[#FACC15]" />
                    Aún no tienes compras ni contratos Escrow.
                  </div>
                ) : (
                  myOrders.map((order) => (
                    <div key={order.id} className="bg-[#141414] border border-[#1E293B] p-2">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-[11px] font-bold text-[#E5E5E5] truncate">{order.productName}</span>
                        <Badge variant="live-yellow" className="text-[8px]">{order.escrowStatus}</Badge>
                      </div>
                      <div className="text-[9px] text-[#9E9E9E] mt-0.5">
                        {order.quantityKg.toLocaleString()} kg · {formatUsd(order.totalUsd)} · {order.farmName}
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}

            {activeTab === 'AJUSTES' && (
              <UserSettingsPanel userId={currentUser.id} />
            )}

            {activeTab === 'RESENAS' && (
              <div className="space-y-2 max-h-[34vh] overflow-y-auto pr-1">
                {reviews.length === 0 ? (
                  <div className="border border-[#1E293B] bg-[#141414] p-4 text-center text-[10px] text-[#9E9E9E]">
                    <MessageSquare className="w-5 h-5 mx-auto mb-1 text-[#15803D]" />
                    Aún no hay reseñas de compradores.
                  </div>
                ) : (
                  reviews.map((review) => (
                    <div key={review.id} className="bg-[#141414] border border-[#1E293B] p-2.5 space-y-1">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-[10px] font-bold text-[#E5E5E5]">{review.authorName}</span>
                        <span className="flex items-center gap-0.5">
                          {[...Array(5)].map((_, i) => (
                            <Star
                              key={i}
                              className={`w-2.5 h-2.5 ${i < review.rating ? 'fill-[#FACC15] text-[#FACC15]' : 'text-[#333333]'}`}
                            />
                          ))}
                        </span>
                      </div>
                      <p className="font-sans text-[10px] text-[#CCCCCC] leading-relaxed">“{review.comment}”</p>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      <p className="text-center text-[9px] text-[#666666]">
        <CreditCard className="inline w-3 h-3 mr-1" />
        Tu perfil es público para la comunidad; solo tú puedes editarlo.
      </p>
    </div>
  );
};
