import { useState, useEffect } from 'react';
import { MessageCircle, X, Send, Minimize2, Maximize2, Phone, Video, PhoneOff } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';

interface User {
  id: string;
  name: string;
  email: string;
  avatar: string;
  role: string;
  joinDate: string;
}

interface UniversalChatProps {
  user: User;
}

export function UniversalChat({ user }: UniversalChatProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [message, setMessage] = useState('');
  const [isCallActive, setIsCallActive] = useState(false);
  const [callType, setCallType] = useState<'voice' | 'video' | null>(null);
  const [callDuration, setCallDuration] = useState(0);

  const messages = [
    { id: '1', sender: 'John Smith', avatar: 'JS', message: 'Hey team, how\'s the project going?', time: '2:30 PM', isOwn: false },
    { id: '2', sender: user.name, avatar: user.avatar, message: 'Going great! Just finished the homepage design.', time: '2:32 PM', isOwn: true },
    { id: '3', sender: 'Sarah Chen', avatar: 'SC', message: 'Nice! Can you share the mockups?', time: '2:35 PM', isOwn: false },
  ];

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

  const handleSendMessage = () => {
    if (message.trim()) {
      // In a real app, this would send the message
      setMessage('');
    }
  };

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
              <p className="text-gray-600 dark:text-gray-400 mb-2">Team Chat</p>
              <p className="text-2xl font-mono text-gray-900 dark:text-white">{formatCallDuration(callDuration)}</p>
            </div>
            
            <div className="flex gap-4 justify-center items-center mb-4">
              <div className="flex -space-x-2">
                <div className="w-12 h-12 rounded-full bg-[rgb(var(--color-accent-primary))] dark:bg-[rgb(var(--color-accent-primary-dark))] flex items-center justify-center text-white text-sm font-medium border-2 border-white dark:border-gray-800">
                  JS
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

      <div className="fixed left-4 bottom-4 z-50">
        {/* Chat Toggle Button */}
        {!isOpen && (
          <button
            onClick={() => setIsOpen(true)}
            className="w-12 h-12 bg-[rgb(var(--color-accent-primary))] dark:bg-[rgb(var(--color-accent-primary-dark))] hover:opacity-90 text-white rounded-full shadow-lg flex items-center justify-center transition-all hover:scale-110"
          >
            <MessageCircle className="w-6 h-6" />
          </button>
        )}

        {/* Chat Window */}
        {isOpen && (
          <div className={`bg-white dark:bg-gray-800 rounded-lg shadow-2xl border border-gray-200 dark:border-gray-700 flex flex-col transition-all ${
            isMinimized ? 'w-72 h-14' : 'w-80 h-96'
          }`}>
            {/* Chat Header */}
            <div className="flex items-center justify-between p-3 border-b border-gray-200 dark:border-gray-700 bg-[rgb(var(--color-accent-primary))] dark:bg-[rgb(var(--color-accent-primary-dark))] text-white rounded-t-lg">
              <div className="flex items-center gap-2">
                <MessageCircle className="w-5 h-5" />
                <span className="font-semibold">Team Chat</span>
              </div>
              <div className="flex items-center gap-1">
                {!isMinimized && (
                  <>
                    <button
                      onClick={() => handleStartCall('voice')}
                      className="hover:bg-white/20 rounded-lg p-1.5 transition-colors group"
                      title="Voice Call"
                    >
                      <Phone className="w-4 h-4 group-hover:scale-110 transition-transform" />
                    </button>
                    <button
                      onClick={() => handleStartCall('video')}
                      className="hover:bg-white/20 rounded-lg p-1.5 transition-colors group"
                      title="Video Call"
                    >
                      <Video className="w-4 h-4 group-hover:scale-110 transition-transform" />
                    </button>
                  </>
                )}
                {isCallActive && (
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-white">{formatCallDuration(callDuration)}</span>
                    <button
                      onClick={handleEndCall}
                      className="hover:bg-white/20 rounded-lg p-1.5 transition-colors group"
                      title="End Call"
                    >
                      <PhoneOff className="w-4 h-4 group-hover:scale-110 transition-transform" />
                    </button>
                  </div>
                )}
                <button
                  onClick={() => setIsMinimized(!isMinimized)}
                  className="hover:bg-white/20 rounded p-1 transition-colors"
                >
                  {isMinimized ? <Maximize2 className="w-4 h-4" /> : <Minimize2 className="w-4 h-4" />}
                </button>
                <button
                  onClick={() => setIsOpen(false)}
                  className="hover:bg-white/20 rounded p-1 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Chat Content (only visible when not minimized) */}
            {!isMinimized && (
              <>
                {/* Messages Area */}
                <div className="flex-1 overflow-y-auto p-4 space-y-3">
                  {messages.map((msg) => (
                    <div
                      key={msg.id}
                      className={`flex gap-2 ${msg.isOwn ? 'flex-row-reverse' : 'flex-row'}`}
                    >
                      <div className="w-8 h-8 rounded-full bg-accent-gradient flex items-center justify-center text-white text-xs font-medium flex-shrink-0">
                        {msg.avatar}
                      </div>
                      <div className={`flex flex-col ${msg.isOwn ? 'items-end' : 'items-start'} max-w-[70%]`}>
                        <div
                          className={`px-3 py-2 rounded-lg ${
                            msg.isOwn
                              ? 'bg-[rgb(var(--color-accent-primary))] dark:bg-[rgb(var(--color-accent-primary-dark))] text-white'
                              : 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white'
                          }`}
                        >
                          <p className="text-sm">{msg.message}</p>
                        </div>
                        <span className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                          {msg.time}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Message Input */}
                <div className="p-3 border-t border-gray-200 dark:border-gray-700">
                  <div className="flex gap-2">
                    <Input
                      placeholder="Type a message..."
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                      className="flex-1 dark:bg-gray-700 dark:border-gray-600 dark:text-white dark:placeholder-gray-400"
                    />
                    <Button
                      onClick={handleSendMessage}
                      size="icon"
                      className="btn-accent flex-shrink-0"
                    >
                      <Send className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </>
  );
}