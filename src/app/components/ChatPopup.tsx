import { useState, useEffect, useRef } from 'react';
import { Send, X, Minimize2, Maximize2, Phone, Video, MessageCircle, Search, ArrowLeft, PhoneOff, UserPlus, Users, Hash, ChevronRight, Loader2 } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { teamAPI, messagesAPI } from '../../utils/api';

interface ChatPopupProps {
  user: any;
  isOpen: boolean;
  onClose: () => void;
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

export function ChatPopup({ user, isOpen, onClose }: ChatPopupProps) {
  const userName = user.name || `${user.first_name || ''} ${user.last_name || ''}`.trim() || 'User';
  const userAvatar = user.avatar || user.avatar_initials || 'U';

  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConversation, setActiveConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isMinimized, setIsMinimized] = useState(false);
  const [isLoadingConversations, setIsLoadingConversations] = useState(false);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const unsubRef = useRef<(() => void) | null>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Load conversations when popup opens
  useEffect(() => {
    if (!isOpen) return;
    const load = async () => {
      setIsLoadingConversations(true);
      try {
        const teams = await teamAPI.getAll(user.id || user.id);
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

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
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

  if (!isOpen) return null;

  return (
    <div className="fixed bottom-6 right-6 z-50">
      <div className={`bg-white dark:bg-gray-800 rounded-3xl shadow-2xl border border-gray-200 dark:border-gray-700 overflow-hidden transition-all duration-300 ${
        isMinimized ? 'w-80 h-16' : 'w-96 h-[600px]'
      } flex flex-col`}>
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
          <div className="flex items-center gap-3">
            {activeConversation ? (
              <button
                onClick={() => setActiveConversation(null)}
                className="hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg p-2 transition-colors"
                title="Back"
              >
                <ChevronRight className="w-5 h-5 text-gray-700 dark:text-gray-300 rotate-180" />
              </button>
            ) : (
              <button
                onClick={onClose}
                className="hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg p-2 transition-colors"
                title="Close"
              >
                <ArrowLeft className="w-5 h-5 text-gray-700 dark:text-gray-300" />
              </button>
            )}
            <MessageCircle className="w-5 h-5 text-[rgb(var(--color-accent-primary))] dark:text-[rgb(var(--color-accent-primary-dark))]" />
            <div>
              <h3 className="font-semibold text-gray-900 dark:text-white text-sm">
                {activeConversation ? activeConversation.name : 'Messages'}
              </h3>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {activeConversation ? 'Team chat' : `${conversations.length} conversations`}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setIsMinimized(!isMinimized)}
              className="hover:bg-gray-100 dark:hover:bg-gray-700 rounded p-2 transition-colors"
            >
              {isMinimized ? <Maximize2 className="w-4 h-4 text-gray-700 dark:text-gray-300" /> : <Minimize2 className="w-4 h-4 text-gray-700 dark:text-gray-300" />}
            </button>
          </div>
        </div>

        {/* Content (only visible when not minimized) */}
        {!isMinimized && (
          <>
            {!activeConversation ? (
              /* Conversations List */
              <div className="flex-1 overflow-y-auto">
                {isLoadingConversations ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="w-6 h-6 text-gray-400 animate-spin" />
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
                      <Loader2 className="w-6 h-6 text-gray-400 animate-spin" />
                    </div>
                  ) : messages.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-center">
                      <div className="w-12 h-12 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center mb-3">
                        <MessageCircle className="w-6 h-6 text-gray-400 dark:text-gray-500" />
                      </div>
                      <p className="text-sm font-medium text-gray-900 dark:text-white mb-1">No messages yet</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">Say hello to get the conversation started!</p>
                    </div>
                  ) : (
                    messages.map((msg) => (
                      <div
                        key={msg.id}
                        className={`flex gap-2 ${msg.isOwn ? 'flex-row-reverse' : 'flex-row'}`}
                      >
                        <div className="w-8 h-8 rounded-full bg-accent-gradient flex items-center justify-center text-white text-xs font-medium flex-shrink-0">
                          {msg.isOwn ? userAvatar : msg.senderName?.[0]?.toUpperCase() || '?'}
                        </div>
                        <div className={`flex flex-col ${msg.isOwn ? 'items-end' : 'items-start'} max-w-[70%]`}>
                          <div
                            className={`px-3 py-2 rounded-lg ${
                              msg.isOwn
                                ? 'bg-[rgb(var(--color-accent-primary))] dark:bg-[rgb(var(--color-accent-primary-dark))] text-white'
                                : 'bg-white dark:bg-gray-800 text-gray-900 dark:text-white border border-gray-200 dark:border-gray-700'
                            }`}
                          >
                            <p className="text-sm">{msg.content}</p>
                          </div>
                          <span className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                            {msg.time}
                          </span>
                        </div>
                      </div>
                    ))
                  )}
                  <div ref={messagesEndRef} />
                </div>

                {/* Message Input */}
                <div className="p-3 border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
                  <form onSubmit={handleSendMessage} className="flex gap-2">
                    <Input
                      placeholder="Type a message..."
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      className="flex-1 dark:bg-gray-700 dark:border-gray-600 dark:text-white dark:placeholder-gray-400"
                    />
                    <Button
                      type="submit"
                      size="icon"
                      className="btn-accent flex-shrink-0"
                      disabled={!newMessage.trim()}
                    >
                      <Send className="w-4 h-4" />
                    </Button>
                  </form>
                </div>
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
}
