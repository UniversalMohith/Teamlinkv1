import { useState, useEffect, useRef } from 'react';
import { MessageCircle, X, Send, Maximize2, ChevronRight, Hash } from 'lucide-react';
import { Input } from './ui/input';
import { teamAPI, messagesAPI } from '../../utils/api';

interface UniversalChatProps {
  user: {
    id: string;
    name?: string;
    first_name?: string;
    last_name?: string;
    email: string;
    avatar?: string;
    avatar_initials?: string;
  };
  onNavigateToChat?: () => void;
}

interface Conversation {
  id: string;
  name: string;
  lastMessage?: string;
  unread: number;
}

interface ChatMessage {
  id: string;
  sender: string;
  senderName: string;
  content: string;
  time: string;
  isOwn: boolean;
}

export function UniversalChat({ user, onNavigateToChat }: UniversalChatProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConversation, setActiveConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isLoadingConversations, setIsLoadingConversations] = useState(false);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const unsubRef = useRef<(() => void) | null>(null);

  const userName = user.name || `${user.first_name || ''} ${user.last_name || ''}`.trim() || 'User';
  const userAvatar = user.avatar || user.avatar_initials || 'U';
  const totalUnread = conversations.reduce((acc, c) => acc + c.unread, 0);

  // Load conversations (teams/projects as channels)
  useEffect(() => {
    if (!isOpen) return;
    const load = async () => {
      setIsLoadingConversations(true);
      try {
        const teams = await teamAPI.getAll(user.id);
        setConversations(
          (teams || []).map((t: any) => ({
            id: t.id,
            name: t.name || 'Unnamed',
            lastMessage: '',
            unread: 0,
          }))
        );
      } catch {
        // silent
      } finally {
        setIsLoadingConversations(false);
      }
    };
    load();
  }, [isOpen, user.id]);

  // Load messages when conversation is selected
  useEffect(() => {
    if (!activeConversation) return;

    const loadMessages = async () => {
      setIsLoadingMessages(true);
      try {
        const msgs = await messagesAPI.getByTeam(activeConversation.id);
        setMessages(
          (msgs || []).map((m: any) => ({
            id: m.id,
            sender: m.sender || m.senderId || '',
            senderName: m.senderName || m.sender_name || 'User',
            content: m.content || m.message || '',
            time: m.created_at
              ? new Date(m.created_at).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
              : '',
            isOwn: (m.sender || m.senderId) === user.id,
          }))
        );
      } catch {
        // silent
      } finally {
        setIsLoadingMessages(false);
      }
    };

    loadMessages();

    // Subscribe to new messages
    if (unsubRef.current) unsubRef.current();
    unsubRef.current = messagesAPI.subscribeToTeam(activeConversation.id, (msgs) => {
      setMessages(
        (msgs || []).map((m: any) => ({
          id: m.id,
          sender: m.sender || m.senderId || '',
          senderName: m.senderName || m.sender_name || 'User',
          content: m.content || m.message || '',
          time: m.created_at
            ? new Date(m.created_at).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
            : '',
          isOwn: (m.sender || m.senderId) === user.id,
        }))
      );
    });

    return () => {
      if (unsubRef.current) {
        unsubRef.current();
        unsubRef.current = null;
      }
    };
  }, [activeConversation, user.id]);

  // Auto-scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async () => {
    if (!newMessage.trim() || !activeConversation) return;
    const content = newMessage;
    setNewMessage('');
    // Optimistic add
    const tempMsg: ChatMessage = {
      id: `temp-${Date.now()}`,
      sender: user.id,
      senderName: userName,
      content,
      time: new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }),
      isOwn: true,
    };
    setMessages(prev => [...prev, tempMsg]);
    try {
      await messagesAPI.send(activeConversation.id, user.id, content);
    } catch {
      // message will be replaced on next poll
    }
  };

  return (
    <>
      {/* Mini Bubble */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 z-50 w-14 h-14 bg-[rgb(var(--color-accent-primary))] dark:bg-[rgb(var(--color-accent-primary-dark))] hover:opacity-90 text-white rounded-full shadow-lg flex items-center justify-center transition-all duration-200 hover:scale-110 hover:shadow-xl"
        >
          <MessageCircle className="w-6 h-6" />
          {totalUnread > 0 && (
            <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center shadow-md">
              {totalUnread > 9 ? '9+' : totalUnread}
            </span>
          )}
        </button>
      )}

      {/* Expanded Panel */}
      {isOpen && (
        <div className="fixed bottom-6 right-6 z-50 w-[400px] h-[600px] bg-white dark:bg-gray-800 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 flex flex-col overflow-hidden transition-all duration-300 animate-in slide-in-from-bottom-4">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 flex-shrink-0">
            <div className="flex items-center gap-2">
              {activeConversation && (
                <button
                  onClick={() => setActiveConversation(null)}
                  className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors mr-1"
                >
                  <ChevronRight className="w-4 h-4 text-gray-500 rotate-180" />
                </button>
              )}
              <MessageCircle className="w-5 h-5 text-[rgb(var(--color-accent-primary))] dark:text-[rgb(var(--color-accent-primary-dark))]" />
              <span className="font-semibold text-gray-900 dark:text-white text-sm">
                {activeConversation ? activeConversation.name : 'Messages'}
              </span>
            </div>
            <div className="flex items-center gap-1">
              {onNavigateToChat && (
                <button
                  onClick={() => { setIsOpen(false); onNavigateToChat(); }}
                  className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                  title="Full page"
                >
                  <Maximize2 className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                </button>
              )}
              <button
                onClick={() => setIsOpen(false)}
                className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              >
                <X className="w-4 h-4 text-gray-500 dark:text-gray-400" />
              </button>
            </div>
          </div>

          {/* Body */}
          {!activeConversation ? (
            /* Conversations List */
            <div className="flex-1 overflow-y-auto">
              {isLoadingConversations ? (
                <div className="p-4 space-y-3 animate-pulse">
                  {[1, 2, 3].map(i => (
                    <div key={i} className="flex items-center gap-3 p-3">
                      <div className="w-10 h-10 rounded-full bg-gray-200 dark:bg-gray-700" />
                      <div className="flex-1 space-y-2">
                        <div className="h-3 w-24 bg-gray-200 dark:bg-gray-700 rounded" />
                        <div className="h-2 w-32 bg-gray-100 dark:bg-gray-700/50 rounded" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : conversations.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center p-6">
                  <div className="w-14 h-14 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center mb-3">
                    <MessageCircle className="w-7 h-7 text-gray-400 dark:text-gray-500" />
                  </div>
                  <p className="text-sm font-medium text-gray-900 dark:text-white mb-1">No conversations</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Create a project to start chatting with your team.</p>
                </div>
              ) : (
                <div className="p-2">
                  {conversations.map(conv => (
                    <button
                      key={conv.id}
                      onClick={() => setActiveConversation(conv)}
                      className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors text-left"
                    >
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white text-sm font-medium flex-shrink-0">
                        <Hash className="w-4 h-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{conv.name}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{conv.lastMessage || 'No messages yet'}</p>
                      </div>
                      {conv.unread > 0 && (
                        <span className="w-5 h-5 bg-[rgb(var(--color-accent-primary))] dark:bg-[rgb(var(--color-accent-primary-dark))] text-white text-[10px] font-bold rounded-full flex items-center justify-center flex-shrink-0">
                          {conv.unread}
                        </span>
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>
          ) : (
            /* Active Conversation Messages */
            <>
              <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50 dark:bg-gray-900">
                {isLoadingMessages ? (
                  <div className="flex items-center justify-center h-full">
                    <div className="w-6 h-6 border-2 border-gray-300 dark:border-gray-600 border-t-[rgb(var(--color-accent-primary))] rounded-full animate-spin" />
                  </div>
                ) : messages.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full text-center">
                    <p className="text-xs text-gray-500 dark:text-gray-400">No messages yet. Say hello!</p>
                  </div>
                ) : (
                  messages.map(msg => (
                    <div
                      key={msg.id}
                      className={`flex gap-2 ${msg.isOwn ? 'flex-row-reverse' : 'flex-row'}`}
                    >
                      <div className="w-7 h-7 rounded-full bg-accent-gradient flex items-center justify-center text-white text-[10px] font-medium flex-shrink-0">
                        {msg.isOwn ? userAvatar : msg.senderName?.[0]?.toUpperCase() || '?'}
                      </div>
                      <div className={`flex flex-col ${msg.isOwn ? 'items-end' : 'items-start'} max-w-[70%]`}>
                        <div
                          className={`px-3 py-2 rounded-xl text-sm ${
                            msg.isOwn
                              ? 'bg-[rgb(var(--color-accent-primary))] dark:bg-[rgb(var(--color-accent-primary-dark))] text-white'
                              : 'bg-white dark:bg-gray-800 text-gray-900 dark:text-white border border-gray-200 dark:border-gray-700'
                          }`}
                        >
                          {msg.content}
                        </div>
                        <span className="text-[10px] text-gray-400 dark:text-gray-500 mt-1">{msg.time}</span>
                      </div>
                    </div>
                  ))
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Input */}
              <div className="p-3 border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 flex-shrink-0">
                <form
                  onSubmit={e => { e.preventDefault(); handleSend(); }}
                  className="flex gap-2"
                >
                  <Input
                    placeholder="Type a message..."
                    value={newMessage}
                    onChange={e => setNewMessage(e.target.value)}
                    className="flex-1 dark:bg-gray-700 dark:border-gray-600 dark:text-white dark:placeholder-gray-400 rounded-lg text-sm"
                  />
                  <button
                    type="submit"
                    disabled={!newMessage.trim()}
                    className="p-2.5 bg-[rgb(var(--color-accent-primary))] dark:bg-[rgb(var(--color-accent-primary-dark))] text-white rounded-lg hover:opacity-90 transition-opacity disabled:opacity-40 flex-shrink-0"
                  >
                    <Send className="w-4 h-4" />
                  </button>
                </form>
              </div>
            </>
          )}
        </div>
      )}
    </>
  );
}
