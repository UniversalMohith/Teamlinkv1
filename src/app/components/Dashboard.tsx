import { Search, Bell, Menu, Plus, MessageCircle, ChevronLeft, ChevronRight, FolderPlus, Users } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Progress } from './ui/progress';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from './ui/dropdown-menu';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from './ui/dialog';
import { ChatPopup } from './ChatPopup';
import { ConnectionsPopup } from './ConnectionsPopup';
import { useState, useEffect } from 'react';
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

export function Dashboard({ 
  user,
  onProjectSelect, 
  onTeamSelect, 
  onNavigateToKanban, 
  onNavigateToChat,
  onNavigateToProfile,
  onNavigateToSettings,
  onNavigateToNotifications,
  onLogout
}: DashboardProps) {
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

  // Badge counts
  const [unreadNotifCount, setUnreadNotifCount] = useState(0);
  const [connectionsCount, setConnectionsCount] = useState(0);
  const [unreadChatCount, setUnreadChatCount] = useState(0); // stays 0 until unread messages endpoint is added

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
          // Use recent 5 for activity feed
          setRecentActivity(all.slice(0, 5));
          // Count unread
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

    if (user?.id) {
      loadData();
    }
  }, [user?.id]);

  const handleCreateProject = async () => {
    if (newProjectTitle.trim()) {
      try {
        const newProject = await projectAPI.create(
          user.id,
          newProjectTitle,
          newProjectDueDate || undefined,
          '',
          'bg-purple-500'
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

  const hasProjects = projects.length > 0;

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-900">
      {/* Sidebar */}
      <div className={`${isSidebarCollapsed ? 'w-20' : 'w-64'} bg-[rgb(var(--color-accent-primary))] dark:bg-[rgb(var(--color-accent-primary-dark))] text-white flex flex-col transition-all duration-300 relative`}>
        {/* Collapse Toggle Button */}
        <button
          onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
          className="absolute -right-3 top-20 w-6 h-6 bg-white dark:bg-gray-700 rounded-full shadow-lg flex items-center justify-center text-[rgb(var(--color-accent-primary))] dark:text-white hover:scale-110 transition-transform z-10"
        >
          {isSidebarCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>

        {/* Logo */}
        <div className="p-4 flex items-center gap-2">
          <div className="w-8 h-8 bg-white dark:bg-gray-800 rounded flex items-center justify-center flex-shrink-0">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <path d="M3 3L21 12L3 21V3Z" fill="rgb(var(--color-accent-primary))"/>
            </svg>
          </div>
          {!isSidebarCollapsed && <span className="font-semibold text-lg">TeamLink</span>}
        </div>

        {/* Navigation Menu */}
        <div className="px-4 py-2">
          <div className="space-y-1">
            <button className={`w-full px-4 py-2 bg-white/20 dark:bg-white/10 rounded-lg text-left font-medium flex items-center ${isSidebarCollapsed ? 'justify-center' : 'gap-2'}`}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                <rect x="3" y="3" width="7" height="7" rx="1" fill="white"/>
                <rect x="14" y="3" width="7" height="7" rx="1" fill="white"/>
                <rect x="3" y="14" width="7" height="7" rx="1" fill="white"/>
                <rect x="14" y="14" width="7" height="7" rx="1" fill="white"/>
              </svg>
              {!isSidebarCollapsed && 'Projects'}
            </button>

            {/* Boards button — only enabled when at least one project exists */}
            <div className="relative group">
              <button
                onClick={() => {
                  if (hasProjects) {
                    onProjectSelect(projects[0].id);
                    onNavigateToKanban();
                  } else {
                    toast.info('Select a project first to open its board');
                  }
                }}
                className={`w-full px-4 py-2 rounded-lg text-left flex items-center transition-colors
                  ${isSidebarCollapsed ? 'justify-center' : 'gap-2'}
                  ${hasProjects
                    ? 'hover:bg-white/10 cursor-pointer'
                    : 'opacity-50 cursor-not-allowed'
                  }`}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="white">
                  <rect x="4" y="4" width="6" height="16" rx="1"/>
                  <rect x="14" y="4" width="6" height="10" rx="1"/>
                </svg>
                {!isSidebarCollapsed && 'Boards'}
              </button>
              {/* Tooltip when no projects */}
              {!hasProjects && !isSidebarCollapsed && (
                <span className="absolute left-full ml-2 top-1/2 -translate-y-1/2 bg-gray-900 text-white text-xs rounded px-2 py-1 whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-20">
                  Select a project first
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Active Projects Section */}
        {!isSidebarCollapsed && (
          <div className="flex-1 px-4 py-6 overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-sm">Active Projects</h2>
              <button className="hover:bg-white/10 rounded p-1">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="white">
                  <path d="M6 9L12 15L18 9"/>
                </svg>
              </button>
            </div>

            <div className="space-y-3">
              {projects.map((project) => {
                const dueDate = project.due_date 
                  ? new Date(project.due_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
                  : 'No due date';
                const memberCount = project.members?.[0]?.count || 1;
                
                return (
                  <div
                    key={project.id}
                    onClick={() => {
                      onProjectSelect(project.id);
                      onNavigateToKanban();
                    }}
                    className="p-3 rounded-lg hover:bg-white/10 cursor-pointer transition-colors"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <h3 className="text-sm font-medium">{project.title}</h3>
                      <span className="w-6 h-6 bg-white/20 dark:bg-white/10 rounded-full flex items-center justify-center text-xs">
                        {memberCount}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-xs">
                      <span className="opacity-80">{dueDate}</span>
                      <div className="flex gap-1">
                        <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                        <div className="w-2 h-2 bg-gray-300 dark:bg-gray-600 rounded-full"></div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <header className="h-16 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between px-6 bg-white dark:bg-gray-800">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon">
              <Menu className="w-5 h-5" />
            </Button>
            <div className="relative w-80">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 dark:text-gray-500" />
              <Input 
                placeholder="Search" 
                className="pl-10 bg-gray-50 dark:bg-gray-700 border-gray-200 dark:border-gray-600 dark:text-white dark:placeholder-gray-400"
              />
            </div>
          </div>

          <div className="flex items-center gap-4">
            {/* Chat button — unread count will be wired once endpoint is available */}
            <button 
              onClick={() => setIsChatPopupOpen(true)}
              className="relative p-2.5 rounded-xl bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 hover:from-blue-100 hover:to-indigo-100 dark:hover:from-blue-900/30 dark:hover:to-indigo-900/30 transition-all duration-200 group"
            >
              <MessageCircle className="w-5 h-5 text-blue-600 dark:text-blue-400 group-hover:scale-110 transition-transform" />
              {unreadChatCount > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-gradient-to-br from-green-400 to-green-600 text-white text-xs font-bold rounded-full flex items-center justify-center shadow-lg">
                  {unreadChatCount}
                </span>
              )}
            </button>

            {/* Connections button — real friends count */}
            <button 
              onClick={() => setIsConnectionsPopupOpen(true)}
              className="relative p-2.5 rounded-xl bg-gradient-to-br from-purple-50 to-violet-50 dark:from-purple-900/20 dark:to-violet-900/20 hover:from-purple-100 hover:to-violet-100 dark:hover:from-purple-900/30 dark:hover:to-violet-900/30 transition-all duration-200 group"
            >
              <Users className="w-5 h-5 text-purple-600 dark:text-purple-400 group-hover:scale-110 transition-transform" />
              {connectionsCount > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-gradient-to-br from-green-400 to-green-600 text-white text-xs font-bold rounded-full flex items-center justify-center shadow-lg">
                  {connectionsCount}
                </span>
              )}
            </button>

            {/* Notifications button — real unread count */}
            <button 
              onClick={onNavigateToNotifications}
              className="relative p-2.5 rounded-xl bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 hover:from-amber-100 hover:to-orange-100 dark:hover:from-amber-900/30 dark:hover:to-orange-900/30 transition-all duration-200 group"
            >
              <Bell className="w-5 h-5 text-amber-600 dark:text-amber-400 group-hover:scale-110 group-hover:rotate-12 transition-all" />
              {unreadNotifCount > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-gradient-to-br from-red-500 to-pink-600 text-white text-xs font-bold rounded-full flex items-center justify-center shadow-lg">
                  {unreadNotifCount > 99 ? '99+' : unreadNotifCount}
                </span>
              )}
            </button>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex items-center gap-2 hover:opacity-80 transition-opacity">
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
                <DropdownMenuItem onClick={onNavigateToProfile}>
                  Profile
                </DropdownMenuItem>
                <DropdownMenuItem onClick={onNavigateToSettings}>
                  Settings
                </DropdownMenuItem>
                <DropdownMenuItem onClick={onNavigateToNotifications}>
                  Notifications
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={onLogout} className="text-red-600 dark:text-red-400">
                  Sign Out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>

        {/* Dashboard Content */}
        <div className="flex-1 overflow-auto p-6">
          <div className="max-w-7xl mx-auto">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Left Column - Projects */}
              <div className="lg:col-span-2 space-y-6">
                {/* Active Projects Card */}
                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Active Projects</h2>
                    <Button onClick={() => setIsNewProjectDialogOpen(true)} size="sm" className="btn-accent">
                      <FolderPlus className="w-4 h-4 mr-1" />
                      New Project
                    </Button>
                  </div>

                  <div className="space-y-4">
                    {projects.map((project) => {
                      const dueDate = project.due_date 
                        ? new Date(project.due_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
                        : 'No due date';
                      const memberCount = project.members?.[0]?.count || 1;
                      
                      return (
                        <div
                          key={project.id}
                          onClick={() => {
                            onProjectSelect(project.id);
                            onNavigateToKanban();
                          }}
                          className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:shadow-md dark:hover:shadow-gray-900/50 transition-shadow cursor-pointer bg-white dark:bg-gray-800/50"
                        >
                          <div className="flex items-start justify-between mb-3">
                            <div>
                              <h3 className="font-semibold text-gray-900 dark:text-white">{project.title}</h3>
                              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{dueDate}</p>
                            </div>
                            <div className="flex -space-x-2">
                              {[...Array(Math.min(memberCount, 5))].map((_, i) => (
                                <div
                                  key={i}
                                  className="w-8 h-8 rounded-full border-2 border-white dark:border-gray-800 bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white text-xs font-medium"
                                >
                                  {i === 4 && memberCount > 5 ? `+${memberCount - 4}` : ''}
                                </div>
                              ))}
                            </div>
                          </div>
                          <div className="space-y-2">
                            <div className="flex items-center justify-between text-sm">
                              <span className="text-gray-600 dark:text-gray-400">Progress</span>
                              <span className="font-medium text-gray-900 dark:text-white">{project.progress || 0}%</span>
                            </div>
                            <Progress value={project.progress || 0} className="h-2" />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* New Project Card */}
                <div className="bg-accent-gradient rounded-xl shadow-sm p-6 text-white">
                  <h3 className="text-lg font-semibold mb-2">Start a New Project</h3>
                  <p className="text-white/90 mb-4">Create and manage your team projects efficiently</p>
                  <Button onClick={() => setIsNewProjectDialogOpen(true)} variant="secondary" className="bg-white text-[rgb(var(--color-accent-primary))] hover:bg-gray-100 dark:bg-gray-800 dark:text-white dark:hover:bg-gray-700">
                    <FolderPlus className="w-4 h-4 mr-2" />
                    Get Started
                  </Button>
                </div>
              </div>

              {/* Right Column - Team Activity */}
              <div className="space-y-6">
                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">Team Activity</h2>

                  {recentActivity.length === 0 ? (
                    <p className="text-gray-500 dark:text-gray-400 text-center py-8">No recent activity</p>
                  ) : (
                    <div className="space-y-4">
                      {recentActivity.map((activity) => {
                        const timeAgo = activity.created_at
                          ? new Date(activity.created_at).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
                          : 'Recently';
                        
                        return (
                          <div key={activity.id} className="flex items-start gap-3">
                            <div className="relative">
                              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white text-sm font-medium">
                                {activity.type?.[0]?.toUpperCase() || 'N'}
                              </div>
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm">
                                <span className="font-medium text-gray-900 dark:text-white">{activity.title}</span>
                              </p>
                              {activity.description && (
                                <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">{activity.description}</p>
                              )}
                              <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">{timeAgo}</p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Quick Stats */}
                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Quick Stats</h2>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Total Tasks</span>
                      <span className="text-2xl font-bold text-[rgb(var(--color-accent-primary))] dark:text-[rgb(var(--color-accent-primary-dark))]">{stats.totalTasks}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Completed</span>
                      <span className="text-2xl font-bold text-green-600 dark:text-green-400">{stats.completedTasks}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600 dark:text-gray-400">In Progress</span>
                      <span className="text-2xl font-bold text-orange-600 dark:text-orange-400">{stats.totalTasks - stats.completedTasks}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Chat Popup */}
      <ChatPopup 
        user={user}
        isOpen={isChatPopupOpen}
        onClose={() => setIsChatPopupOpen(false)} 
      />

      {/* Connections Popup */}
      <ConnectionsPopup 
        user={user}
        isOpen={isConnectionsPopupOpen}
        onClose={() => setIsConnectionsPopupOpen(false)} 
      />

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
                onChange={(e) => setNewProjectTitle(e.target.value)}
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
                onChange={(e) => setNewProjectDueDate(e.target.value)}
                className="dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsNewProjectDialogOpen(false)}
              className="dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
            >
              Cancel
            </Button>
            <Button
              onClick={handleCreateProject}
              disabled={!newProjectTitle.trim()}
              className="btn-accent"
            >
              <FolderPlus className="w-4 h-4 mr-2" />
              Create Project
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
