import { useState, useEffect } from 'react';
import { X, Search, UserPlus, MessageCircle, MoreVertical, UserMinus, Loader2, Users } from 'lucide-react';
import { Input } from './ui/input';
import { Button } from './ui/button';
import { connectionsAPI, userAPI, handleApiError } from '../../utils/api';
import { toast } from 'sonner';

interface ConnectionsPopupProps {
  user: any;
  isOpen: boolean;
  onClose: () => void;
}

interface Friend {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  avatar_initials: string;
  status: string;
  role: string;
  last_active?: string;
}

type Tab = 'friends' | 'requests' | 'find';

export function ConnectionsPopup({ user, isOpen, onClose }: ConnectionsPopupProps) {
  const [activeTab, setActiveTab] = useState<Tab>('friends');
  const [friends, setFriends] = useState<Friend[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Friend[]>([]);
  const [isLoadingFriends, setIsLoadingFriends] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [pendingActions, setPendingActions] = useState<Set<string>>(new Set());

  const userId = user?.id;

  // Load friends when popup opens
  useEffect(() => {
    if (!isOpen || !userId) return;
    const load = async () => {
      setIsLoadingFriends(true);
      try {
        const data = await connectionsAPI.getFriends(userId);
        setFriends(data || []);
      } catch {
        // silent
      } finally {
        setIsLoadingFriends(false);
      }
    };
    load();
  }, [isOpen, userId]);

  // Search users when query changes in "Find People" tab
  useEffect(() => {
    if (activeTab !== 'find' || !searchQuery.trim()) {
      setSearchResults([]);
      return;
    }
    const timer = setTimeout(async () => {
      setIsSearching(true);
      try {
        const results = await userAPI.searchUsers(searchQuery);
        // Filter out current user and existing friends
        const friendIds = new Set(friends.map(f => f.id));
        setSearchResults(
          (results || []).filter((u: Friend) => u.id !== userId && !friendIds.has(u.id))
        );
      } catch {
        // silent
      } finally {
        setIsSearching(false);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery, activeTab, userId, friends]);

  const handleAddFriend = async (friendId: string) => {
    setPendingActions(prev => new Set(prev).add(friendId));
    try {
      await connectionsAPI.addFriend(userId, friendId);
      toast.success('Friend request sent!');
      // Move from search results
      const added = searchResults.find(u => u.id === friendId);
      if (added) {
        setFriends(prev => [...prev, added]);
        setSearchResults(prev => prev.filter(u => u.id !== friendId));
      }
    } catch (error) {
      handleApiError(error, 'Failed to send friend request');
    } finally {
      setPendingActions(prev => {
        const next = new Set(prev);
        next.delete(friendId);
        return next;
      });
    }
  };

  const handleRemoveFriend = async (friendId: string) => {
    setPendingActions(prev => new Set(prev).add(friendId));
    try {
      await connectionsAPI.removeFriend(userId, friendId);
      setFriends(prev => prev.filter(f => f.id !== friendId));
      toast.success('Friend removed');
    } catch (error) {
      handleApiError(error, 'Failed to remove friend');
    } finally {
      setPendingActions(prev => {
        const next = new Set(prev);
        next.delete(friendId);
        return next;
      });
    }
  };

  const onlineFriends = friends.filter(f => f.status === 'online');
  const offlineFriends = friends.filter(f => f.status !== 'online');

  const tabs: { id: Tab; label: string; count?: number }[] = [
    { id: 'friends', label: 'Friends', count: friends.length },
    { id: 'requests', label: 'Requests' },
    { id: 'find', label: 'Find People' },
  ];

  if (!isOpen) return null;

  const FriendRow = ({ friend, showRemove }: { friend: Friend; showRemove?: boolean }) => {
    const isOnline = friend.status === 'online';
    const displayName = `${friend.first_name || ''} ${friend.last_name || ''}`.trim() || friend.email;
    const avatar = friend.avatar_initials || displayName[0]?.toUpperCase() || '?';
    const isPending = pendingActions.has(friend.id);

    return (
      <div className="flex items-center justify-between p-3 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors group">
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <div className="relative flex-shrink-0">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-medium ${
              isOnline ? 'bg-gradient-to-br from-blue-400 to-blue-600' : 'bg-gradient-to-br from-gray-400 to-gray-500'
            }`}>
              {avatar}
            </div>
            <div className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-white dark:border-gray-800 ${
              isOnline ? 'bg-green-500' : 'bg-gray-400'
            }`} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{displayName}</p>
            <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
              {isOnline ? friend.role || 'Online' : friend.last_active ? `Last seen ${friend.last_active}` : 'Offline'}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          {showRemove && (
            <button
              onClick={() => handleRemoveFriend(friend.id)}
              disabled={isPending}
              className="p-1.5 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
              title="Remove friend"
            >
              {isPending ? (
                <Loader2 className="w-4 h-4 text-gray-400 animate-spin" />
              ) : (
                <UserMinus className="w-4 h-4 text-red-500" />
              )}
            </button>
          )}
          <button className="p-1.5 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg transition-colors" title="Message">
            <MessageCircle className="w-4 h-4 text-gray-500 dark:text-gray-400" />
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center" onClick={onClose}>
      <div
        className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 w-[480px] max-h-[700px] flex flex-col overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-gray-200 dark:border-gray-700 flex-shrink-0">
          <div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Connections</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
              {onlineFriends.length} online · {friends.length} total
            </p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors">
            <X className="w-5 h-5 text-gray-500 dark:text-gray-400" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-200 dark:border-gray-700 flex-shrink-0">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => { setActiveTab(tab.id); setSearchQuery(''); }}
              className={`flex-1 py-3 text-sm font-medium transition-colors relative ${
                activeTab === tab.id
                  ? 'text-[rgb(var(--color-accent-primary))] dark:text-[rgb(var(--color-accent-primary-dark))]'
                  : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
              }`}
            >
              {tab.label}
              {tab.count !== undefined && tab.count > 0 && (
                <span className="ml-1.5 px-1.5 py-0.5 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 text-xs rounded-full">
                  {tab.count}
                </span>
              )}
              {activeTab === tab.id && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[rgb(var(--color-accent-primary))] dark:bg-[rgb(var(--color-accent-primary-dark))]" />
              )}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          {/* Friends Tab */}
          {activeTab === 'friends' && (
            <div className="p-3">
              {isLoadingFriends ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="w-6 h-6 text-gray-400 animate-spin" />
                </div>
              ) : friends.length === 0 ? (
                <div className="text-center py-12">
                  <div className="w-14 h-14 mx-auto mb-3 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center">
                    <Users className="w-7 h-7 text-gray-400 dark:text-gray-500" />
                  </div>
                  <p className="text-sm font-medium text-gray-900 dark:text-white mb-1">No friends yet</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Search for people to connect with.
                  </p>
                  <Button
                    size="sm"
                    className="btn-accent mt-3 rounded-lg"
                    onClick={() => setActiveTab('find')}
                  >
                    <UserPlus className="w-4 h-4 mr-1.5" />
                    Find People
                  </Button>
                </div>
              ) : (
                <>
                  {onlineFriends.length > 0 && (
                    <div className="mb-4">
                      <h3 className="text-xs font-semibold uppercase text-gray-500 dark:text-gray-400 mb-2 px-2">
                        Online — {onlineFriends.length}
                      </h3>
                      {onlineFriends.map(f => <FriendRow key={f.id} friend={f} showRemove />)}
                    </div>
                  )}
                  {offlineFriends.length > 0 && (
                    <div>
                      <h3 className="text-xs font-semibold uppercase text-gray-500 dark:text-gray-400 mb-2 px-2">
                        Offline — {offlineFriends.length}
                      </h3>
                      {offlineFriends.map(f => <FriendRow key={f.id} friend={f} showRemove />)}
                    </div>
                  )}
                </>
              )}
            </div>
          )}

          {/* Requests Tab */}
          {activeTab === 'requests' && (
            <div className="p-3">
              <div className="text-center py-12">
                <div className="w-14 h-14 mx-auto mb-3 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center">
                  <UserPlus className="w-7 h-7 text-gray-400 dark:text-gray-500" />
                </div>
                <p className="text-sm font-medium text-gray-900 dark:text-white mb-1">No pending requests</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Friend requests will appear here.
                </p>
              </div>
            </div>
          )}

          {/* Find People Tab */}
          {activeTab === 'find' && (
            <div className="p-3">
              <div className="relative mb-3">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  placeholder="Search by name or email..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="pl-10 dark:bg-gray-700 dark:border-gray-600 dark:text-white dark:placeholder-gray-400 rounded-lg"
                  autoFocus
                />
              </div>

              {isSearching ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-5 h-5 text-gray-400 animate-spin" />
                </div>
              ) : searchQuery.trim() && searchResults.length === 0 ? (
                <div className="text-center py-8">
                  <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center">
                    <Search className="w-6 h-6 text-gray-400 dark:text-gray-500" />
                  </div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">No users found</p>
                </div>
              ) : !searchQuery.trim() ? (
                <div className="text-center py-8">
                  <p className="text-sm text-gray-500 dark:text-gray-400">Type a name or email to search</p>
                </div>
              ) : (
                <div className="space-y-1">
                  {searchResults.map(result => {
                    const displayName = `${result.first_name || ''} ${result.last_name || ''}`.trim() || result.email;
                    const avatar = result.avatar_initials || displayName[0]?.toUpperCase() || '?';
                    const isPending = pendingActions.has(result.id);
                    return (
                      <div key={result.id} className="flex items-center justify-between p-3 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-400 to-purple-600 flex items-center justify-center text-white text-sm font-medium flex-shrink-0">
                            {avatar}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{displayName}</p>
                            <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{result.email}</p>
                          </div>
                        </div>
                        <Button
                          size="sm"
                          className="btn-accent rounded-lg flex-shrink-0"
                          onClick={() => handleAddFriend(result.id)}
                          disabled={isPending}
                        >
                          {isPending ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <>
                              <UserPlus className="w-3.5 h-3.5 mr-1" />
                              Add
                            </>
                          )}
                        </Button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
