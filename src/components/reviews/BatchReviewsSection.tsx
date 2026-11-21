import React, { useEffect, useState } from 'react';
import { 
  Star, 
  MessageSquare, 
  ShieldCheck, 
  CheckCircle2, 
  Send, 
  User as UserIcon,
  Globe
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { OrderReview, ReputationTier } from '@/types';
import { useAppState } from '@/context/AppStateContext';
import { useLanguage } from '@/context/LanguageContext';
import { useNotification } from '@/context/NotificationContext';
import { calculateReputationTier } from '@/services/reputationService';
import { SafeImage } from '@/components/ui/SafeImage';
import { formatDateOnly } from '@/lib/utils';
import {
  addReview,
  findVerifiedOrder,
  getReviewsForBatch,
  mergeReviews,
  onReviewsUpdated,
  StoredReview,
  subscribeReviewsForBatch,
} from '@/services/reviewsService';

interface BatchReviewsSectionProps {
  batchId: string;
  producerName: string;
  producerId?: string;
  initialReviews?: OrderReview[];
  onOpenProfile?: (target: { id?: string; name: string; role?: string }) => void;
}

export const BatchReviewsSection: React.FC<BatchReviewsSectionProps> = ({
  batchId,
  producerName,
  producerId,
  initialReviews = [],
  onOpenProfile,
}) => {
  const { currentUser, firebaseUser, orders } = useAppState();
  const { language, translateText } = useLanguage();
  const { success, warning } = useNotification();

  const [localReviews, setLocalReviews] = useState<StoredReview[]>(() =>
    getReviewsForBatch(batchId, producerName, producerId, initialReviews),
  );
  const [remoteReviews, setRemoteReviews] = useState<StoredReview[]>([]);
  const [reviewLoadError, setReviewLoadError] = useState<string | null>(null);

  useEffect(() => {
    const refreshLocal = () => {
      setLocalReviews(getReviewsForBatch(batchId, producerName, producerId, initialReviews));
    };
    refreshLocal();
    const unsubscribeLocal = onReviewsUpdated(refreshLocal);
    const unsubscribeRemote = subscribeReviewsForBatch(
      batchId,
      (items) => {
        setRemoteReviews(items);
        setReviewLoadError(null);
      },
      () => setReviewLoadError('No se pudieron sincronizar las reseñas en este momento.'),
    );
    return () => {
      unsubscribeLocal();
      unsubscribeRemote();
    };
    // initialReviews es una semilla; no debe reiniciar el estado en cada render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [batchId, producerName, producerId]);

  const reviews = mergeReviews(remoteReviews, localReviews);
  const verifiedOrder = findVerifiedOrder(orders, currentUser.id, {
    batchId,
    producerId,
    producerName,
  });
  const canReview =
    Boolean(firebaseUser) &&
    Boolean(verifiedOrder) &&
    (!producerId || producerId !== currentUser.id);

  const [rating, setRating] = useState<number>(5);
  const [comment, setComment] = useState<string>('');
  const [qualityCompliant, setQualityCompliant] = useState<boolean>(true);
  const [onTimeDelivery, setOnTimeDelivery] = useState<boolean>(true);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const averageRating = reviews.length > 0 
    ? (reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length).toFixed(1)
    : '5.0';

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!verifiedOrder) {
      warning(
        'Compra no verificada',
        'Solo puedes reseñar después de recibir una orden de este lote.',
      );
      return;
    }
    if (!comment.trim()) {
      warning('Comentario Requerido', 'Escribe tu experiencia sobre el lote o la entrega.');
      return;
    }

    setIsSubmitting(true);
    const newReview: OrderReview = {
      id: `REV-${Date.now()}`,
      orderId: verifiedOrder.orderCode,
      batchId,
      authorId: currentUser.id,
      authorName: currentUser.name,
      authorRole: currentUser.role,
      authorPhotoURL: currentUser.photoURL,
      authorTier: currentUser.reputationTier || 'GOLD',
      rating,
      comment: comment.trim(),
      qualityCompliant,
      onTimeDelivery,
      createdAt: new Date().toISOString().split('T')[0],
      verified: true,
    };

    await addReview(newReview, {
      producerId,
      producerName,
      verified: true,
    });
    setComment('');
    setIsSubmitting(false);
    success(
      'Reseña verificada publicada',
      'Tu comentario quedó asociado a una compra entregada y ya es visible para la comunidad.',
    );
  };

  return (
    <div className="space-y-4 font-mono text-xs">
      {/* Header Summary */}
      <div className="flex flex-wrap items-center justify-between gap-2 bg-[#0E0E0E] p-3 border border-[#1E293B]">
        <div className="flex items-center gap-3">
          <div className="text-2xl font-display font-black text-[#FACC15] flex items-center gap-1">
            <Star className="w-6 h-6 fill-[#FACC15]" />
            {averageRating}
          </div>
          <div>
            <div className="font-bold text-[#E5E5E5] uppercase">
              {language === 'en' ? 'Verified Buyer Reviews' : 'Reseñas Verificadas de Compradores'}
            </div>
            <div className="text-[10px] text-[#9E9E9E]">
              {reviews.length} {language === 'en' ? 'Escrow transactions completed' : 'transacciones Escrow completadas'}
            </div>
          </div>
        </div>

        <Badge variant="default">
          <ShieldCheck className="w-3.5 h-3.5 mr-1" />
          100% {language === 'en' ? 'Audit Verified' : 'Auditado'}
        </Badge>
      </div>
      {reviewLoadError && (
        <div className="border border-[#F97316]/40 bg-[#F97316]/10 px-3 py-2 text-[10px] text-[#FED7AA] font-sans" role="status">
          {reviewLoadError} Se muestran las reseñas guardadas en este dispositivo.
        </div>
      )}

      {/* Reviews List */}
      <div className="space-y-2.5 max-h-60 overflow-y-auto pr-1">
        {reviews.map((rev) => {
          const tier = calculateReputationTier(98, 10);
          return (
            <div key={rev.id} className="bg-[#141414] border border-[#1E293B] p-3 space-y-1.5">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 bg-[#1A1A1A] border border-[#15803D] flex items-center justify-center text-[#15803D] shrink-0 overflow-hidden">
                    <SafeImage
                      src={rev.authorPhotoURL}
                      alt={rev.authorName}
                      fallbackType="avatar"
                      nameHint={rev.authorName}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() =>
                      onOpenProfile?.({
                        id: rev.authorId,
                        name: rev.authorName,
                        role: rev.authorRole,
                      })
                    }
                    className="font-bold text-[#E5E5E5] text-[11px] hover:text-emerald-300 text-left"
                  >
                    {rev.authorName}
                  </button>
                  <Badge variant="purple" className="text-[8px]">
                    {rev.authorRole === 'buyer' ? 'Comprador Internacional' : 'Productor Barú'}
                  </Badge>
                  {rev.verified && (
                    <Badge variant="live-green" className="text-[8px] flex items-center gap-0.5">
                      <ShieldCheck className="w-2.5 h-2.5" /> Compra verificada
                    </Badge>
                  )}
                </div>

                <div className="flex items-center gap-1 text-[#FACC15]">
                  {[...Array(5)].map((_, i) => (
                    <Star 
                      key={i} 
                      className={`w-3 h-3 ${i < rev.rating ? 'fill-[#FACC15]' : 'text-[#333333]'}`} 
                    />
                  ))}
                  <span className="text-[9px] text-[#666666] ml-1">{formatDateOnly(rev.createdAt)}</span>
                </div>
              </div>

              <p className="text-[11px] text-[#CCCCCC] leading-relaxed">
                "{rev.comment}"
              </p>

              <div className="flex items-center gap-3 text-[9px] text-[#9E9E9E] pt-1 border-t border-[#1E293B]/60">
                {rev.qualityCompliant && (
                  <span className="flex items-center gap-1 text-[#15803D]">
                    <CheckCircle2 className="w-3 h-3" /> Calibre & Calidad Conforme
                  </span>
                )}
                {rev.onTimeDelivery && (
                  <span className="flex items-center gap-1 text-[#FACC15]">
                    <CheckCircle2 className="w-3 h-3" /> Entrega Puntual en Puerto
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Add Review Form: solo compradores con orden entregada o liberada */}
      {!canReview ? (
        <div className="bg-[#0E0E0E] border border-[#1E293B] p-3 text-[10px] text-[#9E9E9E] font-sans leading-relaxed">
          <div className="flex items-center gap-1.5 font-bold text-[#E5E5E5] uppercase font-mono mb-1">
            <ShieldCheck className="w-3.5 h-3.5 text-[#FACC15]" />
            Reseñas con compra verificada
          </div>
          {!firebaseUser
            ? 'Inicia sesión para reseñar un lote.'
            : 'Solo los compradores con una orden entregada o con fondos Escrow liberados pueden publicar una reseña. Cuando completes una compra, aparecerá aquí tu formulario.'}
        </div>
      ) : (
      <form onSubmit={handleSubmitReview} className="bg-[#0E0E0E] border-2 border-[#15803D] p-3 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <span className="font-bold text-[#E5E5E5] text-[11px] uppercase flex items-center gap-1.5">
            <MessageSquare className="w-3.5 h-3.5 text-[#15803D]" />
            {language === 'en' ? 'Leave a Feedback & Verification' : 'Dejar Reseña & Calificación de Lote'}
          </span>
          {/* Star selector */}
          <div className="flex items-center gap-1">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                type="button"
                key={star}
                onClick={() => setRating(star)}
                className="text-[#FACC15] hover:scale-110 transition-transform"
              >
                <Star className={`w-4 h-4 ${star <= rating ? 'fill-[#FACC15]' : 'text-[#333333]'}`} />
              </button>
            ))}
          </div>
        </div>

        <Input 
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder={language === 'en' ? 'Describe fruit quality, packing standards, and shipping experience...' : 'Describe la calidad de la fruta, empacado y cumplimiento de entrega...'}
          className="text-xs"
        />

        <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
          <div className="flex items-center gap-4 text-[10px]">
            <label className="flex items-center gap-1.5 text-[#CCCCCC] cursor-pointer">
              <input 
                type="checkbox" 
                checked={qualityCompliant} 
                onChange={(e) => setQualityCompliant(e.target.checked)}
                className="accent-[#15803D]" 
              />
              Calidad Conforme (Sin Daño)
            </label>
            <label className="flex items-center gap-1.5 text-[#CCCCCC] cursor-pointer">
              <input 
                type="checkbox" 
                checked={onTimeDelivery} 
                onChange={(e) => setOnTimeDelivery(e.target.checked)}
                className="accent-[#FACC15]" 
              />
              Cadena de Frío Cumplida
            </label>
          </div>

          <Button type="submit" variant="default" disabled={isSubmitting} className="flex items-center gap-1 py-1 h-8 text-xs">
            <Send className="w-3 h-3" />
            <span>{isSubmitting ? 'Publicando...' : 'Publicar Reseña'}</span>
          </Button>
        </div>
      </form>
      )}
    </div>
  );
};
