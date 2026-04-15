import {
  Search, Bell, Menu, Plus, MessageCircle, ChevronLeft, ChevronRight,
  FolderPlus, Users, LayoutDashboard, Columns3, Settings, UserCircle,
  Sun, Moon, Monitor, FolderOpen, CheckCircle2, ListTodo, Activity,
} from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Progress } from './ui/progress';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger,
} from './ui/dropdown-menu';
import {
  Dialog, DialogContent, DialogDescription, DialogFooter,
  DialogHeader, DialogTitle,
} from './ui/dialog';
import { ChatPopup } from './ChatPopup';
import { ConnectionsPopup } from './ConnectionsPopup';
import { useTheme } from './ThemeContext';
import { useState, useEffect, useRef } from 'react';
import { projectAPI, notificationsAPI, connectionsAPI, handleApiError } from '../../utils/api';
import { User } from '../../utils/supabase';
import { toast } from 'sonner';

interface DashboardProps {
  user: User;
  onProjectSelect: (projectId: string) => void;
  onTeamSelect: (teamId: string) => void;
  onNavigateToKanban: () => void;
  onNavigateToChat: () => void;
  onNavigateToProfile: () => void;
  onNavigateToSettings: () => void;
  onNavigateToNotifications: () => void;
  onLogout: () => void;
}

function StatCardSkeleton() {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-5 animate-pulse">
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <div className="h-3 w-20 bg-gray-200 dark:bg-gray-700 rounded" />
          <div className="h-7 w-12 bg-gray-200 dark:bg-gray-700 rounded" />
        </div>
        <div className="h-10 w-10 bg-gray-200 dark:bg-gray-700 rounded-xl" />
      </div>
    </div>
  );
}

function ProjectCardSkeleton() {
  return (
    <div className="p-4 border border-gray-200 dark:border-gray-700 rounded-xl animate-pulse bg-white dark:bg-gray-800/50">
      <div className="flex items-start justify-between mb-3">
        <div className="space-y-2 flex-1">
          <div className="h-4 w-40 bg-gray-200 dark:bg-gray-700 rounded" />
          <div className="h-3 w-24 bg-gray-100 dark:bg-gray-700/50 rounded" />
        </div>
        <div className="flex -space-x-2">
          {[1, 2, 3].map(i => (
            <div key={i} className="w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-700 border-2 border-white dark:border-gray-800" />
          ))}
        </div>
      </div>
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <div className="h-3 w-16 bg-gray-100 dark:bg-gray-700/50 rounded" />
          <div className="h-3 w-8 bg-gray-100 dark:bg-gray-700/50 rounded" />
        </div>
        <div className="h-2 w-full bg-gray-200 dark:bg-gray-700 rounded-full" />
      </div>
    </div>
  );
}

function ActivitySkeleton() {
  return (
    <div className="space-y-4 animate-pulse">
      {[1, 2, 3].map(i => (
        <div key={i} className="flex items-start gap-3">
          <div className="w-9 h-9 rounded-full bg-gray-200 dark:bg-gray-700" />
          <div className="flex-1 space-y-2">
            <div className="h-3 w-3/4 bg-gray-200 dark:bg-gray-700 rounded" />
            <div className="h-2 w-1/2 bg-gray-100 dark:bg-gray-700/50 rounded" />
          </div>
        </div>
      ))}
    </div>
  );
}

const navItems = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'kanban', label: 'Projects', icon: Columns3 },
  { id: 'chat', label: 'Chat', icon: MessageCircle },
  { id: 'connections', label: 'Connections', icon: Users },
  { id: 'notifications', label: 'Notifications', icon: Bell },
  { id: 'profile', label: 'Profile', icon: UserCircle },
  { id: 'settings', label: 'Settings', icon: Settings },
];

export function Dashboard({
  user,
  onProjectSelect,
  onTeamSelect,
  onNavigateToKanban,
  onNavigateToChat,
  onNavigateToProfile,
  onNavigateToSettings,
  onNavigateToNotifications,
  onLogout,
}: DashboardProps) {
  const { theme, setTheme, isDark } = useTheme();
  const [projects, setProjects] = useState<any[]>([]);
  const [recentActivity, setRecentActivity] = useState<any[]>([]);
  const [stats, setStats] = useState({ activeProjects: 0, totalTasks: 0, completedTasks: 0 });
  const [isLoading, setIsLoading] = useState(true);
  const [isChatPopupOpen, setIsChatPopupOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isNewProjectDialogOpen, setIsNewProjectDialogOpen] = useState(false);
  const [newProjectTitle, setNewProjectTitle] = useState('');
  const [newProjectDueDate, setNewProjectDueDate] = useState('');
  const [isConnectionsPopupOpen, setIsConnectionsPopupOpen] = useState(false);
  const [activeNav, setActiveNav] = useState('dashboard');

  const [unreadNotifCount, setUnreadNotifCount] = useState(0);
  const [connectionsCount, setConnectionsCount] = useState(0);
  const [unreadChatCount] = useState(0);

  const userIdRef = useRef(user?.id);
  useEffect(() => { userIdRef.current = user?.id; }, [user?.id]);

  useEffect(() => {
    const loadData = async () => {
      try {
        setIsLoading(true);
        const [projectsData, statsData, notifications, friends] = await Promise.allSettled([
          projectAPI.getAll(user.id),
          projectAPI.getStats(user.id),
          notificationsAPI.getAll(user.id),
          connectionsAPI.getFriends(user.id),
        ]);
        if (projectsData.status === 'fulfilled') setProjects(projectsData.value);
        if (statsData.status === 'fulfilled') setStats(statsData.value);
        if (notifications.status === 'fulfilled') {
          const all = notifications.value;
          setRecentActivity(all.slice(0, 5));
          const unread = all.filter((n: any) => !n.read && !n.is_read).length;
          setUnreadNotifCount(unread);
        }
        if (friends.status === 'fulfilled') {
          setConnectionsCount(friends.value.length);
        }
      } catch (error) {
        handleApiError(error, 'Failed to load dashboard data');
      } finally {
        setIsLoading(false);
      }
    };
    if (user?.id) loadData();
  }, [user?.id]);

  useEffect(() => {
    if (!user?.id) return;
    const interval = setInterval(async () => {
      try {
        const all = await notificationsAPI.getAll(userIdRef.current);
        const unread = all.filter((n: any) => !n.read && !n.is_read).length;
        setUnreadNotifCount(unread);
        setRecentActivity(all.slice(0, 5));
      } catch {
        // silent
      }
    }, 30_000);
    return () => clearInterval(interval);
  }, [user?.id]);

  const handleCreateProject = async () => {
    if (newProjectTitle.trim()) {
      try {
        const newProject = await projectAPI.create(
          user.id,
          newProjectTitle,
          newProjectDueDate || undefined,
          '',
          'bg-purple-500',
        );
        setProjects([newProject, ...projects]);
        setNewProjectTitle('');
        setNewProjectDueDate('');
        setIsNewProjectDialogOpen(false);
        toast.success('Project created successfully!');
      } catch (error) {
        handleApiError(error, 'Failed to create project');
      }
    }
  };

  const handleNavClick = (id: string) => {
    setActiveNav(id);
    switch (id) {
      case 'kanban': onNavigateToKanban(); break;
      case 'chat': onNavigateToChat(); break;
      case 'connections': setIsConnectionsPopupOpen(true); break;
      case 'notifications': onNavigateToNotifications(); break;
      case 'profile': onNavigateToProfile(); break;
      case 'settings': onNavigateToSettings(); break;
    }
  };

  const cycleTheme = () => {
    if (theme === 'light') setTheme('dark');
    else if (theme === 'dark') setTheme('auto');
    else setTheme('light');
  };

  const ThemeIcon = theme === 'dark' ? Moon : theme === 'light' ? Sun : Monitor;

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-900">
      {/* Sidebar */}
      <div
        className={`${isSidebarCollapsed ? 'w-[72px]' : 'w-64'} bg-slate-900 dark:bg-gray-950 text-white flex flex-col transition-all duration-300 relative flex-shrink-0`}
      >
        <button
          onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
          className="absolute -right-3 top-20 w-6 h-6 bg-white dark:bg-gray-700 rounded-full shadow-lg flex items-center justify-center text-slate-900 dark:text-white hover:scale-110 transition-transform z-10"
        >
          {isSidebarCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>

        {/* Logo */}
        <div className="p-4 flex items-center gap-3 border-b border-white/10">
          <div className="w-9 h-9 bg-[rgb(var(--color-accent-primary))] rounded-lg flex items-center justify-center flex-shrink-0">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <path d="M3 3L21 12L3 21V3Z" fill="white" />
            </svg>
          </div>
          {!isSidebarCollapsed && <span className="font-bold text-lg tracking-tight">TeamLink</span>}
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {navItems.map(item => {
            const Icon = item.icon;
            const isActive = item.id === activeNav;
            return (
              <button
                key={item.id}
                onClick={() => handleNavClick(item.id)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200
                  ${isSidebarCollapsed ? 'justify-center' : ''}
                  ${isActive
                    ? 'bg-[rgb(var(--color-accent-primary))] text-white shadow-lg shadow-[rgb(var(--color-accent-primary))]/20'
                    : 'text-gray-400 hover:text-white hover:bg-white/5'
                  }`}
                title={isSidebarCollapsed ? item.label : undefined}
              >
                <Icon className="w-5 h-5 flex-shrink-0" />
                {!isSidebarCollapsed && <span>{item.label}</span>}
                {!isSidebarCollapsed && item.id === 'notifications' && unreadNotifCount > 0 && (
                  <span className="ml-auto px-2 py-0.5 bg-red-500 text-white text-xs font-bold rounded-full">
                    {unreadNotifCount > 99 ? '99+' : unreadNotifCount}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* User info at bottom */}
        <div className="p-3 border-t border-white/10">
          <div className={`flex items-center gap-3 ${isSidebarCollapsed ? 'justify-center' : ''}`}>
            <div className="w-9 h-9 bg-[rgb(var(--color-accent-primary))] rounded-full flex items-center justify-center text-white text-sm font-medium flex-shrink-0">
              {user.avatar_initials}
            </div>
            {!isSidebarCollapsed && (
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-white truncate">{user.first_name} {user.last_name}</p>
                <p className="text-xs text-gray-400 truncate">{user.email}</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <header className="h-16 border-b border-gray-200 dark:border-gray-800 flex items-center justify-between px-6 bg-white dark:bg-gray-900 flex-shrink-0">
          <div className="flex items-center gap-4">
            <div className="relative w-72">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 dark:text-gray-500" />
              <Input
                placeholder="Search..."
                className="pl-10 bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700 dark:text-white dark:placeholder-gray-500 rounded-lg"
              />
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Theme toggle */}
            <button
              onClick={cycleTheme}
              className="p-2.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-all duration-200 group"
              title={`Theme: ${theme}`}
            >
              <ThemeIcon className="w-5 h-5 text-gray-500 dark:text-gray-400 group-hover:text-gray-700 dark:group-hover:text-gray-200 transition-colors" />
            </button>

            {/* Chat */}
            <button
              onClick={() => setIsChatPopupOpen(true)}
              className="relative p-2.5 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-all duration-200 group"
            >
              <MessageCircle className="w-5 h-5 text-gray-500 dark:text-gray-400 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors" />
              {unreadChatCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-green-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                  {unreadChatCount}
                </span>
              )}
            </button>

            {/* Connections */}
            <button
              onClick={() => setIsConnectionsPopupOpen(true)}
              className="relative p-2.5 rounded-lg hover:bg-purple-50 dark:hover:bg-purple-900/20 transition-all duration-200 group"
            >
              <Users className="w-5 h-5 text-gray-500 dark:text-gray-400 group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors" />
              {connectionsCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-purple-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                  {connectionsCount > 9 ? '9+' : connectionsCount}
                </span>
              )}
            </button>

            {/* Notifications */}
            <button
              onClick={onNavigateToNotifications}
              className="relative p-2.5 rounded-lg hover:bg-amber-50 dark:hover:bg-amber-900/20 transition-all duration-200 group"
            >
              <Bell className="w-5 h-5 text-gray-500 dark:text-gray-400 group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors" />
              {unreadNotifCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                  {unreadNotifCount > 99 ? '99+' : unreadNotifCount}
                </span>
              )}
            </button>

            {/* User dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex items-center gap-2 hover:opacity-80 transition-opacity ml-1">
                  <div className="w-8 h-8 bg-[rgb(var(--color-accent-primary))] dark:bg-[rgb(var(--color-accent-primary-dark))] text-white rounded-full flex items-center justify-center text-sm font-medium">
                    {user.avatar_initials}
                  </div>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>
                  <div>
                    <p className="font-medium">{user.first_name} {user.last_name}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 font-normal">{user.email}</p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={onNavigateToProfile}>Profile</DropdownMenuItem>
                <DropdownMenuItem onClick={onNavigateToSettings}>Settings</DropdownMenuItem>
                <DropdownMenuItem onClick={onNavigateToNotifications}>Notifications</DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={onLogout} className="text-red-600 dark:text-red-400">Sign Out</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>

        {/* Main area */}
        <div className="flex-1 overflow-auto p-6">
          <div className="max-w-7xl mx-auto">
            {/* Welcome header */}
            <div className="mb-6">
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                Welcome back, {user.first_name}
              </h1>
              <p className="text-gray-500 dark:text-gray-400 mt-1">
                Here's what's happening with your projects.
              </p>
            </div>

            {/* Stats cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
              {isLoading ? (
                <>
                  <StatCardSkeleton />
                  <StatCardSkeleton />
                  <StatCardSkeleton />
                </>
              ) : (
                <>
                  <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-5 hover:shadow-md transition-shadow duration-200">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-500 dark:text-gray-400">Active Projects</p>
                        <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{stats.activeProjects}</p>
                      </div>
                      <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-xl flex items-center justify-center">
                        <FolderOpen className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                      </div>
                    </div>
                  </div>
                  <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-5 hover:shadow-md transition-shadow duration-200">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-500 dark:text-gray-400">Total Tasks</p>
                        <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{stats.totalTasks}</p>
                      </div>
                      <div className="w-10 h-10 bg-amber-100 dark:bg-amber-900/30 rounded-xl flex items-center justify-center">
                        <ListTodo className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                      </div>
                    </div>
                  </div>
                  <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-5 hover:shadow-md transition-shadow duration-200">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-500 dark:text-gray-400">Completed</p>
                        <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{stats.completedTasks}</p>
                      </div>
                      <div className="w-10 h-10 bg-green-100 dark:bg-green-900/30 rounded-xl flex items-center justify-center">
                        <CheckCircle2 className="w-5 h-5 text-green-600 dark:text-green-400" />
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* Main grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Projects list - 2 columns */}
              <div className="lg:col-span-2 space-y-6">
                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                  <div className="flex items-center justify-between mb-5">
                    <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Projects</h2>
                    <Button onClick={() => setIsNewProjectDialogOpen(true)} size="sm" className="btn-accent rounded-lg">
                      <FolderPlus className="w-4 h-4 mr-1.5" />
                      New Project
                    </Button>
                  </div>

                  {isLoading ? (
                    <div className="space-y-4">
                      <ProjectCardSkeleton />
                      <ProjectCardSkeleton />
                      <ProjectCardSkeleton />
                    </div>
                  ) : projects.length === 0 ? (
                    <div className="text-center py-12">
                      <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center">
                        <FolderOpen className="w-8 h-8 text-gray-400 dark:text-gray-500" />
                      </div>
                      <h3 className="text-base font-medium text-gray-900 dark:text-white mb-1">No projects yet</h3>
                      <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">Create your first project to get started.</p>
                      <Button onClick={() => setIsNewProjectDialogOpen(true)} size="sm" className="btn-accent rounded-lg">
                        <FolderPlus className="w-4 h-4 mr-1.5" />
                        Create Project
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {projects.map(project => {
                        const dueDate = project.due_date
                          ? new Date(project.due_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
                          : 'No due date';
                        const memberCount = project.members?.[0]?.count || 1;
                        return (
                          <div
                            key={project.id}
                            onClick={() => { onProjectSelect(project.id); onNavigateToKanban(); }}
                            className="p-4 border border-gray-200 dark:border-gray-700 rounded-xl hover:shadow-md dark:hover:shadow-gray-900/50 transition-all duration-200 cursor-pointer bg-white dark:bg-gray-800/50 group"
                          >
                            <div className="flex items-start justify-between mb-3">
                              <div>
                                <h3 className="font-semibold text-gray-900 dark:text-white group-hover:text-[rgb(var(--color-accent-primary))] dark:group-hover:text-[rgb(var(--color-accent-primary-dark))] transition-colors">
                                  {project.title}
                                </h3>
                                <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">{dueDate}</p>
                              </div>
                              <div className="flex -space-x-2">
                                {[...Array(Math.min(memberCount, 3))].map((_, i) => (
                                  <div
                                    key={i}
                                    className="w-7 h-7 rounded-full border-2 border-white dark:border-gray-800 bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white text-[10px] font-medium"
                                  >
                                    {i === 2 && memberCount > 3 ? `+${memberCount - 2}` : ''}
                                  </div>
                                ))}
                              </div>
                            </div>
                            <div className="space-y-1.5">
                              <div className="flex items-center justify-between text-sm">
                                <span className="text-gray-500 dark:text-gray-400">Progress</span>
                                <span className="font-medium text-gray-900 dark:text-white">{project.progress || 0}%</span>
                              </div>
                              <Progress value={project.progress || 0} className="h-1.5" />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>

              {/* Right column - Activity feed */}
              <div className="space-y-6">
                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                  <div className="flex items-center gap-2 mb-5">
                    <Activity className="w-4 h-4 text-gray-400" />
                    <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Recent Activity</h2>
                  </div>

                  {isLoading ? (
                    <ActivitySkeleton />
                  ) : recentActivity.length === 0 ? (
                    <div className="text-center py-8">
                      <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center">
                        <Activity className="w-6 h-6 text-gray-400 dark:text-gray-500" />
                      </div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">No recent activity</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {recentActivity.map(activity => {
                        const timeAgo = activity.created_at
                          ? new Date(activity.created_at).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
                          : 'Recently';
                        return (
                          <div key={activity.id} className="flex items-start gap-3">
                            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white text-xs font-medium flex-shrink-0">
                              {activity.type?.[0]?.toUpperCase() || 'N'}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{activity.title}</p>
                              {activity.description && (
                                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 truncate">{activity.description}</p>
                              )}
                              <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">{timeAgo}</p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Quick stats card */}
                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Quick Stats</h2>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-500 dark:text-gray-400">Total Tasks</span>
                      <span className="text-lg font-bold text-[rgb(var(--color-accent-primary))] dark:text-[rgb(var(--color-accent-primary-dark))]">{stats.totalTasks}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-500 dark:text-gray-400">Completed</span>
                      <span className="text-lg font-bold text-green-600 dark:text-green-400">{stats.completedTasks}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-500 dark:text-gray-400">In Progress</span>
                      <span className="text-lg font-bold text-amber-600 dark:text-amber-400">{stats.totalTasks - stats.completedTasks}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <ChatPopup user={user} isOpen={isChatPopupOpen} onClose={() => setIsChatPopupOpen(false)} />
      <ConnectionsPopup user={user} isOpen={isConnectionsPopupOpen} onClose={() => setIsConnectionsPopupOpen(false)} />

      {/* New Project Dialog */}
      <Dialog open={isNewProjectDialogOpen} onOpenChange={setIsNewProjectDialogOpen}>
        <DialogContent className="sm:max-w-[500px] bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
          <DialogHeader>
            <DialogTitle className="text-gray-900 dark:text-white flex items-center gap-2">
              <FolderPlus className="w-5 h-5 text-[rgb(var(--color-accent-primary))] dark:text-[rgb(var(--color-accent-primary-dark))]" />
              Create New Project
            </DialogTitle>
            <DialogDescription className="text-gray-500 dark:text-gray-400">
              Set up a new project to organize your team's work and track progress.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label htmlFor="project-title" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Project Title <span className="text-red-500">*</span>
              </label>
              <Input
                id="project-title"
                placeholder="Enter project name..."
                value={newProjectTitle}
                onChange={e => setNewProjectTitle(e.target.value)}
                className="dark:bg-gray-700 dark:border-gray-600 dark:text-white dark:placeholder-gray-400"
              />
            </div>
            <div className="space-y-2">
              <label htmlFor="project-date" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Due Date (optional)
              </label>
              <Input
                id="project-date"
                type="date"
                value={newProjectDueDate}
                onChange={e => setNewProjectDueDate(e.target.value)}
                className="dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsNewProjectDialogOpen(false)} className="dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700">
              Cancel
            </Button>
            <Button onClick={handleCreateProject} disabled={!newProjectTitle.trim()} className="btn-accent">
              <FolderPlus className="w-4 h-4 mr-2" />
              Create Project
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
