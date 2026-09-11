/*
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Utilisateur, DatabaseState, ChatMessage } from '../dbStore';
import { 
  MessageSquare, 
  Send, 
  Lock, 
  Clock, 
  CheckCheck,
  Hash,
  Search,
  AlertCircle
} from 'lucide-react';

interface ChatSectionProps {
  dbState: DatabaseState;
  currentUser: Utilisateur | null;
  triggerToast: (msg: string, type: 'success' | 'info' | 'error') => void;
  onSave: (newState: DatabaseState) => void;
}

export const ChatSection: React.FC<ChatSectionProps> = ({
  dbState,
  currentUser,
  triggerToast,
  onSave,
}) => {
  const [activeChannelId, setActiveChannelId] = useState<string>('public');
  const [newMessageText, setNewMessageText] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');
  
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Filter users to display in private chat sidebar list
  const isCurrentUserAdmin = currentUser?.Role === 'Admin';
  
  const selectableUsers = dbState.utilisateurs.filter(u => {
    if (!currentUser) return false;
    // Don't chat with oneself
    if (u.ID_Utilisateur === currentUser.ID_Utilisateur) return false;
    
    if (isCurrentUserAdmin) {
      // Admin sees receptionists primarily, but also assistante, marketing for convenience
      return u.Role.toLowerCase().includes('receptionniste') || u.Role.toLowerCase().includes('rec') || u.Role === 'Assistante' || u.Role === 'Marketing';
    } else {
      // Receptionist sees the Admin primarily (and possibly other receptionists/assistante)
      return u.Role === 'Admin' || u.Role.toLowerCase().includes('receptionniste') || u.Role.toLowerCase().includes('rec') || u.Role === 'Assistante';
    }
  });

  // Filter according to sidebar search query
  const filteredUsers = selectableUsers.filter(u => 
    u.Nom_Utilisateur.toLowerCase().includes(searchQuery.toLowerCase()) ||
    u.Role.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Determine active channel details
  const getActiveChannelDetails = () => {
    if (activeChannelId === 'public') {
      return {
        name: 'Canal Général (Public)',
        description: 'Espace de discussion public collectif (Admin & Réceptionnistes)',
        isPrivate: false,
        recipient: null
      };
    }
    
    // Private channel id format: "private_id1_id2"
    const parts = activeChannelId.split('_');
    if (parts.length === 3 && parts[0] === 'private') {
      const id1 = parseInt(parts[1], 10);
      const id2 = parseInt(parts[2], 10);
      const recipientId = id1 === currentUser?.ID_Utilisateur ? id2 : id1;
      const recipientUser = dbState.utilisateurs.find(u => u.ID_Utilisateur === recipientId);
      
      return {
        name: recipientUser?.Nom_Utilisateur || 'Discussion Privée',
        description: recipientUser?.Role || 'Rôle inconnu',
        isPrivate: true,
        recipient: recipientUser || null
      };
    }

    return {
      name: 'Canal inconnu',
      description: '',
      isPrivate: false,
      recipient: null
    };
  };

  const channelDetails = getActiveChannelDetails();

  // Effect to mark messages in the current channel as read
  useEffect(() => {
    if (!currentUser || !dbState.chat_messages) return;
    
    // Find if there are unread messages in the active channel sent by others
    const unreadInActiveChannel = dbState.chat_messages.filter(
      m => m.channel === activeChannelId && m.senderId !== currentUser.ID_Utilisateur && !m.read
    );

    if (unreadInActiveChannel.length > 0) {
      // Mark them as read
      const updatedMessages = dbState.chat_messages.map(m => {
        if (m.channel === activeChannelId && m.senderId !== currentUser.ID_Utilisateur && !m.read) {
          return { ...m, read: true };
        }
        return m;
      });

      const updatedDbState: DatabaseState = {
        ...dbState,
        chat_messages: updatedMessages
      };
      
      onSave(updatedDbState);
    }
  }, [activeChannelId, dbState.chat_messages, currentUser, onSave]);

  // Helper to count unread messages from a specific user
  const getUnreadCount = (userId: number) => {
    if (!currentUser || !dbState.chat_messages) return 0;
    const id1 = Math.min(currentUser.ID_Utilisateur, userId);
    const id2 = Math.max(currentUser.ID_Utilisateur, userId);
    const channelId = `private_${id1}_${id2}`;
    
    return dbState.chat_messages.filter(
      m => m.channel === channelId && m.senderId === userId && !m.read
    ).length;
  };

  // Scroll to bottom of chat area
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // Scroll to bottom when channel changes or new messages arrive
  const messages = (dbState.chat_messages || []).filter(m => m.channel === activeChannelId);

  useEffect(() => {
    setTimeout(scrollToBottom, 50);
  }, [activeChannelId, messages.length]);

  // Handle sending a new message
  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser || !newMessageText.trim()) return;

    const messageText = newMessageText.trim();
    setNewMessageText(''); // Clear input instantly for snappy feel

    let receiverId: number | undefined = undefined;
    if (activeChannelId && activeChannelId.startsWith('private_')) {
      const parts = activeChannelId.split('_');
      if (parts.length === 3) {
        const id1 = parseInt(parts[1], 10);
        const id2 = parseInt(parts[2], 10);
        receiverId = id1 === currentUser.ID_Utilisateur ? id2 : id1;
      }
    }

    const newMessage: ChatMessage = {
      id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      senderId: currentUser.ID_Utilisateur,
      senderName: currentUser.Nom_Utilisateur,
      senderRole: currentUser.Role,
      receiverId,
      content: messageText,
      timestamp: new Date().toISOString(),
      channel: activeChannelId,
      read: false
    };

    const updatedDbState: DatabaseState = {
      ...dbState,
      chat_messages: [...(dbState.chat_messages || []), newMessage]
    };

    onSave(updatedDbState);
  };

  // Helper to open a private conversation
  const handleOpenPrivateChat = (recipientId: number) => {
    if (!currentUser) return;
    // Order IDs to ensure a consistent, single channel ID between the two participants
    const id1 = Math.min(currentUser.ID_Utilisateur, recipientId);
    const id2 = Math.max(currentUser.ID_Utilisateur, recipientId);
    setActiveChannelId(`private_${id1}_${id2}`);
  };

  // Format timestamp safely
  const formatTime = (timestampStr: string) => {
    try {
      const date = new Date(timestampStr);
      const hrs = String(date.getHours()).padStart(2, '0');
      const mins = String(date.getMinutes()).padStart(2, '0');
      return `${hrs}:${mins}`;
    } catch {
      return '...';
    }
  };

  // Get user initial avatar letter & background color index
  const getUserAvatarInfo = (name: string, role: string) => {
    const initial = name.charAt(0).toUpperCase();
    
    // Choose nice soft premium background colors based on role
    let bgClass = 'bg-slate-200 text-slate-700';
    if (role === 'Admin') {
      bgClass = 'bg-indigo-100 text-indigo-700 border-indigo-200';
    } else if (role.toLowerCase().includes('receptionniste')) {
      bgClass = 'bg-emerald-100 text-emerald-700 border-emerald-200';
    } else if (role === 'Assistante') {
      bgClass = 'bg-amber-100 text-amber-700 border-amber-200';
    } else if (role === 'Marketing') {
      bgClass = 'bg-sky-100 text-sky-700 border-sky-200';
    }

    return { initial, bgClass };
  };

  return (
    <div className="bg-[#f1f5f9] border border-slate-200/60 rounded-3xl overflow-hidden h-[calc(100vh-190px)] min-h-[500px] flex shadow-xs">
      
      {/* SIDEBAR: Canals & Users list */}
      <div className="w-80 bg-white border-r border-slate-200 flex flex-col shrink-0">
        
        {/* Search Bar */}
        <div className="p-4 border-b border-slate-150">
          <div className="relative">
            <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-slate-400">
              <Search className="w-4 h-4" />
            </span>
            <input
              type="text"
              placeholder="Rechercher un collègue..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 placeholder-slate-400 focus:outline-hidden focus:ring-1 focus:ring-indigo-500/50 focus:border-indigo-500"
            />
          </div>
        </div>

        {/* Scrollable List */}
        <div className="flex-1 overflow-y-auto p-2.5 space-y-4">
          
          {/* Public Channels */}
          <div>
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 px-2 block mb-1.5 select-none">
              Communication Collective
            </span>
            <button
              onClick={() => setActiveChannelId('public')}
              className={`w-full flex items-center gap-3 p-2.5 rounded-2xl text-left transition ${
                activeChannelId === 'public'
                  ? 'bg-indigo-50/70 border border-indigo-100 text-indigo-900 shadow-2xs font-extrabold'
                  : 'hover:bg-slate-50 border border-transparent text-slate-600 hover:text-slate-900'
              }`}
            >
              <div className={`p-2 rounded-xl flex items-center justify-center ${
                activeChannelId === 'public' ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-500'
              }`}>
                <Hash className="w-4 h-4" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-xs font-extrabold truncate flex items-center justify-between">
                  <span>Canal Général</span>
                  <span className="text-[9px] bg-emerald-50 text-emerald-700 px-1 py-0.5 rounded-md border border-emerald-100">
                    Public
                  </span>
                </div>
                <p className="text-[10px] text-slate-400 truncate mt-0.5">
                  Salon collectif de l'intranet
                </p>
              </div>
            </button>
          </div>

          {/* Private Channels (1-to-1) */}
          <div>
            <div className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 px-2 flex items-center gap-1.5 mb-1.5 select-none">
              <Lock className="w-3 h-3 text-slate-400" />
              <span>Discussions Privées (1-à-1)</span>
            </div>

            <div className="space-y-1">
              {filteredUsers.length > 0 ? (
                filteredUsers.map((u) => {
                  const isSelected = activeChannelId.includes(`private_`) && activeChannelId.includes(`_${u.ID_Utilisateur}`);
                  const { initial, bgClass } = getUserAvatarInfo(u.Nom_Utilisateur, u.Role);
                  const unreadCount = getUnreadCount(u.ID_Utilisateur);
                  
                  return (
                    <button
                      key={u.ID_Utilisateur}
                      onClick={() => handleOpenPrivateChat(u.ID_Utilisateur)}
                      className={`w-full flex items-center gap-3 p-2.5 rounded-2xl text-left border transition ${
                        isSelected
                          ? 'bg-indigo-50/70 border-indigo-100 text-indigo-900 shadow-2xs font-extrabold'
                          : 'hover:bg-slate-50 border-transparent text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      <div className={`w-8 h-8 rounded-xl border flex items-center justify-center text-xs font-black shrink-0 relative ${bgClass}`}>
                        {initial}
                        {unreadCount > 0 && (
                          <span className="absolute -top-1 -right-1 flex h-3.5 w-3.5">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-emerald-500"></span>
                          </span>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-xs font-extrabold truncate flex items-center justify-between">
                          <span className="truncate">{u.Nom_Utilisateur}</span>
                          {unreadCount > 0 && (
                            <span className="bg-emerald-500 text-white rounded-full text-[10px] font-bold min-w-[18px] h-[18px] flex items-center justify-center shrink-0 shadow-xs">
                              {unreadCount}
                            </span>
                          )}
                        </div>
                        <p className="text-[10.5px] text-slate-400 truncate mt-0.5 flex items-center gap-1">
                          <span className="inline-block w-1.5 h-1.5 rounded-full bg-slate-300" />
                          {u.Role}
                        </p>
                      </div>
                    </button>
                  );
                })
              ) : (
                <div className="text-center p-4 text-[11px] text-slate-400 italic">
                  Aucun membre trouvé
                </div>
              )}
            </div>
          </div>

        </div>

        {/* Current user session pill */}
        {currentUser && (
          <div className="p-3 bg-slate-50/80 border-t border-slate-150 flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-[#0F2D37]/10 text-[#0F2D37] border border-[#0F2D37]/10 flex items-center justify-center font-bold text-xs shrink-0 select-none">
              {currentUser.Nom_Utilisateur.charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-[11px] font-bold text-slate-700 truncate">
                {currentUser.Nom_Utilisateur}
              </div>
              <div className="text-[9.5px] font-black text-indigo-600 truncate">
                🔑 {currentUser.Role}
              </div>
            </div>
          </div>
        )}

      </div>

      {/* CHAT AREA: Active canal and conversation */}
      <div className="flex-1 bg-slate-50 flex flex-col h-full">
        
        {/* Active canal header */}
        <div className="px-6 py-4 bg-white border-b border-slate-200 flex items-center justify-between">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              {channelDetails.isPrivate ? (
                <Lock className="w-4 h-4 text-indigo-600 shrink-0" />
              ) : (
                <Hash className="w-4 h-4 text-indigo-600 shrink-0" />
              )}
              <h4 className="text-sm font-black text-slate-800 truncate">
                {channelDetails.name}
              </h4>
            </div>
            <p className="text-[11px] text-slate-500 truncate mt-0.5">
              {channelDetails.description}
            </p>
          </div>

          <div className="flex items-center gap-1.5 bg-emerald-50 text-emerald-700 px-2.5 py-1 rounded-xl text-[10.5px] font-extrabold border border-emerald-100">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>Intranet Connecté</span>
          </div>
        </div>

        {/* Messages List Area */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-slate-400/80 p-8 text-center select-none space-y-2">
              <MessageSquare className="w-10 h-10 text-slate-300" />
              <div>
                <h5 className="text-xs font-black text-slate-700">Aucun message pour le moment</h5>
                <p className="text-[10.5px] text-slate-400 max-w-sm mt-1 mx-auto leading-relaxed">
                  {channelDetails.isPrivate 
                    ? "Envoyez le premier message privé pour lancer la discussion. Ce canal est crypté et exclusif entre vous et le destinataire."
                    : "Envoyez un message sur le canal général pour démarrer la discussion collective avec l'équipe de réception."
                  }
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {messages.map((m) => {
                const isMyMessage = m.senderId === currentUser?.ID_Utilisateur;
                
                return (
                  <div 
                    key={m.id} 
                    className={`flex items-start gap-2.5 ${isMyMessage ? 'justify-end' : 'justify-start'}`}
                  >
                    {/* Receiver Avatar (on the left if not my message) */}
                    {!isMyMessage && (
                      <div className="w-7 h-7 rounded-lg bg-slate-200 text-slate-700 border border-slate-300 flex items-center justify-center font-bold text-xs select-none shrink-0 mt-0.5" title={m.senderName}>
                        {m.senderName.charAt(0).toUpperCase()}
                      </div>
                    )}

                    <div className="max-w-[70%]">
                      {/* Name label if not mine and in general chat */}
                      {!isMyMessage && !channelDetails.isPrivate && (
                        <span className="text-[10.5px] font-extrabold text-slate-600 ml-1 block mb-0.5">
                          {m.senderName}
                        </span>
                      )}

                      {/* Bubble content */}
                      <div 
                        className={`p-3.5 rounded-2xl text-xs leading-relaxed ${
                          isMyMessage 
                            ? 'bg-indigo-600 text-white font-medium rounded-tr-xs shadow-xs' 
                            : 'bg-white text-slate-800 border border-slate-200/80 rounded-tl-xs'
                        }`}
                      >
                        <p className="whitespace-pre-wrap break-words">{m.content}</p>
                        
                        {/* Time stamp inside bubble */}
                        <div className={`text-[9px] mt-1.5 flex items-center gap-1 ${
                          isMyMessage ? 'text-indigo-200 justify-end' : 'text-slate-400 justify-start'
                        }`}>
                          <Clock className="w-2.5 h-2.5" />
                          <span>{formatTime(m.timestamp)}</span>
                          {isMyMessage && <CheckCheck className="w-3 h-3 text-indigo-200" />}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        {/* Message composer input bar */}
        <div className="p-4 bg-white border-t border-slate-200">
          <form onSubmit={handleSendMessage} className="flex items-center gap-2">
            <input
              type="text"
              value={newMessageText}
              onChange={(e) => setNewMessageText(e.target.value)}
              placeholder={
                channelDetails.isPrivate 
                  ? `Écrire un message privé à ${channelDetails.name}...`
                  : "Écrire un message sur le Canal Général..."
              }
              className="flex-1 bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 text-xs font-bold text-slate-800 placeholder-slate-400 focus:outline-hidden focus:ring-1 focus:ring-indigo-500/50 focus:border-indigo-500 font-sans"
            />
            <button
              type="submit"
              disabled={!newMessageText.trim()}
              className={`p-3 bg-indigo-600 text-white rounded-2xl transition shadow-xs flex items-center justify-center shrink-0 cursor-pointer hover:bg-indigo-700 ${
                !newMessageText.trim() ? 'opacity-50 cursor-not-allowed' : ''
              }`}
            >
              <Send className="w-4 h-4 fill-white" />
            </button>
          </form>
          <div className="flex items-center gap-1 text-[10px] text-slate-400 italic mt-2 ml-1 select-none">
            <AlertCircle className="w-3 h-3" />
            <span>Les messages sont transmis instantanément par liaison cryptée temps réel.</span>
          </div>
        </div>

      </div>

    </div>
  );
};
