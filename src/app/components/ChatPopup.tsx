import { useState, useEffect, useRef } from 'react';
import { Send, X, Minimize2, Maximize2, Phone, Video, MessageCircle, Search, MoreVertical, ArrowLeft, PhoneOff, UserPlus, Users } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';

interface Message {
  id: string;
  sender: string;
  content: string;
  time: string;
  avatar: string;
  isCurrentUser?: boolean;
}

interface ChatPopupProps {
  user: any;
  isOpen: boolean;
  onClose: () => void;
}

interface TeamMember {
  id: string;
  name: string;
  avatar: string;
  status: 'online' | 'offline';
}

export function ChatPopup({ user, isOpen, onClose }: ChatPopupProps) {
  const userName = user.name || `${user.first_name || ''} ${user.last_name || ''}`.trim() || 'User';
  const userAvatar = user.avatar || user.avatar_initials || 'U';

  const [messages, setMessages] = useState<Message[]>([
    { id: '1', sender: 'John Smith', content: "Hey team, how's the project going?", time: '2:30 PM', avatar: 'JS', isCurrentUser: false },
    { id: '2', sender: userName, content: 'Going great! Just finished the homepage design.', time: '2:32 PM', avatar: userAvatar, isCurrentUser: true },
    { id: '3', sender: 'Sarah Chen', content: 'Nice! Can you share the mockups?', time: '2:35 PM', avatar: 'SC', isCurrentUser: false },
  ]);

  const [newMessage, setNewMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [isCallActive, setIsCallActive] = useState(false);
  const [callType, setCallType] = useState<'voice' | 'video' | null>(null);
  const [callDuration, setCallDuration] = useState(0);
  const [showAddMemberModal, setShowAddMemberModal] = useState(false);
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([
    { id: '1', name: 'John Smith', avatar: 'JS', status: 'online' },
    { id: '2', name: 'Sarah Chen', avatar: 'SC', status: 'online' },
  ]);
  const [availableMembers] = useState<TeamMember[]>([
    { id: '3', name: 'Mike Johnson', avatar: 'MJ', status: 'online' },
    { id: '4', name: 'Emily Davis', avatar: 'ED', status: 'offline' },
    { id: '5', name: 'Alex Wilson', avatar: 'AW', status: 'online' },
    { id: '6', name: 'Lisa Brown', avatar: 'LB', status: 'offline' },
  ]);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Call duration timer
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    if (isCallActive) {
      interval = setInterval(() => {
        setCallDuration((prev) => prev + 1);
      }, 1000);
    } else {
      setCallDuration(0);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isCallActive]);

  const formatCallDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleStartCall = (type: 'voice' | 'video') => {
    setCallType(type);
    setIsCallActive(true);
  };

  const handleEndCall = () => {
    setIsCallActive(false);
    setCallType(null);
    setCallDuration(0);
  };

  const handleAddMember = (member: TeamMember) => {
    if (!teamMembers.find(m => m.id === member.id)) {
      setTeamMembers([...teamMembers, member]);
      // Add a system message
      const systemMessage: Message = {
        id: `msg-${Date.now()}`,
        sender: 'System',
        content: `${member.name} has been added to the chat`,
        time: new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }),
        avatar: '🔔',
        isCurrentUser: false,
      };
      setMessages([...messages, systemMessage]);
    }
  };

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (newMessage.trim()) {
      const message: Message = {
        id: `msg-${Date.now()}`,
        sender: userName,
        content: newMessage,
        time: new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }),
        avatar: userAvatar,
        isCurrentUser: true,
      };
      setMessages([...messages, message]);
      setNewMessage('');
      
      // Simulate typing indicator
      setTimeout(() => {
        setIsTyping(true);
      }, 1000);

      setTimeout(() => {
        setIsTyping(false);
      }, 3000);
    }
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Active Call Overlay */}
      {isCallActive && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[100] flex items-center justify-center">
          <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-2xl p-8 w-96 text-center">
            <div className="mb-6">
              <div className="w-24 h-24 mx-auto rounded-full bg-accent-gradient flex items-center justify-center text-white text-3xl font-medium mb-4">
                {callType === 'video' ? <Video className="w-12 h-12" /> : <Phone className="w-12 h-12" />}
              </div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                {callType === 'video' ? 'Video Call' : 'Voice Call'}
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-2">Marketing Team</p>
              <p className="text-2xl font-mono text-gray-900 dark:text-white">{formatCallDuration(callDuration)}</p>
            </div>
            
            <div className="flex gap-4 justify-center items-center mb-4">
              <div className="flex -space-x-2">
                <div className="w-12 h-12 rounded-full bg-[rgb(var(--color-accent-primary))] dark:bg-[rgb(var(--color-accent-primary-dark))] flex items-center justify-center text-white text-sm font-medium border-2 border-white dark:border-gray-800">
                  JL
                </div>
                <div className="w-12 h-12 rounded-full bg-blue-500 flex items-center justify-center text-white text-sm font-medium border-2 border-white dark:border-gray-800">
                  SC
                </div>
              </div>
            </div>

            <div className="flex gap-3 justify-center">
              <button
                onClick={handleEndCall}
                className="flex items-center gap-2 px-6 py-3 bg-red-500 hover:bg-red-600 text-white rounded-xl transition-colors"
              >
                <PhoneOff className="w-5 h-5" />
                End Call
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Chat Window */}
      <div className="fixed bottom-6 right-6 z-50">
        <div className={`bg-white dark:bg-gray-800 rounded-3xl shadow-2xl border border-gray-200 dark:border-gray-700 overflow-hidden transition-all duration-300 ${
          isMinimized ? 'w-80 h-16' : 'w-96 h-[600px]'
        } flex flex-col`}>
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
            <div className="flex items-center gap-3">
              {/* Back Arrow */}
              <button
                onClick={onClose}
                className="hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg p-2 transition-colors"
                title="Back"
              >
                <ArrowLeft className="w-5 h-5 text-gray-700 dark:text-gray-300" />
              </button>
              {/* Team Member Avatars */}
              <div className="flex -space-x-2">
                <div className="w-10 h-10 rounded-full bg-[rgb(var(--color-accent-primary))] dark:bg-[rgb(var(--color-accent-primary-dark))] flex items-center justify-center text-white text-xs font-medium border-2 border-white dark:border-gray-800 relative z-10">
                  JL
                </div>
                <div className="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center text-white text-xs font-medium border-2 border-white dark:border-gray-800">
                  SC
                </div>
              </div>
              {/* Team Info */}
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white text-sm">Marketing Team</h3>
                <p className="text-xs text-gray-500 dark:text-gray-400">2 members</p>
              </div>
            </div>
            <div className="flex items-center gap-1">
              {!isMinimized && (
                <>
                  <button
                    onClick={() => handleStartCall('voice')}
                    className="hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg p-2 transition-colors group"
                    title="Voice Call"
                  >
                    <Phone className="w-4 h-4 text-gray-700 dark:text-gray-300 group-hover:scale-110 transition-transform" />
                  </button>
                  <button
                    onClick={() => handleStartCall('video')}
                    className="hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg p-2 transition-colors group"
                    title="Video Call"
                  >
                    <Video className="w-4 h-4 text-gray-700 dark:text-gray-300 group-hover:scale-110 transition-transform" />
                  </button>
                  <button
                    onClick={() => setShowAddMemberModal(true)}
                    className="hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg p-2 transition-colors group"
                    title="Add Member"
                  >
                    <UserPlus className="w-4 h-4 text-gray-700 dark:text-gray-300 group-hover:scale-110 transition-transform" />
                  </button>
                  <button
                    onClick={() => {/* Handle search */}}
                    className="hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg p-2 transition-colors group"
                    title="Search"
                  >
                    <Search className="w-4 h-4 text-gray-700 dark:text-gray-300 group-hover:scale-110 transition-transform" />
                  </button>
                </>
              )}
              <button
                onClick={() => setIsMinimized(!isMinimized)}
                className="hover:bg-gray-100 dark:hover:bg-gray-700 rounded p-2 transition-colors"
              >
                {isMinimized ? <Maximize2 className="w-4 h-4 text-gray-700 dark:text-gray-300" /> : <Minimize2 className="w-4 h-4 text-gray-700 dark:text-gray-300" />}
              </button>
            </div>
          </div>

          {/* Chat Content (only visible when not minimized) */}
          {!isMinimized && (
            <>
              {/* Messages Area */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50 dark:bg-gray-900">
                {messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`flex gap-2 ${msg.isCurrentUser ? 'flex-row-reverse' : 'flex-row'}`}
                  >
                    <div className="w-8 h-8 rounded-full bg-accent-gradient flex items-center justify-center text-white text-xs font-medium flex-shrink-0">
                      {msg.avatar}
                    </div>
                    <div className={`flex flex-col ${msg.isCurrentUser ? 'items-end' : 'items-start'} max-w-[70%]`}>
                      <div
                        className={`px-3 py-2 rounded-lg ${
                          msg.isCurrentUser
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
                ))}

                {/* Typing Indicator */}
                {isTyping && (
                  <div className="flex gap-2">
                    <div className="w-8 h-8 rounded-full bg-accent-gradient flex items-center justify-center text-white text-xs font-medium">
                      SC
                    </div>
                    <div className="flex flex-col">
                      <div className="px-4 py-2 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                        <div className="flex gap-1">
                          <div className="w-2 h-2 bg-gray-400 dark:bg-gray-500 rounded-full animate-bounce"></div>
                          <div className="w-2 h-2 bg-gray-400 dark:bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                          <div className="w-2 h-2 bg-gray-400 dark:bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></div>
                        </div>
                      </div>
                    </div>
                  </div>
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
        </div>
      </div>

      {/* Add Member Modal */}
      {showAddMemberModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[100] flex items-center justify-center" onClick={() => setShowAddMemberModal(false)}>
          <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-2xl p-6 w-96 max-h-[80vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                <UserPlus className="w-5 h-5" />
                Add Member
              </h3>
              <button
                onClick={() => setShowAddMemberModal(false)}
                className="hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg p-2 transition-colors"
              >
                <X className="w-5 h-5 text-gray-700 dark:text-gray-300" />
              </button>
            </div>

            <div className="space-y-2">
              {availableMembers.map((member) => {
                const isAdded = teamMembers.find(m => m.id === member.id);
                return (
                  <div
                    key={member.id}
                    className="flex items-center justify-between p-3 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-accent-gradient flex items-center justify-center text-white text-sm font-medium">
                        {member.avatar}
                      </div>
                      <div>
                        <p className="font-medium text-gray-900 dark:text-white text-sm">{member.name}</p>
                        <div className="flex items-center gap-1">
                          <div className={`w-2 h-2 rounded-full ${member.status === 'online' ? 'bg-green-500' : 'bg-gray-400'}`} />
                          <span className="text-xs text-gray-500 dark:text-gray-400 capitalize">{member.status}</span>
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={() => {
                        handleAddMember(member);
                        setShowAddMemberModal(false);
                      }}
                      disabled={!!isAdded}
                      className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
                        isAdded
                          ? 'bg-gray-100 dark:bg-gray-700 text-gray-400 dark:text-gray-500 cursor-not-allowed'
                          : 'bg-[rgb(var(--color-accent-primary))] dark:bg-[rgb(var(--color-accent-primary-dark))] text-white hover:opacity-90'
                      }`}
                    >
                      {isAdded ? 'Added' : 'Add'}
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </>
  );
}