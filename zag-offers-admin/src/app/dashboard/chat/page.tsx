'use client';

import React, { useState, useEffect, useRef, useCallback, memo, useMemo } from 'react';
import { 
  Send, Search, MessageSquare, User, Store, MoreVertical,
  CheckCheck, Phone, Info, ChevronLeft, Plus, X, Loader2
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { PageHeader } from '@/components/shared/PageHeader';
import { adminApi, resolveImageUrl } from '@/lib/api';
import { io, Socket } from 'socket.io-client';

const API_URL = (process.env.NEXT_PUBLIC_API_URL || 'https://api.zagoffers.online').replace(/\/$/, '');

interface Participant {
  id: string;
  name: string;
  avatar?: string;
  role: string;
}

interface ConversationMessage {
  id: string;
  text: string;
  senderId: string;
  createdAt: string;
  isRead: boolean;
  isOptimistic?: boolean;
}

interface Conversation {
  id: string;
  type: string;
  lastMessageAt: string;
  admin: Participant;
  participant: Participant;
  messages: ConversationMessage[];
}

function getAdminId(): string {
  try {
    const u = JSON.parse(sessionStorage.getItem('admin_user') || '{}');
    return u.id || '';
  } catch { return ''; }
}

function getAdminToken(): string {
  return document.cookie.split('; ').find(r => r.startsWith('admin_token='))?.split('=')[1] || '';
}

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'الآن';
  if (mins < 60) return `${mins}د`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}س`;
  return `${Math.floor(hrs / 24)}ي`;
}

// 1. مكون الرسالة المعزول
const MessageItem = memo(({ msg, isAdmin }: { msg: ConversationMessage, isAdmin: boolean }) => (
  <div className={`flex ${isAdmin ? 'justify-start' : 'justify-end'} mb-3`}>
    <div className={`max-w-[70%] flex flex-col gap-1 ${isAdmin ? 'items-start' : 'items-end'}`}>
      <div className={`px-4 py-2.5 rounded-2xl text-[13px] font-bold shadow-sm ${
        isAdmin 
          ? 'bg-white text-slate-800 rounded-br-none border border-slate-100' 
          : 'bg-orange-500 text-white rounded-bl-none shadow-orange-100'
      } ${msg.isOptimistic ? 'opacity-50 animate-pulse' : ''}`}>
        {msg.text}
      </div>
      <div className={`flex items-center gap-1.5 px-1 ${isAdmin ? 'flex-row' : 'flex-row-reverse'}`}>
        <span className="text-[9px] text-slate-400 font-black">
          {new Date(msg.createdAt).toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' })}
        </span>
        {isAdmin && <CheckCheck size={11} className={msg.isRead ? 'text-orange-500' : 'text-slate-300'} />}
      </div>
    </div>
  </div>
));
MessageItem.displayName = 'MessageItem';

// 2. مكون الإدخال المعزول لسرعة الكتابة
const AdminChatInput = memo(({ onSend, disabled }: { onSend: (text: string) => void, disabled: boolean }) => {
  const [val, setVal] = useState('');
  const handleAction = () => {
    if (!val.trim() || disabled) return;
    onSend(val.trim());
    setVal('');
  };
  return (
    <div className="flex items-center gap-3 bg-slate-50 rounded-2xl border border-slate-200 p-1.5 focus-within:border-orange-400 transition-all">
      <input
        type="text"
        value={val}
        onChange={e => setVal(e.target.value)}
        onKeyDown={e => { if (e.key === 'Enter') handleAction(); }}
        placeholder="اكتب ردك هنا..."
        disabled={disabled}
        className="flex-1 bg-transparent px-4 py-2 text-sm font-bold text-slate-800 outline-none"
      />
      <button
        onClick={handleAction}
        disabled={!val.trim() || disabled}
        className="h-10 w-10 rounded-xl bg-orange-500 text-white flex items-center justify-center shadow-lg shadow-orange-200 active:scale-90 transition-all disabled:opacity-20 shrink-0"
      >
        <Send size={18} className="rotate-180" />
      </button>
    </div>
  );
});
AdminChatInput.displayName = 'AdminChatInput';

export default function AdminChatPage() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConvId, setSelectedConvId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ConversationMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<'all' | 'CUSTOMER' | 'MERCHANT'>('all');
  
  const socketRef = useRef<Socket | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const adminId = getAdminId();

  const selectedConv = useMemo(() => 
    conversations.find(c => c.id === selectedConvId) || null
  , [conversations, selectedConvId]);

  // Load Conversations
  useEffect(() => {
    const fetchConvs = async () => {
      try {
        const res = await adminApi().get<Conversation[]>('/chat/conversations');
        setConversations(Array.isArray(res.data) ? res.data : []);
      } catch (e) {} finally { setLoading(false); }
    };
    fetchConvs();
  }, []);

  // Load Messages on selection
  useEffect(() => {
    if (!selectedConvId) {
      setMessages([]);
      return;
    }
    const fetchMsgs = async () => {
      try {
        const res = await adminApi().get<ConversationMessage[]>(`/chat/messages/${selectedConvId}`);
        setMessages(Array.isArray(res.data) ? res.data : []);
      } catch (e) {}
    };
    fetchMsgs();
  }, [selectedConvId]);

  // WebSocket
  useEffect(() => {
    const token = getAdminToken();
    if (!token) return;
    const s = io(API_URL, { 
      auth: { token }, 
      transports: ['websocket'],
      reconnection: true,
      forceNew: true 
    });
    socketRef.current = s;

    s.on('connect', () => {
      console.log('Admin Chat Connected! Joining room:', adminId);
      s.emit('join_room', { token, userId: adminId });
    });

    s.on('new_message', (msg: ConversationMessage & { conversationId: string }) => {
      console.log('Admin received new message:', msg);
      if (msg.conversationId === selectedConvId) {
        setMessages(prev => prev.some(m => m.id === msg.id || (m.isOptimistic && m.text === msg.text)) 
          ? prev.map(m => (m.isOptimistic && m.text === msg.text) ? msg : m)
          : [...prev, msg]
        );
      }
    });

    s.on('conversation_update', (data: { conversationId: string, lastMessage: any }) => {
      setConversations(prev => {
        const index = prev.findIndex(c => c.id === data.conversationId);
        if (index === -1) return prev; // Should refetch list if new conv
        const updated = [...prev];
        updated[index] = { 
          ...updated[index], 
          lastMessageAt: data.lastMessage.createdAt, 
          messages: [data.lastMessage] 
        };
        return updated.sort((a,b) => new Date(b.lastMessageAt).getTime() - new Date(a.lastMessageAt).getTime());
      });
    });

    return () => { s.disconnect(); };
  }, [adminId, selectedConvId]);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages]);

  const handleSend = async (text: string) => {
    if (!selectedConvId) return;
    const tmpId = `tmp-${Date.now()}`;
    const optMsg: ConversationMessage = {
      id: tmpId,
      text,
      senderId: adminId,
      createdAt: new Date().toISOString(),
      isRead: false,
      isOptimistic: true
    };

    setMessages(prev => [...prev, optMsg]);

    try {
      const res = await adminApi().post<ConversationMessage>('/chat/send', {
        conversationId: selectedConvId,
        text
      });
      setMessages(prev => prev.map(m => m.id === tmpId ? res.data : m));
      // Update local list order
      setConversations(prev => prev.map(c => c.id === selectedConvId 
        ? { ...c, lastMessageAt: res.data.createdAt, messages: [res.data] }
        : c
      ).sort((a,b) => new Date(b.lastMessageAt).getTime() - new Date(a.lastMessageAt).getTime()));
    } catch (e) {
      setMessages(prev => prev.filter(m => m.id !== tmpId));
    }
  };

  const filtered = useMemo(() => 
    conversations.filter(c => {
      const matchType = filter === 'all' || c.participant.role === filter;
      const matchSearch = !search || c.participant.name.toLowerCase().includes(search.toLowerCase());
      return matchType && matchSearch;
    })
  , [conversations, filter, search]);

  return (
    <div className="flex flex-col h-[calc(100vh-80px)] p-4 lg:p-8 space-y-6 overflow-hidden bg-slate-50">
      <PageHeader title="مركز المحادثات" description="ردود فورية على استفسارات العملاء والتجار" icon={MessageSquare} />

      <div className="flex-1 flex bg-white rounded-[2.5rem] border border-slate-200 shadow-xl overflow-hidden">
        {/* Sidebar */}
        <div className="w-[300px] lg:w-[350px] shrink-0 flex flex-col border-l border-slate-100">
          <div className="p-5 border-b border-slate-50 space-y-4">
             <div className="relative">
                <Search size={14} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input 
                  value={search} onChange={e => setSearch(e.target.value)}
                  placeholder="ابحث..." className="w-full h-10 pr-10 pl-4 rounded-xl bg-slate-50 border-none text-sm font-bold outline-none focus:ring-2 ring-orange-500/20 transition-all"
                />
             </div>
             <div className="flex gap-1 p-1 bg-slate-100/50 rounded-xl">
                {(['all', 'CUSTOMER', 'MERCHANT'] as const).map(f => (
                  <button key={f} onClick={() => setFilter(f)} className={`flex-1 py-1.5 rounded-lg text-[10px] font-black transition-all ${filter === f ? 'bg-white text-orange-600 shadow-sm' : 'text-slate-400'}`}>
                    {f === 'all' ? 'الكل' : f === 'CUSTOMER' ? 'عملاء' : 'تجار'}
                  </button>
                ))}
             </div>
          </div>
          <div className="flex-1 overflow-y-auto scrollbar-none py-2">
            {loading ? <div className="p-10 text-center"><Loader2 className="animate-spin mx-auto text-orange-500" /></div> : 
             filtered.map(conv => (
               <button key={conv.id} onClick={() => setSelectedConvId(conv.id)} className={`w-full flex items-center gap-3 px-5 py-4 transition-all text-right border-r-4 ${selectedConvId === conv.id ? 'bg-orange-50 border-orange-500' : 'border-transparent hover:bg-slate-50'}`}>
                  <div className={`h-11 w-11 rounded-2xl flex items-center justify-center font-bold text-white shrink-0 shadow-sm ${conv.participant.role === 'MERCHANT' ? 'bg-orange-500' : 'bg-indigo-500'}`}>
                    {conv.participant.avatar ? <img src={resolveImageUrl(conv.participant.avatar)} className="h-full w-full object-cover rounded-2xl" /> : conv.participant.name[0]}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-center"><h4 className="text-sm font-black text-slate-800 truncate">{conv.participant.name}</h4><span className="text-[9px] text-slate-400 font-bold">{timeAgo(conv.lastMessageAt)}</span></div>
                    <p className="text-[11px] text-slate-400 truncate mt-0.5 font-bold">{conv.messages?.[0]?.text || 'بدء المحادثة...'}</p>
                  </div>
               </button>
             ))
            }
          </div>
        </div>

        {/* Chat Area */}
        <div className="flex-1 flex flex-col bg-slate-50/20 min-w-0">
          {selectedConv ? (
            <div className="flex flex-col h-full">
              <div className="bg-white px-6 py-4 border-b border-slate-100 flex items-center justify-between shadow-sm z-10">
                <div className="flex items-center gap-3">
                  <div className={`h-10 w-10 rounded-xl flex items-center justify-center font-bold text-white ${selectedConv.participant.role === 'MERCHANT' ? 'bg-orange-500' : 'bg-indigo-500'}`}>{selectedConv.participant.name[0]}</div>
                  <div><h3 className="text-sm font-black text-slate-900">{selectedConv.participant.name}</h3><span className="text-[9px] font-black text-emerald-500">نشط الآن</span></div>
                </div>
              </div>
              <div ref={scrollRef} className="flex-1 overflow-y-auto p-6 scrollbar-none">
                {messages.map(m => <MessageItem key={m.id} msg={m} isAdmin={m.senderId === adminId} />)}
              </div>
              <div className="bg-white p-5 border-t border-slate-100">
                <AdminChatInput onSend={handleSend} disabled={!selectedConvId} />
              </div>
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-slate-300">
              <MessageSquare size={64} strokeWidth={1} className="opacity-20 mb-4" />
              <p className="text-sm font-black">اختر محادثة للبدء في الرد الفوري</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
