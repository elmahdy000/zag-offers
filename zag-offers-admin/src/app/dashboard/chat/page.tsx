'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { 
  Send, Search, MessageSquare, User, Store, MoreVertical,
  CheckCheck, Phone, Info, ChevronLeft, Plus, X, Loader2
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { PageHeader } from '@/components/shared/PageHeader';
import { adminApi, resolveImageUrl } from '@/lib/api';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
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

export default function AdminChatPage() {
  const [selectedConv, setSelectedConv] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<ConversationMessage[]>([]);
  const [messageText, setMessageText] = useState('');
  const [filter, setFilter] = useState<'all' | 'CUSTOMER' | 'MERCHANT'>('all');
  const [search, setSearch] = useState('');
  const socketRef = useRef<Socket | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const adminId = getAdminId();
  const qc = useQueryClient();

  /* ── Conversations query ── */
  const { data: conversations = [], isLoading } = useQuery<Conversation[]>({
    queryKey: ['admin-conversations'],
    queryFn: async () => {
      const res = await adminApi().get<Conversation[]>('/chat/conversations');
      return res.data;
    },
    refetchInterval: 30000,
  });

  /* ── Messages query ── */
  const { data: fetchedMessages = [], isFetching: loadingMessages } = useQuery<ConversationMessage[]>({
    queryKey: ['chat-messages', selectedConv?.id],
    queryFn: async () => {
      if (!selectedConv) return [];
      const res = await adminApi().get<ConversationMessage[]>(`/chat/messages/${selectedConv.id}`);
      return res.data;
    },
    enabled: !!selectedConv,
  });

  useEffect(() => { setMessages(fetchedMessages); }, [fetchedMessages]);

  /* ── WebSocket ── */
  useEffect(() => {
    const token = getAdminToken();
    if (!token) return;
    const s = io(API_URL, { auth: { token }, transports: ['websocket'] });
    socketRef.current = s;
    s.emit('join', adminId);
    s.on('new_message', (msg: ConversationMessage & { conversationId: string }) => {
      if (msg.conversationId === selectedConv?.id) {
        setMessages(prev => [...prev, msg]);
      }
      qc.invalidateQueries({ queryKey: ['admin-conversations'] });
    });
    return () => { s.disconnect(); };
  }, [adminId, selectedConv?.id]);

  /* ── Auto-scroll ── */
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  /* ── Send ── */
  const sendMutation = useMutation({
    mutationFn: async (text: string) => {
      const res = await adminApi().post('/chat/send', { conversationId: selectedConv!.id, text });
      return res.data;
    },
    onSuccess: (msg) => {
      setMessages(prev => [...prev, msg]);
      setMessageText('');
      qc.invalidateQueries({ queryKey: ['admin-conversations'] });
    },
  });

  const handleSend = () => {
    const t = messageText.trim();
    if (!t || !selectedConv || sendMutation.isPending) return;
    sendMutation.mutate(t);
  };

  const filtered = conversations.filter(c => {
    const matchType = filter === 'all' || c.participant.role === filter;
    const matchSearch = !search || c.participant.name.toLowerCase().includes(search.toLowerCase());
    return matchType && matchSearch;
  });

  const otherParticipant = (c: Conversation) => c.participant;
  const lastMsg = (c: Conversation) => c.messages[0];

  return (
    <div className="flex flex-col h-[calc(100vh-80px)] p-6 lg:p-10 space-y-6 overflow-hidden">
      <PageHeader 
        title="مركز الدعم والمحادثات" 
        description="تواصل مباشر مع العملاء وأصحاب المتاجر"
        icon={MessageSquare}
      />

      <div className="flex-1 flex gap-0 bg-white rounded-[2rem] border border-slate-200 shadow-sm overflow-hidden">
        
        {/* ── Sidebar ── */}
        <div className="w-[320px] shrink-0 flex flex-col border-l border-slate-100">
          {/* Header */}
          <div className="px-6 pt-6 pb-4 space-y-4 border-b border-slate-100">
            <div className="relative">
              <Search className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
              <input 
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="بحث..." 
                className="w-full h-10 pr-10 pl-4 rounded-xl bg-slate-50 border border-slate-100 text-sm font-medium focus:outline-none focus:border-orange-400 transition-all"
              />
            </div>
            <div className="flex gap-1 p-1 bg-slate-50 rounded-xl">
              {(['all', 'CUSTOMER', 'MERCHANT'] as const).map(f => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={`flex-1 py-1.5 rounded-lg text-[11px] font-bold transition-all ${
                    filter === f ? 'bg-white text-orange-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'
                  }`}
                >
                  {f === 'all' ? 'الكل' : f === 'CUSTOMER' ? 'عملاء' : 'تجار'}
                </button>
              ))}
            </div>
          </div>

          {/* List */}
          <div className="flex-1 overflow-y-auto py-2">
            {isLoading ? (
              <div className="flex items-center justify-center py-20">
                <Loader2 className="animate-spin text-orange-500" size={28} />
              </div>
            ) : filtered.length === 0 ? (
              <div className="py-16 text-center text-slate-400">
                <MessageSquare size={36} className="mx-auto mb-3 opacity-30" strokeWidth={1.5} />
                <p className="text-sm font-bold">لا توجد محادثات</p>
              </div>
            ) : (
              filtered.map(conv => {
                const p = otherParticipant(conv);
                const last = lastMsg(conv);
                const isActive = selectedConv?.id === conv.id;
                return (
                  <button
                    key={conv.id}
                    onClick={() => setSelectedConv(conv)}
                    className={`w-full flex items-center gap-3 px-4 py-3.5 transition-all text-right ${
                      isActive ? 'bg-orange-50 border-r-2 border-orange-500' : 'hover:bg-slate-50 border-r-2 border-transparent'
                    }`}
                  >
                    <div className="relative shrink-0">
                      <div className={`h-11 w-11 rounded-2xl flex items-center justify-center font-bold text-white text-sm ${
                        p.role === 'MERCHANT' ? 'bg-orange-500' : 'bg-indigo-500'
                      }`}>
                        {p.avatar 
                          ? <img src={resolveImageUrl(p.avatar)} className="h-full w-full object-cover rounded-2xl" alt="" />
                          : p.name.charAt(0)
                        }
                      </div>
                      <span className={`absolute -bottom-0.5 -left-0.5 h-2.5 w-2.5 rounded-full border-2 border-white ${
                        p.role === 'MERCHANT' ? 'bg-orange-400' : 'bg-indigo-400'
                      }`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <h4 className="text-sm font-black text-slate-800 truncate">{p.name}</h4>
                        <span className="text-[10px] text-slate-400 font-medium whitespace-nowrap mr-1">
                          {conv.lastMessageAt ? timeAgo(conv.lastMessageAt) : ''}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-400 truncate mt-0.5 font-medium">
                        {last?.text || 'لا توجد رسائل بعد'}
                      </p>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* ── Chat Area ── */}
        <div className="flex-1 flex flex-col min-w-0 bg-slate-50/30">
          <AnimatePresence mode="wait">
            {selectedConv ? (
              <motion.div
                key={selectedConv.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex flex-col h-full"
              >
                {/* Chat Header */}
                <div className="bg-white px-6 py-4 border-b border-slate-100 flex items-center justify-between shrink-0">
                  <div className="flex items-center gap-3">
                    <div className={`h-10 w-10 rounded-xl flex items-center justify-center font-bold text-white text-sm ${
                      otherParticipant(selectedConv).role === 'MERCHANT' ? 'bg-orange-500' : 'bg-indigo-500'
                    }`}>
                      {otherParticipant(selectedConv).name.charAt(0)}
                    </div>
                    <div>
                      <h3 className="text-sm font-black text-slate-900">{otherParticipant(selectedConv).name}</h3>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                        otherParticipant(selectedConv).role === 'MERCHANT' 
                          ? 'bg-orange-50 text-orange-600' 
                          : 'bg-indigo-50 text-indigo-600'
                      }`}>
                        {otherParticipant(selectedConv).role === 'MERCHANT' ? 'تاجر' : 'عميل'}
                      </span>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button className="h-9 w-9 flex items-center justify-center rounded-xl bg-slate-50 text-slate-400 hover:text-orange-600 transition-all border border-slate-100">
                      <Info size={16} />
                    </button>
                    <button className="h-9 w-9 flex items-center justify-center rounded-xl bg-slate-50 text-slate-400 hover:text-orange-600 transition-all border border-slate-100">
                      <MoreVertical size={16} />
                    </button>
                  </div>
                </div>

                {/* Messages */}
                <div ref={scrollRef} className="flex-1 overflow-y-auto p-6 space-y-3">
                  {loadingMessages ? (
                    <div className="flex justify-center py-20">
                      <Loader2 className="animate-spin text-orange-400" size={28} />
                    </div>
                  ) : messages.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-slate-400 space-y-2">
                      <MessageSquare size={36} strokeWidth={1.5} className="opacity-30" />
                      <p className="text-sm font-bold">ابدأ المحادثة</p>
                    </div>
                  ) : (
                    messages.map(msg => {
                      const isAdmin = msg.senderId === adminId;
                      return (
                        <div key={msg.id} className={`flex ${isAdmin ? 'justify-start' : 'justify-end'}`}>
                          <div className={`max-w-[65%] ${isAdmin ? '' : ''}`}>
                            <div className={`px-4 py-3 rounded-2xl text-sm font-medium shadow-sm ${
                              isAdmin 
                                ? 'bg-white text-slate-800 rounded-br-md border border-slate-100' 
                                : 'bg-orange-500 text-white rounded-bl-md shadow-orange-100'
                            }`}>
                              {msg.text}
                            </div>
                            <div className={`flex items-center gap-1 mt-1 px-1 ${isAdmin ? 'flex-row' : 'flex-row-reverse'}`}>
                              <span className="text-[10px] text-slate-400">
                                {new Date(msg.createdAt).toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' })}
                              </span>
                              {isAdmin && <CheckCheck size={12} className={msg.isRead ? 'text-orange-500' : 'text-slate-300'} />}
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>

                {/* Input */}
                <div className="bg-white px-6 py-4 border-t border-slate-100 shrink-0">
                  <div className="flex items-end gap-3">
                    <textarea
                      ref={inputRef}
                      rows={1}
                      value={messageText}
                      onChange={e => setMessageText(e.target.value)}
                      onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
                      placeholder="اكتب رسالتك..."
                      className="flex-1 bg-slate-50 rounded-2xl border border-slate-200 px-4 py-3 text-sm font-medium focus:outline-none focus:border-orange-400 transition-all resize-none max-h-32"
                    />
                    <button
                      onClick={handleSend}
                      disabled={!messageText.trim() || sendMutation.isPending}
                      className="h-11 w-11 rounded-2xl bg-orange-500 text-white flex items-center justify-center shadow-lg shadow-orange-200 hover:bg-orange-600 active:scale-95 transition-all disabled:opacity-40 disabled:cursor-not-allowed shrink-0"
                    >
                      {sendMutation.isPending 
                        ? <Loader2 size={18} className="animate-spin" />
                        : <Send size={18} className="rotate-180" />
                      }
                    </button>
                  </div>
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="empty"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex-1 flex flex-col items-center justify-center p-10 text-center space-y-4"
              >
                <div className="h-24 w-24 rounded-[2rem] bg-slate-100 flex items-center justify-center text-slate-300">
                  <MessageSquare size={48} strokeWidth={1} />
                </div>
                <div>
                  <h3 className="text-lg font-black text-slate-800">اختر محادثة</h3>
                  <p className="text-sm text-slate-400 font-medium mt-1">اختر محادثة من القائمة لبدء الرد</p>
                </div>
                <div className="grid grid-cols-2 gap-3 max-w-xs w-full pt-4">
                  <div className="p-4 rounded-2xl bg-white border border-slate-100 text-right">
                    <Store size={18} className="text-orange-500 mb-2" />
                    <p className="text-xs font-black text-slate-700">استفسارات التجار</p>
                  </div>
                  <div className="p-4 rounded-2xl bg-white border border-slate-100 text-right">
                    <User size={18} className="text-indigo-500 mb-2" />
                    <p className="text-xs font-black text-slate-700">شكاوى العملاء</p>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
