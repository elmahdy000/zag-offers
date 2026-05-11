'use client';

import { useState, useEffect, useRef } from 'react';
import { Send, MessageSquare, CheckCheck, Loader2, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { getCookie } from '@/lib/api';
import { io, Socket } from 'socket.io-client';

const API_URL = (process.env.NEXT_PUBLIC_API_URL || 'https://api.zagoffers.online').replace(/\/$/, '');

interface Message {
  id: string;
  text: string;
  senderId: string;
  createdAt: string;
  isRead: boolean;
}

interface Conversation {
  id: string;
  adminId: string;
  messages: Message[];
  lastMessageAt: string;
}

function getUserId(): string {
  try {
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
  const socketRef = useRef<Socket | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const userId = getUserId();
  const token = getCookie('auth_token') || '';

  /* ── Load or start conversation ── */
  useEffect(() => {
    async function init() {
      setLoading(true);
      try {
        // Get existing conversations
        const res = await fetch(`${API_URL}/api/chat/conversations`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        const convs: Conversation[] = res.ok ? await res.json() : [];
        let conv = convs[0] || null;

        // If no conversation, start one
        if (!conv) {
          const startRes = await fetch(`${API_URL}/api/chat/start`, {
            method: 'POST',
            headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({ participantId: userId, type: 'MERCHANT_SUPPORT' })
          });
          if (startRes.ok) conv = await startRes.json();
        }

        setConversation(conv);

        if (conv) {
          const msgRes = await fetch(`${API_URL}/api/chat/messages/${conv.id}`, {
            headers: { Authorization: `Bearer ${token}` }
          });
          if (msgRes.ok) setMessages(await msgRes.json());
        }
      } catch { /* silent */ } finally {
        setLoading(false);
      }
    }
    if (token && userId) init();
  }, [token, userId]);

  /* ── WebSocket ── */
  useEffect(() => {
    if (!token || !userId) return;
    const s = io(API_URL, { auth: { token }, transports: ['websocket'] });
    socketRef.current = s;
    s.emit('join', userId);
    s.on('new_message', (msg: Message & { conversationId: string }) => {
      if (msg.conversationId === conversation?.id) {
        setMessages(prev => [...prev, msg]);
      }
    });
    return () => { s.disconnect(); };
  }, [token, userId, conversation?.id]);

  /* ── Auto scroll ── */
  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages]);

  /* ── Send ── */
  async function handleSend() {
    const t = text.trim();
    if (!t || !conversation || sending) return;
    setSending(true);
    setText('');
    try {
      const res = await fetch(`${API_URL}/api/chat/send`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ conversationId: conversation.id, text: t })
      });
      if (res.ok) {
        const msg = await res.json();
        setMessages(prev => [...prev, msg]);
      }
    } catch { /* silent */ } finally {
      setSending(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-bg z-[100] flex flex-col" dir="rtl">
      {/* Decor */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/10 blur-[120px] rounded-full pointer-events-none" />

      {/* Header */}
      <div className="relative px-5 pt-5 pb-3 flex items-center gap-4 z-10 border-b border-white/5 bg-bg/80 backdrop-blur-xl">
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

            <AnimatePresence>
              {messages.map(msg => {
                const isMe = msg.senderId === userId;
                return (
                  <motion.div
                    key={msg.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}
                  >
                    <div className={`max-w-[75%] ${isMe ? 'items-end' : 'items-start'} flex flex-col gap-1`}>
                      <div className={`px-4 py-3 rounded-2xl text-sm font-medium shadow-sm ${
                        isMe
                          ? 'bg-primary text-white rounded-bl-md shadow-primary/20'
                          : 'bg-white/[0.06] border border-white/10 text-text rounded-br-md'
                      }`}>
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
      <div className="px-4 py-4 bg-bg/80 backdrop-blur-xl border-t border-white/5">
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
            disabled={!text.trim() || sending || !conversation}
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
