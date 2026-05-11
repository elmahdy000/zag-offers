'use client';

import { useState, useEffect, useRef } from 'react';
import { 
  Send, 
  Search, 
  MessageSquare, 
  User, 
  Store, 
  MoreVertical, 
  Paperclip, 
  Smile, 
  CheckCheck,
  Clock,
  Phone,
  Info,
  ChevronRight,
  Filter
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { PageHeader } from '@/components/shared/PageHeader';
import { adminApi, resolveImageUrl } from '@/lib/api';
import { useQuery } from '@tanstack/react-query';

interface Contact {
  id: string;
  name: string;
  avatar?: string;
  role: 'CUSTOMER' | 'MERCHANT';
  lastMessage?: string;
  lastMessageAt?: string;
  unreadCount?: number;
  online?: boolean;
}

interface Message {
  id: string;
  text: string;
  senderId: string;
  createdAt: string;
  isRead: boolean;
}

export default function AdminChatPage() {
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
  const [messageText, setMessageText] = useState('');
  const [chatType, setChatType] = useState<'all' | 'customer' | 'merchant'>('all');
  const scrollRef = useRef<HTMLDivElement>(null);

  // Mock data for initial design
  const contacts: Contact[] = [
    { 
      id: '1', 
      name: 'أحمد محمد', 
      role: 'CUSTOMER', 
      lastMessage: 'أهلاً بك، عندي استفسار بخصوص كود الخصم', 
      lastMessageAt: new Date().toISOString(), 
      unreadCount: 2,
      online: true 
    },
    { 
      id: '2', 
      name: 'محل البركة', 
      role: 'MERCHANT', 
      lastMessage: 'تم تحديث العروض الجديدة', 
      lastMessageAt: new Date(Date.now() - 3600000).toISOString(), 
      unreadCount: 0,
      online: false 
    },
    { 
      id: '3', 
      name: 'سارة خالد', 
      role: 'CUSTOMER', 
      lastMessage: 'شكراً جزيلاً على المساعدة', 
      lastMessageAt: new Date(Date.now() - 86400000).toISOString(), 
      unreadCount: 0,
      online: true 
    },
  ];

  const messages: Message[] = [
    { id: '1', text: 'السلام عليكم، كيف يمكنني مساعدتك؟', senderId: 'admin', createdAt: new Date(Date.now() - 7200000).toISOString(), isRead: true },
    { id: '2', text: 'أهلاً بك، عندي استفسار بخصوص كود الخصم', senderId: 'user', createdAt: new Date(Date.now() - 3600000).toISOString(), isRead: true },
    { id: '3', text: 'بالطبع، أي كود تقصد؟', senderId: 'admin', createdAt: new Date(Date.now() - 1800000).toISOString(), isRead: true },
    { id: '4', text: 'كود ZAG50 لا يعمل في محل البركة', senderId: 'user', createdAt: new Date().toISOString(), isRead: false },
  ];

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, selectedContact]);

  const filteredContacts = contacts.filter(c => {
    if (chatType === 'all') return true;
    if (chatType === 'customer') return c.role === 'CUSTOMER';
    if (chatType === 'merchant') return c.role === 'MERCHANT';
    return true;
  });

  return (
    <div className="flex flex-col h-[calc(100vh-80px)] p-6 lg:p-10 space-y-6 overflow-hidden">
      <div className="flex items-center justify-between">
        <PageHeader 
          title="مركز الدعم والمحادثات" 
          description="تواصل مباشرة مع العملاء وأصحاب المتاجر لحل المشكلات والاستفسارات" 
          icon={MessageSquare}
        />
      </div>

      <div className="flex-1 flex gap-6 bg-white rounded-[2.5rem] border border-slate-200 shadow-sm overflow-hidden p-2">
        
        {/* Sidebar - Contacts List */}
        <div className="w-80 flex flex-col border-l border-slate-100">
          <div className="p-6 space-y-4">
            <div className="relative">
              <Search className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input 
                placeholder="بحث عن محادثة..." 
                className="w-full h-12 pr-11 pl-4 rounded-2xl bg-slate-50 border border-slate-100 text-sm font-bold focus:outline-none focus:border-indigo-500 transition-all"
              />
            </div>
            
            <div className="flex gap-2 p-1 bg-slate-50 rounded-xl">
              {['all', 'customer', 'merchant'].map((type) => (
                <button
                  key={type}
                  onClick={() => setChatType(type as any)}
                  className={`flex-1 py-2 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all ${
                    chatType === type ? 'bg-white text-indigo-600 shadow-sm border border-slate-200' : 'text-slate-400 hover:text-slate-600'
                  }`}
                >
                  {type === 'all' ? 'الكل' : type === 'customer' ? 'عملاء' : 'تجار'}
                </button>
              ))}
            </div>
          </div>

          <div className="flex-1 overflow-y-auto px-4 space-y-2 pb-4">
            {filteredContacts.map((contact) => (
              <button
                key={contact.id}
                onClick={() => setSelectedContact(contact)}
                className={`w-full flex items-center gap-4 p-4 rounded-[1.5rem] transition-all group ${
                  selectedContact?.id === contact.id ? 'bg-indigo-50 border border-indigo-100' : 'hover:bg-slate-50 border border-transparent'
                }`}
              >
                <div className="relative shrink-0">
                  <div className={`h-12 w-12 rounded-2xl flex items-center justify-center font-bold text-white shadow-lg ${
                    contact.role === 'MERCHANT' ? 'bg-orange-500 shadow-orange-900/10' : 'bg-indigo-600 shadow-indigo-900/10'
                  }`}>
                    {contact.avatar ? (
                      <img src={resolveImageUrl(contact.avatar)} className="h-full w-full object-cover rounded-2xl" />
                    ) : (
                      contact.name.charAt(0)
                    )}
                  </div>
                  {contact.online && (
                    <span className="absolute -bottom-0.5 -right-0.5 h-3.5 w-3.5 bg-emerald-500 border-2 border-white rounded-full" />
                  )}
                </div>
                
                <div className="flex-1 text-right min-w-0">
                  <div className="flex items-center justify-between gap-2 mb-0.5">
                    <h4 className="text-sm font-black text-slate-900 truncate">{contact.name}</h4>
                    <span className="text-[10px] font-bold text-slate-400 whitespace-nowrap">
                      {new Date(contact.lastMessageAt || '').toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <p className="text-[11px] font-medium text-slate-400 truncate leading-relaxed">
                    {contact.lastMessage}
                  </p>
                </div>

                {contact.unreadCount && contact.unreadCount > 0 ? (
                  <div className="h-5 w-5 rounded-full bg-indigo-600 text-white text-[10px] font-black flex items-center justify-center shadow-lg shadow-indigo-900/20">
                    {contact.unreadCount}
                  </div>
                ) : null}
              </button>
            ))}
          </div>
        </div>

        {/* Chat Area */}
        <div className="flex-1 flex flex-col bg-slate-50/50">
          {selectedContact ? (
            <>
              {/* Chat Header */}
              <div className="bg-white p-6 border-b border-slate-100 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className={`h-12 w-12 rounded-2xl flex items-center justify-center font-bold text-white ${
                    selectedContact.role === 'MERCHANT' ? 'bg-orange-500' : 'bg-indigo-600'
                  }`}>
                    {selectedContact.name.charAt(0)}
                  </div>
                  <div>
                    <h3 className="text-base font-black text-slate-900 leading-none">{selectedContact.name}</h3>
                    <div className="flex items-center gap-1.5 mt-1.5">
                      <span className={`h-1.5 w-1.5 rounded-full ${selectedContact.online ? 'bg-emerald-500' : 'bg-slate-300'}`} />
                      <span className="text-[10px] font-bold text-slate-400">
                        {selectedContact.online ? 'متصل الآن' : 'غير متصل'}
                      </span>
                      <span className="mx-2 text-slate-200">|</span>
                      <span className="text-[10px] font-black text-slate-500 bg-slate-100 px-2 py-0.5 rounded-lg">
                        {selectedContact.role === 'MERCHANT' ? 'صاحب محل' : 'عميل'}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button className="h-10 w-10 flex items-center justify-center rounded-xl bg-slate-50 text-slate-400 hover:text-slate-900 transition-all border border-slate-100">
                    <Phone size={18} />
                  </button>
                  <button className="h-10 w-10 flex items-center justify-center rounded-xl bg-slate-50 text-slate-400 hover:text-slate-900 transition-all border border-slate-100">
                    <Info size={18} />
                  </button>
                  <button className="h-10 w-10 flex items-center justify-center rounded-xl bg-slate-50 text-slate-400 hover:text-slate-900 transition-all border border-slate-100">
                    <MoreVertical size={18} />
                  </button>
                </div>
              </div>

              {/* Messages Area */}
              <div 
                ref={scrollRef}
                className="flex-1 overflow-y-auto p-8 space-y-6 scrollbar-hide"
              >
                <div className="flex justify-center">
                  <span className="px-4 py-1.5 rounded-full bg-slate-200/50 text-slate-500 text-[10px] font-black uppercase tracking-widest">اليوم</span>
                </div>

                {messages.map((msg) => (
                  <div 
                    key={msg.id}
                    className={`flex ${msg.senderId === 'admin' ? 'justify-start' : 'justify-end'}`}
                  >
                    <div className={`max-w-[70%] group ${msg.senderId === 'admin' ? 'items-start' : 'items-end'}`}>
                      <div className={`p-4 rounded-[1.5rem] text-sm font-bold shadow-sm ${
                        msg.senderId === 'admin' 
                          ? 'bg-white text-slate-900 rounded-br-none' 
                          : 'bg-indigo-600 text-white rounded-bl-none shadow-indigo-900/10'
                      }`}>
                        {msg.text}
                      </div>
                      <div className={`flex items-center gap-2 mt-2 px-1 ${msg.senderId === 'admin' ? 'flex-row' : 'flex-row-reverse'}`}>
                        <span className="text-[10px] font-bold text-slate-400">
                          {new Date(msg.createdAt).toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' })}
                        </span>
                        {msg.senderId === 'admin' && (
                          <div className={msg.isRead ? 'text-indigo-600' : 'text-slate-300'}>
                            <CheckCheck size={14} />
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Input Area */}
              <div className="p-6 bg-white border-t border-slate-100">
                <div className="relative flex items-end gap-4">
                  <div className="flex-1 relative">
                    <textarea 
                      rows={1}
                      placeholder="اكتب رسالتك هنا..."
                      value={messageText}
                      onChange={(e) => setMessageText(e.target.value)}
                      className="w-full bg-slate-50 rounded-[1.5rem] border border-slate-100 pr-12 pl-12 py-4 text-sm font-bold focus:outline-none focus:border-indigo-500 transition-all resize-none shadow-inner"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault();
                          // Handle send
                        }
                      }}
                    />
                    <button className="absolute right-4 bottom-4 text-slate-400 hover:text-indigo-600 transition-all">
                      <Smile size={22} />
                    </button>
                    <button className="absolute left-4 bottom-4 text-slate-400 hover:text-indigo-600 transition-all">
                      <Paperclip size={22} />
                    </button>
                  </div>
                  <button className="h-[52px] w-[52px] rounded-2xl bg-indigo-600 text-white flex items-center justify-center shadow-xl shadow-indigo-900/20 hover:bg-indigo-700 active:scale-95 transition-all">
                    <Send size={24} className="rotate-180" />
                  </button>
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center p-10 text-center space-y-6">
              <div className="h-32 w-32 rounded-[2.5rem] bg-indigo-50 flex items-center justify-center text-indigo-200 border border-indigo-100">
                <MessageSquare size={64} strokeWidth={1} />
              </div>
              <div>
                <h3 className="text-xl font-black text-slate-900">مركز المحادثات</h3>
                <p className="text-sm font-bold text-slate-400 mt-2 max-w-sm">اختر محادثة من القائمة الجانبية للبدء في التواصل مع العملاء أو أصحاب المتاجر</p>
              </div>
              <div className="grid grid-cols-2 gap-4 max-w-md w-full mt-10">
                <div className="p-6 rounded-3xl bg-white border border-slate-100 shadow-sm text-right">
                  <div className="h-10 w-10 rounded-xl bg-orange-50 text-orange-600 flex items-center justify-center mb-4"><Store size={20} /></div>
                  <h4 className="text-xs font-black text-slate-900">استفسارات المتاجر</h4>
                  <p className="text-[10px] font-bold text-slate-400 mt-1">تواصل مع أصحاب المتاجر بخصوص عروضهم</p>
                </div>
                <div className="p-6 rounded-3xl bg-white border border-slate-100 shadow-sm text-right">
                  <div className="h-10 w-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center mb-4"><User size={20} /></div>
                  <h4 className="text-xs font-black text-slate-900">شكاوى العملاء</h4>
                  <p className="text-[10px] font-bold text-slate-400 mt-1">حل مشاكل العملاء وتلقي ملاحظاتهم</p>
                </div>
              </div>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
