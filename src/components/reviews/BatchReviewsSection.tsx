import React, { useState } from 'react';
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

interface BatchReviewsSectionProps {
  batchId: string;
  producerName: string;
  initialReviews?: OrderReview[];
}

export const BatchReviewsSection: React.FC<BatchReviewsSectionProps> = ({
  batchId,
  producerName,
  initialReviews = []
}) => {
  const { currentUser, firebaseUser } = useAppState();
  const { language, translateText } = useLanguage();
  const { success, warning } = useNotification();

  const [reviews, setReviews] = useState<OrderReview[]>(() => {
    if (initialReviews.length > 0) return initialReviews;
    return [
      {
        id: 'REV-101',
        orderId: 'ESCROW-BARU-884920',
        batchId,
        authorId: 'BUYER-PAN-GLOBAL',
        authorName: 'Hamburg Fruit Imports GMBH',
        authorRole: 'buyer',
        authorTier: 'DIAMOND_MIDA',
        rating: 5,
        comment: 'Excelente calidad y entrega puntual. Calibre 44 mm uniforme, cajas selladas con código QR verificado y sin mermas en corona.',
        qualityCompliant: true,
        onTimeDelivery: true,
        createdAt: '2026-08-20',
      },
      {
        id: 'REV-102',
        orderId: 'ESCROW-BARU-773812',
        batchId,
        authorId: 'BUYER-USA-MIAMI',
        authorName: 'Tropical Prime Corp (Miami)',
        authorRole: 'buyer',
        authorTier: 'GOLD',
        rating: 5,
        comment: 'Fruta recibida en temperatura óptima (13.5 °C). Los fondos de Escrow se liberaron de inmediato al escanear la entrega en aduana.',
        qualityCompliant: true,
        onTimeDelivery: true,
        createdAt: '2026-08-15',
      }
    ];
  });

  const [rating, setRating] = useState<number>(5);
  const [comment, setComment] = useState<string>('');
  const [qualityCompliant, setQualityCompliant] = useState<boolean>(true);
  const [onTimeDelivery, setOnTimeDelivery] = useState<boolean>(true);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const averageRating = reviews.length > 0 
    ? (reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length).toFixed(1)
    : '5.0';

  const handleSubmitReview = (e: React.FormEvent) => {
    e.preventDefault();
    if (!comment.trim()) {
      warning('Comentario Requerido', 'Escribe tu experiencia sobre el lote o la entrega.');
      return;
    }

    setIsSubmitting(true);
    const newReview: OrderReview = {
      id: `REV-${Date.now()}`,
      orderId: `ESCROW-BARU-${Math.floor(100000 + Math.random() * 900000)}`,
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
    };

    setReviews(prev => [newReview, ...prev]);
    setComment('');
    setIsSubmitting(false);
    success('Reseña Publicada', 'Tu comentario y calificación se han agregado a la reputación del productor.');
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
                  <span className="font-bold text-[#E5E5E5] text-[11px]">{rev.authorName}</span>
                  <Badge variant="purple" className="text-[8px]">
                    {rev.authorRole === 'buyer' ? 'Comprador Internacional' : 'Productor Barú'}
                  </Badge>
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

      {/* Add Review Form */}
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
    </div>
  );
};
