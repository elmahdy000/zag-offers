'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
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
  isOptimistic?: boolean; // علامة للرسائل التي لم تصل للسيرفر بعد
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
  const [error, setError] = useState('');
  const socketRef = useRef<Socket | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const [userId, setUserId] = useState('');

  useEffect(() => {
    setUserId(getUserId());
  }, []);

  /* ── Load conversation ── */
  useEffect(() => {
    if (!userId) return;

    async function init() {
      setLoading(true);
      setError('');
      try {
        const api = vendorApi();
        const res = await api.get<Conversation[]>('/chat/conversations');
        const convs = Array.isArray(res.data) ? res.data : [];
        let conv = convs[0] || null;

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
        setError('تعذر تحميل المحادثة، تأكد من اتصالك بالإنترنت');
      } finally {
        setLoading(false);
      }
    }
    init();
  }, [userId]);

  /* ── WebSocket with duplication check ── */
  useEffect(() => {
    if (!userId) return;
    const token = getCookie('auth_token');
    if (!token) return;

    const s = io(SOCKET_URL, { auth: { token }, transports: ['websocket'] });
    socketRef.current = s;
    s.emit('join', userId);

    s.on('new_message', (msg: Message) => {
      setMessages(prev => {
        // منع التكرار إذا كانت الرسالة موجودة بالفعل (عن طريق الـ ID أو النص والتوقيت المتقارب)
        const exists = prev.some(m => m.id === msg.id || (m.isOptimistic && m.text === msg.text));
        if (exists) {
          // استبدال الرسالة التفاؤلية بالرسالة الحقيقية
          return prev.map(m => (m.isOptimistic && m.text === msg.text) ? msg : m);
        }
        return [...prev, msg];
      });
    });

    return () => { s.disconnect(); };
  }, [userId]);

  /* ── Auto scroll ── */
  const scrollToBottom = useCallback(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({
        top: scrollRef.current.scrollHeight,
        behavior: 'smooth'
      });
    }
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  /* ── Ultra Fast Send ── */
  const handleSend = async () => {
    const t = text.trim();
    if (!t) return;

    const optimisticId = `tmp-${Date.now()}`;
    const optimisticMsg: Message = {
      id: optimisticId,
      text: t,
      senderId: userId,
      createdAt: new Date().toISOString(),
      isRead: false,
      isOptimistic: true
    };

    // 1. تحديث الواجهة فوراً ومسح صندوق النص
    setMessages(prev => [...prev, optimisticMsg]);
    setText('');

    try {
      let convId = conversation?.id;
      const api = vendorApi();

      if (!convId) {
        const startRes = await api.post<Conversation>('/chat/start', {
          participantId: userId,
          type: 'MERCHANT_SUPPORT',
        });
        setConversation(startRes.data);
        convId = startRes.data.id;
      }

      // 2. الإرسال في الخلفية
      const res = await api.post<Message>('/chat/send', {
        conversationId: convId,
        text: t,
      });

      // 3. تحديث الرسالة التفاؤلية بالبيانات الحقيقية
      setMessages(prev => prev.map(m => m.id === optimisticId ? { ...res.data, isOptimistic: false } : m));
    } catch (err) {
      // إذا فشل الإرسال، نترك الرسالة مع علامة خطأ أو نحذفها
      setMessages(prev => prev.filter(m => m.id !== optimisticId));
      setText(t); // إعادة النص للصندوق ليحاول المستخدم مرة أخرى
    }
  };

  return (
    <div className="fixed inset-0 bg-bg z-[100] flex flex-col" dir="rtl">
      {/* Header */}
      <div className="relative px-5 pt-5 pb-3 flex items-center gap-4 z-10 border-b border-white/5 bg-bg/80 backdrop-blur-xl shrink-0">
        <button onClick={() => router.back()} className="w-10 h-10 glass rounded-xl flex items-center justify-center text-text-dim border border-white/5">
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

      {/* Messages Area */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-6 space-y-4 scroll-smooth">
        {loading ? (
          <div className="flex justify-center pt-20"><Loader2 className="animate-spin text-primary" size={32} /></div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center pt-20 gap-4 text-center px-6">
            <p className="text-red-400 text-sm font-bold">{error}</p>
            <button onClick={() => window.location.reload()} className="text-primary text-[12px] font-black border border-primary/30 px-4 py-2 rounded-xl">إعادة المحاولة</button>
          </div>
        ) : (
          <AnimatePresence initial={false}>
            {messages.map((msg, idx) => {
              const isMe = msg.senderId === userId;
              const isLast = idx === messages.length - 1;
              return (
                <motion.div
                  key={msg.id}
                  initial={isLast ? { opacity: 0, y: 10, scale: 0.95 } : false}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}
                >
                  <div className={`max-w-[80%] flex flex-col gap-1 ${isMe ? 'items-end' : 'items-start'}`}>
                    <div className={`px-4 py-2.5 rounded-2xl text-[13px] font-bold shadow-sm transition-opacity ${
                      isMe 
                        ? 'bg-primary text-white rounded-bl-none shadow-primary/10' 
                        : 'bg-white/5 border border-white/5 text-text rounded-br-none'
                    } ${msg.isOptimistic ? 'opacity-50 animate-pulse' : 'opacity-100'}`}>
                      {msg.text}
                    </div>
                    <div className="flex items-center gap-1.5 px-1">
                       <span className="text-[8px] font-black text-text-dimmer uppercase">{timeStr(msg.createdAt)}</span>
                       {isMe && (
                         <CheckCheck size={10} className={msg.isOptimistic ? 'text-text-dimmer/20' : (msg.isRead ? 'text-secondary' : 'text-text-dimmer')} />
                       )}
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        )}
      </div>

      {/* Modern Input Bar */}
      <div className="px-4 py-4 bg-bg/80 backdrop-blur-xl border-t border-white/5 shrink-0">
        <div className="flex items-center gap-3 bg-white/5 border border-white/5 rounded-2xl p-1.5 focus-within:border-primary/30 transition-all">
          <input
            type="text"
            value={text}
            onChange={e => setText(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') handleSend(); }}
            placeholder="اكتب هنا..."
            className="flex-1 bg-transparent px-4 py-2 text-sm font-bold text-text outline-none placeholder:text-text-dimmer/50"
          />
          <button
            onClick={handleSend}
            disabled={!text.trim()}
            className="h-10 w-10 rounded-xl bg-primary text-white flex items-center justify-center shadow-lg shadow-primary/20 active:scale-90 transition-all disabled:opacity-20 disabled:grayscale shrink-0"
          >
            <Send size={18} className="rotate-180" />
          </button>
        </div>
      </div>
    </div>
  );
}
