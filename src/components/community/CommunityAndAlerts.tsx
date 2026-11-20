import React, { useState, useRef, useEffect } from 'react';
import { 
  Bug, 
  Users, 
  ShieldCheck, 
  Clock, 
  CornerDownRight, 
  Image as ImageIcon, 
  AtSign, 
  Send, 
  X, 
  Check, 
  AlertTriangle, 
  MapPin, 
  Plus, 
  MessageSquare,
  Sparkles,
  Timer,
  Settings,
  UserPlus,
  Trash2,
  Lock,
  ThumbsUp,
  Smile,
  Sticker,
  Heart,
  Laugh
} from 'lucide-react';
import { PestAlertEngine } from '@/components/alerts/PestAlertEngine';
import { useAppState } from '@/context/AppStateContext';
import { useLanguage } from '@/context/LanguageContext';
import { useNotification } from '@/context/NotificationContext';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { DirectMessageModal, ChatContact } from '@/components/chat/DirectMessageModal';
import { SafeImage } from '@/components/ui/SafeImage';
import { BUNDLED_CROP_IMAGES, createInitialsAvatarDataUri } from '@/lib/imageFallbacks';
import { PublicProfileModal, PublicProfileTarget } from '@/components/profile/PublicProfileModal';
import { optimizeChatImage } from '@/lib/imageOptimizer';

interface CommunityMessage {
  id: string;
  senderId: string;
  senderName: string;
  senderUsername: string;
  senderAvatar: string;
  roleBadge: string;
  text: string;
  imageUrl?: string;
  timestamp: string;
  replyTo?: {
    senderName: string;
    textSnippet: string;
  };
  likes: number;
  hasLiked?: boolean;
  sticker?: string;
  reactions?: Record<string, string[]>;
}

interface CommunityGroup {
  id: string;
  name: string;
  corregimiento: string;
  description: string;
  icon: string;
  adminId: string;
  adminName: string;
  membersCount: number;
  temporalMessagesDuration: 'OFF' | '24H' | '7D';
  pendingRequests: {
    id: string;
    name: string;
    corregimiento: string;
    avatar: string;
  }[];
}

export const CommunityAndAlerts: React.FC = () => {
  const { currentUser } = useAppState();
  const { language } = useLanguage();
  const { success, info } = useNotification();

  // Groups list
  const [groups, setGroups] = useState<CommunityGroup[]>([
    {
      id: 'GRP-01',
      name: 'Bananeros de Barú & Exportación',
      corregimiento: 'Puerto Armuelles',
      description: 'Grupo oficial de productores de Banano Cavendish y Plátano Curaré para alertas fitosanitarias y fletes.',
      icon: 'BN',
      adminId: 'USR-FARMER-01',
      adminName: 'Don Dionisio Castillo',
      membersCount: 48,
      temporalMessagesDuration: 'OFF',
      pendingRequests: [
        { id: 'REQ-01', name: 'Rodrigo A. Quintero', corregimiento: 'Progreso', avatar: createInitialsAvatarDataUri('Rodrigo A. Quintero') },
        { id: 'REQ-02', name: 'Alfonso De Gracia', corregimiento: 'Baco', avatar: createInitialsAvatarDataUri('Alfonso De Gracia') }
      ]
    },
    {
      id: 'GRP-02',
      name: 'Monitoreo Sigatoka & Bioinsumos',
      corregimiento: 'Distrito de Barú',
      description: 'Red de aviso temprano de brotes fungosos y coordinación de bio-fungicidas preventivos con MIDA.',
      icon: 'SG',
      adminId: 'USR-COOP-01',
      adminName: 'Ing. Marlenys Araúz (MIDA)',
      membersCount: 86,
      temporalMessagesDuration: '24H',
      pendingRequests: []
    },
    {
      id: 'GRP-03',
      name: 'Cacaoteros & Frutas Finas de Limones',
      corregimiento: 'Limones',
      description: 'Productores de Cacao Criollo Fino y Frutas tropicales de la península de Burica.',
      icon: 'CC',
      adminId: 'USR-FARMER-02',
      adminName: 'Doña Carmen Rosa Morales',
      membersCount: 32,
      temporalMessagesDuration: '7D',
      pendingRequests: [
        { id: 'REQ-03', name: 'Silvia Montezuma', corregimiento: 'Limones', avatar: createInitialsAvatarDataUri('Silvia Montezuma') }
      ]
    }
  ]);

  const [activeGroupId, setActiveGroupId] = useState<string>('GRP-01');
  const activeGroup = groups.find(g => g.id === activeGroupId) || groups[0];

  // Messages per group
  const [groupMessages, setGroupMessages] = useState<Record<string, CommunityMessage[]>>({
    'GRP-01': [
      {
        id: 'M1',
        senderId: 'USR-FARMER-01',
        senderName: 'Don Dionisio Castillo',
        senderUsername: '@dionisio_castillo',
        senderAvatar: createInitialsAvatarDataUri('Don Dionisio Castillo'),
        roleBadge: 'Admin • Finca Santa Clara',
        text: 'Buenas tardes compañeros. En el sector de Manaca y Baco hemos completado el embolse de 1,200 racimos con cinta azul. El calibre viene excelente para el corte de la próxima semana.',
        timestamp: '10:14 AM',
        likes: 5
      },
      {
        id: 'M2',
        senderId: 'USR-FARMER-05',
        senderName: 'Marcelino Vega',
        senderUsername: '@marcelino_vega',
        senderAvatar: createInitialsAvatarDataUri('Marcelino Vega'),
        roleBadge: 'Productor Progreso',
        text: 'Excelente @dionisio_castillo. ¿Alguien tiene camión refrigerado disponible para el jueves hacia muelle?',
        timestamp: '10:28 AM',
        replyTo: {
          senderName: 'Don Dionisio Castillo',
          textSnippet: 'En el sector de Manaca y Baco hemos completado el embolse...'
        },
        likes: 2
      },
      {
        id: 'M3',
        senderId: 'USR-COOP-01',
        senderName: 'Ing. Marlenys Araúz',
        senderUsername: '@mida_chiriqui',
        senderAvatar: createInitialsAvatarDataUri('Marlenys Arauz'),
        roleBadge: 'MIDA Chiriquí',
        text: 'Aviso a todos los agremiados: la estación meteorológica de Barú registró 92% de humedad esta madrugada. Favor verificar drenajes y aplicar caldo bordelés o bioinsumo Bacillus.',
        imageUrl: BUNDLED_CROP_IMAGES.banana,
        timestamp: '11:05 AM',
        likes: 8
      }
    ]
  });

  // Message input state
  const [inputText, setInputText] = useState('');
  const [replyingTo, setReplyingTo] = useState<CommunityMessage | null>(null);
  const [attachedImage, setAttachedImage] = useState<string | null>(null);
  const [isAdminPanelOpen, setIsAdminPanelOpen] = useState(false);
  const [selectedChatContact, setSelectedChatContact] = useState<ChatContact | null>(null);
  const [activePublicProfile, setActivePublicProfile] = useState<PublicProfileTarget | null>(null);
  const [isStickerPanelOpen, setIsStickerPanelOpen] = useState(false);
  const [messagesHydrated, setMessagesHydrated] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const feedEndRef = useRef<HTMLDivElement>(null);

  const currentMessages = groupMessages[activeGroupId] || [];
  const isAdmin = currentUser.name.includes('Dionisio') || currentUser.role === 'cooperative';

  useEffect(() => {
    try {
      const saved = localStorage.getItem('agrobaru_community_messages_v1');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && typeof parsed === 'object') setGroupMessages(parsed);
      }
    } catch {}
    setMessagesHydrated(true);
  }, []);

  useEffect(() => {
    if (!messagesHydrated) return;
    try {
      localStorage.setItem('agrobaru_community_messages_v1', JSON.stringify(groupMessages));
    } catch {}
  }, [groupMessages, messagesHydrated]);

  useEffect(() => {
    const container = messagesContainerRef.current;
    if (container) container.scrollTop = container.scrollHeight;
  }, [activeGroupId, currentMessages.length]);

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() && !attachedImage) return;

    const newMsg: CommunityMessage = {
      id: `MSG-${Date.now()}`,
      senderId: currentUser.id,
      senderName: currentUser.name,
      senderUsername: currentUser.username || `@${currentUser.name.toLowerCase().replace(/\s+/g, '_')}`,
      senderAvatar: currentUser.photoURL || createInitialsAvatarDataUri(currentUser.name),
      roleBadge: currentUser.role === 'farmer' ? 'Productor Barú' : currentUser.role === 'buyer' ? 'Comprador' : 'Inspector MIDA',
      text: inputText.trim(),
      imageUrl: attachedImage || undefined,
      sticker: undefined,
      reactions: {},
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      replyTo: replyingTo ? {
        senderName: replyingTo.senderName,
        textSnippet: replyingTo.text.length > 55 ? replyingTo.text.substring(0, 55) + '...' : replyingTo.text
      } : undefined,
      likes: 0
    };

    setGroupMessages(prev => ({
      ...prev,
      [activeGroupId]: [...(prev[activeGroupId] || []), newMsg]
    }));

    setInputText('');
    setReplyingTo(null);
    setAttachedImage(null);
    success('Mensaje Publicado', 'Tu aporte se ha compartido con la comunidad del grupo.');
  };

  const handleToggleLike = (msgId: string) => {
    setGroupMessages(prev => ({
      ...prev,
      [activeGroupId]: (prev[activeGroupId] || []).map(m => {
        if (m.id !== msgId) return m;
        return {
          ...m,
          likes: m.hasLiked ? m.likes - 1 : m.likes + 1,
          hasLiked: !m.hasLiked
        };
      })
    }));
  };

  const handleToggleReaction = (msgId: string, emoji: string) => {
    setGroupMessages((prev) => ({
      ...prev,
      [activeGroupId]: (prev[activeGroupId] || []).map((message) => {
        if (message.id !== msgId) return message;
        const reactions = { ...(message.reactions || {}) };
        const users = reactions[emoji] || [];
        const alreadyReacted = users.includes(currentUser.id);
        const nextUsers = alreadyReacted
          ? users.filter((id) => id !== currentUser.id)
          : [...users, currentUser.id];
        if (nextUsers.length === 0) delete reactions[emoji];
        else reactions[emoji] = nextUsers;
        return { ...message, reactions };
      }),
    }));
  };

  const handleSendSticker = (sticker: string) => {
    const newMsg: CommunityMessage = {
      id: `MSG-${Date.now()}`,
      senderId: currentUser.id,
      senderName: currentUser.name,
      senderUsername: currentUser.username || `@${currentUser.name.toLowerCase().replace(/\s+/g, '_')}`,
      senderAvatar: currentUser.photoURL || createInitialsAvatarDataUri(currentUser.name),
      roleBadge: currentUser.role === 'farmer' ? 'Productor Barú' : currentUser.role === 'buyer' ? 'Comprador' : 'Inspector MIDA',
      text: '',
      sticker,
      reactions: {},
      likes: 0,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };
    setGroupMessages((prev) => ({
      ...prev,
      [activeGroupId]: [...(prev[activeGroupId] || []), newMsg],
    }));
    setIsStickerPanelOpen(false);
  };

  const handleOpenAuthorProfile = (msg: CommunityMessage) => {
    setActivePublicProfile({
      id: msg.senderId,
      name: msg.senderName,
      avatar: msg.senderAvatar,
      role: msg.roleBadge,
      location: activeGroup.corregimiento,
    });
  };

  const handleApproveMember = (reqId: string, memberName: string) => {
    setGroups(prev => prev.map(g => {
      if (g.id !== activeGroupId) return g;
      return {
        ...g,
        membersCount: g.membersCount + 1,
        pendingRequests: g.pendingRequests.filter(r => r.id !== reqId)
      };
    }));
    success('Miembro Aprobado', `${memberName} ahora tiene acceso al grupo.`);
  };

  const handleRejectMember = (reqId: string) => {
    setGroups(prev => prev.map(g => {
      if (g.id !== activeGroupId) return g;
      return {
        ...g,
        pendingRequests: g.pendingRequests.filter(r => r.id !== reqId)
      };
    }));
    info('Solicitud Descartada', 'La solicitud de ingreso ha sido removida.');
  };

  const handleSetTemporalDuration = (duration: 'OFF' | '24H' | '7D') => {
    setGroups(prev => prev.map(g => {
      if (g.id !== activeGroupId) return g;
      return { ...g, temporalMessagesDuration: duration };
    }));
    success('Mensajes Temporales Actualizados', `Configuración para ${activeGroup.name}: ${duration}`);
  };

  const handleAttachImage = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const preview = URL.createObjectURL(file);
    setAttachedImage(preview);
    // La compresión ocurre en segundo plano; la vista previa aparece al instante.
    optimizeChatImage(file)
      .then((optimized) => {
        setAttachedImage((current) => (current === preview ? optimized.dataUrl : current));
      })
      .catch(() => {})
      .finally(() => URL.revokeObjectURL(preview));
    e.target.value = '';
  };

  const [activeSection, setActiveSection] = useState<'ALERTS' | 'COMMUNITY'>('ALERTS');

  return (
    <div className="space-y-6 font-mono">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b-2 border-[#15803D] pb-4">
        <div>
          <div className="flex items-center gap-2">
            <Badge variant="live-green" pulse>BARÚ CONECTADO</Badge>
            <Badge variant="outline">MIDA & PRODUCTORES</Badge>
          </div>
          <h2 className="font-display font-bold text-2xl text-[#E5E5E5] uppercase tracking-normal leading-snug mt-1">
            Centro de Alertas Fitosanitarias & Comunidad Agrícola
          </h2>
          <p className="text-xs text-[#9E9E9E] font-sans">
            Alterna entre el radar microclimático de Sigatoka Negra y los grupos administrados de agricultores estilo WhatsApp.
          </p>
        </div>
      </div>

      {/* TOP VIEW SWITCHER: ALERTS (DEFAULT) vs COMMUNITY */}
      <div className="bg-[#111714] border border-[#1E2E26] rounded-xl p-2.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-sm">
        <div className="flex items-center gap-2">
          <span className="text-xs text-[#9E9E9E] font-bold uppercase pl-2">
            Seleccionar Vista:
          </span>
        </div>

        <div className="flex flex-wrap gap-2 sm:items-center">
          <button
            type="button"
            onClick={() => setActiveSection('ALERTS')}
            className={`flex-1 sm:flex-initial min-w-[140px] px-4 py-2 rounded-lg text-xs font-bold uppercase leading-snug transition-all flex items-center justify-center gap-2 ${
              activeSection === 'ALERTS'
                ? 'bg-[#10B981] text-[#05100A] border border-[#10B981]'
                : 'bg-[#090D0B] text-[#9E9E9E] border border-[#1E2E26] hover:text-[#E5E5E5]'
            }`}
          >
            <Bug className="w-4 h-4 shrink-0" />
            <span>Alertas Fitosanitarias</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveSection('COMMUNITY')}
            className={`flex-1 sm:flex-initial min-w-[140px] px-4 py-2 rounded-lg text-xs font-bold uppercase leading-snug transition-all flex items-center justify-center gap-2 ${
              activeSection === 'COMMUNITY'
                ? 'bg-[#FACC15] text-[#05100A] border border-[#FACC15]'
                : 'bg-[#090D0B] text-[#9E9E9E] border border-[#1E2E26] hover:text-[#E5E5E5]'
            }`}
          >
            <Users className="w-4 h-4 shrink-0" />
            <span>Comunidad</span>
          </button>
        </div>
      </div>

      {/* VIEW 1: RADAR & ALERTAS FITOSANITARIAS (FULL WIDTH - DEFAULT) */}
      {activeSection === 'ALERTS' && (
        <div className="space-y-4 animate-fadeIn">
          <div className="bg-[#111714] border border-[#1E2E26] rounded-xl p-6 shadow-sm">
            <PestAlertEngine />
          </div>
        </div>
      )}

      {/* VIEW 2: WHATSAPP-STYLE MANAGED COMMUNITY (FULL WIDTH) */}
      {activeSection === 'COMMUNITY' && (
        <div className="bg-[#111714] border border-[#1E2E26] rounded-xl overflow-hidden shadow-md flex flex-col min-h-[540px] max-h-[82vh] h-[640px] animate-fadeIn">
          {/* Group Header & Admin Controls */}
          <div className="bg-[#141414] border-b border-[#1E293B] p-3.5 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2.5 min-w-0 flex-1">
              <div className="w-8 h-8 rounded-none bg-[#15803D]/20 border border-[#15803D] flex items-center justify-center shrink-0">
                <ShieldCheck className="w-4 h-4 text-[#15803D]" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="font-display font-black text-sm text-[#E5E5E5] truncate uppercase">
                    {activeGroup.name}
                  </h3>
                  {activeGroup.temporalMessagesDuration !== 'OFF' && (
                    <Badge variant="yellow" className="text-[8px] py-0 px-1 flex items-center gap-0.5 shrink-0">
                      <Timer className="w-2.5 h-2.5" />
                      {activeGroup.temporalMessagesDuration}
                    </Badge>
                  )}
                </div>
                <p className="text-[10px] text-[#9E9E9E] truncate">
                  {activeGroup.membersCount} miembros • Admin: <strong className="text-[#15803D]">{activeGroup.adminName}</strong>
                </p>
              </div>
            </div>

            {/* Admin Controls Toggle */}
            <div className="flex items-center gap-1.5 shrink-0">
              {isAdmin && (
                <button
                  onClick={() => setIsAdminPanelOpen(!isAdminPanelOpen)}
                  className={`px-2 py-1 text-[10px] font-bold border transition-all flex items-center gap-1 ${
                    isAdminPanelOpen 
                      ? 'bg-[#FACC15] text-black border-[#FACC15]' 
                      : 'bg-[#0E0E0E] text-[#FACC15] border-[#FACC15] hover:bg-[#FACC15] hover:text-black'
                  }`}
                  title="Panel de Administración del Grupo"
                >
                  <Settings className="w-3 h-3" />
                  <span className="hidden sm:inline">Admin Grupo</span>
                  {activeGroup.pendingRequests.length > 0 && (
                    <span className="w-2 h-2 rounded-full bg-[#F97316]" />
                  )}
                </button>
              )}
            </div>
          </div>

          {/* Group Channel Switcher Tabs */}
          <div className="bg-[#0A0A0A] border-b border-[#1E293B] p-2 flex items-center gap-1 overflow-x-auto">
            {groups.map((g) => (
              <button
                key={g.id}
                onClick={() => {
                  setActiveGroupId(g.id);
                  setReplyingTo(null);
                }}
                className={`px-3 py-1 text-[10px] font-bold uppercase transition-all shrink-0 flex items-center gap-1.5 ${
                  activeGroupId === g.id
                    ? 'bg-[#15803D] text-black border border-[#15803D]'
                    : 'bg-[#141414] text-[#9E9E9E] border border-[#1E293B] hover:text-[#E5E5E5]'
                }`}
              >
                <Users className="w-3 h-3" />
                <span className="truncate max-w-[130px]">{g.name}</span>
              </button>
            ))}
          </div>

          {/* ADMIN SLIDE-DOWN DRAWER: Pending approvals and temporal message duration */}
          {isAdminPanelOpen && (
            <div className="bg-[#121212] border-b-2 border-[#FACC15] p-3.5 space-y-3 animate-fadeIn text-xs">
              <div className="flex items-center justify-between border-b border-[#1E293B] pb-1.5">
                <span className="font-bold text-[#FACC15] flex items-center gap-1 text-[11px] uppercase">
                  <ShieldCheck className="w-3.5 h-3.5" /> Administración del Grupo (Permisos de Creador)
                </span>
                <button onClick={() => setIsAdminPanelOpen(false)} className="text-[#666666] hover:text-white">
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Setting 1: Temporal Messages Duration */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 bg-[#0A0A0A] p-2.5 border border-[#1E293B]">
                <div>
                  <div className="font-bold text-[#E5E5E5] text-[11px] flex items-center gap-1">
                    <Timer className="w-3 h-3 text-[#15803D]" /> Mensajes Temporales (Autodestrucción):
                  </div>
                  <div className="text-[10px] text-[#9E9E9E]">Los mensajes viejos se purgan para mantener el muro liviano.</div>
                </div>

                <div className="flex items-center gap-1 shrink-0">
                  {(['OFF', '24H', '7D'] as const).map((dur) => (
                    <button
                      key={dur}
                      onClick={() => handleSetTemporalDuration(dur)}
                      className={`px-2.5 py-1 text-[10px] font-bold border ${
                        activeGroup.temporalMessagesDuration === dur
                          ? 'bg-[#15803D] text-black border-[#15803D]'
                          : 'bg-[#141414] text-[#9E9E9E] border-[#1E293B] hover:text-white'
                      }`}
                    >
                      {dur === 'OFF' ? 'Desactivado' : dur}
                    </button>
                  ))}
                </div>
              </div>

              {/* Setting 2: Pending Approval Requests */}
              <div className="space-y-1.5">
                <div className="text-[11px] font-bold text-[#CCCCCC] flex items-center justify-between">
                  <span>Solicitudes de Ingreso Pendientes:</span>
                  <Badge variant="outline" className="text-[9px]">{activeGroup.pendingRequests.length}</Badge>
                </div>

                {activeGroup.pendingRequests.length > 0 ? (
                  <div className="space-y-1.5 max-h-36 overflow-y-auto">
                    {activeGroup.pendingRequests.map((req) => (
                      <div 
                        key={req.id}
                        className="bg-[#0A0A0A] p-2 border border-[#1E293B] flex items-center justify-between gap-2"
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <SafeImage src={req.avatar} alt={req.name} fallbackType="avatar" nameHint={req.name} className="w-6 h-6 object-cover border border-[#15803D] shrink-0" />
                          <div className="min-w-0">
                            <div className="font-bold text-[#E5E5E5] text-[11px] truncate">{req.name}</div>
                            <div className="text-[9px] text-[#9E9E9E]">{req.corregimiento}, Barú</div>
                          </div>
                        </div>

                        <div className="flex items-center gap-1 shrink-0">
                          <button
                            onClick={() => handleApproveMember(req.id, req.name)}
                            className="px-2 py-0.5 bg-[#15803D] text-black font-bold text-[10px] hover:bg-[#15803D]/80 flex items-center gap-0.5"
                          >
                            <Check className="w-3 h-3" /> Aprobar
                          </button>
                          <button
                            onClick={() => handleRejectMember(req.id)}
                            className="px-2 py-0.5 bg-[#141414] text-[#F97316] border border-[#F97316] text-[10px] hover:bg-[#F97316] hover:text-black"
                          >
                            Rechazar
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-[10px] text-[#666666] bg-[#0A0A0A] p-2 border border-[#1E293B]">
                    No hay solicitudes pendientes en este grupo.
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Group Messages Feed */}
          <div ref={messagesContainerRef} className="flex-1 p-4 overflow-y-auto space-y-4 bg-[#0A0A0A]/85 text-xs">
            <div className="text-center">
              <span className="bg-[#141414] text-[#9E9E9E] px-3 py-1 text-[9px] border border-[#1E293B] inline-flex items-center gap-1.5">
                <ShieldCheck className="w-3 h-3 text-[#15803D]" />
                <span>Grupo Agrario Moderado • {activeGroup.description}</span>
              </span>
            </div>

            {currentMessages.map((msg) => (
              <div 
                key={msg.id}
                className="bg-[#121212] border border-[#1E293B] hover:border-[#15803D]/60 p-3 space-y-2 transition-all shadow-[2px_2px_0px_0px_#141414]"
              >
                {/* Embedded Thread Reply Quote */}
                {msg.replyTo && (
                  <div className="bg-[#0A0A0A] border-l-2 border-[#FACC15] p-2 text-[10px] text-[#9E9E9E] space-y-0.5">
                    <div className="text-[#FACC15] font-bold flex items-center gap-1">
                      <CornerDownRight className="w-2.5 h-2.5" />
                      <span>Respuesta a {msg.replyTo.senderName}</span>
                    </div>
                    <p className="italic line-clamp-1">{msg.replyTo.textSnippet}</p>
                  </div>
                )}

                {/* Message Header */}
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <SafeImage
                      src={msg.senderAvatar}
                      alt={msg.senderName}
                      fallbackType="avatar"
                      nameHint={msg.senderName}
                      className="w-7 h-7 object-cover border border-[#15803D] cursor-pointer shrink-0"
                      onClick={() => handleOpenAuthorProfile(msg)}
                    />
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <span
                          onClick={() => handleOpenAuthorProfile(msg)}
                          className="font-bold text-[#E5E5E5] hover:text-[#15803D] cursor-pointer"
                        >
                          {msg.senderName}
                        </span>
                        <span className="text-[9px] text-[#FACC15]">{msg.senderUsername}</span>
                      </div>
                      <div className="text-[9px] text-[#666666]">{msg.roleBadge}</div>
                    </div>
                  </div>

                  <span className="text-[9px] text-[#666666] shrink-0">{msg.timestamp}</span>
                </div>

                {/* Message Body */}
                {msg.text && (
                  <p className="font-sans text-xs text-[#CCCCCC] leading-relaxed whitespace-pre-wrap">
                    {msg.text}
                  </p>
                )}

                {msg.sticker && (
                  <div className="text-5xl leading-none py-1 select-none" aria-label={`Sticker ${msg.sticker}`}>
                    {msg.sticker}
                  </div>
                )}

                {msg.reactions && Object.keys(msg.reactions).length > 0 && (
                  <div className="flex flex-wrap items-center gap-1">
                    {Object.entries(msg.reactions).map(([emoji, users]) => (
                      <button
                        key={emoji}
                        type="button"
                        onClick={() => handleToggleReaction(msg.id, emoji)}
                        className="flex items-center gap-1 bg-[#0A0A0A] border border-[#15803D]/40 px-1.5 py-0.5 text-[10px] hover:border-[#15803D]"
                      >
                        <span>{emoji}</span>
                        <span className="text-[#9E9E9E] font-bold">{users.length}</span>
                      </button>
                    ))}
                  </div>
                )}

                {/* Attached Image */}
                {msg.imageUrl && (
                  <div className="mt-2 border border-[#1E293B] overflow-hidden max-w-sm">
                    <SafeImage
                      src={msg.imageUrl}
                      alt="Evidencia de campo"
                      fallbackType="product"
                      cropHint="banano"
                      className="w-full h-auto object-cover"
                    />
                  </div>
                )}

                {/* Message Actions: Reply, Like & DM */}
                <div className="pt-2 border-t border-[#1E293B]/60 flex flex-wrap items-center justify-between gap-2 text-[10px]">
                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      onClick={() => handleToggleLike(msg.id)}
                      className={`flex items-center gap-1 font-bold ${
                        msg.hasLiked ? 'text-[#15803D]' : 'text-[#666666] hover:text-[#E5E5E5]'
                      }`}
                      title="Me gusta"
                    >
                      <ThumbsUp className="w-3 h-3" />
                      <span>{msg.likes > 0 && msg.likes}</span>
                    </button>

                    <div className="flex items-center gap-1 bg-[#0A0A0A] border border-[#1E293B] px-1 py-0.5">
                      {['👍', '❤️', '😂', '🙏'].map((emoji) => (
                        <button
                          key={emoji}
                          type="button"
                          onClick={() => handleToggleReaction(msg.id, emoji)}
                          className="text-[13px] leading-none hover:scale-125 transition-transform px-0.5"
                          title={`Reaccionar con ${emoji}`}
                        >
                          {emoji}
                        </button>
                      ))}
                    </div>

                    <button
                      onClick={() => setReplyingTo(msg)}
                      className="text-[#9E9E9E] hover:text-[#FACC15] flex items-center gap-1"
                    >
                      <CornerDownRight className="w-3 h-3 text-[#FACC15]" />
                      <span>Responder</span>
                    </button>
                  </div>

                  {msg.senderId !== currentUser.id && (
                    <button
                      onClick={() => setSelectedChatContact({
                        id: msg.senderId,
                        name: msg.senderName,
                        corregimiento: activeGroup.corregimiento,
                        avatar: msg.senderAvatar
                      })}
                      className="text-[10px] text-[#15803D] hover:underline flex items-center gap-1"
                    >
                      <MessageSquare className="w-3 h-3" />
                      <span>Mensaje Privado</span>
                    </button>
                  )}
                </div>
              </div>
            ))}
            <div ref={feedEndRef} />
          </div>

          {/* Active Reply Banner */}
          {replyingTo && (
            <div className="bg-[#161616] border-t border-l-4 border-[#FACC15] p-2 flex items-center justify-between text-xs font-mono">
              <div className="min-w-0">
                <span className="text-[#FACC15] font-bold text-[10px] block">
                  Respondiendo directamente a {replyingTo.senderName}:
                </span>
                <p className="text-[10px] text-[#CCCCCC] truncate italic">"{replyingTo.text}"</p>
              </div>
              <button 
                onClick={() => setReplyingTo(null)}
                className="text-[#666666] hover:text-white p-1 shrink-0"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {/* Image Attachment Preview */}
          {attachedImage && (
            <div className="bg-[#141414] border-t border-[#15803D] p-2 flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <SafeImage src={attachedImage} alt="Preview" fallbackType="product" className="w-8 h-8 object-cover border border-[#15803D]" />
                <span className="text-[10px] text-[#15803D]">Foto adjunta lista para enviar</span>
              </div>
              <button onClick={() => setAttachedImage(null)} className="text-[#F97316] hover:text-white">
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {/* Sticker Picker */}
          {isStickerPanelOpen && (
            <div className="border-t border-[#FACC15]/30 bg-[#121212] p-2 animate-fadeIn">
              <div className="flex items-center justify-between mb-1.5 px-0.5">
                <span className="font-mono text-[9px] font-bold uppercase text-[#FACC15]">Stickers de campo</span>
                <button type="button" onClick={() => setIsStickerPanelOpen(false)} className="text-[#666666] hover:text-white">
                  <X className="w-3 h-3" />
                </button>
              </div>
              <div className="grid grid-cols-8 gap-1">
                {['🌱', '🍌', '🌾', '🚜', '💧', '☀️', '📦', '✅'].map((sticker) => (
                  <button
                    key={sticker}
                    type="button"
                    onClick={() => handleSendSticker(sticker)}
                    className="text-xl sm:text-2xl py-1 border border-[#1E293B] bg-[#0A0A0A] hover:border-[#FACC15] hover:scale-110 transition-all"
                    title={`Enviar ${sticker}`}
                  >
                    {sticker}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Message Input Box */}
          <form onSubmit={handleSendMessage} className="p-3 border-t border-[#1E293B] bg-[#0E0E0E] flex items-center gap-2">
            <button
              type="button"
              onClick={() => setIsStickerPanelOpen((open) => !open)}
              className={`p-1.5 border bg-[#141414] ${isStickerPanelOpen ? 'text-[#FACC15] border-[#FACC15]' : 'text-[#666666] border-[#1E293B] hover:text-[#FACC15]'}`}
              title="Abrir stickers"
            >
              <Sticker className="w-4 h-4" />
            </button>

            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="text-[#666666] hover:text-[#FACC15] p-1.5 border border-[#1E293B] bg-[#141414]"
              title="Adjuntar foto de cultivo o plaga"
            >
              <ImageIcon className="w-4 h-4" />
            </button>
            <input 
              type="file" 
              ref={fileInputRef} 
              onChange={handleAttachImage} 
              accept="image/*" 
              className="hidden" 
            />

            <button
              type="button"
              onClick={() => setInputText(prev => prev + '@')}
              className="text-[#666666] hover:text-[#15803D] p-1.5 border border-[#1E293B] bg-[#141414]"
              title="Etiquetar @usuario"
            >
              <AtSign className="w-4 h-4" />
            </button>

            <Input
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder={`Escribe a ${activeGroup.name}...`}
              className="font-mono text-xs border-[#1E293B] focus-visible:border-[#15803D]"
            />

            <Button 
              type="submit" 
              variant="default"
              size="sm"
              className="px-4 font-bold flex items-center gap-1.5 shrink-0"
            >
              <Send className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Enviar</span>
            </Button>
          </form>
        </div>
      )}

      {/* Perfil público del autor del mensaje (solo lectura para otros usuarios) */}
      <PublicProfileModal
        open={!!activePublicProfile}
        target={activePublicProfile}
        onClose={() => setActivePublicProfile(null)}
      />

      {/* Direct Private Message Modal */}
      <DirectMessageModal
        isOpen={!!selectedChatContact}
        onClose={() => setSelectedChatContact(null)}
        contact={selectedChatContact}
      />
    </div>
  );
};
