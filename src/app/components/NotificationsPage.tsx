import { useState, useEffect, useCallback } from 'react';
import {
  ArrowLeft, Check, Bell, MessageSquare, Users, Calendar, Loader2,
  CheckCheck, UserPlus, FolderOpen, ClipboardList,
} from 'lucide-react';
import { Button } from './ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { notificationsAPI, handleApiError } from '../../utils/api';
import { toast } from 'sonner';

interface NotificationsPageProps {
  user: any;
  onBack: () => void;
  onNavigateToProfile: () => void;
  onLogout: () => void;
}

interface Notification {
  id: string;
  type: string;
  title: string;
  description: string;
  created_at?: string;
  time?: string;
  read?: boolean;
  is_read?: boolean;
  avatar?: string;
}

function getDateGroup(dateStr: string | undefined): string {
  if (!dateStr) return 'Earlier';
  const date = new Date(dateStr);
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  const notifDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  if (notifDate.getTime() >= today.getTime()) return 'Today';
  if (notifDate.getTime() >= yesterday.getTime()) return 'Yesterday';
  return 'Earlier';
}

function getTypeIcon(type: string) {
  switch (type) {
    case 'task': return <ClipboardList className="w-4 h-4" />;
    case 'message': return <MessageSquare className="w-4 h-4" />;
    case 'team': return <Users className="w-4 h-4" />;
    case 'event': return <Calendar className="w-4 h-4" />;
    case 'friend_request': return <UserPlus className="w-4 h-4" />;
    case 'project': return <FolderOpen className="w-4 h-4" />;
    default: return <Bell className="w-4 h-4" />;
  }
}

function getTypeColor(type: string) {
  switch (type) {
    case 'task': return 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400';
    case 'message': return 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400';
    case 'team': return 'bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400';
    case 'event': return 'bg-orange-100 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400';
    case 'friend_request': return 'bg-pink-100 text-pink-600 dark:bg-pink-900/30 dark:text-pink-400';
    case 'project': return 'bg-indigo-100 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400';
    default: return 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400';
  }
}

export function NotificationsPage({ user, onBack, onNavigateToProfile, onLogout }: NotificationsPageProps) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isMarkingAll, setIsMarkingAll] = useState(false);

  const userId = user?.id;

  const loadNotifications = useCallback(async () => {
    try {
      setIsLoading(true);
      const data = await notificationsAPI.getAll(userId);
      setNotifications(data || []);
    } catch (error) {
      handleApiError(error, 'Failed to load notifications');
    } finally {
      setIsLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    loadNotifications();
  }, [loadNotifications]);

  const isRead = (n: Notification) => n.read || n.is_read;

  const handleMarkAsRead = async (notificationId: string) => {
    setNotifications(prev =>
      prev.map(n => n.id === notificationId ? { ...n, read: true, is_read: true } : n)
    );
    try {
      await notificationsAPI.markAsRead(notificationId);
    } catch (error) {
      setNotifications(prev =>
        prev.map(n => n.id === notificationId ? { ...n, read: false, is_read: false } : n)
      );
      handleApiError(error, 'Failed to mark notification as read');
    }
  };

  const handleMarkAllAsRead = async () => {
    setIsMarkingAll(true);
    const previous = notifications;
    setNotifications(prev => prev.map(n => ({ ...n, read: true, is_read: true })));
    try {
      await notificationsAPI.markAllAsRead(userId);
      toast.success('All notifications marked as read');
    } catch (error) {
      setNotifications(previous);
      handleApiError(error, 'Failed to mark all as read');
    } finally {
      setIsMarkingAll(false);
    }
  };

  const unreadNotifications = notifications.filter(n => !isRead(n));
  const unreadCount = unreadNotifications.length;

  // Group notifications by date
  function groupByDate(notifs: Notification[]): { label: string; items: Notification[] }[] {
    const groups: Record<string, Notification[]> = {};
    for (const n of notifs) {
      const group = getDateGroup(n.created_at);
      if (!groups[group]) groups[group] = [];
      groups[group].push(n);
    }
    const order = ['Today', 'Yesterday', 'Earlier'];
    return order.filter(k => groups[k]).map(k => ({ label: k, items: groups[k] }));
  }

  const NotificationRow = ({ notification }: { notification: Notification }) => {
    const read = isRead(notification);
    const timeStr = notification.created_at
      ? new Date(notification.created_at).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
      : notification.time || '';

    return (
      <div
        className={`flex gap-4 p-4 cursor-pointer transition-colors rounded-xl ${
          read
            ? 'hover:bg-gray-50 dark:hover:bg-gray-700/30'
            : 'bg-blue-50/50 dark:bg-blue-900/10 hover:bg-blue-50 dark:hover:bg-blue-900/20'
        }`}
        onClick={() => !read && handleMarkAsRead(notification.id)}
      >
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${getTypeColor(notification.type)}`}>
          {getTypeIcon(notification.type)}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2 mb-0.5">
            <p className={`text-sm ${read ? 'text-gray-600 dark:text-gray-400' : 'font-medium text-gray-900 dark:text-white'}`}>
              {notification.title}
            </p>
            <div className="flex items-center gap-2 flex-shrink-0">
              {!read && (
                <div className="w-2 h-2 bg-[rgb(var(--color-accent-primary))] dark:bg-[rgb(var(--color-accent-primary-dark))] rounded-full" />
              )}
              {!read && (
                <button
                  className="p-1 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg transition-colors"
                  onClick={e => { e.stopPropagation(); handleMarkAsRead(notification.id); }}
                  title="Mark as read"
                >
                  <Check className="w-3.5 h-3.5 text-gray-400" />
                </button>
              )}
            </div>
          </div>
          {notification.description && (
            <p className={`text-xs mb-1 ${read ? 'text-gray-400 dark:text-gray-500' : 'text-gray-500 dark:text-gray-400'}`}>
              {notification.description}
            </p>
          )}
          <p className="text-[11px] text-gray-400 dark:text-gray-500">{timeStr}</p>
        </div>
      </div>
    );
  };

  const EmptyState = ({ message }: { message: string }) => (
    <div className="py-16 text-center">
      <div className="w-14 h-14 mx-auto mb-4 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center">
        <Bell className="w-7 h-7 text-gray-400 dark:text-gray-500" />
      </div>
      <p className="text-sm font-medium text-gray-900 dark:text-white mb-1">{message}</p>
      <p className="text-xs text-gray-500 dark:text-gray-400">
        Notifications will appear here when there's something new.
      </p>
    </div>
  );

  const GroupedList = ({ items }: { items: Notification[] }) => {
    const groups = groupByDate(items);
    if (items.length === 0) return <EmptyState message="No notifications" />;
    return (
      <div className="space-y-4">
        {groups.map(group => (
          <div key={group.label}>
            <h3 className="text-xs font-semibold uppercase text-gray-500 dark:text-gray-400 px-4 mb-2">
              {group.label}
            </h3>
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
              <div className="divide-y divide-gray-100 dark:divide-gray-700/50">
                {group.items.map(n => <NotificationRow key={n.id} notification={n} />)}
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <header className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800">
        <div className="max-w-4xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={onBack} className="rounded-lg">
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div>
              <h1 className="text-lg font-semibold text-gray-900 dark:text-white">Notifications</h1>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {isLoading ? 'Loading...' : `${unreadCount} unread`}
              </p>
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={handleMarkAllAsRead}
            disabled={isMarkingAll || unreadCount === 0}
            className="rounded-lg"
          >
            {isMarkingAll ? <Loader2 className="w-4 h-4 mr-1.5 animate-spin" /> : <CheckCheck className="w-4 h-4 mr-1.5" />}
            Mark all read
          </Button>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-6 py-6">
        {isLoading ? (
          <div className="flex items-center justify-center py-24">
            <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
          </div>
        ) : (
          <Tabs defaultValue="all" className="space-y-5">
            <TabsList className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg">
              <TabsTrigger value="all" className="rounded-lg">
                All
                <span className="ml-1.5 px-1.5 py-0.5 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded-full text-xs">
                  {notifications.length}
                </span>
              </TabsTrigger>
              <TabsTrigger value="unread" className="rounded-lg">
                Unread
                {unreadCount > 0 && (
                  <span className="ml-1.5 px-1.5 py-0.5 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-full text-xs">
                    {unreadCount}
                  </span>
                )}
              </TabsTrigger>
              <TabsTrigger value="tasks" className="rounded-lg">Tasks</TabsTrigger>
              <TabsTrigger value="messages" className="rounded-lg">Messages</TabsTrigger>
            </TabsList>

            <TabsContent value="all">
              <GroupedList items={notifications} />
            </TabsContent>

            <TabsContent value="unread">
              {unreadNotifications.length > 0 ? (
                <GroupedList items={unreadNotifications} />
              ) : (
                <EmptyState message="All caught up!" />
              )}
            </TabsContent>

            <TabsContent value="tasks">
              <GroupedList items={notifications.filter(n => n.type === 'task')} />
            </TabsContent>

            <TabsContent value="messages">
              <GroupedList items={notifications.filter(n => n.type === 'message')} />
            </TabsContent>
          </Tabs>
        )}
      </div>
    </div>
  );
}
