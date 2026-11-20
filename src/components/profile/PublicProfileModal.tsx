import React, { useEffect, useMemo, useState } from 'react';
import {
  Award,
  BadgeCheck,
  CheckCircle2,
  MapPin,
  MessageSquare,
  Package,
  Send,
  ShieldCheck,
  ShoppingBasket,
  Star,
  UserRound,
  X,
} from 'lucide-react';
import { Dialog, DialogCloseButton } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { SafeImage } from '@/components/ui/SafeImage';
import { useAppState } from '@/context/AppStateContext';
import { useNotification } from '@/context/NotificationContext';
import { ProductBatch, UserProfile } from '@/types';
import { ENTERPRISE_DIRECTORY, FARMER_DIRECTORY } from '@/services/directoryData';
import { MOCK_USERS } from '@/services/mockData';
import {
  addReview,
  getReviewSummary,
  getReviewsForProducer,
  onReviewsUpdated,
} from '@/services/reviewsService';
import { calculateReputationTier } from '@/services/reputationService';
import { formatDateOnly, formatUsd } from '@/lib/utils';
import { getFreshnessTier } from '@/services/dateUtils';
import { DirectMessageModal, ChatContact } from '@/components/chat/DirectMessageModal';
import { db, COLLECTIONS } from '@/services/firebase';
import { doc, getDoc } from 'firebase/firestore';

export interface PublicProfileTarget {
  id?: string;
  name: string;
  role?: string;
  avatar?: string;
  banner?: string;
  location?: string;
  bio?: string;
  reputation?: number;
  phone?: string;
  username?: string;
  badge?: string;
  midaRegistration?: string;
}

interface PublicProfileModalProps {
  target: PublicProfileTarget | null;
  open: boolean;
  onClose: () => void;
  onOpenProduct?: (batch: ProductBatch) => void;
}

type ProfileTab = 'RESUMEN' | 'PRODUCTOS' | 'RESENAS';
type ProductSort = 'NUEVOS' | 'MAS_VENDIDOS';

function roleLabel(role?: string): string {
  if (!role) return 'Miembro de la comunidad';
  if (role === 'productor' || role === 'farmer') return 'Productor Agrícola';
  if (role === 'consumidor' || role === 'buyer') return 'Comprador / Consumidor';
  if (role === 'cooperative') return 'Cooperativa / MIDA';
  if (role === 'auditor') return 'Auditor Certificado';
  return role;
}

function roleIcon(role?: string) {
  if (role === 'productor' || role === 'farmer') return <ShoppingBasket className="w-3.5 h-3.5" />;
  if (role === 'consumidor' || role === 'buyer') return <Package className="w-3.5 h-3.5" />;
  return <ShieldCheck className="w-3.5 h-3.5" />;
}

function normalize(value?: string): string {
  return (value || '').trim().toLowerCase();
}

export const PublicProfileModal: React.FC<PublicProfileModalProps> = ({
  target,
  open,
  onClose,
  onOpenProduct,
}) => {
  const { currentUser, batches } = useAppState();
  const { success, warning } = useNotification();
  const [tab, setTab] = useState<ProfileTab>('RESUMEN');
  const [productSort, setProductSort] = useState<ProductSort>('NUEVOS');
  const [reviews, setReviews] = useState(() => getReviewsForProducer(target?.id, target?.name));
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [chatTarget, setChatTarget] = useState<ChatContact | null>(null);
  const [remoteProfile, setRemoteProfile] = useState<UserProfile | null>(null);

  useEffect(() => {
    let cancelled = false;
    setRemoteProfile(null);
    if (!target?.id) return () => { cancelled = true; };
    getDoc(doc(db, COLLECTIONS.USERS, target.id))
      .then((snapshot) => {
        if (!cancelled && snapshot.exists()) {
          setRemoteProfile(snapshot.data() as UserProfile);
        }
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [target?.id]);

  useEffect(() => {
    setTab('RESUMEN');
    setReviews(getReviewsForProducer(target?.id, target?.name));
    return onReviewsUpdated(() => {
      setReviews(getReviewsForProducer(target?.id, target?.name));
    });
  }, [target?.id, target?.name, open]);

  const profile = useMemo(() => {
    if (!target) return null;
    const normalizedName = normalize(target.name);
    const directoryFarmer = FARMER_DIRECTORY.find(
      (item) => item.id === target.id || normalize(item.name) === normalizedName,
    );
    const directoryEnterprise = ENTERPRISE_DIRECTORY.find(
      (item) => item.id === target.id || normalize(item.brandName) === normalizedName,
    );
    const mockUser = MOCK_USERS.find(
      (item) => item.id === target.id || normalize(item.name) === normalizedName,
    );

    const cleanOwnName = normalize(currentUser.name).replace(/^(don|doña|sr|sra)\.?\s+/, '');
    const cleanTargetName = normalizedName.replace(/^(don|doña|sr|sra)\.?\s+/, '');
    const namesMatch =
      cleanOwnName === cleanTargetName ||
      (cleanOwnName.length > 3 && cleanTargetName.includes(cleanOwnName)) ||
      (cleanTargetName.length > 3 && cleanOwnName.includes(cleanTargetName));
    const isOwn =
      currentUser.id === target.id ||
      namesMatch ||
      (Boolean(target.username) &&
        normalize(currentUser.username) === normalize(target.username));

    const ownProfile = isOwn ? currentUser : null;
    return {
      id: target.id || mockUser?.id || directoryFarmer?.id || directoryEnterprise?.id,
      name: remoteProfile?.name || target.name,
      role: remoteProfile?.role || target.role || mockUser?.role,
      avatar:
        target.avatar ||
        remoteProfile?.photoURL ||
        ownProfile?.photoURL ||
        mockUser?.photoURL ||
        directoryFarmer?.avatar ||
        directoryEnterprise?.avatar,
      banner:
        target.banner ||
        remoteProfile?.bannerURL ||
        ownProfile?.bannerURL ||
        mockUser?.bannerURL,
      location:
        target.location ||
        remoteProfile?.location ||
        ownProfile?.location ||
        mockUser?.location ||
        directoryFarmer?.corregimiento ||
        directoryEnterprise?.corregimiento,
      bio:
        target.bio ||
        remoteProfile?.bio ||
        ownProfile?.bio ||
        (directoryEnterprise?.description ||
          (directoryFarmer
            ? `Productor certificado de ${directoryFarmer.primaryCrops.join(' y ')} en ${directoryFarmer.corregimiento}, Barú.`
            : mockUser?.badge) ||
          'Miembro activo de la red agrícola de Barú.'),
      reputation:
        target.reputation ||
        remoteProfile?.reputationScore ||
        ownProfile?.reputationScore ||
        mockUser?.reputationScore ||
        directoryFarmer?.reputation ||
        directoryEnterprise?.rating,
      username:
        target.username ||
        remoteProfile?.username ||
        ownProfile?.username ||
        mockUser?.username ||
        directoryFarmer?.username,
      phone:
        target.phone ||
        remoteProfile?.phone ||
        ownProfile?.phone ||
        mockUser?.phone ||
        directoryFarmer?.phone ||
        directoryEnterprise?.phone,
      badge:
        target.badge ||
        remoteProfile?.badge ||
        ownProfile?.badge ||
        mockUser?.badge ||
        (directoryEnterprise?.verified ? 'Empresa verificada MIDA' : undefined),
      midaRegistration:
        target.midaRegistration ||
        remoteProfile?.midaRegistration ||
        ownProfile?.midaRegistration ||
        mockUser?.midaRegistration ||
        directoryFarmer?.midaRegistration,
      isOwn,
    };
  }, [target, currentUser, remoteProfile]);

  const producerBatches = useMemo(() => {
    if (!profile) return [];
    const normalizedName = normalize(profile.name);
    return batches.filter((batch) => {
      const sameProducer = normalize(batch.producerName) === normalizedName;
      const sameFarm = Boolean(profile.id && batch.farmId === profile.id);
      return sameProducer || sameFarm;
    });
  }, [batches, profile]);

  const sortedBatches = useMemo(() => {
    return [...producerBatches].sort((a, b) => {
      if (productSort === 'MAS_VENDIDOS') {
        const soldA = a.quantityKg - a.availableKg;
        const soldB = b.quantityKg - b.availableKg;
        return soldB - soldA;
      }
      return new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime();
    });
  }, [producerBatches, productSort]);

  const reviewSummary = getReviewSummary(reviews);
  const tier = calculateReputationTier(
    Math.round((profile?.reputation || 95) * 10) / 10,
    producerBatches.length > 0 ? 10 : 3,
  );

  if (!target || !profile) return null;

  const fallbackBanner =
    profile.banner ||
    producerBatches.find((batch) => batch.images?.[0])?.images?.[0] ||
    undefined;

  const handleSubmitReview = (event: React.FormEvent) => {
    event.preventDefault();
    if (!comment.trim()) {
      warning('Reseña incompleta', 'Escribe tu experiencia antes de publicar.');
      return;
    }
    addReview(
      {
        id: `REV-${Date.now()}`,
        orderId: `ESCROW-BARU-${Math.floor(100000 + Math.random() * 900000)}`,
        batchId: producerBatches[0]?.id,
        authorId: currentUser.id,
        authorName: currentUser.name,
        authorRole: currentUser.role,
        authorPhotoURL: currentUser.photoURL,
        authorTier: currentUser.reputationTier || 'GOLD',
        rating,
        comment: comment.trim(),
        qualityCompliant: true,
        onTimeDelivery: true,
        createdAt: new Date().toISOString().slice(0, 10),
      },
      { producerId: profile.id, producerName: profile.name },
    );
    setReviews(getReviewsForProducer(profile.id, profile.name));
    setComment('');
    success('Reseña publicada', `Tu reseña sobre ${profile.name} ya es visible en su perfil.`);
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogCloseButton onClose={onClose} />

      {/* Banner largo detrás del avatar (estilo WhatsApp Business) */}
      <div className="relative -mx-5 -mt-5 h-28 sm:h-36 overflow-hidden bg-[#0A0A0A]">
        {fallbackBanner ? (
          <SafeImage
            src={fallbackBanner}
            alt={`Portada de ${profile.name}`}
            fallbackType="product"
            cropHint={producerBatches[0]?.cropName}
            className="absolute inset-0 w-full h-full object-cover object-center"
            style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center' }}
          />
        ) : (
          <div className="w-full h-full bg-[radial-gradient(circle_at_20%_20%,#15803D_0%,transparent_45%),radial-gradient(circle_at_80%_30%,#7C3AED_0%,transparent_40%),linear-gradient(135deg,#0A0A0A,#111714)]" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-[#111714] via-black/20 to-black/10" />
        <div className="absolute top-2 left-2 font-mono text-[8px] uppercase tracking-wider text-white/75 bg-black/55 border border-white/15 px-1.5 py-0.5">
          {profile.isOwn ? 'Tu portada' : 'Portada pública'}
        </div>
      </div>

      {/* Avatar y datos principales */}
      <div className="relative -mt-10 flex items-end gap-3 text-left">
        <div className={`w-[76px] h-[76px] shrink-0 overflow-hidden bg-[#141414] ${tier.avatarBorderClass}`}>
          <SafeImage
            src={profile.avatar}
            alt={profile.name}
            fallbackType="avatar"
            nameHint={profile.name}
            className="w-full h-full object-cover"
          />
        </div>
        <div className="min-w-0 pb-0.5">
          <div className="flex flex-wrap items-center gap-1.5">
            <h3 className="font-display font-black text-base sm:text-lg text-[#ECFDF5] break-words">
              {profile.name}
            </h3>
            <BadgeCheck className="w-4 h-4 text-[#10B981] shrink-0" />
          </div>
          <div className="flex flex-wrap items-center gap-1.5 mt-1">
            <span className="inline-flex items-center gap-1 border border-[#15803D]/50 bg-[#15803D]/10 px-1.5 py-0.5 font-mono text-[9px] font-bold uppercase text-[#10B981]">
              {roleIcon(profile.role)}
              {roleLabel(profile.role)}
            </span>
            {profile.username && (
              <span className="font-mono text-[9px] text-[#9E9E9E]">@{profile.username}</span>
            )}
            {profile.isOwn && (
              <span className="font-mono text-[9px] text-[#FACC15]">Este eres tú</span>
            )}
          </div>
          {profile.location && (
            <p className="mt-1 flex items-center gap-1 font-mono text-[10px] text-[#9E9E9E]">
              <MapPin className="w-3 h-3 text-[#10B981] shrink-0" />
              {profile.location}
            </p>
          )}
        </div>
      </div>

      {/* Resumen compacto */}
      <div className="grid grid-cols-3 gap-2 mt-3">
        <div className="bg-[#0A0A0A] border border-[#1E2E26] p-2 text-center">
          <div className="font-display font-black text-base text-[#FACC15]">
            {reviewSummary.average || '5.0'} <Star className="inline w-3 h-3 fill-[#FACC15]" />
          </div>
          <div className="font-mono text-[8px] uppercase text-[#9E9E9E]">
            {reviewSummary.count} reseñas
          </div>
        </div>
        <div className="bg-[#0A0A0A] border border-[#1E2E26] p-2 text-center">
          <div className="font-display font-black text-base text-[#10B981]">{producerBatches.length}</div>
          <div className="font-mono text-[8px] uppercase text-[#9E9E9E]">Productos</div>
        </div>
        <div className="bg-[#0A0A0A] border border-[#1E2E26] p-2 text-center">
          <div className="font-display font-black text-base text-[#A78BFA]">
            {Math.round(
              producerBatches.reduce((sum, batch) => sum + (batch.quantityKg - batch.availableKg), 0),
            ).toLocaleString()}
          </div>
          <div className="font-mono text-[8px] uppercase text-[#9E9E9E]">Kg vendidos</div>
        </div>
      </div>

      {/* Acciones: mensaje y reseña */}
      <div className="flex flex-wrap items-center gap-2 mt-3">
        {!profile.isOwn && (
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={() =>
              setChatTarget({
                id: profile.id || profile.name,
                name: profile.name,
                corregimiento: profile.location,
                avatar: profile.avatar,
                reputation: profile.reputation,
                phone: profile.phone,
                badge: roleLabel(profile.role),
              })
            }
            className="flex-1 min-w-[132px] text-[11px]"
          >
            <MessageSquare className="w-3.5 h-3.5 text-[#10B981]" />
            Enviar mensaje
          </Button>
        )}
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => {
            setTab('RESENAS');
            window.setTimeout(() => {
              document.getElementById('public-profile-review-input')?.focus();
            }, 80);
          }}
          className="flex-1 min-w-[132px] text-[11px]"
        >
          <Star className="w-3.5 h-3.5 text-[#FACC15]" />
          {profile.isOwn ? 'Ver reseñas' : 'Dejar reseña'}
        </Button>
      </div>

      {/* Tabs compactos */}
      <div className="flex border-b border-[#1E293B] mt-3 font-mono text-[10px]">
        {[
          { id: 'RESUMEN' as const, label: 'Resumen' },
          { id: 'PRODUCTOS' as const, label: `Productos (${producerBatches.length})` },
          { id: 'RESENAS' as const, label: `Reseñas (${reviewSummary.count})` },
        ].map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => setTab(item.id)}
            className={`px-3 py-2 border-b-2 font-bold uppercase transition-colors ${
              tab === item.id
                ? 'border-[#10B981] text-[#10B981]'
                : 'border-transparent text-[#9E9E9E] hover:text-[#E5E5E5]'
            }`}
          >
            {item.label}
          </button>
        ))}
      </div>

      <div className="pt-3 max-h-[38vh] overflow-y-auto pr-1">
        {tab === 'RESUMEN' && (
          <div className="space-y-3 font-mono text-[10px]">
            <p className="font-sans text-[11px] leading-relaxed text-[#CCCCCC]">{profile.bio}</p>
            <div className="grid grid-cols-2 gap-2">
              <div className="bg-[#0A0A0A] border border-[#1E2E26] p-2">
                <div className="text-[#9E9E9E] uppercase text-[8px]">Confianza</div>
                <div className="text-[#10B981] font-bold">{profile.reputation || 99.4}%</div>
              </div>
              <div className="bg-[#0A0A0A] border border-[#1E2E26] p-2">
                <div className="text-[#9E9E9E] uppercase text-[8px]">Rango</div>
                <div className="text-[#FACC15] font-bold truncate">{tier.label.split('//')[0]}</div>
              </div>
            </div>
            {profile.midaRegistration && (
              <div className="flex items-center gap-1.5 text-[#A78BFA]">
                <ShieldCheck className="w-3.5 h-3.5" />
                Registro MIDA: <span className="text-[#E5E5E5]">{profile.midaRegistration}</span>
              </div>
            )}
            {profile.badge && (
              <div className="flex items-center gap-1.5 text-[#FACC15]">
                <Award className="w-3.5 h-3.5" />
                {profile.badge}
              </div>
            )}
            <div className="flex items-center gap-1.5 text-[#9E9E9E]">
              <CheckCircle2 className="w-3.5 h-3.5 text-[#10B981]" />
              {profile.isOwn
                ? 'Puedes editar este perfil desde “Mi Perfil”.'
                : 'Perfil público de solo lectura. Puedes escribirle o dejar una reseña.'}
            </div>
          </div>
        )}

        {tab === 'PRODUCTOS' && (
          <div className="space-y-2">
            <div className="flex items-center justify-between gap-2">
              <span className="font-mono text-[9px] uppercase text-[#9E9E9E]">Cosechas publicadas</span>
              <div className="inline-flex border border-[#1E293B] bg-[#0A0A0A]">
                {(['NUEVOS', 'MAS_VENDIDOS'] as const).map((sort) => (
                  <button
                    key={sort}
                    type="button"
                    onClick={() => setProductSort(sort)}
                    className={`px-2 py-1 font-mono text-[8px] font-bold uppercase ${
                      productSort === sort
                        ? 'bg-[#10B981] text-[#05100A]'
                        : 'text-[#9E9E9E] hover:text-[#E5E5E5]'
                    }`}
                  >
                    {sort === 'NUEVOS' ? 'Más nuevos' : 'Más vendidos'}
                  </button>
                ))}
              </div>
            </div>

            {sortedBatches.length === 0 ? (
              <div className="border border-[#1E2E26] bg-[#0A0A0A] p-4 text-center font-mono text-[10px] text-[#9E9E9E]">
                <Package className="w-5 h-5 mx-auto mb-1 text-[#15803D]" />
                Este perfil todavía no tiene cosechas publicadas.
              </div>
            ) : (
              sortedBatches.slice(0, 6).map((batch) => {
                const freshness = getFreshnessTier(batch.createdAt);
                return (
                  <button
                    key={batch.id}
                    type="button"
                    onClick={() => {
                      if (onOpenProduct) {
                        onClose();
                        onOpenProduct(batch);
                      }
                    }}
                    className={`w-full flex items-center gap-2.5 bg-[#0A0A0A] border border-[#1E2E26] p-2 text-left transition-colors ${
                      onOpenProduct ? 'hover:border-[#10B981]/60 cursor-pointer' : 'cursor-default'
                    }`}
                  >
                    <div className="w-11 h-11 shrink-0 border border-[#1E293B] overflow-hidden">
                      <SafeImage
                        src={batch.images?.[0]}
                        alt={batch.cropName}
                        fallbackType="product"
                        cropHint={batch.cropName}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-1">
                        <span className="font-sans text-[11px] font-bold text-[#E5E5E5] truncate">
                          {batch.cropName}
                        </span>
                        <span className={`font-mono text-[8px] px-1 border ${freshness.badgeClass}`}>
                          {freshness.label}
                        </span>
                      </div>
                      <div className="font-mono text-[9px] text-[#9E9E9E] truncate">
                        {formatUsd(batch.pricePerKgUsd)}/kg · {batch.availableKg.toLocaleString()} kg
                      </div>
                    </div>
                    {onOpenProduct && <span className="font-mono text-[9px] text-[#10B981] shrink-0">Ver</span>}
                  </button>
                );
              })
            )}
          </div>
        )}

        {tab === 'RESENAS' && (
          <div className="space-y-2.5 font-mono text-[10px]">
            {reviews.slice(0, 8).map((review) => (
              <div key={review.id} className="bg-[#0A0A0A] border border-[#1E2E26] p-2 space-y-1">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5 min-w-0">
                    <div className="w-5 h-5 border border-[#15803D] overflow-hidden shrink-0">
                      <SafeImage
                        src={review.authorPhotoURL}
                        alt={review.authorName}
                        fallbackType="avatar"
                        nameHint={review.authorName}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <span className="font-bold text-[#E5E5E5] text-[10px] truncate">
                      {review.authorName}
                    </span>
                  </div>
                  <div className="flex items-center gap-0.5 shrink-0">
                    {[...Array(5)].map((_, index) => (
                      <Star
                        key={index}
                        className={`w-2.5 h-2.5 ${
                          index < review.rating ? 'fill-[#FACC15] text-[#FACC15]' : 'text-[#333333]'
                        }`}
                      />
                    ))}
                    <span className="text-[8px] text-[#666666] ml-1">
                      {formatDateOnly(review.createdAt)}
                    </span>
                  </div>
                </div>
                <p className="font-sans text-[10px] leading-relaxed text-[#CCCCCC]">
                  “{review.comment}”
                </p>
              </div>
            ))}

            {!profile.isOwn ? (
              <form onSubmit={handleSubmitReview} className="border border-[#15803D] bg-[#0A0A0A] p-2.5 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-[#E5E5E5] text-[10px] uppercase">Tu reseña</span>
                  <div className="flex gap-0.5">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setRating(star)}
                        aria-label={`${star} estrellas`}
                      >
                        <Star
                          className={`w-3.5 h-3.5 ${
                            star <= rating ? 'fill-[#FACC15] text-[#FACC15]' : 'text-[#333333]'
                          }`}
                        />
                      </button>
                    ))}
                  </div>
                </div>
                <Input
                  id="public-profile-review-input"
                  value={comment}
                  onChange={(event) => setComment(event.target.value)}
                  placeholder="Describe la calidad, el empaque y la entrega..."
                  className="text-[11px]"
                />
                <Button type="submit" size="sm" className="w-full text-[10px]">
                  <Send className="w-3 h-3" /> Publicar reseña
                </Button>
              </form>
            ) : (
              <div className="border border-[#1E2E26] bg-[#0A0A0A] p-2 text-center text-[9px] text-[#9E9E9E]">
                Las reseñas de compradores aparecen aquí.
              </div>
            )}
          </div>
        )}
      </div>

      <div className="mt-3 pt-2 border-t border-[#1E293B] flex justify-end">
        <Button type="button" variant="outline" size="sm" onClick={onClose} className="text-[10px]">
          <X className="w-3 h-3" /> Cerrar
        </Button>
      </div>

      <DirectMessageModal
        isOpen={Boolean(chatTarget)}
        onClose={() => setChatTarget(null)}
        contact={chatTarget}
      />
    </Dialog>
  );
};
