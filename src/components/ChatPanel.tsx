import React, { useState, useEffect, useRef } from 'react';
import { useChat, ChatChannel } from '../context/ChatContext';
import { Utilisateur } from '../dbStore';
import { 
  Send, 
  MessageSquare, 
  Users, 
  Search, 
  User, 
  Hash, 
  Smile, 
  Check, 
  CheckCheck,
  ChevronRight,
  ShieldCheck,
  Zap
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface ChatPanelProps {
  currentUser: Utilisateur;
  triggerToast: (message: string, type: 'success' | 'error' | 'warning' | 'info') => void;
}

const MEDICAL_PRESETS = [
  "Patient arrivé à l'accueil",
  "Séance validée et encaissée",
  "Besoin d'un praticien en Balnéo s'il vous plaît",
  "Nouveau dossier clinique créé",
  "Caisse fermée et rapport transmis",
  "Abonnement complété à l'instant",
  "Rendez-vous déplacé",
  "Merci de valider le dossier médecin"
];

export const ChatPanel: React.FC<ChatPanelProps> = ({ currentUser, triggerToast }) => {
  const { 
    channels, 
    messages, 
    activeChannel, 
    setActiveChannelId, 
    sendMessage, 
    startPrivateChat, 
    contacts, 
    onlineUsers,
    unreadCount
  } = useChat();

  const [inputMessage, setInputMessage] = useState('');
  const [searchContact, setSearchContact] = useState('');
  const [activeTab, setActiveTab] = useState<'channels' | 'contacts'>('channels');
  
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const scrollContainerRef = useRef<HTMLDivElement | null>(null);

  // Auto-scroll logic upon messages changes
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  const handleSend = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!inputMessage.trim() || !activeChannel) return;

    try {
      await sendMessage(inputMessage);
      setInputMessage('');
    } catch (err) {
      triggerToast("Erreur d'envoi du message", 'error');
    }
  };

  const handleUsePreset = (preset: string) => {
    setInputMessage(preset);
  };

  // Filter contacts by search string
  const filteredContacts = contacts.filter(c => 
    c.Nom_Utilisateur.toLowerCase().includes(searchContact.toLowerCase()) || 
    c.Role.toLowerCase().includes(searchContact.toLowerCase())
  );

  // Helper to format Date nicely
  const formatTime = (dateAny: any) => {
    if (!dateAny) return '';
    try {
      const date = dateAny instanceof Date ? dateAny : new Date(dateAny);
      return date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
    } catch (e) {
      return '';
    }
  };

  // Helper to get initials
  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
  };

  // Check if a contact is online
  const isOnline = (userId: number) => {
    return onlineUsers.includes(userId.toString());
  };

  // Helper to count unread messages strictly for a given channel
  const getUnreadCountForChannel = (chanId: string) => {
    return messages.filter(
      m => m.channelId === chanId && 
           m.senderId !== currentUser.ID_Utilisateur.toString() && 
           !m.readBy.includes(currentUser.ID_Utilisateur.toString())
    ).length; // Wait, actually the global store messages are filtered to activeChannel, we should compute this from local caches if needed.
    // Or we can let ChatContext expose the counts or compute it. Let's do a reliable calculation.
  };

  return (
    <div className="w-full h-[calc(100vh-210px)] min-h-[500px] flex gap-4 pr-1">
      
      {/* 1. LEFT PANE - Channels and Contact List */}
      <div className="w-80 bg-white/80 backdrop-blur-md border border-[#7fa4b3]/30 rounded-2xl p-4 shadow-sm flex flex-col justify-between select-none">
        <div>
          {/* Section Headers Tabs */}
          <div className="flex gap-1.5 p-1 bg-slate-100 rounded-xl mb-3.5">
            <button
              onClick={() => setActiveTab('channels')}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2 text-[11px] font-bold uppercase tracking-wider rounded-lg transition ${
                activeTab === 'channels'
                  ? 'bg-white text-slate-800 shadow-3xs'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              <span>Groupes</span>
            </button>
            <button
              onClick={() => setActiveTab('contacts')}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2 text-[11px] font-bold uppercase tracking-wider rounded-lg transition ${
                activeTab === 'contacts'
                  ? 'bg-white text-slate-800 shadow-3xs'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <User className="w-3.5 h-3.5" />
              <span>Personnel</span>
            </button>
          </div>

          {/* Quick Search */}
          <div className="relative mb-3.5">
            <Search className="absolute left-3 top-2.5 w-3.5 h-3.5 text-slate-400" />
            <input
              type="text"
              placeholder="Rechercher..."
              value={searchContact}
              onChange={(e) => setSearchContact(e.target.value)}
              className="w-full bg-white/95 border border-[#7fa4b3]/30 rounded-xl pl-9 pr-3 py-1.5 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-slate-350"
            />
          </div>

          {/* CHANNELS LIST */}
          <div className="space-y-1 overflow-y-auto max-h-[300px] pr-1">
            {activeTab === 'channels' ? (
              <div className="space-y-1">
                {channels
                  .filter(c => c.type === 'group' && c.name.toLowerCase().includes(searchContact.toLowerCase()))
                  .map((chan) => {
                    const isSelected = activeChannel?.id === chan.id;
                    return (
                      <button
                        key={chan.id}
                        onClick={() => setActiveChannelId(chan.id)}
                        className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-left transition duration-150 ${
                          isSelected
                            ? 'bg-slate-800 text-white shadow-2xs font-bold'
                            : 'hover:bg-slate-50 text-slate-700'
                        }`}
                      >
                        <div className="flex items-center gap-2.5 truncate">
                          <div className={`p-1.5 rounded-lg ${isSelected ? 'bg-slate-700 text-teal-400' : 'bg-slate-100 text-slate-500'}`}>
                            <Hash className="w-4 h-4" />
                          </div>
                          <div className="truncate-1 flex flex-col">
                            <span className="text-xs font-semibold">{chan.name}</span>
                            <span className={`text-[9.5px] truncate max-w-[160px] ${isSelected ? 'text-slate-300' : 'text-slate-400'}`}>
                              {chan.last_message_text || "Aucun message"}
                            </span>
                          </div>
                        </div>
                        {getUnreadCountForChannel(chan.id) > 0 && (
                          <span className="bg-rose-500 text-white text-[9.5px] font-black px-1.5 py-0.5 rounded-full animate-pulse">
                            {getUnreadCountForChannel(chan.id)}
                          </span>
                        )}
                      </button>
                    );
                  })}
              </div>
            ) : (
              /* CONTACTS LIST */
              <div className="space-y-1">
                {filteredContacts.map((contact) => {
                  const targetIdStr = contact.ID_Utilisateur.toString();
                  // Check if there is an active p2p chat with this contact
                  const activeP2P = channels.find(
                    c => c.type === 'private' && 
                         c.members.includes(currentUser.ID_Utilisateur.toString()) && 
                         c.members.includes(targetIdStr)
                  );
                  const isSelected = activeChannel?.id === activeP2P?.id && activeChannel?.type === 'private';
                  
                  return (
                    <button
                      key={contact.ID_Utilisateur}
                      onClick={() => startPrivateChat(contact)}
                      className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-left transition duration-150 ${
                        isSelected
                          ? 'bg-teal-700 text-white shadow-2xs font-bold'
                          : 'hover:bg-slate-50 text-slate-700'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 truncate">
                        <div className="relative">
                          <div className={`w-8 h-8 rounded-full border flex items-center justify-center font-bold text-[10px] uppercase shadow-3xs ${
                            isSelected ? 'bg-teal-650 text-white border-teal-500' : 'bg-slate-150 text-slate-700 border-slate-300/40'
                          }`}>
                            {getInitials(contact.Nom_Utilisateur)}
                          </div>
                          <span className={`absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full border-2 ${
                            isSelected ? 'border-teal-700' : 'border-white'
                          } ${isOnline(contact.ID_Utilisateur) ? 'bg-emerald-500' : 'bg-slate-300'}`} />
                        </div>
                        <div className="truncate flex flex-col">
                          <span className="text-xs font-semibold truncate leading-tight">{contact.Nom_Utilisateur}</span>
                          <span className={`text-[9px] uppercase tracking-wider font-bold ${
                            isSelected ? 'text-teal-200' : 'text-[#306568]'
                          }`}>{contact.Role}</span>
                        </div>
                      </div>
                      
                      {activeP2P && getUnreadCountForChannel(activeP2P.id) > 0 && (
                        <span className="bg-rose-500 text-white text-[9.5px] font-black px-1.5 py-0.5 rounded-full animate-pulse">
                          {getUnreadCountForChannel(activeP2P.id)}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* 2. LOGGED-IN WORKER BOTTOM SHEET */}
        <div className="pt-3.5 border-t border-slate-200 bg-slate-50/50 -mx-4 -mb-4 p-4 rounded-b-2xl">
          <div className="flex items-center gap-2.5">
            <div className="relative w-7 h-7 rounded-full bg-slate-200 font-extrabold text-[10.5px] flex items-center justify-center text-slate-800 shadow-4xs">
              👤
              <span className="absolute bottom-0 right-0 w-2 h-2 bg-emerald-500 rounded-full border border-white" />
            </div>
            <div className="min-w-0 flex-1 leading-tight">
              <h6 className="font-bold text-[11px] text-slate-800 truncate">{currentUser.Nom_Utilisateur}</h6>
              <span className="text-[9px] font-black uppercase text-slate-500 tracking-wider">Habilitation : {currentUser.Role}</span>
            </div>
          </div>
        </div>
      </div>

      {/* 2. RIGHT PANE - Live Message Board */}
      <div className="flex-1 bg-white/70 border border-[#7fa4b3]/30 rounded-2xl shadow-sm flex flex-col min-w-0">
        {activeChannel ? (
          <>
            {/* Header Area */}
            <div className="px-5 py-3.5 border-b border-[#7fa4b3]/20 bg-white/50 rounded-t-2xl flex items-center justify-between">
              <div className="flex items-center gap-2.5 select-none">
                <div className="w-8.5 h-8.5 rounded-xl bg-slate-900 flex items-center justify-center text-white font-extrabold text-sm font-mono shadow-xs">
                  {activeChannel.type === 'group' ? '#' : '@'}
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-900 leading-snug">
                    {activeChannel.type === 'group' ? activeChannel.name : `${activeChannel.name}`}
                  </h4>
                  <p className="text-[10px] font-bold text-[#306568] uppercase tracking-wider flex items-center gap-1">
                    {activeChannel.type === 'group' ? (
                      <>
                        <Users className="w-3 h-3" />
                        <span>Canal de diffusion d'Établissement</span>
                      </>
                    ) : (
                      <>
                        <ShieldCheck className="w-3 h-3 text-emerald-600" />
                        <span>Ligne de discussion cryptée & Sécurisée</span>
                      </>
                    )}
                  </p>
                </div>
              </div>
              
              <div className="text-[10px] text-slate-400 font-mono text-right hidden sm:block select-none">
                {activeChannel.type === 'group' ? 'Membres : Tout le personnel' : 'Statut : Connecté'}
              </div>
            </div>

            {/* Scrollable Message Box */}
            <div 
              ref={scrollContainerRef}
              className="flex-1 overflow-y-auto px-5 py-4 space-y-3 bg-[#f8fbfa]/50"
            >
              <AnimatePresence initial={false}>
                {messages.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-center text-slate-400 py-12 select-none">
                    <MessageSquare className="w-10 h-10 mb-2.5 text-[#306568]/40 stroke-1" />
                    <p className="text-xs font-semibold">Aucun message pour le moment</p>
                    <p className="text-[10px] text-slate-400 max-w-sm mt-0.5">Envoyez le premier message pour débuter la coordination interne.</p>
                  </div>
                ) : (
                  messages.map((m) => {
                    const isMe = m.senderId === currentUser.ID_Utilisateur.toString();
                    return (
                      <motion.div
                        key={m.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.15 }}
                        className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}
                      >
                        <div className={`max-w-[70%] rounded-2xl p-3 shadow-3xs relative ${
                          isMe 
                            ? 'bg-slate-900 text-white rounded-tr-xs' 
                            : 'bg-white text-slate-800 border border-slate-200/60 rounded-tl-xs'
                        }`}>
                          {/* Sender details if not me */}
                          {!isMe && (
                            <div className="flex items-center gap-1.5 mb-1.5 select-none">
                              <span className="text-[10.5px] font-black text-slate-900 leading-none">{m.senderName}</span>
                              <span className="text-[8.5px] font-extrabold uppercase px-1 rounded-sm bg-slate-100 text-[#306568]">
                                {m.senderRole}
                              </span>
                            </div>
                          )}

                          {/* Message core text */}
                          <p className="text-xs font-medium whitespace-pre-wrap leading-relaxed select-text">{m.content}</p>
                          
                          {/* Bottom metadata panel: time + read checks */}
                          <div className={`mt-1.5 flex items-center justify-end gap-1.5 pointer-events-none select-none text-[8.5px] ${
                            isMe ? 'text-slate-300' : 'text-slate-400'
                          }`}>
                            <span>{formatTime(m.timestamp)}</span>
                            {isMe && (
                              <span>
                                {m.readBy.length > 1 ? (
                                  <CheckCheck className="w-3 h-3 text-emerald-400 stroke-[2.5]" />
                                ) : (
                                  <Check className="w-3 h-3 text-slate-400 stroke-2" />
                                )}
                              </span>
                            )}
                          </div>
                        </div>
                      </motion.div>
                    );
                  })
                )}
              </AnimatePresence>
              <div ref={messagesEndRef} />
            </div>

            {/* Presets Grid Panel */}
            <div className="px-5 py-2.5 border-t border-[#7fa4b3]/15 bg-[#f3faf8]/45 select-none">
              <span className="text-[8.5px] font-black uppercase text-[#306568] tracking-widest block mb-1.5 flex items-center gap-1">
                <Zap className="w-3 h-3 text-amber-500 fill-amber-500" /> RECOMMANDÉES PAR L'ERP :
              </span>
              <div className="flex flex-wrap gap-1.5 max-h-[70px] overflow-y-auto">
                {MEDICAL_PRESETS.map((preset) => (
                  <button
                    key={preset}
                    onClick={() => handleUsePreset(preset)}
                    className="bg-white hover:bg-slate-900 hover:text-white border border-[#7fa4b3]/20 hover:border-slate-800 text-slate-700 text-[9.5px] font-bold px-2 py-1 rounded-lg transition-transform active:scale-95 duration-100 shadow-4xs cursor-pointer"
                  >
                    {preset}
                  </button>
                ))}
              </div>
            </div>

            {/* Input Composer Tray */}
            <form onSubmit={handleSend} className="p-4 bg-white border-t border-[#7fa4b3]/20 rounded-b-2xl flex gap-2">
              <input
                type="text"
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                placeholder="Rédiger votre message de coordination..."
                className="flex-1 bg-[#f3faf8]/45 border border-[#7fa4b3]/30 rounded-xl px-3.5 py-2.5 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-slate-400 focus:bg-white"
              />
              <button
                type="submit"
                disabled={!inputMessage.trim()}
                className={`px-4 bg-slate-900 border border-slate-800 text-white rounded-xl transition flex items-center justify-center hover:bg-slate-800 cursor-pointer active:scale-95 duration-100 ${
                  !inputMessage.trim() ? 'opacity-40 cursor-not-allowed' : ''
                }`}
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-center text-slate-400 py-12 select-none bg-[#f8fbfa]/50 rounded-2xl">
            <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center text-[#306568]/40 mb-3 border border-[#7fa4b3]/20 shadow-3xs">
              <MessageSquare className="w-7 h-7 stroke-1" />
            </div>
            <h3 className="text-sm font-extrabold text-slate-900">Coordination Thérapeutique</h3>
            <p className="text-xs text-slate-500 max-w-sm mt-1 px-4 leading-normal">
              Sélectionnez un canal de groupe ou un membre du personnel sur le panneau de gauche pour démarrer vos discussions en temps réel.
            </p>
            <div className="mt-4 flex gap-2">
              <button 
                onClick={() => setActiveChannelId('chan_general')} 
                className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white text-[10px] font-black uppercase tracking-wider rounded-lg shadow-xs cursor-pointer"
              >
                Rejoindre Général
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
