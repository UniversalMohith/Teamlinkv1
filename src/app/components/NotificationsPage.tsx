import { useState, useEffect, useCallback } from 'react';
import { ArrowLeft, Check, X, Bell, MessageSquare, Users, Calendar, Loader2 } from 'lucide-react';
import { Button } from './ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { notificationsAPI, handleApiError } from '../../utils/api';
import { toast } from 'sonner';

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
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isMarkingAll, setIsMarkingAll] = useState(false);

  const loadNotifications = useCallback(async () => {
    try {
      setIsLoading(true);
      const data = await notificationsAPI.getAll(user.id);
      setNotifications(data || []);
    } catch (error) {
      handleApiError(error, 'Failed to load notifications');
    } finally {
      setIsLoading(false);
    }
  }, [user.id]);

  useEffect(() => {
    loadNotifications();
  }, [loadNotifications]);

  const handleMarkAsRead = async (notificationId: string) => {
    // Optimistic update
    setNotifications(prev =>
      prev.map(n => n.id === notificationId ? { ...n, read: true } : n)
    );
    try {
      await notificationsAPI.markAsRead(notificationId);
    } catch (error) {
      // Revert on failure
      setNotifications(prev =>
        prev.map(n => n.id === notificationId ? { ...n, read: false } : n)
      );
      handleApiError(error, 'Failed to mark notification as read');
    }
  };

  const handleMarkAllAsRead = async () => {
    setIsMarkingAll(true);
    const previous = notifications;
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    try {
      await notificationsAPI.markAllAsRead(user.id);
      toast.success('All notifications marked as read');
    } catch (error) {
      setNotifications(previous);
      handleApiError(error, 'Failed to mark all as read');
    } finally {
      setIsMarkingAll(false);
    }
  };

  const getIcon = (type: Notification['type']) => {
    switch (type) {
      case 'task': return <Check className="w-4 h-4" />;
      case 'message': return <MessageSquare className="w-4 h-4" />;
      case 'team': return <Users className="w-4 h-4" />;
      case 'event': return <Calendar className="w-4 h-4" />;
    }
  };

  const getIconColor = (type: Notification['type']) => {
    switch (type) {
      case 'task': return 'bg-blue-100 text-blue-600';
      case 'message': return 'bg-green-100 text-green-600';
      case 'team': return 'bg-purple-100 text-purple-600';
      case 'event': return 'bg-orange-100 text-orange-600';
    }
  };

  const unreadNotifications = notifications.filter(n => !n.read);
  const readNotifications = notifications.filter(n => n.read);

  const NotificationRow = ({ notification, showDot = false }: { notification: Notification; showDot?: boolean }) => (
    <div
      key={notification.id}
      className="p-4 hover:bg-gray-50 dark:hover:bg-gray-800/50 cursor-pointer transition-colors relative"
      onClick={() => !notification.read && handleMarkAsRead(notification.id)}
    >
      <div className="flex gap-4">
        {notification.avatar ? (
          <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-medium flex-shrink-0 ${notification.read ? 'bg-gradient-to-br from-gray-300 to-gray-400' : 'bg-gradient-to-br from-blue-400 to-blue-600'}`}>
            {notification.avatar}
          </div>
        ) : (
          <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${getIconColor(notification.type)}`}>
            {getIcon(notification.type)}
          </div>
        )}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between mb-1">
            <p className={`font-medium ${notification.read ? 'text-gray-700 dark:text-gray-400' : 'text-gray-900 dark:text-white'}`}>
              {notification.title}
            </p>
            {!notification.read && (
              <button
                className="text-gray-400 hover:text-gray-600 ml-2 flex-shrink-0"
                onClick={e => { e.stopPropagation(); handleMarkAsRead(notification.id); }}
                aria-label="Mark as read"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
          <p className={`text-sm mb-1 ${notification.read ? 'text-gray-500 dark:text-gray-500' : 'text-gray-600 dark:text-gray-300'}`}>
            {notification.description}
          </p>
          <p className="text-xs text-gray-400">{notification.time}</p>
        </div>
        {showDot && !notification.read && (
          <div className="absolute top-4 right-4 w-2 h-2 bg-blue-600 rounded-full" />
        )}
      </div>
    </div>
  );

  const EmptyState = ({ message }: { message: string }) => (
    <div className="p-12 text-center">
      <Bell className="w-12 h-12 text-gray-300 mx-auto mb-4" />
      <p className="text-gray-500">{message}</p>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={onBack}>
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div>
              <h1 className="text-xl font-semibold dark:text-white">Notifications</h1>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {isLoading ? 'Loading...' : `${unreadNotifications.length} unread`}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleMarkAllAsRead}
              disabled={isMarkingAll || unreadNotifications.length === 0}
            >
              {isMarkingAll ? <Loader2 className="w-4 h-4 mr-1 animate-spin" /> : null}
              Mark all as read
            </Button>
            <Button variant="outline" onClick={onNavigateToProfile}>
              Profile
            </Button>
          </div>
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-6 py-8">
        {isLoading ? (
          <div className="flex items-center justify-center py-24">
            <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
          </div>
        ) : (
          <Tabs defaultValue="all" className="space-y-6">
            <TabsList className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
              <TabsTrigger value="all">
                All
                <span className="ml-2 px-2 py-0.5 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-full text-xs">
                  {notifications.length}
                </span>
              </TabsTrigger>
              <TabsTrigger value="unread">
                Unread
                <span className="ml-2 px-2 py-0.5 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 rounded-full text-xs">
                  {unreadNotifications.length}
                </span>
              </TabsTrigger>
              <TabsTrigger value="tasks">Tasks</TabsTrigger>
              <TabsTrigger value="messages">Messages</TabsTrigger>
              <TabsTrigger value="teams">Teams</TabsTrigger>
            </TabsList>

            {/* All */}
            <TabsContent value="all">
              <div className="space-y-4">
                {unreadNotifications.length > 0 && (
                  <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
                    <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                      <h3 className="font-semibold text-gray-900 dark:text-white">New</h3>
                    </div>
                    <div className="divide-y divide-gray-100 dark:divide-gray-700">
                      {unreadNotifications.map(n => <NotificationRow key={n.id} notification={n} showDot />)}
                    </div>
                  </div>
                )}
                {readNotifications.length > 0 && (
                  <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
                    <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                      <h3 className="font-semibold text-gray-900 dark:text-white">Earlier</h3>
                    </div>
                    <div className="divide-y divide-gray-100 dark:divide-gray-700">
                      {readNotifications.map(n => <NotificationRow key={n.id} notification={n} />)}
                    </div>
                  </div>
                )}
                {notifications.length === 0 && <EmptyState message="No notifications yet" />}
              </div>
            </TabsContent>

            {/* Unread */}
            <TabsContent value="unread">
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
                {unreadNotifications.length > 0 ? (
                  <div className="divide-y divide-gray-100 dark:divide-gray-700">
                    {unreadNotifications.map(n => <NotificationRow key={n.id} notification={n} showDot />)}
                  </div>
                ) : (
                  <EmptyState message="No unread notifications" />
                )}
              </div>
            </TabsContent>

            {/* Tasks */}
            <TabsContent value="tasks">
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
                {notifications.filter(n => n.type === 'task').length > 0 ? (
                  <div className="divide-y divide-gray-100 dark:divide-gray-700">
                    {notifications.filter(n => n.type === 'task').map(n => <NotificationRow key={n.id} notification={n} />)}
                  </div>
                ) : (
                  <EmptyState message="No task notifications" />
                )}
              </div>
            </TabsContent>

            {/* Messages */}
            <TabsContent value="messages">
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
                {notifications.filter(n => n.type === 'message').length > 0 ? (
                  <div className="divide-y divide-gray-100 dark:divide-gray-700">
                    {notifications.filter(n => n.type === 'message').map(n => <NotificationRow key={n.id} notification={n} />)}
                  </div>
                ) : (
                  <EmptyState message="No message notifications" />
                )}
              </div>
            </TabsContent>

            {/* Teams */}
            <TabsContent value="teams">
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
                {notifications.filter(n => n.type === 'team').length > 0 ? (
                  <div className="divide-y divide-gray-100 dark:divide-gray-700">
                    {notifications.filter(n => n.type === 'team').map(n => <NotificationRow key={n.id} notification={n} />)}
                  </div>
                ) : (
                  <EmptyState message="No team notifications" />
                )}
              </div>
            </TabsContent>
          </Tabs>
        )}
      </div>
    </div>
  );
}
