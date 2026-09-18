import { useState, useEffect, useRef } from 'react';
import { getInbox, getSentMessages, getContacts, getConversation, sendMessage, markMessageRead, getUnreadCount } from '../../services/api';
import { useAuth } from '../../hooks/useAuth';
import { Inbox, Send, MessageSquare, User, RefreshCw, CheckCircle2, Circle } from 'lucide-react';

interface Contact {
  user_id: number;
  name: string;
  role: string;
  email: string;
  unread_count: number;
  last_message_at: string | null;
}

interface Message {
  id: number;
  sender_user_id: number;
  recipient_user_id: number;
  sender_name: string;
  sender_role: string;
  recipient_name: string;
  subject: string;
  body: string;
  is_read: boolean;
  parent_id: number | null;
  created_at: string;
}

export default function StudentInbox() {
  const { user } = useAuth();
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
  const [conversation, setConversation] = useState<Message[]>([]);
  const [replyBody, setReplyBody] = useState('');
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);
  const bottomRef = useRef<HTMLDivElement>(null);

  const loadContacts = async () => {
    try {
      setLoading(true);
      const [contactsRes, unreadRes] = await Promise.all([getContacts(), getUnreadCount()]);
      setContacts(contactsRes.data || []);
      setUnreadCount(unreadRes.data?.unread_count || 0);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const loadConversation = async (contact: Contact) => {
    try {
      const res = await getConversation(contact.user_id);
      const msgs: Message[] = res.data || [];
      setConversation(msgs);
      // Mark unread as read
      for (const m of msgs) {
        if (!m.is_read && m.recipient_user_id === user?.id) {
          await markMessageRead(m.id);
        }
      }
      // Refresh contacts to update unread counts
      loadContacts();
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    loadContacts();
  }, []);

  useEffect(() => {
    if (selectedContact) {
      loadConversation(selectedContact);
    }
  }, [selectedContact]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [conversation]);

  const handleSendReply = async () => {
    if (!selectedContact || !replyBody.trim()) return;
    setSending(true);
    try {
      await sendMessage({
        recipient_user_id: selectedContact.user_id,
        subject: 'Re: Message',
        body: replyBody.trim(),
      });
      setReplyBody('');
      await loadConversation(selectedContact);
    } catch (e) {
      console.error(e);
    } finally {
      setSending(false);
    }
  };

  const formatTime = (iso: string | null) => {
    if (!iso) return '';
    const d = new Date(iso);
    return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="flex h-[calc(100vh-8rem)] bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 overflow-hidden shadow-sm">
      {/* Sidebar: Contact List */}
      <div className="w-72 border-r border-gray-200 dark:border-gray-800 flex flex-col">
        <div className="p-4 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Inbox className="w-5 h-5 text-blue-600" />
            <h2 className="font-bold text-gray-900 dark:text-white text-sm">Inbox</h2>
            {unreadCount > 0 && (
              <span className="bg-blue-600 text-white text-xs font-bold px-2 py-0.5 rounded-full">{unreadCount}</span>
            )}
          </div>
          <button onClick={loadContacts} className="p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg cursor-pointer transition-colors" title="Refresh">
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center h-32 text-gray-400 text-sm">Loading...</div>
          ) : contacts.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-48 text-center px-4 text-gray-400 dark:text-gray-500 text-sm gap-2">
              <MessageSquare className="w-8 h-8 opacity-40" />
              <p>No messages yet.</p>
              <p className="text-xs">Employers can contact you here.</p>
            </div>
          ) : (
            contacts.map((c) => (
              <button
                key={c.user_id}
                onClick={() => setSelectedContact(c)}
                className={`w-full text-left px-4 py-3 border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors cursor-pointer ${selectedContact?.user_id === c.user_id ? 'bg-blue-50 dark:bg-blue-900/20' : ''}`}
              >
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-emerald-100 dark:bg-emerald-900/40 rounded-full flex items-center justify-center text-emerald-700 dark:text-emerald-400 font-bold text-xs flex-shrink-0">
                    {c.name?.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-gray-900 dark:text-white truncate">{c.name}</span>
                      {c.unread_count > 0 && (
                        <span className="bg-blue-600 text-white text-xs font-bold px-1.5 py-0.5 rounded-full flex-shrink-0">{c.unread_count}</span>
                      )}
                    </div>
                    <div className="text-[10px] text-gray-400 dark:text-gray-500">{c.email}</div>
                    {c.last_message_at && (
                      <div className="text-[10px] text-gray-400 dark:text-gray-500">{formatTime(c.last_message_at)}</div>
                    )}
                  </div>
                </div>
              </button>
            ))
          )}
        </div>
      </div>

      {/* Main: Conversation Area */}
      <div className="flex-1 flex flex-col">
        {!selectedContact ? (
          <div className="flex flex-col items-center justify-center h-full text-gray-400 dark:text-gray-500 gap-3">
            <MessageSquare className="w-12 h-12 opacity-30" />
            <p className="text-sm font-medium">Select a conversation</p>
            <p className="text-xs">Choose a contact on the left to view messages</p>
          </div>
        ) : (
          <>
            {/* Conversation Header */}
            <div className="px-5 py-3 border-b border-gray-200 dark:border-gray-800 flex items-center gap-3 bg-gray-50 dark:bg-gray-800/50">
              <div className="w-9 h-9 bg-emerald-100 dark:bg-emerald-900/40 rounded-full flex items-center justify-center text-emerald-700 dark:text-emerald-400 font-bold text-sm">
                {selectedContact.name?.charAt(0).toUpperCase()}
              </div>
              <div>
                <div className="font-semibold text-gray-900 dark:text-white text-sm">{selectedContact.name}</div>
                <div className="text-[11px] text-gray-400 dark:text-gray-500">{selectedContact.email}</div>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {conversation.length === 0 ? (
                <div className="flex items-center justify-center h-full text-gray-400 text-sm">No messages in this conversation yet.</div>
              ) : (
                conversation.map((msg) => {
                  const isMe = msg.sender_user_id === user?.id;
                  return (
                    <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-xs lg:max-w-md px-4 py-2.5 rounded-2xl text-sm ${isMe ? 'bg-blue-600 text-white rounded-br-sm' : 'bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white rounded-bl-sm'}`}>
                        {!isMe && <div className="text-[10px] font-semibold mb-1 opacity-70">{msg.sender_name}</div>}
                        <p className="leading-relaxed whitespace-pre-wrap">{msg.body}</p>
                        <div className={`text-[10px] mt-1.5 flex items-center gap-1 ${isMe ? 'text-blue-200 justify-end' : 'text-gray-400'}`}>
                          {formatTime(msg.created_at)}
                          {isMe && (msg.is_read ? <CheckCircle2 className="w-3 h-3" /> : <Circle className="w-3 h-3" />)}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={bottomRef} />
            </div>

            {/* Reply Box */}
            <div className="p-4 border-t border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900">
              <div className="flex gap-2">
                <textarea
                  className="flex-1 text-sm border border-gray-200 dark:border-gray-700 rounded-xl px-3 py-2.5 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                  rows={2}
                  placeholder="Type your reply..."
                  value={replyBody}
                  onChange={(e) => setReplyBody(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSendReply(); } }}
                />
                <button
                  onClick={handleSendReply}
                  disabled={sending || !replyBody.trim()}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-xl text-sm font-semibold cursor-pointer transition-colors flex items-center gap-2 self-end"
                >
                  <Send className="w-4 h-4" />
                  {sending ? 'Sending...' : 'Send'}
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
