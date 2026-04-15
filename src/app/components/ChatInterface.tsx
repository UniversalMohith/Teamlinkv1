import { useState, useEffect, useRef } from 'react';
import { Send, Smile, Paperclip, MoreVertical, ArrowLeft, Phone, Video, Search, UserPlus, Mic, MicOff, VideoOff, Users } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from './ui/dropdown-menu';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from './ui/dialog';
import { ConnectionsPopup } from './ConnectionsPopup';
import { messagesAPI, teamAPI, fileAPI, handleApiError } from '../../utils/api';
import { toast } from 'sonner';

interface User {
  id: string;
  name: string;
  email: string;
  avatar: string;
  role: string;
  joinDate: string;
}

interface Message {
  id: string;
  sender: string;
  content: string;
  time: string;
  avatar: string;
  isCurrentUser?: boolean;
  imageUrl?: string;
  fileName?: string;
}

interface TeamMember {
  id: string;
  name: string;
  avatar: string;
  status: 'online' | 'offline';
  lastSeen?: string;
}

interface ChatInterfaceProps {
  user: User;
  teamId: string | null;
  onBack: () => void;
  onNavigateToProfile: () => void;
  onNavigateToSettings: () => void;
  onNavigateToNotifications: () => void;
  onLogout: () => void;
}

export function ChatInterface({ user, teamId, onBack, onNavigateToProfile, onNavigateToSettings, onNavigateToNotifications, onLogout }: ChatInterfaceProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [typingUser, setTypingUser] = useState('');
  const [isCallActive, setIsCallActive] = useState(false);
  const [callType, setCallType] = useState<'voice' | 'video' | null>(null);
  const [callDuration, setCallDuration] = useState(0);
  const [isAddMemberDialogOpen, setIsAddMemberDialogOpen] = useState(false);
  const [newMemberName, setNewMemberName] = useState('');
  const [newMemberEmail, setNewMemberEmail] = useState('');
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isConnectionsPopupOpen, setIsConnectionsPopupOpen] = useState(false);
  const [availableMembers, setAvailableMembers] = useState<TeamMember[]>([]);
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [isCameraOn, setIsCameraOn] = useState(true);
  const [isMicOn, setIsMicOn] = useState(true);
  const [cameraError, setCameraError] = useState<string>('');
  const [useSimulatedVideo, setUseSimulatedVideo] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);

  // Load messages and team members on mount / teamId change
  useEffect(() => {
    const loadChatData = async () => {
      if (!teamId) {
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);

        const messagesData = await messagesAPI.getByTeam(teamId);
        const formattedMessages = messagesData.map((msg: any) => ({
          id: msg.id,
          sender: msg.sender,
          content: msg.content,
          time: msg.time,
          avatar: msg.avatar,
          isCurrentUser: msg.senderId === user.id,
          imageUrl: msg.imageUrl,
          fileName: msg.fileName,
        }));
        setMessages(formattedMessages);

        const members = await teamAPI.getById(teamId);
        if (members?.members) {
          const formattedMembers = members.members.map((m: any) => ({
            id: m.id,
            name: m.name,
            avatar: m.avatar,
            status: m.status || 'offline',
          }));
          setTeamMembers(formattedMembers);
        }
      } catch (error) {
        handleApiError(error, 'Failed to load chat data');
      } finally {
        setIsLoading(false);
      }
    };

    loadChatData();
  }, [teamId, user.id]);

  // Subscribe to live message updates (5s poll), clean up on unmount / teamId change
  useEffect(() => {
    if (!teamId) return;

    const unsub = messagesAPI.subscribeToTeam(teamId, (newMessages: any[]) => {
      const formatted = newMessages.map((msg: any) => ({
        id: msg.id,
        sender: msg.sender,
        content: msg.content,
        time: msg.time,
        avatar: msg.avatar,
        isCurrentUser: msg.senderId === user.id,
        imageUrl: msg.imageUrl,
        fileName: msg.fileName,
      }));
      setMessages(formatted);
    });

    return () => {
      if (typeof unsub === 'function') unsub();
    };
  }, [teamId, user.id]);

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

  // Camera and microphone access
  useEffect(() => {
    if (isCallActive && callType === 'video' && !useSimulatedVideo) {
      navigator.mediaDevices
        .getUserMedia({ video: true, audio: true })
        .then((stream) => {
          setLocalStream(stream);
          setCameraError('');
          setUseSimulatedVideo(false);
          if (localVideoRef.current) {
            localVideoRef.current.srcObject = stream;
            localVideoRef.current.play().catch(err => {
              console.log('Video play error:', err);
            });
          }
        })
        .catch(() => {
          setUseSimulatedVideo(true);
          setIsCameraOn(true);
          setCameraError('');
        });
    }

    return () => {
      if (localStream) {
        localStream.getTracks().forEach((track) => track.stop());
        setLocalStream(null);
      }
      setCameraError('');
      setUseSimulatedVideo(false);
    };
  }, [isCallActive, callType]);

  const formatCallDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleStartCall = async (type: 'voice' | 'video') => {
    setCallType(type);
    setIsCallActive(true);
    setIsCameraOn(true);
    setIsMicOn(true);
  };

  const handleEndCall = () => {
    if (localStream) {
      localStream.getTracks().forEach((track) => track.stop());
      setLocalStream(null);
    }
    setIsCallActive(false);
    setCallType(null);
    setCallDuration(0);
    setIsCameraOn(true);
    setIsMicOn(true);
  };

  const toggleCamera = () => {
    if (localStream) {
      const videoTrack = localStream.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        setIsCameraOn(videoTrack.enabled);
      }
    } else {
      setIsCameraOn(!isCameraOn);
    }
  };

  const toggleMic = () => {
    if (localStream) {
      const audioTrack = localStream.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        setIsMicOn(audioTrack.enabled);
      }
    } else {
      setIsMicOn(!isMicOn);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !teamId) return;

    const messageContent = newMessage;
    setNewMessage('');

    try {
      const sentMessage = await messagesAPI.send(
        teamId,
        user.id,
        messageContent
      );

      const formattedMessage: Message = {
        id: sentMessage.id,
        sender: sentMessage.sender,
        content: sentMessage.content,
        time: sentMessage.time,
        avatar: sentMessage.avatar,
        isCurrentUser: true,
      };

      setMessages((prev) => [...prev, formattedMessage]);
      toast.success('Message sent');
    } catch (error) {
      handleApiError(error, 'Failed to send message');
      setNewMessage(messageContent);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setNewMessage(e.target.value);
  };

  const handleAddMemberDialogOpen = () => {
    setIsAddMemberDialogOpen(true);
  };

  const handleAddMemberDialogClose = () => {
    setIsAddMemberDialogOpen(false);
    setNewMemberName('');
    setNewMemberEmail('');
  };

  const handleAddMember = () => {
    if (newMemberName && newMemberEmail) {
      const nameParts = newMemberName.trim().split(' ');
      const initials = nameParts.length > 1
        ? `${nameParts[0][0]}${nameParts[nameParts.length - 1][0]}`.toUpperCase()
        : newMemberName.substring(0, 2).toUpperCase();

      const newMember: TeamMember = {
        id: `member-${Date.now()}`,
        name: newMemberName,
        avatar: initials,
        status: 'offline',
        lastSeen: 'Just added'
      };
      setTeamMembers([...teamMembers, newMember]);
      handleAddMemberDialogClose();
    }
  };

  const handleAddMemberToCall = (member: TeamMember) => {
    if (!teamMembers.find(m => m.id === member.id)) {
      setTeamMembers([...teamMembers, { ...member, status: 'online' }]);
    }
    setAvailableMembers(availableMembers.filter(m => m.id !== member.id));
  };

  const switchCallType = () => {
    if (callType === 'video') {
      if (localStream) {
        localStream.getVideoTracks().forEach((track) => track.stop());
      }
      setCallType('voice');
    } else {
      setCallType('video');
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      const file = files[0];
      const fileUrl = URL.createObjectURL(file);
      const isImage = file.type.startsWith('image/');

      const message: Message = {
        id: `msg-${Date.now()}`,
        sender: user.name,
        content: isImage ? '' : file.name,
        time: new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }),
        avatar: user.avatar,
        isCurrentUser: true,
        imageUrl: isImage ? fileUrl : undefined,
        fileName: file.name,
      };

      setMessages([...messages, message]);

      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }

      setTimeout(() => {
        setIsTyping(true);
        setTypingUser('Arpan');
      }, 1000);

      setTimeout(() => {
        setIsTyping(false);
        setTypingUser('');
      }, 3000);
    }
  };

  return (
    <>
      {/* Active Call Overlay */}
      {isCallActive && (
        <div className="fixed inset-0 bg-gradient-to-br from-gray-900 via-gray-800 to-black z-[100]">
          {callType === 'video' ? (
            <div className="relative w-full h-full">
              <div className="absolute inset-0 flex items-center justify-center bg-gray-900">
                {useSimulatedVideo && isCameraOn ? (
                  <div className="w-full h-full bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-600 flex items-center justify-center relative overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-br from-blue-500/20 via-transparent to-purple-500/20 animate-pulse"></div>
                    <div className="relative z-10 flex flex-col items-center">
                      <div className="w-48 h-48 rounded-full bg-white/10 backdrop-blur-md border-4 border-white/20 flex items-center justify-center mb-6 shadow-2xl">
                        <span className="text-8xl font-bold text-white">{user.avatar}</span>
                      </div>
                      <div className="bg-black/30 backdrop-blur-md px-6 py-3 rounded-full">
                        <p className="text-white text-2xl font-medium">{user.name}</p>
                      </div>
                    </div>
                    <div className="absolute top-8 left-1/2 -translate-x-1/2 bg-blue-500/90 backdrop-blur-md px-6 py-2 rounded-full">
                      <p className="text-white text-sm font-medium">📹 Demo Video Mode</p>
                    </div>
                  </div>
                ) : localStream && isCameraOn ? (
                  <video
                    ref={localVideoRef}
                    autoPlay
                    muted
                    playsInline
                    onLoadedMetadata={(e) => {
                      const video = e.target as HTMLVideoElement;
                      video.play().catch(err => console.log('Auto-play prevented:', err));
                    }}
                    className="w-full h-full object-cover"
                    style={{ transform: 'scaleX(-1)' }}
                  />
                ) : (
                  <div className="flex flex-col items-center justify-center">
                    <div className="w-32 h-32 rounded-full bg-gray-700 flex items-center justify-center mb-4">
                      <VideoOff className="w-16 h-16 text-gray-400" />
                    </div>
                    <p className="text-white text-lg">Camera is off</p>
                    {cameraError && (
                      <p className="text-gray-400 text-sm mt-2 max-w-md text-center">{cameraError}</p>
                    )}
                  </div>
                )}
              </div>

              <div className="absolute top-4 right-4 flex flex-col gap-3">
                {teamMembers.slice(0, 2).map((member, i) => (
                  <div
                    key={i}
                    className="w-40 h-28 rounded-lg overflow-hidden bg-gray-800 border-2 border-gray-600 shadow-xl relative"
                  >
                    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-blue-900 to-indigo-900">
                      <div className="w-12 h-12 rounded-full bg-accent-gradient flex items-center justify-center text-white text-sm font-medium">
                        {member.avatar}
                      </div>
                    </div>
                    <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-2">
                      <p className="text-white text-xs font-medium">{member.name}</p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="absolute top-4 left-4 bg-black/50 backdrop-blur-md px-4 py-2 rounded-full">
                <p className="text-white text-sm font-medium">{formatCallDuration(callDuration)}</p>
              </div>

              <div className="absolute bottom-8 left-1/2 -translate-x-1/2">
                <div className="flex items-center gap-4 bg-black/70 backdrop-blur-md px-6 py-4 rounded-full shadow-2xl">
                  <button
                    onClick={toggleMic}
                    className={`p-4 rounded-full transition-all ${
                      isMicOn ? 'bg-gray-700 hover:bg-gray-600 text-white' : 'bg-red-500 hover:bg-red-600 text-white'
                    }`}
                  >
                    {isMicOn ? <Mic className="w-5 h-5" /> : <MicOff className="w-5 h-5" />}
                  </button>
                  <button
                    onClick={toggleCamera}
                    className={`p-4 rounded-full transition-all ${
                      isCameraOn ? 'bg-gray-700 hover:bg-gray-600 text-white' : 'bg-red-500 hover:bg-red-600 text-white'
                    }`}
                  >
                    {isCameraOn ? <Video className="w-5 h-5" /> : <VideoOff className="w-5 h-5" />}
                  </button>
                  <button
                    onClick={handleEndCall}
                    className="p-4 bg-red-500 hover:bg-red-600 text-white rounded-full transition-all shadow-lg"
                  >
                    <Phone className="w-5 h-5" />
                  </button>
                </div>
              </div>

              <div className="absolute bottom-24 left-1/2 -translate-x-1/2 bg-black/50 backdrop-blur-md px-4 py-2 rounded-full">
                <p className="text-white text-sm">Marketing Team Call</p>
              </div>
            </div>
          ) : (
            <div className="relative w-full h-full flex flex-col">
              <div className="absolute top-0 left-0 right-0 bg-gradient-to-b from-black/60 to-transparent p-6 z-10">
                <div className="text-center">
                  <h2 className="text-white text-2xl font-semibold mb-1">Marketing Team</h2>
                  <p className="text-white/80 text-sm">{teamMembers.filter(m => m.status === 'online').length} participants</p>
                  <p className="text-white/60 text-sm mt-2">{formatCallDuration(callDuration)}</p>
                </div>
              </div>

              <div className="flex-1 flex items-center justify-center p-8">
                <div className="grid grid-cols-2 gap-6 max-w-4xl w-full">
                  <div className="flex flex-col items-center">
                    <div className="relative mb-4">
                      <div className="relative w-40 h-40 bg-gradient-to-br from-gray-800/50 to-gray-900/50 rounded-2xl p-4 backdrop-blur-sm border border-white/10">
                        <div className="absolute inset-0 -m-4 rounded-2xl bg-gradient-to-r from-green-500 to-emerald-500 opacity-30 animate-pulse"></div>
                        <div className="absolute inset-0 -m-4 rounded-2xl border-4 border-green-500/50 animate-ping"></div>
                        <div className="w-full h-full rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shadow-2xl">
                          <span className="text-4xl font-bold text-white">{user.avatar}</span>
                        </div>
                        <div className={`absolute -bottom-2 -right-2 w-10 h-10 rounded-full flex items-center justify-center shadow-lg border-2 border-gray-900 ${
                          isMicOn ? 'bg-green-500' : 'bg-red-500'
                        }`}>
                          {isMicOn ? <Mic className="w-5 h-5 text-white" /> : <MicOff className="w-5 h-5 text-white" />}
                        </div>
                      </div>
                    </div>
                    <p className="text-white text-lg font-medium mb-1">{user.name} (You)</p>
                  </div>

                  {teamMembers.slice(0, 3).map((member, index) => (
                    <div key={member.id} className="flex flex-col items-center">
                      <div className="relative mb-4">
                        <div className="relative w-40 h-40 bg-gradient-to-br from-gray-800/50 to-gray-900/50 rounded-2xl p-4 backdrop-blur-sm border border-white/10">
                          {index === 0 && (
                            <>
                              <div className="absolute inset-0 -m-4 rounded-2xl bg-gradient-to-r from-blue-500 to-cyan-500 opacity-30 animate-pulse"></div>
                              <div className="absolute inset-0 -m-4 rounded-2xl border-4 border-blue-500/50 animate-ping"></div>
                            </>
                          )}
                          <div className={`w-full h-full rounded-full bg-gradient-to-br ${
                            index === 0 ? 'from-orange-500 to-pink-600' :
                            index === 1 ? 'from-green-500 to-teal-600' :
                            'from-indigo-500 to-purple-600'
                          } flex items-center justify-center shadow-2xl`}>
                            <span className="text-4xl font-bold text-white">{member.avatar}</span>
                          </div>
                          <div className={`absolute -bottom-2 -right-2 w-10 h-10 rounded-full flex items-center justify-center shadow-lg border-2 border-gray-900 ${
                            index === 1 ? 'bg-red-500' : 'bg-green-500'
                          }`}>
                            {index === 1 ? <MicOff className="w-5 h-5 text-white" /> : <Mic className="w-5 h-5 text-white" />}
                          </div>
                        </div>
                      </div>
                      <p className="text-white text-lg font-medium mb-1">{member.name}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-8 z-10">
                <div className="flex items-center justify-center gap-3">
                  <button
                    onClick={toggleMic}
                    className={`group relative p-4 rounded-full transition-all shadow-xl ${
                      isMicOn ? 'bg-white/20 hover:bg-white/30 backdrop-blur-md' : 'bg-red-500 hover:bg-red-600'
                    }`}
                  >
                    {isMicOn ? <Mic className="w-5 h-5 text-white" /> : <MicOff className="w-5 h-5 text-white" />}
                  </button>
                  <button
                    onClick={switchCallType}
                    className="group relative p-4 bg-white/20 hover:bg-white/30 backdrop-blur-md rounded-full transition-all shadow-xl"
                  >
                    {callType === 'video' ? <Phone className="w-5 h-5 text-white" /> : <Video className="w-5 h-5 text-white" />}
                  </button>
                  {callType === 'video' && (
                    <button
                      onClick={toggleCamera}
                      className={`group relative p-4 rounded-full transition-all shadow-xl ${
                        isCameraOn ? 'bg-white/20 hover:bg-white/30 backdrop-blur-md' : 'bg-red-500 hover:bg-red-600'
                      }`}
                    >
                      {isCameraOn ? <Video className="w-5 h-5 text-white" /> : <VideoOff className="w-5 h-5 text-white" />}
                    </button>
                  )}
                  <button
                    onClick={handleEndCall}
                    className="group relative p-4 bg-red-500 hover:bg-red-600 text-white rounded-full transition-all shadow-xl"
                  >
                    <Phone className="w-5 h-5" />
                  </button>
                  <button
                    onClick={handleAddMemberDialogOpen}
                    className="group relative p-4 bg-white/20 hover:bg-white/30 backdrop-blur-md rounded-full transition-all shadow-xl"
                  >
                    <UserPlus className="w-5 h-5 text-white" />
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      <div className="flex h-screen bg-gray-50 dark:bg-gray-900">
        {/* Sidebar with Team Members */}
        <div className="w-80 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 flex flex-col">
          <div className="p-4 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 bg-accent-gradient rounded flex items-center justify-center">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                  <path d="M3 3L21 12L3 21V3Z" fill="white"/>
                </svg>
              </div>
              <span className="font-semibold text-lg text-gray-900 dark:text-white">TeamLink</span>
            </div>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 dark:text-gray-500" />
              <Input
                placeholder="Search conversations..."
                className="pl-10 bg-gray-50 dark:bg-gray-700 dark:border-gray-600 dark:text-white dark:placeholder-gray-400"
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto">
            <div className="p-4">
              <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase mb-3">Marketing Team</h3>
              <div className="space-y-2">
                {teamMembers.map((member) => (
                  <div
                    key={member.id}
                    className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/50 cursor-pointer transition-colors"
                  >
                    <div className="relative">
                      <div className="w-10 h-10 rounded-full bg-accent-gradient flex items-center justify-center text-white text-sm font-medium">
                        {member.avatar}
                      </div>
                      {member.status === 'online' && (
                        <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white dark:border-gray-800"></div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-900 dark:text-white">{member.name}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {member.status === 'online' ? 'Online' : member.lastSeen}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="p-4 border-t border-gray-200 dark:border-gray-700">
            <Button variant="outline" className="w-full" onClick={onBack}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Dashboard
            </Button>
          </div>
        </div>

        {/* Chat Area */}
        <div className="flex-1 flex flex-col">
          <div className="h-16 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between px-6">
            <div className="flex items-center gap-3">
              <div className="flex -space-x-2">
                {teamMembers.slice(0, 3).map((member, i) => (
                  <div
                    key={i}
                    className="w-8 h-8 rounded-full border-2 border-white dark:border-gray-800 bg-accent-gradient flex items-center justify-center text-white text-xs font-medium"
                  >
                    {member.avatar}
                  </div>
                ))}
              </div>
              <div>
                <h2 className="font-semibold text-gray-900 dark:text-white">Marketing Team</h2>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {teamMembers.filter(m => m.status === 'online').length} members online
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Button variant="ghost" size="icon" onClick={() => handleStartCall('voice')}>
                <Phone className="w-5 h-5" />
              </Button>
              <Button variant="ghost" size="icon" onClick={() => handleStartCall('video')}>
                <Video className="w-5 h-5" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsSearchOpen(!isSearchOpen)}
                className={isSearchOpen ? 'bg-gray-100 dark:bg-gray-700' : ''}
              >
                <Search className="w-5 h-5" />
              </Button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="flex items-center gap-2 hover:opacity-80 transition-opacity">
                    <div className="w-8 h-8 bg-[rgb(var(--color-accent-primary))] dark:bg-[rgb(var(--color-accent-primary-dark))] text-white rounded-full flex items-center justify-center text-sm font-medium">
                      {user.avatar}
                    </div>
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel>
                    <div>
                      <p className="font-medium">{user.name}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 font-normal">{user.email}</p>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={onNavigateToProfile}>Profile</DropdownMenuItem>
                  <DropdownMenuItem onClick={onNavigateToSettings}>Settings</DropdownMenuItem>
                  <DropdownMenuItem onClick={onNavigateToNotifications}>Notifications</DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={onLogout} className="text-red-600 dark:text-red-400">Logout</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>

          {isSearchOpen && (
            <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-4">
              <div className="max-w-4xl mx-auto relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 dark:text-gray-500" />
                <Input
                  placeholder="Search messages..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 dark:bg-gray-700 dark:border-gray-600 dark:text-white dark:placeholder-gray-400"
                  autoFocus
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 text-xs"
                  >
                    Clear
                  </button>
                )}
              </div>
            </div>
          )}

          <div className="flex-1 overflow-y-auto p-6 bg-gray-50 dark:bg-gray-900">
            <div className="max-w-4xl mx-auto space-y-4">
              {messages
                .filter(msg =>
                  searchQuery === '' ||
                  msg.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
                  msg.sender.toLowerCase().includes(searchQuery.toLowerCase())
                )
                .map((message) => (
                  <div
                    key={message.id}
                    className={`flex gap-3 ${message.isCurrentUser ? 'flex-row-reverse' : ''}`}
                  >
                    {!message.isCurrentUser && (
                      <div className="w-10 h-10 rounded-full bg-accent-gradient flex items-center justify-center text-white text-sm font-medium flex-shrink-0">
                        {message.avatar}
                      </div>
                    )}
                    <div className={`flex flex-col ${message.isCurrentUser ? 'items-end' : ''}`}>
                      {!message.isCurrentUser && (
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-sm font-medium text-gray-900 dark:text-white">{message.sender}</span>
                          <span className="text-xs text-gray-500 dark:text-gray-400">{message.time}</span>
                        </div>
                      )}
                      <div
                        className={`px-4 py-3 rounded-2xl max-w-md ${
                          message.isCurrentUser
                            ? 'bg-accent-gradient text-white'
                            : 'bg-white dark:bg-gray-800 text-gray-900 dark:text-white border border-gray-200 dark:border-gray-700'
                        }`}
                      >
                        {message.imageUrl ? (
                          <img src={message.imageUrl} alt={message.fileName} className="max-w-full max-h-48" />
                        ) : (
                          <p className="text-sm">{message.content}</p>
                        )}
                      </div>
                      {message.isCurrentUser && (
                        <span className="text-xs text-gray-500 dark:text-gray-400 mt-1">{message.time}</span>
                      )}
                    </div>
                    {message.isCurrentUser && (
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-green-400 to-green-600 flex items-center justify-center text-white text-sm font-medium flex-shrink-0">
                        {message.avatar}
                      </div>
                    )}
                  </div>
                ))}

              {isTyping && (
                <div className="flex gap-3">
                  <div className="w-10 h-10 rounded-full bg-accent-gradient flex items-center justify-center text-white text-sm font-medium">
                    AR
                  </div>
                  <div className="flex flex-col">
                    <span className="text-sm font-medium text-gray-900 dark:text-white mb-1">{typingUser}</span>
                    <div className="px-4 py-3 bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700">
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
          </div>

          <div className="bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 p-4">
            <form onSubmit={handleSendMessage} className="max-w-4xl mx-auto">
              <div className="flex items-end gap-2">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*,application/pdf,.doc,.docx"
                  onChange={handleFileSelect}
                  className="hidden"
                />
                <Button type="button" variant="ghost" size="icon" onClick={() => fileInputRef.current?.click()}>
                  <Paperclip className="w-5 h-5" />
                </Button>
                <div className="flex-1 relative">
                  <Input
                    value={newMessage}
                    onChange={handleInputChange}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleSendMessage(e as any);
                      }
                    }}
                    placeholder="Write a message..."
                    className="pr-10 dark:bg-gray-700 dark:border-gray-600 dark:text-white dark:placeholder-gray-400"
                  />
                  <button
                    type="button"
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                  >
                    <Smile className="w-5 h-5" />
                  </button>
                </div>
                <Button
                  type="submit"
                  size="icon"
                  className="btn-accent flex-shrink-0"
                  disabled={!newMessage.trim()}
                >
                  <Send className="w-5 h-5" />
                </Button>
              </div>
            </form>
          </div>
        </div>

        {/* Right Sidebar - Team Info */}
        <div className="w-80 bg-white dark:bg-gray-800 border-l border-gray-200 dark:border-gray-700 p-6 overflow-y-auto">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">Team Information</h2>
          <div className="space-y-6">
            <div>
              <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Members ({teamMembers.length})</h3>
              <div className="space-y-3">
                {teamMembers.map((member) => (
                  <div key={member.id} className="flex items-center gap-3">
                    <div className="relative">
                      <div className="w-10 h-10 rounded-full bg-accent-gradient flex items-center justify-center text-white text-sm font-medium">
                        {member.avatar}
                      </div>
                      {member.status === 'online' && (
                        <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white dark:border-gray-800"></div>
                      )}
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900 dark:text-white">{member.name}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 capitalize">{member.status}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="pt-6 border-t border-gray-200 dark:border-gray-700">
              <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Shared Files</h3>
              <div className="space-y-2">
                {['Project Brief.pdf', 'Design Mockups.fig', 'Meeting Notes.doc'].map((file, idx) => (
                  <div key={idx} className="p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer transition-colors">
                    <p className="text-sm text-gray-900 dark:text-white">{file}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Shared yesterday</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="pt-6 border-t border-gray-200 dark:border-gray-700">
              <Button variant="outline" className="w-full" onClick={handleAddMemberDialogOpen}>
                Add Members
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Add Member Dialog */}
      <Dialog open={isAddMemberDialogOpen} onOpenChange={handleAddMemberDialogClose}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>{isCallActive ? 'Add People to Call' : 'Add Member'}</DialogTitle>
            <DialogDescription>
              {isCallActive ? 'Select people to add to the call' : 'Add a new member to the team.'}
            </DialogDescription>
          </DialogHeader>

          {isCallActive ? (
            <div className="space-y-2 max-h-80 overflow-y-auto">
              {availableMembers.length > 0 ? (
                availableMembers.map((member) => (
                  <div
                    key={member.id}
                    className="flex items-center gap-3 p-3 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
                  >
                    <div className="relative">
                      <div className="w-10 h-10 rounded-full bg-accent-gradient flex items-center justify-center text-white text-sm font-medium">
                        {member.avatar}
                      </div>
                      {member.status === 'online' && (
                        <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white dark:border-gray-800"></div>
                      )}
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-gray-900 dark:text-white">{member.name}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {member.status === 'online' ? 'Online' : member.lastSeen}
                      </p>
                    </div>
                    <Button size="sm" onClick={() => handleAddMemberToCall(member)} className="btn-accent">
                      Add
                    </Button>
                  </div>
                ))
              ) : (
                <div className="text-center py-8">
                  <p className="text-gray-500 dark:text-gray-400 text-sm">No more members available to add</p>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              <Input placeholder="Name" value={newMemberName} onChange={(e) => setNewMemberName(e.target.value)} />
              <Input placeholder="Email" value={newMemberEmail} onChange={(e) => setNewMemberEmail(e.target.value)} />
            </div>
          )}

          {!isCallActive && (
            <DialogFooter>
              <Button type="button" variant="outline" onClick={handleAddMemberDialogClose}>Cancel</Button>
              <Button type="button" onClick={handleAddMember} disabled={!newMemberName || !newMemberEmail}>Add</Button>
            </DialogFooter>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
