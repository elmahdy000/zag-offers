'use client';

import React, { useState, useEffect, useRef, useCallback, memo } from 'react';
import { Send, MessageSquare, CheckCheck, Loader2, ChevronRight } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { vendorApi } from '@/lib/api';

import { secureUserData } from '@/lib/crypto';
import { useNotifications } from '@/components/notification-provider';


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
            : 'bg-glass-heavy border border-glass-border text-text rounded-br-none'
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
    <div className="flex items-center gap-2 bg-glass-heavy border border-glass-border rounded-2xl p-1 focus-within:border-primary/30 transition-all">
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
  const [userId] = useState(() => {
    try { return secureUserData.load()?.id || ''; }
    catch { return ''; }
  });
  const scrollRef = useRef<HTMLDivElement>(null);
  const { addError, socket } = useNotifications();

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
      } catch (e) { console.error('Failed to init chat:', e); addError('فشل تحميل المحادثة'); } finally { setLoading(false); }
    };
    initChat();
  }, [addError, userId]);

  useEffect(() => {
    if (!socket) return;
    const handleMessage = (msg: Message) => {
      setMessages(prev => {
        if (prev.some(m => m.id === msg.id)) return prev;
        const filtered = prev.filter(m => !(m.isOptimistic && m.text === msg.text));
        return [...filtered, msg];
      });
    };
    socket.on('new_message', handleMessage);
    return () => { socket.off('new_message', handleMessage); };
  }, [socket]);

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
    } catch {
      setMessages(prev => prev.filter(m => m.id !== tmpId));
      addError('فشل إرسال الرسالة');
    }
  }, [addError, userId, conversationId]);

  return (
    <div className="fixed inset-0 bg-bg z-[100] flex flex-col overflow-hidden" dir="rtl">
      {/* Header */}
      <div className="px-5 py-4 flex items-center gap-4 z-10 border-b border-glass-border bg-bg shrink-0">
        <button onClick={() => router.back()} className="w-10 h-10 glass rounded-xl flex items-center justify-center text-text-dim border border-glass-border">
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
      <div className="px-4 py-4 bg-bg border-t border-glass-border shrink-0">
        <ChatInput onSend={handleSend} />
      </div>
    </div>
  );
}
