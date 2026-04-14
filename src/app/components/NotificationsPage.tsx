import { ArrowLeft, Check, X, Bell, MessageSquare, Users, Calendar } from 'lucide-react';
import { Button } from './ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';

interface User {
  id: string;
  name: string;
  email: string;
  avatar: string;
  role: string;
  joinDate: string;
}

interface NotificationsPageProps {
  user: User;
  onBack: () => void;
  onNavigateToProfile: () => void;
  onLogout: () => void;
}

interface Notification {
  id: string;
  type: 'task' | 'message' | 'team' | 'event';
  title: string;
  description: string;
  time: string;
  read: boolean;
  avatar?: string;
}

export function NotificationsPage({ user, onBack, onNavigateToProfile, onLogout }: NotificationsPageProps) {
  const notifications: Notification[] = [
    {
      id: '1',
      type: 'task',
      title: 'New task assigned',
      description: 'Helen Lee assigned you to "Homepage Design"',
      time: '5 minutes ago',
      read: false,
      avatar: 'HL',
    },
    {
      id: '2',
      type: 'message',
      title: 'New message',
      description: 'John Smith: "Can we discuss the project timeline?"',
      time: '1 hour ago',
      read: false,
      avatar: 'JS',
    },
    {
      id: '3',
      type: 'team',
      title: 'Team update',
      description: 'Sarah Chen joined the Marketing Team',
      time: '2 hours ago',
      read: false,
      avatar: 'SC',
    },
    {
      id: '4',
      type: 'event',
      title: 'Upcoming meeting',
      description: 'Team standup meeting starts in 30 minutes',
      time: '3 hours ago',
      read: true,
    },
    {
      id: '5',
      type: 'task',
      title: 'Task completed',
      description: 'Mike Kumar completed "Database Setup"',
      time: '5 hours ago',
      read: true,
      avatar: 'MK',
    },
    {
      id: '6',
      type: 'message',
      title: 'Comment on task',
      description: 'Arpan commented on "UX Research"',
      time: '1 day ago',
      read: true,
      avatar: 'AR',
    },
  ];

  const getIcon = (type: Notification['type']) => {
    switch (type) {
      case 'task':
        return <Check className="w-4 h-4" />;
      case 'message':
        return <MessageSquare className="w-4 h-4" />;
      case 'team':
        return <Users className="w-4 h-4" />;
      case 'event':
        return <Calendar className="w-4 h-4" />;
    }
  };

  const getIconColor = (type: Notification['type']) => {
    switch (type) {
      case 'task':
        return 'bg-blue-100 text-blue-600';
      case 'message':
        return 'bg-green-100 text-green-600';
      case 'team':
        return 'bg-purple-100 text-purple-600';
      case 'event':
        return 'bg-orange-100 text-orange-600';
    }
  };

  const unreadNotifications = notifications.filter(n => !n.read);
  const readNotifications = notifications.filter(n => n.read);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={onBack}>
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div>
              <h1 className="text-xl font-semibold">Notifications</h1>
              <p className="text-sm text-gray-500">{unreadNotifications.length} unread notifications</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm">
              Mark all as read
            </Button>
            <Button variant="outline" onClick={onNavigateToProfile}>
              Profile
            </Button>
          </div>
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-6 py-8">
        <Tabs defaultValue="all" className="space-y-6">
          <TabsList className="bg-white border border-gray-200">
            <TabsTrigger value="all">
              All
              <span className="ml-2 px-2 py-0.5 bg-gray-100 text-gray-700 rounded-full text-xs">
                {notifications.length}
              </span>
            </TabsTrigger>
            <TabsTrigger value="unread">
              Unread
              <span className="ml-2 px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full text-xs">
                {unreadNotifications.length}
              </span>
            </TabsTrigger>
            <TabsTrigger value="tasks">Tasks</TabsTrigger>
            <TabsTrigger value="messages">Messages</TabsTrigger>
            <TabsTrigger value="teams">Teams</TabsTrigger>
          </TabsList>

          {/* All Notifications */}
          <TabsContent value="all">
            <div className="space-y-4">
              {unreadNotifications.length > 0 && (
                <div className="bg-white rounded-xl shadow-sm border border-gray-200">
                  <div className="p-4 border-b border-gray-200">
                    <h3 className="font-semibold text-gray-900">New</h3>
                  </div>
                  <div className="divide-y divide-gray-100">
                    {unreadNotifications.map((notification) => (
                      <div
                        key={notification.id}
                        className="p-4 hover:bg-gray-50 cursor-pointer transition-colors relative"
                      >
                        <div className="flex gap-4">
                          {notification.avatar ? (
                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white text-sm font-medium flex-shrink-0">
                              {notification.avatar}
                            </div>
                          ) : (
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${getIconColor(notification.type)}`}>
                              {getIcon(notification.type)}
                            </div>
                          )}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between mb-1">
                              <p className="font-medium text-gray-900">{notification.title}</p>
                              <button className="text-gray-400 hover:text-gray-600">
                                <X className="w-4 h-4" />
                              </button>
                            </div>
                            <p className="text-sm text-gray-600 mb-1">{notification.description}</p>
                            <p className="text-xs text-gray-500">{notification.time}</p>
                          </div>
                          <div className="absolute top-4 right-4 w-2 h-2 bg-blue-600 rounded-full"></div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {readNotifications.length > 0 && (
                <div className="bg-white rounded-xl shadow-sm border border-gray-200">
                  <div className="p-4 border-b border-gray-200">
                    <h3 className="font-semibold text-gray-900">Earlier</h3>
                  </div>
                  <div className="divide-y divide-gray-100">
                    {readNotifications.map((notification) => (
                      <div
                        key={notification.id}
                        className="p-4 hover:bg-gray-50 cursor-pointer transition-colors"
                      >
                        <div className="flex gap-4">
                          {notification.avatar ? (
                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-gray-300 to-gray-400 flex items-center justify-center text-white text-sm font-medium flex-shrink-0">
                              {notification.avatar}
                            </div>
                          ) : (
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${getIconColor(notification.type)}`}>
                              {getIcon(notification.type)}
                            </div>
                          )}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between mb-1">
                              <p className="font-medium text-gray-700">{notification.title}</p>
                              <button className="text-gray-400 hover:text-gray-600">
                                <X className="w-4 h-4" />
                              </button>
                            </div>
                            <p className="text-sm text-gray-500 mb-1">{notification.description}</p>
                            <p className="text-xs text-gray-400">{notification.time}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </TabsContent>

          {/* Unread Notifications */}
          <TabsContent value="unread">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200">
              {unreadNotifications.length > 0 ? (
                <div className="divide-y divide-gray-100">
                  {unreadNotifications.map((notification) => (
                    <div
                      key={notification.id}
                      className="p-4 hover:bg-gray-50 cursor-pointer transition-colors relative"
                    >
                      <div className="flex gap-4">
                        {notification.avatar ? (
                          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white text-sm font-medium flex-shrink-0">
                            {notification.avatar}
                          </div>
                        ) : (
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${getIconColor(notification.type)}`}>
                            {getIcon(notification.type)}
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between mb-1">
                            <p className="font-medium text-gray-900">{notification.title}</p>
                            <button className="text-gray-400 hover:text-gray-600">
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                          <p className="text-sm text-gray-600 mb-1">{notification.description}</p>
                          <p className="text-xs text-gray-500">{notification.time}</p>
                        </div>
                        <div className="absolute top-4 right-4 w-2 h-2 bg-blue-600 rounded-full"></div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-12 text-center">
                  <Bell className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500">No unread notifications</p>
                </div>
              )}
            </div>
          </TabsContent>

          {/* Task Notifications */}
          <TabsContent value="tasks">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200">
              <div className="divide-y divide-gray-100">
                {notifications
                  .filter(n => n.type === 'task')
                  .map((notification) => (
                    <div
                      key={notification.id}
                      className="p-4 hover:bg-gray-50 cursor-pointer transition-colors"
                    >
                      <div className="flex gap-4">
                        {notification.avatar ? (
                          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white text-sm font-medium flex-shrink-0">
                            {notification.avatar}
                          </div>
                        ) : (
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${getIconColor(notification.type)}`}>
                            {getIcon(notification.type)}
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-gray-900 mb-1">{notification.title}</p>
                          <p className="text-sm text-gray-600 mb-1">{notification.description}</p>
                          <p className="text-xs text-gray-500">{notification.time}</p>
                        </div>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          </TabsContent>

          {/* Message Notifications */}
          <TabsContent value="messages">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200">
              <div className="divide-y divide-gray-100">
                {notifications
                  .filter(n => n.type === 'message')
                  .map((notification) => (
                    <div
                      key={notification.id}
                      className="p-4 hover:bg-gray-50 cursor-pointer transition-colors"
                    >
                      <div className="flex gap-4">
                        {notification.avatar ? (
                          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white text-sm font-medium flex-shrink-0">
                            {notification.avatar}
                          </div>
                        ) : (
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${getIconColor(notification.type)}`}>
                            {getIcon(notification.type)}
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-gray-900 mb-1">{notification.title}</p>
                          <p className="text-sm text-gray-600 mb-1">{notification.description}</p>
                          <p className="text-xs text-gray-500">{notification.time}</p>
                        </div>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          </TabsContent>

          {/* Team Notifications */}
          <TabsContent value="teams">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200">
              <div className="divide-y divide-gray-100">
                {notifications
                  .filter(n => n.type === 'team')
                  .map((notification) => (
                    <div
                      key={notification.id}
                      className="p-4 hover:bg-gray-50 cursor-pointer transition-colors"
                    >
                      <div className="flex gap-4">
                        {notification.avatar ? (
                          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white text-sm font-medium flex-shrink-0">
                            {notification.avatar}
                          </div>
                        ) : (
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${getIconColor(notification.type)}`}>
                            {getIcon(notification.type)}
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-gray-900 mb-1">{notification.title}</p>
                          <p className="text-sm text-gray-600 mb-1">{notification.description}</p>
                          <p className="text-xs text-gray-500">{notification.time}</p>
                        </div>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
