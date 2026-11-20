import React, { useEffect, useMemo, useState } from 'react';
import {
  ArrowRight,
  CheckCircle2,
  MessageSquare,
  ShieldCheck,
  ShoppingBasket,
  Sprout,
  UserRound,
} from 'lucide-react';
import { Dialog, DialogCloseButton } from '@/components/ui/dialog';
import type { UserRole } from '@/types';

interface NewUserAssistantProps {
  enabled: boolean;
  userId?: string;
  role: UserRole;
  onNavigate: (tab: string) => void;
}

const STORAGE_PREFIX = 'agrobaru_assistant_done_v1';

export const NewUserAssistant: React.FC<NewUserAssistantProps> = ({
  enabled,
  userId,
  role,
  onNavigate,
}) => {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState(0);

  const storageKey = useMemo(
    () => `${STORAGE_PREFIX}:${userId || 'invitado'}`,
    [userId],
  );

  const steps = useMemo(() => {
    const producerSteps = [
      {
        icon: UserRound,
        title: 'Completa tu perfil',
        description:
          'Agrega tu foto, el nombre de tu finca y tu comunidad. Eso genera confianza con los compradores.',
        action: 'profile',
        actionLabel: 'Revisar mi perfil',
      },
      {
        icon: Sprout,
        title: 'Publica tu primera cosecha',
        description:
          'Registra la bitácora de campo y publica un lote con fotos, calibre y precio por kilo.',
        action: 'farmer',
        actionLabel: 'Ir a mi panel',
      },
      {
        icon: MessageSquare,
        title: 'Conecta con la red',
        description:
          'Revisa alertas fitosanitarias y conversa con compradores y otros productores de Barú.',
        action: 'alerts',
        actionLabel: 'Abrir comunidad',
      },
    ];

    const buyerSteps = [
      {
        icon: UserRound,
        title: 'Completa tu perfil',
        description:
          'Tu nombre y comunidad ayudan a que los productores sepan quién está comprando.',
        action: 'profile',
        actionLabel: 'Revisar mi perfil',
      },
      {
        icon: ShoppingBasket,
        title: 'Explora el mercado',
        description:
          'Filtra por producto, finca o corregimiento y revisa la trazabilidad de cada lote.',
        action: 'marketplace',
        actionLabel: 'Ver mercado',
      },
      {
        icon: ShieldCheck,
        title: 'Compra con protección',
        description:
          'Usa el carrito y el pago Escrow: el productor cobra cuando confirmas la entrega.',
        action: 'marketplace',
        actionLabel: 'Explorar lotes',
      },
    ];

    return role === 'farmer' || role === 'cooperative' ? producerSteps : buyerSteps;
  }, [role]);

  useEffect(() => {
    if (!enabled) return;
    try {
      if (!localStorage.getItem(storageKey)) {
        const timer = setTimeout(() => setOpen(true), 700);
        return () => clearTimeout(timer);
      }
    } catch {
      // Sin almacenamiento local no se insiste con el asistente.
    }
  }, [enabled, storageKey]);

  const finish = () => {
    try {
      localStorage.setItem(storageKey, '1');
    } catch {}
    setOpen(false);
  };

  const current = steps[step];
  const Icon = current.icon;

  if (!enabled) return null;

  return (
    <Dialog open={open} onOpenChange={(next) => (next ? setOpen(true) : finish())}>
      <DialogCloseButton onClose={finish} />
      <div className="space-y-4 font-mono">
        <div>
          <p className="text-[9px] uppercase tracking-[0.18em] text-[#FACC15]">
            Asistente de inicio · {step + 1} de {steps.length}
          </p>
          <div className="mt-1 flex items-center gap-2">
            <span className="flex h-9 w-9 items-center justify-center rounded-lg border border-[#15803D] bg-[#15803D]/15">
              <Icon className="h-4 w-4 text-[#10B981]" />
            </span>
            <h2 className="font-display text-lg font-black text-[#ECFDF5]">
              {current.title}
            </h2>
          </div>
          <p className="mt-2 text-xs leading-relaxed text-[#9E9E9E]">
            {current.description}
          </p>
        </div>

        <div className="flex gap-1.5">
          {steps.map((item, index) => (
            <span
              key={item.title}
              className={`h-1 flex-1 rounded-full ${
                index <= step ? 'bg-[#10B981]' : 'bg-[#1E2E26]'
              }`}
            />
          ))}
        </div>

        <div className="space-y-1.5 rounded-lg border border-[#1E2E26] bg-[#0A0A0A] p-2.5">
          {steps.map((item, index) => (
            <div
              key={item.title}
              className={`flex items-center gap-2 text-[10px] ${
                index === step ? 'text-[#E5E5E5]' : 'text-[#666666]'
              }`}
            >
              <CheckCircle2
                className={`h-3 w-3 shrink-0 ${
                  index <= step ? 'text-[#10B981]' : 'text-[#333333]'
                }`}
              />
              <span>{item.title}</span>
            </div>
          ))}
        </div>

        <div className="flex flex-wrap items-center justify-between gap-2">
          <button
            type="button"
            onClick={finish}
            className="text-[10px] font-bold text-[#9E9E9E] hover:text-[#E5E5E5]"
          >
            Omitir por ahora
          </button>
          <div className="flex items-center gap-2">
            {step > 0 && (
              <button
                type="button"
                onClick={() => setStep((value) => value - 1)}
                className="rounded-lg border border-[#1E2E26] px-2.5 py-1.5 text-[10px] font-bold text-[#CCCCCC] hover:bg-[#141414]"
              >
                Atrás
              </button>
            )}
            <button
              type="button"
              onClick={() => {
                if (step < steps.length - 1) {
                  setStep((value) => value + 1);
                } else {
                  finish();
                }
              }}
              className="inline-flex items-center gap-1.5 rounded-lg bg-[#15803D] px-3 py-1.5 text-[10px] font-bold text-black hover:bg-[#16A34A]"
            >
              {step < steps.length - 1 ? 'Siguiente' : 'Terminar'}
              <ArrowRight className="h-3 w-3" />
            </button>
          </div>
        </div>

        <button
          type="button"
          onClick={() => {
            finish();
            onNavigate(current.action);
          }}
          className="w-full rounded-lg border border-[#15803D]/40 px-2 py-1.5 text-[10px] font-bold text-[#10B981] hover:bg-[#15803D]/10"
        >
          {current.actionLabel}
        </button>
      </div>
    </Dialog>
  );
};
