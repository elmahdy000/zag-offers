'use client';

import React, { useState, useEffect, useRef, useCallback, memo } from 'react';
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
  isOptimistic?: boolean;
}

// 1. مكون الرسالة (معزول تماماً)
const MessageBubble = memo(({ msg, isMe }: { msg: Message, isMe: boolean }) => {
  const time = new Date(msg.createdAt).toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' });
  return (
    <div className={`flex ${isMe ? 'justify-end' : 'justify-start'} mb-3`}>
      <div className={`max-w-[80%] flex flex-col gap-1 ${isMe ? 'items-end' : 'items-start'}`}>
        <div className={`px-4 py-2.5 rounded-2xl text-[14px] font-bold shadow-sm ${
          isMe 
            ? 'bg-primary text-white rounded-bl-none shadow-primary/10' 
            : 'bg-white/5 border border-white/5 text-text rounded-br-none'
        } ${msg.isOptimistic ? 'opacity-50' : 'opacity-100'}`}>
          {msg.text}
        </div>
        <div className="flex items-center gap-1.5 px-1">
           <span className="text-[8px] font-black text-text-dimmer uppercase">{time}</span>
           {isMe && (
             <CheckCheck size={10} className={msg.isOptimistic ? 'text-text-dimmer/20' : (msg.isRead ? 'text-secondary' : 'text-text-dimmer')} />
           )}
        </div>
      </div>
    </div>
  );
});
MessageBubble.displayName = 'MessageBubble';

// 2. مكون الإدخال (معزول تماماً عن الصفحة لضمان سرعة الكتابة القصوى)
const ChatInput = memo(({ onSend }: { onSend: (text: string) => void }) => {
  const [inputValue, setInputValue] = useState('');

  const handleAction = () => {
    const t = inputValue.trim();
    if (!t) return;
    onSend(t);
    setInputValue('');
  };

  return (
    <div className="flex items-center gap-2 bg-white/5 border border-white/5 rounded-2xl p-1 focus-within:border-primary/30 transition-all">
      <input
        type="text"
        value={inputValue}
        onChange={e => setInputValue(e.target.value)}
        onKeyDown={e => { if (e.key === 'Enter') handleAction(); }}
        placeholder="اكتب هنا..."
        className="flex-1 bg-transparent px-4 py-3 text-[14px] font-bold text-text outline-none placeholder:text-text-dimmer/50"
      />
      <button
        onClick={handleAction}
        disabled={!inputValue.trim()}
        className="h-11 w-11 rounded-xl bg-primary text-white flex items-center justify-center shadow-lg shadow-primary/20 active:scale-90 transition-all disabled:opacity-20 shrink-0"
      >
        <Send size={18} className="rotate-180" />
      </button>
    </div>
  );
});
ChatInput.displayName = 'ChatInput';

export default function VendorChatPage() {
  const router = useRouter();
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState('');
  const socketRef = useRef<Socket | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (typeof localStorage !== 'undefined') {
      try {
        const user = JSON.parse(localStorage.getItem('vendor_user') || '{}');
        setUserId(user.id || '');
      } catch (e) {}
    }
  }, []);

  useEffect(() => {
    if (!userId) return;
    const initChat = async () => {
      try {
        const api = vendorApi();
        const convsRes = await api.get('/chat/conversations');
        let conv = convsRes.data?.[0];
        if (!conv) {
          const startRes = await api.post('/chat/start', { participantId: userId, type: 'MERCHANT_SUPPORT' });
          conv = startRes.data;
        }
        setConversationId(conv.id);
        const msgsRes = await api.get(`/chat/messages/${conv.id}`);
        setMessages(Array.isArray(msgsRes.data) ? msgsRes.data : []);
      } catch (e) {} finally { setLoading(false); }
    };
    initChat();
  }, [userId]);

  useEffect(() => {
    if (!userId) return;
    const token = getCookie('auth_token');
    if (!token) return;
    const s = io(SOCKET_URL, { 
      auth: { token }, 
      transports: ['websocket'],
      reconnection: true,
      reconnectionAttempts: 10,
      forceNew: true 
    });
    socketRef.current = s;

    s.on('connect', () => {
      console.log('Chat Socket Connected! Joining room:', userId);
      s.emit('join_room', { token, userId });
    });

    s.on('connect_error', (err) => {
      console.error('Socket Connection Error:', err.message);
    });

    s.on('new_message', (msg: Message) => {
      console.log('New real-time message received:', msg);
      setMessages(prev => {
        if (prev.some(m => m.id === msg.id)) return prev;
        const filtered = prev.filter(m => !(m.isOptimistic && m.text === msg.text));
        return [...filtered, msg];
      });
    });
    return () => { s.disconnect(); };
  }, [userId]);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages]);

  const handleSend = useCallback(async (msgText: string) => {
    const tmpId = `tmp-${Date.now()}`;
    const optimisticMsg: Message = {
      id: tmpId,
      text: msgText,
      senderId: userId,
      createdAt: new Date().toISOString(),
      isRead: false,
      isOptimistic: true
    };

    setMessages(prev => [...prev, optimisticMsg]);

    try {
      const api = vendorApi();
      const res = await api.post('/chat/send', {
        conversationId: conversationId,
        text: msgText,
      });
      setMessages(prev => prev.map(m => m.id === tmpId ? res.data : m));
    } catch (e) {
      setMessages(prev => prev.filter(m => m.id !== tmpId));
    }
  }, [userId, conversationId]);

  return (
    <div className="fixed inset-0 bg-bg z-[100] flex flex-col overflow-hidden" dir="rtl">
      {/* Header */}
      <div className="px-5 py-4 flex items-center gap-4 z-10 border-b border-white/5 bg-bg/80 backdrop-blur-xl shrink-0">
        <button onClick={() => router.back()} className="w-10 h-10 glass rounded-xl flex items-center justify-center text-text-dim border border-white/5">
          <ChevronRight size={20} />
        </button>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center shadow-lg shadow-primary/30">
            <MessageSquare size={18} className="text-white" />
          </div>
          <div className="flex flex-col">
            <h1 className="text-sm font-black text-text leading-tight">الدعم الفني</h1>
            <span className="text-[9px] font-bold text-emerald-400">متصل الآن</span>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-6 scrollbar-none">
        {loading ? (
          <div className="flex justify-center pt-10"><Loader2 className="animate-spin text-primary" size={24} /></div>
        ) : (
          messages.map(m => <MessageBubble key={m.id} msg={m} isMe={m.senderId === userId} />)
        )}
      </div>

      {/* Input - Isolated Component */}
      <div className="px-4 py-4 bg-bg border-t border-white/5 shrink-0">
        <ChatInput onSend={handleSend} />
      </div>
    </div>
  );
}
