import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { Utilisateur } from '../dbStore';

export interface ChatChannel {
  id: string;
  name: string;
  type: 'group' | 'private';
  members: string[]; // List of ID_Utilisateur as string
  last_message_text?: string;
  last_message_time?: Date | any;
}

export interface ChatMessage {
  id: string;
  channelId: string;
  senderId: string;
  senderName: string;
  senderRole: string;
  content: string;
  timestamp: any;
  readBy: string[]; // List of user IDs that read this message
}

interface ChatContextProps {
  channels: ChatChannel[];
  messages: ChatMessage[];
  unreadCount: number;
  activeChannel: ChatChannel | null;
  setActiveChannelId: (id: string | null) => void;
  sendMessage: (content: string) => Promise<void>;
  markAsRead: (channelId: string) => Promise<void>;
  startPrivateChat: (targetUser: Utilisateur) => Promise<string>;
  contacts: Utilisateur[];
  onlineUsers: string[]; // list of active user IDs
  setOnline: (userId: string) => void;
}

const ChatContext = createContext<ChatContextProps | undefined>(undefined);

const PREDEFS_CHANNELS = [
  { id: 'chan_general', name: 'Canal Général', type: 'group', members: ['all'] },
  { id: 'chan_reeduc', name: 'Canal Rééducation', type: 'group', members: ['all'] },
  { id: 'chan_balneo', name: 'Canal Balnéo', type: 'group', members: ['all'] },
  { id: 'chan_rdc', name: 'Canal RDC / Accueil', type: 'group', members: ['all'] },
  { id: 'chan_intensifs', name: 'Canal Intensifs IP5', type: 'group', members: ['all'] }
];

const LOCAL_CHANNELS_DEFAULT: ChatChannel[] = PREDEFS_CHANNELS.map(c => ({
  id: c.id,
  name: c.name,
  type: c.type as any,
  members: c.members,
  last_message_text: "Bienvenue sur le canal !",
  last_message_time: new Date(Date.now() - 3600000).toISOString()
}));

const LOCAL_MESSAGES_DEFAULT: ChatMessage[] = [
  {
    id: 'msg_init_1',
    channelId: 'chan_general',
    senderId: '3', // Fella
    senderName: 'Melle FELLA',
    senderRole: 'Receptionniste RDC',
    content: "Bonjour à tous, bienvenue sur la messagerie interne de la clinique KACEL ! Améliorons notre coordination en temps réel.",
    timestamp: new Date(Date.now() - 3600000 * 3).toISOString(),
    readBy: ['3']
  },
  {
    id: 'msg_init_2',
    channelId: 'chan_general',
    senderId: '10', // Dr Amrani
    senderName: 'Dr. Amrani MPR',
    senderRole: 'Médecin MPR',
    content: "Excellente initiative. Je serai en consultation de rééducation fonctionnelle tout l'après-midi.",
    timestamp: new Date(Date.now() - 3600000 * 2).toISOString(),
    readBy: ['3', '10']
  },
  {
    id: 'msg_init_3',
    channelId: 'chan_reeduc',
    senderId: '5', // Narimane
    senderName: 'Mme NARIMANE',
    senderRole: 'Receptionniste Réeducation',
    content: "Les cabines de physiothérapie de l'Étage 1 sont prêtes pour accueillir les premiers patients.",
    timestamp: new Date(Date.now() - 60000).toISOString(),
    readBy: ['5']
  }
];

export const ChatProvider: React.FC<{ 
  children: React.ReactNode; 
  currentUser: Utilisateur; 
  utilisateurs: Utilisateur[];
  dbState: any;
  onSaveState: (fresh: any) => void;
}> = ({ children, currentUser, utilisateurs, dbState, onSaveState }) => {
  const [activeChannelId, setActiveChannelId] = useState<string | null>('chan_general');
  const [onlineUsers, setOnlineUsers] = useState<string[]>([]);
  
  const currentUserIdStr = currentUser.ID_Utilisateur.toString();

  // Extract raw databases elements
  const rawChannels = dbState.chatChannels && dbState.chatChannels.length > 0 
    ? dbState.chatChannels 
    : LOCAL_CHANNELS_DEFAULT;

  const rawMessages = dbState.chatMessages && dbState.chatMessages.length > 0 
    ? dbState.chatMessages 
    : LOCAL_MESSAGES_DEFAULT;

  // Format datastores nicely for component ingestion
  const channels: ChatChannel[] = rawChannels.map((c: any) => {
    const isMember = c.members.includes('all') || c.members.includes(currentUserIdStr);
    if (!isMember) return null;
    return {
      ...c,
      last_message_time: c.last_message_time ? new Date(c.last_message_time) : null
    };
  }).filter(Boolean) as ChatChannel[];

  // Sort channels by last message time
  channels.sort((a, b) => {
    const timeA = a.last_message_time?.getTime() || 0;
    const timeB = b.last_message_time?.getTime() || 0;
    return timeB - timeA;
  });

  const messages: ChatMessage[] = rawMessages.map((m: any) => ({
    ...m,
    timestamp: m.timestamp ? new Date(m.timestamp) : new Date()
  }));

  // Auto check active channel unread status and clear it
  useEffect(() => {
    if (activeChannelId) {
      markAsRead(activeChannelId);
    }
  }, [activeChannelId, rawMessages.length]);

  // Compute global unread messages count
  const unreadCount = messages.filter(
    msg => msg.senderId !== currentUserIdStr && !msg.readBy.includes(currentUserIdStr)
  ).length;

  const activeChannel = channels.find(c => c.id === activeChannelId) || null;

  // Send message layout
  const sendMessage = async (content: string) => {
    if (!activeChannelId || !content.trim()) return;

    const newMsg: ChatMessage = {
      id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
      channelId: activeChannelId,
      senderId: currentUserIdStr,
      senderName: currentUser.Nom_Utilisateur,
      senderRole: currentUser.Role,
      content: content.trim(),
      timestamp: new Date().toISOString(),
      readBy: [currentUserIdStr]
    };

    const updatedMsgs = [...rawMessages, newMsg];
    const updatedChans = rawChannels.map((chan: any) => {
      if (chan.id === activeChannelId) {
        return {
          ...chan,
          last_message_text: content.trim(),
          last_message_time: new Date().toISOString()
        };
      }
      return chan;
    });

    onSaveState({
      ...dbState,
      chatChannels: updatedChans,
      chatMessages: updatedMsgs
    });
  };

  // Mark all messages as read for high productivity
  const markAsRead = async (channelId: string) => {
    const unreadMsgs = rawMessages.filter(
      (m: any) => m.channelId === channelId && m.senderId !== currentUserIdStr && !m.readBy.includes(currentUserIdStr)
    );
    if (unreadMsgs.length === 0) return;

    const updatedMsgs = rawMessages.map((m: any) => {
      if (m.channelId === channelId && m.senderId !== currentUserIdStr && !m.readBy.includes(currentUserIdStr)) {
        return {
          ...m,
          readBy: [...m.readBy, currentUserIdStr]
        };
      }
      return m;
    });

    onSaveState({
      ...dbState,
      chatMessages: updatedMsgs
    });
  };

  // Start peer to peer workspace channel
  const startPrivateChat = async (targetUser: Utilisateur) => {
    const targetIdStr = targetUser.ID_Utilisateur.toString();
    
    // Check if channel already exists
    const existingChan = rawChannels.find(
      (c: any) => c.type === 'private' && 
                  c.members.includes(currentUserIdStr) && 
                  c.members.includes(targetIdStr)
    );

    if (existingChan) {
      setActiveChannelId(existingChan.id);
      return existingChan.id;
    }

    const firstId = Math.min(currentUser.ID_Utilisateur, targetUser.ID_Utilisateur);
    const secondId = Math.max(currentUser.ID_Utilisateur, targetUser.ID_Utilisateur);
    const uniqueChanId = `p2p_${firstId}_${secondId}`;

    const newChan: ChatChannel = {
      id: uniqueChanId,
      name: targetUser.Nom_Utilisateur,
      type: 'private',
      members: [currentUserIdStr, targetIdStr],
      last_message_text: `Début de la discussion privée entre ${currentUser.Nom_Utilisateur} et ${targetUser.Nom_Utilisateur}`,
      last_message_time: new Date().toISOString()
    };

    const updatedChans = [...rawChannels, newChan];

    onSaveState({
      ...dbState,
      chatChannels: updatedChans
    });

    setActiveChannelId(uniqueChanId);
    return uniqueChanId;
  };

  // Keep simulated online status for active collaboration
  useEffect(() => {
    setOnlineUsers(utilisateurs.map(u => u.ID_Utilisateur.toString()));
  }, [utilisateurs]);

  const setOnline = (userId: string) => {
    if (!onlineUsers.includes(userId)) {
      setOnlineUsers(prev => [...prev, userId]);
    }
  };

  const contacts = utilisateurs.filter(u => u.ID_Utilisateur !== currentUser.ID_Utilisateur);

  return (
    <ChatContext.Provider value={{
      channels,
      messages: messages.filter(m => m.channelId === activeChannelId),
      unreadCount,
      activeChannel,
      setActiveChannelId,
      sendMessage,
      markAsRead,
      startPrivateChat,
      contacts,
      onlineUsers,
      setOnline
    }}>
      {children}
    </ChatContext.Provider>
  );
};

export const useChat = () => {
  const context = useContext(ChatContext);
  if (!context) {
    throw new Error('useChat must be used inside ChatProvider');
  }
  return context;
};
