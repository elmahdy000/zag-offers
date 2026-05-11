'use client';

import { useState, useEffect, useRef } from 'react';
import { Send, MessageSquare, CheckCheck, Loader2, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { vendorApi, getCookie } from '@/lib/api';
import { io, Socket } from 'socket.io-client';

const SOCKET_URL = (process.env.NEXT_PUBLIC_API_URL || 'https://api.zagoffers.online').replace(/\/$/, '');

interface Message {
  id: string;
  text: string;
  senderId: string;
  createdAt: string;
  isRead: boolean;
  conversationId?: string;
}

interface Conversation {
  id: string;
  adminId: string;
  participantId: string;
  messages: Message[];
  lastMessageAt: string;
}

function getUserId(): string {
  try {
    if (typeof localStorage === 'undefined') return '';
    return JSON.parse(localStorage.getItem('vendor_user') || '{}').id || '';
  } catch { return ''; }
}

function timeStr(iso: string) {
  return new Date(iso).toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' });
}

export default function VendorChatPage() {
  const router = useRouter();
  const [conversation, setConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const socketRef = useRef<Socket | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const [userId, setUserId] = useState('');

  // Read userId client-side only
  useEffect(() => {
    setUserId(getUserId());
  }, []);

  /* ── Load or start conversation ── */
  useEffect(() => {
    if (!userId) return;

    async function init() {
      setLoading(true);
      setError('');
      try {
        const api = vendorApi();

        // Get existing conversations
        const res = await api.get<Conversation[]>('/chat/conversations');
        const convs = Array.isArray(res.data) ? res.data : [];
        let conv = convs[0] || null;

        // If no conversation, start one with the admin
        if (!conv) {
          const startRes = await api.post<Conversation>('/chat/start', {
            participantId: userId,
            type: 'MERCHANT_SUPPORT',
          });
          conv = startRes.data;
        }

        setConversation(conv);

        if (conv?.id) {
          const msgRes = await api.get<Message[]>(`/chat/messages/${conv.id}`);
          setMessages(Array.isArray(msgRes.data) ? msgRes.data : []);
        }
      } catch (err) {
        console.error('Chat init error:', err);
        setError('تعذر تحميل المحادثة، تأكد من اتصالك بالإنترنت');
      } finally {
        setLoading(false);
      }
    }

    init();
  }, [userId]);

  /* ── WebSocket ── */
  useEffect(() => {
    if (!userId) return;
    const token = getCookie('auth_token');
    if (!token) return;

    const s = io(SOCKET_URL, { auth: { token }, transports: ['websocket'] });
    socketRef.current = s;
    s.emit('join', userId);
    s.on('new_message', (msg: Message) => {
      if (!conversation || msg.conversationId === conversation.id) {
        setMessages(prev => [...prev, msg]);
      }
    });
    return () => { s.disconnect(); };
  }, [userId, conversation?.id]);

  /* ── Auto scroll ── */
  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages]);

  /* ── Send ── */
  async function handleSend() {
    const t = text.trim();
    if (!t || sending) return;

    // Optimistically update UI
    const optimistic: Message = {
      id: `tmp-${Date.now()}`,
      text: t,
      senderId: userId,
      createdAt: new Date().toISOString(),
      isRead: false,
    };

    setSending(true);
    setText('');
    setMessages(prev => [...prev, optimistic]);

    try {
      let convId = conversation?.id;

      // Create conversation on-the-fly if still null
      if (!convId) {
        const api = vendorApi();
        const startRes = await api.post<Conversation>('/chat/start', {
          participantId: userId,
          type: 'MERCHANT_SUPPORT',
        });
        const newConv = startRes.data;
        setConversation(newConv);
        convId = newConv.id;
      }

      const api = vendorApi();
      const res = await api.post<Message>('/chat/send', {
        conversationId: convId,
        text: t,
      });

      // Replace optimistic with real message
      setMessages(prev => prev.map(m => m.id === optimistic.id ? res.data : m));
    } catch {
      // Remove optimistic message on failure
      setMessages(prev => prev.filter(m => m.id !== optimistic.id));
      setText(t); // Restore text
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-bg z-[100] flex flex-col" dir="rtl">
      {/* Decor */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/10 blur-[120px] rounded-full pointer-events-none" />

      {/* Header */}
      <div className="relative px-5 pt-5 pb-3 flex items-center gap-4 z-10 border-b border-white/5 bg-bg/80 backdrop-blur-xl shrink-0">
        <button
          onClick={() => router.back()}
          className="w-10 h-10 glass rounded-xl flex items-center justify-center text-text-dim hover:text-primary transition-all border border-white/5"
        >
          <ChevronRight size={20} />
        </button>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center shadow-lg shadow-primary/30">
            <MessageSquare size={18} className="text-white" />
          </div>
          <div>
            <h1 className="text-sm font-black text-text">الدعم الفني</h1>
            <div className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse" />
              <span className="text-[10px] font-bold text-text-dimmer">فريق زاچ أوفرز</span>
            </div>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-6 space-y-3">
        {loading ? (
          <div className="flex justify-center pt-20">
            <Loader2 className="animate-spin text-primary" size={32} />
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center pt-20 gap-4 text-center px-6">
            <div className="w-14 h-14 bg-red-500/10 rounded-2xl flex items-center justify-center">
              <MessageSquare size={24} className="text-red-400" />
            </div>
            <p className="text-red-400 text-sm font-bold">{error}</p>
            <button onClick={() => { setError(''); setLoading(true); setUserId(getUserId()); }}
              className="text-primary text-[12px] font-black border border-primary/30 px-4 py-2 rounded-xl hover:bg-primary/10 transition-all">
              إعادة المحاولة
            </button>
          </div>
        ) : (
          <>
            {/* Welcome note */}
            <div className="flex justify-center">
              <span className="px-4 py-1.5 rounded-full bg-white/5 text-text-dimmer text-[10px] font-black uppercase tracking-widest border border-white/5">
                مرحباً بك في الدعم
              </span>
            </div>

            {messages.length === 0 && (
              <div className="flex justify-start">
                <div className="max-w-[75%] px-4 py-3 rounded-2xl rounded-br-md bg-white/5 border border-white/10 text-sm font-medium text-text-dim">
                  أهلاً! كيف يمكننا مساعدتك اليوم؟ 👋
                </div>
              </div>
            )}

            <AnimatePresence initial={false}>
              {messages.map(msg => {
                const isMe = msg.senderId === userId;
                return (
                  <motion.div
                    key={msg.id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}
                  >
                    <div className={`max-w-[75%] flex flex-col gap-1 ${isMe ? 'items-end' : 'items-start'}`}>
                      <div className={`px-4 py-3 rounded-2xl text-sm font-medium shadow-sm ${
                        isMe
                          ? 'bg-primary text-white rounded-bl-md shadow-primary/20'
                          : 'bg-white/[0.06] border border-white/10 text-text rounded-br-md'
                      } ${msg.id.startsWith('tmp-') ? 'opacity-60' : ''}`}>
                        {msg.text}
                      </div>
                      <div className={`flex items-center gap-1 px-1 ${isMe ? 'flex-row-reverse' : 'flex-row'}`}>
                        <span className="text-[9px] text-text-dimmer">{timeStr(msg.createdAt)}</span>
                        {isMe && <CheckCheck size={11} className={msg.isRead ? 'text-primary' : 'text-white/20'} />}
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </>
        )}
      </div>

      {/* Input */}
      <div className="px-4 py-4 bg-bg/80 backdrop-blur-xl border-t border-white/5 shrink-0">
        <div className="flex items-end gap-3">
          <textarea
            rows={1}
            value={text}
            onChange={e => setText(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
            placeholder="اكتب رسالتك..."
            className="flex-1 bg-white/5 border border-white/10 rounded-2xl px-4 py-3 text-sm font-medium text-text placeholder:text-text-dimmer focus:outline-none focus:border-primary/40 transition-all resize-none max-h-28"
          />
          <button
            onClick={handleSend}
            disabled={!text.trim() || sending}
            className="h-11 w-11 rounded-2xl bg-primary text-white flex items-center justify-center shadow-xl shadow-primary/30 active:scale-95 transition-all disabled:opacity-30 disabled:cursor-not-allowed shrink-0"
          >
            {sending
              ? <Loader2 size={18} className="animate-spin" />
              : <Send size={18} className="rotate-180" />
            }
          </button>
        </div>
      </div>
    </div>
  );
}
