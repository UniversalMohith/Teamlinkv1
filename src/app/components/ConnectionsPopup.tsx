import { useState } from 'react';
import { X, Search, UserPlus, MessageCircle, MoreVertical } from 'lucide-react';
import { Input } from './ui/input';
import { Button } from './ui/button';

interface User {
  id: string;
  name: string;
  email: string;
  avatar: string;
  role: string;
  joinDate: string;
}

interface ConnectionsPopupProps {
  user: User;
  isOpen: boolean;
  onClose: () => void;
}

interface Friend {
  id: string;
  name: string;
  avatar: string;
  status: 'online' | 'offline';
  lastActive?: string;
  role: string;
}

export function ConnectionsPopup({ user, isOpen, onClose }: ConnectionsPopupProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [friends] = useState<Friend[]>([
    { id: '1', name: 'Helen Lee', avatar: 'HL', status: 'online', role: 'Designer' },
    { id: '2', name: 'John Smith', avatar: 'JS', status: 'online', role: 'Developer' },
    { id: '3', name: 'Sarah Chen', avatar: 'SC', status: 'offline', lastActive: '2 hours ago', role: 'Product Manager' },
    { id: '4', name: 'Mike Johnson', avatar: 'MJ', status: 'online', role: 'Backend Developer' },
    { id: '5', name: 'Emily Davis', avatar: 'ED', status: 'offline', lastActive: '5 hours ago', role: 'UX Designer' },
    { id: '6', name: 'Alex Wilson', avatar: 'AW', status: 'online', role: 'Frontend Developer' },
    { id: '7', name: 'Lisa Brown', avatar: 'LB', status: 'offline', lastActive: '1 day ago', role: 'Marketing Specialist' },
    { id: '8', name: 'David Martinez', avatar: 'DM', status: 'online', role: 'DevOps Engineer' },
  ]);

  const filteredFriends = friends.filter(friend =>
    friend.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    friend.role.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const onlineFriends = filteredFriends.filter(f => f.status === 'online');
  const offlineFriends = filteredFriends.filter(f => f.status === 'offline');

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center" onClick={onClose}>
      <div 
        className="bg-white dark:bg-gray-800 rounded-3xl shadow-2xl border border-gray-200 dark:border-gray-700 w-[480px] max-h-[700px] flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div>
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">Connections</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              {onlineFriends.length} online · {friends.length} total
            </p>
          </div>
          <button
            onClick={onClose}
            className="hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg p-2 transition-colors"
          >
            <X className="w-5 h-5 text-gray-700 dark:text-gray-300" />
          </button>
        </div>

        {/* Search Bar */}
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 dark:text-gray-500" />
            <Input
              placeholder="Search connections..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 dark:bg-gray-700 dark:border-gray-600 dark:text-white dark:placeholder-gray-400"
            />
          </div>
        </div>

        {/* Friends List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-6">
          {/* Online Friends */}
          {onlineFriends.length > 0 && (
            <div>
              <h3 className="text-xs font-semibold uppercase text-gray-500 dark:text-gray-400 mb-3 px-2">
                Online — {onlineFriends.length}
              </h3>
              <div className="space-y-1">
                {onlineFriends.map((friend) => (
                  <div
                    key={friend.id}
                    className="flex items-center justify-between p-3 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors group"
                  >
                    <div className="flex items-center gap-3 flex-1">
                      <div className="relative">
                        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white text-sm font-medium">
                          {friend.avatar}
                        </div>
                        {friend.status === 'online' && (
                          <div className="absolute bottom-0 right-0 w-4 h-4 bg-green-500 rounded-full border-2 border-white dark:border-gray-800"></div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-gray-900 dark:text-white text-sm truncate">
                          {friend.name}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                          {friend.role}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        className="p-2 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                        title="Send Message"
                      >
                        <MessageCircle className="w-4 h-4 text-gray-700 dark:text-gray-300" />
                      </button>
                      <button
                        className="p-2 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                        title="More Options"
                      >
                        <MoreVertical className="w-4 h-4 text-gray-700 dark:text-gray-300" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Offline Friends */}
          {offlineFriends.length > 0 && (
            <div>
              <h3 className="text-xs font-semibold uppercase text-gray-500 dark:text-gray-400 mb-3 px-2">
                Offline — {offlineFriends.length}
              </h3>
              <div className="space-y-1">
                {offlineFriends.map((friend) => (
                  <div
                    key={friend.id}
                    className="flex items-center justify-between p-3 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors group opacity-60 hover:opacity-100"
                  >
                    <div className="flex items-center gap-3 flex-1">
                      <div className="relative">
                        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-gray-400 to-gray-600 flex items-center justify-center text-white text-sm font-medium">
                          {friend.avatar}
                        </div>
                        {friend.status === 'offline' && (
                          <div className="absolute bottom-0 right-0 w-4 h-4 bg-gray-400 rounded-full border-2 border-white dark:border-gray-800"></div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-gray-900 dark:text-white text-sm truncate">
                          {friend.name}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                          {friend.lastActive ? `Last seen ${friend.lastActive}` : friend.role}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        className="p-2 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                        title="Send Message"
                      >
                        <MessageCircle className="w-4 h-4 text-gray-700 dark:text-gray-300" />
                      </button>
                      <button
                        className="p-2 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                        title="More Options"
                      >
                        <MoreVertical className="w-4 h-4 text-gray-700 dark:text-gray-300" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* No Results */}
          {filteredFriends.length === 0 && (
            <div className="text-center py-12">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center">
                <Search className="w-8 h-8 text-gray-400 dark:text-gray-500" />
              </div>
              <p className="text-gray-500 dark:text-gray-400 font-medium">No connections found</p>
              <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">
                Try adjusting your search
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-200 dark:border-gray-700">
          <Button className="w-full btn-accent flex items-center justify-center gap-2">
            <UserPlus className="w-4 h-4" />
            Add New Connection
          </Button>
        </div>
      </div>
    </div>
  );
}
